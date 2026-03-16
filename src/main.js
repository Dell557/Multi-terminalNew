import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import '@/images/iconfon/iconfont.css'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus/dist/index.full.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
