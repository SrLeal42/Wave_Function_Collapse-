<template>
  <div id="nav">
    <router-link to="/simple-tiled">Simple Collapse WFC</router-link> |
    <router-link to="/overlapping">Overlapping WFC</router-link>
  </div>
  
  <router-view/>
</template>

<style>
html, body {
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#nav {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 100;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
}

#nav a {
  font-weight: bold;
  color: #fff;
  text-decoration: none;
}

#nav a.router-link-exact-active {
  color: #42b983; /* Cor de "ativo" do Vue */
}
</style>

<!--
<template>
  <WFCSimpleTiled/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WFCSimpleTiled from './components/WFCSimpleTiled.vue';

export default defineComponent({
  name: 'App',
  components: {
    WFCSimpleTiled
  }
});
</script>

<style>
html, body {
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
-->