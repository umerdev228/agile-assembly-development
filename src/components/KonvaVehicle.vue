<template>
    <v-group ref="container" :config="containerConfig">
        <v-circle :config="{ x: 0, y: 0, fill: 'grey', radius: 5 }"></v-circle>
        <v-image ref="chassis" v-if="imagesLoaded" :config="chassisImage">
        </v-image>
        <v-text :config="jobIdTextConfig" />
        <v-text :config="jobIdTextConfig2" />

    </v-group>
</template>

<script lang="ts">
import Vue from "vue";
import { loadImage } from "@/utils/MediaHelpers";
import { Stage } from "konva/types/Stage";
import { ImageConfig } from "konva/types/shapes/Image";
import { CircleConfig } from "konva/types/shapes/Circle";
import { Component, Prop, Watch } from "vue-property-decorator";
import { ContainerConfig } from "konva/types/Container";
import { Coordinate, Dimension } from "@/utils/types/GeometryTypes";
import { AssemblyJob } from "@/utils/types/AssemblyJob";
import { chassisWidth, chassisHeight } from "@/config";
import Konva from "konva";
import TextConfig = Konva.TextConfig;

type Dictionary = { [key: string]: any };

@Component
export default class KonvaVehicle extends Vue {
    // Data property
    imagesLoaded: boolean = false;
    assets: string[] = [];
    images: { [key: string]: HTMLImageElement } = {};
    scaleBy = 2;
    offset: Coordinate = {
        x: 0,
        y: 0
    };
    vehicleDimensions: Dimension = {
        width: 0,
        height: 0
    };
    redCircle: CircleConfig = {
        x: 150,
        y: 450,
        radius: 70,
        fill: "red",
        stroke: "black",
        strokeWidth: 4
    };

    get x() {
        return this.job.position.x;
    }

    get y() {
        return this.job.position.y;
    }

    get angle() {
        return this.job.position.angle;
    }

    // Properties
    @Prop({ default: chassisWidth })
    chassisWidth!: number;
    @Prop({ default: chassisHeight })
    chassisHeight!: number;
    @Prop({ required: true })
    job!: AssemblyJob;
    @Prop({ required: true })
    imageUrl!: string;

    // Lifecycle hook
    async beforeMount() {
        await this.onImageUpdate(this.imageUrl);
    }

    // handle image update
    @Watch("imageUrl")
    async onImageUpdate(newImage: string, oldImage?: string) {
        this.imagesLoaded = false;
        try {
            let images = await this.loadImages([newImage]);
            this.images[newImage] = images[0];
            this.imagesLoaded = true;
        } catch (e) {
            console.log(e);
        }
    }

    // register stage after mount
    mounted() {
        let stage = this.getStage();
        if (stage) {
            this.job.registerKonvaStage(stage);
        }
    }

    /**
     * Load all required assets
     */
    loadImages(paths: string[]): Promise<HTMLImageElement[]> {
        let promises = [];
        for (let url of paths) {
            promises.push(loadImage(url, false));
        }
        return Promise.all(promises);
    }
    /**
     * Expose Konva getState method
     */
    getStage(): Stage | null {
        let container = this.$refs.container;
        // @ts-ignore
        return container ? container.getStage() : null;
    }

    get imageStage(): Stage | null {
        let image = this.$refs.chassis;
        // @ts-ignore
        let imageStage = image ? image.getStage() : null;
        return imageStage;
    }

    get chassisImage(): ImageConfig {
        let width = this.images[this.imageUrl].width;
        let height = this.images[this.imageUrl].height;
        let scale = this.chassisHeight / height;

        // calculate rotation around center
        const degToRad = Math.PI / 180;
        const rotatePoint = ({ x, y }: Coordinate, deg: number): Coordinate => {
            const rcos = Math.cos(deg * degToRad),
                rsin = Math.sin(deg * degToRad);
            return { x: x * rcos - y * rsin, y: y * rcos + x * rsin };
        };
        //current rotation origin (0, 0) relative to desired origin - center (node.width()/2, node.height()/2)
        const topLeft: Coordinate = {
            x: (-width / 2) * scale,
            y: (-height / 2) * scale
        };
        const current = rotatePoint(topLeft, 0);
        const rotated = rotatePoint(topLeft, -90);
        const dx = rotated.x - current.x,
            dy = rotated.y - current.y;

        return {
            x: topLeft.x + dx,
            y: topLeft.y + dy,
            draggable: false,
            scaleX: scale * (this.job.position.flippedX ? -1 : 1),
            scaleY: scale * (this.job.position.flippedY ? -1 : 1),
            image: this.images[this.imageUrl],
            rotation: -90,
            offsetX: this.job.position.flippedX ? width : 0
        };
    }
    get containerConfig(): ContainerConfig {
        return {
            zIndex: 2,
            x: this.x,
            y: this.y,
            rotation: this.angle,
            offset: this.offset,
        };
    }

    get jobIdTextConfig(): TextConfig {
        return {
            text: String(this.job.id).substr(0, 8),
            fontFamily: "Helvetica Neue",
            fontSize: 12,
            fontStyle: "bold",
            padding: 5,
            fill: "black",
            align: "left",
            width: this.chassisWidth,
            rotation: -90,
            x: -20,
            y: 27
        };
    }
     get jobIdTextConfig2(): TextConfig {
        return {
            text: this.job.infeasible? "infeasible" : '',
            fontFamily: "Helvetica Neue",
            fontSize: 12,
            fontStyle: "bold",
            padding: 20,
            fill: this.job.infeasible? "red" : "black",
            align: "left",
            width: 2*this.chassisWidth,
            rotation: -90,
            x: -20,
            y: 40
        };
    }
}
</script>

<style scoped></style>
