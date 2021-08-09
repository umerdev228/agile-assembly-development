
<script lang="ts"> 
import {Line} from "vue-chartjs"
import Vue from "vue"
import {Component, Prop} from 'vue-property-decorator'

export default class LineChart extends Line {
    @Prop() label!: string;
    @Prop() chartData!: Array<String>;
    @Prop() options!: Object

    mounted() {
        const dates= this.chartData.map((d :any) => d.date).reverse()
        const totals= this.chartData.map((d :any) => d.total).reverse()

        this.renderChart({
            labels: dates,
            datasets: [{
                label: this.label,
                data:totals
            }],
            
        },this.options)
    }
 

}
</script>