import vueConfig from '../vue.config'
/**
 * Deployment
 */
export const deploymentBasePath = vueConfig.publicPath

/**
 * Pixel per meter ratio
 */
import {Coordinate} from "@/utils/types/GeometryTypes"

export const pixelMeterRation: number = 50

/**
 * Real speed in m/s
 */
export const drivingSpeed: number = 1

/**
 * Source coordinates
 */
export const source: Coordinate = {x: -200, y: -200}

/**
 * Sink coordinates
 */
export const sink: Coordinate = {x: 1000, y: -200}

/**
 * Size of chassis
 */
export const chassisWidth = 75
export const chassisHeight = 55

/**
 * Chassis image options.
 */
export const imageOptions: {text: string, value: string}[] = [
    { text: 'chassis', value: `${deploymentBasePath}images/chassis.svg` },
    { text: 'bike', value: `${deploymentBasePath}images/bike.svg` },
    { text: 'dishwasher', value: `${deploymentBasePath}images/dishwasher.svg` },
    { text: 'e-bike', value: `${deploymentBasePath}images/e-bike.svg` },
    { text: 'e-mobility', value: `${deploymentBasePath}images/e-mobility.svg` },
    { text: 'laptop', value: `${deploymentBasePath}images/laptop.svg` },
    { text: 'motorbike', value: `${deploymentBasePath}images/motorbike.svg` },
    { text: 'press', value: `${deploymentBasePath}images/press.svg` },
    { text: 'screwdriver', value: `${deploymentBasePath}images/screwdriver.svg` },
    { text: 'tractor', value: `${deploymentBasePath}images/tractor.svg` },
]
export const defaultImagePath = imageOptions[0].value
export const emptyConfigurationFile = `${deploymentBasePath}data/ConfigurationSheet.xlsm`
export const sampleConfigurationFile = `${deploymentBasePath}data/SampleConfigurationSheet.xlsm`
export const wzlLogo = `${deploymentBasePath}images/WZL.jpg`
export const montageLogo = `${deploymentBasePath}images/Logo_Montage_WZL.png`