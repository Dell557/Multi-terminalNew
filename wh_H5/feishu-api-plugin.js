import https from 'https';
import { detailCategories, detailCourses, detailOtherCourses, searchAllCourses } from './src/mock/courses.js'

const APP_ID = 'cli_a7aa3ac884b9d00c';
const APP_SECRET = 'npSXP56jD2kT0PgPl7DfkfjNxmwtLPuh';

const DEFAULT_POSTER_URL = '/H5_icon/meiyouneirong.png'

// Token 缓存
let tenantAccessToken = '';
let tokenExpireAt = 0;

const fetchJsonWithTimeout = async (url, options = {}, timeoutMs = 4500) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return await response.json()
  } finally {
    clearTimeout(timeout)
  }
}

// 获取飞书 Tenant Access Token
export async function getTenantAccessToken() {
  if (tenantAccessToken && Date.now() < tokenExpireAt) {
    return tenantAccessToken;
  }

  try {
    const data = await fetchJsonWithTimeout(
      'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          app_id: APP_ID,
          app_secret: APP_SECRET
        })
      },
      4500
    )

    if (data.code === 0) {
      tenantAccessToken = data.tenant_access_token;
      // 提前 5 分钟过期
      tokenExpireAt = Date.now() + (data.expire * 1000) - 300000;
      console.log('[Feishu API] Got new tenant_access_token');
      return tenantAccessToken;
    } else {
      throw new Error(`Feishu API Error: ${data.msg}`);
    }
  } catch (error) {
    console.error('[Feishu API] Failed to get tenant_access_token:', error);
    throw error;
  }
}

// 封装一个基础的飞书 API 请求函数
export async function feishuFetch(url, options = {}) {
  const token = await getTenantAccessToken();
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  const data = await fetchJsonWithTimeout(
    `https://open.feishu.cn/open-apis${url}`,
    {
      ...options,
      headers
    },
    4500
  )
  if (data.code !== 0) {
    console.error(`[Feishu API] Request failed: ${url}`, data);
  }
  return data;
}

// Vite 插件：用于拦截前端的 /api/courses 请求并代理到飞书 Bitable
export function feishuApiPlugin() {
  return {
    name: 'feishu-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const sendJson = (status, payload) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(payload))
        }

        const toTopicFromMock = (item) => {
          const tags = Array.isArray(item?.tags) ? item.tags : []
          return {
            id: String(item?.id ?? ''),
            title: item?.title || '',
            poster_url: DEFAULT_POSTER_URL,
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

        const urlObj = new URL(req.url || '/', 'http://localhost')

        if (urlObj.pathname === '/api/courses/categories' && req.method === 'GET') {
          sendJson(200, { code: 0, success: true, msg: 'success', data: detailCategories })
          return
        }

        const teacherMatch = urlObj.pathname.match(/^\/api\/courses\/teacher\/([^/]+)\/projects$/)
        if (teacherMatch && req.method === 'GET') {
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
          sendJson(200, { code: 0, success: true, msg: 'success', list })
          return
        }

        // 拦截获取单个课程详情的请求 (例如: /api/courses/topics/recv66iulzYI54)
        const detailMatch = urlObj.pathname.match(/^\/api\/courses\/topics\/([a-zA-Z0-9_-]+)$/);
        if (detailMatch && req.method === 'GET' && detailMatch[1] !== 'topics') {
          try {
            const recordId = detailMatch[1];
            const APP_TOKEN = 'HhWdbVvL9atRhzss0Ggc25lDnRx';
            const TABLE_ID = 'tblFZLlvetV0Lpcd';
            
            // 获取单条多维表格记录
            const bitableData = await feishuFetch(`/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${recordId}`);
            
            if (bitableData.code !== 0) {
              throw new Error(`获取飞书表格记录失败: ${bitableData.msg}`);
            }

            const record = bitableData.data.record || {};
            const fields = record.fields || {};
            
            // 提取嵌套的字段值
            const extractText = (field) => Array.isArray(field) && field[0] ? field[0].text : '';
            
            // 解析导师信息
            let teacherSchool = '';
            if (fields['导师信息']) {
              const parts = fields['导师信息'].split('/');
              if (parts.length >= 3) {
                teacherSchool = parts[2];
              }
            }

            const posterUrl = extractText(fields['头图地址测试']) || extractText(fields['海报地址测试']) || DEFAULT_POSTER_URL;

            const detailData = {
              id: record.record_id,
              title: fields['教授课题名称'] || fields['课题名称'] || '',
              poster_url: posterUrl,
              teacher_name: extractText(fields['导师姓名']) || extractText(fields['导师姓名脱敏']) || '',
              teacher_school: teacherSchool || '',
              teacher_title: extractText(fields['导师职称/学历']) || '导师',
              topic_description: fields['课题描述'] || '',
              difficulty_score: Number(fields['难度等级']) || 4.5,
              primary_subject: fields['一级学科'] || [],
              secondary_subject: fields['二级学科'] || [],
              tutor_id: extractText(fields['导师编号']) || '1',
              
              // 补充详情页需要的 Mock 结构（如果多维表格里没有这些字段，暂时用假数据占位）
              mainTutor: {
                name: extractText(fields['导师姓名']) || extractText(fields['导师姓名脱敏']) || '导师',
                title: extractText(fields['导师职称/学历']) || '教授',
                school: teacherSchool || '未知院校',
                specialty: extractText(fields['导师研究方向']) || '',
                highlights: [extractText(fields['导师亮点']) || '资深导师'],
                points: [extractText(fields['导师亮点']) || '资深导师']
              },
              projectInfo: {
                background: fields['课题描述'] || '',
                objective: '通过本课题的学习，掌握相关领域的核心理论与实践能力。',
                suitability: (fields['适合专业多选'] || []).join('、') || fields['适合专业'] || '对本课题感兴趣的学生'
              },
              projectProcess: [
                { title: '阶段一：基础理论', desc: '学习相关基础知识' },
                { title: '阶段二：深入研究', desc: '开展核心课题研究' }
              ],
              projectGain: [
                '掌握核心知识技能',
                '获得导师推荐信机会',
                '提升学术研究能力'
              ]
            };

            sendJson(200, { code: 0, success: true, msg: 'success', data: detailData })
          } catch (error) {
            const fallback = toDetailFromMock(
              detailCourses.find((c) => String(c?.id) === String(urlObj.pathname.split('/').pop())) || detailCourses[0],
              urlObj.pathname.split('/').pop()
            )
            sendJson(200, { code: 0, success: true, msg: 'mock_fallback', data: fallback })
          }
          return;
        }

        // 拦截获取课程列表的请求
        if (urlObj.pathname === '/api/courses/topics' && req.method === 'GET') {
          try {
            const APP_TOKEN = 'HhWdbVvL9atRhzss0Ggc25lDnRx';
            const TABLE_ID = 'tblFZLlvetV0Lpcd';
            
            // 获取多维表格记录
            const bitableData = await feishuFetch(`/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`);
            
            if (bitableData.code !== 0) {
              throw new Error(`获取飞书表格数据失败: ${bitableData.msg}`);
            }

            // 映射飞书数据到前端需要的格式
            const records = bitableData.data.items || [];
            const topics = records.map(record => {
              const fields = record.fields || {};
              
              // 提取嵌套的字段值
              const extractText = (field) => Array.isArray(field) && field[0] ? field[0].text : '';
              
              // 解析导师学校 (从 "导师信息" 字段中提取: 姓名/职称/学校/方向)
              let teacherSchool = '';
              if (fields['导师信息']) {
                const parts = fields['导师信息'].split('/');
                if (parts.length >= 3) {
                  teacherSchool = parts[2];
                }
              }

              // 提取海报或头图
              const posterUrl = extractText(fields['头图地址测试']) || extractText(fields['海报地址测试']) || DEFAULT_POSTER_URL;

              return {
                id: record.record_id,
                title: fields['教授课题名称'] || fields['课题名称'] || '',
                poster_url: posterUrl,
                teacher_name: extractText(fields['导师姓名']) || extractText(fields['导师姓名脱敏']) || '',
                teacher_school: teacherSchool || '',
                teacher_title: extractText(fields['导师职称/学历']) || '导师',
                topic_description: fields['课题描述'] || '',
                difficulty_score: Number(fields['难度等级']) || 4.5,
                primary_subject: fields['一级学科'] || [],
                secondary_subject: fields['二级学科'] || [],
                tutor_id: extractText(fields['导师编号']) || '1'
              };
            });

            const keyword = String(urlObj.searchParams.get('keyword') || '').trim().toLowerCase()
            const limit = Number(urlObj.searchParams.get('limit') || 0)
            let filtered = topics
            if (keyword) filtered = filtered.filter((t) => String(t?.title || '').toLowerCase().includes(keyword))
            if (Number.isFinite(limit) && limit > 0) filtered = filtered.slice(0, limit)
            sendJson(200, { code: 0, success: true, msg: 'success', topics: filtered })
          } catch (error) {
            const keyword = String(urlObj.searchParams.get('keyword') || '').trim().toLowerCase()
            const limit = Number(urlObj.searchParams.get('limit') || 0)
            let topics = (Array.isArray(searchAllCourses) ? searchAllCourses : []).map(toTopicFromMock)
            if (keyword) topics = topics.filter((t) => String(t?.title || '').toLowerCase().includes(keyword))
            if (Number.isFinite(limit) && limit > 0) topics = topics.slice(0, limit)
            sendJson(200, { code: 0, success: true, msg: 'mock_fallback', topics })
          }
          return;
        }

        next();
      });
    }
  };
}
