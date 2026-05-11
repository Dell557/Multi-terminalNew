<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, ArrowLeft, CaretBottom, View, WarningFilled, RefreshRight } from '@element-plus/icons-vue'
import { getRecord, searchRecords, updateRecord, getFriendlyError, isConfigured, isBitableConfigured, getBitableConfig } from '@/utils/feishu'
import { normalizeToArray, getText, getCoverUrl, extractUrl, DEFAULT_COVER, mapKeysToEnglish } from '@/utils/data-mapping'
import { scrollToTop, getHeroImageSrc, openInNewTab, useDarkMode } from '@/utils/ui'
import { logger } from '@/utils/logger'
import FixedActionPanel from '@/components/FixedActionPanel.vue'
import logoImg from '@/images/logo.jpg'
import teacherImg from '@/images/detail/teacher.webp'
import outcomeImg1 from '@/images/detail/textDetail/Mask group.png'
import outcomeImg2 from '@/images/detail/textDetail/image 17.jpg'
import outcomeImg3 from '@/images/detail/textDetail/image 18.png'
import outcomeImg4 from '@/images/detail/textDetail/image 20.png'
import outcomeImg5 from '@/images/detail/textDetail/image 21.png'
import outcomeDoc1 from '@/images/detail/qhua2.jpg'
import outcomeDoc2 from '@/images/detail/leffer.png'
import outcomeDoc3 from '@/images/detail/com.jpg'
import publicImg from '@/images/public.jpg'
import xiangmuxinxiIcon from '@/images/icon_ewd2dbl138v/xiangmuxinxi.png'
import daoshijieshaoIcon from '@/images/icon_ewd2dbl138v/daoshijieshao.png'
import xiangmushouhuoIcon from '@/images/icon_ewd2dbl138v/xiangmushouhuo.png'
import xiangmuchengguoIcon from '@/images/icon_ewd2dbl138v/xiangmuchengguo.png'
import laoshixiangqingIcon from '@/images/icon_ewd2dbl138v/laoshixiangqing.png'
import cankaolaoshiIcon from '@/images/icon_ewd2dbl138v/cankaolaoshi.png'
import qitaketiIcon from '@/images/icon_ewd2dbl138v/qitaketi.png'
import shensemoshiIcon from '@/images/icon_ewd2dbl138v/shensemoshi.png'
import qiansemoshiIcon from '@/images/icon_ewd2dbl138v/qiansemoshi.png'
import xiazaihaibaoIcon from '@/images/icon_ewd2dbl138v/xiazaihaibao.png'
import fanhuidingbuIcon from '@/images/icon_ewd2dbl138v/fanhuidingbu.png'
import xiangmuxingshiIcon from '@/images/icon_ewd2dbl138v/a-xiangmuxingshi.png'
import xiangmuliuchengIcon from '@/images/icon_ewd2dbl138v/xiangmuliucheng.png'

const route = useRoute()
const router = useRouter()

import { useSticky } from '@/utils/sticky'
const stickyCardRef = ref(null)
const firstSideCardRef = ref(null)
const { isSticky, stickyTop } = useSticky(
  () => stickyCardRef.value ? stickyCardRef.value.$el : null,
  () => firstSideCardRef.value ? firstSideCardRef.value.$el : null,
  { headerHeight: 80, offset: 16 }
)

const { isDarkMode, toggleDarkMode } = useDarkMode()

// 监听深色模式变化，同步更新 HTML 和 body 的类名
watch(isDarkMode, (newVal) => {
  if (newVal) {
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('dark')
  }
}, { immediate: true })

// 监听路由参数变化，重新加载数据并重置滚动位置
watch(() => route.params.id, () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  loadData()
})


const fetchedData = ref(null)
const isLoading = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const errorType = ref('')

const { appToken, tableId } = getBitableConfig()

// 加载数据函数（可重试）
const loadData = async () => {
  const id = route.params.id
  const loadStartTime = performance.now()
  
  logger.info('DetailView', 'Start loading detail data', { id })

  if (!id) {
    logger.warn('DetailView', 'No ID provided in route')
    return
  }

  isLoading.value = true
  isError.value = false
  errorMessage.value = ''
  errorType.value = ''

  try {
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 10000)
      const respStart = performance.now()
      const resp = await fetch(`/api/courses/${encodeURIComponent(String(id))}`, { signal: controller.signal })
      const respDuration = performance.now() - respStart
      clearTimeout(t)
      
      logger.info('DetailView', 'API response', {
        id,
        status: resp.status,
        duration: `${respDuration.toFixed(2)}ms`
      })
      
      if (resp.ok) {
        const data = await resp.json()
        if (data?.item?.fields) {
          fetchedData.value = data.item
          logger.info('DetailView', 'Data loaded from API', {
            id,
            hasFields: !!data.item.fields
          })
          await loadRelatedProjects()
          return
        }
      }
    } catch (e) {
      logger.error('DetailView', 'API request failed', e, { id })
    }

    if (!isConfigured()) {
      isError.value = true
      errorMessage.value = '未配置飞书 API，请联系管理员配置环境变量'
      errorType.value = 'config'
      return
    }

    if (!isBitableConfigured()) {
      isError.value = true
      errorMessage.value = '未配置多维表格，请联系管理员配置环境变量'
      errorType.value = 'config'
      return
    }

    const feishuStart = performance.now()
    try {
      logger.info('DetailView', 'Fetching record from Feishu', { id, appToken, tableId })
      
      const record = await getRecord(appToken, tableId, id)
      const feishuDuration = performance.now() - feishuStart
      
      if (record) {
        logger.info('DetailView', 'Record fetched successfully', {
          id,
          duration: `${feishuDuration.toFixed(2)}ms`,
          hasFields: !!record.fields
        })
        fetchedData.value = record

        // 自动增加浏览量
        try {
          const sessionKey = `viewed_${id}`;
          if (!sessionStorage.getItem(sessionKey)) {
             const currentViews = record.fields['浏览量'] || record.fields['浏览次数'] || 0;
             const newViews = currentViews + 1;

             // 乐观更新本地数据
             if (fetchedData.value.fields) {
               fetchedData.value.fields['浏览量'] = newViews;
             }

             // 异步更新后端
             if (String(id).startsWith('rec')) {
               updateRecord(appToken, tableId, id, { '浏览量': newViews }).then(() => {
                 console.log('👀 Views incremented to', newViews);
                 sessionStorage.setItem(sessionKey, 'true');
               }).catch(err => {
                 console.error('Failed to update views in backend:', err);
               });
             }
          }
        } catch (err) {
          console.error('Failed to handle view increment:', err);
        }

        await loadRelatedProjects()
      } else {
        logger.warn('DetailView', 'No record found', { id })
        isError.value = true
        errorMessage.value = '未找到该课题信息'
        errorType.value = 'not_found'
      }
    } catch (e) {
      const feishuDuration = performance.now() - feishuStart
      logger.error('DetailView', 'Failed to fetch record from Feishu', e, {
        id,
        duration: `${feishuDuration.toFixed(2)}ms`
      })
      
      const friendlyErr = getFriendlyError(e)
      isError.value = true
      errorMessage.value = friendlyErr.friendlyMessage
      errorType.value = friendlyErr.type
    }
  } finally {
    const totalDuration = performance.now() - loadStartTime
    isLoading.value = false
    logger.info('DetailView', 'Data load completed', {
      id,
      totalDuration: `${totalDuration.toFixed(2)}ms`,
      success: !isError.value
    })
  }
}

// 重试加载
const handleRetry = () => {
  loadData()
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {})

const searchText = ref('')

const item = computed(() => {
  const defaults = {
    id: route.params.id,
    title: '案例研修：宽禁带半导体功率器件设计与智能控制应用',
    university: '南京大学',
    teacher: 'J老师',
    primary: '工学',
    secondary: '材料类',
    desc: '课程围绕宽禁带半导体功率器件的物理基础、器件结构设计以及在新能源电力电子系统中的工程应用展开，以项目制方式带领学生完成从理论到仿真再到方案设计的完整闭环。',
    refMentorName: 'J老师',
    refMentorTitle: '教授',
    projectForm: '远程1V1，支持全国学生线上参与，全年滚动开营',
    projectPlan: '远程科研+成果打磨（3-6个月），支持会议论文及项目申报',
    mainMentorIntro: [
      '清北、中科院等985、211高校教授、副教授担任主导师',
      '主持多项国家重点研发计划、国家自然科学基金项目',
      '长期指导高中生、本科生参与真实科研课题与工程项目',
      '具备扎实的国际会议及高水平期刊发表经验'
    ],
    viceMentorIntro: [
      '清北等双一流高校博士组成助教导师团',
      '熟悉目标专业的培养方案与升学路径规划',
      '具备扎实的科研方法论与论文写作指导经验',
      '可提供从基础补课到成果打磨的全流程陪伴'
    ],
    projectFlow: [
      '科研基础夯实：梳理背景知识、搭建理论框架，熟悉常用仿真与数据分析工具',
      '方向研读进阶：精读代表性论文与案例，明确细分研究选题与技术路线',
      '课题实践推进：在导师带领下完成建模仿真、实验设计或数据分析等核心工作',
      '成果打磨输出：完善科研报告或论文初稿，完成修改润色与展示准备'
    ],
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVsDcyeTttES1IDZMK-vp770XwEk4W84Og2wvwuWlJ17nfm9Y0zjoWGTHGXjqmTtaXlocRxmimCOJrhVesjpx9v5Ck9f8KD8cJK8r9iSo30PxydtV1q-uy28n3xju7guBjxmBQgFaynr1i_K55urVFL7KnygeD-AjB7lpOeKK4PyzNNXk995o6kJjxRMtgWHuqQPodpKBl295CkMW95VUWBxzWoV4pJios2GH1Vp5HHKIg0OfnXzATL83xkMsgJBH2F1QCYjpfhqY',
    views: 2345
  }

  if (!fetchedData.value || !fetchedData.value.fields) {
    return defaults
  }

  try {
    const f = fetchedData.value.fields
    const englishFields = mapKeysToEnglish(f)
    const combined = { ...f, ...englishFields }

    const title = getText(combined.project_name_cn || combined.project_name || combined.title_raw || combined.title)
    const desc = getText(combined.description_cn || combined.description_intro || combined.project_intro || combined.description_raw || combined.summary || combined.content)
    const university = getText(combined.university || combined['导师院校'] || combined.school || combined.college || combined.university_raw || combined.organization || combined.org_name)
    const teacher = getText(combined.mentor_name_cn || combined.mentor || combined.teacher || combined.mentor_name || combined.teacher_name)
    const mentorType = getText(combined.mentorType || combined.mentor_type_cn || combined.mentor_title || combined.title_job || combined.title)
    const primaryList = normalizeToArray(combined.primary_subject || combined.category1 || combined.level1)
    const secondaryList = normalizeToArray(combined.secondary_subject || combined.category2 || combined.level2)
    const imgUrl = getCoverUrl(combined)
    const headImgUrl = extractUrl(combined.cover_image_test || combined['头图地址测试'] || combined.banner_url)
    const views = combined.views || combined['浏览量'] || combined['浏览次数'] || defaults.views

    const finalItem = {
      ...defaults,
      id: fetchedData.value.record_id,
      title: title || defaults.title,
      university: university || defaults.university,
      teacher: teacher || defaults.teacher,
      primary: primaryList[0] || defaults.primary,
      secondary: secondaryList[0] || defaults.secondary,
      desc: desc || defaults.desc,
      refMentorName: teacher || defaults.refMentorName,
      refMentorTitle: mentorType || defaults.refMentorTitle,
      img: imgUrl || defaults.img,
      headImg: headImgUrl,
      views: views
    }

    console.log('🎨 Computed Final Item:', finalItem)
    return finalItem
  } catch (err) {
    console.error('❌ Error computing item:', err)
    return defaults
  }
})

const expertise = computed(() => {
  return [
    '宽禁带半导体功率器件物理与结构设计',
    '高效电能变换与电力电子拓扑',
    '新能源发电与智能电网接口技术',
    '多物理场仿真与器件可靠性评估',
    '工程应用中的系统级优化与控制策略'
  ]
})

const harvests = [
  {
    title: '科研经历',
    img: outcomeImg1
  },
  {
    title: '学术科研报告',
    img: outcomeImg2
  },
  {
    title: '教授评价表',
    img: outcomeImg3
  },
  {
    title: '教授推荐信',
    subtitle: '（个性化推荐信，支持网申）',
    img: outcomeImg4
  },
  {
    title: '国际会议论文',
    subtitle: '（全文独作）',
    img: outcomeImg5
  }
]

const outcomes = [
  { img: outcomeDoc1 },
  { img: outcomeDoc2 },
  { img: outcomeDoc3 }
]

const relatedProjects = ref([])
const relatedCount = computed(() => (relatedProjects.value ? relatedProjects.value.length : 0))
const showAllRelated = ref(false)

function toggleShowAllRelated() {
  showAllRelated.value = !showAllRelated.value
}

async function loadRelatedProjects() {
  const startTime = performance.now()
  logger.info('DetailView', 'Start loading related projects')
  
  try {
    if (!fetchedData.value || !fetchedData.value.fields) {
      logger.warn('DetailView', 'No fetched data available for related projects')
      return
    }
    
    const f = fetchedData.value.fields
    const englishFields = mapKeysToEnglish(f)
    const combined = { ...f, ...englishFields }
    
    const teacherName = getText(combined.mentor_name_cn || combined.mentor || combined.teacher || combined['导师'] || combined['导师姓名'])
    const teacherUniversity = getText(combined.university || combined['导师院校'] || combined.school || combined.college)
    const teacherTitle = getText(combined.mentorType || combined.mentor_type_cn || combined.mentor_title || combined.title_job || combined['导师职称'] || combined['职称'])
    
    if (!teacherName) {
      logger.warn('DetailView', 'No teacher name found for related projects')
      return
    }

    logger.info('DetailView', 'Searching related projects', { teacherName, teacherUniversity, teacherTitle })
    
    const res = await fetch('/api/courses?limit=500')
    const data = await res.json()
    const items = (data && data.items) || []
    
    const list = items
      .filter(r => {
        if (!r.fields) return false
        
        const ef = mapKeysToEnglish(r.fields)
        const c = { ...r.fields, ...ef }
        
        const name = getText(c.mentor_name_cn || c.mentor || c.teacher || c['导师'] || c['导师姓名'] || c.mentor_name || c.teacher_name)
        const university = getText(c.university || c['导师院校'] || c.school || c.college || c.organization)
        const title = getText(c.mentorType || c.mentor_type_cn || c.mentor_title || c.title_job || c['导师职称'] || c['职称'])
        
        const currentId = fetchedData.value.record_id || fetchedData.value.id
        const itemId = r.record_id || r.id
        
        if (!name || !currentId || !itemId) return false
        if (itemId === currentId) return false
        
        const nameMatch = name.includes(teacherName) || teacherName.includes(name)
        if (!nameMatch) return false
        
        const hasUniversityInfo = teacherUniversity && university
        const hasTitleInfo = teacherTitle && title
        
        if (hasUniversityInfo && hasTitleInfo) {
          const universityMatch = university.includes(teacherUniversity) || teacherUniversity.includes(university)
          const titleMatch = title.includes(teacherTitle) || teacherTitle.includes(title)
          return universityMatch && titleMatch
        } else if (hasUniversityInfo) {
          const universityMatch = university.includes(teacherUniversity) || teacherUniversity.includes(university)
          return universityMatch
        } else if (hasTitleInfo) {
          const titleMatch = title.includes(teacherTitle) || teacherTitle.includes(title)
          return titleMatch
        }
        
        return true
      })
      .map(r => {
        const ef = mapKeysToEnglish(r.fields)
        const c = { ...r.fields, ...ef }
        
        const title = getText(c.title || c.project_name_cn || c.project_name || c['教授课题名称'] || c['课题名称'] || c['项目名称'] || c['标题'])
        const primary = getText(c.primary || c['一级学科'] || c.primary_subject || c.pri_sub)
        const secondary = getText(c.secondary || c['二级学科'] || c.secondary_subject || c.sec_sub)
        const tags = [primary, secondary].filter(Boolean)
        
        const headImg = extractUrl(c.cover_image_test || c['头图地址测试'] || c.banner_url)
        const coverImg = getCoverUrl(c)
        
        return {
          id: r.record_id || r.id,
          title: title || '未命名课题',
          desc: getText(c.desc || c.description_cn || c.description_intro || c['课题描述'] || c['课题简介'] || c['项目简介'] || c['描述']),
          tags,
          img: headImg || coverImg || defaultHero
        }
      })
      .filter(item => item.title && item.title !== '未命名课题')

    relatedProjects.value = list
    
    const duration = performance.now() - startTime
    logger.info('DetailView', 'Related projects loaded', {
      count: list.length,
      duration: `${duration.toFixed(2)}ms`
    })
  } catch (e) {
    const duration = performance.now() - startTime
    logger.error('DetailView', 'Failed to load related projects', e, {
      duration: `${duration.toFixed(2)}ms`
    })
  }
}

const defaultHero =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDVsDcyeTttES1IDZMK-vp770XwEk4W84Og2wvwuWlJ17nfm9Y0zjoWGTHGXjqmTtaXlocRxmimCOJrhVesjpx9v5Ck9f8KD8cJK8r9iSo30PxydtV1q-uy28n3xju7guBjxmBQgFaynr1i_K55urVFL7KnygeD-AjB7lpOeKK4PyzNNXk995o6kJjxRMtgWHuqQPodpKBl295CkMW95VUWBxzWoV4pJios2GH1Vp5HHKIg0OfnXzATL83xkMsgJBH2F1QCYjpfhqY'

const mentorHighlights = [
  '发表学术论文 76 篇，其中 SCI/SSCI 收录 35 篇，多篇发表于 Q1 区顶级期刊',
  '曾担任国家重点研发计划项目骨干',
  '主持多项国家社会科学基金项目'
]

const suitableStudents = '有意向申请海外院校的高中生、大学生'

const suitableFields = [
  '环境科学与工程',
  '安全科学与工程',
  '生态学',
  '数据科学与大数据技术',
  '人工智能',
  '公共管理'
]

function performSearch() {}

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}

function downloadPoster() {
  const src = getHeroImageSrc(item.value, defaultHero)
  openInNewTab(src)
}

function goToRelated(p) {
  if (!p || !p.id) return
  router.push({ path: '/' })
}

function handleImageError(event) {
  if (!event || !event.target) return
  if (event.target.src === publicImg) return
  event.target.src = publicImg
}
</script>

<template>
  <div class="detail-page" :class="{ 'is-dark': isDarkMode }">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载课题详情...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="isError" class="error-overlay">
      <div class="error-content">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <p class="error-title">加载失败</p>
        <p class="error-message">{{ errorMessage }}</p>
        <el-button type="primary" class="retry-btn" @click="handleRetry">
          <el-icon><RefreshRight /></el-icon>
          重试
        </el-button>
      </div>
    </div>

    <header v-else-if="!isError" class="main-header">
      <div class="header-content">
        <div class="logo">
          <img :src="logoImg" class="logo-img" alt="中科英才" @click="goHome" />
        </div>
        <div class="search-container">
          <el-input
            v-model="searchText"
            placeholder="搜索感兴趣的课题方向、导师"
            class="header-search-input"
            @keyup.enter="performSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #suffix>
              <div class="header-suffix">
                <span
                  class="header-clear"
                  :class="{ 'is-visible': !!searchText }"
                  @click="searchText = ''"
                >×</span>
                <el-button class="header-search-btn" @click="performSearch">搜索</el-button>
              </div>
            </template>
          </el-input>
        </div>
        <div class="auth-buttons">
          <el-button type="primary" class="login-btn" round>登录/注册</el-button>
        </div>
      </div>
    </header>

    <main v-if="!isLoading && !isError" class="detail-main">
      <div class="breadcrumb-container">
        <div class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </div>
        <div class="breadcrumb-divider">|</div>
        <div class="breadcrumb">
          <span>首页</span>
          <span class="sep">/</span>
          <span>导师项目</span>
          <span class="sep">/</span>
          <span class="current">{{ item.title }}</span>
        </div>
      </div>
      <div class="detail-container">

        <section class="hero-card">
          <div class="hero-left">
            <el-image
              :src="getHeroImageSrc(item, publicImg)"
              fit="cover"
              class="hero-image"
            >
              <template #error>
                <img :src="publicImg" alt="" class="hero-image" />
              </template>
            </el-image>
            <div class="hero-views" v-if="item.views > 0">
              <el-icon><View /></el-icon>
              <span>{{ item.views }}</span>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-title">{{ item.title }}</div>
            <div class="hero-tags">
              <span v-if="item.primary" class="tag tag-orange">{{ item.primary }}</span>
              <span v-if="item.secondary" class="tag tag-grey">{{ item.secondary }}</span>
            </div>
            <div class="hero-info-card">
              <div class="info-card-top">
                <div class="hero-meta-item">
                  <div class="hero-meta-icon hero-meta-icon-person">
                    <img :src="cankaolaoshiIcon" alt="icon" style="width: 32px; height: 32px; object-fit: contain;" />
                  </div>
                  <div class="hero-meta-text">
                    <p class="hero-meta-label">参考老师</p>
                    <p class="hero-meta-value">
                      {{ item.refMentorName || '张张张老师' }}
                      <span v-if="item.refMentorTitle" class="hero-meta-tag">{{ item.refMentorTitle }}</span>
                    </p>
                  </div>
                </div>
                <div class="hero-meta-item">
                  <div class="hero-meta-icon hero-meta-icon-school">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                      <path d="M128 384l384-256 384 256v512H128V384zm384-192l-320 213.333V832h640V405.333L512 192zM384 640h256v192H384V640z" fill="#1890ff"/>
                    </svg>
                  </div>
                  <div class="hero-meta-text">
                    <p class="hero-meta-label">学校</p>
                    <p class="hero-meta-value">{{ item.university }}</p>
                  </div>
                </div>
              </div>

              <div class="info-card-bottom">
                <div class="hero-recommend-header">
                  <span class="hero-recommend-icon">✨</span>
                  <span class="hero-recommend-title">专业领域</span>
                </div>
                <p class="hero-recommend-text">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="content-layout">
          <div class="content-left">
            <el-card class="section-card" shadow="never">
              <template #header>
                <div class="section-title-row">
                  <img :src="xiangmuxinxiIcon" class="section-title-icon-img" alt="icon" />
                  <span class="section-title">课程描述</span>
                </div>
              </template>
              <div class="section-body-text">
                <p>{{ item.desc }}</p>
              </div>
            </el-card>

            <el-card class="section-card" shadow="never">
              <template #header>
                <div class="section-title-row">
                  <img :src="daoshijieshaoIcon" class="section-title-icon-img" alt="icon" />
                  <span class="section-title">导师介绍</span>
                </div>
              </template>
              <div class="mentor-intro">
                <div class="mentor-intro-card mentor-intro-main">
                  <div class="mentor-intro-header">
                    <div class="mentor-intro-tag-wrap">
                      <span class="mentor-intro-tag">主导师介绍</span>
                    </div>
                  </div>
                  <div class="mentor-intro-body">
                    <p class="mentor-intro-title">项目职责：指导学生通过学术课程学习科研流程和研究方法</p>
                    <ul class="mentor-intro-list">
                      <li
                        v-for="(line, index) in item.mainMentorIntro"
                        :key="line"
                        class="mentor-intro-item"
                      >
                        <div :class="['mentor-bullet-circle', 'mentor-bullet-' + index]">
                          <svg
                            viewBox="0 0 1024 1024"
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                          >
                            <path
                              d="M406.656 706.944L195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <span class="mentor-intro-text">{{ line }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="mentor-intro-card mentor-intro-vice">
                  <div class="mentor-intro-header">
                    <div class="mentor-intro-tag-wrap">
                      <span class="mentor-intro-tag">副导师介绍</span>
                    </div>
                  </div>
                  <div class="mentor-intro-body">
                    <p class="mentor-intro-title">项目职责：指导学生完成科研成果报告和相关学术写作</p>
                    <ul class="mentor-intro-list">
                      <li
                        v-for="(line, index) in item.viceMentorIntro"
                        :key="line"
                        class="mentor-intro-item"
                      >
                        <div :class="['mentor-bullet-circle', 'mentor-bullet-' + index]">
                          <svg
                            viewBox="0 0 1024 1024"
                            xmlns="http://www.w3.org/2000/svg"
                            width="10"
                            height="10"
                          >
                            <path
                              d="M406.656 706.944L195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <span class="mentor-intro-text">{{ line }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="section-card" shadow="never">
              <template #header>
                <div class="section-title-row">
                  <img :src="xiangmuxinxiIcon" class="section-title-icon-img" alt="icon" />
                  <span class="section-title">项目信息</span>
                </div>
              </template>
              <div class="project-info-grid">
                <div class="project-info-card">
                  <div class="project-info-icon">
                    <img :src="xiangmuxingshiIcon" alt="icon" />
                  </div>
                  <div class="project-info-content">
                    <div class="project-info-label">项目形式</div>
                    <div class="project-info-value">{{ item.projectForm }}</div>
                  </div>
                </div>
                <div class="project-info-card">
                  <div class="project-info-icon">
                    <img :src="xiangmuxingshiIcon" alt="icon" />
                  </div>
                  <div class="project-info-content">
                    <div class="project-info-label">项目方案</div>
                    <div class="project-info-value">{{ item.projectPlan }}</div>
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="section-card" shadow="never">
              <template #header>
                <div class="section-title-row">
                  <img :src="xiangmuliuchengIcon" class="section-title-icon-img" alt="icon" />
                  <span class="section-title">项目流程</span>
                </div>
              </template>
              <div class="process-grid">
                <div class="process-card">
                  <div class="process-header">
                    <div class="process-title">基础知识升级</div>
                    <div class="process-number">1</div>
                  </div>
                  <div class="process-desc">
                    学生通过学术先导课，学习科研和论文的基础知识及学术软件的使用
                  </div>
                </div>
                <div class="process-card">
                  <div class="process-header">
                    <div class="process-title">学术科研报告</div>
                    <div class="process-number">2</div>
                  </div>
                  <div class="process-desc">
                    双一流院校的教授指导学生，体验科研的完整闭环，学习科研过程和方法
                  </div>
                </div>
                <div class="process-card">
                  <div class="process-header">
                    <div class="process-title">学术写作辅导</div>
                    <div class="process-number">3</div>
                  </div>
                  <div class="process-desc">
                    学生通过学术先导课，学习科研和论文的基础知识及学术软件的使用
                  </div>
                </div>
                <div class="process-card">
                  <div class="process-header">
                    <div class="process-title">学术论文投稿</div>
                    <div class="process-number">4</div>
                  </div>
                  <div class="process-desc">
                    学生完成论文终稿后，由学术服务团队进行论文投稿，直至录用
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="section-card outcome-section" shadow="never">
              <template #header>
                <div class="section-title-row">
                  <img :src="xiangmushouhuoIcon" class="section-title-icon-img" alt="icon" />
                  <span class="section-title">项目收获</span>
                </div>
              </template>
              <div class="harvest-grid">
                <div
                  v-for="h in harvests"
                  :key="h.title"
                  class="harvest-card"
                >
                  <div class="outcome-image-wrap">
                    <img :src="h.img" alt="harvest" />
                  </div>

                </div>
              </div>
            </el-card>

            <el-card class="section-card outcome-section" shadow="never">
              <template #header>
                <div class="section-title-row">
                  <img :src="xiangmuchengguoIcon" class="section-title-icon-img" alt="icon" />
                  <span class="section-title">项目成果</span>
                </div>
              </template>
              <div class="outcome-doc-grid">
                <div
                  v-for="(o, index) in outcomes"
                  :key="index"
                  class="outcome-doc-card"
                >
                  <div class="outcome-image-wrap">
                    <img :src="o.img" alt="outcome" />
                  </div>
                </div>
              </div>
            </el-card>

          </div>

          <aside class="content-right">
            <el-card ref="firstSideCardRef" class="side-card" shadow="never">
              <template #header>
                <div class="side-title-row">
                  <div class="side-title-left">
                    <img :src="laoshixiangqingIcon" alt="icon" class="side-title-icon-img" />
                    <span class="side-title-main">该导师其他课题（{{ relatedCount }}个）</span>
                  </div>
                </div>
              </template>
              <div class="side-content-wrapper">
                <div class="side-project-list">
                  <div
                    v-for="p in (showAllRelated ? relatedProjects : relatedProjects.slice(0, 3))"
                    :key="p.id || p.title"
                    class="side-project-item"
                    @click="goToRelated(p)"
                  >
                    <div class="side-project-image">
                      <img :src="p.img" alt="" @error="handleImageError" />
                    </div>
                    <div class="side-project-info">
                      <p class="side-project-title">{{ p.title }}</p>
                      <div class="side-project-tags">
                        <span v-for="(tag, i) in p.tags" :key="tag" class="side-tag" :class="{'is-plus': tag.startsWith('+')}">
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="side-card-footer" v-if="relatedCount > 3" @click="toggleShowAllRelated">
                  <span class="view-more">{{ showAllRelated ? '收起' : '查看更多' }}</span>
                  <el-icon :class="{ 'rotate-180': showAllRelated }"><CaretBottom /></el-icon>
                </div>
              </div>
            </el-card>

            <el-card ref="stickyCardRef" class="side-card side-card-sticky" :class="{ 'is-fixed': isSticky }" shadow="never">
              <template #header>
                <div class="side-title-row">
                  <div class="side-title-left">
                    <img :src="laoshixiangqingIcon" alt="icon" class="side-title-icon-img" />
                    <span class="side-title-main">参考导师详情</span>
                  </div>
                </div>
              </template>
              <div class="mentor-side">
                <div class="mentor-side-header">
                  <el-avatar size="large" :src="teacherImg" />
                  <div class="mentor-side-meta">
                    <div class="mentor-side-name">
                      {{ item.refMentorName }}
                      <span v-if="item.refMentorTitle" class="mentor-badge">{{ item.refMentorTitle }}</span>
                    </div>
                    <div class="mentor-side-school">{{ item.university }}</div>
                  </div>
                </div>

                <ul class="mentor-highlights">
                  <li v-for="line in mentorHighlights" :key="line">{{ line }}</li>
                </ul>

                <div class="mentor-section">
                  <div class="mentor-section-title">专业领域：</div>
                  <p class="mentor-section-text">{{ expertise.join('，') }}</p>
                </div>

                <div class="mentor-section">
                  <div class="mentor-section-title">适合学生：</div>
                  <p class="mentor-section-text">{{ suitableStudents }}</p>
                </div>

                <div class="mentor-section">
                  <div class="mentor-section-title">适合专业：</div>
                  <p class="mentor-section-text">{{ suitableFields.join('、') }}</p>
                </div>

                <div class="mentor-disclaimer">
                  *（具体导师以项目启动后导师的匹配结果为准）
                </div>

                <div class="mentor-meta">
                  <span>更新时间：2026-01-13</span>
                  <span>累计报名人数：6952</span>
                </div>
              </div>
            </el-card>
          </aside>
        </section>
      </div>
    </main>

    <footer class="detail-footer">
      <div class="footer-inner">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="footer-logo">
              <img :src="logoImg" alt="中科英才" @click="goHome" />
            </div>
            <span class="footer-title">中科英才</span>
          </div>
          <p class="footer-copy">© 2024 中科英才学术平台 版权所有</p>
        </div>
      </div>
    </footer>

    <!-- 右侧固定功能模块 -->
    <FixedActionPanel
      v-if="!isLoading && !isError"
      :isDarkMode="isDarkMode"
      :qiansemoshiIcon="qiansemoshiIcon"
      :shensemoshiIcon="shensemoshiIcon"
      :fanhuidingbuIcon="fanhuidingbuIcon"
      :downloadIcon="xiazaihaibaoIcon"
      :showDownload="true"
      :top="500"
      @scroll-top="scrollToTop"
      @download="downloadPoster"
    />
  </div>
</template>

<style scoped>
/* 加载和错误状态样式 */
.loading-overlay,
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  z-index: 9999;
}

.error-overlay {
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f0f0f0;
  border-top-color: #ff6b00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.error-content {
  text-align: center;
  padding: 40px;
}

.error-icon {
  font-size: 64px;
  color: #ff4d4f;
  margin-bottom: 16px;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.error-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  max-width: 400px;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: #ff6b00;
  border-color: #ff6b00;
}

.retry-btn:hover {
  background: #ff8533;
  border-color: #ff8533;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #ff6b00;
  --el-button-border-color: #ff6b00;
  --el-button-hover-bg-color: #ff8533;
  --el-button-hover-border-color: #ff8533;
}

.detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.detail-page.is-dark {
  background: #1b1e27;
}

.detail-page.is-dark .main-header {
  background: #3b3f49;
  border-bottom-color: transparent;
}

.detail-page.is-dark .breadcrumb-container {
  color: #9ca3af;
}

.detail-page.is-dark .breadcrumb .current {
  color: #e5e7eb;
}

.detail-page.is-dark .hero-card,
.detail-page.is-dark .section-card,
.detail-page.is-dark .side-card {
  background: #3b3f49;
  color: rgba(229, 231, 235, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
}

.detail-page.is-dark .hero-title,
.detail-page.is-dark .section-title,
.detail-page.is-dark .side-title-main {
  color: #f9fafb;
}

.detail-page.is-dark .hero-recommend-text,
.detail-page.is-dark .section-body-text,
.detail-page.is-dark .mentor-intro-text,
.detail-page.is-dark .mentor-section-text {
  color: #d1d5db;
}

.detail-page.is-dark .detail-footer {
  background: #1b1e27;
  border-top-color: rgba(255, 255, 255, 0.12);
}

.detail-page.is-dark .header-search-input :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.12);
  border-color: #ff6b00;
}

.detail-page.is-dark .header-search-input :deep(.el-input__inner) {
  color: rgba(249, 250, 251, 0.92);
}

.detail-page.is-dark .header-search-input :deep(.el-input__inner::placeholder) {
  color: rgba(229, 231, 235, 0.5);
}

.main-header {
  width: 100%;
  height: 80px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  width: 100%;
  max-width: 1440px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.search-container {
  flex: 1;
  max-width: 600px;
  margin: 0 40px;
}

.header-search-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  border: 1px solid #ff6b00;
  background-color: #fff;
  box-shadow: none;
  padding: 0 0 0 20px;
}

.header-search-input :deep(.el-input__inner) {
  height: 42px;
  line-height: 42px;
  padding: 0;
}

.header-search-input :deep(.el-input__suffix) {
  padding: 0;
}

.header-search-input :deep(.el-input__suffix-inner) {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.header-suffix {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-clear {
  width: 20px;
  text-align: center;
  margin-right: 8px;
  font-size: 16px;
  color: #b3b3b3;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.header-clear.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.header-search-btn {
  height: 100%;
  border-radius: 0 999px 999px 0 !important;
  margin: 0 !important;
  border: none !important;
  background-color: #ff6b00 !important;
  color: #fff !important;
  padding: 0 24px !important;
}

.header-search-btn:hover {
  background-color: #ff8533 !important;
}

.auth-buttons {
  display: flex;
  align-items: center;
}

.login-btn {
  font-weight: 600;
}

.detail-main {
  flex: 1;
  padding: 24px 0 60px;
}

.detail-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
}

.breadcrumb-container {
  max-width: 1440px;
  margin: 0 auto 12px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: color 0.3s;
}

.back-btn:hover {
  color: #ff6b00;
}

.breadcrumb-divider {
  color: #e0e0e0;
  font-size: 14px;
}

.breadcrumb {
  margin: 0;
  padding: 0;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.breadcrumb .sep {
  margin: 0 4px;
}

.breadcrumb .current {
  color: #333;
}

.hero-card {
  width: 100%;
  height: 363px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 20px;
  display: flex;
  gap: 24px;
  box-sizing: border-box;
}

.hero-left {
  width: 480px;
  flex-shrink: 0;
  position: relative;
}

.hero-views {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  z-index: 10;
  pointer-events: none;
}

.hero-image {
  width: 100%;
  height: 100%;
  min-height: 270px;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.hero-image:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.hero-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 0;
  padding-bottom: 16px;
  gap: 20px;
}

.hero-title {
  width: 874px;
  /* height: 68px; */
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-weight: 500;
  font-size: 24px;
  color: #37363B;
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.4;
  margin-top: 0;
  margin-bottom: 0;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
}

.tag-orange {
  width: 75px;
  height: 28px;
  background: rgba(255, 102, 1, 0.1);
  color: #FF6B00;
  border-radius: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.tag-grey {
  height: 28px;
  background: #F2F3F5;
  color: #4E5969;
  border-radius: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
}

.tag-chip {
  background: #f5f7fa;
  color: #666;
  border: 1px solid #e4e7ed;
}

.hero-info-card {
  position: relative;
  flex: none;
  width: 874px;
  max-width: 100%;
  height: 168px;
  border-radius: 8px;
  padding: 16px 24px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero-info-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 102, 1, 0.5) 0%,
    rgba(255, 255, 255, 0.5) 100%
  );
  opacity: 0.1;
  pointer-events: none;
}

.hero-info-card > * {
  position: relative;
  z-index: 1;
}

.info-card-top {
  display: flex;
  align-items: center;
  gap: 80px;
}

.hero-meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.hero-meta-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-meta-icon-person {
  background: transparent;
}

.hero-meta-icon-school {
  background: #e6f7ff;
}

.hero-meta-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-meta-label {
  font-size: 12px;
  color: #86909c;
  margin: 0;
}

.hero-meta-value {
  font-size: 14px;
  font-weight: 500;
  color: #37363b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-meta-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  font-size: 11px;
  border-radius: 10px;
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.info-card-bottom {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-recommend-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.zhuangye-logo {
  width: auto;
  height: 24px;
  object-fit: contain;
}

.hero-recommend-text {
  font-size: 13px;
  color: #666;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}


.content-layout {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.content-left {
  flex: 1;
  min-width: 0;
}

.content-right {
  width: 469px;
  flex-shrink: 0;
}

.section-card {
  width: 955px;
  max-width: 100%;
  min-height: 182px;
  background: #FFFFFF;
  border-radius: 12px;
  margin-bottom: 16px;
}

.outcome-section {
  width: 955px;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
}

.outcome-section :deep(.el-card__body) {
  height: auto;
  box-sizing: border-box;
}

.outcome-section :deep(.el-card__body)::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

.outcome-section :deep(.el-card__body)::-webkit-scrollbar-button {
  display: none !important;
}

.section-card:last-child {
  margin-bottom: 0;
}

.section-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-card :deep(.el-card__body) {
  padding: 16px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.section-title-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #1890ff;
  color: #fff;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.section-title {
  width: 255px;
  height: 34px;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-weight: 500;
  font-size: 24px;
  color: #37363B;
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 34px;
  display: block;
}

.section-body-text {
  width: 915px;
  max-width: 100%;
  /* height: 75px; */
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #37363B;
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.8;
}

.mentor-intro {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.mentor-intro-card {
  border-radius: 8px;
  border: none;
  overflow: hidden;
  background: #f7f9ff;
  box-shadow: none;
}

.mentor-intro-header {
  padding: 16px 16px 8px;
  background: transparent;
}

.mentor-intro-tag-wrap {
  display: inline-block;
  position: relative;
  /* Optional: if user wants the dashed box, we can add it here.
     For now, just the blue gradient tag. */
}

.mentor-intro-tag {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(90deg, #5b8ff9 0%, #6fa3ff 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 2px 12px 2px 12px;
  box-shadow: 0 4px 10px rgba(91, 143, 249, 0.2);
}

.mentor-intro-body {
  padding: 12px 20px 24px;
}

.mentor-intro-title {
  font-size: 15px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.5;
}

.mentor-intro-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mentor-intro-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mentor-bullet-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.mentor-bullet-0 {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.mentor-bullet-1 {
  background: #fff7e6;
  border-color: #ffd591;
  color: #fa8c16;
}

.mentor-bullet-2 {
  background: #f6ffed;
  border-color: #b7eb8f;
  color: #52c41a;
}

.mentor-bullet-3 {
  background: #fff1f0;
  border-color: #ffa39e;
  color: #f5222d;
}

.mentor-intro-text {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
}

.info-label {
  width: 80px;
  font-size: 13px;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.gain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.gain-item {
  position: relative;
  border-radius: 6px;
  background: #f5f7fa;
  padding: 12px 12px 12px 32px;
}

.gain-index {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 24px;
  font-weight: 800;
  color: rgba(24, 144, 255, 0.2);
}

.gain-text {
  font-size: 13px;
  color: #555;
  line-height: 1.6;
}

.harvest-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  padding: 0;
}

.harvest-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.harvest-card:nth-child(-n+3) {
  grid-column: span 2;
}

.harvest-card:nth-child(n+4) {
  grid-column: span 3;
}

.outcome-doc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  row-gap: 0;
  padding: 0;
}

.outcome-doc-card {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.outcome-doc-card:last-child {
  grid-column: span 2;
}

.outcome-image-wrap {
  width: 100%;
  height: auto;
  position: relative;
  overflow: hidden;
}

.outcome-image-wrap img {
  width: 100%;
  height: auto;
  object-fit: contain;
  object-position: top;
  display: block;
  transition: transform 0.4s ease;
}

.harvest-card:hover .outcome-image-wrap img,
.outcome-doc-card:hover .outcome-image-wrap img {
  transform: scale(1.05);
}


.side-card {
  width: 469px;
  max-width: 100%;
  height: auto;
  background: #FFFFFF;
  border-radius: 12px;
  margin-bottom: 16px;
}

.side-card-sticky {
  position: relative;
  align-self: flex-start;
  max-height: calc(100vh - 120px);
  transition: all 0.3s ease;
}

.side-card-sticky.is-fixed {
  position: fixed;
  top: v-bind(stickyTop + 'px');
  width: 469px;
  z-index: 9999;
  border-top: none !important;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.side-card-sticky :deep(.el-card__body) {
  max-height: calc(100vh - 200px);
  overflow-y: auto !important;
}

.side-card:last-child {
  margin-bottom: 0;
}

.side-card :deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.side-card :deep(.el-card__body) {
  padding: 0 !important;
}

.side-card:not(.side-card-sticky) :deep(.el-card__body) {
  height: 400px;
  overflow: hidden !important;
}

.side-content-wrapper {
  height: 100%;
  padding: 12px 16px 16px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.side-content-wrapper::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

.side-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.side-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-title-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.side-title-main {
  /* width: 144px; */ /* Note: Removed fixed width to prevent text truncation */
  height: 34px;
  line-height: 34px;
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-weight: 500;
  font-size: 24px;
  color: #37363B;
  text-align: left;
  font-style: normal;
  text-transform: none;
}

.side-project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.side-project-item {
  width: 429px;
  max-width: 100%;
  height: 144px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #EBEEF5;
  display: flex;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  align-items: flex-start;
}

.side-project-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.side-project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-info-grid {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.project-info-card {
  flex: 1;
  display: flex;
  background: #F7F9FF;
  border-radius: 8px;
  overflow: hidden;
  align-items: center;
}

.project-info-icon {
  width: 66px;
  height: 81px;
  flex-shrink: 0;
}

.project-info-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-info-content {
  flex: 1;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.project-info-label {
  font-size: 14px;
  color: #666;
  line-height: 1;
}

.project-info-value {
  font-size: 16px;
  color: #333;
  line-height: 1.5;
  font-weight: 500;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.process-card {
  background: #F7F9FF;
  border-radius: 8px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  height: 100%;
  box-sizing: border-box;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.process-title {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
  z-index: 1;
  margin-top: 8px;
}

.process-number {
  font-size: 64px;
  font-weight: 900;
  color: #E1EAF9;
  font-style: italic;
  line-height: 1;
  position: absolute;
  right: 16px;
  top: 8px;
  font-family: Arial, sans-serif;
  z-index: 0;
}

.process-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  position: relative;
  z-index: 1;
}

/* Dark mode support for new section */
:global(html.dark-mode .process-card) {
  background: #1f1f1f;
}

:global(html.dark-mode .process-number) {
  color: #333;
}

:global(html.dark-mode .process-desc) {
  color: #aaa;
}

@media (max-width: 768px) {
  .process-grid {
    grid-template-columns: 1fr;
  }
}

.side-project-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.side-project-title {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #37363B;
  line-height: 1.5;
  margin-bottom: 8px;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.side-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  background: #FFF2E8;
  border-radius: 4px;
  font-size: 12px;
  color: #FA8C16;
  font-weight: 400;
}

.side-tag.is-plus {
  background: #F5F5F5;
  color: #999;
}

.side-card-footer {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  color: #999;
  font-size: 13px;
}

.side-card-footer:hover {
  color: #ff6b00;
}

.mentor-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 12px 16px 16px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mentor-side::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

.mentor-side-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.mentor-side-header :deep(.el-avatar) {
  width: 80px;
  height: 80px;
  border-radius: 0;
}

.mentor-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0 8px;
  height: 20px;
  border-radius: 10px;
  background: #FFF2E8;
  color: #FA8C16;
  font-size: 12px;
  font-weight: 500;
}

.mentor-highlights {
  margin: 0;
  padding: 12px;
  background: #F5F5F5;
  border-radius: 8px;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.mentor-highlights li {
  position: relative;
  padding-left: 16px;
  font-size: 12px;
  color: #666;
}

.mentor-highlights li::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  width: 4px;
  height: 4px;
  background: #999;
  border-radius: 50%;
  transform: translateY(-50%);
}

.mentor-section {
  margin-top: 12px;
}

.mentor-section-title {
  font-family: "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-weight: 500;
  font-size: 15px;
  color: #909399;
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-bottom: 6px;
}

.mentor-section-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  /* line-height: 1.8; */
}

.mentor-disclaimer {
  margin-top: 12px;
  padding: 8px 10px;
  color: #FF4D4F;
  font-size: 12px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.4;
}

.mentor-meta {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.mentor-side-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mentor-side-name {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.mentor-side-title {
  font-size: 12px;
  color: #ff6b00;
}

.mentor-side-school {
  font-size: 12px;
  color: #666;
}

.mentor-side-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: #666;
  line-height: 1.8;
}

.detail-footer {
  border-top: 1px solid #e5e7eb;
  background: #fff;
  padding: 24px 0;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-logo {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.footer-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.footer-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.footer-copy {
  margin: 0;
}

@media (max-width: 991px) {
  .hero-card {
    flex-direction: column;
  }

  .hero-left {
    width: 100%;
  }

  .hero-image {
    height: 200px;
  }

  .hero-info-card {
    width: 100%;
    height: auto;
  }

  .info-card-top {
    gap: 40px;
  }

  .content-layout {
    flex-direction: column;
  }

  .content-right {
    width: 100%;
  }

  .mentor-intro {
    grid-template-columns: 1fr;
  }

  .harvest-grid,
  .outcome-doc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .harvest-card:nth-child(n),
  .outcome-doc-card:nth-child(n) {
    grid-column: auto;
  }

  .footer-content {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 767px) {
  .header-content {
    padding: 0 12px;
  }

  .search-container {
    margin: 0 16px;
  }

  .detail-container {
    padding: 0;
    min-height: auto;
  }

  .hero-card {
    flex-direction: column;
    padding: 20px;
    height: auto;
  }

  .breadcrumb {
    padding: 0 20px;
  }



  .hero-left {
    width: 100%;
  }

  .hero-image {
    min-height: 220px;
  }

  .info-card-top {
    flex-direction: column;
    gap: 16px;
  }

  .hero-title {
    font-size: 16px;
  }
}

 
</style>
