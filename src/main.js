import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import '@/images/iconfon/iconfont.css'
import ElementPlus from '../node_modules/element-plus/dist/index.full.js'
import '../node_modules/element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
