import { ref, computed } from 'vue'

export function useSubjectFilters(subjectData) {
  const selectedPrimary = ref('')
  const selectedSecondary = ref('')
  const selectedMentorType = ref('全部')
  const mentorTypes = ['全部', '教授', '博士']

  const secondaryToPrimaryMap = computed(() => {
    const m = new Map()
    const list = subjectData.value || []
    list.forEach(({ name, children }) => {
      ;(children || []).forEach(c => m.set(c, name))
    })
    return m
  })

  const allSecondary = computed(() => {
    const list = subjectData.value || []
    return Array.from(new Set(list.flatMap(item => item.children || [])))
  })

  const currentSecondaryList = computed(() => {
    if (!selectedPrimary.value) return allSecondary.value
    const target = (subjectData.value || []).find(item => item.name === selectedPrimary.value)
    return target ? target.children || [] : []
  })

  const SECONDARY_LIMIT = 10
  const expandedSecondary = ref(false)

  function onPrimaryAllClick() {
    selectedPrimary.value = ''
    selectedSecondary.value = ''
  }
  function onPrimaryClick(name) {
    selectedPrimary.value = name
    selectedSecondary.value = ''
    expandedSecondary.value = false
  }
  function onSecondaryAllClick() {
    selectedSecondary.value = ''
  }
  function onSecondaryClick(name) {
    selectedSecondary.value = name
  }
  function toggleSecondaryExpand() {
    expandedSecondary.value = !expandedSecondary.value
  }
  function onMentorTypeClick(type) {
    selectedMentorType.value = type
  }

  const activeFilters = computed(() => {
    const filters = []
    if (selectedPrimary.value || selectedSecondary.value) {
      let primaryLabel = selectedPrimary.value
      if (!primaryLabel && selectedSecondary.value) {
        const map = secondaryToPrimaryMap.value
        const match = map && map.get ? map.get(selectedSecondary.value) : null
        if (match) primaryLabel = match
      }
      let label = ''
      if (primaryLabel && selectedSecondary.value) label = `${primaryLabel}-${selectedSecondary.value}`
      else if (primaryLabel) label = primaryLabel
      else if (selectedSecondary.value) label = selectedSecondary.value
      filters.push({ type: 'subject', label, value: label })
    }
    if (selectedMentorType.value !== '全部') {
      filters.push({ type: 'mentor', label: selectedMentorType.value, value: selectedMentorType.value })
    }
    return filters
  })

  function removeFilter(filter) {
    if (filter.type === 'subject') {
      selectedPrimary.value = ''
      selectedSecondary.value = ''
    } else if (filter.type === 'mentor') {
      selectedMentorType.value = '全部'
    }
  }

  return {
    selectedPrimary,
    selectedSecondary,
    selectedMentorType,
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
  }
}
