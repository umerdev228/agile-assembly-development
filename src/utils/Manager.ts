import {Dictionary} from "@/utils/types/Dictionary"
import {
    AssemblyStation,
    AssemblyStationOperation,
    StationEventPayload,
    StationEventType,
    StationModule,
} from "@/utils/types/AssemblyStation"
import {AssemblyJob, JobEventPayload, JobEventType, JobStatus} from "@/utils/types/AssemblyJob"
import EventBus from "@/utils/EventBus"
import {Simulation} from "@/utils/Simulation"
import {Operation, Product} from "@/utils/Product"
import {Router} from "@/utils/Router"
import {source} from "@/config"
import {DispatcherInterface} from './DispatcherInterface'
import {PushDispatcher} from "@/utils/PushDispatcher";
import {DataReader} from "@/utils/Reader";
import store from './../store'; 

export type InternalTimeUnit = number

interface ManagerInterface {

    simulation: Simulation

    /**
     * List of all available assembly stations
     */
    assemblyStations: AssemblyStation[]

    /**
     * List of all active assembly jobs
     */
    activeJobs: AssemblyJob[]

    /**
     * List of completed assembly jobs
     */
    completedJobs: AssemblyJob[]

    /**
     * List of jobs waiting to be dispatched
     */
    waitingJobs: AssemblyJob[]

    /**
     * Init manager from json data
     * @param jsonData
     */
    initFromJson(jsonData: Dictionary): void

    /**
     * Dispatch new job
     * return false if job is not feasible
     * @param job
     */
    dispatchJob(job: AssemblyJob): boolean

    /**
     * Add job to waiting job pool
     * @param job
     */
    addJob(job: AssemblyJob): void

    /**
     * Dispatch an event on the event bus
     * @param name
     * @param payload
     */
    dispatchEvent(name: string, payload: Dictionary): void      

    /**
     * Get available combinations
     * of assembly stations and operations
     * @param job
     */
    getAvailableAssemblyStationOperations(job: AssemblyJob): AssemblyStationOperation[]

    /**
     * Register a new assembly station
     * @param station
     */
    registerAssemblyStation(station: AssemblyStation): void

    /**
     * Get list of assembly station which are capable
     * for the given operation
     * @param operation
     */
    getCapableAssemblyStations(operation: Operation): AssemblyStation[]

}

export class Manager implements ManagerInterface {
    activeJobs: AssemblyJob[] = []
    assemblyStations: AssemblyStation[] = []
    completedJobs: AssemblyJob[] = []
    waitingJobs: AssemblyJob[] = []
    simulation: Simulation
    router: Router
    autodispatched: boolean = false
    dispatcher: DispatcherInterface | null = null
    operations: Operation[] = []
    products: Product[] = []
    modules: StationModule[] = []
    requiredModules: StationModule[] = []
    editableModules: StationModule[] = []
    default: boolean = true
    changedProducts: boolean = false
     
    constructor(simulation: Simulation, router: Router) {
        this.simulation = simulation
        this.router = router
        this.startEventListeners()
    }

    /**
     * Initialize all event listeners
     */
    startEventListeners = () => {
        // listen to new parsed data
        EventBus.$on('data-parsed', (reader: DataReader) => {
            this.default = false
            this.operations = []
           this.products = []
           this.reset(false)
            // register stations
            reader.stations.forEach(this.registerAssemblyStation)
            reader.stations.forEach(s => {
                store.commit("addStation",s)
            })
            reader.modules.forEach(m => {
                store.commit("addModule",m)
            })
            reader.operations.forEach(o => {
            this.registerOperation(o)
            store.commit("addOperation",o)
            })
            // create and add all jobs
            reader.products.forEach(p => {
                if (reader.jobs.length === 0) {
              store.commit("addProduct",p)
                    for (let i = 0; i < p.quantity; i++) {
                        let job = new AssemblyJob(null, p, source)
                        this.addJob(job)
                        store.commit("addJob",job)
                    }
                }
            }) 
        })
        EventBus.$on(JobEventType.COMPLETED, ({job}: { job: AssemblyJob }) => {
            if (this.dispatcher !== null) {
                let newJob = this.dispatcher.handleJobCompletion(job, this.waitingJobs)
                if (newJob != null) {
                    this.dispatchJob(newJob)
                }
            }
            // stop simulation if all jobs completed
            if (this.activeJobs.length === 0) {
                this.simulation.stopSimulation()
            }
        })
        EventBus.$on('nextTick', (time: number) => {
            if (this.dispatcher !== null && !this.simulation.dryRun) {
                let job = this.dispatcher.handleNextTick(time)
                if (job != null) {
                    this.dispatchJob(job)
                }
            }
        })
        EventBus.$on('startedDryRun', () => {
            // handle dry run case without continuous time
            // schedule all events in advance
            if (this.dispatcher instanceof PushDispatcher) {
                let time = this.simulation.time
                let jobs = [...this.waitingJobs]
                for (let j of jobs) {
                    this.dispatchJob(j, time)
                    time += this.dispatcher.interval
                }
            }
        })
        // job dispatched
        EventBus.$on(JobEventType.DISPATCHED, ({job}: { job: AssemblyJob }) => {
            job.dispatch()
        })
        // listen to queued event
        EventBus.$on(StationEventType.JOB_QUEUED, (payload: JobEventPayload) => {
            payload.jobOperation.job.setQueued()
        })
        // listen to operation completed
        EventBus.$on(StationEventType.PROCESSING_STARTED, (payload: StationEventPayload) => {
            payload.jobOperation.job.setProcessing()
        })
        // listen to operation completed
        EventBus.$on(StationEventType.PROCESSING_COMPLETED, (payload: StationEventPayload) => {
            payload.jobOperation.job.completeOperation(payload.jobOperation.operation)
        })
        // listen to disabled station, causes operation to be interrupted
        EventBus.$on(StationEventType.STATION_DISABLED, (payload: { station: AssemblyStation }) => {
            this.activeJobs.forEach((job) => {
                if (!job.plannedJobOperation) return
                if (job.plannedJobOperation.station.id === payload.station.id) {
                    job.abort()
                }
            })
        })
        // listen when a station is free again
        EventBus.$on(StationEventType.STATION_REACTIVATED, (payload: { station: AssemblyStation }) => {
            Object.entries(this.activeJobs).forEach(([index, job]) => {
                if (!job.plannedJobOperation) {
                    job.prepareNextOperation().then()
                    return
                }
                if (job.plannedJobOperation!.station.id !== payload.station.id) {
                    if (job.status === JobStatus.QUEUED) {
                        this.dispatchEvent(JobEventType.ABORT, {
                            station: job.plannedJobOperation!.station,
                            jobOperation: {
                                job: job,
                                operation: job.plannedJobOperation!.operation
                            }
                        })
                        job.prepareNextOperation().then()
                    }
                }
            })
        })
        // job moving to station
        EventBus.$on(JobEventType.STARTED_MOVING, (payload: JobEventPayload) => {
            if (payload.station) {
                payload.station.registerMovingJob(payload.jobOperation)
            }
        })
        EventBus.$on(JobEventType.ABORT, (payload: JobEventPayload) => {
            payload.station.deregisterJob(payload.jobOperation)
        })
        // job arrived at station
        EventBus.$on(JobEventType.ARRIVED, (payload: JobEventPayload) => {
            payload.station.handleJobArrival(payload.jobOperation).then()
        })
        // job arrived in station
        EventBus.$on(JobEventType.IN_STATION, (payload: JobEventPayload) => {
            payload.station.startSetup(payload.jobOperation.operation)
        })
        // set up completed
        EventBus.$on(StationEventType.SET_UP_COMPLETED, (payload: StationEventPayload) => {
            payload.station.completeSetUp()
        })
        // processing completed
        EventBus.$on(StationEventType.PROCESSING_COMPLETED, (payload: StationEventPayload) => {
            payload.station.completeProcessing()
        })
        // follow up completed
        EventBus.$on(StationEventType.FOLLOW_UP_COMPLETED, (payload: StationEventPayload) => {
            payload.station.completeFollowUp().then()
        })
    }

    /**
     * Reset the entire simulation or just the jobs
     */
    reset(jobs: boolean) {
        if(jobs === true) {
            this.activeJobs = []
            this.completedJobs = []
            this.waitingJobs = []
            this.simulation.reset()
        // idea: reset Vuex stations to 0, add current stations to Vuex, reset stations from manager to 0, take them from vuex
            store.commit("resetStations")
            for(let station of this.assemblyStations) 
                store.commit("addStation",station)
            this.assemblyStations = []
            store.state.stations.forEach(s=> {
                let stationModules = []
                for(let mod of s.modules) {
                    let index = this.modules.findIndex(m => m.label === mod)
                    if(index!=-1) stationModules.push(this.modules[index])
                }
                let station = new AssemblyStation(stationModules, s.name, {x: s.x, y: s.y})
                this.registerAssemblyStation(station)
            })
            this.resetJobs()
        } else {
            this.activeJobs = []
            this.products = []
            this.modules = []
            this.operations = []
            this.assemblyStations = []
            this.completedJobs = []
            this.waitingJobs = []
            this.simulation.reset()
        }
    }

    /**
     * Recreate jobs corresponding to the given products
     */
    resetJobs() {
        for(let prod of this.products) {
            for (let i = 0; i < prod.quantity; i++) {
                    let job = new AssemblyJob(null, prod, source)
                    this.addJob(job)
            }
        }
    }

    /**
     * Reset all information, uploaded data is from excel
     */
    resetDoc() {
        // recreate the modules from the uploaded excel file
        store.state.modules.forEach(m => {
            let module = new StationModule(m)
            this.registerModule(module)
        })
        // recreate the stations from the uploaded excel file
        store.state.stations.forEach(s=> {
            let stationModules = []
            for(let mod of s.modules) {
                let index = this.modules.findIndex(m => m.label === mod)
                if(index!=-1) 
                    stationModules.push(this.modules[index])
            }
            let station = new AssemblyStation(stationModules, s.name, {x: s.x, y: s.y})
            this.registerAssemblyStation(station)
        })
        // recreate operations
        store.state.operations.forEach(o =>{
            let requiredModules = []
                for(let mod of o.modules) {
                    let index = this.modules.findIndex(m => m.label === mod)
                    if(index!=-1) requiredModules.push(this.modules[index])
                }
            let operation = new Operation(o.name, o.process, o.setup, o.followup, requiredModules)
            this.registerOperation(operation)
        }
        )
        // add required operations for the recreated operations
        store.state.operations.forEach(o =>{
            let index = this.operations.findIndex(op => op.name === o.name)
            let pred = []
            for(let operation of o.predecessors) {
                let index2 = this.operations.findIndex(o => o.name === operation)
                if(index2!=-1) pred.push(this.operations[index2])
            }
            for(let p of pred) {
                this.operations[index].requireOperation(p)
            }
        })
        // recreate the products from the uploaded excel file
        store.state.products.forEach(p =>{
        let requiredOperations = []
        for(let op of p.operations) {
            let index = this.operations.findIndex(o => o.name === op)
            if(index!=-1) requiredOperations.push(this.operations[index])
        }
        let product = new Product(p.name, requiredOperations, p.quantity) 
        this.registerProduct(product)
        })
        this.resetJobs()
    }
    
    /**
     * Start a job in the simulation environment
     */
    dispatchJob(job: AssemblyJob, availableAt?: number): boolean {
        // dispatch event
        this.dispatchEvent(JobEventType.DISPATCHED, {job}, availableAt)
        this.activeJobs.splice(this.activeJobs.length, 0, job)
        this.waitingJobs.splice(this.waitingJobs.indexOf(job), 1)
        return false;
    }

    initFromJson(jsonData: Dictionary): void {
        // TODO set job arrays
        // TODO set machines
    }

    dispatchEvent(name: string, payload: Dictionary, availableAt?: number): void {
        this.simulation.scheduleEvent({
            name: name,
            payload: payload,
            sender: this,
            availableAt: availableAt !== undefined ? availableAt : this.simulation.time
        })
    }

    addJob(job: AssemblyJob): void {
        job.manager = this
        this.waitingJobs.splice(this.waitingJobs.length, 0, job)
       
        // add new products and operations for every job
        let index = this.products.findIndex(p => p.id === job.product.id)
        if (index === -1) {
            this.products = [...this.products, job.product]
        }
        // check if operation already exists in the operations array
        for (let op of job.product.operations) { 
            let index1 = this.operations.findIndex(o => o.id === op.id)
            if (index1 === -1)
                this.operations = [...this.operations, op]
        }
    }

    getAvailableAssemblyStationOperations(job: AssemblyJob): AssemblyStationOperation[] {
        throw new Error("Method not implemented.");
    }

    getRequiredModules() {
        this.requiredModules = []
        for(let station of this.assemblyStations)
            for(let mod of station.modules) {
                let index = this.requiredModules.findIndex(m => m.label === mod.label)
                if(index === -1)
                this.requiredModules = [...this.requiredModules, mod]
            }
    }

    registerModule = (module: StationModule) => {
        let index = this.modules.findIndex(m => m.label === module.label)
            if(index === -1 || module.label === 'New module')
                this.modules = [...this.modules, module]
        this.requiredModules = [...this.requiredModules, module]
    }

    registerAssemblyStation = (station: AssemblyStation) => {
        station.manager = this
        let index = this.assemblyStations.findIndex(s => s.id === station.id)
        // a newly added station must have a different name from the existing stations (exception: "New station")
        if(index === -1 || station.id === 'New station')
            this.assemblyStations.splice(this.assemblyStations.length, 0, station)

        // add required modules for every station
        for(let mod of station.modules) {
            let index = this.modules.findIndex(m => m.label === mod.label)
            if(index === -1)
                this.modules = [...this.modules, mod]
        }
    }

    registerOperation = (operation: Operation) => {
        let index = this.operations.findIndex(op => op.name === operation.name)
            if(index === -1 || operation.name === 'New operation')
                this.operations = [...this.operations, operation]
    }

    registerProduct =  (product: Product) => {
        let index = this.products.findIndex(p => p.name === product.name)
            if(index === -1 || product.name === 'New product')
                this.products = [...this.products, product]
    }  

    getCapableAssemblyStations(operation: Operation): AssemblyStation[] {
        return this.assemblyStations.filter(station => {
            for (let module of operation.requiredModules) {
                if (!station.modules.includes(module)) {
                    return false
                }
            }
        return true
        // TODO: eliminate stations which already have queue size equal to buffer 
        //if(station.buffer <= station.queuedJobOperations.length+station.movingJobOperations.length) {
        //     return false
        //}   
            
        })
    }

}
