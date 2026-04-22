/**
 * 课程可见性过滤工具
 * 
 * 功能：根据 is_hidden 字段过滤课程
 * - is_hidden = 0: 正常显示，可搜索
 * - is_hidden = 1: 仅链接访问，不可搜索
 * 
 * 使用方式：
 *   import { filterVisibleCourses, isVisibleCourse } from '@/utils/visibility-filter'
 * 
 * 移除方式：
 *   直接删除此文件，并移除所有引用即可
 */

/**
 * 检查单个课程是否可见（用于搜索）
 * @param {Object} course - 课程对象
 * @returns {boolean} - 是否可见（可搜索）
 */
export const isVisibleCourse = (course) => {
  // 如果没有 is_hidden 字段，默认可见
  if (course?.is_hidden === undefined || course?.is_hidden === null) {
    return true
  }
  
  // is_hidden = 0 表示可见，1 表示隐藏
  const num = Number(course.is_hidden)
  return num === 0
}

/**
 * 过滤课程列表，只返回可见的课程（用于搜索）
 * @param {Array} courses - 课程列表
 * @returns {Array} - 过滤后的课程列表
 */
export const filterVisibleCourses = (courses) => {
  if (!Array.isArray(courses)) {
    return []
  }
  
  return courses.filter(course => isVisibleCourse(course))
}

/**
 * 获取课程的访问类型标签
 * @param {Object} course - 课程对象
 * @returns {string} - 'public' (公开) 或 'private' (仅链接)
 */
export const getCourseAccessType = (course) => {
  return isVisibleCourse(course) ? 'public' : 'private'
}

/**
 * 统计课程数量（区分可见/隐藏）
 * @param {Array} courses - 课程列表
 * @returns {Object} - { total, visible, hidden }
 */
export const countCourses = (courses) => {
  if (!Array.isArray(courses)) {
    return { total: 0, visible: 0, hidden: 0 }
  }
  
  const total = courses.length
  const visible = courses.filter(c => isVisibleCourse(c)).length
  const hidden = total - visible
  
  return { total, visible, hidden }
}
