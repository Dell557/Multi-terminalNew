import express from 'express'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const app = express()

// 请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now()
  const startMemory = process.memoryUsage()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const memoryUsage = process.memoryUsage()
    const memoryDiff = {
      heapUsed: memoryUsage.heapUsed - startMemory.heapUsed,
      heapTotal: memoryUsage.heapTotal - startMemory.heapTotal
    }
    
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      memoryChange: {
        heapUsed: `${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)}MB`
      },
      ip: req.ip || req.connection.remoteAddress
    }
    
    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      console.error('[ERROR]', JSON.stringify(logData))
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', JSON.stringify(logData))
    } else {
      console.log('[INFO]', JSON.stringify(logData))
    }
  })
  
  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const rootDir = path.resolve(process.cwd())
const loadEnvFile = (name) => {
  const p = path.join(rootDir, name)
  if (fs.existsSync(p)) dotenv.config({ path: p })
}
// Load base env first, then local overrides
loadEnvFile('.env')
loadEnvFile('.env.local')

const PORT = process.env.SERVER_PORT || 3002
const MYSQL_FETCH_TIMEOUT_MS = Number(process.env.MYSQL_FETCH_TIMEOUT_MS || 10000)
const FEISHU_FETCH_TIMEOUT_MS = 10000 // 飞书 API 10秒超时限制

const getMysqlConfigForLog = () => {
  const envTimeout = Number(process.env.MYSQL_CONNECT_TIMEOUT || 0)
  const connectTimeout =
    Number.isFinite(envTimeout) && envTimeout > 0
      ? Math.max(envTimeout, MYSQL_FETCH_TIMEOUT_MS)
      : MYSQL_FETCH_TIMEOUT_MS
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    database: process.env.MYSQL_DB || 'topic_new',
    table: process.env.MYSQL_TABLE || 'courses',
    connectTimeout
  }
}

// MySQL pool
const pool = mysql.createPool({
  host: getMysqlConfigForLog().host,
  port: getMysqlConfigForLog().port,
  user: getMysqlConfigForLog().user,
  password: process.env.MYSQL_PASSWORD || '',
  database: getMysqlConfigForLog().database,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: getMysqlConfigForLog().connectTimeout
})

// Helpers
const isTimeoutOrConnError = (err) => {
  const codes = new Set([
    'ETIMEDOUT',
    'ECONNREFUSED',
    'PROTOCOL_SEQUENCE_TIMEOUT',
    'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
    'PROTOCOL_CONNECTION_LOST'
  ])
  return codes.has(err?.code) || /timeout/i.test(String(err?.message || ''))
}

const withTimeout = async (promise, ms, timeoutCode = 'REQUEST_TIMEOUT') => {
  let timer
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(timeoutCode)
      err.code = timeoutCode
      reject(err)
    }, ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const FEISHU_APP_ID = String(process.env.FEISHU_APP_ID || process.env.VITE_FEISHU_APP_ID || '').trim()
const FEISHU_APP_SECRET = String(process.env.FEISHU_APP_SECRET || process.env.VITE_FEISHU_APP_SECRET || '').trim()
const FEISHU_APP_TOKEN = String(process.env.FEISHU_APP_TOKEN || process.env.VITE_FEISHU_APP_TOKEN || '').trim()
const FEISHU_TABLE_ID = String(process.env.FEISHU_TABLE_ID || process.env.VITE_FEISHU_TABLE_ID || '').trim()
const FEISHU_ENABLED = Boolean(FEISHU_APP_ID && FEISHU_APP_SECRET && FEISHU_APP_TOKEN && FEISHU_TABLE_ID)

async function getTenantToken() {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    throw new Error('Missing FEISHU_APP_ID/FEISHU_APP_SECRET')
  }
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET })
  })
  const data = await res.json()
  if (data.code !== 0) {
    throw new Error(`Feishu token error: ${data.msg || data.code}`)
  }
  return data.tenant_access_token
}

async function fetchFeishuRecords() {
  if (!FEISHU_APP_TOKEN || !FEISHU_TABLE_ID) throw new Error('Missing FEISHU_APP_TOKEN/FEISHU_TABLE_ID')
  const token = await getTenantToken()
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records/search`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page_size: 200 })
  })
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Feishu API error: ${data.msg || data.code}`)
  return data.data?.items || []
}

function rowToFeishuLike(row) {
  // 打印原始 MySQL 数据，方便在服务端控制台查看
  console.log('--- [DEBUG] Raw MySQL Row Data ---')
  console.dir(row, { depth: null })
  
  const id = row?.record_id || row?.course_id || row?.id || row?.ID
  const title = row?.course_name || row?.title || row?.topic_title || ''
  const university = row?.tutor_desc || row?.university || '' 
  const teacher = row?.tutor_fname || row?.teacher || row?.mentor || ''
  const mentorType = row?.tutor_type || row?.mentor_type || ''
  
  // 处理 JSON 字符串字段 (courses 表的特有格式)
  const parseJson = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val !== 'string') return [val]
    try {
      const parsed = JSON.parse(val)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      // 兼容非标准 JSON 或带方括号的字符串
      const cleaned = val.replace(/[\[\]"']/g, '').trim()
      return cleaned ? cleaned.split(',').map(s => s.trim()) : []
    }
  }

  const primaryArr = parseJson(row?.pri_sub)
  const secondaryArr = parseJson(row?.sec_sub)
  const suitArr = parseJson(row?.suit_major)

  const desc = row?.course_desc || row?.description || ''
  const cover = row?.poster_url || row?.image || row?.img || ''
  const headImg = row?.banner_url || row?.cover_image_test || ''
  const isHidden = row?.is_hidden ?? 0

  // 返回格式必须严格匹配前端 handleFeishuLikeItems 的提取逻辑
  return {
    record_id: id == null ? undefined : String(id),
    fields: {
      ...row, 
      '标题': title,
      '课题名称': title,
      '导师院校': university,
      '导师': teacher,
      '导师姓名': teacher,
      '一级学科': primaryArr, 
      '二级学科': secondaryArr,
      '课题简介': desc,
      '简介': desc,
      '课题描述': desc,
      '描述': desc,
      '导师类型': mentorType,
      '导师职称': mentorType,
      '封面图': cover,
      '图片': cover,
      '适合专业': suitArr.join(' | '),
      '专业要求': suitArr.join(' | '),
      '头图地址测试': headImg,
      '海报地址测试': cover,
      '头图': headImg,
      '海报': cover,
      'is_hidden': isHidden
    }
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/db-status', async (_req, res) => {
  const mysqlCfg = getMysqlConfigForLog()
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    const ok = Array.isArray(rows) ? rows?.[0]?.ok === 1 : false
    res.json({ ok: true, mysql: mysqlCfg, ping: ok })
  } catch (err) {
    res.status(500).json({
      ok: false,
      mysql: mysqlCfg,
      error: {
        code: err?.code,
        errno: err?.errno,
        sqlState: err?.sqlState,
        message: String(err?.message || err)
      }
    })
  }
})

app.get('/api/db_status', async (_req, res) => {
  const mysqlCfg = getMysqlConfigForLog()
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    const ok = Array.isArray(rows) ? rows?.[0]?.ok === 1 : false
    res.json({ ok: true, mysql: mysqlCfg, ping: ok })
  } catch (err) {
    res.status(500).json({
      ok: false,
      mysql: mysqlCfg,
      error: {
        code: err?.code,
        errno: err?.errno,
        sqlState: err?.sqlState,
        message: String(err?.message || err)
      }
    })
  }
})

app.get('/api/routes', (_req, res) => {
  const stack = app?._router?.stack || []
  const routes = []
  stack.forEach((layer) => {
    if (layer?.route?.path && layer?.route?.methods) {
      const methods = Object.keys(layer.route.methods).filter(Boolean).map(m => m.toUpperCase())
      routes.push({ path: layer.route.path, methods })
    }
  })
  res.json({ routes })
})

app.get('/api/courses', async (req, res) => {
  const startTime = Date.now()
  const limit = Math.min(Number(req.query.limit || 200), 500)
  const table = getMysqlConfigForLog().table
  let feishuErr = null
  let dataSource = 'unknown'

  console.log('[INFO]', JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint: '/api/courses',
    action: 'start',
    limit,
    feishuEnabled: FEISHU_ENABLED
  }))

  if (FEISHU_ENABLED) {
    try {
      const feishuStart = Date.now()
      console.log('[INFO]', JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/courses',
        action: 'fetching_feishu'
      }))
      
      const items = await fetchFeishuRecords()
      const feishuDuration = Date.now() - feishuStart
      
      if (items && items.length > 0) {
        dataSource = 'feishu'
        console.log('[INFO]', JSON.stringify({
          timestamp: new Date().toISOString(),
          endpoint: '/api/courses',
          action: 'success',
          dataSource,
          count: items.length,
          duration: `${feishuDuration}ms`
        }))
        
        const totalDuration = Date.now() - startTime
        return res.json({ 
          items,
          _meta: {
            dataSource,
            duration: `${totalDuration}ms`,
            count: items.length
          }
        })
      }
    } catch (err) {
      feishuErr = err
      const reason = err?.message || 'ERROR'
      dataSource = 'feishu_failed'
      console.warn('[WARN]', JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/courses',
        action: 'feishu_failed',
        reason
      }))
    }
  }

  try {
    const mysqlStart = Date.now()
    const [rows] = await withTimeout(pool.query(`SELECT * FROM \`${table}\` LIMIT ?`, [limit]), MYSQL_FETCH_TIMEOUT_MS, 'MYSQL_TIMEOUT')
    const mysqlDuration = Date.now() - mysqlStart
    
    if (Array.isArray(rows) && rows.length > 0) {
      dataSource = feishuErr ? 'mysql_fallback' : 'mysql'
      const items = rows.map(rowToFeishuLike)
      
      console.log('[INFO]', JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/courses',
        action: 'success',
        dataSource,
        count: items.length,
        duration: `${mysqlDuration}ms`
      }))
      
      const totalDuration = Date.now() - startTime
      return res.json({ 
        items,
        _meta: {
          dataSource,
          duration: `${totalDuration}ms`,
          count: items.length
        }
      })
    }
    
    dataSource = 'mysql_empty'
    console.log('[INFO]', JSON.stringify({
      timestamp: new Date().toISOString(),
      endpoint: '/api/courses',
      action: 'success',
      dataSource,
      count: 0
    }))
    
    res.json({ items: [] })
  } catch (mysqlErr) {
    dataSource = 'all_failed'
    const totalDuration = Date.now() - startTime
    
    console.error('[ERROR]', JSON.stringify({
      timestamp: new Date().toISOString(),
      endpoint: '/api/courses',
      action: 'failed',
      dataSource,
      duration: `${totalDuration}ms`,
      feishu_error: String(feishuErr?.message || ''),
      mysql_error: String(mysqlErr?.message || mysqlErr)
    }))
    
    res.status(500).json({ 
      error: 'all_data_sources_failed', 
      feishu_error: String(feishuErr?.message || ''),
      mysql_error: String(mysqlErr?.message || mysqlErr),
      _meta: {
        dataSource: 'failed',
        duration: `${totalDuration}ms`
      }
    })
  }
})

app.get('/api/courses/:id', async (req, res) => {
  const rawId = String(req.params.id || '')

  if (rawId.startsWith('rec') && FEISHU_ENABLED) {
    try {
      console.log(`🚀 [Server] Fetching record ${rawId} from Feishu (10s timeout)...`)
      const token = await getTenantToken()
      const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records/${rawId}`
      
      const fetchWithTimeout = async () => {
        const resp = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        return await resp.json()
      }

      const data = await fetchWithTimeout()
      if (data.code === 0 && data.data?.record) {
        console.log('✅ [Server] Fetched record from Feishu.')
        return res.json({ item: data.data.record })
      }
    } catch (err) {
      const reason = err?.message || 'ERROR'
      console.warn(`⚠️ [Server] Feishu Detail API failed or ${reason}, falling back to MySQL.`)
    }
  }

  // 2. 如果不是 rec 开头，或者飞书失败/超时，尝试 MySQL
  const id = /^\d+$/.test(rawId) ? Number(rawId) : rawId
  const table = getMysqlConfigForLog().table
  const candidates = ['record_id', 'course_id', 'id', 'ID']

  for (const col of candidates) {
    try {
      const [rows] = await withTimeout(
        pool.query(`SELECT * FROM \`${table}\` WHERE \`${col}\` = ? LIMIT 1`, [id]),
        MYSQL_FETCH_TIMEOUT_MS,
        'MYSQL_TIMEOUT'
      )
      if (Array.isArray(rows) && rows.length) {
        console.log(`✅ [Server] Fetched record from MySQL (col: ${col}).`)
        return res.json({ item: rowToFeishuLike(rows[0]) })
      }
    } catch (err) {
      if (err?.code === 'ER_BAD_FIELD_ERROR') continue
      console.error(`❌ [Server] MySQL Detail error for col ${col}:`, err.message)
    }
  }

  return res.status(404).json({ error: 'not_found' })
})

app.all('/feishu-api/*', async (req, res) => {
  try {
    const suffix = req.originalUrl.replace(/^\/feishu-api/, '/open-apis')
    const url = `https://open.feishu.cn${suffix}`
    const method = req.method
    const headers = {}
    const ct = req.get('Content-Type')
    if (ct) headers['Content-Type'] = ct
    let body
    if (method !== 'GET' && method !== 'HEAD') {
      if (ct && ct.includes('application/json')) {
        body = JSON.stringify(req.body || {})
      } else if (ct && ct.includes('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(req.body || {}).toString()
      } else {
        body = undefined
      }
    }
    const resp = await fetch(url, { method, headers, body })
    const text = await resp.text()
    res.status(resp.status)
    const respCT = resp.headers.get('content-type') || 'application/json'
    res.type(respCT).send(text)
  } catch (err) {
    res.status(500).json({ error: 'feishu_proxy_error', message: String(err?.message || err) })
  }
})

const distDir = path.join(rootDir, 'dist')
const distIndex = path.join(distDir, 'index.html')
if (fs.existsSync(distIndex)) {
  app.use(express.static(distDir))
  app.get('*', (_req, res) => res.sendFile(distIndex))
}

const server = app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set SERVER_PORT to another port, e.g. 3002.`)
    process.exit(1)
  }
  console.error(err)
  process.exit(1)
})
