import {InternalTimeUnit, Manager} from "@/utils/Manager"
import {
    AssemblyStation,
    AssemblyStationOperation,
    QueuePosition
} from "@/utils/types/AssemblyStation"
import {Operation, Product} from "@/utils/Product"
import {v4 as uuid} from "uuid"
import {Stage} from "konva/types/Stage"
import {Coordinate} from "@/utils/types/GeometryTypes"
import Konva from "konva"
import {IFrame} from "konva/types/types"
import {getAngleBetweenPoints} from "@/utils/MathHelpers"
import {chassisWidth, sink} from "@/config"

export enum JobEventType {
    DISPATCHED = 'job:dispatched',
    STARTED_MOVING = 'job:started_movement',
    STOPPED_MOVING = 'job:stopped_movement',
    PROCESSING_STARTED = 'job:started_processing',
    ABORT = 'job:abort',
    ARRIVED = 'job:arrived_at_station',
    COMPLETED = 'job:completed',
    IN_STATION = 'job:in_station'
}

export type JobEventPayload = {
    jobOperation: AssemblyJobOperation
    station: AssemblyStation
}

export enum JobStatus {
    WAITING = 'waiting',
    QUEUED = 'queued',
    MOVING = 'moving',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
}

/**
 * Key job metrics
 */
export type JobMetrics = {
    dispatchedAt: InternalTimeUnit | null
    completedAt: InternalTimeUnit | null
    transportTime: number
    workingTime: number
    workTime2: number
    waitingTime: number
    lastTime: number
    lastEvent: string | null
}

/**
 * Combination of an assembly job and an operation
 */
export type AssemblyJobOperation = {
    operation: Operation
    job: AssemblyJob
}

export class HasKonvaStage {
    konvaStage: Stage | null = null

    /**
     * Register konva stage
     * @param stage
     */
    registerKonvaStage(stage: Stage) {
        this.konvaStage = stage
    }
}

interface Position extends Coordinate {
    angle: number
    flippedX?: boolean
    flippedY?: boolean
}

/**
 * Assembly order
 */
export class AssemblyJob extends HasKonvaStage {
    id: string
    product: Product
    status: JobStatus
    metrics: JobMetrics
    manager!: Manager
    completedOperations: Operation[] = []
    plannedJobOperation: AssemblyStationOperation | null = null
    position: Position
    dueDate: number = 1
    anim: Konva.Animation | null = null
    dispatchedAt: number | null = null
    completedAt: number | null = null
    transportTime: number = 0
    lastTime: number = 0
    workingTime: number = 0
    workTime2: number = 0
    lastEvent: string | null = null
    waitingTime: number = 0
    infeasible: boolean = false
    //new variable for ScoreBasedPullDispatcher
    isRushJob: boolean = false


    constructor(
        id: string | null,
        product: Product,
        position: Partial<Position> = {},
        dueDate: number = 1,
        isRushJob: boolean = false
    ) {
        super()
        if (id === null) {
            id = uuid()
        }
        this.id = id
        this.product = product
        this.status = JobStatus.WAITING
        this.dueDate = dueDate
        this.isRushJob = isRushJob
        this.metrics = {
            dispatchedAt: null,
            completedAt: null,
            transportTime: 0,
            workingTime: 0,
            workTime2: 0,
            waitingTime: 0,
            lastTime: 0,
            lastEvent: null
        }
        this.position = {
            x: 0,
            y: 0,
            angle: 0,
            ...position
        }
    }

    /**
     * Get uncompleted operations
     */
    get uncompletedOperations(): Operation[] {
        return this.product.operations.filter(o => !this.completedOperations.includes(o))
    }

    /**
     * Get next possible operations
     * under consideration of precedence constraints
     */
    get nextOperations(): Operation[] {
        let nextOperations: Operation[] = []
        this.uncompletedOperations.forEach(o => {
            let operationIsPossible = true
            o.predecessors.filter(o => this.product.operations.includes(o)).forEach(p => {
                if (!this.completedOperations.includes(p)) {
                    operationIsPossible = false
                }
            })
            if (operationIsPossible) {
                nextOperations.push(o)
            }
        })
        return nextOperations
    }

    /**
     * Dispatch job
     */
    dispatch = () => {
        this.dispatchedAt = this.manager.simulation.time
        this.prepareNextOperation().then()
    }

    /**
     * Set job status to queued
     */
    setQueued = () => {
        this.status = JobStatus.QUEUED
    }

    /**
     * Set job status to queued
     */
    setProcessing = () => {
        if (this.lastEvent === "processing")
            this.workingTime += (this.manager.simulation.time - this.lastTime)
        if (this.lastEvent === "arrived") {
            this.waitingTime += (this.manager.simulation.time - this.lastTime)

        }
        this.lastEvent = "processing"
        this.lastTime = this.manager.simulation.time
        this.manager.dispatchEvent(JobEventType.PROCESSING_STARTED, {job: this})
        this.status = JobStatus.PROCESSING
    }

    /**
     * Complete an operation
     * @param operation
     */
    completeOperation = (operation: Operation) => {
        this.workTime2 += (operation.followUpTime + operation.setUpTime + operation.processingTime)
        this.completedOperations.splice(this.completedOperations.length, 0, operation)
        this.prepareNextOperation().then()
    }

    abort = () => {
        if (!this.plannedJobOperation) {
            return
        }
        if (this.anim) {
            this.anim.stop()
        }
        let payload: JobEventPayload = {
            jobOperation: {
                job: this,
                operation: this.plannedJobOperation!.operation
            },
            station: this.plannedJobOperation!.station
        }
        this.manager.dispatchEvent(JobEventType.ABORT, payload)
        this.plannedJobOperation = null
        this.prepareNextOperation().then()
    }
    /**
     * Evaluate stations for next possible operations
     */
    findNextStation = () => {
        // get capable stations from manager
        let jobOperations: AssemblyStationOperation[] = []
        this.nextOperations.forEach(operation => {
            let stations = this.manager.getCapableAssemblyStations(operation)
            stations = stations.filter(station => !station.disabled)
         //   stations = stations.filter(station => (station.buffer >= (station.movingJobOperations.length+station.movingJobOperations.length)))
            stations.forEach(station => {
                jobOperations.push({station, operation})
            })
        })
        // calculate score for each station
        let scores: number[] = []
        jobOperations.forEach(({station, operation}) => {
            let maxStationTime = station.getMaxCompletionTimeFor(operation)
            let path = this.manager.router.getKonvaPath(this.position, station.origin)
            let transportationTime = this.manager.router.getTransportationDuration(path)
            let score = 1 / (maxStationTime + transportationTime)
            scores.push(score)
        })
        // select best station
        let maxScore = Math.max(...scores)
        this.plannedJobOperation = jobOperations[scores.indexOf(maxScore)]
    }

    /**
     * Calculate score for station and due date
     * @param jobOperation
     */
    getScoreForJobOperation = (jobOperation: AssemblyJobOperation): number => {
        return (1 / this.dueDate) // TODO refine score calculation
    }

    /**
     * Find next operations and move to best station
     */
    async prepareNextOperation() {
        let lastJobOperation = this.plannedJobOperation
        this.findNextStation()
        if (this.plannedJobOperation) {
            this.plannedJobOperation.station.registerMovingJob({
                operation: this.plannedJobOperation.operation,
                job: this
            })
            // emit start movement event
            let payload: JobEventPayload = {
                jobOperation: {
                    job: this,
                    operation: this.plannedJobOperation!.operation
                },
                station: this.plannedJobOperation!.station
            }
            let targetStation = this.plannedJobOperation!.station
            let stationOrigin = targetStation.origin
            // special case: check if already in same station
            if (lastJobOperation && lastJobOperation.station.id === this.plannedJobOperation.station.id) {
                // request another operation without leaving the station
                // console.warn('jobs stays in station', targetStation.id.substr(0, 8))
                targetStation.queueJobOperation(payload.jobOperation, QueuePosition.IN_STATION)
                return
            }
            // check if we are waiting on left or right side of station
            let horizontalQueueOffset = Math.round(chassisWidth * 1.3)
            // calculate waiting position
            let queuePosition = {
                y: stationOrigin.y,
                x: stationOrigin.x + horizontalQueueOffset * (this.position.x > stationOrigin.x ? 1 : -1)
            }
            // check if already in queue position
            let eta = this.manager.simulation.time
            if (queuePosition.x !== this.position.x || queuePosition.y !== this.position.y) {
                if (this.lastEvent === "processing")
                    this.workingTime += (this.manager.simulation.time - this.lastTime)
                this.lastTime = this.manager.simulation.time
                this.manager.dispatchEvent(JobEventType.STARTED_MOVING, payload)
                this.status = JobStatus.MOVING

                eta = await this.moveTo(queuePosition)
                // notify that job arrived at station
                this.manager.dispatchEvent(JobEventType.STOPPED_MOVING, payload, eta)
            }
            this.transportTime += (eta - this.lastTime)
            this.lastTime = eta
            this.lastEvent = "arrived"
            this.manager.dispatchEvent(JobEventType.ARRIVED, payload, eta)
        } else if (this.uncompletedOperations.length > 0) {
            // job infeasible
            this.plannedJobOperation = null
            this.infeasible = true
        } else {
            this.plannedJobOperation = null
            if (this.lastEvent == "processing")
                this.workingTime += (this.manager.simulation.time - this.lastTime)
            this.lastTime = this.manager.simulation.time
            this.manager.dispatchEvent(JobEventType.STARTED_MOVING, {
                jobOperation: {operation: null, job: this},
                station: null
            })
            const eta = await this.moveTo(sink)
            this.status = JobStatus.COMPLETED
            this.transportTime += (eta - this.lastTime)
            this.manager.dispatchEvent(JobEventType.COMPLETED, {job: this}, eta)
            this.manager.completedJobs.push(this)
            this.completedAt = eta
            let index = this.manager.activeJobs.findIndex(jo => jo.id === this.id)
            this.manager.activeJobs.splice(index, 1)
            for(let station of this.manager.assemblyStations) {
                let index1 = station.queuedJobOperations.findIndex(qop => qop.job.id === this.id) 
                if(index1 != -1) {
                    station.queuedJobOperations.splice(index1, 1)
                }
            }
        }
    }

    /**
     * Move to station
     * and register on its queue
     * resolve time of arrival
     */
    moveTo = (coordinate: Coordinate): Promise<number> => {
        // calculate route
        let router = this.manager.router
        let path = router.getKonvaPath(this.position, coordinate)

        const initial = {...this.position}

        let pathLength = path.getLength() // in px
        let estimatedTravelDuration = router.getTransportationDuration(path)
        let ref = this
        let startTime = this.manager.simulation.time
        let eta = startTime + estimatedTravelDuration

        // make method sync in dry mode and skip visualization of movement
        if (this.manager.simulation.dryRun) {
            // update position
            this.position = {
                ...coordinate,
                angle: 90,
            }
            // return eta for event scheduling
            return Promise.resolve(eta)
        }

        // handle async animation of movement
        return new Promise((resolve, reject) => {
            if (ref.anim) {
                ref.anim.stop()
            }
            ref.anim = new Konva.Animation(function (frame?: IFrame): boolean | void {
                if (!frame || !ref.manager.simulation.isRunning) return

                // interpolate eta and current simulation time
                let progress = (ref.manager.simulation.time - startTime) / estimatedTravelDuration

                if (progress >= 1) {
                    if (!ref.anim) return
                    // set exact final position
                    ref.position = {
                        ...coordinate,
                        angle: 90,
                        flippedX: (coordinate.x < initial.x || ref.position.flippedX),
                        flippedY: false,
                    }
                    ref.anim.stop()
                    ref.anim = null
                    resolve(ref.manager.simulation.time)
                    return
                }
                let traveledLength = progress * pathLength
                let pt = progress >= 1 ? coordinate : path.getPointAtLength(traveledLength);
                if (!pt) {
                    return
                }
                let angle: number

                // keep angle with same position
                if (pt.x === ref.position.x && pt.y === ref.position.y) {
                    angle = ref.position.angle
                } else {
                    angle = getAngleBetweenPoints(ref.position, pt)
                }

                ref.position = {
                    x: pt.x,
                    y: pt.y,
                    angle: angle,
                    flippedX: pt.x < ref.position.x, // flip when moving to left
                    flippedY: false,
                }

            }, this.konvaStage);

            if (this.manager.simulation.isRunning) {
                ref.anim.start()
            }
        })
        // TODO track path history
    }
}
