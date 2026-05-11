<script setup>
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Search, User, School, Grid, List, ArrowDown, StarFilled, Close, RefreshRight, WarningFilled } from '@element-plus/icons-vue'
import logoImg from '@/images/logo.jpg'
import qiansemoshiIcon from '@/images/icon_ewd2dbl138v/qiansemoshi.png'
import shensemoshiIcon from '@/images/icon_ewd2dbl138v/shensemoshi.png'
import fanhuidingbuIcon from '@/images/icon_ewd2dbl138v/fanhuidingbu.png'
import emptyImg from '@/images/icon_ewd2dbl138v/weisousuodao.png'
import loadingImg from '@/images/icon_ewd2dbl138v/jiazaizhong.png'
import errorImg from '@/images/icon_ewd2dbl138v/jiazaishibai.png'
import noContentImg from '@/images/icon_ewd2dbl138v/zanwuneirong.png'
import Fuse from 'fuse.js'
import publicImg from '@/images/public.jpg'
import { normalizeToArray, getText, getCoverUrl, extractUrl, DEFAULT_COVER, mapKeysToEnglish, truncate } from '@/utils/data-mapping'
import { searchRecords, isConfigured, isBitableConfigured, getBitableConfig, getFriendlyError } from '@/utils/feishu'
import { scrollToTop, useDarkMode } from '@/utils/ui'
import { logger, trackApiRequest } from '@/utils/logger'
import { filterVisibleCourses, isVisibleCourse } from '@/utils/visibility-filter'
import FixedActionPanel from '@/components/FixedActionPanel.vue'
import { useSubjectFilters } from '@/composables/useFilters'

let selectedPrimary, selectedSecondary, selectedMentorType
const searchText = ref('')
const isLoading = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const errorType = ref('')
const showConfigHint = ref(false)
const configHintMessage = ref('')
const searchSuggestions = ref([])
const showSuggestions = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const isGridView = ref(true)
const favoriteIds = ref(new Set())

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


const router = useRouter()

const DEFAULT_SUBJECTS = [
  { name: '工学', children: ['计算机类', '电子信息类', '机械类', '自动化类', '材料类', '生物医学工程类', '生物工程类', '土木类', '建筑类'] },
  { name: '理学', children: ['数学类', '物理学类', '化学类', '生物科学类', '心理学类', '统计学类', '地理科学类'] },
  { name: '医学', children: ['临床医学类', '口腔医学类', '公共卫生与预防医学类', '药学类', '中医学类', '护理学类'] },
  { name: '管理学', children: ['管理科学与工程类', '工商管理类', '公共管理类', '农业经济管理类', '图书情报与档案管理类'] },
  { name: '法学', children: ['法学类', '政治学类', '社会学类', '民族学类', '马克思主义理论类', '公安学类'] },
  { name: '经济学', children: ['经济学类', '财政学类', '金融学类', '经济与贸易类'] },
  { name: '文学', children: ['中国语言文学类', '外国语言文学类', '新闻传播学类'] },
  { name: '教育学', children: ['教育学类', '体育学类'] },
  { name: '历史学', children: ['历史学类', '考古学类'] },
  { name: '哲学', children: ['哲学类'] },
  { name: '农学', children: ['植物生产类', '自然保护与环境生态类', '动物生产类', '兽医学类'] },
  { name: '艺术学', children: ['艺术理论类', '音乐与舞蹈学类', '戏剧与影视学类', '美术学类', '设计学类'] }
]

const subjectData = ref(DEFAULT_SUBJECTS)

const {
  selectedPrimary: sp,
  selectedSecondary: ss,
  selectedMentorType: smt,
  mentorTypes,
  secondaryToPrimaryMap,
  allSecondary,
  currentSecondaryList,
  SECONDARY_LIMIT,
  expandedSecondary,
  onPrimaryAllClick,
  onPrimaryClick,
  onSecondaryAllClick,
  onSecondaryClick,
  toggleSecondaryExpand,
  onMentorTypeClick,
  activeFilters,
  removeFilter
} = useSubjectFilters(subjectData)
selectedPrimary = sp
selectedSecondary = ss
selectedMentorType = smt


const mockPhotos = [  
  {
    id: 1,
    title: '史学经世的话语建构：魏晋南北朝“彰往考来”到“资治通鉴”的语义转换与实践逻辑',
    desc: '历史学经世是中国传统史学的重要功能传统，其核心是通过总结历史经验服务于现实治理。从先秦彰往考来的历史反思意识，到司马光《资治通鉴》明确提出鉴前世之兴衰，考当今之得失的治国目标，这一经世思想的演变并非线性发展，而是经历了魏晋南北朝时期的关键转型——通过话语建构与语义转换，...',
    img: 'https://images.unsplash.com/photo-1576014131341-fe1486ade16e?q=80&w=1600&auto=format&fit=crop',
    primary: '文学',
    secondary: '外国语言文学类',
    university: '南京大学',
    teacher: '张张张老师',
    mentorType: '教授',
    suit: '汉语言文学 | 历史学 | 哲学'
  },
  {
    id: 2,
    title: '下一代电力电子：宽禁带半导体的器件物理、智能集成与系统应用',
    desc: '课程系统阐述以GaN、SiC为代表的宽禁带半导体材料特性、器件物理及其在高效电能转换中的应用。',
    img: 'https://images.unsplash.com/photo-1555664424-778a69032054?q=80&w=1600&auto=format&fit=crop',
    primary: '工学',
    secondary: '电子信息类',
    university: '清华大学',
    teacher: '李教授',
    mentorType: '教授',
    suit: '电子科学与技术 | 微电子科学'
  },
  {
    id: 3,
    title: '人工智能驱动的医疗影像诊断系统设计与实现',
    desc: '深度学习在医学影像分析中的应用，涵盖CT、MRI图像分割与病灶检测技术。',
    img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1600&auto=format&fit=crop',
    primary: '工学',
    secondary: '计算机类',
    university: '上海交通大学',
    teacher: '王博士',
    mentorType: '博士',
    suit: '计算机科学 | 生物医学工程'
  },
  {
    id: 4,
    title: '全球气候变化下的城市生态韧性评估与规划策略',
    desc: '基于GIS和遥感技术的城市生态系统服务价值评估与空间优化布局研究。',
    img: 'https://images.unsplash.com/photo-1449824913929-4b4794984059?q=80&w=1600&auto=format&fit=crop',
    primary: '理学',
    secondary: '地理科学类',
    university: '北京大学',
    teacher: '陈教授',
    mentorType: '教授',
    suit: '地理科学 | 城乡规划'
  },
  {
    id: 5,
    title: '数字经济时代的消费者行为分析与营销策略创新',
    desc: '运用大数据分析方法研究社交媒体环境下的消费者决策路径与品牌忠诚度构建。',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop',
    primary: '管理学',
    secondary: '工商管理类',
    university: '浙江大学',
    teacher: '赵老师',
    mentorType: '教授',
    suit: '市场营销 | 电子商务'
  },
  {
    id: 6,
    title: '高性能锂离子电池正极材料的结构设计与改性研究',
    desc: '针对高能量密度电池需求，研究富锂锰基正极材料的合成工艺与电化学性能优化。',
    img: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=1600&auto=format&fit=crop',
    primary: '工学',
    secondary: '材料类',
    university: '中国科学技术大学',
    teacher: '孙教授',
    mentorType: '博士',
    suit: '材料科学 | 新能源科学'
  },
  {
    id: 7,
    title: '现代法治视野下的个人信息保护法律制度构建',
    desc: '比较法视角下的数据隐私保护立法研究，探讨GDPR对中国个人信息保护法的启示。',
    img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1600&auto=format&fit=crop',
    primary: '法学',
    secondary: '法学类',
    university: '中国人民大学',
    teacher: '周教授',
    mentorType: '教授',
    suit: '法学 | 知识产权'
  },
  {
    id: 8,
    title: '后疫情时代的全球供应链重构与风险管理',
    desc: '分析地缘政治与突发公共卫生事件对全球供应链稳定性的冲击及企业应对策略。',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop',
    primary: '经济学',
    secondary: '经济与贸易类',
    university: '复旦大学',
    teacher: '吴老师',
    mentorType: '教授',
    suit: '国际经济与贸易 | 物流管理'
  },
  ...Array.from({ length: 16 }).map((_, i) => ({
    id: 9 + i,
    title: `示例课程标题 ${9 + i}：探索未知领域的学术前沿`,
    desc: '本课程旨在引导学生深入理解该学科的核心理论与研究方法，通过案例分析与实践操作提升科研能力。',
    img: `https://picsum.photos/seed/course_${9 + i}/1200/800`,
    primary: DEFAULT_SUBJECTS[i % DEFAULT_SUBJECTS.length].name,
    secondary: DEFAULT_SUBJECTS[i % DEFAULT_SUBJECTS.length].children[0],
    university: '某某大学',
    teacher: `导师${9 + i}`,
    mentorType: i % 2 === 0 ? '教授' : '博士',
    suit: '相关专业'
  }))
]

const allCourses = ref(mockPhotos)

const debouncedSearchText = ref('')
let searchDebounceTimer = null
watch(searchText, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchText.value = val
  }, 200)
})

const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'desc', weight: 0.2 },
    { name: 'teacher', weight: 0.2 },
    { name: 'university', weight: 0.1 },
    { name: 'primary', weight: 0.05 },
    { name: 'secondary', weight: 0.05 }
  ],
  threshold: 0.4,
  includeScore: true
}

const baseFilteredCourses = computed(() => {
  let result = allCourses.value
  if (selectedPrimary.value) result = result.filter(p => p.primary === selectedPrimary.value)
  if (selectedSecondary.value) result = result.filter(p => p.secondary === selectedSecondary.value)
  if (selectedMentorType.value !== '全部') result = result.filter(p => p.mentorType === selectedMentorType.value)
  return result
})

const fuseIndex = shallowRef(null)
watch(baseFilteredCourses, (list) => {
  fuseIndex.value = list && list.length ? new Fuse(list, fuseOptions) : null
}, { immediate: true })

const filteredPhotos = computed(() => {
  let result = baseFilteredCourses.value
  
  const key = debouncedSearchText.value ? debouncedSearchText.value.trim() : ''
  if (key && fuseIndex.value) {
    const searchResult = fuseIndex.value.search(key)
    result = searchResult.map(item => item.item)
  }
  
  result = filterVisibleCourses(result)
  return result
})

let ignoreSearchWatch = false

watch(searchText, (val) => {
  if (ignoreSearchWatch) {
    ignoreSearchWatch = false
    return
  }
  if (!val || !val.trim()) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }
  
  const key = val.trim()
  if (!fuseIndex.value) {
    searchSuggestions.value = []
    showSuggestions.value = false
    return
  }
  const results = fuseIndex.value.search(key)
  
  const visibleResults = results.filter(r => isVisibleCourse(r.item))
  searchSuggestions.value = visibleResults.slice(0, 6).map(r => r.item)
  showSuggestions.value = searchSuggestions.value.length > 0
})

const paginatedPhotos = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredPhotos.value.slice(start, start + pageSize.value)
})

watch([selectedPrimary, selectedSecondary, selectedMentorType, searchText], () => {
  currentPage.value = 1
})

const toggleFavorite = id => {
  const next = new Set(favoriteIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  favoriteIds.value = next
}
const isFavorited = id => favoriteIds.value.has(id)

const getSuitTagList = item => {
  const raw = item && typeof item.suit === 'string' ? item.suit : ''
  if (!raw) return []
  return raw
    .split(/[|｜]/g)
    .map(s => s.trim())
    .filter(Boolean)
}

const getSuitTagMore = (item, max = 2) => {
  const list = getSuitTagList(item)
  return Math.max(0, list.length - max)
}

const handleFeishuLikeItems = (items) => {
  console.log('--- [DEBUG] Frontend Received Items ---', items)
  const map = new Map()
  const courses = []
  const arr = Array.isArray(items) ? items : []
  arr.forEach((record) => {
    const f = record.fields || {}
    console.log('--- [DEBUG] Record Fields ---', f)
    const englishFields = mapKeysToEnglish(f)
    const imgUrl = getCoverUrl({ ...f, ...englishFields })
    const headImg = extractUrl(f['头图地址测试'])
    const posterImg = extractUrl(f['海报地址测试'])
    const primaryList = normalizeToArray(f['一级学科'])
    const secondaryList = normalizeToArray(f['二级学科'])
    if (primaryList.length && secondaryList.length) {
      primaryList.forEach((p) => {
        if (!map.has(p)) map.set(p, new Set())
        secondaryList.forEach((s) => { if (s) map.get(p).add(s) })
      })
    }
    const primaryValue = primaryList[0] || '其他'
    const secondaryValue = secondaryList[0] || '其他'
    courses.push({
      ...englishFields,
      id: record.record_id || englishFields.id || Math.random().toString(36).slice(2),
      title: getText(f['教授课题名称'] || f['课题名称'] || f['项目名称'] || f['标题'] || f['title']) || '未命名课题',
      desc: getText(f['课题描述'] || f['课题简介'] || f['项目简介'] || f['简介'] || f['描述'] || f['summary'] || f['content']) || '暂无简介',
      img: imgUrl,
      headImg,
      posterImg,
      primary: primaryValue,
      secondary: secondaryValue,
      university: getText(f['导师院校'] || f['大学'] || f['学校'] || f['院校'] || f['university'] || f['school'] || f['导师所在/毕业院校'] || f['university_raw'] || f['organization'] || f['org_name']) || '未知大学',
      teacher: getText(f['导师姓名'] || f['导师'] || f['教师'] || f['mentor_name_cn'] || f['mentor'] || f['teacher'] || f['mentor_name'] || f['teacher_name']) || '未知导师',
      mentorType: getText(englishFields['mentor_type_cn'] || f['导师类型'] || f['导师职称'] || f['职称'] || f['mentor_title'] || f['title_job'] || f['title']) || '导师',
      suit: getText(f['适合专业'] || f['专业要求'] || f['suitable_major'] || f['major_requirement'] || f['suit']) || '',
      is_hidden: record.fields?.is_hidden ?? englishFields?.is_hidden ?? 0
    })
  })
  if (map.size > 0) {
    const newData = []
    for (const [name, childrenSet] of map) {
      newData.push({ name, children: Array.from(childrenSet) })
    }
    subjectData.value = newData
  }
  allCourses.value = courses
}
const getVisibleCardTags = (item) => {
  const tags = []
  if (item && item.primary) tags.push({ text: item.primary, type: 'main' })
  if (item && item.secondary) tags.push({ text: item.secondary, type: 'main' })
  return tags
}

const loadData = async () => {
  const fallbackCourses =
    Array.isArray(allCourses.value) && allCourses.value.length
      ? allCourses.value
      : mockPhotos

  const loadStartTime = performance.now()
  logger.info('HomeView', 'Start loading data')
  
  isLoading.value = true
  isError.value = false
  errorMessage.value = ''
  errorType.value = ''

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 10000)
    const respStart = performance.now()
    const resp = await fetch('/api/courses?limit=200', { signal: controller.signal })
    const respDuration = performance.now() - respStart
    clearTimeout(t)
    
    logger.info('HomeView', 'API /api/courses response', {
      status: resp.status,
      duration: `${respDuration.toFixed(2)}ms`
    })
    
    if (resp.ok) {
      const data = await resp.json()
      if (Array.isArray(data?.items) && data.items.length) {
        handleFeishuLikeItems(data.items)
        const totalDuration = performance.now() - loadStartTime
        logger.info('HomeView', 'Data loaded successfully from API', {
          count: data.items.length,
          totalDuration: `${totalDuration.toFixed(2)}ms`
        })
        isLoading.value = false
        return
      }
    }
  } catch (e) {
    logger.error('HomeView', 'API request failed', e, {
      endpoint: '/api/courses'
    })
  }

  if (!isConfigured()) {
    console.warn('⚠️ 飞书 API 未配置：请通过 .env.local 配置 VITE_FEISHU_APP_ID / VITE_FEISHU_APP_SECRET');
    showConfigHint.value = true
    configHintMessage.value = '未配置飞书数据源：请创建 .env.local 并设置 VITE_FEISHU_APP_ID、VITE_FEISHU_APP_SECRET、VITE_FEISHU_APP_TOKEN、VITE_FEISHU_TABLE_ID，然后重启开发服务器。当前展示为本地示例数据。'
    if (!Array.isArray(allCourses.value) || allCourses.value.length === 0) {
      allCourses.value = fallbackCourses
    }
    isLoading.value = false
    isError.value = false
    errorMessage.value = ''
    errorType.value = ''
    return;
  }

  if (!isBitableConfigured()) {
    showConfigHint.value = true
    configHintMessage.value = '未配置多维表格：请设置 VITE_FEISHU_APP_TOKEN、VITE_FEISHU_TABLE_ID，然后重启开发服务器。当前展示为本地示例数据。'
    if (!Array.isArray(allCourses.value) || allCourses.value.length === 0) {
      allCourses.value = fallbackCourses
    }
    isLoading.value = false
    isError.value = false
    errorMessage.value = ''
    errorType.value = ''
    return
  }

  showConfigHint.value = false
  configHintMessage.value = ''

  const { appToken, tableId } = getBitableConfig()

  const feishuStart = performance.now()
  logger.info('HomeView', 'Start loading data from Feishu', { appToken, tableId })

  searchRecords(appToken, tableId)
    .then(res => {
      const feishuDuration = performance.now() - feishuStart
      logger.info('HomeView', 'Feishu data loaded successfully', {
        count: res.items?.length || 0,
        duration: `${feishuDuration.toFixed(2)}ms`
      })
      
      if (res.items && res.items.length > 0) {
        logger.debug('HomeView', 'First item fields sample', {
          sampleFields: res.items[0]?.fields
        })
      }

      const map = new Map();
      const courses = [];
      const items = (res && res.items) || [];

      if (!items.length) {
        showConfigHint.value = true
        configHintMessage.value = '飞书表暂无数据，已展示本地示例数据。'
        allCourses.value = fallbackCourses
        return
      }

      items.forEach((record, index) => {
        const f = record.fields;
        const englishFields = mapKeysToEnglish(f);
        let imgUrl = getCoverUrl({ ...f, ...englishFields })
        const headImg = extractUrl(f['头图地址测试'])
        const posterImg = extractUrl(f['海报地址测试'])
        const primaryList = normalizeToArray(f['一级学科'])
        const secondaryList = normalizeToArray(f['二级学科'])

        if (primaryList.length && secondaryList.length) {
          primaryList.forEach((p) => {
            if (!map.has(p)) map.set(p, new Set())
            secondaryList.forEach((s) => {
              if (s) map.get(p).add(s)
            })
          })
        }

        const primaryValue = primaryList[0] || '其他'
        const secondaryValue = secondaryList[0] || '其他'

        courses.push({
          ...englishFields,
          id: record.record_id,
          title: getText(f['教授课题名称'] || f['课题名称'] || f['项目名称'] || f['标题']) || '未命名课题',
          desc: getText(f['课题描述'] || f['课题简介'] || f['项目简介'] || f['描述']) || '暂无简介',
          img: imgUrl,
          headImg: headImg,
          posterImg: posterImg,
          primary: primaryValue,
          secondary: secondaryValue,
          university: getText(f['导师院校'] || f['大学'] || f['学校'] || f['院校'] || f['university'] || f['school'] || f['导师所在/毕业院校'] || f['university_raw']) || '未知大学',
          teacher: getText(f['导师姓名'] || f['导师'] || f['教师'] || f['mentor_name_cn'] || f['mentor'] || f['teacher']) || '未知导师',
          mentorType: getText(englishFields['mentor_type_cn'] || f['导师类型'] || f['导师职称'] || f['职称'] || f['mentor_title'] || f['title_job']) || '导师',
          suit: getText(f['适合专业'] || f['专业要求'] || f['suitable_major'] || f['major_requirement']) || ''
        });
      });

      if (map.size > 0) {
        const newData = [];
        for (const [name, childrenSet] of map) {
          newData.push({
            name,
            children: Array.from(childrenSet)
          });
        }
        subjectData.value = newData;
        console.log('🔄 已更新学科分类数据:', newData);
      }

      allCourses.value = courses;
      console.log('🔄 已更新课程列表数据:', courses);
    })
    .catch(err => {
      const feishuDuration = performance.now() - feishuStart
      logger.error('HomeView', 'Feishu data load failed', err, {
        duration: `${feishuDuration.toFixed(2)}ms`
      })
      
      const friendlyErr = getFriendlyError(err)
      showConfigHint.value = true
      configHintMessage.value = `飞书数据获取失败（${friendlyErr.friendlyMessage}），已展示本地示例数据。`
      allCourses.value = fallbackCourses
      isError.value = false
      errorMessage.value = ''
      errorType.value = ''
    })
    .finally(() => {
      const totalDuration = performance.now() - loadStartTime
      isLoading.value = false
      logger.info('HomeView', 'Data load completed', {
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        finalCount: allCourses.value?.length || 0
      })
    });
}

const handleRetry = () => {
  loadData()
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
})

onMounted(() => {
  const raw = localStorage.getItem('favoriteIds')
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) favoriteIds.value = new Set(arr)
    } catch {}
  }
})

watch(favoriteIds, (set) => {
  try {
    const arr = Array.from(set)
    localStorage.setItem('favoriteIds', JSON.stringify(arr))
  } catch {}
})


const resetAllFilters = () => {
  selectedPrimary.value = ''
  selectedSecondary.value = ''
  selectedMentorType.value = '全部'
  searchText.value = ''
}


function performSearch() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  debouncedSearchText.value = searchText.value
  showSuggestions.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectSuggestion(item) {
  if (searchText.value !== item.title) {
    ignoreSearchWatch = true
    searchText.value = item.title
  }
  performSearch()
}

function onPhotoClick(item) {
  if (item && item.id) {
    router.push({
      path: `/detail/${item.id}`,
      query: {
        title: item.title,
        desc: item.desc,
        primary: item.primary,
        secondary: item.secondary,
        mentorType: item.mentorType,
        university: item.university,
        img: item.img
      }
    })
  }
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="page-wrapper" :class="{ 'is-dark': isDarkMode }">
    <header class="main-header">
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
            @focus="showSuggestions = !!searchText && searchSuggestions.length > 0"
            @blur="setTimeout(() => showSuggestions = false, 200)"
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
          
          <Transition name="suggestion-fade">
            <div class="search-suggestions" v-if="showSuggestions && searchSuggestions.length > 0">
              <div 
                class="suggestion-item" 
                v-for="item in searchSuggestions" 
                :key="item.id"
                @click="selectSuggestion(item)"
              >
                <div class="suggestion-title">{{ item.title }}</div>
                <div class="suggestion-meta">
                  <span>{{ item.university }}</span>
                  <span class="separator">|</span>
                  <span>{{ item.teacher }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
        <div class="auth-buttons">
          <el-button type="primary" class="login-btn" round>登录/注册</el-button>
        </div>
      </div>
    </header>

    <div class="filter-section">
      <div class="filter-content">
        <div class="filter-row">
          <span class="label">一级学科</span>
          <div class="options">
            <button class="filter-btn primary-all all-btn" :class="{ active: !selectedPrimary }" @click="onPrimaryAllClick">全部</button>
            <button v-for="sub in subjectData" :key="sub.name" class="filter-btn" :class="{ active: selectedPrimary === sub.name }" @click="onPrimaryClick(sub.name)">{{ sub.name }}</button>
          </div>
        </div>

        <div class="filter-row secondary-row">
          <span class="label">二级学科</span>
          <div class="options secondary-options" :class="{ expanded: expandedSecondary }">
            <button class="filter-btn secondary-all all-btn" :class="{ active: !selectedSecondary }" @click="onSecondaryAllClick">全部</button>
            <button v-for="item in currentSecondaryList" :key="item" class="filter-btn" :class="{ active: selectedSecondary === item }" @click="onSecondaryClick(item)">{{ item }}</button>
          </div>
          <div class="expand-more" :class="{ active: expandedSecondary }" v-if="currentSecondaryList.length > SECONDARY_LIMIT" @click="toggleSecondaryExpand">
            <el-icon><ArrowDown /></el-icon>
          </div>
        </div>

        <div class="filter-row">
          <span class="label">导师类型</span>
          <div class="options">
            <button v-for="type in mentorTypes" :key="type" class="filter-btn" :class="{ active: selectedMentorType === type, 'all-btn': type === '全部' }" @click="onMentorTypeClick(type)">{{ type }}</button>
          </div>
        </div>

        <div class="selected-filters-row" v-if="activeFilters.length > 0">
          <span class="label selected-label">已选</span>
          <div class="selected-tags">
            <div class="filter-tag" v-for="(filter, index) in activeFilters" :key="index">
              <span>{{ filter.label }}</span>
              <el-icon class="close-icon" @click="removeFilter(filter)"><Close /></el-icon>
            </div>
          </div>
          <button class="reset-btn" @click="resetAllFilters">
            <el-icon><RefreshRight /></el-icon>
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="list-container">
        <div class="list-header">
          <div class="left-info">
            <h2 class="section-title">课程列表</h2>
            <span class="total-count">共{{ filteredPhotos.length }}个课程</span>
          </div>
          <div class="view-toggle">
            <el-icon class="toggle-icon" :class="{ active: isGridView }" @click="isGridView = true"><Grid /></el-icon>
            <el-icon class="toggle-icon" :class="{ active: !isGridView }" @click="isGridView = false"><List /></el-icon>
          </div>
        </div>

      <div v-if="showConfigHint" class="config-hint">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ configHintMessage }}</span>
      </div>

        <div v-if="isLoading" class="loading-state">
          <img :src="loadingImg" class="loading-img" alt="正在加载中..." />
          <p class="loading-text">正在加载中...</p>
        </div>

        <div v-else-if="isError" class="error-state">
          <img :src="errorImg" class="error-img" alt="加载失败~" />
          <p class="error-text">加载失败~</p>
          <div class="error-message" v-if="errorMessage">
            <el-icon><WarningFilled /></el-icon>
            <span>{{ errorMessage }}</span>
          </div>
          <el-button type="primary" class="retry-btn" @click="handleRetry">
            <el-icon><RefreshRight /></el-icon>
            重试
          </el-button>
        </div>

        <div v-else-if="filteredPhotos.length === 0" class="empty-state">
          <template v-if="debouncedSearchText">
            <img :src="emptyImg" class="empty-img" alt="暂未搜索到相关课题内容" />
            <p class="empty-text">暂未搜索到相关课题内容</p>
          </template>
          <template v-else>
            <img :src="noContentImg" class="empty-img" alt="空空如也～" />
            <p class="empty-text">空空如也～</p>
          </template>
        </div>

		<TransitionGroup
		  v-else
		  name="list-fade"
		  tag="div"
		  class="course-grid"
		  :class="{ 'list-view': !isGridView }"
		>
		  <div class="course-card" v-for="item in paginatedPhotos" :key="item.id" @click="onPhotoClick(item)">
			<div class="card-cover">
			  <el-image 
			    :src="getCoverUrl(item) || publicImg" 
			    fit="cover" 
			    referrer-policy="no-referrer"
			    lazy
			  >
			    <template #error>
			      <img :src="publicImg" style="width:100%;height:100%;object-fit:cover;" />
			    </template>
			  </el-image>
          <div class="cover-title">{{ item.title }}</div>
          <div class="mentor-badge" 
             :class="item.mentorType && item.mentorType.includes('教授') ? 'badge-prof' : 'badge-phd'"
             @click.stop="onMentorTypeClick(item.mentorType)">
          {{ item.mentorType }}
        </div>
			  <button class="favorite-btn" :class="{ active: isFavorited(item.id) }" @click.stop="toggleFavorite(item.id)">
          <svg class="favorite-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              v-if="isFavorited(item.id)"
              fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
            <path
              v-else
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
              d="M12 20.6l-1.35-1.23C5.35 14.88 2.2 12.01 2.2 8.5 2.2 6.1 4.1 4.2 6.5 4.2c1.72 0 3.37.8 4.5 2.07 1.13-1.27 2.78-2.07 4.5-2.07 2.4 0 4.3 1.9 4.3 4.3 0 3.51-3.15 6.38-8.45 10.88L12 20.6z"
            />
          </svg>
        </button>
			</div>
			<div class="hover-detail">
			  <h3 class="hover-title" :title="item.title">{{ item.title }}</h3>
			  <div class="hover-tags">
				<span class="hover-tag">{{ item.primary }}</span>
				<span class="hover-tag" v-if="item.secondary">{{ item.secondary }}</span>
			  </div>
              <p class="hover-desc">{{ truncate(item.desc, 160) }}</p>
			</div>
			<div class="card-content">
			  <h3 class="card-title" :title="item.title">{{ item.title }}</h3>
			  <div class="card-tags">
        <span
          v-for="tag in getVisibleCardTags(item)"
          :key="`${item.id}-tag-${tag.text}`"
          class="tag-item tag-item--main"
        >{{ tag.text }}</span>
			  </div>
              <p class="card-desc">{{ truncate(item.desc, 120) }}</p>
			  <div class="card-footer">
				<div class="footer-item">
          <el-icon><School /></el-icon>
          <span class="footer-text" :title="item.university">{{ item.university }}</span>
        </div>
				<div class="footer-item" v-if="item.teacher && item.teacher.trim()">
          <el-icon><User /></el-icon>
          <span class="footer-text" :title="item.teacher">{{ item.teacher }}</span>
        </div>
			  </div>
			</div>
		  </div>
		</TransitionGroup>

        <div class="pagination-wrapper" v-if="!isLoading && !isError && filteredPhotos.length > 0">
          <el-pagination background layout="prev, pager, next, jumper" v-model:current-page="currentPage" :page-size="pageSize" :total="filteredPhotos.length" />
        </div>
      </div>
    </div>

    <FixedActionPanel
      :isDarkMode="isDarkMode"
      :qiansemoshiIcon="qiansemoshiIcon"
      :shensemoshiIcon="shensemoshiIcon"
      :fanhuidingbuIcon="fanhuidingbuIcon"
      :showDownload="false"
      :top="500"
      @toggle-dark="toggleDarkMode"
      @scroll-top="scrollToTop"
    />
  </div>
</template>

<style scoped>
:deep(.el-button--primary) {
  --el-button-bg-color: #ff6b00;
  --el-button-border-color: #ff6b00;
  --el-button-hover-bg-color: #ff8533;
  --el-button-hover-border-color: #ff8533;
}

.page-wrapper {
  width: 100%;
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  flex-direction: column;
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
  position: relative;
}

.header-search-input {
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #ebeef5;
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f2f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.suggestion-meta .separator {
  margin: 0 8px;
  color: #dcdfe6;
}

.suggestion-fade-enter-active,
.suggestion-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.suggestion-fade-enter-from,
.suggestion-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.header-search-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  border: 1px solid #ff6b00;
  background-color: #fff;
  box-shadow: none;
  padding: 0 0 0 20px;
  overflow: hidden;
}

.header-search-input :deep(.el-input__inner) {
  height: 42px;
  line-height: 42px;
  padding: 0;
}

.header-search-input :deep(.el-input__suffix) {
  padding: 0;
  right: 0;
}

.header-search-input :deep(.el-input__suffix-inner) {
  display: flex;
  align-items: center;
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
  border-radius: 0 !important;
  margin: 0 !important;
  border: none !important;
  background-color: #ff6b00 !important;
  color: white !important;
  padding: 0 24px !important;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.header-search-btn:hover {
  background-color: #ff8533 !important;
}

.filter-section {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.filter-content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.label {
  width: 80px;
  font-size: 14px;
  color: #666;
  line-height: 32px;
  flex-shrink: 0;
}

.options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-btn {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #ff6b00;
  color: #ff6b00;
}

.filter-btn.active {
  background: #ff6b00;
  color: #fff;
  border-color: #ff6b00;
  font-weight: 500;
}

.secondary-options {
  max-height: 40px;
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
}

.secondary-options.expanded {
  max-height: 2000px;
}

.filter-btn.all-btn.active {
  background: #ff6b00;
  color: #fff;
  border-color: #ff6b00;
}

.expand-more {
  margin-left: auto;
  cursor: pointer;
  color: #ff6b00;
  width: 28px;
  height: 28px;
  border: 1px solid #ff6b00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-more .el-icon {
  transition: transform 0.2s ease;
}

.expand-more.active .el-icon {
  transform: rotate(180deg);
}

.content-section {
  flex: 1;
  background-color: #f7f8fa;
  padding: 32px 0 60px;
}

.list-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.left-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.total-count {
  font-size: 14px;
  color: #999;
}

.view-toggle {
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 4px;
  border-radius: 8px;
}

.toggle-icon {
  padding: 6px;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.toggle-icon.active {
  background: #f0f2f5;
  color: #333;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.list-fade-enter-active,
.list-fade-leave-active {
	transition: all 0.25s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
	opacity: 0;
	transform: translateY(8px);
}

.list-fade-move {
	transition: transform 0.25s ease;
}

@media (prefers-reduced-motion: reduce) {
  .course-card,
  .hover-detail,
  .list-fade-enter-active,
  .list-fade-leave-active,
  .list-fade-move,
  .card-cover .el-image {
    transition: none !important;
  }
  .course-card:hover,
  .course-grid.list-view .course-card:hover .card-cover .el-image,
  .course-card:hover .card-cover .el-image {
    transform: none !important;
  }
}

.course-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid transparent;
  position: relative;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
  background: #e9edf2;
  border-color: #dcdfe6;
}

.hover-detail {
  position: absolute;
  left: 0;
  right: 0;
  top: 200px;
  bottom: 0;
  background: #e9edf2;
  padding: 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-top: 1px solid #dcdfe6;
  box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.06);
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.25s ease;
  pointer-events: none;
  will-change: opacity, transform;
}

.course-card:hover .hover-detail {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.card-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-cover .el-image {
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
  will-change: transform;
}

.course-card:hover .card-cover .el-image {
  transform: scale(1.05);
}

.course-grid.list-view {
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.course-grid.list-view .course-card {
  flex-direction: row;
  align-items: stretch;
  border: 1px solid #f0f0f0;
  height: 200px;
}

.course-grid.list-view .card-cover {
  width: 168px;
  height: calc(100% - 32px);
  flex-shrink: 0;
  border-radius: 10px;
  margin: 16px;
}

.course-grid.list-view .mentor-badge {
  left: auto;
  right: 12px;
  top: 12px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.course-grid.list-view .badge-prof {
  background: #fff0e6;
  color: #ff6b00;
}

.course-grid.list-view .badge-phd {
  background: #e6f4ff;
  color: #1677ff;
}

.course-grid.list-view .cover-title {
  display: none;
}

.course-grid.list-view .hover-detail {
  position: absolute;
  left: 200px;
  right: 0;
  top: 0;
  bottom: 0;
  background: #e9edf2;
  padding: 16px;
  border-left: 1px solid #dcdfe6;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.25s ease;
  pointer-events: none;
}

.course-grid.list-view .card-content {
  padding: 16px 20px 16px 0;
}

.course-grid.list-view .card-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  -webkit-line-clamp: 2;
  height: 48px;
  margin-bottom: 12px;
}

.course-grid.list-view .card-tags {
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  margin-bottom: 8px;
}

.course-grid.list-view .tag-item {
  height: 24px;
  line-height: 20px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 500;
  border: 1px solid transparent;
  white-space: nowrap;
}

.course-grid.list-view .tag-item--main {
  background: #fff3ea;
  color: #ff6b00;
  border-color: rgba(255, 107, 0, 0.18);
}

.course-grid.list-view .tag-item--suit {
  background: #eef0f4;
  color: #8c8c8c;
  border-color: rgba(0, 0, 0, 0.06);
}

.tag-item--more {
  padding-left: 6px;
  padding-right: 6px;
  min-width: 20px;
  text-align: center;
}

.course-grid.list-view .card-desc {
  font-size: 14px;
  color: #999;
  line-height: 22px;
  margin-bottom: 14px;
  -webkit-line-clamp: 1;
  flex: 0 0 auto;
}

.course-grid.list-view .card-footer {
  border-top: none;
  padding-top: 0;
  margin-top: auto;
}

.course-grid.list-view .course-card:hover .hover-detail {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.course-grid.list-view .course-card:hover {
  background: #e9edf2;
  border-color: #dcdfe6;
}

.course-grid.list-view .course-card:hover .card-content {
  opacity: 0;
  visibility: hidden;
}

.course-grid.list-view .course-card:hover .card-cover .el-image {
  transform: scale(1.05);
}

.mentor-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  z-index: 2;
  cursor: pointer;
  transition: opacity 0.2s;
}

.mentor-badge:hover {
  opacity: 0.9;
}

.badge-prof {
  background: #ff6b00;
}

.badge-phd {
  background: #409eff;
}

.favorite-btn {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  padding: 0;
  color: #b3b3b3;
  transition: all 0.2s ease;
}

.favorite-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
}

.favorite-btn.active {
  background: #ff6b00;
  border-color: #ff6b00;
  color: #fff;
}

.favorite-icon {
  width: 16px;
  height: 16px;
}

.favorite-btn :deep(.el-icon) {
  font-size: 16px;
}

.hover-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.5;
  margin: 0 0 10px;
}

.hover-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.hover-tag {
  font-size: 12px;
  color: #ff6b00;
  background: #fff0e6;
  padding: 2px 8px;
  border-radius: 4px;
}

.hover-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  max-height: 6.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.course-card:hover .card-content {
  opacity: 0;
  visibility: hidden;
}

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 48px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-item {
  font-size: 12px;
  color: #ff6b00;
  background: #fff3ea;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-item--suit {
  font-size: 12px;
  color: #8c8c8c;
  background: #eef0f4;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.footer-item .footer-text {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-grid.list-view .footer-item .footer-text {
  max-width: 180px;
}

.pagination-wrapper {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #ff6b00;
}

.selected-filters-row {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding-top: 16px;
  border-top: 1px dashed #eee;
}

.selected-label {
  color: #ff6b00 !important;
  font-weight: 500;
}

.selected-tags {
  display: flex;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 1px solid #ff6b00;
  border-radius: 999px;
  color: #ff6b00;
  background: #fff;
  font-size: 13px;
  transition: all 0.2s;
  height: 32px;
  box-sizing: border-box;
}

.filter-tag:hover {
  background: #fff0e6;
}

.close-icon {
  font-size: 14px;
  cursor: pointer;
  border-radius: 50%;
  padding: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon:hover {
  background: rgba(255, 107, 0, 0.1);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #ff4d4f;
  background: #fff;
  color: #ff4d4f;
  padding: 0 16px;
  height: 32px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.reset-btn:hover {
  background: #fff1f0;
}

.cover-title {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 60px 12px 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
  z-index: 1;
  pointer-events: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.fixed-action-panel {
  position: fixed;
  right: 24px;
  top: 500px;
  background: #fff;
  border-radius: 41px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 1000;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
}

.action-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.action-text {
  font-size: 12px;
  line-height: 1;
}

.empty-state,
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  min-height: 400px;
}

.empty-img,
.loading-img,
.error-img {
  width: 160px;
  height: auto;
  margin-bottom: 16px;
  opacity: 0.9;
}

.empty-text,
.loading-text,
.error-text {
  color: #909399;
  font-size: 14px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  background: #fff1f0;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 14px;
  max-width: 400px;
  text-align: center;
}

.error-message .el-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.config-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 16px auto 0;
  padding: 12px 16px;
  background: #e6f4ff;
  border-radius: 8px;
  color: #1677ff;
  font-size: 14px;
  max-width: 980px;
  width: calc(100% - 48px);
}

.config-hint .el-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.retry-btn {
  margin-top: 16px;
  display: flex;
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

@media (max-width: 1200px) {
  .course-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .course-grid.list-view{
    grid-template-columns: 1fr;
  }
  .search-container {
    margin: 0 20px;
  }
}

@media (max-width: 600px) {
  .course-grid {
    grid-template-columns: 1fr;
  }
  .header-content {
    flex-wrap: wrap;
    height: auto;
    padding: 12px;
  }
  .search-container {
    order: 3;
    width: 100%;
    max-width: none;
    margin: 12px 0 0;
  }
}


/* 深色模式适配 */
/* 全局 HTML 和 body 深色模式 */
html.dark, body.dark {
  background: #1b1e27;
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark {
  background: #1b1e27;
}

.page-wrapper.is-dark .main-header {
  background: #3b3f49;
  border-bottom-color: transparent;
}

.page-wrapper.is-dark .filter-section {
  background: #3b3f49;
  border-bottom-color: transparent;
}

.page-wrapper.is-dark .label {
  color: rgba(229, 231, 235, 0.78);
}

.page-wrapper.is-dark .filter-btn {
  background: rgba(0, 0, 0, 0.18);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(229, 231, 235, 0.9);
}

.page-wrapper.is-dark .filter-btn:hover {
  border-color: #ff6b00;
  color: #ff6b00;
}

.page-wrapper.is-dark .filter-btn.active {
  background: #ff6b00;
  border-color: #ff6b00;
  color: #fff;
}

.page-wrapper.is-dark .expand-more {
  border-color: rgba(255, 107, 0, 0.9);
  color: rgba(255, 107, 0, 0.95);
}

.page-wrapper.is-dark .header-search-input :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.12);
  border-color: #ff6b00;
}

.page-wrapper.is-dark .header-search-input :deep(.el-input__inner) {
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark .header-search-input :deep(.el-input__inner::placeholder) {
  color: rgba(229, 231, 235, 0.5);
}

.page-wrapper.is-dark .header-search-input :deep(.el-input__prefix-inner) {
  color: rgba(229, 231, 235, 0.7);
}

.page-wrapper.is-dark .search-suggestions {
  background: #2f3440;
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.38);
}

.page-wrapper.is-dark .suggestion-item {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.page-wrapper.is-dark .suggestion-item:hover {
  background-color: rgba(255, 255, 255, 0.06);
}

.page-wrapper.is-dark .suggestion-title {
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark .suggestion-meta {
  color: rgba(229, 231, 235, 0.62);
}

.page-wrapper.is-dark .suggestion-meta .separator {
  color: rgba(255, 255, 255, 0.2);
}

.page-wrapper.is-dark .content-section {
  background-color: #1b1e27;
}

.page-wrapper.is-dark .section-title {
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark .total-count {
  color: rgba(229, 231, 235, 0.52);
}

.page-wrapper.is-dark .view-toggle {
  background: rgba(0, 0, 0, 0.18);
}

.page-wrapper.is-dark .toggle-icon {
  color: rgba(229, 231, 235, 0.6);
}

.page-wrapper.is-dark .toggle-icon.active {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark .course-card {
  background: #3b3f49;
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(229, 231, 235, 0.9);
}

.page-wrapper.is-dark .course-card:hover {
  background: #444956;
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.32);
}

.page-wrapper.is-dark .hover-detail {
  background: #444956;
  border-top-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.28);
}

.page-wrapper.is-dark .course-grid.list-view .course-card {
  border-color: rgba(255, 255, 255, 0.12);
}

.page-wrapper.is-dark .course-grid.list-view .hover-detail {
  background: #444956;
  border-left-color: rgba(255, 255, 255, 0.12);
}

.page-wrapper.is-dark .hover-title {
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark .hover-tag {
  background: rgba(255, 107, 0, 0.14);
  color: #ff6b00;
}

.page-wrapper.is-dark .hover-desc {
  color: rgba(229, 231, 235, 0.72);
}

.page-wrapper.is-dark .card-title {
  color: rgba(249, 250, 251, 0.92);
}

.page-wrapper.is-dark .tag-item {
  background: rgba(255, 107, 0, 0.14);
  color: #ff6b00;
}

.page-wrapper.is-dark .card-desc {
  color: rgba(229, 231, 235, 0.7);
}

.page-wrapper.is-dark .card-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
  color: rgba(229, 231, 235, 0.6);
}

.page-wrapper.is-dark .favorite-btn {
  background: rgba(0, 0, 0, 0.35);
  color: rgba(229, 231, 235, 0.55);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
}

.page-wrapper.is-dark .favorite-btn:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
}

.page-wrapper.is-dark .favorite-btn.active {
  color: #ff6b00;
}

.page-wrapper.is-dark .course-title {
  color: #f9fafb;
}

.page-wrapper.is-dark .course-desc {
  color: #9ca3af;
}

.page-wrapper.is-dark .info-item {
  color: #9ca3af;
}

.page-wrapper.is-dark .selected-filters-row {
  border-top-color: rgba(255, 255, 255, 0.12);
}

.page-wrapper.is-dark .filter-tag {
  background: rgba(0, 0, 0, 0.18);
  border-color: rgba(255, 107, 0, 0.7);
  color: #ff6b00;
}

.page-wrapper.is-dark .filter-tag:hover {
  background: rgba(255, 107, 0, 0.14);
}

.page-wrapper.is-dark .reset-btn {
  background: rgba(0, 0, 0, 0.18);
}

.page-wrapper.is-dark .reset-btn:hover {
  background: rgba(255, 77, 79, 0.12);
}

.page-wrapper.is-dark :deep(.el-pagination) {
  --el-pagination-text-color: rgba(229, 231, 235, 0.72);
  --el-pagination-hover-color: #ff6b00;
}

.page-wrapper.is-dark :deep(.el-pagination.is-background .el-pager li),
.page-wrapper.is-dark :deep(.el-pagination.is-background .btn-prev),
.page-wrapper.is-dark :deep(.el-pagination.is-background .btn-next) {
  background: rgba(0, 0, 0, 0.18);
  color: rgba(229, 231, 235, 0.72);
}

.page-wrapper.is-dark :deep(.el-pagination.is-background .el-pager li:not(.is-active):hover) {
  color: #ff6b00;
}
</style>