<template>
 <div class="dataupload">
     <div class="container mt-5">
         <h2 class="mb-3">Upload new configuration file</h2>
         <b-form-group label-for="file-large">
             <b-form-file class="createborder" id="file-large" size="lg" @input="handleFileUpload" placeholder="Choose a file or drop it here..."/>
         </b-form-group>

         <b-form-group label="Assembly Job Representation" v-slot="{ ariaDescribedby }">
             <b-form-radio-group
                 v-model="sim.jobImageUrl"
                 :aria-describedby="ariaDescribedby"
                 name="radios-stacked"
             >
                 <b-form-radio v-for="option in imageOptions" :value="option.value" :key="option.value">    
                  <img :src="option.value" :alt="option.text" height="20px" />  
                   <span class="newbr" />
                  <div v-if = "option.value === sim.jobImageUrl" class="markSelected"></div>  
                 </b-form-radio>
             </b-form-radio-group>
         </b-form-group>
        
        <b-button
                    variant="outline-primary"
                    @click="onClick"
        >
                     Download Empty Configuration Sheet 
                </b-button>
                <br>
                <br>
        <b-button
                    variant="outline-primary"
                    @click="onClick1"
        >
                    Download Sample Configuration Sheet
                </b-button>
      

     </div>
 </div>
</template>

<script lang="ts">
import Vue from "vue"
import {Component, Prop} from 'vue-property-decorator'
import {DataReader} from "@/utils/Reader";
import EventBus from "@/utils/EventBus";
import {simulation as s} from "@/simulation";
import {Simulation} from "@/utils/Simulation";
import {imageOptions, emptyConfigurationFile, sampleConfigurationFile} from "@/config";
import axios from 'axios'

@Component
export default class DataUpload extends Vue{
    /**
     * Handle data upload
     * @param file
     */
    async handleFileUpload(file: File) {
        let reader = new DataReader()
        await reader.readExcelFile(file)
        reader.parseData()
        EventBus.$emit('data-parsed', reader)
    }

    sim: Simulation = s

    imageOptions = imageOptions

    onClick() {
    axios({
        //url: 'http://localhost:8080/data/ConfigurationSheet.xlsm',
        url: emptyConfigurationFile, 
        method: 'GET',
        responseType: 'blob',
    }).then((response) => {
            var fileURL = window.URL.createObjectURL(new Blob([response.data]));
            var fileLink = document.createElement('a');

            fileLink.href = fileURL;
            fileLink.setAttribute('download', 'ConfigurationSheet.xlsm');
            document.body.appendChild(fileLink);

            fileLink.click();
    });
}


    onClick1() {
    axios({
        //url: 'http://localhost:8080/data/ConfigurationSheet.xlsm',
        url: sampleConfigurationFile, 
        method: 'GET',
        responseType: 'blob',
    }).then((response) => {
            var fileURL = window.URL.createObjectURL(new Blob([response.data]));
            var fileLink = document.createElement('a');

            fileLink.href = fileURL;
            fileLink.setAttribute('download', 'ConfigurationSheet.xlsm');
            document.body.appendChild(fileLink);

            fileLink.click();
    });
}

}
</script>
<style scoped>
.markSelected {
  height: 5px !important;
  width: 20px !important;
  background-color: black;
  border-color: black;
    border-style: solid;
    margin-left:2%;
}
.newbr{
    height:10px !important;
    display: block;
}
.createborder {
    border-color: red;
    border-style: solid; 
    border-width: 1.3px;
}

</style>
