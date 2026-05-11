import { ref, onMounted, onUnmounted } from 'vue'

export function useSticky(getEl, getAboveEl, { headerHeight = 80, offset = 16 } = {}) {
  const isSticky = ref(false)
  const stickyOffsetTop = ref(0)
  const stickyTop = ref(headerHeight + offset)

  const handleScroll = () => {
    const el = getEl && getEl()
    if (!el) return
    
    if (stickyOffsetTop.value === 0) stickyOffsetTop.value = el.offsetTop
    
    // 动态计算上面卡片的底部位置
    const aboveEl = getAboveEl && getAboveEl()
    if (aboveEl) {
      const aboveRect = aboveEl.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const aboveBottom = aboveRect.bottom + scrollTop
      stickyTop.value = Math.max(headerHeight + offset, aboveBottom - scrollTop + offset)
    }
    
    const targetTop = stickyTop.value
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    isSticky.value = scrollTop + targetTop >= stickyOffsetTop.value
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    handleScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return { isSticky, stickyTop }
}
