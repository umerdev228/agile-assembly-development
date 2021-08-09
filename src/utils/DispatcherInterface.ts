import { AssemblyJob, AssemblyJobOperation } from './types/AssemblyJob';

export interface DispatcherInterface {
    
    handleJobCompletion(job: AssemblyJob, waitingJobs: AssemblyJob[]): AssemblyJob|null
    handleNextTick(time: number): AssemblyJob|null
}