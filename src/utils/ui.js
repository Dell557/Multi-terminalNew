import { ref } from 'vue'
export function scrollToTop(smooth = true) {
  try {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  } catch {}
}

export function getHeroImageSrc(item, defaultSrc) {
  if (!item) return defaultSrc || null
  return item.headImg || item.img || defaultSrc || null
}

export function openInNewTab(url) {
  if (!url) return
  try {
    window.open(url, '_blank')
  } catch {}
}

export function useDarkMode() {
  const isDarkMode = window.__darkModeRef || null
  let refObj = isDarkMode
  if (!refObj) {
    refObj = ref(false)
    window.__darkModeRef = refObj
  }
  const toggleDarkMode = () => {
    refObj.value = !refObj.value
  }
  return { isDarkMode: refObj, toggleDarkMode }
}

// 图片错误处理工具
export function handleImageError(event, fallbackSrc = '') {
  if (fallbackSrc && event.target.src !== fallbackSrc) {
    event.target.src = fallbackSrc
  }
  // 如果没有 fallback 图片，隐藏图片或显示占位符
  event.target.style.display = 'none'
}

// 预加载图片
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'))
      return
    }
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

// 检查图片是否可用
export async function checkImageAvailable(url, timeout = 5000) {
  if (!url) return false
  try {
    await Promise.race([
      preloadImage(url),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ])
    return true
  } catch {
    return false
  }
}
