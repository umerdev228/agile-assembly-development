<template>
    <div class="container-lg py-5">
        <b-table-simple 
            class="table" hover small caption-top :responsive="true" id="mytable1"
        >
            <caption 
                :text-align="'center'">
                    <h3>Jobs information:</h3
                    ></caption
            >
            <b-thead 
                head-variant="dark"
            >
                <b-tr>
                    <b-th>Job ID</b-th>
                    <b-th>Status</b-th>
                    <b-th>Current Station</b-th>
                    <b-th>Product</b-th>
                    <b-th>Number Operations</b-th>
                    <b-th>Start Time</b-th>
                    <b-th>End Time</b-th>
                    <b-th>Transport Time</b-th>
                    <b-th>Working Time</b-th>
                    <b-th>Waiting Time</b-th></b-tr
                ></b-thead
            >
            <b-tbody>
                <b-tr 
                    v-for="job in jobs" :key="job.id"
                >
                    <b-td>{{ job.id.slice(0, 8) }}</b-td>
                    <b-td>{{ job.status }}</b-td>
                    <b-td 
                        v-if="job.status !== 'completed' && job.plannedJobOperation">
                        {{ job.plannedJobOperation.station.id.slice(0, 8) }}</b-td
                    >
                    <b-td 
                        v-else>none</b-td
                    >
                    <b-td>{{ job.product.name }}</b-td>
                    <b-td>{{ job.product.operations.length }}</b-td>
                    <b-td>{{ job.dispatchedAt ? job.dispatchedAt.toFixed(2) : '--' }}</b-td>
                    <b-td 
                        v-if="job.status==='completed'">{{ job.completedAt ? job.completedAt.toFixed(2) : '--' }}</b-td
                    >
                    <b-td 
                        v-else>---</b-td
                    >
                    <b-td>{{ job.transportTime.toFixed(2) }}</b-td>
                    <b-td>{{ job.workTime2.toFixed(2) }}</b-td>
                    <b-td>{{ job.waitingTime.toFixed(2) }}</b-td>
                </b-tr>
            </b-tbody>
        </b-table-simple>

        <b-table-simple 
            class="table" hover small caption-top responsive id="mytable2"
        >
            <caption 
                text-align="center"
            >
                <h3>Stations information:</h3
                ></caption
            >
            <b-thead 
                head-variant="dark"
            >
                <b-tr>
                    <b-th>Station ID</b-th>
                    <b-th>Setup Time</b-th>
                    <b-th>Process Time</b-th>
                    <b-th>Follow-up Time</b-th>
                    <b-th>Total Working Time</b-th>
                    <b-th>Total Time</b-th>
                    <b-th>Utilization Rate</b-th></b-tr
                >
            </b-thead>
            <b-tbody>
                <b-tr 
                    v-for="station in manager.assemblyStations" :key="station.id"
                >
                    <b-td>{{ station.id.slice(0, 8) }}</b-td>
                    <b-td>{{ station.setupTime.toFixed(2) }}</b-td>
                    <b-td>{{ station.processTime.toFixed(2) }}</b-td>
                    <b-td>{{ station.followupTime.toFixed(2) }}</b-td>
                    <b-td>{{ (station.setupTime + station.processTime + station.followupTime).toFixed(2) }}</b-td>
                    <b-td>{{ manager.simulation.time.toFixed(2) }}</b-td>
                    <b-td 
                        v-if="manager.simulation.time > 0"
                    >
                        {{ (((station.setupTime + station.processTime + station.followupTime) / manager.simulation.time) * 100).toFixed(2) }}%</b-td
                    >
                    <b-td 
                        v-else>0%</b-td
                    >
                </b-tr>
            </b-tbody>
            <b-tfoot>
                <b-tr>
                    <b-td 
                        colspan="7" variant="secondary"
                    >
                        Total Utilization Rate: <b>{{ overallUtilization }}%</b></b-td
                    >
                </b-tr>
            </b-tfoot>
        </b-table-simple>

        <b-button @click="exportTables">Export</b-button>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import {Component} from 'vue-property-decorator'
import {manager} from "@/simulation";
import XLSX from 'xlsx'
import {saveAs} from 'file-saver';
import {AssemblyJob} from "@/utils/types/AssemblyJob";

@Component
export default class Monitoring extends Vue {
    manager = manager

    get jobs(): AssemblyJob[] {
        return [
            ...this.manager.activeJobs,
            ...this.manager.completedJobs
        ]
    }

    get overallUtilization(): number {
        let sum = 0
        for (let station of this.manager.assemblyStations) {
            sum += (station.setupTime + station.processTime + station.followupTime)
        }
        if (this.manager.simulation.time === 0)
            return 0
        return Number((100 * sum / (this.manager.simulation.time * this.manager.assemblyStations.length)).toFixed(2))
    }

    s2ab(s: any) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

/**
 * Create excel file with separate Sheets for Jobs and Stations Data
 * 
 */
    exportTables() {
        let workbook = XLSX.utils.book_new();
        let ws1 = XLSX.utils.table_to_sheet(document.getElementById('mytable1'));
        XLSX.utils.book_append_sheet(workbook, ws1, "Jobs Information");
        let ws2 = XLSX.utils.table_to_sheet(document.getElementById('mytable2'));
        XLSX.utils.book_append_sheet(workbook, ws2, "Stations Information");
        let wbout = XLSX.write(workbook, {bookType: 'xlsx', bookSST: true, type: 'binary'})
        saveAs(new Blob([this.s2ab(wbout)], {type: "application/octet-stream"}), 'Data.xlsx');
    }
}
</script>

<style lang="scss" scoped>
.table {
    margin-left: 1%;
    margin-right: 5%;
}
</style>
