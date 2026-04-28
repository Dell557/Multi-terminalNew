// 课程可见性过滤工具

// 检查课程是否可见
export function isVisibleCourse(course) {
  // 如果课程没有 is_hidden 字段，默认可见
  if (course === undefined || course === null) {
    return false
  }
  
  // 0 表示可以正常搜索，1 表示仅链接访问
  const isHidden = course.is_hidden || 0
  return isHidden === 0
}

// 过滤可见课程
export function filterVisibleCourses(courses) {
  if (!Array.isArray(courses)) {
    return []
  }
  return courses.filter(isVisibleCourse)
}
