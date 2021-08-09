<template>
    <v-group
        ref="container"
        :config="containerConfig"
        @click="assemblyStation.disable"
        @dragend="handleDragEnd"
        @dragmove="handleDragMove"
    >  
    <!--@click="$this.emit('stationClicked')" custom event name stationClicked must be kebap?-case--@click="$this.emit('stationClicked')  @click="disabled=(disabled+1)%2"-->
        <v-rect :config="driveWayConfig" />
        <v-rect :config="stationTopBackgroundConfig" />
        <v-rect :config="stationBottomBackgroundConfig" />
        <v-text :config="statusTextConfig" />
        <v-text :config="progressTextConfig" />
        <v-text :config="idTextConfig" />
    </v-group>
</template>

<script lang="ts">
    import Vue from "vue"
    import {loadImage} from "@/utils/MediaHelpers"
    import {Stage} from "konva/types/Stage"
    import {Component, Prop} from 'vue-property-decorator'
    import {ContainerConfig} from "konva/types/Container"
    import {RectConfig} from "konva/types/shapes/Rect"
    import {TextConfig} from "konva/types/shapes/Text"
    import {AssemblyStation, StationStatus} from "@/utils/types/AssemblyStation"
    import {KonvaNodeEvent} from "konva/types/types";

    @Component
    export default class KonvaStation extends Vue {

        // Data property
        imagesLoaded: boolean = false;
        assets: string[] = []
        images: { [key: string]: HTMLImageElement } = {}
        scaleBy : number = 2
        // Properties
        // https://github.com/kaorun343/vue-property-decorator/issues/81#issuecomment-364634713
        @Prop({default: 0})
        angle!: number
        @Prop({default: 20})
        paddingHeight!: number
        @Prop({default: 4})
        cornerRadius!: number
        @Prop({default: 8})
        openingRadius!: number
        @Prop({required: true})
        assemblyStation!: AssemblyStation
        @Prop({default: false})
        highlighted!: Boolean
        @Prop({default: 400})
        paddingX!: number
        @Prop({default: 200})
        paddingY!: number
        
        // Lifecycle hook
        async beforeMount () {
            /**
             * Do not mount until assets are loaded
             */
            try {
                let images = await this.loadImages()
                // set results
                images.forEach((img: HTMLImageElement, index: number) => {
                    this.images[this.assets[index]] = img
                })
                this.imagesLoaded = true
            } catch (e) {
                console.log(e)
            }
        }

        /**
         * Load all required assets
         */
        loadImages(): Promise<HTMLImageElement[]> {
            let assetDir = '/images/';
            let promises = []
            for (let src of this.assets) {
                let url = assetDir + src
                promises.push(loadImage(url, false))
            }
            return Promise.all(promises)
        }
        /**
         * Expose Konva getState method
         */
        getStage(): Stage | null {
            let container = this.$refs.container
            // @ts-ignore
            return container ? container.getStage() : null
        }

        handleDragMove(e: KonvaNodeEvent) {
            // TODO position shadow element
        }


        handleDragEnd() {
            let stage = this.getStage()
            // snap to grid
            let snapSizeX = this.paddingX
            let snapSizeY = this.paddingY
            if (stage) {
                let position = {
                    x: 150 + Math.round(stage.x() / snapSizeX) * snapSizeX,
                    y: Math.round(stage.y() / snapSizeY) * snapSizeY
                }
                this.$nextTick(() => {
                    stage!.setPosition(position)
                    this.assemblyStation.position = position
                })
            }
        }

        /**
         * Konva Configurations
         */
        get containerConfig(): ContainerConfig {
            return {
                x: this.assemblyStation.position.x,
                y: this.assemblyStation.position.y,
                rotation: this.angle,
                draggable: true,
            }
        }
        get stationTopBackgroundConfig(): RectConfig {
            return {
                x: 0,
                y: 0,
                fill: this.highlighted ? '#2574ba' : '#00549f',
                width: this.assemblyStation.width,
                height: this.paddingHeight,
                cornerRadius: [this.cornerRadius, this.cornerRadius, this.openingRadius, this.openingRadius]
            }
        }
        get stationBottomBackgroundConfig(): RectConfig {
            return {
                x: 0,
                y: this.assemblyStation.height - this.paddingHeight,
                fill: this.highlighted ? '#2574ba' : '#00549f',
                width: this.assemblyStation.width,
                height: this.paddingHeight,
                cornerRadius: [this.openingRadius, this.openingRadius, this.cornerRadius, this.cornerRadius]
            }
        }
        get driveWayConfig(): RectConfig {
            return {
                x: 0,
                y: 0,
                fill: this.assemblyStation.disabled ? 'gray' : '#e4f0ff',
                width: this.assemblyStation.width,
                height: this.assemblyStation.height,
                cornerRadius: this.cornerRadius
            }
        }
        get statusTextConfig(): TextConfig {
            return {
                text: `${this.assemblyStation.status}`,
                fontFamily: 'Helvetica Neue',
                fontSize: 10,
                fontStyle: 'bold',
                padding: 5,
                fill: 'white',
                align: 'center',
                width: this.assemblyStation.width,
                x: 0,
                y: 0
            }
        }
        get progressTextConfig(): TextConfig {
            let text = ''
            let station = this.assemblyStation
            if (station.activeJobOperation) {
                if (station.status === StationStatus.PROCESSING) {
                    let operation = station.activeJobOperation.operation
                    let progress = station.activeActionProgress
                    text = `${operation.name} - ${progress}%`
                }

            }
            return {
                text: text,
                fontFamily: 'Helvetica Neue',
                fontSize: 7,
                fontStyle: 'bold',
                padding: 5,
                fill: 'white',
                align: 'center',
                width: station.width,
                x: 0,
                y: station.height - this.paddingHeight
            }
        }

        get idTextConfig(): TextConfig {
            return {
                text: String(this.assemblyStation.id).substr(0, 8),
                fontFamily: 'Helvetica Neue',
                fontSize: 22,
                fontStyle: 'bold',
                padding: 5,
                fill: '#b6d6fa',
                align: 'center',
                width: this.assemblyStation.width,
                x: 0,
                y: this.paddingHeight + 12
            }
        }
    }
</script>

<style scoped>

</style>
