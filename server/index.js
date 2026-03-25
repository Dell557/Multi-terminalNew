import express from 'express'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const app = express()
app.use(express.json())

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

const withTimeout = async (promise, ms) => {
  let timer
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error('MYSQL_TIMEOUT')
      err.code = 'MYSQL_TIMEOUT'
      reject(err)
    }, ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function getTenantToken() {
  const appId = process.env.FEISHU_APP_ID || process.env.VITE_FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET || process.env.VITE_FEISHU_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('Missing FEISHU_APP_ID/FEISHU_APP_SECRET')
  }
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret })
  })
  const data = await res.json()
  if (data.code !== 0) {
    throw new Error(`Feishu token error: ${data.msg || data.code}`)
  }
  return data.tenant_access_token
}

async function fetchFeishuRecords() {
  const appToken = process.env.FEISHU_APP_TOKEN || process.env.VITE_FEISHU_APP_TOKEN
  const tableId = process.env.FEISHU_TABLE_ID || process.env.VITE_FEISHU_TABLE_ID
  if (!appToken || !tableId) throw new Error('Missing FEISHU_APP_TOKEN/FEISHU_TABLE_ID')
  const token = await getTenantToken()
  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`
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
      '海报': cover
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
  const limit = Math.min(Number(req.query.limit || 200), 500)
  const table = getMysqlConfigForLog().table
  try {
    const [rows] = await withTimeout(pool.query(`SELECT * FROM \`${table}\` LIMIT ?`, [limit]), MYSQL_FETCH_TIMEOUT_MS)
    
    // 打印数据供本地对比
    if (Array.isArray(rows) && rows.length > 0) {
      console.log('--- Remote MySQL /api/courses Data (First Item) ---')
      console.dir(rows[0], { depth: null })
    }

    const items = Array.isArray(rows) ? rows.map(rowToFeishuLike) : []
    res.json({ items })
  } catch (err) {
    if (err?.code === 'MYSQL_TIMEOUT' || isTimeoutOrConnError(err)) {
      try {
        const items = await fetchFeishuRecords()
        return res.json({ items })
      } catch (fallbackErr) {
        return res.status(502).json({
          error: 'fallback_failed',
          mysql: getMysqlConfigForLog(),
          mysql_error: { code: err?.code, message: String(err?.message || err) },
          message: String(fallbackErr?.message || fallbackErr)
        })
      }
    }
    res.status(500).json({ error: 'db_error', code: err?.code, message: String(err?.message || err) })
  }
})

app.get('/api/courses/:id', async (req, res) => {
  const rawId = String(req.params.id || '')
  if (!rawId || rawId.startsWith('rec')) {
    return res.status(400).json({ error: 'invalid_id' })
  }

  const id = /^\d+$/.test(rawId) ? Number(rawId) : rawId
  const table = getMysqlConfigForLog().table
  const candidates = ['id', 'ID', 'topic_id', 'topicId', 'record_id']

  for (const col of candidates) {
    try {
      const [rows] = await withTimeout(
        pool.query(`SELECT * FROM \`${table}\` WHERE \`${col}\` = ? LIMIT 1`, [id]),
        MYSQL_FETCH_TIMEOUT_MS
      )
      if (Array.isArray(rows) && rows.length) {
        return res.json({ item: rowToFeishuLike(rows[0]) })
      }
    } catch (err) {
      if (err?.code === 'ER_BAD_FIELD_ERROR') continue
      if (err?.code === 'MYSQL_TIMEOUT' || isTimeoutOrConnError(err)) {
        return res.status(504).json({ error: 'mysql_timeout', mysql: getMysqlConfigForLog() })
      }
      return res.status(500).json({ error: 'db_error', code: err?.code, message: String(err?.message || err) })
    }
  }

  return res.status(404).json({ error: 'not_found' })
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