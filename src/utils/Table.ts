import EventBus from './EventBus'
import { Manager } from './Manager'
import {AssemblyJob, JobEventPayload, JobEventType} from "@/utils/types/AssemblyJob";
import { AssemblyStation } from './types/AssemblyStation';

export class Table {
    manager: Manager 
    jobs : AssemblyJob[] = [] 
    stations: AssemblyStation[]= []

    constructor(manager: Manager) {
        this.manager = manager
        
        EventBus.$on(JobEventType.DISPATCHED, ({job}: { job: AssemblyJob }) => {
          this.jobs.splice(this.jobs.length, 0, job)         
        })    
 
    }
}