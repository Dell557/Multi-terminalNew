import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import compression from 'vite-plugin-compression'
import { homeCourseTemplates, searchAllCourses, detailCourses, detailOtherCourses, detailCategories } from './src/mock/courses.js'

// Mock 数据
const mockData = {
  '/api/courses/topics': {
    success: true,
    topics: searchAllCourses
  },
  '/api/courses/topics/1': {
    success: true,
    data: detailCourses[0]
  },
  '/api/courses/topics/2': {
    success: true,
    data: { ...detailCourses[0], id: '2', title: '人工智能在医疗影像诊断中的应用' }
  },
  '/api/courses/topics/3': {
    success: true,
    data: { ...detailCourses[0], id: '3', title: '大数据分析与应用' }
  },
  '/api/courses/teacher/1/projects': {
    success: true,
    list: detailOtherCourses
  },
  '/api/courses/categories': {
    success: true,
    data: detailCategories
  }
}

function getMockResponse(path) {
  // 精确匹配
  if (mockData[path]) return mockData[path]

  // 动态匹配
  for (const key of Object.keys(mockData)) {
    if (key.includes(':id') && path.match(key.replace(/:id/g, '[^/]+'))) {
      const mock = mockData[key]
      const id = path.match(key.replace(/:id/g, '([^/]+)'))?.[1]
      return { ...mock, data: { ...mock.data, id } }
    }
  }
  return null
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || `http://127.0.0.1:${env.VITE_API_PORT || 8181}`

  return {
    base: './',
    build: {
      chunkSizeWarningLimit: 600,
      cssCodeSplit: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'vant-vendor': ['vant']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router'],
        resolvers: [VantResolver()],
        dts: false,
        eslintrc: {
          enabled: false
        }
      }),
      Components({
        resolvers: [VantResolver()]
      }),
      // Gzip 压缩
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240,
        deleteOriginFile: false
      }),
      // Brotli 压缩（压缩率更高）
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      }),
      {
        name: 'feishu-bff',
        configureServer(server) {
          const FEISHU_MCP_URL =
            process.env.FEISHU_MCP_URL ||
            'https://mcp.feishu.cn/mcp/mcp_gSPXwo-wAXxG48ndX8g3zCXKkerMJ1Sa0reZXnw1AU0Hh7Dm5JnSnNfGd_IvOysJ4YeoVxxRc0s'
          const FEISHU_MCP_SSE_URL = process.env.FEISHU_MCP_SSE_URL
          const FEISHU_MCP_MESSAGES_URL = process.env.FEISHU_MCP_MESSAGES_URL
          const FEISHU_MCP_AUTH = process.env.FEISHU_MCP_AUTH

          const baseUrl = String(FEISHU_MCP_URL).replace(/\/$/, '')
          const postCandidates = [FEISHU_MCP_MESSAGES_URL, baseUrl].filter(Boolean)

          let nextId = 1
          let sessionId = null
          let tools = null
          let discoveredPostUrl = null

          const sendJson = (res, status, data) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
          }

          const resolvePending = (msg) => {
            const id = msg?.id
            if (id == null) return
            const handler = pending.get(id)
            if (!handler) return
            pending.delete(id)
            handler.resolve(msg)
          }

          const rejectAllPending = (error) => {
            for (const [, handler] of pending) {
              handler.reject(error)
            }
            pending.clear()
          }

          const commonHeaders = () => {
            const headers = {}
            if (sessionId) headers['Mcp-Session-Id'] = sessionId
            if (FEISHU_MCP_AUTH) headers['Authorization'] = FEISHU_MCP_AUTH
            return headers
          }

          const tryDiscoverPostUrl = async () => {
            if (discoveredPostUrl) return discoveredPostUrl
            for (const url of postCandidates) {
              try {
                const resp = await fetch(url, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json', ...commonHeaders() },
                  body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/ping', params: {} }),
                })
                if (resp.ok || resp.status === 400 || resp.status === 405) {
                  discoveredPostUrl = url
                  const sid =
                    resp.headers.get('mcp-session-id') ||
                    resp.headers.get('Mcp-Session-Id')
                  if (sid) sessionId = sid
                  return discoveredPostUrl
                }
              } catch {
                continue
              }
            }
            discoveredPostUrl = postCandidates[0] || baseUrl
            return discoveredPostUrl
          }

          const postMessage = async (message) => {
            const postUrl = await tryDiscoverPostUrl()
            const headers = { 'content-type': 'application/json', ...commonHeaders() }
            const resp = await fetch(postUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(message),
            })
            const sid =
              resp.headers.get('mcp-session-id') ||
              resp.headers.get('Mcp-Session-Id')
            if (sid) sessionId = sid

            const text = await resp.text().catch(() => '')
            if (!text) return null
            try {
              return JSON.parse(text)
            } catch {
              throw new Error(`MCP ${resp.status} ${resp.headers.get('content-type') || ''} ${String(text).slice(0, 200)}`.trim())
            }
          }

          const mcpCall = async (message) => {
            return postMessage(message)
          }

          const ensureMcpReady = async () => {
            if (tools) return

            const init = await mcpCall({
              jsonrpc: '2.0',
              id: nextId++,
              method: 'initialize',
              params: {
                protocolVersion: '2025-06-18',
                capabilities: {},
                clientInfo: { name: 'wh-h5', version: '0.0.0' },
              },
            })

            if (init?.error) throw new Error(init.error?.message || 'MCP initialize failed')

            await mcpCall({
              jsonrpc: '2.0',
              method: 'notifications/initialized',
              params: {},
            })

            const list = await mcpCall({
              jsonrpc: '2.0',
              id: nextId++,
              method: 'tools/list',
              params: {},
            })

            const listTools = list?.result?.tools
            tools = Array.isArray(listTools) ? listTools : []
          }

          const findToolName = (keyword) => {
            const lower = String(keyword).toLowerCase()
            const hit = (tools || []).find((t) =>
              String(t?.name || '').toLowerCase().includes(lower)
            )
            return hit?.name || null
          }

          const callTool = async (name, args) => {
            const result = await mcpCall({
              jsonrpc: '2.0',
              id: nextId++,
              method: 'tools/call',
              params: { name, arguments: args || {} },
            })
            if (result?.error) throw new Error(result.error?.message || 'MCP tool call failed')
            return result?.result
          }

          const unwrapToolResult = (toolResult) => {
            const content = toolResult?.content
            if (!Array.isArray(content) || content.length === 0) return toolResult

            const text = content
              .map((c) => (c?.type === 'text' ? c?.text : ''))
              .filter(Boolean)
              .join('')
            if (!text) return toolResult

            try {
              return JSON.parse(text)
            } catch {
              return { text }
            }
          }

          server.middlewares.use('/bff/feishu/search', async (req, res) => {
            try {
              await ensureMcpReady()
              const url = new URL(req.url, 'http://localhost')
              const query = url.searchParams.get('query') || ''
              const offset = Number(url.searchParams.get('offset') || 0)

              const toolName = findToolName('search-doc') || findToolName('search')
              if (!toolName) {
                sendJson(res, 500, { ok: false, message: 'search tool not found' })
                return
              }

              const result = await callTool(toolName, {
                query,
                page: { offset, size: 20 },
                filters: { sort_rule: 'OPEN_TIME' },
              })

              const payload = unwrapToolResult(result)
              const data = payload?.data || payload
              const docs = data?.docs || data?.documents || data?.items || data?.results || []
              const page_token = data?.page_token || payload?.page_token

              sendJson(res, 200, { ok: true, data: { docs, page_token } })
            } catch (e) {
              sendJson(res, 500, { ok: false, message: e?.message || 'search failed' })
            }
          })

          server.middlewares.use('/bff/feishu/doc', async (req, res) => {
            try {
              await ensureMcpReady()
              const url = new URL(req.url, 'http://localhost')
              const doc_id = url.searchParams.get('doc_id') || ''
              const offset = url.searchParams.get('offset')
              const limit = url.searchParams.get('limit')

              const toolName = findToolName('fetch-doc') || findToolName('fetch')
              if (!toolName) {
                sendJson(res, 500, { ok: false, message: 'fetch tool not found' })
                return
              }

              const args = { doc_id }
              if (offset != null) args.offset = Number(offset)
              if (limit != null) args.limit = Number(limit)

              const result = await callTool(toolName, args)
              const payload = unwrapToolResult(result)
              const data = payload?.data || payload
              const title = data?.title || '飞书文档'
              const markdown = data?.markdown || ''
              const total_length = data?.total_length
              const offsetValue = data?.offset
              sendJson(res, 200, { ok: true, data: { title, markdown, total_length, offset: offsetValue } })
            } catch (e) {
              sendJson(res, 500, { ok: false, message: e?.message || 'fetch failed' })
            }
          })

          server.middlewares.use('/bff/feishu/tools', async (req, res) => {
            try {
              await ensureMcpReady()
              sendJson(res, 200, { ok: true, data: tools })
            } catch (e) {
              sendJson(res, 500, { ok: false, message: e?.message || 'tools failed' })
            }
          })

          server.middlewares.use('/bff/feishu/probe', async (req, res) => {
            const result = { baseUrl, postCandidates }
            try {
              const checks = []
              for (const url of postCandidates) {
                checks.push(
                  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...commonHeaders() }, body: '{}' })
                    .then((r) => ({ url, status: r.status, contentType: r.headers.get('content-type') || '' }))
                    .catch((e) => ({ url, error: e?.message || String(e) }))
                )
              }
              result.checks = await Promise.all(checks)
              sendJson(res, 200, { ok: true, data: result })
            } catch (e) {
              sendJson(res, 500, { ok: false, message: e?.message || 'probe failed', data: result })
            }
          })
        },
      },
    ],
  }
})
