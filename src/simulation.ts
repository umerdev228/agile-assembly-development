import {Router} from "@/utils/Router";
import {Simulation} from "@/utils/Simulation";
import {Manager} from "@/utils/Manager";
import {Analytics} from "@/utils/Analytics";
import {DataReader} from "@/utils/Reader"

export const router = new Router()
export const simulation = new Simulation()
export const manager = new Manager(simulation, router)
export const analytics = new Analytics()
export const reader = new DataReader()
