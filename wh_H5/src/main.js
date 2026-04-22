import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useThemeStore } from './stores/theme'
import { Lazyload } from 'vant'

// Vant styles are automatically imported by unplugin-vue-components
// But sometimes we might want to import the base style or toast/dialog styles if used functionally
import 'vant/es/toast/style'
import 'vant/es/dialog/style'
import 'vant/es/notify/style'
import 'vant/es/image-preview/style'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.removeItem('filterState')
    } catch {}
  })
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(Lazyload)
const themeStore = useThemeStore(pinia)
themeStore.init()
app.use(router)

// 动态更新页面标题
router.afterEach((to) => {
  const baseTitle = 'wh-h5'
  const pageTitle = to.meta?.title
  document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle
})

app.mount('#app')
