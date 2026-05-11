import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setupGlobalErrorMonitor, logger } from './utils/logger'

import App from './App.vue'
import router from './router'
import '@/images/iconfon/iconfont.css'
import 'element-plus/dist/index.css'
import '@/style/dark-mode.css'
import ElementPlus from 'element-plus/dist/index.full.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')

setupGlobalErrorMonitor()

logger.info('App', 'Application mounted', {
  environment: import.meta.env.MODE,
  version: '0.0.0'
})

if (window.performance && window.performance.timing) {
  setTimeout(() => {
    logger.recordPageLoad()
  }, 1000)
}
