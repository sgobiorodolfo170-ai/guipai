<script setup>
/**
 * StockNoteEditor —— 股票笔记编辑器主容器。
 *
 * 组装：标题 + TradeFieldsPanel(结构化字段) + KlineNoteBlock[](K线块) +
 *   RichTextEditor(富文本) + NoteAlertPanel(提醒)。
 *
 * 草稿自动保存：create/edit 模式下，表单深度 watch（防抖 1s）→ localStorage；
 *   create 模式挂载时恢复未提交草稿；保存成功后清除草稿。
 * 模板一键复用：view 模式「复用此笔记」克隆表单（去 id）→ 父级打开新建。
 * 导出：view 模式调用 useNotes.exportNote(noteId)。
 */
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useNotes } from '@/composables/useNotes'
import TradeFieldsPanel from './TradeFieldsPanel.vue'
import KlineNoteBlock from './KlineNoteBlock.vue'
import RichTextEditor from './RichTextEditor.vue'
import NoteAlertPanel from './NoteAlertPanel.vue'

const props = defineProps({
  mode: { type: String, default: 'create' }, // create | edit | view
  note: { type: Object, default: () => ({}) },
  noteId: { type: [Number, String], default: null },
  prefill: { type: Object, default: () => null } // 克隆复用时的预填数据
})
const emit = defineEmits(['saved', 'cancel', 'clone'])

const {
  createNote, updateNote, saveDraft, restoreDraft, clearDraft, exportNote
} = useNotes()

const readonly = computed(() => props.mode === 'view')
const isCreate = computed(() => props.mode === 'create')
const modeTitle = computed(() => ({ create: '创建笔记', edit: '编辑笔记', view: '笔记详情' })[props.mode] || '笔记')

const emptyForm = () => ({
  title: '', stockCode: '', stockName: '', direction: 'buy',
  tradePrice: null, quantity: null, fee: 0, tradeDate: '',
  holdingStatus: 'open', content: '', klineBlocks: [], tags: [], isPublic: false
})

const form = ref(emptyForm())
const saving = ref(false)
const draftKey = computed(() => isCreate.value ? 'new' : String(props.noteId || ''))

onMounted(() => {
  if (isCreate.value) {
    const draft = restoreDraft(draftKey.value)
    if (draft) { form.value = { ...emptyForm(), ...draft }; ElMessage.info('已恢复未提交草稿') }
    else if (props.prefill) { form.value = { ...emptyForm(), ...props.prefill } }
  } else if (props.note && props.note.id) {
    form.value = { ...emptyForm(), ...props.note }
  }
})

// 草稿自动保存（防抖 1s），仅 create/edit
let draftTimer = null
watch(form, () => {
  if (readonly.value) return
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => saveDraft(draftKey.value, form.value), 1000)
}, { deep: true })

const alerts = ref(props.note?.alerts || [])
const refreshAlerts = async () => {
  // 由父级传入最新 currentNote.alerts；这里同步即可
  alerts.value = props.note?.alerts || []
}
watch(() => props.note, (n) => {
  if (!isCreate.value && n) { form.value = { ...emptyForm(), ...n }; alerts.value = n.alerts || [] }
}, { deep: true })

// K线块操作
const addKlineBlock = () => {
  form.value.klineBlocks = [...(form.value.klineBlocks || []), { code: '', period: 'daily', startDate: '', endDate: '', imageBase64: null }]
}
const updateBlock = (i, blk) => { form.value.klineBlocks[i] = blk }
const removeBlock = (i) => { form.value.klineBlocks.splice(i, 1) }

const validate = () => {
  if (!form.value.title?.trim()) { ElMessage.warning('请输入标题'); return false }
  return true
}

const handleSave = async () => {
  if (!validate()) return
  try {
    saving.value = true
    const payload = { ...form.value }
    if (isCreate.value) {
      const res = await createNote(payload)
      clearDraft(draftKey.value)
      emit('saved', { id: res.data?.id, mode: 'create' })
    } else {
      await updateNote(props.noteId, payload)
      clearDraft(draftKey.value)
      emit('saved', { id: props.noteId, mode: 'edit' })
    }
  } catch (e) { /* useNotes 已提示 */ }
  finally { saving.value = false }
}

const handleClone = () => {
  // 深拷贝避免共享 klineBlocks/tags 引用改到源笔记
  const clone = JSON.parse(JSON.stringify(form.value))
  delete clone.id
  delete clone.createdAt
  delete clone.updatedAt
  emit('clone', clone)
}

const handleExport = (fmt) => exportNote(props.noteId, fmt)
</script>

<template>
  <div class="sne">
    <!-- 标题行：页面标题 + 操作按钮 -->
    <div class="sne-header">
      <h1 class="sne-h1">{{ modeTitle }}</h1>
      <div class="sne-actions">
        <template v-if="readonly">
          <el-button @click="emit('cancel')">返回列表</el-button>
          <el-button @click="handleClone">复用此笔记</el-button>
          <el-dropdown @command="handleExport">
            <el-button>导出<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="html">导出 HTML</el-dropdown-item>
                <el-dropdown-item command="md">导出 Markdown</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button @click="emit('cancel')">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">保存笔记</el-button>
        </template>
      </div>
    </div>

    <div class="sne-body">
      <!-- 左区：K线图 + 跟踪提醒 + 元信息 -->
      <div class="sne-left">
        <!-- K线块 -->
        <el-card shadow="never" class="sne-card">
          <template #header>
            <div class="sne-card-header">
              <span>K线图</span>
              <el-button v-if="!readonly" size="small" type="primary" @click="addKlineBlock">插入K线</el-button>
            </div>
          </template>
          <KlineNoteBlock v-for="(b, i) in form.klineBlocks" :key="i" :block="b" :readonly="readonly"
            @update="blk => updateBlock(i, blk)" @remove="() => removeBlock(i)" />
          <el-empty v-if="!form.klineBlocks.length" :image-size="60" description="点击「插入K线」按代码+区间嵌入行情图" />
        </el-card>

        <!-- 提醒 -->
        <el-card shadow="never" class="sne-card">
          <template #header><span>跟踪提醒</span></template>
          <NoteAlertPanel :note-id="readonly ? noteId : (isCreate ? null : noteId)" :alerts="alerts" :readonly="readonly" @refresh="refreshAlerts" />
        </el-card>

        <!-- 元信息（仅非创建模式） -->
        <el-card shadow="never" v-if="!isCreate && note">
          <template #header><span>元信息</span></template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="创建时间">{{ note.createdAt || '-' }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ note.updatedAt || '-' }}</el-descriptions-item>
            <el-descriptions-item label="成本">{{ note.cost ?? '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <!-- 右区：标题 + 交易记录 + 复盘内容 -->
      <div class="sne-right">
        <!-- 标题 -->
        <el-input v-model="form.title" :disabled="readonly" placeholder="笔记标题（如：贵州茅台 2026Q3 加仓复盘）" size="large" class="sne-title" />

        <!-- 结构化交易字段 -->
        <el-card shadow="never" class="sne-card">
          <template #header><span>交易记录</span></template>
          <TradeFieldsPanel v-model="form" :readonly="readonly" />
        </el-card>

        <!-- 富文本 -->
        <el-card shadow="never" class="sne-card">
          <template #header><span>复盘内容</span></template>
          <RichTextEditor v-model="form.content" :readonly="readonly" :height="420" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sne { display: flex; flex-direction: column; gap: 16px; }
.sne-header { display: flex; justify-content: space-between; align-items: center; }
.sne-h1 { margin: 0; font-size: 22px; font-weight: 600; }
.sne-actions { display: flex; gap: 10px; align-items: center; }
.sne-body { display: flex; gap: 20px; align-items: flex-start; }
.sne-left { flex: 0 0 40%; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.sne-right { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.sne-title :deep(.el-input__inner) { font-size: 20px; font-weight: 600; }
.sne-card-header { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 1024px) {
  .sne-body { flex-direction: column; }
  .sne-left, .sne-right { flex: 1 1 auto; width: 100%; }
}
</style>
