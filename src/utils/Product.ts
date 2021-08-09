import {v4 as uuid} from "uuid"
import {StationModule} from "@/utils/types/AssemblyStation"

/**
 * Assembly operation
 */
export class Operation {
    id: string
    name: string
    processingTime: number
    setUpTime: number = 0
    followUpTime: number = 0
    requiredModules: StationModule[]        
    predecessors: Operation[] = []

    constructor(
        name: string,
        processingTime: number,
        setUpTime: number = 0,
        followUpTime: number = 0,
        requiredModules: StationModule[] = []
    ) {
        this.id = uuid()    
        this.name = name
        this.processingTime = processingTime
        this.setUpTime = setUpTime
        this.followUpTime = followUpTime
        this.requiredModules = requiredModules
    }

    /**
     * Add required predecessor operation
     * @param operations
     */
    requireOperation = (...operations: Operation[]): void => {
        this.predecessors = [...this.predecessors, ...operations]   
    }
}

/**
 * Product variant
 */
export class Product {
    id: string
    name: string
    quantity: number
    operations: Operation[]
    selected?: Operation[] = []
//    constructor(name: string, operations: Operation[], quantity: number = 1, selected?: Operation[] ) {

    constructor(name: string, operations: Operation[], quantity: number, selected?: Operation[] ) {
        this.id = uuid()
        this.name = name
        this.operations = operations
        this.quantity = quantity
       // this.selected = selected
    }
}
