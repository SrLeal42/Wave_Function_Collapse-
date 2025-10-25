<template>
  <WFC/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import WFC from './components/WFC.vue';

export default defineComponent({
  name: 'App',
  components: {
    WFC
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