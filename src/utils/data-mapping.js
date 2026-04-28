// 数据映射和处理工具

// 默认封面图片
export const DEFAULT_COVER = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1600&auto=format&fit=crop'

// 将值标准化为数组
export function normalizeToArray(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

// 获取文本值
export function getText(value) {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value) && value.length > 0) return value[0].trim()
  return ''
}

// 提取URL
export function extractUrl(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value) && value.length > 0) {
    if (typeof value[0] === 'string') return value[0].trim()
    if (value[0].url) return value[0].url.trim()
  }
  if (value.url) return value.url.trim()
  return ''
}

// 获取封面URL
export function getCoverUrl(item) {
  if (!item) return ''
  // 优先使用海报地址测试
  if (item.posterImg) return extractUrl(item.posterImg)
  // 其次使用头图地址测试
  if (item.headImg) return extractUrl(item.headImg)
  // 然后使用通用img字段
  if (item.img) return extractUrl(item.img)
  // 最后使用默认封面
  return DEFAULT_COVER
}

// 将字段名映射为英文
export function mapKeysToEnglish(fields) {
  if (!fields) return {}
  const mapping = {
    '教授课题名称': 'title',
    '课题名称': 'title',
    '项目名称': 'title',
    '标题': 'title',
    '课题描述': 'desc',
    '课题简介': 'desc',
    '项目简介': 'desc',
    '简介': 'desc',
    '描述': 'desc',
    'summary': 'desc',
    'content': 'desc',
    '一级学科': 'primary',
    '二级学科': 'secondary',
    '导师院校': 'university',
    '大学': 'university',
    '学校': 'university',
    '院校': 'university',
    'university': 'university',
    'school': 'university',
    '导师所在/毕业院校': 'university',
    'university_raw': 'university',
    'organization': 'university',
    'org_name': 'university',
    '导师姓名': 'teacher',
    '导师': 'teacher',
    '教师': 'teacher',
    'mentor_name_cn': 'teacher',
    'mentor': 'teacher',
    'teacher': 'teacher',
    'mentor_name': 'teacher',
    'teacher_name': 'teacher',
    '导师类型': 'mentorType',
    '导师职称': 'mentorType',
    '职称': 'mentorType',
    'mentor_title': 'mentorType',
    'title_job': 'mentorType',
    'title': 'mentorType',
    '适合专业': 'suit',
    '专业要求': 'suit',
    'suitable_major': 'suit',
    'major_requirement': 'suit',
    '头图地址测试': 'headImg',
    '海报地址测试': 'posterImg',
    'is_hidden': 'is_hidden'
  }
  
  const result = {}
  for (const [key, value] of Object.entries(fields)) {
    const englishKey = mapping[key] || key
    result[englishKey] = value
  }
  return result
}

// 截断文本
export function truncate(text, maxLength) {
  if (!text || typeof text !== 'string') return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
