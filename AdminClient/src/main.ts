import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'

import './index.css'

import PrimeVuePlugin from './plugins/primevue.js';

const app = createApp(App)

app.use(ConfirmationService) // ← ДОБАВЬ ЭТО
app.use(ToastService)

app.use(createPinia())
app.use(router)
app.use(PrimeVuePlugin)

app.mount('#app')
