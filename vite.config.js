import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3002'

  return {
  plugins: [
    vue(),
    vueDevTools(),
    // 关闭基于 Element Plus 的自动按需导入，使用 full build 全局注册，避免 'element-plus/es' 路径缺失
    AutoImport({}),
    Components({}),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'fuse': ['fuse.js']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    https: false,
    host: true,
    port: 5173,
    allowedHosts: ['testtopic.deepsightfuture.com', 'localhost'],
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (p) => p
      },
      '/feishu-api': {
        target: 'https://open.feishu.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/feishu-api/, '/open-apis'),
      },
    },
  },
}
})
