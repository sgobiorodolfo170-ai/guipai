<script setup>
/**
 * 股票笔记详情/编辑/创建页。
 *
 * 路由：/notes/create（新建）、/notes/:id（查看）、/notes/:id?mode=edit（编辑）。
 * 克隆复用：view 模式点「复用此笔记」→ 写 sessionStorage noteClone → 跳新建页预填。
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoteStore } from '@/store/note.store'
import StockNoteEditor from '@/components/note/StockNoteEditor.vue'

const route = useRoute()
const router = useRouter()
const noteStore = useNoteStore()

const isCreate = computed(() => route.name === 'NoteCreate')
const noteId = computed(() => route.params.id)
const mode = computed(() => {
  if (isCreate.value) return 'create'
  return route.query.mode === 'edit' ? 'edit' : 'view'
})

const note = ref(null)
const prefill = ref(null)

const loadDetail = async () => {
  if (isCreate.value) {
    note.value = null
    const cloneRaw = sessionStorage.getItem('noteClone')
    if (cloneRaw) {
      try { prefill.value = JSON.parse(cloneRaw) } catch {}
      sessionStorage.removeItem('noteClone')
    }
    return
  }
  if (noteId.value) {
    try {
      await noteStore.fetchNoteDetail(noteId.value)
      note.value = noteStore.currentNote
      prefill.value = null
    } catch (e) { /* store/拦截器已提示 */ }
  }
}

onMounted(loadDetail)
// 路由参数变化（详情间切换）重新加载
watch(() => [route.name, route.params.id, route.query.mode], loadDetail)

const onSaved = ({ id, mode: smode }) => {
  if (smode === 'create' && id) router.push(`/notes/${id}`)
  else router.push('/notes')
}
const onCancel = () => router.back()
const onClone = (payload) => {
  sessionStorage.setItem('noteClone', JSON.stringify(payload))
  router.push('/notes/create')
}
</script>

<template>
  <div class="note-detail">
    <StockNoteEditor
      :mode="mode"
      :note="note"
      :note-id="noteId"
      :prefill="prefill"
      @saved="onSaved"
      @cancel="onCancel"
      @clone="onClone"
    />
  </div>
</template>

<style scoped>
.note-detail { padding: 20px; }
@media (max-width: 768px) { .note-detail { padding: 10px; } }
</style>
