import XLSX from 'xlsx'
import {AssemblyStation, StationModule} from "@/utils/types/AssemblyStation";
import {Operation, Product} from "@/utils/Product";
import {AssemblyJob} from "@/utils/types/AssemblyJob";
import {source} from "@/config";

const LIST_SEPARATOR = ', '

enum SheetNames {
    PRODUCTS = 'Products',
    OPERATIONS = 'Operations',
    STATIONS = 'Stations',
    MODULES = 'Stations',
    JOBS = 'Jobs'
}

enum HeaderRows {
    MODULES = 3,
    STATIONS = 3,
    OPERATIONS = 3,
    PRODUCTS = 3,
    JOBS = 3,
}

enum ColumnRanges {
    // MODULES = 'G3:G100',
    MODULES = 'F3:F100',
    // STATIONS = 'A3:E100',
    STATIONS = 'A3:D100',
    OPERATIONS = 'A3:F200',
    PRODUCTS = 'A3:C100',
    JOBS = 'A3:D500'
}

enum HeaderNames {
    MODULE_NAME = 'Module',
    STATION_NAME = 'Station',
    //BUFFER = 'Queue Size',
    MODULES = 'Modules',
    X_COORDINATE = 'X',
    Y_COORDINATE = 'Y',
    OPERATION_NAME = 'Name',
    OPERATION_PROCESSING = 'Processing Time',
    OPERATION_SETUP = 'Setup Time',
    OPERATION_FOLLOWUP = 'Follow-up Time',
    OPERATION_PREDECESSORS = 'Predecessors',
    OPERATION_MODULES = 'Required Modules',
    PRODUCT_NAME = 'Name',
    PRODUCT_QUANTITY = 'Quantity',
    PRODUCT_OPERATIONS = 'Operations',
    JOB_ID = 'ID',
    JOB_PRODUCT = 'Product',
    JOB_DUE_DATE = 'Due Date',
    JOB_RUSH_JOB = 'Rush Job',
}

export class DataReader {

    private workbook!: XLSX.WorkBook
    public modules: StationModule[] = []
    public stations: AssemblyStation[] = []
    public products: Product[] = []
    public operations: Operation[] = []
    public jobs: AssemblyJob[] = []

    /**
     * Read raw excel file and return workbook
     * @param file
     */
    public async readExcelFile(file: File): Promise<XLSX.WorkBook> {
        let reader = new FileReader();
        let results: ArrayBuffer = await (new Promise(resolve => {
            reader.onload = function(event: ProgressEvent) {
                // @ts-ignore
                resolve(event.target.result);
            };
            reader.readAsArrayBuffer(file);
        }))
        let data = new Uint8Array(results);
        this.workbook = XLSX.read(data, {type: 'array'});
        return this.workbook
    }

    /**
     * Parse full data set
     */
    public parseData() {
        this.parseModules()
        this.parseStations()
        this.parseOperations()
        this.parseProducts()
        this.parseJobs()
    }

    /**
     * Parse an create modules
     */
    private parseModules() {
        let worksheet = this.workbook.Sheets[SheetNames.MODULES];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: ColumnRanges.MODULES,
            blankrows: false,
            header: HeaderRows.MODULES
        })
        this.modules = jsonData.map((data: any) => {
            return new StationModule(data[HeaderNames.MODULE_NAME])
        })
    }

    /**
     * Parse an create stations
     */
    private parseStations() {
        let worksheet = this.workbook.Sheets[SheetNames.STATIONS];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: ColumnRanges.STATIONS,
            blankrows: false,
            header: HeaderRows.STATIONS
        })
        this.stations = jsonData.map((data: any) => {
            let moduleNames = String(data[HeaderNames.MODULES]).split(LIST_SEPARATOR)
            let modules: StationModule[] = this.modules.filter(m => moduleNames.includes(m.label))
            let position = {x: data[HeaderNames.X_COORDINATE], y: data[HeaderNames.Y_COORDINATE]}
            let name = String(data[HeaderNames.STATION_NAME])
           // let buffer = Number(data[HeaderNames.BUFFER])
           // return new AssemblyStation(modules, name, buffer, position)
           return new AssemblyStation(modules, name, position)
        })
    }

    /**
     * Parse an create operations
     */
    private parseOperations() {
        let worksheet = this.workbook.Sheets[SheetNames.OPERATIONS];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: ColumnRanges.OPERATIONS,
            blankrows: false,
            header: HeaderRows.OPERATIONS
        })
        this.operations = jsonData.map((data: any) => {
            let moduleNames = String(data[HeaderNames.OPERATION_MODULES]).split(LIST_SEPARATOR)
            let requiredModules: StationModule[] = this.modules.filter(m => moduleNames.includes(m.label))
            return new Operation(
                data[HeaderNames.OPERATION_NAME],
                data[HeaderNames.OPERATION_PROCESSING],
                data[HeaderNames.OPERATION_SETUP],
                data[HeaderNames.OPERATION_FOLLOWUP],
                requiredModules
            )
        })
        // set predecessor relations
        jsonData.forEach((data: any) => {
            let operation = this.operations.find(o => o.name === data[HeaderNames.OPERATION_NAME])
            let predecessorNames = String(data[HeaderNames.OPERATION_PREDECESSORS]).split(LIST_SEPARATOR)
            let predecessorOperations = this.operations.filter(o => predecessorNames.includes(o.name))
            operation!.requireOperation(...predecessorOperations)
        })
    }

    /**
     * Parse an create products
     */
    private parseProducts() {
        let worksheet = this.workbook.Sheets[SheetNames.PRODUCTS];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: ColumnRanges.PRODUCTS,
            blankrows: false,
            header: HeaderRows.PRODUCTS
        })
        this.products = jsonData.map((data: any) => {
            let operationNames = String(data[HeaderNames.PRODUCT_OPERATIONS]).split(LIST_SEPARATOR)
            let operations: Operation[] = this.operations.filter(o => operationNames.includes(o.name))
            return new Product(
                data[HeaderNames.PRODUCT_NAME],
                operations,
                data[HeaderNames.PRODUCT_QUANTITY]
            )
        })
    }

    private parseJobs() {
        let worksheet = this.workbook.Sheets[SheetNames.JOBS];
        if (worksheet) {
            let jsonData = XLSX.utils.sheet_to_json(worksheet, {
                range: ColumnRanges.JOBS,
                blankrows: false,
                header: HeaderRows.JOBS
            })
            for (let data of jsonData as Record<string, any>[]) {
                let id = String(data[HeaderNames.JOB_ID])
                let productName = String(data[HeaderNames.JOB_PRODUCT])
                let product = this.products.find((p: Product) => p.name.toLowerCase() === productName.toLowerCase())
                let dueDate = Number(data[HeaderNames.JOB_DUE_DATE])
                let isRushJob = Boolean(data[HeaderNames.JOB_RUSH_JOB])
                if (!product) {
                    continue
                }
                this.jobs.push( new AssemblyJob(
                    id,
                    product,
                    source,
                    dueDate,
                    isRushJob
                ))
            }
        }

    }

}
