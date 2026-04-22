<template>
  <div class="feishu-page">
    <van-nav-bar
      :title="isDocMode ? '飞书文档' : '飞书知识库'"
      left-arrow
      @click-left="onBack"
      :border="false"
      class="feishu-nav"
    />

    <div v-if="!isDocMode" class="search-wrap">
      <van-search
        v-model="keyword"
        placeholder="搜索飞书文档标题/关键词"
        shape="round"
        class="search"
        @search="onSearch"
        @update:model-value="onKeywordChange"
      />

      <div v-if="searchLoading" class="status">
        <van-loading size="20px" />
        <span class="status-text">正在搜索...</span>
      </div>

      <div v-else-if="searchError" class="status error">
        <span class="status-text">{{ searchError }}</span>
      </div>

      <van-cell-group v-if="docs.length" inset class="list">
        <van-cell
          v-for="item in docs"
          :key="item.doc_id"
          :title="item.title || '未命名文档'"
          is-link
          @click="openDoc(item)"
        />
      </van-cell-group>

      <div v-else-if="searched && !searchLoading" class="empty">
        <div class="empty-title">暂无结果</div>
        <div class="empty-desc">换个关键词试试</div>
      </div>
    </div>

    <div v-else class="doc-wrap">
      <div v-if="docLoading" class="status">
        <van-loading size="20px" />
        <span class="status-text">正在加载文档...</span>
      </div>

      <div v-else-if="docError" class="status error">
        <span class="status-text">{{ docError }}</span>
      </div>

      <div v-else class="doc">
        <div class="doc-title">{{ docTitle }}</div>
        <pre class="doc-content">{{ docMarkdown }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchFeishuDoc, searchFeishuDocs } from '../services/feishu'
import { ROUTE_NAMES } from '../router/routes'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const searched = ref(false)
const searchLoading = ref(false)
const searchError = ref('')
const docs = ref([])

const docLoading = ref(false)
const docError = ref('')
const docTitle = ref('')
const docMarkdown = ref('')

const isDocMode = computed(() => Boolean(route.params.docId))

const normalizeDocs = (payload) => {
  const list =
    payload?.docs ||
    payload?.documents ||
    payload?.items ||
    payload?.results ||
    (Array.isArray(payload) ? payload : null)
  if (!Array.isArray(list)) return []
  return list
    .map((x) => ({
      doc_id: x?.doc_id || x?.docId || x?.id || x?.token || x?.doc_token,
      title: x?.title || x?.name || x?.doc_title || '',
      doc_url: x?.doc_url || x?.url || '',
    }))
    .filter((x) => x.doc_id)
}

const onBack = () => {
  if (isDocMode.value) {
    router.push({ name: ROUTE_NAMES.FEISHU_SEARCH })
    return
  }
  router.back()
}

const onSearch = async () => {
  const q = String(keyword.value || '').trim()
  if (!q) {
    docs.value = []
    searched.value = false
    searchError.value = ''
    return
  }

  searched.value = true
  searchLoading.value = true
  searchError.value = ''
  try {
    const result = await searchFeishuDocs(q, 0)
    docs.value = normalizeDocs(result)
  } catch (e) {
    docs.value = []
    searchError.value = e?.message || '搜索失败'
  } finally {
    searchLoading.value = false
  }
}

const onKeywordChange = () => {
  if (!keyword.value) {
    searched.value = false
    docs.value = []
    searchError.value = ''
  }
}

const openDoc = (item) => {
  router.push({ name: ROUTE_NAMES.FEISHU_DOC, params: { docId: item.doc_id } })
}

const loadDoc = async (docId) => {
  docLoading.value = true
  docError.value = ''
  docTitle.value = ''
  docMarkdown.value = ''
  try {
    const result = await fetchFeishuDoc(docId)
    docTitle.value = result?.title || '飞书文档'
    docMarkdown.value = result?.markdown || ''
  } catch (e) {
    docError.value = e?.message || '加载失败'
  } finally {
    docLoading.value = false
  }
}

watch(
  () => route.params.docId,
  (docId) => {
    if (docId) loadDoc(docId)
  },
  { immediate: true }
)

onMounted(() => {
  if (!isDocMode.value) onSearch()
})
</script>

<style scoped>
.feishu-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.feishu-nav {
  --van-nav-bar-background: var(--bg-page);
  --van-nav-bar-title-text-color: var(--color-neutral-900);
  --van-nav-bar-icon-color: var(--color-neutral-900);
}

.search-wrap {
  padding: 12px var(--space-lg);
}

.search {
  padding: 0;
}

.list {
  margin-top: 12px;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 4px;
  color: var(--color-neutral-600);
}

.status.error {
  color: var(--color-red-600, #e54d42);
}

.status-text {
  font-size: 13px;
  line-height: 1.4;
}

.empty {
  padding: 40px 0;
  text-align: center;
  color: var(--color-neutral-500);
}

.empty-title {
  font-size: 14px;
  color: var(--color-neutral-700);
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 12px;
}

.doc-wrap {
  padding: 12px var(--space-lg) 24px;
}

.doc {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 14px 14px 16px;
}

.doc-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-neutral-900);
  line-height: 1.4;
  margin-bottom: 10px;
}

.doc-content {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-neutral-800);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
