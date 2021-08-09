import {Coordinate, Dimension} from "@/utils/types/GeometryTypes"
import {AssemblyJobOperation, JobEventPayload, JobEventType} from "@/utils/types/AssemblyJob"
import {Operation} from "@/utils/Product"
import {v4 as uuid} from "uuid"
import {InternalTimeUnit, Manager} from "@/utils/Manager"

/**
 * Feature or module of a station
 * e.g. 'lifting platform'
 */
export class StationModule {
    id: string
    label: string

    constructor(label: string) {
        this.id = uuid()
        this.label = label
    }
}

/**
 * Station status type
 */
export enum StationStatus {
    VACANT = 'station:vacant',
    SETUP = 'station:set-up',
    PROCESSING = 'station:processing',
    FOLLOWUP = 'station:follow-up',
    DISABLED = 'station:disabled',
    DOWN = 'station:down'
}

/**
 * Station event type
 */
export enum StationEventType {
    JOB_REGISTERED = 'station:job_registered',
    JOB_QUEUED = 'station:job_queued',
    SET_UP_STARTED = 'station:set_up_started',
    SET_UP_COMPLETED = 'station:set_up_completed',
    PROCESSING_STARTED = 'station:processing_started',
    PROCESSING_COMPLETED = 'station:processing_completed',
    FOLLOW_UP_STARTED = 'station:follow_up_started',
    FOLLOW_UP_COMPLETED = 'station:follow_up_completed',
    STATION_DISABLED = 'station:disabled',   //eventname
    STATION_REACTIVATED = 'station:reactivated'
}

export type StationEventPayload = {
    station: AssemblyStation
    jobOperation: AssemblyJobOperation
}

export type AssemblyStationOperation = {
    operation: Operation
    station: AssemblyStation
}

/**
 * Possible position for a queued job
 */
export enum QueuePosition {
    IN_STATION = 'position:in_station',
    LEFT = 'position:left',
    RIGHT = 'position:right',
}

export type QueuedJobOperation = AssemblyJobOperation & { position: QueuePosition }

/**
 * Assembly station class
 */
export class AssemblyStation {
    disabled: boolean = false
    id: string
    position: Coordinate = {x: 0, y: 0}
    modules: StationModule[]
    status: StationStatus
    isOccupied: boolean = false
    width: number = 120
    height: number = 100
    queuedJobOperations: QueuedJobOperation[] = []
    movingJobOperations: AssemblyJobOperation[] = []
    activeJobOperation: AssemblyJobOperation | null = null
    manager!: Manager
    expectedFinishTime: InternalTimeUnit = -1
    activeActionDuration: InternalTimeUnit = -1
    setupTime: number = 0
    processTime: number = 0
    followupTime: number = 0
    pullingJobIn: boolean = false
    //buffer: number = 2

    constructor(
        modules: StationModule[],
        id: string,
        // buffer: number,
        position?: Coordinate,
        dimensions?: Dimension,
    ) {
        // this.id = uuid()
        this.id = id
        this.modules = modules
        // this.buffer = buffer
        this.status = StationStatus.VACANT
        if (position) this.position = position
        if (dimensions) {
            this.width = dimensions.width
            this.height = dimensions.height
        }
    }

    /**
     * Register new job moving to station
     * @param jobOperation
     */
    registerMovingJob = (jobOperation: AssemblyJobOperation) => {
        let index = this.movingJobOperations.findIndex(jo => {
            return jobOperation.job.id === jo.job.id && jobOperation.operation.id === jo.operation.id
        })
        if (index === -1) {
            this.movingJobOperations.splice(this.movingJobOperations.length, 0, jobOperation)
            this.manager.dispatchEvent(StationEventType.JOB_REGISTERED, {
                jobOperation: jobOperation,
                station: this
            })
        }
    }

    // reset all params to default
    reset = () => {
        this.status = StationStatus.VACANT
        this.isOccupied = false
        this.activeJobOperation = null
        this.pullingJobIn = false
        this.expectedFinishTime = -1
        this.activeActionDuration = -1
    }

    deregisterJob = (jobOperation: AssemblyJobOperation) => {
        let index = this.movingJobOperations.findIndex(jo => jo.job.id === jobOperation.job.id)
        if (index > -1) {
            this.movingJobOperations.splice(index, 1)
            return
        }
        let index2 = this.queuedJobOperations.findIndex(jo => jo.job.id === jobOperation.job.id)
        if (index2 > -1) {
            this.queuedJobOperations.splice(index2, 1)
            this.pullingJobIn = false
            return
        }
        if (this.activeJobOperation && jobOperation.job.id === this.activeJobOperation.job.id) {
            this.reset()
        }

    }

    /**
     * Add job to queue or process right away
     * @param jobOperation
     */
    handleJobArrival = async (jobOperation: AssemblyJobOperation): Promise<void> => {
        if (this.disabled) {
            jobOperation.job.prepareNextOperation().then()
            return
        }
        // check if job was registered
        let index = this.movingJobOperations.findIndex((jo: AssemblyJobOperation) => {
            return jo.operation === jobOperation.operation && jo.job === jobOperation.job
        })
        // move jobOperation from moving to queued
        if (index > -1) {
            //job is moving job operation
            this.movingJobOperations.splice(index, 1)
            let position = QueuePosition.LEFT
            if (jobOperation.job.position.x > this.position.x) {
                position = QueuePosition.RIGHT
            }
            this.queueJobOperation(jobOperation, position)
        } else {
            // job is already in station
            this.queueJobOperation(jobOperation, QueuePosition.IN_STATION)
        }
        // check status of station
        //if(&&!this.isOccupied)
        if (this.activeJobOperation === null && !this.pullingJobIn) {
            console.log('evaluate Queue')
            await this.evaluateQueue()
        }
    }

    /**
     * Add jobOperation to queue
     * @param jobOperation
     * @param position
     */
    queueJobOperation = (jobOperation: AssemblyJobOperation, position: QueuePosition): void => {
        let index = this.queuedJobOperations.findIndex(qop => (qop.job.id === jobOperation.job.id && qop.operation.id === jobOperation.operation.id))
        if(index === -1) {
            this.queuedJobOperations.splice(this.queuedJobOperations.length, 0, {...jobOperation, position})
            this.manager.dispatchEvent(StationEventType.JOB_QUEUED, {
            jobOperation: jobOperation,
            station: this
            })
        }
    }

    /**
     * Get best queued job operation
     */
    getBestJobOperation = (): AssemblyJobOperation | null => {
        if (this.queuedJobOperations.length > 0) {
            let scores: number[] = []
            this.queuedJobOperations.forEach((jobOperation: AssemblyJobOperation) => {
                let job = jobOperation.job
                let score = job.getScoreForJobOperation(jobOperation)
                scores.push(score)
            })
            // select best station
            let maxScore = Math.max(...scores)
            let index = scores.indexOf(maxScore)
            return this.queuedJobOperations[index]
        } else {
            return null
        }
    }

    /**
     * Check available jobs and calculate scores
     */
    evaluateQueue = async (): Promise<void> => {
        let jobOperation = this.getBestJobOperation()
        if (jobOperation !== null) {
            this.pullingJobIn = true
            // check if any job is still in station
            let jobOperationInStation = this.queuedJobOperations.find(jo => {
                return jo.position === QueuePosition.IN_STATION && jobOperation!.job.id !== jo.job.id
            })
            if (jobOperationInStation) {
                // this.queuedJobOperations
                // console.warn('job in station detected', jobOperationInStation)
                // remove job from queue to be re-handled after arrival event
                this.queuedJobOperations.splice(this.queuedJobOperations.indexOf(jobOperationInStation), 1)
                jobOperationInStation.position = QueuePosition.LEFT
                let eta = await jobOperationInStation.job.moveTo(this.queuePosition)
                jobOperationInStation.job.manager.dispatchEvent(JobEventType.ARRIVED, {
                    station: this,
                    jobOperation: {job: jobOperationInStation.job, operation: jobOperationInStation.operation}
                } as JobEventPayload, eta)
            }
            await this.selectJobOperation(jobOperation)
            this.pullingJobIn = false
        }
    }

    /**
     * Select job operation
     * and pull job from queue into station
     */
    selectJobOperation = async (jobOperation: AssemblyJobOperation): Promise<void> => {
        if (this.activeJobOperation !== null) {
            return
        }
        // pull job in station
        const eta = await jobOperation.job.moveTo(this.origin)
        // update activeJobOperation
        let index = this.queuedJobOperations.findIndex((jo) => jo.job.id === jobOperation.job.id)
        this.queuedJobOperations.splice(index, 1)
        this.activeJobOperation = jobOperation
        this.manager.dispatchEvent(JobEventType.IN_STATION, {jobOperation, station: this} as JobEventPayload, eta)
    }

    /**
     * Start setting up station
     * @param operation
     */
    startSetup = (operation: Operation) => {
        let payload: StationEventPayload = {
            station: this,
            jobOperation: this.activeJobOperation!
        }
        this.manager.dispatchEvent(StationEventType.SET_UP_STARTED, payload)
        this.expectedFinishTime = this.manager.simulation.time + operation.setUpTime
        this.activeActionDuration = operation.setUpTime
        this.status = StationStatus.SETUP
        this.isOccupied = true
        this.manager.simulation.scheduleEvent({
            name: StationEventType.SET_UP_COMPLETED,
            payload: payload,
            availableAt: this.expectedFinishTime,
            sender: this
        })
    }

    /**
     * Complete setup, notify and pull job from queue
     */
    completeSetUp = (): void => {
        this.setupTime += this.activeJobOperation ? this.activeJobOperation.operation.setUpTime : 0
        this.startProcessing()
    }

    disable = (): void => {
        this.disabled = !this.disabled
        if (!this.disabled) {
            this.status = StationStatus.VACANT
            this.manager.dispatchEvent(StationEventType.STATION_REACTIVATED, {
                station: this
            })
        } else {
            // if station disabled, stop current operation
            this.reset()
            this.queuedJobOperations = []
            this.movingJobOperations = []
            this.status = StationStatus.DISABLED
            this.manager.dispatchEvent(StationEventType.STATION_DISABLED, {
                station: this
            })
        }
    }

    /**
     * Start processing active job operation
     */
    startProcessing = (): void => {
        if (this.activeJobOperation) {
            this.status = StationStatus.PROCESSING
            let payload: StationEventPayload = {
                station: this,
                jobOperation: this.activeJobOperation!
            }
            this.manager.dispatchEvent(StationEventType.PROCESSING_STARTED, payload)
            this.activeActionDuration = this.activeJobOperation.operation.processingTime
            this.expectedFinishTime = this.manager.simulation.time + this.activeActionDuration
            this.manager.simulation.scheduleEvent({
                name: StationEventType.PROCESSING_COMPLETED,
                payload: payload,
                availableAt: this.expectedFinishTime,
                sender: this
            })
        }
    }

    /**
     * Complete setup, notify and pull job from queue
     */
    completeProcessing = (): void => {
        this.processTime += this.activeJobOperation ? this.activeJobOperation.operation.processingTime : 0
        this.startFollowUp()
    }

    /**
     * Start Followup
     */
    startFollowUp = () => {
        if (this.activeJobOperation) {
            let payload: StationEventPayload = {
                station: this,
                jobOperation: this.activeJobOperation!
            }
            this.manager.dispatchEvent(StationEventType.FOLLOW_UP_STARTED, payload)
            this.status = StationStatus.FOLLOWUP
            this.activeActionDuration = this.activeJobOperation.operation.followUpTime
            this.expectedFinishTime = this.manager.simulation.time + this.activeActionDuration
            this.manager.simulation.scheduleEvent({
                name: StationEventType.FOLLOW_UP_COMPLETED,
                payload: payload,
                availableAt: this.expectedFinishTime,
                sender: this
            })
        }
    }

    /**
     * Complete setup, notify and pull job from queue
     */
    completeFollowUp = async (): Promise<void> => {
        this.followupTime += this.activeJobOperation ? this.activeJobOperation.operation.followUpTime : 0

        this.reset()
        await this.evaluateQueue()
    }

    /**
     * Get computed origin
     */
    get origin(): Coordinate {
        return {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height / 2
        }
    }

    /**
     * Get computed position for waiting in queue
     */
    get queuePosition(): Coordinate {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y + this.height / 2
        }
    }

    /**
     * Calculate active progress
     */
    get activeActionProgress(): number {
        if (this.activeActionDuration > -1 && this.expectedFinishTime > -1) {
            let startTime = this.expectedFinishTime - this.activeActionDuration
            let percentage = (this.manager.simulation.time - startTime) / this.activeActionDuration
            return Math.round(percentage * 100)
        } else {
            return 0
        }
    }

    /**
     * Calculate maximum finish time for an operation
     * this does NOT consider transportation times
     * @param operation
     * @param job
     */
    getMaxCompletionTimeFor = (operation: Operation): number => {                                       
        let remainingTime = Math.max(0, this.expectedFinishTime - this.manager.simulation.time)
        let queuedOperationsDuration = this.queuedJobOperations.reduce((sum: number, jobOperation): number => {         
            let operation = jobOperation.operation
            return sum += operation.setUpTime + operation.processingTime + operation.followUpTime
        }, 0)
        let movingOperationsDuration = this.movingJobOperations.reduce((sum: number, jobOperation): number => {
            let operation = jobOperation.operation
            return sum += operation.setUpTime + operation.processingTime + operation.followUpTime
        }, 0)
        let processingTime = operation.processingTime
        return remainingTime + queuedOperationsDuration + movingOperationsDuration + processingTime
    }

}
