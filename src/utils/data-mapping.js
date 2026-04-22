
export const DEFAULT_COVER_BASE = 'https://plus.unsplash.com/premium_photo-1664302452049-743034bba26c?q=80&auto=format&fit=crop'
export const DEFAULT_COVER = `${DEFAULT_COVER_BASE}&w=400`

export const normalizeToArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim()
        if (item && typeof item === 'object') {
          if (typeof item.text === 'string') return item.text.trim()
          if (typeof item.name === 'string') return item.name.trim()
        }
        return ''
      })
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    if (typeof value.text === 'string') return [value.text.trim()]
    if (typeof value.name === 'string') return [value.name.trim()]
  }
  return [String(value).trim()]
}

export const getText = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    // 过滤飞书 Option ID (通常以 opt 开头，长度约为 10-15 位)
    if (value.startsWith('opt') && value.length < 20) {
      return ''
    }
    return value
  }
  if (Array.isArray(value)) {
    // 如果是数组，取出第一个有效文本，或者拼接
    // 对于标题等字段，通常取第一个
    const first = value[0]
    return getText(first)
  }
  if (typeof value === 'object') {
    // 优先检查 value 字段 (针对飞书 { type: 3, value: [...] } 结构)
    if (value.value) return getText(value.value)
    return value.text || value.name || ''
  }
  return String(value)
}


export const truncate = (s, max) => {
  if (!s) return ''
  const t = String(s).trim()
  if (!max || max <= 0) return t
  return t.length > max ? t.slice(0, max).replace(/\s+$/, '') + '...' : t
}

export const extractUrl = (val) => {
  const sanitizeUrl = (url) => {
    if (!url) return null
    const trimmed = String(url).trim().replace(/^`+|`+$/g, '')
    if (!trimmed) return null
    const isFeishuDrive = /https?:\/\/open\.feishu\.cn\/open-apis\/drive\/v1\/medias\//i.test(trimmed)
    const hasAccessToken = /[?&](access_token|tenant_access_token)=/i.test(trimmed)
    if (isFeishuDrive && !hasAccessToken) return null
    return trimmed
  }

  if (!val) return null
  
  // 1. 如果是字符串，直接匹配 http/https
  if (typeof val === 'string') {
    const match = val.match(/(https?:\/\/[^\s"'<>]+)/)
    return match ? sanitizeUrl(match[0]) : null
  }

  // 2. 如果是数组，递归查找第一个有效链接
  if (Array.isArray(val)) {
    for (const item of val) {
      const url = extractUrl(item)
      if (url) return url
    }
    return null
  }

  // 3. 如果是对象
  if (typeof val === 'object') {
    // 3.1 检查 value 数组 (飞书文本字段常见结构)
    if (Array.isArray(val.value)) {
      return extractUrl(val.value)
    }
    
    // 3.2 检查常见的 URL 字段
    return sanitizeUrl(val.url) || sanitizeUrl(val.link) || sanitizeUrl(val.image_url) || extractUrl(val.text)
  }
  
  return null
}

const optimizeUrl = (url, width) => {
  if (!url) return null
  if (url.includes('unsplash.com')) {
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, `w=${width}`)
    }
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}w=${width}`
  }
  return url
}

export const getCoverUrl = (fields, width = 400) => {
  const def = `${DEFAULT_COVER_BASE}&w=${width}`
  if (!fields) return def

  // 1. 尝试匹配所有可能的字段名 (优先使用 poster_image_test)
  const candidates = [
    'cover_image_test', '头图地址测试',
    'poster_image_test', '海报地址测试',
    'image_raw', 'img', 
    'card_cover', 'card-cover', 
    'cover_image', '封面图', 
    'image', '图片', 
    'poster', '海报', 
    'cover', '封面'
  ]
  
  for (const key of candidates) {
    const v = fields[key]
    if (!v) continue

    let url = null
    if (Array.isArray(v)) {
      for (const item of v) {
        url = extractUrl(item)
        if (url) break
      }
    } else {
      url = extractUrl(v)
    }

    if (url) {
      return optimizeUrl(url, width)
    }
  }

  return def
}

// 字段名中英文映射表
export const fieldMapping = {
  '一级学科': 'primary_subject',
  '二级学科': 'secondary_subject',
  '教授课题名称': 'project_name_cn',
  '课题名称': 'project_name',
  '项目名称': 'project_name',
  '标题': 'title_raw',
  '课题描述': 'description_cn',
  '课题简介': 'description_intro',
  '项目简介': 'project_intro',
  '简介': 'description_intro',
  '描述': 'description_raw',
  '头图地址测试': 'cover_image_test',
  '海报地址测试': 'poster_image_test',
  '头图': 'cover_image_test',
  '海报': 'poster_image_test',
  'img': 'image_raw',
  'card-cover': 'card_cover',
  '封面图': 'cover_image',
  '图片': 'image',
  '导师所在/毕业院校': 'university_raw',
  '大学': 'university',
  '学校': 'school',
  '院校': 'college',
  '导师院校': 'university',
  '导师姓名': 'mentor_name_cn',
  '导师': 'mentor',
  '教师': 'teacher',
  '导师类型': 'mentor_type_cn',
  '导师职称': 'mentor_title',
  '职称': 'title_job',
  '适合专业': 'suitable_major',
  '专业要求': 'major_requirement',
  '浏览量': 'views',
  '浏览次数': 'views'
};

export const mapKeysToEnglish = (fields) => {
  const newFields = {};
  Object.keys(fields).forEach(key => {
    // 如果有映射则用英文，否则保留原样
    const englishKey = fieldMapping[key] || key; 
    newFields[englishKey] = fields[key];
  });
  return newFields;
};
