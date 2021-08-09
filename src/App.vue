<template>
<div id="app">
        <div class="navi">
            <b-navbar toogleable="lg" class="navigation">
                <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
                <b-collapse id="nav-collapse" is-nav>
                    <b-navbar-nav class="ml-auto">    
                        <!--  <b-nav-item><router-link class="nav-link" to="/upload">Data Upload</router-link></b-nav-item>-->
                        <b-nav-item><router-link class="nav-link" to="/">Simulation</router-link></b-nav-item>
                        <b-nav-item><router-link class="nav-link" to="/analytics">Analytics</router-link></b-nav-item>
                        <b-nav-item><router-link class="nav-link" to="/monitoring">Monitoring</router-link></b-nav-item>
                        <b-nav-item><router-link class="nav-link" to="/products">Data Table</router-link></b-nav-item>

 </b-navbar-nav>
                    
                </b-collapse>
            </b-navbar>

         <img :src="wzlLogo" class="logo-WZL"/> 
        
            <!-- Current View -->
<!--            <keep-alive>-->
                <router-view></router-view>
<!--            </keep-alive>-->
        </div>
</div>
</template>
<script lang="ts">
import Vue from "vue"
import {Component} from 'vue-property-decorator'
import { wzlLogo, montageLogo } from "@/config";

@Component
export default class App extends Vue{
    wzlLogo = wzlLogo;
    montageLogo = montageLogo;

}
</script>

<style lang="scss">
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;

        .navigation {
           background-color: black;
            .nav-link {
                color: white;
            }
        }

    }

.logo-WZL {
    width: 400px;
    height: 100px;
    border: solid;
    border-width: 0.5px;
    border-color: lightgrey;
    position: absolute;
    top:0;
    margin-left: -40%;
}
</style>
