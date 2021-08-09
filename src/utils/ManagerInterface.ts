import { Dictionary } from "@/utils/types/Dictionary";
import { AssemblyStation, AssemblyStationOperation } from "@/utils/types/AssemblyStation";
import { AssemblyJob } from "@/utils/types/AssemblyJob";
import { Simulation } from "@/utils/Simulation";
import { Operation } from "@/utils/Product";
export interface ManagerInterface {
    simulation: Simulation;

    /**
     * List of all available assembly stations
     */
    assemblyStations: AssemblyStation[];

    /**
     * List of all active assembly jobs
     */
    activeJobs: AssemblyJob[];

    /**
     * List of completed assembly jobs
     */
    completedJobs: AssemblyJob[];

    /**
     * List of jobs waiting to be dispatched
     */
    waitingJobs: AssemblyJob[];

    /**
     * Init manager from json data
     * @param jsonData
     */
    initFromJson(jsonData: Dictionary): void; 






    /**
     * Dispatch new job
     * return false if job is not feasible
     * @param job
     */
    dispatchJob(job: AssemblyJob): boolean;

    /**
     * Add job to waiting job pool
     * @param job
     */
    addJob(job: AssemblyJob): void;

    /**
     * Dispatch an event on the event bus
     * @param name
     * @param payload
     */
    dispatchEvent(name: string, payload: Dictionary): void; 






    /**
     * Get available combinations
     * of assembly stations and operations
     * @param job
     */
    getAvailableAssemblyStationOperations(job: AssemblyJob): AssemblyStationOperation[];

    /**
     * Register a new assembly station
     * @param station
     */
    registerAssemblyStation(station: AssemblyStation): void;

    /**
     * Get list of assembly station which are capable
     * for the given operation
     * @param operation
     */
    getCapableAssemblyStations(operation: Operation): AssemblyStation[];
}
