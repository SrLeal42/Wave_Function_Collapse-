<template>
  <div class="placeholder-container">
    <h1>Página do WFC Overlapping</h1>
    <p>Este componente irá conter o algoritmo de Overlapping WFC.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'WFC-Overlapping',
  mounted() {
    console.log("Página Overlapping Montada!");
    // Futuramente, você pode carregar um 'RunOverlapping.ts' aqui
  }
});
</script>

<style scoped>
.placeholder-container {
  padding: 40px;
  text-align: center;
  color: white;
}
</style>