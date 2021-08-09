<template>
    <v-group ref="container" :config="containerConfig">
        <konva-station
            @stationClicked="stationSelected(station)"
            v-for="station in stations"
            :key="station.id"
            :assembly-station="station"
            :highlighted="highlightedStationIds.includes(station.id)"
        />
        <!--@mousemove="handleMouseOver"-->
    </v-group>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ContainerConfig } from "konva/types/Container";
import KonvaStation from "@/components/KonvaStation.vue";
import { Dimension } from "@/utils/types/GeometryTypes";
import { AssemblyStation } from "@/utils/types/AssemblyStation";
import { Stage } from "node_modules/konva/types/Stage";

@Component({
    components: {
        KonvaStation
    }
})
export default class Grid extends Vue {
    // Properties
    @Prop({ default: 0 })
    x!: number; // https://github.com/kaorun343/vue-property-decorator/issues/81#issuecomment-364634713
    @Prop({ default: 0 })
    y!: number;
    @Prop({ default: () => [] })
    stations!: AssemblyStation[];
    @Prop({ default: 10 })
    gutter!: number;
    @Prop({ default: () => [] })
    highlightedStations!: AssemblyStation[];
    //scaleBy = 3;

    /*handleMouseOver(e: MouseEvent) {
        let stage = this.getStage();
        let newScale = this.scaleBy;
        stage!.scale({ x: newScale, y: newScale });
    }*/
    getStage(): Stage | null {
        let container = this.$refs.container;
        // @ts-ignore
        return container ? container.getStage() : null;
    }

    get containerConfig(): ContainerConfig {
        return {
            x: this.x,
            y: this.y
        };
    }

    get stage() {
        return {
            x: 100,
            y: 100,
            fill: "yellow"
        };
    }

    /**
     * Emit select event
     * @param station
     */
    stationSelected(station: AssemblyStation) {
        this.$emit("stationSelected", station);
    }

    /**
     * Get ids of highlighted stations
     */
    get highlightedStationIds(): string[] | number[] {
        return this.highlightedStations.map(station => station.id);
    }
    onMouseMove = (event: MouseEvent) => {
        console.log(event);
    };
}
</script>

<style scoped></style>
