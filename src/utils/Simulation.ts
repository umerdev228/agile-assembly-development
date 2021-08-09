import {Dictionary} from "@/utils/types/Dictionary"
import {InternalTimeUnit} from "@/utils/Manager"
import EventBus from "@/utils/EventBus"
import {defaultImagePath} from "@/config";

export interface Event {
    name: string
    payload: Dictionary
    sender: any
}

/**
 * Discrete Event
 */
export interface ScheduledEvent extends Event {
    availableAt: InternalTimeUnit
    revoked?: boolean
}

/**
 * Interface for all agent which dispatch discrete events
 */
export class HasDiscreteEvents {

    /**
     * List of all queued events
     */
    eventQueue: ScheduledEvent[]

    constructor() {
        this.eventQueue = []
    }

    /**
     * Add an event to the queue
     * @param event
     */
    scheduleEvent(event: ScheduledEvent): void {
        this.eventQueue.push(event)
    }

    /**
     * Get available events for a given time
     * @param time
     */
    getAvailableEvents(time: InternalTimeUnit): ScheduledEvent[] {
        return this.eventQueue.filter((event: ScheduledEvent) => {
            return !event.revoked && event.availableAt <= time
        })
    }

}

/**
 * Global discrete simulation handler
 */
export class Simulation extends HasDiscreteEvents {

    /**
     * Refresh interval in ms
     */
    private readonly refreshInterval: number

    isRunning: boolean = false

    /**
     * Perform simulation as fast as possible without waiting between events
     */
    dryRun: boolean = false

    /**
     * Global simulation time
     */
    time: InternalTimeUnit

    /**
     * Factor for the time increase in each interval
     */
    speed: number = 20

    /**
     * Image
     */
    jobImageUrl: string = defaultImagePath

    /**
     * Reference to running setInterval
     */
    private timer: number|null = null

    constructor() {
        super();
        this.refreshInterval = 10
        this.time = 0
    }

    /**
     * Start simulation
     */
    startSimulation = (): void => {
        if (window && !this.isRunning) {
            this.isRunning = true
            console.log('started simulation')
            // Warning, setInterval needs an arrow function to preserve the this context
            this.timer = window.setInterval(this.nextTick, this.refreshInterval)
        }
    }

    /**
     * Perform simulation in dry mode
     */
    performDryRun = async (): Promise<void> => {
        this.dryRun = true
        this.isRunning = true
        EventBus.$emit('startedDryRun')
        await EventBus.$nextTick()
        await this.nextTick()
        this.dryRun = false
        this.isRunning = false
    }

    /**
     * Stop simulation
     */
    stopSimulation = (): void => {
        if (this.isRunning) {
            this.isRunning = false
            this.dryRun = false
            if (this.timer) {
                window.clearInterval(this.timer)
            }
            this.timer = null
            console.log('stopped simulation')
        }
    }

    /**
     * Reset simulation
     */
    reset = (): void => {
        this.stopSimulation()
        this.eventQueue = []
        this.time = 0
    }

    /**
     * Emit event on EventBus
     * @param event
     */
    emitEvent = (event: Event): void => {
        // log event
        // tmp logging of job id
        let identifier = event.payload.jobOperation
            ? event.payload.jobOperation.job.id
            : event.payload.job
                ? event.payload.job.id
                : ''
        console.log(`Event ${event.name} at ${this.time.toFixed(0)}`, String(identifier).substr(0, 8))
        EventBus.$emit(event.name, event.payload)
    }

    /**
     * Process available events
     */
    processScheduledEvents = (): void => {
        let events = this.getAvailableEvents(this.time)
        // dispatch all events
        events.forEach(event => {
            this.emitEvent(event)
            this.eventQueue.splice(this.eventQueue.indexOf(event), 1)
        })
    }

    /**
     * Process next interval tick
     */
     nextTick = async (): Promise<void> => {
        if (this.dryRun) {
            // time travel to next available event
            if (this.eventQueue.length > 0) {
                // get nearest event time
                const nextEvent = [...this.eventQueue].sort((e1, e2) => {
                    return e1.availableAt - e2.availableAt
                })[0]
                this.time = nextEvent.availableAt
                EventBus.$emit("nextTick", this.time)
                this.processScheduledEvents()
                // wait for events being processed
                await EventBus.$nextTick()
                await this.nextTick()
            } else {
                // finish simulation
                console.log('Finished dry simulation at:', this.time)
                return
            }
        } else {
            // increment time
            this.time = this.time + this.speed * this.refreshInterval / 1000
            EventBus.$emit("nextTick", this.time)
            this.processScheduledEvents()
            await EventBus.$nextTick()
        }
    }
}

export const simulation = new Simulation()
