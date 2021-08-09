import { AssemblyJob } from '@/utils/types/AssemblyJob'
import { AssemblyStation, StationModule } from '@/utils/types/AssemblyStation'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

type Station = {
  name: string
  modules: string[]
  x: number
  y: number
 // buffer: number
}
type Operation = {
  name: string
  process: number
  setup: number
  followup: number
  predecessors: string[]
  modules: string[]
}
type Product = {
  name: string
  quantity: number
  operations: string[]
}

export interface StoreState {
  modules: string[];
  stations: Station[];
  operations: Operation[];
  products: Product[];
  waitingJobs: AssemblyJob[];
  stationNames: string[]
}

export default new Vuex.Store<StoreState>({
  state: {
    modules: [],
    stations: [],
    operations: [],
    products: [],
    waitingJobs: [],
    stationNames: []
  },
  mutations: {
    addModule: (state, payload) => {
      state.modules.push(payload.label)
    },
    
    addProduct: (state, payload) => {
      let ops = []
      for(let op of payload.operations)
        ops.push(op.name)

      state.products.push({name: payload.name, operations: ops, quantity: payload.quantity })
    },
    addOperation: (state, payload) => {
      let predecessors = []
      for(let pred of payload.predecessors)
        predecessors.push(pred.name)
      let requiredMods = []
      for(let mod of payload.requiredModules)
        requiredMods.push(mod.label)
      state.operations.splice(state.operations.length, 0,{name: payload.name, process: payload.processingTime, setup: payload.setUpTime, followup: payload.followUpTime, predecessors: predecessors, modules: requiredMods})
    },
    addStation: (state, payload: AssemblyStation) => {
      let name1 = payload.id
      let modules1 = []
    //  let buffer1 = payload.buffer
      for(let mod of payload.modules)
        modules1.push(mod.label)
      let x1= payload.position.x
      let y1= payload.position.y
    // let station = {name: name1, modules: modules1, buffer: buffer1, x: x1,y: y1}
      let station = {name: name1, modules: modules1, x: x1,y: y1}
      state.stations.splice(state.stations.length, 0,station)
    },
    changeQuantity: (state,payload) => {
      let newIndex = state.products.findIndex(p => p.name === payload.name)
      if(newIndex > -1) {
        state.products[newIndex].quantity = payload.quantity
      }
    },
    resetWaitingList: (state) => {
      state.waitingJobs = []
    },
    resetStations: (state) => {
      state.stations = []
    }
  },
  actions: {
  },
  modules: {
  }
})
