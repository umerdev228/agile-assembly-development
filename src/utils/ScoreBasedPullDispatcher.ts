import { DispatcherInterface } from './DispatcherInterface';
import { Manager } from './Manager';
import {AssemblyJob, JobEventType} from './types/AssemblyJob';

export class ScoreBasedPullDispatcher implements DispatcherInterface {

    manager: Manager
    asCaCards: number
    activeVolumeCycle: AssemblyJob[] = []
    sizeVolumeCycle: number
    sortedWaitingJobs: AssemblyJob[] = []
    weightFactorWorkloadScore: number
    weightFactorDueDateScore: number

    constructor(
        manager: Manager,
        asCaCards: number,
        sizeVolumeCycle: number,
        weightFactorWorkloadScore: number,
        weightFactorDueDateScore: number
    ) {
        this.manager = manager
        this.asCaCards = asCaCards
        this.sizeVolumeCycle = sizeVolumeCycle
        this.weightFactorWorkloadScore = weightFactorWorkloadScore
        this.weightFactorDueDateScore = weightFactorDueDateScore

        // sum of weight factors needs to equal 1
        if (this.weightFactorWorkloadScore + this.weightFactorDueDateScore != 1){
            console.log("Die Summe der Gewichtungsfaktoren muss 1 ergeben.")
        }

        // Sort waiting jobs with regard to state of rush order and planned date (according to volume cycles from
        // program planning)
        let rushJobs: AssemblyJob[] = []
        let nonRushJobs: AssemblyJob[] = []
        for (var job of this.manager.waitingJobs) {
            if (job.isRushJob){
                rushJobs.push(job)
            }else{
                nonRushJobs.push(job)
            }
        }
        function sortByDueDate(x: AssemblyJob,y: AssemblyJob) {
            if (x.dueDate < y.dueDate){
                return -1
            }
            if (x.dueDate > y.dueDate){
                return 1
            }
            return 0
        }
        rushJobs.sort(sortByDueDate)
        nonRushJobs.sort(sortByDueDate)
        for (var job of rushJobs){
            this.sortedWaitingJobs.push(job)
        }

        for (var job of nonRushJobs){
            this.sortedWaitingJobs.push(job)
        }

        // Initial release of orders according to order in sortedWaitingJobs until there are not enough conWipCards left
        // for the next job
        for (let i = 0; i < this.sortedWaitingJobs.length; i++) {
            if (this.asCaCards >= this.sortedWaitingJobs[0].product.operations.length) {
                this.asCaCards -= this.sortedWaitingJobs[0].product.operations.length // reduce available cards
                this.manager.dispatchJob(this.sortedWaitingJobs[0]) // dispatch job
                this.sortedWaitingJobs.splice(0, 1) // remove job
            } else {
                break
            }
        }
    }

    handleJobCompletion(completedJob: AssemblyJob, waitingJobs: AssemblyJob[]) {
        // add number of ConWip Cards of the completed job
        this.asCaCards += completedJob.product.operations.length
        // generate a new volume cycle if former one is empty
        if (this.activeVolumeCycle.length === 0) {
            this.activeVolumeCycle = this.generateVolumeCycle()
        }
        // stop releasing jobs if a new volume cycle could not be generated
        if (this.activeVolumeCycle.length === 0){
            return null
        }
        // release one job from active volume cycle
        // selection among all jobs in the active volume cycle, for which enough ConWip Cards are available
        let possibleJobs: AssemblyJob[] = []
        for (var job of this.activeVolumeCycle){
            if (this.asCaCards >= job.product.operations.length) {
                possibleJobs.push(job)
            }
        }
        // no release if there are not enough ConWip Cards for any of the jobs in the volume cycle
        if (possibleJobs.length === 0){
            return null
        }

        // determine possible job with the highest release score
        let bestIndex: number = -1 // index of best job
        let bestScore: number = 0 // score of best job
        for (var job of possibleJobs){
            let workloadScore: number = 0
            let dueDateScore: number = 0
            let orderReleaseScore: number = 0 // orderReleaseScore combines workload score and due date score
            // calculate workload score
            for (var station of this.manager.assemblyStations){
                let potentialWorkloadValue: number = 0
                let actualWorkloadValue: number = 0
                for (var operation of job.product.operations){
                    if (this.manager.getCapableAssemblyStations(operation).includes(station)){
                        potentialWorkloadValue += (operation.processingTime + station.setupTime
                        + station.followupTime) // processing time independent from station
                    }
                }
                if (station.isOccupied){
                    // set to remaining processing at occupied station
                    actualWorkloadValue = station.expectedFinishTime - this.manager.simulation.time
                }
                workloadScore += potentialWorkloadValue * actualWorkloadValue
            }
            // calculate due date score
            dueDateScore = job.dueDate - this.manager.simulation.time
            // factor 1000 so that score is not too small
            orderReleaseScore = 1000 / (this.weightFactorWorkloadScore * workloadScore
                + this.weightFactorDueDateScore * dueDateScore)

            if (orderReleaseScore > bestScore){
                bestScore = orderReleaseScore
                bestIndex = this.activeVolumeCycle.indexOf(job)
            }
        }
        if (bestIndex === -1){
            return null
        }
        // release best job
        this.asCaCards -= this.activeVolumeCycle[bestIndex].product.operations.length // decrease available cards
        let releaseJob: AssemblyJob = this.activeVolumeCycle[bestIndex]
        this.activeVolumeCycle.splice(bestIndex, 1) // remove best job from active volume cycle
        return releaseJob // release job

    }

    handleNextTick(time: number){
        return null
    }

    generateVolumeCycle(): AssemblyJob[] {
        let generatedVolumeCycle: AssemblyJob[] = []
        if (this.sortedWaitingJobs.length != 0){
            let numberOfRemainingJobs = this.sortedWaitingJobs.length
            for (let i = 0; i < Math.min(this.sizeVolumeCycle,numberOfRemainingJobs); i++){
                generatedVolumeCycle.push(this.sortedWaitingJobs[0])
                this.sortedWaitingJobs.splice(0, 1)
            }
        }
        return generatedVolumeCycle
    }
}
