import { DispatcherInterface } from './DispatcherInterface';
import { Manager } from './Manager';
import { AssemblyJob } from './types/AssemblyJob';

export class PushDispatcher implements DispatcherInterface {

    manager: Manager
    jobs: AssemblyJob[]=[]
    interval: number
    lasttime: number = 1

    constructor(manager: Manager, interval: number) {
        this.manager = manager
        this.interval= Number(interval)
    }

    handleJobCompletion(job: AssemblyJob, waitingJobs: AssemblyJob[]) {
        return null
    }

    handleNextTick(time: number) {
        if (time - this.lasttime > this.interval) {
            this.lasttime = time
            if(this.manager.waitingJobs.length === 0)
                return null
            return this.manager.waitingJobs[0]
        }
        return null
    }

}
