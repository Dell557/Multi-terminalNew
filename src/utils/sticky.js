import { ref, onMounted, onUnmounted } from 'vue'

export function useSticky(getEl, { headerHeight = 80, offset = 16 } = {}) {
  const isSticky = ref(false)
  const stickyOffsetTop = ref(0)

  const handleScroll = () => {
    const el = getEl && getEl()
    if (!el) return
    if (stickyOffsetTop.value === 0) stickyOffsetTop.value = el.offsetTop
    const targetTop = headerHeight + offset
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

  return { isSticky }
}
