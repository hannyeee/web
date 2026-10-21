import { createApp } from 'vue'
import App from './stores/App.vue'
import router from './router'
import './style.css'

createApp(App).use(router).mount('#app')
