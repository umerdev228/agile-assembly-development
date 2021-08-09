import {DispatcherInterface} from './DispatcherInterface';
import {Manager} from './Manager';
import {AssemblyJob} from './types/AssemblyJob';

export class PullDispatcher implements DispatcherInterface {

    manager: Manager
    factor: number

    constructor(manager: Manager, factor: number) {
        this.manager = manager
        this.factor = factor
        let numberJobs = this.manager.assemblyStations.length * factor - this.manager.activeJobs.length
        numberJobs = Math.max(0, numberJobs)
        this.manager.waitingJobs.slice(0, numberJobs).forEach((j) => {
            this.manager.dispatchJob(j)
        })
    }

    handleJobCompletion(job: AssemblyJob, waitingJobs: AssemblyJob[]) {
        if (waitingJobs.length > 0) {
            return waitingJobs[0]
        } else {
            return null
        }
    }

    handleNextTick(time: number) {
        return null
    }
}
