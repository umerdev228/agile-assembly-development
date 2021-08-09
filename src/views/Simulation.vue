<template>
    <div id="simulation" class="mt-5 col-md-12">
        <!-- Simulation Header -->
        <div class="container">
            <!-- Summary widgets -->
            <b-row class="mb-3">
                <b-col
                    ><h4>
                        Active <br />{{ manager.activeJobs.length }}
                    </h4></b-col
                >
                <b-col class="v-divider"
                    ><h4>
                        Waiting <br />{{ manager.waitingJobs.length }}
                    </h4></b-col
                >
                <b-col class="v-divider"
                    ><h4>
                        Completed <br />{{ manager.completedJobs.length }}
                    </h4></b-col
                >
                <b-col class="v-divider"
                    ><h4>
                        Simulation time <br />{{ simulation.time.toFixed(2) }}
                    </h4></b-col
                >
            </b-row>

            <!-- Total job completion progress -->
            <b-progress
                show-value
                :value="manager.completedJobs.length"
                :max="
                    manager.waitingJobs.length +
                        manager.activeJobs.length +
                        manager.completedJobs.length
                "
                class="mb-3"
            />

            <!-- User Actions -->
            <div class="mb-3">
                <img :src="montageLogo" class="logo" />
                
                <b-dropdown :text="`Dispatcher Type`">
                    <b-button 
                        class="dropdown-item"
                        type="button"
                        @click="selectPushDispatcher"
                        >Push Dispatcher
                    </b-button>
                    <b-button
                        class="dropdown-item"
                        type="button"
                        @click="selectPullDispatcher"
                        >Pull Dispatcher
                    </b-button>
                    <b-button
                        class="dropdown-item"
                        type="button"
                        @click="selectScoreDispatcher"
                        >Score Dispatcher
                    </b-button>
                    <b-button
                        class="dropdown-item"
                        type="button"
                        @click="manualDispatching"
                        >Manual Dispatcher
                    </b-button>
                </b-dropdown>

                <b-button
                    variant="success"
                    @click="startSimulation"
                    v-if="!simulation.isRunning"
                    class="ml-2"
                    >Start</b-button
                >
                <b-button
                    variant="danger"
                    @click="stopSimulation"
                    v-else
                    class="ml-2"
                    >Stop</b-button
                >
                <b-button
                    variant="success"
                    @click="startDrySimulation"
                    class="ml-2"
                    :disabled="simulation.isRunning || performingDryRun"
                >
                <span 
                    v-if="!performingDryRun"
                >Dry Run (beta)</span
                >
                <span 
                    v-else>Calculating Results...</span></b-button
                >
                <b-button class="exp ml-2" @click="resetSimulation(false)"
                    >Reset</b-button
                >
                <b-button class="exp ml-2" @click="resetSimulation(true)"
                    >Reset jobs</b-button
                >
                <b-button class="mx-1 primary" @click="unlockJobs"
                    >Unlock jobs</b-button
                >
                <b-button class="mx-1 primary" @click="unlockStations"
                    >Unlock stations</b-button
                >
                <b-button  class="mx-1 primary" @click="accessDocumentation" font-face="Roboto"
                    ><em><b>i</b></em></b-button
                > 
                <b-dropdown 
                    v-model="sim.jobImageUrl" style="margin-left:50px !important;"
                >
                    <b-dropdown-item 
                        v-for="option in imageOptions" :value="option.value" :key="option.value" @click="sim.jobImageUrl = option.value"
                        ><img :src="option.value" :alt="option.text" height="20px" /></b-dropdown-item
                    ></b-dropdown
                >
                <b-button class="exp ml-2" @click="exp">Export layout</b-button> 
            </div>

           
            <div 
                class="d-flex justify-content-center pt-5"
            >
                <div 
                    class="intervalmanual" v-if="!manager.autodispatched"
                >
                    <b-button
                        @click="dispatchJob"
                        class="mx-2 outlineprimary"     
                    >Dispatch Job</b-button
                    >
                </div>

                <div 
                    class="intervalpush" v-if="action === `Push Dispatcher`"
                >
                    <label>Select Interval</label
                    >
                    <b-form-input
                        v-model="interval"
                        type="number"
                        step="1"
                        min="10"
                    ></b-form-input>
                    <br>
                </div>

                <div
                    class="intervalpush"
                    v-if="action === `Score Dispatcher`"
                >
                    <div 
                        style="width:150px;margin-left:-220px"
                    >
                        <label>asCaCards</label
                        >
                        <b-form-input
                            v-model="asCaCards"
                            type="number"
                            step="10"
                            min="10"
                        ></b-form-input>
                    </div>
                        
                    <div 
                        style ="width:150px;margin-top:-70px;margin-left:-30px"
                    >
                        <label>sizeVolumeCycle</label
                        >
                        <b-form-input
                            v-model="sizeVolumeCycle"
                            type="number"
                            step="10"
                            min="0"
                        ></b-form-input>
                    </div>

                    <div 
                        style ="width:150px;margin-top:-70px;margin-left:140px"
                    >
                        <label>weightFactorWorkloadScore</label
                        >
                        <b-form-input
                            style="margin-left:25px"
                            v-model="weightFactorWorkloadScore"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                        ></b-form-input>
                    </div>

                    <div 
                        style ="width:150px;margin-top:-70px;margin-left:350px"
                    >
                        <label>weightFactorDueDateScore</label
                        >
                        <b-form-input
                            style="margin-left:25px"
                            v-model="weightFactorDueDateScore"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                        ></b-form-input>
                    </div>

                    <div 
                        style ="width:150px;margin-top:-40px;margin-left:500px"
                    >
                        <b-button class="mx-2 outlineprimary" @click="applyScoreDispatcher">Apply</b-button>
                    </div>
                </div>

                <div
                    class="intervalpull d-flex align-items-end"
                    v-if="action === `Pull Dispatcher`"
                >
                    <div style="margin-bottom:10px;">
                        <label>Factor</label
                        >
                        <b-form-input
                            style="width:100px"
                            v-model="factor"
                            type="number"
                            step="0.5"
                            min="0.5"
                        ></b-form-input>
                    </div>
                    <br>
                    <p style="width:200px;margin-top:-30px;">Number of jobs: {{ manager.assemblyStations.length * factor }}</p>
                </div>
            </div>

            <!-- Speed -->
            <div class="row align-items-center mb-3">
                <div class="col">
                    <label>Speed: {{ simulation.speed }}</label
                    >
                    <b-form-input
                        v-model="simulation.speed"
                        class="range"
                        type="range"
                        min="3"
                        step="2"
                        max="40"  
                    ></b-form-input>
                </div>
            </div>


            <!-- Quick Stats -->
            <p class="mb-0">
                <span
                    >Number of stations:
                    {{ manager.assemblyStations.length }}</span
                >
                •
                <span>Total Utilization Rate: {{ Number(overallUtilization).toFixed(2) }}</span>
                &nbsp;
                <b-button class="mx-1 outlineprimary" @click="bigger"
                    >+</b-button
                >
                <b-button
                    class="mx-1 outlineprimary"
                    @click="smaller"
                    >-</b-button
                >
                <b-button class="mx-1 outlineprimary" @click="reset"
                    >reset</b-button
                >
            </p>

            <!-- Documentation window -->
            <div 
                class="confirm" v-if="infoFlag === true"
            >
                <div 
                    class="confirm__window"
                >
                <div 
                    class="confirm__buttons"
                >
                    <b-button 
                        class="primary" @click="closeDocumentation"
                        >X</b-button
                    >
                </div>

                <div 
                    class="confirm__content"
                >
                    <b-table-simple 
                        hover small caption-top  class="borderless" style="borders:0px !important;"
                    >
                        <b-thead 
                            head-variant="dark"></b-thead
                        >
                        <b-tbody
                        >
                            <b-tr style="border:0px !important;">
                                <b-th style="border:0px !important; margin-left:50px !important; width:300px !important;">Dispatch Job</b-th>
                                <b-td class="text-left" style="border:0px !important">Der erste wartende Auftrag (Job) wird in die Montage-Umgebung freigegeben.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Manual Dispatcher</b-th>
                                <b-td class="text-left">Aufträge können manuell durch “Dispatch Job“ freigegeben werden.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Push Dispatcher</b-th>
                                <b-td class="text-left">Aufträge werden im gegebenen (bearbeitbaren) Intervall automatisch freigegeben.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Pull Dispatcher</b-th>
                                <b-td class="text-left">Eine Anzahl an Aufträgen gleich den Faktor <span>&#215;</span>
                                Anzahl an Stationen - Anzahl an aktiven Aufträgen wird abhängig des gegebenen (bearbeitbaren) Faktor automatisch freigegeben.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Score Dispatcher</b-th>
                                <b-td class="text-left">Eine Anzahl an Aufträgen gleich bis zur Hälfte der wartenden Aufträgen und mit der Eigenschaft, dass die Summe von (Quantität <span>&#215;</span> Anzahl an Operationen) aller Produkten kleiner gleich den Anzahl an Assembly-Capacity-Karten (asCaCards) ist, wird automatisch freigegeben.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Start</b-th>
                                <b-td class="text-left">Die Simulation wird gestartet.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Dry Run</b-th>
                                <b-td class="text-left">Die Aufträge werden zu Ende laufen gelassen ohne die Simulation durchzuführen.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Reset</b-th>
                                <b-td class="text-left">Die Simulation wird zum ursprünglichen Zustand zurückgesetzt.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Reset jobs</b-th>
                                <b-td class="text-left">Die Aufträge werden zum ursprünglichen Zustand zurückgesetzt.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Unlock jobs</b-th>
                                <b-td class="text-left">Gesperrte Aufträge werden entsperrt nur wenn die benötigten Änderungen (z.B. Bearbeitung der Modulen der Stationen) gemacht wurden, um diese ausführbar zu machen.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Unlock stations</b-th>
                                <b-td class="text-left">Stationen werden entsperrt. Diese Funktion kann benutzt werden, wenn Aufträge in oder vor dem Station stehengeblieben sind.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;"> <b-icon icon="caret-down-fill" aria-hidden="true"></b-icon></b-th>
                                <b-td class="text-left">Die visuelle Darstellung der Aufträgen wird gewählt.</b-td>
                            </b-tr>
                            
                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">Export Layout</b-th>
                                <b-td class="text-left">Eine Excel-Datei mit den Namen, den Modulen, und den Koordinaten der Stationen wird exportiert.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">(Zoom) +</b-th>
                                <b-td class="text-left">Die Sehensgröße der Simulation wird verdoppelt.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">(Zoom) -</b-th>
                                <b-td class="text-left">Die Sehensgröße der Simulation wird halbiert.</b-td>
                            </b-tr>

                            <b-tr style="border:0px !important">
                                <b-th style="border:0px !important;">(Zoom) reset</b-th>
                                <b-td class="text-left">Die Sehensgröße der Simulation wird zurückgesetzt.</b-td>
                            </b-tr></b-tbody
                        >
                    </b-table-simple>
                </div>
                </div>
            </div>
        </div>

    <!-- Simulation Canvas - different zooming applied -->   
        <div
            v-if="zoomIn == false && zoomOut == false"
            id="konva-container"
            style="border: 1px dashed lightgray; border-radius: 8px; width: windowWidth"
            class="mt-3"
        >
            <v-stage ref="stage" :config="konvaConfig">
                <!-- Vehicle layer -->
               <v-layer ref="vehicles" :config="vehicleLayerConfig"> 
                    <konva-vehicle
                        v-for="job in manager.activeJobs"
                        :key="job.id"
                        :job="job"
                        :image-url="simulation.jobImageUrl"
                        ref="chassis"
                    />
               </v-layer> 
                <!--   <v-layer>
        <v-circle :config="{radius: 30, fill: 'yellow', x: 50, y: 50}" />
        </v-layer>  -->
                <!-- Assembly Station Layer -->
                <v-layer ref="stations" :config="stationLayerConfig">
                    <grid :stations="manager.assemblyStations" />
                </v-layer>
                <v-layer ref="gridLayer">
                    <!-- Inspiration for grid: https://codepen.io/pierrebleroux/pen/gGpvxJ -->
                </v-layer>
            </v-stage>
        </div>

        <div
            v-if="zoomIn == true && zoomOut == false"
            id="konva-container2"
            style="border: 1px dashed lightgray; border-radius: 8px;"
            class="mt-3"
            ref="myDiv"
        >
            <v-stage ref="stage" :config="konvaConfig">
                <v-layer ref="vehicles" :config="vehicleLayerConfig">
                    <konva-vehicle
                        v-for="job in manager.activeJobs"
                        :key="job.id"
                        :job="job"
                        :image-url="simulation.jobImageUrl"
                        ref="chassis"
                    />
                </v-layer>
                
                <v-layer ref="stations" :config="stationLayerConfig">
                    <grid :stations="manager.assemblyStations" />
                </v-layer>
                <v-layer ref="gridLayer">
                </v-layer>
            </v-stage>
        </div>

        <div
            v-if="zoomIn == false && zoomOut == true"
            id="konva-container3"
            style="border: 1px dashed lightgray; border-radius: 8px;"
            class="mt-3"
        >
            <v-stage ref="stage" :config="konvaConfig">
                <v-layer ref="vehicles" :config="vehicleLayerConfig">
                    <konva-vehicle
                        v-for="job in manager.activeJobs"
                        :key="job.id"
                        :job="job"
                        :image-url="simulation.jobImageUrl"
                        ref="chassis"
                    />
                </v-layer>
                
                <v-layer ref="stations" :config="stationLayerConfig">
                    <grid :stations="manager.assemblyStations" />
                </v-layer>
                <v-layer ref="gridLayer">
                </v-layer>
            </v-stage>
        </div>
    </div>
</template>

<!--
Available Konva Components:
v-rect, v-circle, v-ellipse, v-line, v-image, v-text, v-text-path, v-star, v-label, v-path, v-regular-polygon
-->
<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import KonvaVehicle from "@/components/KonvaVehicle.vue";
import KonvaStation from "@/components/KonvaStation.vue";
import { Stage, StageConfig } from "konva/types/Stage";
import { LayerConfig } from "konva/types/BaseLayer";
import Grid from "@/components/Grid.vue";
import { AssemblyStation, StationModule } from "@/utils/types/AssemblyStation";
import { Simulation } from "@/utils/Simulation";
import { Manager } from "@/utils/Manager";
import { Operation, Product } from "@/utils/Product";
import { AssemblyJob } from "@/utils/types/AssemblyJob";
import { source } from "@/config";
import { manager, simulation, analytics } from "@/simulation";
import { PullDispatcher } from "@/utils/PullDispatcher";
import { PushDispatcher } from "@/utils/PushDispatcher";
import XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ScoreBasedPullDispatcher } from "@/utils/ScoreBasedPullDispatcher";
import { Analytics } from "@/utils/Analytics";
import { wzlLogo, montageLogo } from "@/config";
import {simulation as s} from "@/simulation";
import {imageOptions} from "@/config";
/**
 * Move along path
 * @link: https://stackoverflow.com/questions/53330168/animate-a-shape-along-a-line-or-path-in-konva
 */

@Component({
    components: {
        Grid,
        KonvaVehicle,
        KonvaStation
    }
})
export default class S extends Vue {
    products: Product[] = []
    manager: Manager = manager
    analytics: Analytics = analytics
    simulation: Simulation = simulation
    factor = 0.5
    interval = 50
    asCaCards = 90
    sizeVolumeCycle = 10
    weightFactorWorkloadScore= 0.5
    weightFactorDueDateScore = 0.5
    performingDryRun = false
    action = "Manual Dispatcher"
    wsdata1: { id: string; modules: string; x: number; y: number }[] = []
    wsdata: string[][] = []
    montageLogo = montageLogo
    wzlLogo = wzlLogo
    zoomIn = false
    zoomOut = false
    infoFlag = false
    sim: Simulation = s
    imageOptions = imageOptions

    accessDocumentation() {
        this.infoFlag = true
    }

    closeDocumentation() {
        this.infoFlag = false
    }

    bigger() {
        this.zoomIn = true;
        if(this.zoomOut ===true) {
            this.zoomIn = false
            this.zoomOut = false
        }
    }

    smaller() {
        this.zoomOut = true;
        if(this.zoomIn ===true) {
            this.zoomIn = false
            this.zoomOut = false
        }
    }

    reset() {
        this.zoomOut = false;
        this.zoomIn = false;
    }

    get overallUtilization() {
        let sum = 0;
        for (let station of this.manager.assemblyStations) {
            sum +=
                station.setupTime + station.processTime + station.followupTime;
        }
        if (this.manager.simulation.time === 0) return 0;
        return (
            (100 * sum) /
            (this.manager.simulation.time *
                this.manager.assemblyStations.length)
        ).toFixed(2);
    }

    s2ab(s: any) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
    }

    /**
     * Create excel file with the layout of stations
     */
    exp() {
        let workbook1 = XLSX.utils.book_new();
        workbook1.SheetNames.push("Station Layout");
        for (let station of this.manager.assemblyStations) {
            let labels = station.modules.map(module => module.label).join(", ");
            this.wsdata1.splice(this.wsdata1.length, 0, {
                id: station.id.slice(0, 8),
                modules: labels,
                x: station.position.x,
                y: station.position.y
            });
        }
        this.wsdata = this.wsdata1.map(({ id, x, y, modules }) => [
            id,
            modules,
            x.toString(),
            y.toString()
        ]);
        this.wsdata = [["Station", "Modules", "X", "Y"]].concat(this.wsdata);
        workbook1.Sheets["Test Sheet"] = XLSX.utils.aoa_to_sheet(this.wsdata);
        let wbout1 = XLSX.write(workbook1, {
            bookType: "xlsx",
            type: "binary"
        });
        saveAs(
            new Blob([this.s2ab(wbout1)], { type: "application/octet-stream" }),
            "Data.xlsx"
        );
    }

    @Watch("interval") onIntervalChanged(newValue: number) {
        if (this.manager.dispatcher instanceof PushDispatcher) {
            this.manager.dispatcher.interval = Number(newValue);
        }
    }

    @Watch("factor") onFactorChanged(newFactor: number) {
        //this.factor = newFactor;
        if (this.manager.dispatcher instanceof PullDispatcher) {
            this.manager.dispatcher.factor = Number(newFactor);
        }
        this.selectPullDispatcher()
    }

    @Watch("asCaCards") onCardsChanged(newValue: number) {
        if(this.action = "Score Dispatcher") {
            this.asCaCards = Number(newValue);
        }
    } 

    @Watch("sizeVolumeCycle") onSizeChanged(newValue: number) {
        if(this.action = "Score Dispatcher") {
            this.sizeVolumeCycle = Number(newValue);
        }
    }

    @Watch("weightFactorWorkloadScore") onWorkloadChanged(newValue: number) {
        if(this.action = "Score Dispatcher") {
            this.weightFactorWorkloadScore = Number(newValue);
        }
    }

    @Watch("weightFactorDueDateScore") onDueDateChanged(newValue: number) {
        if(this.action = "Score Dispatcher") {
            this.weightFactorDueDateScore = Number(newValue);
        }
    }

    selectPullDispatcher() {
        //if(this.manager.activeJobs.length !== 0)
        //    this.resetSimulation(true)
        this.action = "Pull Dispatcher";
        this.manager.dispatcher = new PullDispatcher(this.manager, this.factor);
        this.manager.autodispatched = true;
    }

    applyScoreDispatcher() {
        if(this.action === 'Score Dispatcher')
        this.manager.dispatcher = new ScoreBasedPullDispatcher(
            this.manager,
            this.asCaCards,
            this.sizeVolumeCycle,
            this.weightFactorWorkloadScore,
            this.weightFactorDueDateScore
        );
    }

    selectScoreDispatcher() {
        if(this.manager.activeJobs.length !== 0)
            this.resetSimulation(true)
        this.action = "Score Dispatcher";
        // TODO: possibly include in the configuration if a job is of type Rush Job (connect to isRushJob from AssemblyJob.ts)
      /*  this.manager.dispatcher = new ScoreBasedPullDispatcher(
            this.manager,
            90,
            10,
            0.5,
            0.5
        );
        */
        this.manager.autodispatched = true;
    }

    selectPushDispatcher() {
        this.action = "Push Dispatcher";
        if(this.manager.activeJobs.length !== 0)
            this.resetSimulation(true)
        this.manager.dispatcher = new PushDispatcher(
            this.manager,
            this.interval
        );
        this.manager.autodispatched = true;
    }

    manualDispatching() {
        this.action = "Manual Dispatcher";
        this.manager.dispatcher = null;
        this.manager.autodispatched = false;
    }

    created() {
        if(this.manager.changedProducts === true) {
            this.manager.waitingJobs = []
            this.manager.activeJobs= []
            this.manager.completedJobs= []
            this.simulation.reset()
            this.manager.resetJobs()
            this.analytics.init();
            this.manager.changedProducts = false
        }
        if (this.manager.assemblyStations.length === 0) {
            this.addDefaultData();
        }
    }

    mounted() {
        if (this.vehicleLayer) {
            this.vehicleLayer.moveToTop();
        }
    }
   

    /**
     * Generate default simulation data
     */
    addDefaultData() {
        let multiplier = 4;
        // create modules
        let robbi = new StationModule("Roboter");
        let electric = new StationModule("Elektronik");
        let drill = new StationModule("Akkuschrauber");
        // this.$store.commit("addModule",robbi)
       
        // create operations
        let floor = new Operation("Boden montieren", 10, 5, 5, [robbi]);
        let cables = new Operation("Kabelstrang montieren", 30, 8, 6, [
            electric
        ]);
        let leftDoor = new Operation("Linke Tür montieren", 40, 0, 0, [drill]);
        let rightDoor = new Operation("Rechte Tür montieren", 40, 5, 0, [
            robbi
        ]);
        let spoiler = new Operation("Spoiler montieren", 20, 10, 0, [drill]);

        // setup constraints
        floor.requireOperation(cables);
        spoiler.requireOperation(leftDoor);
        spoiler.requireOperation(rightDoor);

        //  this.$store.commit("addOperation",floor)

        // create products
        let product1 = new Product("S-Klasse", [
            floor,
            cables,
            leftDoor,
            rightDoor
        ],0);
        let product2 = new Product("A-Klasse", [leftDoor, rightDoor, spoiler],0);
        //  this.$store.commit("addProduct",product1)

        // create stations
        for (let i = 0; i < multiplier; i++) {
            let y = i * 200;
            let station1 = new AssemblyStation([drill], "S" + (i * 4 + 1), {
                x: 150,
                y: y
            });
            let station2 = new AssemblyStation(
                [electric, robbi],
                "S" + (i * 4 + 2),
                { x: 550, y: y }
            );
            let station3 = new AssemblyStation([robbi], "S" + (i * 4 + 3), {
                x: 950,
                y: y
            });
            let station4 = new AssemblyStation(
                [electric, drill],
                "S" + (i * 4 + 4), 
                { x: 1350, y: y }
            ); 
            let assemblyStations = [station1, station2, station3, station4];
            assemblyStations.forEach(this.manager!.registerAssemblyStation);
        }

        for (let i = 0; i < (multiplier * 10)/2; i++) {
            let job = new AssemblyJob(null, product1, source);
            product1.quantity++
            this.manager!.addJob(job);
        }

        for (let i = 0; i < (multiplier * 10)/2; i++) {
            let job = new AssemblyJob(null, product2, source);
            product2.quantity++
            this.manager!.addJob(job);
        }
    }

    /**
     * Reset simulation (jobs=false) or only jobs (jobs=true)
     */
    resetSimulation(jobs: boolean) {
        this.manager.reset(jobs);
        this.analytics.init();
        // reset simulation parameters to initial
        this.action = "Manual Dispatcher"
        this.manager.dispatcher = null;
        this.manager.autodispatched = false;
        this.factor = 0.5
        this.interval = 50
        this.asCaCards = 90
        this.sizeVolumeCycle = 10
        this.weightFactorWorkloadScore= 0.5
        this.weightFactorDueDateScore = 0.5
        this.performingDryRun = false 
        if(jobs === false) {
            this.zoomIn = false
            this.zoomOut = false
        }
        this.infoFlag = false
        // the uploaded data is from an excel file or default
        if(this.manager.default === false && jobs === false) { 
           this.manager.resetDoc();
        } else {
            if(this.manager.default === true) {
                if(jobs === false)
                    this.addDefaultData();
            }
        }
        if (this.vehicleLayer) {
            this.vehicleLayer.moveToTop();
        }
    }

    unlockJobs() {
        if(this.simulation.isRunning)
            for (let ij of this.manager.activeJobs) 
                if(ij.infeasible === true) {
                    ij.prepareNextOperation().then()
                }
    }

    unlockStations() {
        for(let station of this.manager.assemblyStations)
            station.evaluateQueue()
    }


    /**
     * Main konva canvas config
     */
    get konvaConfig(): StageConfig {
        return {
            x: 0,
            y: 0,
            offsetX: -100,
            offsetY: -100,
            width: window.innerWidth,
            height: window.innerHeight,
            container: "konva-container",
            draggable: true
        };
    }

    /**
     * Vehicle Layer konva stage api
     */
    get vehicleLayer(): Stage | null {
        let layer = this.$refs.vehicles;
        // @ts-ignore
        return layer ? layer.getStage() : null;
    }

    /**
     * Vehicle Layer config
     */
    get vehicleLayerConfig(): LayerConfig {
        return {};
    }
 

    /**
     * Station Layer config
     */
    get stationLayerConfig(): LayerConfig {
        return {};
    }

    checkInfeasible(job: AssemblyJob) {
        for(let op of job.product.operations) {
            for(let mod of op.requiredModules) {
                this.manager.getRequiredModules()
            let index = this.manager.requiredModules.findIndex(m => m.label === mod.label)
                if(index === -1) {
                    return true
                }   
            }
        }
        return false
    }

    /**
     * Control simulation
     */
    startSimulation() {
        for(let job of this.manager.waitingJobs)
            if(this.checkInfeasible(job) === true)
                {
                    alert('Infeasible Jobs')
                    return
                }
        /*  if(this.action === 'Score Dispatcher') {
            this.manager.dispatcher = new ScoreBasedPullDispatcher(
            this.manager,
            this.asCaCards,
            this.sizeVolumeCycle,
            this.weightFactorWorkloadScore,
            this.weightFactorDueDateScore
        )
        } */
        this.simulation.startSimulation();
    }

    stopSimulation() {
        this.simulation.stopSimulation();
    }

    startDrySimulation() {
        this.performingDryRun = true;
        this.simulation.performDryRun().then(() => {
            this.performingDryRun = false;
        });
    }

    /**
     * Dispatch new job from waiting to active
     */
    dispatchJob() {
        if (this.manager!.waitingJobs.length > 0) {
            this.manager!.dispatchJob(this.manager!.waitingJobs[0]);
        }
    }
}
</script>

<style lang="scss" scoped>
#simulation {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
#konva-container2 {
    zoom: 2;
}
#konva-container3 {
    zoom: 0.5;
}

.logo {
    width: 220px;
    height: 200px;
    margin-left: -300px;
    margin-top: -150px;
}

.intervalpull {
    width: 200px;
    height: 75px;
    margin-top:-40px;
}

.intervalpush {
    width: 200px;
    height: 75px;
    margin-top:-50px;
    margin-bottom:10px;
}

.intervalscore {
    width: 200px;
    height: 75px;
    margin-bottom:-40px;
}

.intervalmanual {
    width: 200px;
    height: 75px;
    margin-top:-30px;
    margin-bottom: -10px;
    margin-left: -30px;
}

.b-table {
    border: none;
    border-collapse: collapse;
}

.b-table .b-td {
    border-left: 1px solid #000;
}

.b-table .b-td:first-child {
    border-left: none;
}

.v-divider {
    margin-left: 5px;
    margin-right: 5px;
    width: 1px;
    height: 100%;
    border-left: 1px solid gray;
}

.confirm {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  padding: 10px;
  box-sizing: border-box;
  opacity: 0;
  animation-name: confirm---open;
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index:1
}

@keyframes confirm---open {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes confirm__window---open {
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.confirm__window {
  height: 680px;
  max-width: 1000px;
  background: white;
  font-size: 14px;
  font-family: "Noto Sans", sans-serif;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  text-align: justify;
  opacity: 0;
  transform: scale(0.75);
  animation-name: confirm__window---open;
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
  animation-delay: 0.2s;
}

.confirm__content {
  line-height: 25px;
  padding-left: 15px;
  padding-bottom: 40px;
  margin-top:-25px;
}

.confirm__buttons {
  background: white;
  display: flex;
  justify-content: flex-end;
}

.primary {
    background-color:#00549f !important;
}

.outlineprimary {
    color:#00549f !important;
    background-color: white;
    border-color:#00549f !important;

}
.outlineprimary:hover {
    color: white !important;
    background-color:#00549f !important;
    border-color:#00549f !important;
}
.range {
    background-color: black !important;

}
.text-left {
    border:0px !important;
}


</style>
