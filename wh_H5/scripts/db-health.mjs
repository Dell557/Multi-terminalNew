import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

dotenv.config({ path: path.resolve(projectRoot, '.env') })
dotenv.config({ path: path.resolve(projectRoot, '.env.development'), override: false })

const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'topic_mall',
  table: String(process.env.MYSQL_TABLE || 'courses').trim(),
  connectTimeout: Math.max(500, Number(process.env.DB_CONNECT_TIMEOUT || 4000))
}

const run = async () => {
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    connectTimeout: cfg.connectTimeout
  })

  const [pingRows] = await conn.query('SELECT 1 AS ok')
  const safeTable = /^[A-Za-z0-9_]+$/.test(cfg.table) ? cfg.table : 'courses'
  const [countRows] = await conn.query(`SELECT COUNT(1) AS c FROM \`${safeTable}\``)

  const payload = {
    ok: pingRows?.[0]?.ok === 1,
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    table: safeTable,
    rowCount: Number(countRows?.[0]?.c || 0)
  }

  console.log(JSON.stringify(payload, null, 2))
  await conn.end()
}

run().catch((error) => {
  const info = {
    ok: false,
    code: error?.code || '',
    message: error?.message || 'UNKNOWN_DB_ERROR',
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    table: cfg.table
  }
  console.error(JSON.stringify(info, null, 2))
  process.exit(1)
})
