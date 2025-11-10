import { createApp } from 'vue'
import App from './App.vue'
import router from './router' ; // <-- 1. Importe o router

// Crie a app
const app = createApp(App);

app.use(router); // <-- 2. Diga ao Vue para usar o router
app.mount('#app');