import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

import WFCSimpleTiled from '../components/WFCSimpleTiled.vue';
import WFCOverlapping from '../components/WFCOverlapping.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/simple-tiled',
    name: 'WFC-SimpleTiled',
    component: WFCSimpleTiled
  },
  {
    path: '/overlapping',
    name: 'WFC-Overlapping',
    component: WFCOverlapping 
  },
  {
    path: '/',
    redirect: '/simple-tiled'
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;