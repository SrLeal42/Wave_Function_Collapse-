<template>
  <canvas class="renderCanvas"></canvas>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Run } from '@/scripts/Run';

export default defineComponent({
  name: 'WFC-Overlapping',
  mounted() {
    const canvas = document.querySelector(".renderCanvas") as HTMLCanvasElement;

    const run = new Run(canvas, true);
  }
});
</script>
