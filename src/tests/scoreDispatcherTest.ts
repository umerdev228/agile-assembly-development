import {manager} from "@/simulation"
import {ScoreBasedPullDispatcher} from "@/utils/ScoreBasedPullDispatcher";
import {AssemblyStation, StationModule} from "@/utils/types/AssemblyStation";
import {Operation, Product} from "@/utils/Product";
import {AssemblyJob} from "@/utils/types/AssemblyJob";

// create modules
let robbi = new StationModule('Roboter')
let electric = new StationModule('Elektronik')
let drill = new StationModule('Akkuschrauber')

// create operations
let floor = new Operation(
    'Boden montieren',
    10,
    5,
    5,
    [robbi]
)
let cables = new Operation(
    'Kabelstrang montieren',
    30,
    8,
    6,
    [electric]
)
let leftDoor = new Operation(
    'Linke Tür montieren',
    40,
    0,
    0,
    [drill]
)
let rightDoor = new Operation(
    'Rechte Tür montieren',
    40,
    5,
    0,
    [robbi]
)
let spoiler = new Operation(
    'Spoiler montieren',
    20,
    10,
    0,
    [drill]
)

// setup constraints
floor.requireOperation(cables)
spoiler.requireOperation(leftDoor)
spoiler.requireOperation(rightDoor)

// create products
let product1 = new Product('S-Klasse', [floor, cables, leftDoor, rightDoor],1)
let product2 = new Product('A-Klasse', [leftDoor, rightDoor, spoiler],1)

// create stations
let multiplier = 2
for (let i = 0; i < multiplier; i++) {
    let y = i * 200
    let station1 = new AssemblyStation(
        [drill],
        "station1",
        {x: 150, y: y}
    )
    let station2 = new AssemblyStation(
        [electric, robbi],
        "station2",
        {x: 550, y: y}
    )
    let station3 = new AssemblyStation(
        [robbi],
        "station3",
        {x: 950, y: y}
    )
    let station4 = new AssemblyStation(
        [electric, drill],
        "station4",
        {x: 1350, y: y}
    )
    let assemblyStations: AssemblyStation[] = [station1, station2, station3, station4]
    assemblyStations.forEach(manager.registerAssemblyStation)
}


// create jobs and add them to waiting list
//for (let i = 0; i < multiplier * 10; i++) {
    //let index = Math.floor(Math.random() * 1.9999)
    //let product = [product1, product2]
    //let job = new AssemblyJob(product[index], source)
    //manager.addJob(job)
//}
let job1 = new AssemblyJob("1", product1, {}, 90, true)
manager.addJob(job1)
let job2 = new AssemblyJob("2", product1, {}, 130, true)
manager.addJob(job2)
let job3 = new AssemblyJob("3", product1, {}, 110, false)
manager.addJob(job3)
let job4 = new AssemblyJob("4", product1, {}, 140, false)
manager.addJob(job4)
let job5 = new AssemblyJob("5", product1, {}, 200, true)
manager.addJob(job5)
let job6 = new AssemblyJob("6", product1, {}, 450, false)
manager.addJob(job6)
let job7 = new AssemblyJob("7", product1, {}, 350, false)
manager.addJob(job7)
let job8 = new AssemblyJob("8", product1, {}, 600, false)
manager.addJob(job8)
let job9 = new AssemblyJob("9", product1, {}, 400, false)
manager.addJob(job9)
let job10 = new AssemblyJob("10", product1, {}, 900, false)
manager.addJob(job10)
let job11 = new AssemblyJob("11", product2, {}, 50, false)
manager.addJob(job11)
let job12 = new AssemblyJob("12", product2, {}, 550, false)
manager.addJob(job12)
let job13 = new AssemblyJob("13", product2, {}, 210, false)
manager.addJob(job13)
let job14 = new AssemblyJob("14", product2, {}, 380, false)
manager.addJob(job14)
let job15 = new AssemblyJob("15", product2, {}, 870, false)
manager.addJob(job15)
let job16 = new AssemblyJob("16", product2, {}, 620, false)
manager.addJob(job16)
let job17 = new AssemblyJob("17", product2, {}, 420, false)
manager.addJob(job17)
let job18 = new AssemblyJob("18", product2, {}, 500, false)
manager.addJob(job18)
let job19 = new AssemblyJob("19", product2, {}, 610, false)
manager.addJob(job19)
let job20 = new AssemblyJob("20", product2, {}, 250, false)
manager.addJob(job20)


// prepare dispatcher
let dispatcher = new ScoreBasedPullDispatcher(
    manager,
    11,
    5,
    0.1,
    0.9
)


// create currently processed jobs and add their active operations to work stations
// let jobA1 = new AssemblyJob(product1, {}, 0, 0, false)
// let jobA2 = new AssemblyJob(product1, {}, 0, 0, false)
// let jobA3 = new AssemblyJob(product2, {}, 0, 0, false)
// let jobA4 = new AssemblyJob(product1, {}, 0, 0, false)
// let jobA5 = new AssemblyJob(product1, {}, 0, 0, false)
// let jobA6 = new AssemblyJob(product2, {}, 0, 0, false)
// manager.assemblyStations[0].activeJobOperation = {operation: leftDoor, job: jobA1}
// manager.assemblyStations[1].activeJobOperation = {operation: cables, job: jobA2}
// manager.assemblyStations[2].activeJobOperation = {operation: rightDoor, job: jobA3}
// manager.assemblyStations[3].activeJobOperation = null // station currently empty
// manager.assemblyStations[4].activeJobOperation = {operation: leftDoor, job: jobA4}
// manager.assemblyStations[5].activeJobOperation = {operation: cables, job: jobA5}
// manager.assemblyStations[6].activeJobOperation = {operation: rightDoor, job: jobA6}
// manager.assemblyStations[7].activeJobOperation = null // station currently empty
manager.assemblyStations[0].isOccupied = true
manager.assemblyStations[0].expectedFinishTime = 40
manager.assemblyStations[2].isOccupied = true
manager.assemblyStations[2].expectedFinishTime = 50
manager.assemblyStations[3].isOccupied = true
manager.assemblyStations[3].expectedFinishTime = 10
manager.assemblyStations[4].isOccupied = true
manager.assemblyStations[4].expectedFinishTime = 30
manager.assemblyStations[6].isOccupied = true
manager.assemblyStations[6].expectedFinishTime = 20
manager.assemblyStations[7].isOccupied = true
manager.assemblyStations[7].expectedFinishTime = 60


// test dispatcher by simulating that a job has been completed
let completedJob1 = new AssemblyJob("0", product2, {}, 0, false)
let dispatchedJob1 = dispatcher.handleJobCompletion(completedJob1, manager.waitingJobs)
if (dispatchedJob1 != null){
    console.log("Freigabe für: " + dispatchedJob1.dueDate)
}
let completedJob2 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob2 = dispatcher.handleJobCompletion(completedJob2, manager.waitingJobs)
if (dispatchedJob2 != null){
    console.log("Freigabe für: " + dispatchedJob2.dueDate)
}
let completedJob3 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob3 = dispatcher.handleJobCompletion(completedJob3, manager.waitingJobs)
if (dispatchedJob3 != null){
    console.log("Freigabe für: " + dispatchedJob3.dueDate)
}
let completedJob4 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob4 = dispatcher.handleJobCompletion(completedJob4, manager.waitingJobs)
if (dispatchedJob4 != null){
    console.log("Freigabe für: " + dispatchedJob4.dueDate)
}
let completedJob5 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob5 = dispatcher.handleJobCompletion(completedJob5, manager.waitingJobs)
if (dispatchedJob5 != null){
    console.log("Freigabe für: " + dispatchedJob5.dueDate)
}
let completedJob6 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob6 = dispatcher.handleJobCompletion(completedJob6, manager.waitingJobs)
if (dispatchedJob6 != null){
    console.log("Freigabe für: " + dispatchedJob6.dueDate)
}
let completedJob7 = new AssemblyJob("0", product2, {}, 0, false)
let dispatchedJob7 = dispatcher.handleJobCompletion(completedJob7, manager.waitingJobs)
if (dispatchedJob7 != null){
    console.log("Freigabe für: " + dispatchedJob7.dueDate)
}
let completedJob8 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob8 = dispatcher.handleJobCompletion(completedJob8, manager.waitingJobs)
if (dispatchedJob8 != null){
    console.log("Freigabe für: " + dispatchedJob8.dueDate)
}
let completedJob9 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob9 = dispatcher.handleJobCompletion(completedJob9, manager.waitingJobs)
if (dispatchedJob9 != null){
    console.log("Freigabe für: " + dispatchedJob9.dueDate)
}
let completedJob10 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob10 = dispatcher.handleJobCompletion(completedJob10, manager.waitingJobs)
if (dispatchedJob10 != null){
    console.log("Freigabe für: " + dispatchedJob10.dueDate)
}
let completedJob11 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob11 = dispatcher.handleJobCompletion(completedJob11, manager.waitingJobs)
if (dispatchedJob11 != null){
    console.log("Freigabe für: " + dispatchedJob11.dueDate)
}
let completedJob12 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob12 = dispatcher.handleJobCompletion(completedJob12, manager.waitingJobs)
if (dispatchedJob12 != null){
    console.log("Freigabe für: " + dispatchedJob12.dueDate)
}
let completedJob13 = new AssemblyJob("0", product1, {}, 0, false)
let dispatchedJob13 = dispatcher.handleJobCompletion(completedJob13, manager.waitingJobs)
if (dispatchedJob13 != null){
    console.log("Freigabe für: " + dispatchedJob13.dueDate)
}
if (dispatchedJob13 === null){
    console.log("Kein Auftrag wurde freigegeben.")
}
