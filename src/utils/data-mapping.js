
export const DEFAULT_COVER = 'https://plus.unsplash.com/premium_photo-1664302452049-743034bba26c?q=80&w=1600&auto=format&fit=crop'

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
  if (!val) return null
  
  // 1. 如果是字符串，直接匹配 http/https
  if (typeof val === 'string') {
    const match = val.match(/(https?:\/\/[^\s"'<>]+)/)
    return match ? match[0] : null
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
    return val.url || val.link || val.image_url || extractUrl(val.text)
  }
  
  return null
}

export const getCoverUrl = (fields) => {
  const def = DEFAULT_COVER
  if (!fields) return def

  // 1. 尝试匹配所有可能的字段名 (优先使用 poster_image_test)
  const candidates = [
    'poster_image_test', '海报地址测试', 
    'cover_image_test', '头图地址测试', 
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

    // 调试日志：如果找到了海报字段，打印一下它的结构
    if (key === 'poster_image_test' || key === '海报地址测试') {
      // console.log(`🔍 Found potential cover in [${key}]:`, v)
    }

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
      if (key === 'poster_image_test' || key === '海报地址测试') {
        // console.log(`✅ Successfully extracted URL from [${key}]:`, url)
      }
      return url
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
  '描述': 'description_raw',
  '头图地址测试': 'cover_image_test',
  '海报地址测试': 'poster_image_test',
  'img': 'image_raw',
  'card-cover': 'card_cover',
  '封面图': 'cover_image',
  '图片': 'image',
  '海报': 'poster',
  '封面': 'cover',
  '导师所在/毕业院校': 'university_raw',
  '大学': 'university',
  '学校': 'school',
  '院校': 'college',
  '导师姓名': 'mentor_name_cn',
  '导师': 'mentor',
  '教师': 'teacher',
  '导师类型': 'mentor_type_cn',
  '导师职称': 'mentor_title',
  '职称': 'title_job',
  '适合专业': 'suitable_major',
  '专业要求': 'major_requirement'
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
