import api from './api';
import { detailCourses, detailOtherCourses, homeCourseTemplates, searchAllCourses } from '../mock/courses';

const DEFAULT_COURSE_IMAGE = '/H5_icon/meiyouneirong.png';
const DEFAULT_RATING = 4;

// 验证图片 URL 是否有效（检查是否为空或无效的 OSS 链接）
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  
  // 如果是相对路径，认为是有效的（本地图片）
  if (trimmed.startsWith('/')) return true;
  
  // 如果是 HTTP/HTTPS 链接，检查是否是有效的 URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // 过滤掉明显无效的 OSS 链接（可选：可以根据实际情况调整）
    // 如果 OSS 链接经常失效，可以在这里添加更多验证逻辑
    return true;
  }
  
  return false;
};

// 获取有效的图片 URL，如果无效则返回默认图片
const getValidImageUrl = (...urls) => {
  // 暴力解决：只返回 pic_url
  return urls[0] || DEFAULT_COURSE_IMAGE;
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const uniqueStrings = (list) => {
  const seen = new Set();
  const out = [];
  asArray(list).forEach((item) => {
    const text = toText(item);
    if (!text) return;
    if (seen.has(text)) return;
    seen.add(text);
    out.push(text);
  });
  return out;
};

const getOkFlag = (res) => {
  if (res && typeof res === 'object') {
    if (typeof res.success === 'boolean') return res.success;
    if (typeof res.ok === 'boolean') return res.ok;
    if (typeof res.code === 'number') return res.code === 0;
    if (typeof res.errno === 'number') return res.errno === 0;
    if (typeof res.status === 'number') return res.status === 0;
  }
  return undefined;
};

const unwrapData = (res) => {
  if (res && typeof res === 'object' && 'data' in res) return res.data;
  return res;
};

const assertApiOk = (res, fallbackMessage) => {
  const ok = getOkFlag(res);
  if (ok === false) {
    const error = new Error(fallbackMessage || 'request failed');
    error.payload = res;
    throw error;
  }
  return unwrapData(res);
};

const pickField = (source, keys = []) => {
  if (!isObject(source)) return undefined;
  for (const key of keys) {
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];
      if (value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) {
        return value;
      }
    }
  }
  return undefined;
};

const toText = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const list = value.map((item) => toText(item)).filter(Boolean);
    return list.join('，');
  }
  if (isObject(value)) {
    return (
      toText(value.text) ||
      toText(value.name) ||
      toText(value.label) ||
      toText(value.value) ||
      toText(value.title) ||
      ''
    );
  }
  return '';
};

const toNumberSafe = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toStringArrayLoose = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (Array.isArray(item)) return toStringArrayLoose(item);
        if (isObject(item)) {
          const text = toText(item);
          return text ? [text] : [];
        }
        const text = toText(item);
        return text ? [text] : [];
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return toStringArrayLoose(parsed);
      }
    } catch {}

    return text
      .split(/[,\n\r，|｜;；]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (isObject(value)) {
    const text = toText(value);
    return text ? [text] : [];
  }

  return [];
};

const extractUrl = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractUrl(item);
      if (url) return url;
    }
    return '';
  }

  if (isObject(value)) {
    const direct =
      value.url ||
      value.link ||
      value.href ||
      value.src ||
      value.poster_url ||
      value.banner_url ||
      value.pic_url ||
      value.download_url ||
      value.tmp_url ||
      value.image ||
      '';
    if (direct) return String(direct).trim();
    return toText(value);
  }

  return '';
};

const normalizeFeishuLikeRecord = (raw) => {
  if (isObject(raw?.fields)) {
    return {
      recordId: String(raw?.record_id ?? raw?.id ?? ''),
      fields: raw.fields
    };
  }

  return {
    recordId: String(raw?.record_id ?? raw?.id ?? ''),
    fields: isObject(raw) ? raw : {}
  };
};

let difficultyDebugPrinted = 0;

const pickTopics = (res) => {
  if (!res || typeof res !== 'object') return [];
  return res?.topics ?? res?.list ?? res?.data ?? [];
};

const toLegacyCourseListItem = (raw) => {
  const tags = [...asArray(raw?.primary_subject), ...asArray(raw?.secondary_subject)].filter(Boolean);
  const tagsMore = tags.length > 3 ? tags.length - 3 : 0;
  const parsedDifficulty = Number(raw?.difficulty_score ?? 0);
  const rating = Number.isFinite(parsedDifficulty) ? parsedDifficulty : 0;

  return {
    id: String(raw?.id ?? ''),
    image: getValidImageUrl(raw?.pic_url, raw?.poster_url),
    roleName: raw?.teacher_title || '导师',
    roleType: 'prof',
    title: raw?.title || '',
    tags: tags.slice(0, 3),
    tagsMore,
    desc: raw?.topic_description || '',
    school: raw?.teacher_school || '',
    teacher: raw?.teacher_name || '',
    tutorId: String(raw?.tutor_id ?? ''),
    rating,
    isLiked: false,
    statusDot: false
  };
};

const buildKeywordText = (item) => {
  return [
    item?.title,
    item?.desc,
    item?.school,
    item?.teacher,
    ...(Array.isArray(item?.tags) ? item.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const filterByKeyword = (courses, keyword) => {
  const key = String(keyword || '').trim().toLowerCase();
  if (!key) return courses;
  return asArray(courses).filter((item) => buildKeywordText(item).includes(key));
};

const toLegacyCourseListItemFromMock = (raw, index = 0) => {
  const tags = uniqueStrings(
    asArray(raw?.tags).length
      ? asArray(raw?.tags)
      : [...asArray(raw?.primary_subject), ...asArray(raw?.secondary_subject)]
  );
  const roleType = raw?.roleType || (String(raw?.roleName || raw?.teacher_title || '').includes('博士') ? 'doc' : 'prof');

  return {
    id: String(raw?.id ?? index + 1),
    image: getValidImageUrl(raw?.pic_url, raw?.image, raw?.poster_url),
    roleName: raw?.roleName || raw?.teacher_title || '导师',
    roleType,
    title: raw?.title || '',
    tags: tags.slice(0, 3),
    tagsMore: Math.max(0, tags.length - 3),
    desc: raw?.desc || raw?.topic_description || '',
    school: raw?.school || raw?.teacher_school || '',
    teacher: raw?.teacher || raw?.teacher_name || '',
    tutorId: String(raw?.tutorId ?? raw?.tutor_id ?? raw?.teacher ?? raw?.id ?? ''),
    rating: toNumberSafe(raw?.rating ?? raw?.difficulty_score, DEFAULT_RATING),
    isLiked: Boolean(raw?.isLiked),
    statusDot: Boolean(raw?.statusDot)
  };
};

const buildCourseListFallback = (keyword = '') => {
  const rawList = asArray(searchAllCourses).length ? asArray(searchAllCourses) : asArray(homeCourseTemplates);
  const mapped = rawList.map((item, index) => toLegacyCourseListItemFromMock(item, index));
  return filterByKeyword(mapped, keyword);
};

const buildCourseDetailFallback = (id) => {
  const safeId = String(id || '').trim();
  const rawList = asArray(detailCourses);
  const picked =
    rawList.find((item) => String(item?.id || '').trim() === safeId) ||
    rawList[0] ||
    {};

  const listLike = toLegacyCourseListItemFromMock(picked);
  const tags = uniqueStrings(asArray(picked?.tags).length ? asArray(picked?.tags) : asArray(listLike?.tags));
  const primarySubjects = tags.slice(0, 2);
  const secondarySubjects = tags.slice(2);

  return {
    id: String(picked?.id ?? safeId ?? ''),
    title: picked?.title || listLike.title,
    image: picked?.image || listLike.image || DEFAULT_COURSE_IMAGE,
    school: picked?.school || listLike.school || '',
    teacher: picked?.teacher || listLike.teacher || '',
    desc: picked?.desc || listLike.desc || '',
    tutorId: String(picked?.tutorId ?? listLike.tutorId ?? picked?.teacher ?? safeId ?? '1'),
    rating: toNumberSafe(picked?.rating, listLike.rating || DEFAULT_RATING),
    tags,
    primarySubjects,
    secondarySubjects,
    mainTutor: isObject(picked?.mainTutor) ? picked.mainTutor : {},
    subTutor: isObject(picked?.subTutor) ? picked.subTutor : {},
    projectInfo: isObject(picked?.projectInfo) ? picked.projectInfo : {},
    projectProcess: asArray(picked?.projectProcess),
    projectGain: asArray(picked?.projectGain),
    views: Math.max(0, Math.floor(toNumberSafe(picked?.views, 0))),
    __isMock: true,
    __source: 'local_mock'
  };
};

const normalizeProcessList = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (isObject(item)) {
          const title = toText(item.title || item.name || item.phase || `阶段${index + 1}`);
          const desc = toText(item.desc || item.description || item.content || '');
          return { step: Number(item.step || index + 1), title, desc };
        }
        const text = toText(item);
        return text ? { step: index + 1, title: text, desc: '' } : null;
      })
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return normalizeProcessList(parsed);
    } catch {}

    return text
      .split(/\r?\n|[;；]+/g)
      .map((line, index) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({ step: index + 1, title: line, desc: '' }));
  }

  return [];
};

const toCourseListItemFromWuRecord = (record) => {
  const { recordId, fields } = normalizeFeishuLikeRecord(record);

  const id = String(
    pickField(fields, ['record_id', 'id', 'topic_id', 'course_id', '课题编号']) ??
      recordId ??
      ''
  );

  const title =
    toText(
      pickField(fields, [
        '教授课题名称',
        '课题名称',
        '项目名称',
        '标题',
        'title',
        'project_name',
        'name'
      ])
    ) || '未命名课题';

  const school = toText(
    pickField(fields, [
      '导师院校',
      '大学',
      '学校',
      '院校',
      'university',
      'school',
      'teacher_school',
      'tutor_school'
    ])
  );

  const teacher = toText(
    pickField(fields, [
      '导师姓名',
      '导师',
      '教师',
      'teacher',
      'mentor',
      'teacher_name'
    ])
  );

  const mentorType =
    toText(
      pickField(fields, [
        '导师类型',
        '导师职称',
        '职称',
        'mentor_type',
        'mentorType',
        'teacher_title'
      ])
    ) || '导师';

  const desc = toText(
    pickField(fields, [
      '课题描述',
      '课程描述',
      '课题简介',
      '项目简介',
      '描述',
      '简介',
      'topic_description',
      'description',
      'desc'
    ])
  );

  const primary = toStringArrayLoose(
    pickField(fields, ['一级学科', 'primary_subject', 'primary', 'pri_sub', 'subject_1', 'subject1'])
  );
  const secondary = toStringArrayLoose(
    pickField(fields, ['二级学科', 'secondary_subject', 'secondary', 'sec_sub', 'subject_2', 'subject2'])
  );
  const tags = [...primary, ...secondary].filter(Boolean);
  const tagsMore = tags.length > 3 ? tags.length - 3 : 0;

  const image =
    extractUrl(
      pickField(fields, [
        'pic_url',
        'poster_url',
        '封面图',
        '头图地址测试',
        '海报地址测试',
        'banner_url',
        'cover_url',
        'image',
        'img',
        'poster'
      ])
    ) || DEFAULT_COURSE_IMAGE;

  const tutorId = toText(pickField(fields, ['导师编号', '导师ID', 'tutor_id', 'teacher_id', 'mentor_id']));

  const difficultyRaw = pickField(fields, ['难度等级', 'difficulty_score', 'difficulty', 'rating']);
  const rating = toNumberSafe(difficultyRaw, DEFAULT_RATING);

  if (import.meta.env.DEV && difficultyDebugPrinted < 30) {
    difficultyDebugPrinted += 1;
    console.log('[Course Difficulty]', {
      id,
      title,
      difficultyRaw,
      rating,
      fieldsDifficulty: {
        '难度等级': fields?.['难度等级'],
        difficulty_score: fields?.difficulty_score,
        difficulty: fields?.difficulty,
        rating: fields?.rating
      }
    });
  }

  return {
    id,
    image,
    roleName: mentorType,
    roleType: mentorType.includes('博士') ? 'doc' : 'prof',
    title,
    tags: tags.slice(0, 3),
    tagsMore,
    desc,
    school,
    teacher,
    tutorId,
    rating,
    isLiked: false,
    statusDot: false
  };
};

const toCourseDetailFromWuRecord = (record, fallbackId = '', source = '') => {
  const { recordId, fields } = normalizeFeishuLikeRecord(record);
  const listItem = toCourseListItemFromWuRecord(record);
  const primarySubjects = uniqueStrings(
    toStringArrayLoose(
      pickField(fields, ['一级学科', 'primary_subject', 'primary', 'pri_sub', 'subject_1', 'subject1'])
    ),
  );
  const secondarySubjects = uniqueStrings(
    toStringArrayLoose(
      pickField(fields, ['二级学科', 'secondary_subject', 'secondary', 'sec_sub', 'subject_2', 'subject2'])
    )
  );
  const detailTags = uniqueStrings([...primarySubjects, ...secondarySubjects]);

  const processRaw = pickField(fields, ['项目流程', 'project_process', 'projectProcess']);
  const projectProcess = normalizeProcessList(processRaw);

  const projectGain = toStringArrayLoose(pickField(fields, ['项目收获', 'project_gain', 'projectGain']));

  const specialtyText = toStringArrayLoose(
    pickField(fields, ['专业领域', 'tutor_majors', 'tutor_major', 'research_fields', 'research_area', 'expertise'])
  ).join('，');

  const suitableText =
    toText(pickField(fields, ['适合学生', 'suitable_students', 'suitableStudent'])) || '';
  const suitableMajorText =
    toText(pickField(fields, ['适合专业', '专业要求', 'suitable_major', 'major_requirement'])) || '';

  const mainTutor = {
    name: listItem.teacher || '导师',
    title: listItem.roleName || '导师',
    school: listItem.school || '',
    specialty: specialtyText,
    suitable: suitableText,
    suitableMajor: suitableMajorText,
    highlights: toStringArrayLoose(pickField(fields, ['导师亮点', 'mentor_highlights', 'highlights']))
  };

  const projectInfo = {
    format: toText(pickField(fields, ['项目形式', 'project_form', 'projectFormat'])) || '远程1V1，全年滚动招生',
    plan:
      toText(pickField(fields, ['项目方案', '项目计划', 'project_plan', 'projectPlan'])) ||
      '远程科研+国际会议论文辅导（3-6个月）',
    suitable: suitableText,
    suitability: suitableMajorText
  };

  return {
    id: String(listItem.id || fallbackId || recordId || ''),
    title: listItem.title,
    image: listItem.image || DEFAULT_COURSE_IMAGE,
    school: listItem.school,
    teacher: listItem.teacher,
    desc: listItem.desc,
    tutorId: String(listItem.tutorId || ''),
    rating: Number(listItem.rating || DEFAULT_RATING),
    tags: detailTags.length ? detailTags : asArray(listItem.tags),
    primarySubjects,
    secondarySubjects,
    mainTutor,
    subTutor: {},
    projectInfo,
    projectProcess,
    projectGain,
    posterUrl: extractUrl(pickField(fields, ['pic_url', 'poster_url', '海报地址', 'poster'])) || listItem.image || '',
    topicCode:
      toText(pickField(fields, ['课题编号', 'course_id', 'record_id', 'course_no', 'project_no', 'topic_id', 'id'])) ||
      String(listItem.id || fallbackId || ''),
    updateDate:
      toText(pickField(fields, ['create_time', '更新时间', 'update_time', 'updated_at', 'publish_time', 'created_at'])) || '',
    views: Math.max(
      0,
      Math.floor(
        toNumberSafe(
          pickField(fields, ['浏览量', '浏览次数', 'view_count', 'views', 'browse_count', 'visit_count', 'click_count']),
          0
        )
      )
    ),
    __isMock: false,
    __source: source || 'wu_pc'
  };
};

const requestCourseListByWuPcContract = async (params = {}) => {
  const limit = Math.min(Number(params?.limit || 200), 500);
  console.log('[Courses API] Calling /api/courses with limit:', limit);
  const response = await api.get('/courses', { params: { limit } });
  console.log('[Courses API] Response:', response);
  const data = unwrapData(response);
  const items = asArray(data?.items);
  if (!Array.isArray(data?.items)) {
    throw new Error('INVALID_WU_PC_LIST_PAYLOAD');
  }
  return {
    source: data?.source || 'wu_pc',
    items
  };
};

const requestCourseListByLegacyContract = async (params = {}, fallbackMessage = '获取课题列表失败') => {
  const response = await api.get('/courses/topics', { params });
  const data = assertApiOk(response, fallbackMessage);
  const topics = asArray(pickTopics(data));
  return topics.map(toLegacyCourseListItem);
};

const requestDetailByLegacyContract = async (id) => {
  const response = await api.get(`/courses/topics/${encodeURIComponent(String(id || ''))}`);
  const isMock = response?.msg === 'mock_fallback';
  const data = assertApiOk(response, '加载课题详情失败');
  if (!data) return null;

  const primarySubjects = uniqueStrings(asArray(data?.primary_subject));
  const secondarySubjects = uniqueStrings(asArray(data?.secondary_subject));

  return {
    id: String(data?.id ?? id ?? ''),
    title: data?.title || '',
    image: getValidImageUrl(data?.pic_url, data?.poster_url),
    school: data?.teacher_school || '',
    teacher: data?.teacher_name || '',
    desc: data?.topic_description || '',
    tutorId: String(data?.tutor_id ?? ''),
    rating: Number(data?.difficulty_score ?? 0) || DEFAULT_RATING,
    topicCode: String(data?.course_id ?? data?.record_id ?? data?.recordId ?? data?.course_no ?? data?.project_no ?? data?.id ?? id ?? ''),
    updateDate: String(data?.create_time ?? data?.update_time ?? data?.updated_at ?? ''),
    tags: uniqueStrings([...primarySubjects, ...secondarySubjects]),
    primarySubjects,
    secondarySubjects,
    mainTutor: data?.mainTutor || {},
    subTutor: data?.subTutor || {},
    projectInfo: data?.projectInfo || {},
    projectProcess: data?.projectProcess || [],
    projectGain: data?.projectGain || [],
    views: Math.max(0, Math.floor(toNumberSafe(data?.views ?? data?.view_count, 0))),
    __isMock: isMock
  };
};

const fetchCoursesPreferWuPc = async ({ keyword = '', limit = 200 } = {}) => {
  try {
    const payload = await requestCourseListByWuPcContract({ limit });
    const list = asArray(payload.items).map(toCourseListItemFromWuRecord);
    return filterByKeyword(list, keyword);
  } catch (wuError) {
    const params = { limit: Math.min(Number(limit || 50), 500) };
    if (keyword) params.keyword = keyword;
    try {
      const legacyList = await requestCourseListByLegacyContract(params, '获取课题列表失败');
      return filterByKeyword(legacyList, keyword);
    } catch (legacyError) {
      console.warn('课程接口异常，已回退到本地 Mock 列表:', legacyError?.message || legacyError);
      return buildCourseListFallback(keyword);
    }
  }
};

const toHotItem = (item, index) => ({
  title: item?.title || '',
  tag: index === 0 ? 'hot' : index < 3 ? 'recommend' : ''
});

export const buildSearchHotList = (courses = []) => {
  return asArray(courses)
    .filter((item) => item?.title)
    .slice(0, 8)
    .map(toHotItem);
};

export const extractCategoriesFromCourses = (courses = []) => {
  const set = new Set();
  asArray(courses).forEach((course) => {
    asArray(course?.tags).forEach((tag) => {
      if (!tag) return;
      set.add(String(tag));
    });
  });
  return Array.from(set).slice(0, 10);
};

// 获取首页课程列表（优先兼容 wu_pc 的 /api/courses 契约）
export const getHomeCourseTemplates = async (params = {}) => {
  try {
    const limit = params?.limit || 200;
    return await fetchCoursesPreferWuPc({ keyword: '', limit });
  } catch (error) {
    console.warn('Failed to load home courses, fallback to local mock:', error?.message || error);
    return buildCourseListFallback('');
  }
};

// 搜索课程（优先兼容 wu_pc 的 /api/courses 契约）
export const getSearchAllCourses = async (keyword = '') => {
  try {
    const safeKeyword = String(keyword || '').trim();
    return await fetchCoursesPreferWuPc({ keyword: safeKeyword, limit: 200 });
  } catch (error) {
    const safeKeyword = String(keyword || '').trim();
    console.warn('搜索接口失败，回退本地 Mock:', error?.message || error);
    return buildCourseListFallback(safeKeyword);
  }
};

// 获取热门搜索（由真实课程数据派生）
export const getSearchHotList = async () => {
  const courses = await getSearchAllCourses('');
  return buildSearchHotList(courses);
};

export const getBackendRuntimeStatus = async () => {
  let dbConnected = null;
  let source = 'unknown';

  try {
    const health = await api.get('/health');
    if (typeof health?.db === 'boolean') {
      dbConnected = health.db;
    }
  } catch {}

  try {
    const payload = await api.get('/courses', { params: { limit: 1 } });
    const rawSource = payload?.source ?? payload?.data?.source;
    const safeSource = String(rawSource || '').trim().toLowerCase();
    if (safeSource) source = safeSource;
  } catch {}

  return { dbConnected, source };
};

// 获取课程详情（优先兼容 wu_pc 的 /api/course/:id 契约）
export const getCourseDetailById = async (id) => {
  const safeId = String(id || '').trim();

  try {
    const response = await api.get(`/course/${encodeURIComponent(safeId)}`, {
      params: { debug: 1 }
    });

    const record = response?.record ?? response?.data?.record ?? response?.data ?? response;
    if (record && (record?.fields || record?.record_id || response?.source)) {
      const detail = toCourseDetailFromWuRecord(record, safeId, response?.source);
      if (String(detail?.tutorId || '').trim()) return detail;

      try {
        const legacy = await requestDetailByLegacyContract(safeId);
        const legacyTutorId = String(legacy?.tutorId || '').trim();
        if (legacyTutorId) {
          return {
            ...detail,
            tutorId: legacyTutorId
          };
        }
      } catch {}

      return detail;
    }
    throw new Error('INVALID_WU_PC_DETAIL_PAYLOAD');
  } catch (wuError) {
    try {
      return await requestDetailByLegacyContract(safeId);
    } catch (legacyError) {
      console.warn('加载详情失败，回退本地 Mock:', legacyError?.message || legacyError);
      return buildCourseDetailFallback(safeId);
    }
  }
};

// 按 wu_pc 方式更新浏览量（PUT /api/course/:id）
export const increaseCourseViewCount = async (id, currentViews = 0) => {
  const safeId = String(id || '').trim();
  if (!safeId) return currentViews;

  const nextViews = Math.max(0, Math.floor(toNumberSafe(currentViews, 0))) + 1;

  try {
    await api.put(`/course/${encodeURIComponent(safeId)}`, {
      fields: { 浏览量: nextViews }
    });
    return nextViews;
  } catch {
    return currentViews;
  }
};

// 获取同导师其他课程（优先兼容 wu_pc 的列表格式）
export const getDetailOtherCourses = async (tutorId, currentCourseId) => {
  const tutorKey = String(tutorId || '').trim();
  const currentId = String(currentCourseId || '').trim();

  try {
    const payload = await requestCourseListByWuPcContract({ limit: 200 });
    const mapped = asArray(payload.items).map(toCourseListItemFromWuRecord);
    if (tutorKey && !mapped.some((item) => String(item?.tutorId || '').trim())) {
      throw new Error('WU_PC_LIST_NO_TUTOR_ID');
    }
    return mapped
      .filter((item) => String(item?.id || '') !== currentId)
      .filter((item) => {
        if (!tutorKey) return true;
        return String(item?.tutorId || '').trim() === tutorKey;
      })
      .slice(0, 20)
      .map((item) => ({
        id: String(item?.id ?? ''),
        title: item?.title || '',
        tags: asArray(item?.tags),
        image: item?.image || DEFAULT_COURSE_IMAGE
      }));
  } catch (wuError) {
    if (!tutorKey) return [];

    try {
      const response = await api.get(`/courses/teacher/${encodeURIComponent(tutorKey)}/projects`, {
        params: { exclude: currentId }
      });
      const data = assertApiOk(response, '加载导师其他课题失败');
      const list = asArray(data?.list ?? data?.data ?? data ?? []);

      return list.map((item) => ({
        id: String(item?.id ?? ''),
        title: item?.title || '',
        tags: [...asArray(item?.primary_subject), ...asArray(item?.secondary_subject)].filter(Boolean),
        image: getValidImageUrl(item?.pic_url, item?.poster_url)
      }));
    } catch (legacyError) {
      const fallback = asArray(detailOtherCourses)
        .filter((item) => String(item?.id || '') !== currentId)
        .map((item) => ({
          id: String(item?.id ?? ''),
          title: item?.title || '',
          tags: asArray(item?.tags),
          image: item?.image || DEFAULT_COURSE_IMAGE
        }));

      if (fallback.length) return fallback;
      console.warn('加载导师其他课题失败:', legacyError.message);
      return [];
    }
  }
};
