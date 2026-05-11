// 智能分析模块 - 纯前端实现，零依赖，加载时间 < 10ms

// ========== 同义词库 ==========
const synonymMap = {
  // 学科类
  '计算机': ['编程', '软件', '算法', 'AI', '人工智能', '机器学习', '深度学习', '数据科学', '前端', '后端', '开发', '代码', 'IT', '互联网', '网络', '系统', '架构', '数据库', '云计算', '大数据'],
  '医学': ['生物', '健康', '临床', '药学', '医疗', '医生', '医院', '疾病', '药物', '护理', '公共卫生', '预防', '诊断', '治疗'],
  '经济': ['金融', '商业', '管理', '财会', '会计', '市场', '营销', '贸易', '投资', '银行', '证券', '保险', '财务'],
  '工程': ['机械', '电子', '电气', '土木', '建筑', '材料', '化工', '能源', '动力', '自动化', '制造', '工业'],
  '理学': ['数学', '物理', '化学', '生物', '地理', '天文', '统计', '应用数学', '基础科学'],
  '文学': ['语言', '中文', '英文', '外语', '翻译', '写作', '新闻', '传播', '出版', '编辑'],
  '法学': ['法律', '法规', '司法', '律师', '诉讼', '宪法', '民法', '刑法', '国际法'],
  '教育': ['教学', '培训', '课程', '学习', '学校', '教师', '学生', '教育技术', '心理学'],
  '艺术': ['设计', '音乐', '美术', '绘画', '影视', '动画', '摄影', '表演', '舞蹈', '创意'],
  '农业': ['农学', '园艺', '畜牧', '兽医', '林业', '渔业', '食品', '营养'],
  
  // 导师级别
  '教授': ['正教授', 'professor', '博导', '博士生导师'],
  '副教授': ['副教', 'associate professor'],
  '讲师': ['lecturer', '老师'],
  '博士': ['phd', 'doctor', '博士生', '博士后'],
  '院士': ['academician', '科学院', '工程院'],
  
  // 研究方向
  '人工智能': ['AI', '机器学习', '深度学习', '神经网络', '自然语言处理', '计算机视觉', 'CV', 'NLP'],
  '大数据': ['数据分析', '数据挖掘', '数据科学', 'hadoop', 'spark', '数据仓库'],
  '新能源': ['太阳能', '风能', '电池', '锂电', '光伏', '清洁能源', '碳中和', '双碳'],
  '生物医药': ['制药', '基因', '细胞', '免疫', '疫苗', '蛋白质', '分子生物学'],
  '材料科学': ['纳米', '半导体', '高分子', '复合材料', '新材料'],
  '环境': ['环保', '生态', '污染', '可持续发展', '气候变化', '碳中和'],
}

// ========== 意图识别规则 ==========
const intentPatterns = [
  { intent: 'course_recommend', patterns: [/推荐/, /适合/, /什么课程/, /有什么课/, /选课/, /选什么/, /学什么/, /建议/, /哪个.*好/] },
  { intent: 'subject_query', patterns: [/专业/, /学科/, /方向/, /领域/, /分类/, /属于/] },
  { intent: 'mentor_search', patterns: [/导师/, /教授/, /老师/, /谁教/, /师资/, /博导/, /谁带/] },
  { intent: 'difficulty_query', patterns: [/难度/, /难吗/, /容易/, /适合.*基础/, /入门/, /高级/, /初级/] },
  { intent: 'career_query', patterns: [/就业/, /工作/, /前景/, /出路/, /薪资/, /赚钱/, /职业/, /发展/] },
  { intent: 'comparison', patterns: [/对比/, /区别/, /哪个.*好/, /比较/, /差异/, /不同/] },
  { intent: 'greeting', patterns: [/你好/, /hi/, /hello/, /嗨/, /在吗/, /有人吗/, /help/] },
  { intent: 'thanks', patterns: [/谢谢/, /感谢/, /thanks/, /thank/, /多谢/, /thx/] },
]

// ========== 回复模板 ==========
const replyTemplates = {
  course_recommend: (keywords) => {
    const kwStr = keywords.slice(0, 3).join('、')
    return `根据你的兴趣，我为你推荐以下方向：\n\n📚 关键词：${kwStr}\n\n建议你在筛选器中选择相关学科分类，或者使用搜索框输入这些关键词来查找课程~\n\n需要我帮你更精确地筛选吗？`
  },
  subject_query: (keywords) => {
    return `关于学科方向的问题：\n\n你提到的「${keywords[0] || '该领域'}」属于我们的课程覆盖范围。\n\n你可以在页面顶部的学科分类筛选器中查找相关课程，或者告诉我更具体的方向，我来帮你推荐~`
  },
  mentor_search: (keywords) => {
    return `关于导师信息：\n\n我们的课程由来自985/211高校的教授、副教授担任导师。\n\n你可以在课程详情页查看导师的详细介绍，包括研究方向、学术成果等。\n\n想了解特定导师吗？告诉我名字或研究方向~`
  },
  difficulty_query: (keywords) => {
    return `关于课程难度：\n\n我们的课程分为不同难度级别：\n🟢 入门级 - 适合零基础\n🟡 进阶级 - 需要一定基础\n 高级 - 适合有经验的学员\n\n你可以在课程详情中查看具体难度标注，也可以告诉我你的基础情况，我来推荐合适的课程~`
  },
  career_query: (keywords) => {
    return `关于就业前景：\n\n我们课程的学员毕业后主要去向：\n🎓 继续深造（考研/出国）\n💼 进入知名企业工作\n🔬 从事科研工作\n\n不同专业的就业前景各有特点，告诉我你感兴趣的方向，我可以给你更详细的建议~`
  },
  comparison: (keywords) => {
    return `关于对比分析：\n\n要对比不同课程或专业，建议：\n1. 查看各课程的详细介绍\n2. 对比导师背景和研究方向\n3. 了解课程难度和前置要求\n\n告诉我你想对比的具体内容，我来帮你分析~`
  },
  greeting: () => {
    const greetings = [
      '你好呀！👋 很高兴见到你~\n\n我可以帮你：\n• 推荐适合的课程\n• 解答课程相关问题\n• 提供专业选择建议\n\n有什么想了解的都可以问我哦！',
      '嗨！😊 我是课程小助手~\n\n无论你想了解课程信息、专业选择，还是需要学习建议，我都可以帮你！\n\n请问有什么可以帮你的吗？',
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  },
  thanks: () => {
    const thanks = [
      '不客气！😊 如果还有其他问题，随时可以问我哦~\n\n祝你学习愉快！',
      '很高兴能帮到你！🎉\n\n有任何问题都可以继续问我，我会尽力帮助你~',
    ]
    return thanks[Math.floor(Math.random() * thanks.length)]
  },
}

// 默认回复
const defaultReply = `感谢你的提问！🤔\n\n我目前还在学习阶段，可能无法完全理解你的问题。\n\n建议你：\n1. 使用页面顶部的搜索框查找课程\n2. 通过学科分类筛选器浏览课程\n3. 联系课程顾问获取专业建议\n\n我会不断学习的，争取早日为你提供更好的帮助！`

// ========== 核心分析函数 ==========

/**
 * 分析用户输入，返回意图和关键词
 * @param {string} input - 用户输入
 * @returns {{ intent: string, keywords: string[], expandedKeywords: string[] }}
 */
export function analyzeInput(input) {
  if (!input || !input.trim()) {
    return { intent: 'unknown', keywords: [], expandedKeywords: [] }
  }

  const trimmed = input.trim()
  
  // 1. 意图识别
  const intent = detectIntent(trimmed)
  
  // 2. 提取关键词
  const keywords = extractKeywords(trimmed)
  
  // 3. 扩展关键词（同义词）
  const expandedKeywords = expandKeywords(keywords)

  return { intent, keywords, expandedKeywords }
}

/**
 * 检测用户意图
 */
function detectIntent(input) {
  for (const { intent, patterns } of intentPatterns) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return intent
      }
    }
  }
  return 'unknown'
}

/**
 * 提取关键词（简单分词 + 匹配词典）
 */
function extractKeywords(input) {
  const keywords = []
  const allTerms = Object.keys(synonymMap)
  
  // 按长度降序排序，优先匹配长词
  const sortedTerms = [...allTerms].sort((a, b) => b.length - a.length)
  
  let remaining = input
  for (const term of sortedTerms) {
    if (remaining.includes(term)) {
      keywords.push(term)
      // 移除已匹配的关键词，避免重复
      remaining = remaining.replace(new RegExp(term, 'g'), '')
    }
  }
  
  return keywords
}

/**
 * 扩展关键词（添加同义词）
 */
function expandKeywords(keywords) {
  const expanded = new Set(keywords)
  
  for (const keyword of keywords) {
    const synonyms = synonymMap[keyword]
    if (synonyms) {
      synonyms.forEach(s => expanded.add(s))
    }
  }
  
  return Array.from(expanded)
}

/**
 * 生成智能回复
 * @param {string} input - 用户输入
 * @returns {string} 回复内容
 */
export function generateReply(input) {
  const { intent, keywords } = analyzeInput(input)
  
  // 使用模板生成回复
  const templateFn = replyTemplates[intent]
  if (templateFn) {
    return templateFn(keywords)
  }
  
  // 尝试关键词匹配回复（兼容旧逻辑）
  const keywordReply = generateKeywordReply(keywords)
  if (keywordReply) {
    return keywordReply
  }
  
  return defaultReply
}

/**
 * 基于关键词生成回复（兼容旧逻辑）
 */
function generateKeywordReply(keywords) {
  const kwStr = keywords.join('')
  
  if (keywords.some(k => ['计算机', '编程', '代码', 'AI', '软件'].includes(k))) {
    return '推荐你查看以下计算机相关课程：\n\n1. 人工智能驱动的医疗影像诊断系统\n2. 下一代电力电子：宽禁带半导体\n\n你可以在筛选器中选择"工学" -> "计算机类"来查看更多课程~'
  }
  
  if (keywords.some(k => ['医学', '生物', '健康'].includes(k))) {
    return '医学和生物类课程推荐：\n\n• 全球气候变化下的城市生态韧性评估\n• 高性能锂离子电池正极材料研究\n\n建议查看"医学"或"理学"分类下的课程哦~'
  }
  
  return null
}

/**
 * 计算查询与课程的匹配度
 * @param {string} query - 用户查询
 * @param {object} course - 课程对象
 * @returns {number} 匹配分数 (0-100)
 */
export function calculateMatchScore(query, course) {
  const { expandedKeywords } = analyzeInput(query)
  if (expandedKeywords.length === 0) return 0
  
  let score = 0
  const searchableText = [
    course.title || '',
    course.description || '',
    course.primary || '',
    course.secondary || '',
    course.teacher || '',
    course.university || '',
  ].join(' ').toLowerCase()
  
  for (const keyword of expandedKeywords) {
    if (searchableText.includes(keyword.toLowerCase())) {
      score += 10
    }
  }
  
  // 归一化到 0-100
  return Math.min(100, Math.round((score / expandedKeywords.length) * 10))
}

/**
 * 对课程列表进行智能排序
 * @param {string} query - 用户查询
 * @param {array} courses - 课程列表
 * @returns {array} 排序后的课程列表
 */
export function smartSortCourses(query, courses) {
  if (!query || !courses || courses.length === 0) return courses
  
  const scored = courses.map(course => ({
    ...course,
    matchScore: calculateMatchScore(query, course)
  }))
  
  return scored
    .filter(c => c.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
}
