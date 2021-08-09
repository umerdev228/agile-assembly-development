<template>
    <div class="container-lg py-5">
        <h1>Analytics</h1>
        <div 
            v-if="analytics.avgJobTimes.length > 0"
        >
            <apexchart 
                type="line" height="350" :options="averageJobChart" :series="averageJobSeries"/></div
        >
        <div 
            v-if="analytics.activeJobs.length > 0">
            <apexchart 
                type="line" height="350" :options="activeJobChart" :series="activeJobSeries"/></div
        >
        <div 
            v-if="showTimeDistribution">
            <apexchart 
                type="pie" width="380" :options="timesPieChart" :series="timesPieChartSeries"/></div
        >
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import {Component} from 'vue-property-decorator'
import {analytics} from "@/simulation";
import {ApexOptions} from "apexcharts";

@Component({})
export default class Analytics extends Vue {
    analytics = analytics

    get averageJobSeries(): ApexAxisChartSeries {
        return [{
            name: "Job time",
            data: this.analytics.avgJobTimes.map(({jobIndex, avgTime}) => ({x: jobIndex, y: avgTime})),
        }]
    }

    get averageJobChart(): ApexOptions {
        return {
            chart: {
                height: 350,
                type: 'line',
            },
            dataLabels: {
                enabled: true
            },
            stroke: {
                curve: 'straight'
            },
            title: {
                text: 'Average Time per Job',
                align: 'left'
            },
            xaxis: {
                type: "numeric",
                title: {
                    text: 'Job Number'
                }
            },
            yaxis: {
                title: {
                    text: 'Simulation Duration'
                }
            }
        }
    }

    get activeJobSeries(): ApexAxisChartSeries {
        return [{
            name: "Number of active jobs",
            data: this.analytics.activeJobs.map(({time, count}) => ({x: time, y: count})),
        }]
    }

    get activeJobChart(): ApexOptions {
        return {
            chart: {
                height: 350,
                type: 'line',
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'straight'
            },
            title: {
                text: 'Active Jobs',
                align: 'left'
            },
            xaxis: {
                type: "numeric",
                title: {
                    text: 'Simulation Time'
                }
            },
            yaxis: {
                title: {
                    text: 'Number of Active Jobs'
                },
            }
        }
    }

    get timesPieChartSeries(): ApexOptions['series'] {
        return this.analytics.timeDistribution.map(({value}) => Number(Number(value).toFixed(2)))
    }

    get showTimeDistribution(): boolean {
        return this.analytics.timeDistribution[0].value > 0 &&
            this.analytics.timeDistribution[1].value > 0 &&
            this.analytics.timeDistribution[2].value > 0
    }

    get timesPieChart(): ApexOptions {
        return {
            chart: {
                width: 380,
                type: 'pie',
            },
            labels: this.analytics.timeDistribution.map(({type}) => type),
            colors: ['#FF0000', '#FFA500', '#008000'],
            fill: {
                colors: ['#FF0000', '#FFA500', '#008000']
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        }
    }

}
</script>
<style scoped>

</style>
