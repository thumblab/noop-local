<template>
  <div id="app">
    <div id="top" class="container-fluid">
      <div id="header" class="row">
        <div id="logo" class="col-auto text-left" @click="$router.push('/')">
          <img alt="Rearc logo" src="./assets/logo_darkbackground.png" class="logo">
        </div>
        <div id="title" class="col text-left">
          noop local inspector
        </div>
        <div class="coll text-right">
          <ChangesIndicator />
        </div>
      </div>
      <div id="spacer"></div>
    </div>
    <b-container fluid id="main">
      <router-view/>
    </b-container>
    <div class="background"></div>
  </div>
</template>

<script>
import ChangesIndicator from '@/components/ChangesIndicator.vue'

export default {
  components: {
    ChangesIndicator
  }
}
</script>

<style>
html, body, #app {
  height: 100%;
}

#main {
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 15px;
}

body {
  background-color: #f6f8fa !important
}

#spacer {
  background-color: #000;
  color: #fff;
  padding: 3px 0;
  margin: 0 -15px;
  height: 10px;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#main {
  padding-top: 16px;
}

.background {
  content: "";
  background: url("./assets/main_back.jpg");
  background-repeat: repeat;
  opacity: 0.5;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  position: absolute;
  z-index: -1;
}

#app a {
  /* color: #0091ff; */
}

#header {
  background: url("./assets/header_back.jpg") repeat;
}

#title {
  font-size: 2.7em;
  font-weight: bold;
  color: #E5F8FF;
  padding: 0 6px 0 0;
  margin-top: -3px;
}

.logo {
  max-height: 28px;
  margin: 17px 0 12px;
  cursor: pointer;
}

.full {
  height: 100%;
}

.flexrow {
  position: absolute;
  bottom: 0;
  top: 75px;
  left: 15px;
  right: 15px;
}

.flex {
  display: flex;
  flex-flow: column;
}

.grow {
  flex-grow: 1;
}
</style>
