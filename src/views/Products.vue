<template>
    <div class="container-lg py-5">
        <h3 class="mb-3">Upload new configuration file</h3>
        <b-form-group 
            label-for="file-large"
        >
            <b-form-file 
                class="createborder" id="file-large" size="lg" @input="handleFileUpload" placeholder="Choose a file or drop it here..."
            ></b-form-file
            ></b-form-group
        >

        <b-button 
            class="downloadbutton1"
            variant="outline-primary"
            @click="downloadEmptyConfiguration"
        >
            <b-icon icon="download" aria-hidden="true"></b-icon
            > Empty Configuration File </b-button
        >

        <b-button
            variant="outline-primary"
            @click="downloadModelConfiguration"
        >
            <b-icon icon="download" aria-hidden="true"></b-icon
            > Sample Configuration File</b-button
        >

        <!--Modules--> 
        <b-table-simple class="table" hover small caption-top :responsive="true">
            <caption 
                :text-align="'center'"
            >
                <h3>Modules:</h3
                ></caption
            >
            <b-thead 
                head-variant="dark"
            >
                <b-tr>
                    <b-th>Module Name</b-th>
                </b-tr>

                <b-tr v-for="module in manager.modules" :key="module.id">
                    <b-td>
                        <b-form-input 
                            v-model="module.label" placeholder="Enter module name"
                        ></b-form-input></b-td
                    >
                    <b-td>
                        <b-button 
                            class="del" @click="deleteModule(module)"
                        >X</b-button
                        ></b-td
                    >
                </b-tr>

                <b-td>
                    <b-button 
                        class="add" @click="createNewModule"
                    > Add new module</b-button
                    ></b-td
                ></b-thead
            ></b-table-simple
        >

        <!--Stations-->
        <b-table-simple class="table" hover small caption-top :responsive="true">
            <caption 
                :text-align="'center'"
            >
                <h3>Stations:</h3></caption
            >
            <b-thead 
                head-variant="dark"
            >
                <b-tr>
                    <b-th>Station</b-th>
                    <b-th>Modules</b-th>
                    <b-th>X</b-th>
                    <b-th>Y</b-th>
                </b-tr>

                <b-tr  
                    v-for="station in manager.assemblyStations" :key="station.position"
                >
                    <b-td>
                        <b-form-input 
                            v-model="station.id" placeholder="Enter station name"
                        ></b-form-input></b-td
                    >
                    <b-td>
                        <v-select 
                            multiple v-model="station.modules" label="label" :options="manager.modules"
                        ></v-select></b-td
                    >
                    <b-td>
                        <b-form-input 
                            v-model="station.position.x" placeholder="Enter x coordinate"
                        ></b-form-input></b-td
                    >
                    <b-td>
                        <b-form-input 
                            v-model="station.position.y" placeholder="Enter y coordinate"
                        ></b-form-input></b-td
                    >
                    <b-td>
                        <b-button 
                            class="del" @click="deleteStation(station)"
                        >X</b-button
                    ></b-td></b-tr
                >
                <b-td>
                    <b-button 
                        class="add" @click="createNewStation"
                    > Add new station </b-button
                    ></b-td
                ></b-thead
            ></b-table-simple
        >

        <!--Operations-->
        <b-table-simple  class="table" hover small caption-top :responsive="true">
            <caption 
                :text-align="'center'"
            >
                <h3>Operations:</h3
                ></caption
            >
            <b-thead 
                head-variant="dark"
            >
                <b-tr>
                    <b-th>Operation name</b-th>
                    <b-th>Processing Time</b-th>
                    <b-th>Setup Time</b-th>
                    <b-th>FollowUp Time</b-th>
                    <b-th>Predecessor</b-th>
                    <b-th>Modules</b-th>
                </b-tr>
                <b-tr 
                    v-for="operation in operations" :key="operation.id"
                >
                    <b-td>
                        <b-form-input 
                            v-model="operation.name" placeholder="Enter operation name"></b-form-input
                        ></b-td
                    >
                    <b-td>
                        <b-form-input 
                            v-model="operation.processingTime" placeholder="Enter processing time" :type="number"></b-form-input
                        ></b-td
                    >
                    <b-td>
                        <b-form-input 
                            v-model="operation.setUpTime" placeholder="Enter setup time" :type="number"></b-form-input
                        ></b-td
                    >
                    <b-td>
                        <b-form-input 
                            v-model="operation.followUpTime" placeholder="Enter followup time" :type="number"></b-form-input
                        ></b-td
                    >
                    <b-td>
                        <v-select 
                            multiple v-model="operation.predecessors" label="name" :options="operations"></v-select
                        ></b-td
                    >
                    <b-td>
                        <v-select 
                            multiple v-model="operation.requiredModules" label="label" :options="manager.modules"></v-select
                        ></b-td
                    >
                    <b-td>
                        <b-button 
                            class="del" @click="deleteOperation(operation)">X</b-button
                        ></b-td
                    > 
                </b-tr>
                    <b-td>
                        <b-button 
                            class="add" @click="createNewOperation">Add new operation</b-button
                        ></b-td
                    >
            </b-thead>
        </b-table-simple>


        <!--Products-->
        <b-table-simple 
            class="table" hover small caption-top :responsive="true"
        >
            <caption 
                :text-align="'center'"
            >
                <h3>Products:</h3
                ></caption
            >
            <b-thead 
                head-variant="dark"
            >
                <b-tr>
                    <b-th>Name</b-th>
                    <b-th>Quantity</b-th>
                    <b-th>Operations</b-th>
                </b-tr></b-thead
            >
            <b-tbody>
                <b-tr 
                    v-for="product in products" :key="product.id"
                >
                    <b-td>
                        <b-form-input 
                            v-model="product.name" placeholder="Enter product name"></b-form-input
                        ></b-td
                    >
                    <b-td>
                        <b-form-input 
                            type="number" v-model="product.quantity" placeholder="Enter product quantity" step="1" min="0"></b-form-input
                        ></b-td
                    >
                    <b-td>
                        <v-select 
                            multiple v-model="product.operations" label="name" :options="operations"></v-select
                        >
                    </b-td>
                    <b-td>
                        <b-button 
                            class="del" @click="deleteProduct(product)">X</b-button
                        ></b-td
                    > 
                </b-tr>
                <b-td>
                    <b-button 
                        class="add" @click="createNewProduct"
                    >Add new product</b-button
                    ></b-td
                >
            </b-tbody>
        </b-table-simple> 
  
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import {Component, Watch} from 'vue-property-decorator'
import {simulation} from "@/simulation";
import {Operation, Product} from "@/utils/Product";
import {manager} from "@/simulation";
import { AssemblyStation, StationModule } from "@/utils/types/AssemblyStation";
import { DataReader } from "@/utils/Reader";
import EventBus from "@/utils/EventBus";
import {emptyConfigurationFile, sampleConfigurationFile} from "@/config";
import axios from 'axios'

@Component
export default class Products extends Vue {

    manager = manager
    simulation = simulation
    
    /**
    * Get and download empty configuration file from the deployment base
    */
    downloadEmptyConfiguration() {
        axios({
            url: emptyConfigurationFile, 
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', 'EmptyConfigurationFile.xlsm');
                document.body.appendChild(fileLink);
                fileLink.click();
        });
    }

    /**
    * Get and download empty configuration file from the deployment base
    */
    downloadModelConfiguration() {
        axios({
            url: sampleConfigurationFile, 
            method: 'GET',
            responseType: 'blob',
        }).then((response) => {
                var fileURL = window.URL.createObjectURL(new Blob([response.data]));
                var fileLink = document.createElement('a');
                fileLink.href = fileURL;
                fileLink.setAttribute('download', 'SampleConfigurationFile.xlsm');
                document.body.appendChild(fileLink);
                fileLink.click();
    });
    }
    
    /**
     * Handle data upload
     * @param file
     */
    async handleFileUpload(file: File) {
        let reader = new DataReader()
        await reader.readExcelFile(file)
        reader.parseData()
        EventBus.$emit('data-parsed', reader)
    }

    createNewStation(){
        let station = new AssemblyStation(
                [],
                "New station", 
                {x: 0, y: 0}
        )
        this.manager.registerAssemblyStation(station)    
    }

    createNewModule() {
        let module = new StationModule("New module")
        this.manager.registerModule(module)    
    }

    createNewOperation(){
          let operation = new Operation(
            'New operation',
            0,
            0,
            0,
            []
        )
       this.manager.registerOperation(operation)    
    }

    createNewProduct(){
        let prod = new Product(
            'New product',
            [],
            0
        )
        this.manager.registerProduct(prod)    
    }

    deleteModule(module: StationModule) {
        const index = this.manager.modules.indexOf(module)
        if (index >= 0) {
            this.manager.modules.splice(index, 1)
        }
        for(let station of this.manager.assemblyStations) {
            let index1 = station.modules.indexOf(module)
            if (index1 >= 0) {
                station.modules.splice(index1, 1)
            }
        }
        for(let operation of this.manager.operations) {
            let index1 = operation.requiredModules.indexOf(module)
            if (index1 >= 0) {
                operation.requiredModules.splice(index1, 1)
            }
        }
    }

    deleteStation(station: AssemblyStation) {
        const index = this.manager.assemblyStations.indexOf(station)
        if (index >= 0) {
            this.manager.assemblyStations.splice(index, 1)
        }
    }
   
    deleteOperation(operation: Operation) {
        const index = this.manager.operations.indexOf(operation)
        if (index >= 0) {
            this.manager.operations.splice(index, 1)
        }
        for(let op of this.manager.operations) {
            let index1 = op.predecessors.indexOf(operation)
            if (index1 >= 0) {
                op.predecessors.splice(index1, 1)
            }
        }
        for(let prod of this.manager.products) {
            let index1 = prod.operations.indexOf(operation)
            if (index1 >= 0) {
                prod.operations.splice(index1, 1)
            }
        }
    }

    deleteProduct(product: Product) {
        const index = this.manager.products.indexOf(product)
        if (index >= 0) {
            this.manager.products.splice(index, 1)
        }    
    }

    get quantity() {
        return this.manager.products.map(product => product.quantity)
    }
    
    @Watch("quantity") onQuantityChanged() {
         this.manager.changedProducts = true
    }
     
    get products() {
        return this.manager.products
    }

    get modules() {
        return this.manager.modules 
    }
    get operations() {
        return this.manager.operations
    }
 
}

</script>
<style lang="scss" scoped>
.table {
    margin-left: 1%;
    margin-right: 5%;
}
.add {
    background-color:#00549f !important;
}
.del{
    background-color:black !important;
}
.createborder {
    border-color: red;
    border-style: solid; 
    border-width: 1.3px;
    margin-right: 10px;
}
.downloadbutton1 {
    margin-right: 10px;
}
.downloadbutton2 {
    margin-top: -100px;
}

.mb-4 {
    margin-top: -110px;
    margin-left: 76%;
    margin-bottom: 70px !important;
}
</style>
