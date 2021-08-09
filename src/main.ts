import Vue from 'vue'
import VueRouter from 'vue-router'
import Analytics from '@/views/Analytics.vue'
//import Dataupload from '@/views/Dataupload.vue'
import Simulation from '@/views/Simulation.vue'
import Monitoring from '@/views/Monitoring.vue'
import Products from '@/views/Products.vue'
import App from './App.vue'
import store from './store'
import VueConva from 'vue-konva'
import {BootstrapVue, IconsPlugin} from 'bootstrap-vue'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Chartkick from 'vue-chartkick'
import Chart from 'chart.js'
import vSelect from 'vue-select'
import VueApexCharts from 'vue-apexcharts'
import 'vue-select/dist/vue-select.css'
import {deploymentBasePath} from "@/config";

Vue.use(Chartkick.use(Chart))
Vue.component('v-select', vSelect)
Vue.config.productionTip = false
Vue.use(VueConva)
Vue.use(VueRouter)
Vue.use(VueApexCharts)
Vue.component('apexchart', VueApexCharts)
const router = new VueRouter({
    routes: [
        {path: '/analytics', component: Analytics},
        {path: '/', component: Simulation},
     //   {path: '/upload', component: Dataupload},
        {path: '/monitoring', component: Monitoring},
        {path: '/products', component: Products},
    ],
    base: deploymentBasePath,
    mode: 'history',
})

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
