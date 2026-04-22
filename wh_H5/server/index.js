import express from 'express'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import axios from 'axios'
import winston from 'winston'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { detailCategories, detailCourses, detailOtherCourses, searchAllCourses } from '../src/mock/courses.js'

// 获取当前文件目录（ESM 兼容）
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 加载环境变量
dotenv.config()

// ====================
// 日志系统配置
// ====================
const logDir = process.env.LOG_DIR || path.join(__dirname, 'logs')
const logLevel = process.env.LOG_LEVEL || 'info'

// 确保日志目录存在
import fs from 'fs'
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 创建 Winston logger
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message}${stack ? '\n' + stack : ''}`
    })
  ),
  transports: [
    // 所有日志写入 combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // 错误日志单独写入 error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
})

// 开发环境也输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

const app = express()

// CORS 中间件 - 允许前端跨域访问
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())

// ====================
// 请求频率限制（防刷）
// ====================
const isRateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false'
if (isRateLimitEnabled) {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 最多 1000 次请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    // 白名单：以下情况不限
    skip: (req) => {
      // 本地开发环境不限
      if (process.env.NODE_ENV === 'development') return true
      // 本地 IP 不限
      if (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1') return true
      // 健康检查接口不限
      if (req.path === '/api/health') return true
      return false
    },
    // 自定义 key 生成（使用更简单的实现避免 IPv6 错误）
    keyGenerator: (req) => {
      try {
        // 优先使用 x-forwarded-for 头
        const forwarded = req.headers['x-forwarded-for']
        if (forwarded) {
          const ips = String(forwarded).split(',')
          return ips[0].trim() || 'unknown'
        }
        // 回退到 remoteAddress
        return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown'
      } catch (error) {
        return 'unknown'
      }
    }
  })

  app.use('/api/', limiter)
  logger.info('请求频率限制已启用', {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 1000
  })
} else {
  logger.info('请求频率限制已禁用')
}

const DEFAULT_POSTER_URL = '/H5_icon/meiyouneirong.png'
const DB_CONNECT_TIMEOUT = Math.max(500, Number(process.env.DB_CONNECT_TIMEOUT || 2000))
const toBool = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())
const DB_SSL_ENABLED = toBool(process.env.DB_SSL || process.env.DB_TLS)
const DB_SSL_REJECT_UNAUTHORIZED = toBool(process.env.DB_SSL_REJECT_UNAUTHORIZED)

const formatDbError = (e) => ({
  code: e?.code,
  errno: e?.errno,
  sqlState: e?.sqlState,
  syscall: e?.syscall,
  address: e?.address,
  port: e?.port,
  message: e?.message
})

// ====================
// 数据库连接池优化配置
// ====================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'topic_mall',
  waitForConnections: true,
  // 连接池大小优化（从 10 提升到 30）
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '30'),
  // 队列限制
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '50'),
  connectTimeout: DB_CONNECT_TIMEOUT,
  enableKeepAlive: true,
  // KeepAlive 延迟
  keepAliveInitialDelay: parseInt(process.env.DB_KEEPALIVE_DELAY || '10000'),
  // SSL 配置
  ...(DB_SSL_ENABLED ? { ssl: { rejectUnauthorized: DB_SSL_REJECT_UNAUTHORIZED } } : {})
})

logger.info('数据库连接池已配置', {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'topic_mall',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '30'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '50')
})

const FEISHU = {
  appId: process.env.FEISHU_APP_ID || '',
  appSecret: process.env.FEISHU_APP_SECRET || '',
  bitableAppToken: process.env.FEISHU_BITABLE_APP_TOKEN || '',
  coursesTableId: process.env.FEISHU_BITABLE_COURSES_TABLE_ID || '',
  projectsTableId: process.env.FEISHU_BITABLE_PROJECTS_TABLE_ID || ''
}

const isFeishuEnabled = () =>
  Boolean(FEISHU.appId && FEISHU.appSecret && FEISHU.bitableAppToken && (FEISHU.coursesTableId || FEISHU.projectsTableId))

const feishuTokenCache = { token: '', expireAt: 0 }

const getFeishuTenantAccessToken = async () => {
  const now = Date.now()
  if (feishuTokenCache.token && feishuTokenCache.expireAt - now > 10_000) return feishuTokenCache.token

  const { data } = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    { app_id: FEISHU.appId, app_secret: FEISHU.appSecret },
    { timeout: 8000 }
  )

  if (!data || data.code !== 0 || !data.tenant_access_token) {
    const msg = data?.msg || 'FEISHU_AUTH_FAILED'
    throw new Error(msg)
  }

  feishuTokenCache.token = data.tenant_access_token
  feishuTokenCache.expireAt = now + Number(data.expire || 0) * 1000
  return feishuTokenCache.token
}

const feishuGet = async (url, params) => {
  const token = await getFeishuTenantAccessToken()
  const { data } = await axios.get(url, {
    params,
    timeout: 8000,
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!data || data.code !== 0) {
    const msg = data?.msg || 'FEISHU_REQUEST_FAILED'
    throw new Error(msg)
  }
  return data
}

const bitableListAllRecords = async (tableId, maxRecords = 500) => {
  const pageSize = Math.min(100, Math.max(1, Number(process.env.FEISHU_PAGE_SIZE || 100)))
  let pageToken = undefined
  const out = []
  while (out.length < maxRecords) {
    const data = await feishuGet(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(FEISHU.bitableAppToken)}/tables/${encodeURIComponent(
        tableId
      )}/records`,
      { page_size: pageSize, page_token: pageToken }
    )
    const items = Array.isArray(data?.data?.items) ? data.data.items : []
    out.push(...items)
    if (!data?.data?.has_more || !data?.data?.page_token) break
    pageToken = data.data.page_token
  }
  return out.slice(0, maxRecords)
}

const bitableGetRecord = async (tableId, recordId) => {
  const data = await feishuGet(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(FEISHU.bitableAppToken)}/tables/${encodeURIComponent(
      tableId
    )}/records/${encodeURIComponent(recordId)}`,
    undefined
  )
  return data?.data?.record || null
}

const bitableUpdateRecord = async (tableId, recordId, fields) => {
  const token = await getFeishuTenantAccessToken()
  const { data } = await axios.put(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(FEISHU.bitableAppToken)}/tables/${encodeURIComponent(
      tableId
    )}/records/${encodeURIComponent(recordId)}`,
    { fields },
    {
      timeout: 8000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    }
  )
  if (!data || data.code !== 0) {
    const msg = data?.msg || 'FEISHU_UPDATE_FAILED'
    throw new Error(msg)
  }
  return data?.data?.record || null
}

const getField = (fields, keys) => {
  if (!fields) return undefined
  for (const k of keys) {
    if (k && Object.prototype.hasOwnProperty.call(fields, k)) return fields[k]
  }
  return undefined
}

const toStringArrayLoose = (v) => {
  if (!v) return []
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean)
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    try {
      const t = JSON.parse(s)
      if (Array.isArray(t)) return t.map((x) => String(x)).filter(Boolean)
    } catch {}
    return s
      .split(/[,，]/g)
      .map((x) => x.trim())
      .filter(Boolean)
  }
  return []
}

const toObjectLoose = (v) => {
  if (!v) return {}
  if (typeof v === 'object' && !Array.isArray(v)) return v
  if (typeof v === 'string') {
    try {
      const t = JSON.parse(v)
      return t && typeof t === 'object' && !Array.isArray(t) ? t : {}
    } catch {
      return {}
    }
  }
  return {}
}

const normalizeCourseFromFeishu = (fields, recordId) => {
  const id = String(getField(fields, ['id', 'ID', 'course_id', '课程ID']) ?? recordId ?? '')
  const title = getField(fields, ['title', '标题', '课程标题']) || ''
  const poster_url = getField(fields, ['poster_url', 'poster', '封面', '封面图', 'pic_url', '海报地址']) || ''
  const teacher_name = getField(fields, ['teacher_name', 'teacher', '导师姓名', '导师']) || ''
  const teacher_school = getField(fields, ['teacher_school', 'school', '学校']) || ''
  const teacher_title = getField(fields, ['teacher_title', '职称', '导师职称']) || '导师'
  const topic_description = getField(fields, ['topic_description', 'desc', '描述', '课题描述']) || ''
  const difficulty_score = Number(getField(fields, ['difficulty_score', 'rating', '难度', '难度系数']) || 0) || 0
  const primary_subject = toStringArrayLoose(getField(fields, ['primary_subject', 'primary', '一级学科', '主学科']))
  const secondary_subject = toStringArrayLoose(getField(fields, ['secondary_subject', 'secondary', '二级学科', '次学科']))
  const tutor_id = String(getField(fields, ['tutor_id', '导师ID']) || '1')

  return {
    id,
    title: String(title || ''),
    poster_url: String(poster_url || DEFAULT_POSTER_URL),
    teacher_name: String(teacher_name || ''),
    teacher_school: String(teacher_school || ''),
    teacher_title: String(teacher_title || '导师'),
    topic_description: String(topic_description || ''),
    difficulty_score,
    primary_subject,
    secondary_subject,
    tutor_id
  }
}

const normalizeCourseDetailFromFeishu = (fields, recordId) => {
  const base = normalizeCourseFromFeishu(fields, recordId)
  const mainTutor = toObjectLoose(getField(fields, ['main_tutor', 'mainTutor', '主导师信息']))
  const subTutor = toObjectLoose(getField(fields, ['sub_tutor', 'subTutor', '副导师信息']))
  const projectInfo = toObjectLoose(getField(fields, ['project_info', 'projectInfo', '项目信息']))
  const projectProcess = toStringArrayLoose(getField(fields, ['project_process', 'projectProcess', '项目流程']))
  const projectGain = toStringArrayLoose(getField(fields, ['project_gain', 'projectGain', '项目收获']))
  return {
    ...base,
    mainTutor: mainTutor || {},
    subTutor: subTutor || {},
    projectInfo: projectInfo || {},
    projectProcess: projectProcess || [],
    projectGain: projectGain || []
  }
}

const normalizeProjectFromFeishu = (fields, recordId) => {
  const id = String(getField(fields, ['id', 'ID', 'project_id', '项目ID']) ?? recordId ?? '')
  const tutor_id = String(getField(fields, ['tutor_id', '导师ID']) || '1')
  const title = getField(fields, ['title', '标题', '项目标题']) || ''
  const poster_url = getField(fields, ['poster_url', 'poster', '封面', '封面图', 'pic_url', '海报地址']) || ''
  const primary_subject = toStringArrayLoose(getField(fields, ['primary_subject', 'primary', '一级学科', '主学科']))
  const secondary_subject = toStringArrayLoose(getField(fields, ['secondary_subject', 'secondary', '二级学科', '次学科']))
  return {
    id,
    tutor_id,
    title: String(title || ''),
    poster_url: String(poster_url || DEFAULT_POSTER_URL),
    primary_subject,
    secondary_subject
  }
}

const feishuCache = { coursesAt: 0, projectsAt: 0, courses: null, projects: null }
const FEISHU_CACHE_TTL_MS = 20_000

const getFeishuCourses = async () => {
  if (!FEISHU.coursesTableId) return []
  const now = Date.now()
  if (feishuCache.courses && now - feishuCache.coursesAt < FEISHU_CACHE_TTL_MS) return feishuCache.courses
  const records = await bitableListAllRecords(FEISHU.coursesTableId, Number(process.env.FEISHU_COURSES_LIMIT || 500))
  const list = records.map((r) => normalizeCourseFromFeishu(r?.fields || {}, r?.record_id))
  feishuCache.coursesAt = now
  feishuCache.courses = list
  return list
}

const getFeishuProjects = async () => {
  if (!FEISHU.projectsTableId) return []
  const now = Date.now()
  if (feishuCache.projects && now - feishuCache.projectsAt < FEISHU_CACHE_TTL_MS) return feishuCache.projects
  const records = await bitableListAllRecords(FEISHU.projectsTableId, Number(process.env.FEISHU_PROJECTS_LIMIT || 500))
  const list = records.map((r) => normalizeProjectFromFeishu(r?.fields || {}, r?.record_id))
  feishuCache.projectsAt = now
  feishuCache.projects = list
  return list
}

const toArray = (v) => {
  if (!v) return []
  if (typeof v === 'string') {
    try {
      const t = JSON.parse(v)
      return Array.isArray(t) ? t : []
    } catch {
      return []
    }
  }
  return Array.isArray(v) ? v : []
}

const toTopicFromMock = (item) => {
  const tags = Array.isArray(item?.tags) ? item.tags : []
  return {
    id: String(item?.id ?? ''),
    title: item?.title || '',
    pic_url: item?.pic_url || DEFAULT_POSTER_URL,
    poster_url: item?.poster_url || DEFAULT_POSTER_URL,
    teacher_name: item?.teacher || '',
    teacher_school: item?.school || '',
    teacher_title: item?.roleName || '导师',
    topic_description: item?.desc || '',
    difficulty_score: Number(item?.rating ?? 0) || 0,
    primary_subject: tags.slice(0, 2),
    secondary_subject: tags.slice(2),
    tutor_id: '1'
  }
}

const toDetailFromMock = (item, id) => {
  const tags = Array.isArray(item?.tags) ? item.tags : []
  const mainTutor = item?.mainTutor || {}
  const subTutor = item?.subTutor || {}
  return {
    id: String(id ?? item?.id ?? ''),
    title: item?.title || '',
    poster_url: DEFAULT_POSTER_URL,
    teacher_name: item?.teacher || '',
    teacher_school: item?.school || '',
    teacher_title: '导师',
    topic_description: item?.desc || '',
    difficulty_score: Number(item?.rating ?? 0) || 4.5,
    primary_subject: tags.slice(0, 2),
    secondary_subject: tags.slice(2),
    tutor_id: '1',
    mainTutor: {
      ...mainTutor,
      name: item?.teacher || mainTutor?.name || '导师',
      title: mainTutor?.title || '教授',
      school: item?.school || mainTutor?.school || '',
      highlights: mainTutor?.highlights || mainTutor?.points || []
    },
    subTutor: subTutor || {},
    projectInfo: item?.projectInfo || {},
    projectProcess: item?.projectProcess || [],
    projectGain: item?.projectGain || []
  }
}

const viewCountOverrides = new Map()

const toSafeInt = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

const parseJsonSafe = (value, fallback) => {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return fallback
}

const topicFromCourseRow = (r = {}) => ({
  id: String(r.id || ''),
  title: r.title || '',
  poster_url: r.poster_url || DEFAULT_POSTER_URL,
  teacher_name: r.teacher_name || '',
  teacher_school: r.teacher_school || '',
  teacher_title: r.teacher_title || '导师',
  topic_description: r.topic_description || '',
  difficulty_score: Number(r.difficulty_score || 0) || 0,
  primary_subject: toArray(r.primary_subject),
  secondary_subject: toArray(r.secondary_subject),
  tutor_id: String(r.tutor_id || '1')
})

const detailFromCourseRow = (r = {}) => ({
  id: String(r.id || ''),
  title: r.title || '',
  poster_url: r.poster_url || DEFAULT_POSTER_URL,
  teacher_name: r.teacher_name || '',
  teacher_school: r.teacher_school || '',
  teacher_title: r.teacher_title || '导师',
  topic_description: r.topic_description || '',
  difficulty_score: Number(r.difficulty_score || 0) || 0,
  primary_subject: toArray(r.primary_subject),
  secondary_subject: toArray(r.secondary_subject),
  tutor_id: String(r.tutor_id || '1'),
  mainTutor: parseJsonSafe(r.main_tutor, {}),
  subTutor: parseJsonSafe(r.sub_tutor, {}),
  projectInfo: parseJsonSafe(r.project_info, {}),
  projectProcess: parseJsonSafe(r.project_process, []),
  projectGain: parseJsonSafe(r.project_gain, [])
})

const getTopicViews = (topic, rawRow) => {
  const id = String(topic?.id || '')
  if (id && viewCountOverrides.has(id)) return toSafeInt(viewCountOverrides.get(id))
  return toSafeInt(
    rawRow?.view_count ??
      rawRow?.viewCount ??
      rawRow?.views ??
      rawRow?.browse_count ??
      rawRow?.browseCount ??
      rawRow?.visit_count ??
      rawRow?.visitCount ??
      rawRow?.click_count ??
      rawRow?.clickCount ??
      topic?.view_count ??
      topic?.views ??
      0
  )
}

const toWuPcRecordFromTopic = (topic, rawRow) => {
  const id = String(topic?.id || '')
  const tutorId = String(topic?.tutor_id || topic?.tutorId || topic?.teacher_id || topic?.mentor_id || '')
  const difficultyScore = Number(topic?.difficulty_score ?? topic?.difficulty ?? topic?.rating ?? 0) || 0
  const fields = {
    标题: topic?.title || '',
    教授课题名称: topic?.title || '',
    课题名称: topic?.title || '',
    导师院校: topic?.teacher_school || '',
    大学: topic?.teacher_school || '',
    学校: topic?.teacher_school || '',
    导师: topic?.teacher_name || '',
    导师姓名: topic?.teacher_name || '',
    导师编号: tutorId,
    导师ID: tutorId,
    tutor_id: tutorId,
    一级学科: Array.isArray(topic?.primary_subject) ? topic.primary_subject : [],
    二级学科: Array.isArray(topic?.secondary_subject) ? topic.secondary_subject : [],
    课题编号: id,
    专业领域: '',
    简介: topic?.topic_description || '',
    课题描述: topic?.topic_description || '',
    浏览量: getTopicViews(topic, rawRow),
    难度等级: difficultyScore,
    difficulty_score: difficultyScore,
    rating: difficultyScore,
    导师类型: topic?.teacher_title || '导师',
    导师职称: topic?.teacher_title || '导师',
    封面图: topic?.poster_url || DEFAULT_POSTER_URL,
    pic_url: topic?.poster_url || DEFAULT_POSTER_URL,
    banner_url: topic?.poster_url || DEFAULT_POSTER_URL,
    poster_url: topic?.poster_url || DEFAULT_POSTER_URL
  }
  return { record_id: id, fields }
}

const toWuPcRecordFromDetail = (detail, rawRow) => {
  const topicRecord = toWuPcRecordFromTopic(detail, rawRow)
  const fields = topicRecord.fields

  fields.项目形式 = detail?.projectInfo?.format || ''
  fields.项目方案 = detail?.projectInfo?.plan || ''
  fields.项目信息 = detail?.projectInfo || {}
  fields.项目流程 = Array.isArray(detail?.projectProcess) ? detail.projectProcess : []
  fields.项目收获 = Array.isArray(detail?.projectGain) ? detail.projectGain : []
  fields.mainTutor = detail?.mainTutor || {}
  fields.subTutor = detail?.subTutor || {}
  fields.main_tutor = detail?.mainTutor || {}
  fields.sub_tutor = detail?.subTutor || {}
  fields.project_info = detail?.projectInfo || {}
  fields.project_process = Array.isArray(detail?.projectProcess) ? detail.projectProcess : []
  fields.project_gain = Array.isArray(detail?.projectGain) ? detail.projectGain : []

  if (detail?.mainTutor?.specialty) fields.专业领域 = detail.mainTutor.specialty
  if (detail?.projectInfo?.suitable) fields.适合学生 = detail.projectInfo.suitable
  if (detail?.projectInfo?.suitability) fields.适合专业 = detail.projectInfo.suitability
  return { record_id: topicRecord.record_id, fields }
}

const getMysqlTableName = () => {
  const raw = String(process.env.MYSQL_TABLE || 'courses').trim()
  return /^[A-Za-z0-9_]+$/.test(raw) ? raw : 'courses'
}

const tableColumnCache = new Map()

const getTableColumns = async (table) => {
  const dbName = String(process.env.DB_NAME || 'topic_mall')
  const cacheKey = `${dbName}:${table}`
  if (tableColumnCache.has(cacheKey)) return tableColumnCache.get(cacheKey)
  const [rows] = await pool.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [dbName, table]
  )
  const cols = new Set((Array.isArray(rows) ? rows : []).map((r) => String(r?.COLUMN_NAME || '')))
  tableColumnCache.set(cacheKey, cols)
  return cols
}

const getRowRecordId = (row = {}) => {
  const preferred = String(row?.record_id ?? row?.recordId ?? '').trim()
  if (preferred) return preferred
  return String(row?.id ?? row?.ID ?? row?.topic_id ?? row?.topicId ?? row?.course_id ?? '').trim()
}

const pickRowText = (row = {}, keys = []) => {
  for (const key of keys) {
    if (!key) continue
    const value = row?.[key]
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return ''
}

const rowToWuPcRecord = (row = {}) => {
  const recordId = getRowRecordId(row)
  const title = pickRowText(row, ['title', 'topic_title', 'topic_name', 'project_title', 'project_name', 'name', 'course_name'])
  const university = pickRowText(row, ['university', 'school', 'school_name', 'tutor_school', 'advisor_university', 'main_advisor_university'])
  const teacher = pickRowText(row, ['teacher', 'mentor', 'advisor', 'main_advisor', 'main_advisor_name', 'tutor_fname'])
  const mentorType = pickRowText(row, ['mentor_type', 'mentorType', 'advisor_title', 'main_advisor_title', 'tutor_type', 'teacher_title']) || '导师'
  const desc = pickRowText(row, ['description', 'desc', 'topic_desc', 'introduction', 'brief', 'overview', 'course_desc', 'topic_description'])
  const primary = toStringArrayLoose(row?.pri_sub ?? row?.primary_subject ?? row?.primary ?? row?.level1_subject ?? row?.subject_1 ?? row?.subject1)
  const secondary = toStringArrayLoose(
    row?.sec_sub ?? row?.secondary_subject ?? row?.secondary ?? row?.level2_subject ?? row?.subject_2 ?? row?.subject2
  )
  const poster =
    pickRowText(row, ['cover_url', 'poster_url', 'banner_url', 'image', 'img', 'poster', 'pic_url']) || DEFAULT_POSTER_URL
  const views = getTopicViews({ id: recordId }, row)
  const tutorId = String(row?.tutor_id ?? row?.teacher_id ?? row?.mentor_id ?? row?.advisor_id ?? row?.main_advisor_id ?? '')
  const difficultyScore = Number(row?.difficulty_score ?? row?.difficulty ?? row?.rating ?? 0) || 0
  const courseId = pickRowText(row, ['course_id'])
  const recordIdText = pickRowText(row, ['record_id']) || recordId
  const topicCode = courseId || recordIdText
  const createTime = pickRowText(row, ['create_time', 'created_at', 'createTime', 'createdTime'])

  const fields = {
    标题: title,
    教授课题名称: title,
    课题名称: title,
    导师院校: university,
    大学: university,
    学校: university,
    导师: teacher,
    导师姓名: teacher,
    导师编号: tutorId,
    导师ID: tutorId,
    tutor_id: tutorId,
    一级学科: primary,
    二级学科: secondary,
    课题编号: topicCode,
    course_id: courseId,
    record_id: recordIdText,
    专业领域: pickRowText(row, [
      '专业领域',
      'industry_desc',
      'industryDesc',
      'industry-desc',
      'specialty',
      'tutor_majors',
      'tutor_major',
      'expertise',
      'research_fields',
      'research_area'
    ]),
    简介: desc,
    课题描述: desc,
    浏览量: views,
    create_time: createTime,
    更新时间: createTime,
    难度等级: difficultyScore,
    difficulty_score: difficultyScore,
    rating: difficultyScore,
    导师类型: mentorType,
    导师职称: mentorType,
    封面图: poster,
    pic_url: pickRowText(row, ['pic_url']) || poster,
    banner_url: pickRowText(row, ['banner_url']) || poster,
    poster_url: pickRowText(row, ['poster_url']) || poster
  }

  const mainTutor = parseJsonSafe(row?.main_tutor ?? row?.mainTutor, {})
  const subTutor = parseJsonSafe(row?.sub_tutor ?? row?.subTutor, {})
  const projectInfo = parseJsonSafe(row?.project_info ?? row?.projectInfo, {})
  const projectProcess = parseJsonSafe(row?.project_process ?? row?.projectProcess, [])
  const projectGain = parseJsonSafe(row?.project_gain ?? row?.projectGain, [])
  if (mainTutor && Object.keys(mainTutor).length) fields.mainTutor = mainTutor
  if (subTutor && Object.keys(subTutor).length) fields.subTutor = subTutor
  if (projectInfo && Object.keys(projectInfo).length) fields.项目信息 = projectInfo
  if (Array.isArray(projectProcess) && projectProcess.length) fields.项目流程 = projectProcess
  if (Array.isArray(projectGain) && projectGain.length) fields.项目收获 = projectGain

  return { record_id: recordId, fields }
}

const rowToLegacyTopic = (row = {}) => {
  const id = getRowRecordId(row)
  const record_id = pickRowText(row, ['record_id']) || id
  const course_id = pickRowText(row, ['course_id'])
  const title = pickRowText(row, ['title', 'topic_title', 'topic_name', 'project_title', 'project_name', 'name', 'course_name'])
  const teacher_name = pickRowText(row, ['teacher_name', 'teacher', 'mentor', 'advisor', 'main_advisor', 'main_advisor_name', 'tutor_fname'])
  const teacher_school = pickRowText(row, ['teacher_school', 'university', 'school', 'school_name', 'advisor_university', 'main_advisor_university'])
  const teacher_title =
    pickRowText(row, ['teacher_title', 'mentor_type', 'mentorType', 'advisor_title', 'main_advisor_title', 'tutor_type']) || '导师'
  const topic_description = pickRowText(
    row,
    ['topic_description', 'description', 'desc', 'topic_desc', 'introduction', 'brief', 'overview', 'course_desc']
  )
  const pic_url = pickRowText(row, ['pic_url', 'image', 'img', 'cover_url', 'banner_url']) || DEFAULT_POSTER_URL
  const poster_url =
    pickRowText(row, ['poster_url', 'cover_url', 'banner_url', 'image', 'img', 'poster', 'pic_url']) || DEFAULT_POSTER_URL
  const difficulty_score = Number(row?.difficulty_score ?? row?.difficulty ?? row?.rating ?? 0) || 0
  const create_time = pickRowText(row, ['create_time', 'created_at', 'createTime', 'createdTime'])
  const primary_subject = toStringArrayLoose(
    row?.primary_subject ?? row?.pri_sub ?? row?.primary ?? row?.level1_subject ?? row?.subject_1 ?? row?.subject1
  )
  const secondary_subject = toStringArrayLoose(
    row?.secondary_subject ?? row?.sec_sub ?? row?.secondary ?? row?.level2_subject ?? row?.subject_2 ?? row?.subject2
  )
  const tutor_id = String(row?.tutor_id ?? row?.teacher_id ?? row?.mentor_id ?? row?.advisor_id ?? row?.main_advisor_id ?? '1')

  return {
    id,
    record_id,
    course_id,
    title,
    pic_url,
    poster_url,
    teacher_name,
    teacher_school,
    teacher_title,
    topic_description,
    difficulty_score,
    create_time,
    primary_subject,
    secondary_subject,
    tutor_id
  }
}

const rowToLegacyDetail = (row = {}) => ({
  ...rowToLegacyTopic(row),
  mainTutor: parseJsonSafe(row?.main_tutor ?? row?.mainTutor, {}),
  subTutor: parseJsonSafe(row?.sub_tutor ?? row?.subTutor, {}),
  projectInfo: parseJsonSafe(row?.project_info ?? row?.projectInfo, {}),
  projectProcess: parseJsonSafe(row?.project_process ?? row?.projectProcess, []),
  projectGain: parseJsonSafe(row?.project_gain ?? row?.projectGain, [])
})

const rowMatchesId = (row, id) => {
  const targets = [row?.id, row?.ID, row?.record_id, row?.course_id, row?.topic_id, row?.topicId]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
  return targets.includes(String(id || '').trim())
}

const fetchRowsFromConfiguredTable = async (limit = 200) => {
  const table = getMysqlTableName()
  const [rows] = await pool.query(`SELECT * FROM \`${table}\` LIMIT ?`, [Math.max(1, Math.floor(Number(limit) || 200))])
  return Array.isArray(rows) ? rows : []
}

const fetchRowByIdFromConfiguredTable = async (id) => {
  const table = getMysqlTableName()
  const cols = await getTableColumns(table).catch(() => new Set())
  const keyCandidates = ['record_id', 'course_id', 'id', 'ID', 'topic_id'].filter((c) => cols.has(c))
  if (keyCandidates.length > 0) {
    const whereSql = keyCandidates.map((c) => `\`${c}\` = ?`).join(' OR ')
    const params = keyCandidates.map(() => id)
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE ${whereSql} LIMIT 1`, params)
    if (Array.isArray(rows) && rows.length > 0) return rows[0]
  }

  const scanLimit = Math.max(100, Math.floor(Number(process.env.MYSQL_LOOKUP_LIMIT || 1200)))
  const [rows] = await pool.query(`SELECT * FROM \`${table}\` LIMIT ?`, [scanLimit])
  const list = Array.isArray(rows) ? rows : []
  return list.find((row) => rowMatchesId(row, id)) || null
}

const updateViewsInConfiguredTable = async (id, views) => {
  const table = getMysqlTableName()
  const cols = await getTableColumns(table).catch(() => new Set())
  const keyColumns = ['id', 'record_id', 'course_id', 'topic_id'].filter((c) => cols.has(c))
  const viewColumns = ['view_count', 'views', 'browse_count', 'visit_count', 'click_count'].filter((c) => cols.has(c))
  if (keyColumns.length === 0 || viewColumns.length === 0) return
  for (const key of keyColumns) {
    for (const col of viewColumns) {
      try {
        await pool.query(`UPDATE \`${table}\` SET \`${col}\`=? WHERE \`${key}\`=?`, [views, id])
      } catch {}
    }
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json({ ok: true, db: rows?.[0]?.ok === 1 })
  } catch (e) {
    res.json({ ok: false, error: formatDbError(e) })
  }
})

// wu_pc 兼容：获取课程列表（返回 source + items[record_id + fields]）
app.get('/api/courses', async (req, res) => {
  const limit = Math.min(Math.max(1, Number(req.query.limit || 200)), 500)
  const keyword = String(req.query.keyword || '').trim()
  const includeRaw = String(req.query.debug || '').toLowerCase() === '1' || String(req.query.debug || '').toLowerCase() === 'true'
  let mysqlError = null
  
  // 如果启用了 Mock 数据，直接使用 Mock
  const useMock = process.env.USE_MOCK_DATA === 'true'
  if (useMock) {
    const topics = (Array.isArray(searchAllCourses) ? searchAllCourses : []).map(toTopicFromMock)
    const filtered = keyword ? topics.filter((x) => String(x.title || '').includes(keyword)) : topics
    const items = filtered.slice(0, limit).map((topic) => toWuPcRecordFromTopic(topic))
    const payload = { source: 'mock', items }
    logger.info('/api/courses: 使用 Mock 数据', { count: items.length, keyword: keyword || 'none' })
    res.json(payload)
    return
  }

  try {
    const rows = await fetchRowsFromConfiguredTable(Math.max(limit * 4, 300))
    const filteredRows = keyword
      ? rows.filter((row) => {
          const text = [
            pickRowText(row, ['title', 'topic_title', 'topic_name', 'project_title', 'project_name', 'name', 'course_name']),
            pickRowText(row, ['description', 'desc', 'topic_desc', 'introduction', 'brief', 'overview', 'course_desc', 'topic_description']),
            pickRowText(row, ['teacher', 'mentor', 'advisor', 'main_advisor', 'main_advisor_name', 'tutor_fname']),
            pickRowText(row, ['university', 'school', 'school_name', 'tutor_school']),
            toStringArrayLoose(row?.primary_subject ?? row?.pri_sub).join(' '),
            toStringArrayLoose(row?.secondary_subject ?? row?.sec_sub).join(' ')
          ]
            .filter(Boolean)
            .join(' ')
          return text.includes(keyword)
        })
      : rows
    const picked = filteredRows.slice(0, limit)
    const items = picked.map((row) => rowToWuPcRecord(row))
    const payload = { source: 'mysql', items }
    if (includeRaw) payload.raw = picked
    res.json(payload)
    return
  } catch (e) {
    console.error('Error in /api/courses:', e);
    mysqlError = formatDbError(e)
  }

  if (isFeishuEnabled() && FEISHU.coursesTableId) {
    try {
      const list = await getFeishuCourses()
      const filtered = keyword ? list.filter((x) => String(x.title || '').includes(keyword)) : list
      const items = filtered.slice(0, limit).map((topic) => toWuPcRecordFromTopic(topic))
      const payload = { source: 'feishu', items }
      if (includeRaw && mysqlError) payload.mysqlError = mysqlError
      res.json(payload)
      return
    } catch {}
  }

  const topics = (Array.isArray(searchAllCourses) ? searchAllCourses : []).map(toTopicFromMock)
  const filtered = keyword ? topics.filter((x) => String(x.title || '').includes(keyword)) : topics
  const items = filtered.slice(0, limit).map((topic) => toWuPcRecordFromTopic(topic))
  const payload = { source: 'mock', items }
  if (includeRaw && mysqlError) payload.mysqlError = mysqlError
  res.json(payload)
})

// wu_pc 兼容：获取单个课程详情（返回 source + record）
app.get('/api/course/:id', async (req, res) => {
  const id = String(req.params.id || '').trim()
  const includeRaw = String(req.query.debug || '').toLowerCase() === '1' || String(req.query.debug || '').toLowerCase() === 'true'
  let mysqlError = null
  
  // 如果启用了 Mock 数据，直接使用 Mock
  const useMock = process.env.USE_MOCK_DATA === 'true'
  if (useMock) {
    const mockRecord =
      (Array.isArray(detailCourses) ? detailCourses : []).find((c) => String(c?.id) === id) || (detailCourses?.[0] || {})
    const record = toWuPcRecordFromTopic(mockRecord)
    const payload = { source: 'mock', record }
    logger.info('/api/course/:id: 使用 Mock 数据', { id })
    res.json(payload)
    return
  }

  try {
    const row = await fetchRowByIdFromConfiguredTable(id)
    if (row) {
      const record = rowToWuPcRecord(row)
      const payload = { source: 'mysql', record }
      if (includeRaw) payload.raw = row
      res.json(payload)
      return
    }
  } catch (e) {
    console.error('Error in /api/course/:id:', e);
    mysqlError = formatDbError(e)
  }

  if (isFeishuEnabled() && FEISHU.coursesTableId) {
    try {
      const rawRecord = await bitableGetRecord(FEISHU.coursesTableId, id).catch(() => null)
      if (rawRecord) {
        const detail = normalizeCourseDetailFromFeishu(rawRecord?.fields || {}, rawRecord?.record_id || id)
        const record = toWuPcRecordFromDetail(detail)
        const recordId = String(rawRecord?.record_id || detail?.id || id)
        record.record_id = recordId
        record.fields = { ...record.fields, ...(rawRecord?.fields || {}) }
        if (viewCountOverrides.has(recordId)) {
          record.fields['浏览量'] = toSafeInt(viewCountOverrides.get(recordId))
        }
        const payload = { source: 'feishu', record }
        if (includeRaw && mysqlError) payload.mysqlError = mysqlError
        res.json(payload)
        return
      }

      const list = await getFeishuCourses()
      const hit = list.find((x) => String(x.id) === id)
      if (hit) {
        const record = toWuPcRecordFromTopic(hit)
        const payload = { source: 'feishu', record }
        if (includeRaw && mysqlError) payload.mysqlError = mysqlError
        res.json(payload)
        return
      }
    } catch {}
  }

  const fallback = toDetailFromMock(
    (Array.isArray(detailCourses) ? detailCourses : []).find((c) => String(c?.id) === id) || (detailCourses?.[0] || {}),
    id
  )
  const record = toWuPcRecordFromDetail(fallback)
  const payload = { source: 'mock', record }
  if (includeRaw && mysqlError) payload.mysqlError = mysqlError
  res.json(payload)
})

// wu_pc 兼容：更新课程（主要用于浏览量上报）
app.put('/api/course/:id', async (req, res) => {
  const id = String(req.params.id || '').trim()
  const body = req.body || {}
  const fields = body?.fields && typeof body.fields === 'object' ? body.fields : body

  const incomingViews =
    fields?.['浏览量'] ??
    fields?.['浏览次数'] ??
    fields?.view_count ??
    fields?.views ??
    fields?.browse_count ??
    fields?.visit_count ??
    fields?.click_count

  if (incomingViews != null) {
    viewCountOverrides.set(id, toSafeInt(incomingViews))
    const safeViews = toSafeInt(incomingViews)
    await updateViewsInConfiguredTable(id, safeViews).catch(() => {})
  }

  try {
    const row = await fetchRowByIdFromConfiguredTable(id)
    if (row) {
      const record = rowToWuPcRecord(row)
      if (incomingViews != null) {
        record.fields['浏览量'] = toSafeInt(incomingViews)
      }
      const views = toSafeInt(record?.fields?.['浏览量'])
      res.json({ source: 'mysql', record, views })
      return
    }
  } catch {}

  if (isFeishuEnabled() && FEISHU.coursesTableId) {
    try {
      const updateFields = { ...(fields || {}) }
      if (incomingViews != null) {
        updateFields['浏览量'] = toSafeInt(incomingViews)
      }
      const updated = await bitableUpdateRecord(FEISHU.coursesTableId, id, updateFields)
      if (updated) {
        const detail = normalizeCourseDetailFromFeishu(updated?.fields || {}, updated?.record_id || id)
        const record = toWuPcRecordFromDetail(detail)
        const recordId = String(updated?.record_id || detail?.id || id)
        record.record_id = recordId
        record.fields = { ...record.fields, ...(updated?.fields || {}) }
        if (viewCountOverrides.has(recordId)) {
          record.fields['浏览量'] = toSafeInt(viewCountOverrides.get(recordId))
        }
        const views = toSafeInt(record?.fields?.['浏览量'])
        res.json({ source: 'feishu', record, views })
        return
      }
    } catch {}
  }

  const fallback = toDetailFromMock(
    (Array.isArray(detailCourses) ? detailCourses : []).find((c) => String(c?.id) === id) || (detailCourses?.[0] || {}),
    id
  )
  const record = toWuPcRecordFromDetail(fallback)
  if (incomingViews != null) {
    record.fields['浏览量'] = toSafeInt(incomingViews)
  }
  const views = toSafeInt(record?.fields?.['浏览量'])
  res.json({ source: 'mock', record, views })
})

app.get('/api/courses/topics', async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim()
    const limit = Math.min(Math.max(1, Number(req.query.limit || 50)), 500)
    const rows = await fetchRowsFromConfiguredTable(Math.max(limit * 4, 300))
    const filteredRows = keyword
      ? rows.filter((row) => {
          const text = [
            pickRowText(row, ['title', 'topic_title', 'topic_name', 'project_title', 'project_name', 'name', 'course_name']),
            pickRowText(row, ['description', 'desc', 'topic_desc', 'introduction', 'brief', 'overview', 'course_desc', 'topic_description']),
            pickRowText(row, ['teacher_name', 'teacher', 'mentor', 'advisor', 'main_advisor', 'main_advisor_name', 'tutor_fname']),
            pickRowText(row, ['teacher_school', 'university', 'school', 'school_name', 'advisor_university', 'main_advisor_university']),
            toStringArrayLoose(row?.primary_subject ?? row?.pri_sub).join(' '),
            toStringArrayLoose(row?.secondary_subject ?? row?.sec_sub).join(' ')
          ]
            .filter(Boolean)
            .join(' ')
          return text.includes(keyword)
        })
      : rows
    const topics = filteredRows.slice(0, limit).map((row) => rowToLegacyTopic(row))
    res.json({ code: 0, success: true, msg: 'success', topics })
  } catch (e) {
    if (isFeishuEnabled() && FEISHU.coursesTableId) {
      try {
        const keyword = String(req.query.keyword || '').trim()
        const limit = Math.min(Math.max(1, Number(req.query.limit || 50)), 500)
        const list = await getFeishuCourses()
        const filtered = keyword ? list.filter((x) => String(x.title || '').includes(keyword)) : list
        const topics = filtered.slice(0, limit).map((x) => ({ ...x }))
        res.json({ code: 0, success: true, msg: 'feishu_fallback', topics })
        return
      } catch {}
    }
    try {
      const topics = (Array.isArray(searchAllCourses) ? searchAllCourses : []).map(toTopicFromMock)
      res.json({ code: 0, success: true, msg: 'mock_fallback', topics })
    } catch {
      res.json({ code: 0, success: true, msg: 'mock_fallback', topics: [] })
    }
  }
})

app.get('/api/courses/topics/:id', async (req, res) => {
  try {
    const row = await fetchRowByIdFromConfiguredTable(req.params.id)
    if (!row) {
      res.status(404).json({ code: 404, success: false, msg: 'not_found' })
      return
    }
    const data = rowToLegacyDetail(row)
  res.json({ code: 0, success: true, msg: 'success', data })
    return
  } catch (e) {
    console.error('Error in /api/courses/topics/:id (MySQL):', e);
    console.error('Error in /api/courses/topics/:id (MySQL):', e);
    if (isFeishuEnabled() && FEISHU.coursesTableId) {
      try {
        const id = String(req.params.id || '')
        const record = await bitableGetRecord(FEISHU.coursesTableId, id).catch(() => null)
        if (record) {
          const data = normalizeCourseDetailFromFeishu(record?.fields || {}, record?.record_id || id)
          res.json({ code: 0, success: true, msg: 'feishu_fallback', data })
          return
        }
        const list = await getFeishuCourses()
        const hit = list.find((x) => String(x.id) === id) || null
        if (hit) {
          res.json({ code: 0, success: true, msg: 'feishu_fallback', data: { ...hit } })
          return
        }
      } catch {}
    }
    const id = String(req.params.id || '')
    try {
      const fallback = toDetailFromMock(
        (Array.isArray(detailCourses) ? detailCourses : []).find((c) => String(c?.id) === id) || (detailCourses?.[0] || {}),
        id
      )
      res.json({ code: 0, success: true, msg: 'mock_fallback', data: fallback })
    } catch {
      res.json({ code: 0, success: true, msg: 'mock_fallback', data: toDetailFromMock({}, id) })
    }
  }
})

app.get('/api/courses/teacher/:tutorId/projects', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tutor_projects WHERE tutor_id=?', [req.params.tutorId])
    const list = rows.map((r) => ({
      id: String(r.id || ''),
      title: r.title || '',
      poster_url: r.poster_url || '',
      primary_subject: toArray(r.primary_subject),
      secondary_subject: toArray(r.secondary_subject)
    }))
    res.json({ code: 0, success: true, msg: 'success', list })
  } catch (e) {
    if (isFeishuEnabled() && FEISHU.projectsTableId) {
      try {
        const tutorId = String(req.params.tutorId || '')
        const listAll = await getFeishuProjects()
        const list = listAll
          .filter((x) => (tutorId ? String(x.tutor_id || '') === tutorId : true))
          .map((x) => ({
            id: String(x.id || ''),
            title: x.title || '',
            poster_url: x.poster_url || DEFAULT_POSTER_URL,
            primary_subject: Array.isArray(x.primary_subject) ? x.primary_subject : [],
            secondary_subject: Array.isArray(x.secondary_subject) ? x.secondary_subject : []
          }))
        res.json({ code: 0, success: true, msg: 'feishu_fallback', list })
        return
      } catch {}
    }
    const list = (Array.isArray(detailOtherCourses) ? detailOtherCourses : []).map((item) => {
      const tags = Array.isArray(item?.tags) ? item.tags : []
      return {
        id: String(item?.id ?? ''),
        title: item?.title || '',
        poster_url: DEFAULT_POSTER_URL,
        primary_subject: tags.slice(0, 2),
        secondary_subject: tags.slice(2)
      }
    })
    res.json({ code: 0, success: true, msg: 'mock_fallback', list })
  }
})

app.get('/api/courses/categories', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT primary_subject, secondary_subject FROM courses')
    const set = new Set()
    rows.forEach((r) => {
      toArray(r.primary_subject).forEach((t) => t && set.add(String(t)))
      toArray(r.secondary_subject).forEach((t) => t && set.add(String(t)))
    })
    res.json({ code: 0, success: true, msg: 'success', data: Array.from(set).slice(0, 50) })
  } catch (e) {
    if (isFeishuEnabled() && FEISHU.coursesTableId) {
      try {
        const list = await getFeishuCourses()
        const set = new Set()
        list.forEach((x) => {
          ;(Array.isArray(x.primary_subject) ? x.primary_subject : []).forEach((t) => t && set.add(String(t)))
          ;(Array.isArray(x.secondary_subject) ? x.secondary_subject : []).forEach((t) => t && set.add(String(t)))
        })
        res.json({ code: 0, success: true, msg: 'feishu_fallback', data: Array.from(set).slice(0, 50) })
        return
      } catch {}
    }
    const cats = Array.isArray(detailCategories) ? detailCategories : []
    res.json({ code: 0, success: true, msg: 'mock_fallback', data: cats })
  }
})

app.get('/api/stats', async (_req, res) => {
  try {
    const [[c1]] = await pool.query('SELECT COUNT(1) AS cnt FROM courses')
    const [[c2]] = await pool.query('SELECT COUNT(1) AS cnt FROM tutor_projects')
    res.json({
      code: 0,
      success: true,
      msg: 'success',
      source: 'mysql',
      data: { courses: Number(c1?.cnt || 0), tutor_projects: Number(c2?.cnt || 0) }
    })
  } catch (e) {
    if (isFeishuEnabled()) {
      try {
        const [courses, projects] = await Promise.all([getFeishuCourses().catch(() => []), getFeishuProjects().catch(() => [])])
        if (courses.length || projects.length) {
          res.json({
            code: 0,
            success: true,
            msg: 'feishu_fallback',
            source: 'feishu',
            data: { courses: courses.length, tutor_projects: projects.length }
          })
          return
        }
      } catch {}
    }
    res.json({
      code: 0,
      success: true,
      msg: 'mock_fallback',
      source: 'mock',
      data: {
        courses: Array.isArray(searchAllCourses) ? searchAllCourses.length : 0,
        tutor_projects: Array.isArray(detailOtherCourses) ? detailOtherCourses.length : 0
      }
    })
  }
})

app.get('/api/_debug/config', (_req, res) => {
  res.json({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER ? String(process.env.DB_USER).replace(/.(?=.{2})/g, '*') : '',
    name: process.env.DB_NAME,
    table: process.env.MYSQL_TABLE,
    connectTimeout: DB_CONNECT_TIMEOUT,
    ssl: DB_SSL_ENABLED
  })
})

const port = Number(process.env.PORT || 8181)

const RIGHTCODE_API_KEY = process.env.RIGHTCODE_API_KEY || '';
const RIGHTCODE_BASE_URL = process.env.RIGHTCODE_BASE_URL || 'https://right.codes/codex/v1';

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, model } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ ok: false, message: 'messages is required' });
      return;
    }

    if (!RIGHTCODE_API_KEY) {
      res.status(503).json({ ok: false, message: 'AI is not configured' });
      return;
    }
    const response = await axios.post(`${RIGHTCODE_BASE_URL}/chat/completions`, { model: model || 'gpt-4o', messages, stream: false }, { headers: { Authorization: `Bearer ${RIGHTCODE_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 60000 });

    res.json({ ok: true, data: response.data });
  } catch (error) {
    const status = error?.response?.status || 500;
    const message = error?.response?.data?.error?.message || error?.message || 'AI request failed';
    res.status(status).json({ ok: false, message });
  }
});

// ====================
// 启动服务器
// ====================
const PORT = parseInt(process.env.PORT || '8181')
const server = app.listen(PORT, () => {
  logger.info(`服务器已启动`, { 
    port: PORT,
    url: `http://localhost:${PORT}`,
    env: process.env.NODE_ENV || 'development'
  })
  console.log(`server started on http://localhost:${PORT}`)
})

// ====================
// 优雅关闭处理
// ====================
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} 信号收到，开始优雅关闭...`)
  
  // 停止接收新连接
  server.close(async () => {
    logger.info('HTTP 服务器已关闭')
    
    try {
      // 关闭数据库连接池
      await pool.end()
      logger.info('数据库连接池已关闭')
    } catch (err) {
      logger.error('关闭数据库连接池失败', { error: err })
    }
    
    logger.info('服务器已完全关闭')
    process.exit(0)
  })
  
  // 如果 10 秒后还没关闭成功，强制退出
  setTimeout(() => {
    logger.error('优雅关闭超时，强制退出')
    process.exit(1)
  }, 10000)
}

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 错误处理
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', { error: err })
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', { reason })
})

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255),
      pic_url VARCHAR(512),
      poster_url VARCHAR(512),
      teacher_name VARCHAR(128),
      teacher_school VARCHAR(128),
      teacher_title VARCHAR(64),
      topic_description TEXT,
      difficulty_score DECIMAL(3,1),
      primary_subject JSON,
      secondary_subject JSON,
      tutor_id VARCHAR(64),
      main_tutor JSON,
      sub_tutor JSON,
      project_info JSON,
      project_process JSON,
      project_gain JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tutor_projects (
      id VARCHAR(64) PRIMARY KEY,
      tutor_id VARCHAR(64),
      title VARCHAR(255),
      pic_url VARCHAR(512),
      poster_url VARCHAR(512),
      primary_subject JSON,
      secondary_subject JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  try {
    await pool.query(`ALTER TABLE courses ADD COLUMN pic_url VARCHAR(512)`)
  } catch (e) {
    if (e?.code !== 'ER_DUP_FIELDNAME') throw e
  }
  try {
    await pool.query(`ALTER TABLE tutor_projects ADD COLUMN pic_url VARCHAR(512)`)
  } catch (e) {
    if (e?.code !== 'ER_DUP_FIELDNAME') throw e
  }
}

app.post('/api/dev/seed', async (req, res) => {
  try {
    const key = String(req.query.key || '')
    if (!key || key.length < 6) {
      res.status(403).json({ ok: false, message: 'forbidden' })
      return
    }
    await ensureSchema()
    await pool.query('TRUNCATE TABLE courses')
    await pool.query('TRUNCATE TABLE tutor_projects')
    const [exist] = await pool.query('SELECT COUNT(1) AS c FROM courses')
    if (Number(exist?.[0]?.c || 0) === 0) {
      const sample = {
        id: '1',
        title: '大数据分析与应用',
        poster_url: 'https://picsum.photos/seed/picsum/800/600',
        pic_url: 'https://picsum.photos/seed/picsum/800/600',
        teacher_name: 'C老师',
        teacher_school: '浙江大学',
        teacher_title: '导师',
        topic_description: '掌握大数据处理技术与商业智能分析方法',
        difficulty_score: 4.8,
        primary_subject: JSON.stringify(['计算机', '大数据']),
        secondary_subject: JSON.stringify(['统计学']),
        tutor_id: '1',
        main_tutor: JSON.stringify({ name: 'C老师', title: '教授', school: '浙江大学', highlights: ['资深导师'] }),
        sub_tutor: JSON.stringify({}),
        project_info: JSON.stringify({ format: '远程1V1', plan: '3-6个月' }),
        project_process: JSON.stringify([{ step: 1, title: '基础知识升级' }]),
        project_gain: JSON.stringify(['获得导师推荐信'])
      }
      await pool.query(
        `INSERT INTO courses 
        (id, title, pic_url, teacher_name, teacher_school, teacher_title, topic_description, difficulty_score, primary_subject, secondary_subject, tutor_id, main_tutor, sub_tutor, project_info, project_process, project_gain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sample.id, sample.title, sample.pic_url, sample.teacher_name, sample.teacher_school, sample.teacher_title,
          sample.topic_description, sample.difficulty_score, sample.primary_subject, sample.secondary_subject, sample.tutor_id,
          sample.main_tutor, sample.sub_tutor, sample.project_info, sample.project_process, sample.project_gain
        ]
      )
      const tp = {
        id: 'p1',
        tutor_id: '1',
        title: '数据挖掘与可视化',
        pic_url: 'https://picsum.photos/seed/picsum/800/600',
        poster_url: 'https://picsum.photos/seed/picsum/800/600',
        primary_subject: JSON.stringify(['计算机']),
        secondary_subject: JSON.stringify(['数据分析'])
      }
      await pool.query(
        `INSERT INTO tutor_projects (id, tutor_id, title, pic_url, primary_subject, secondary_subject)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tp.id, tp.tutor_id, tp.title, tp.pic_url, tp.primary_subject, tp.secondary_subject]
      )
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, message: e?.message || 'seed failed' })
  }
})
