import EventBus from "@/utils/EventBus";
import {AssemblyJob, JobEventType} from "@/utils/types/AssemblyJob";

interface AvgJob {
    jobIndex: number;
    jobId: string;
    avgTime: number;
}

export class Analytics {

    activeJobs: { time: number, count: number }[] = []
    avgJobTimes: AvgJob[] = []
    timeDistribution: { type: string, value: number }[] = []

    // subscribe events
    constructor() {
        this.init()
        // dispatched
        EventBus.$on(JobEventType.DISPATCHED, ({job}: { job: AssemblyJob }) => {
            this.trackActiveJob(job.manager.simulation.time, 1)
        })
        // completed
        EventBus.$on(JobEventType.COMPLETED, ({job}: { job: AssemblyJob }) => {
            this.trackActiveJob(job.manager.simulation.time, -1)
            this.calculateAvgTime(job)
            this.trackTimeDistribution(job)
        })
    }

    init() {
        this.timeDistribution = [
            {type: 'Waiting time', value: 0},
            {type: 'Transport time', value: 0},
            {type: 'Working time', value: 0}
        ]
        this.avgJobTimes = []
        this.activeJobs = []
    }

    trackTimeDistribution(job: AssemblyJob) {
        let totalWaiting = this.timeDistribution[0].value + job.waitingTime
        this.timeDistribution.splice(0, 1, {...this.timeDistribution[0], value: totalWaiting})

        let totalTransport = this.timeDistribution[1].value + job.transportTime
        this.timeDistribution.splice(1, 1, {...this.timeDistribution[1], value: totalTransport})

        let totalWorking = this.timeDistribution[2].value + job.workTime2
        this.timeDistribution.splice(2, 1, {...this.timeDistribution[2], value: totalWorking})
    }


    /**
     * Add new record to active jobs history
     * @param time
     * @param count
     */
    trackActiveJob(time: number, count = 1) {
        let lastCount = 0
        if (this.activeJobs.length > 0) {
            lastCount = this.activeJobs[this.activeJobs.length - 1].count
        }
        this.activeJobs = [
            ...this.activeJobs,
            {
                time: Number((time).toFixed(0)),
                count: Math.max(0, lastCount + count)
            }
        ]
    }

    /**
     * @param job
     */
    calculateAvgTime(job: AssemblyJob) {
        if (job.completedAt && job.dispatchedAt) {
            let average = job.completedAt - job.dispatchedAt
            average = Number((average).toFixed(2))
            this.avgJobTimes.splice(this.avgJobTimes.length, 0, {
                jobIndex: this.avgJobTimes.length,
                jobId: job.id,
                avgTime: average
            })
        }
    }
}
