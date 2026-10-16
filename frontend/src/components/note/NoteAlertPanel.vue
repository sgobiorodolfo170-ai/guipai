<script setup>
/**
 * NoteAlertPanel —— 笔记提醒管理。
 *
 * 提醒类型：price 价格阈值(高于/低于)、date 指定日期、repeat 重复定时(daily/weekly/monthly)。
 * 触发状态：pending 待触发 / triggered 已触发 / dismissed 忽略。
 * 通知由 useNotes 轮询统一处理；此组件仅做 CRUD 与状态展示。
 */
import { ref, computed } from 'vue'
import { useNoteStore } from '@/store/note.store'
import { ElMessage } from 'element-plus'

const props = defineProps({
  noteId: { type: [Number, String], default: null },
  alerts: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['refresh'])

const noteStore = useNoteStore()

const typeOptions = [
  { value: 'price', label: '价格阈值' }, { value: 'date', label: '指定日期' }, { value: 'repeat', label: '重复定时' }
]
const dirOptions = [{ value: 'above', label: '高于' }, { value: 'below', label: '低于' }]
const repeatTypeOptions = [{ value: 'daily', label: '每日' }, { value: 'weekly', label: '每周' }, { value: 'monthly', label: '每月' }]
const weekdayOptions = [{ value: 1, label: '一' }, { value: 2, label: '二' }, { value: 3, label: '三' }, { value: 4, label: '四' }, { value: 5, label: '五' }, { value: 6, label: '六' }, { value: 0, label: '日' }]

const emptyForm = () => ({
  alertType: 'price', targetPrice: null, direction: 'above',
  triggerDate: null, triggerTime: '09:30',
  repeatRule: { type: 'daily', weekdays: [] }, enabled: true
})
const form = ref(emptyForm())
const saving = ref(false)

const statusType = { pending: 'warning', triggered: 'success', dismissed: 'info' }
const statusLabel = { pending: '待触发', triggered: '已触发', dismissed: '已忽略' }

const canSave = computed(() => {
  if (props.noteId == null) return false
  if (form.value.alertType === 'price') return form.value.targetPrice != null && form.value.direction
  if (form.value.alertType === 'date') return form.value.triggerDate
  if (form.value.alertType === 'repeat') return form.value.triggerTime
  return false
})

const save = async () => {
  if (!canSave.value) { ElMessage.warning('请补全提醒参数'); return }
  try {
    saving.value = true
    const payload = { alertType: form.value.alertType, enabled: form.value.enabled }
    if (form.value.alertType === 'price') {
      payload.targetPrice = form.value.targetPrice
      payload.direction = form.value.direction
    } else if (form.value.alertType === 'date') {
      payload.triggerDate = form.value.triggerDate
      payload.triggerTime = form.value.triggerTime
    } else {
      payload.triggerTime = form.value.triggerTime
      payload.repeatRule = form.value.repeatRule
    }
    await noteStore.createAlert(props.noteId, payload)
    ElMessage.success('提醒已添加')
    form.value = emptyForm()
    emit('refresh')
  } catch (e) { ElMessage.error(e.message || '添加失败') }
  finally { saving.value = false }
}

const toggle = async (a) => {
  try { await noteStore.updateAlert(props.noteId, a.id, { enabled: !a.enabled }); emit('refresh') }
  catch (e) { ElMessage.error(e.message || '更新失败') }
}
const dismiss = async (a) => {
  try { await noteStore.updateAlert(props.noteId, a.id, { status: 'dismissed' }); emit('refresh') }
  catch (e) { ElMessage.error(e.message || '更新失败') }
}
const remove = async (a) => {
  try { await noteStore.deleteAlert(props.noteId, a.id); emit('refresh') }
  catch (e) { ElMessage.error(e.message || '删除失败') }
}

const alertDesc = (a) => {
  if (a.alertType === 'price') return `${a.direction === 'above' ? '高于' : '低于'} ¥${a.targetPrice}`
  if (a.alertType === 'date') return `${a.triggerDate || ''} ${a.triggerTime || ''}`
  const r = a.repeatRule || {}
  const t = { daily: '每日', weekly: '每周', monthly: '每月' }[r.type] || '定时'
  if (r.type === 'weekly' && Array.isArray(r.weekdays) && r.weekdays.length) {
    const ds = r.weekdays.map(w => weekdayOptions.find(o => o.value === w)?.label).filter(Boolean).join('周')
    return `${t}周${ds || ''} ${a.triggerTime || ''}`
  }
  return `${t} ${a.triggerTime || ''}`
}
</script>

<template>
  <div class="nap">
    <!-- 新建表单 -->
    <div v-if="!readonly && noteId != null" class="nap-form">
      <el-select v-model="form.alertType" placeholder="类型" style="width:120px">
        <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>

      <template v-if="form.alertType === 'price'">
        <el-select v-model="form.direction" style="width:90px">
          <el-option v-for="d in dirOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
        <el-input-number v-model="form.targetPrice" :min="0" :precision="4" :step="0.01" controls-position="right" placeholder="目标价" style="width:150px" />
      </template>

      <template v-else-if="form.alertType === 'date'">
        <el-date-picker v-model="form.triggerDate" type="date" value-format="YYYY-MM-DD" placeholder="触发日期" style="width:160px" />
        <el-time-picker v-model="form.triggerTime" value-format="HH:mm" format="HH:mm" placeholder="时间" style="width:120px" />
      </template>

      <template v-else>
        <el-select v-model="form.repeatRule.type" style="width:110px">
          <el-option v-for="r in repeatTypeOptions" :key="r.value" :label="r.label" :value="r.value" />
        </el-select>
        <el-time-picker v-model="form.triggerTime" value-format="HH:mm" format="HH:mm" placeholder="时间" style="width:120px" />
        <el-select v-if="form.repeatRule.type === 'weekly'" v-model="form.repeatRule.weekdays" multiple placeholder="周几(空=每天)" style="width:180px">
          <el-option v-for="w in weekdayOptions" :key="w.value" :label="w.label" :value="w.value" />
        </el-select>
      </template>

      <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
      <el-button type="primary" size="small" :loading="saving" :disabled="!canSave" @click="save">添加提醒</el-button>
    </div>

    <el-alert v-if="noteId == null && !readonly" type="info" :closable="false" title="保存笔记后才能添加提醒" />

    <!-- 提醒列表 -->
    <div class="nap-list">
      <div v-for="a in alerts" :key="a.id" class="nap-item">
        <el-tag :type="statusType[a.status] || 'info'" size="small">{{ statusLabel[a.status] || a.status }}</el-tag>
        <span class="nap-type">{{ typeOptions.find(t => t.value === a.alertType)?.label || a.alertType }}</span>
        <span class="nap-desc">{{ alertDesc(a) }}</span>
        <span v-if="a.lastTriggeredAt" class="nap-last">上次: {{ a.lastTriggeredAt }}</span>
        <div class="nap-ops" v-if="!readonly">
          <el-switch :model-value="a.enabled" size="small" @change="() => toggle(a)" />
          <el-button v-if="a.status === 'pending'" size="small" link @click="dismiss(a)">忽略</el-button>
          <el-button size="small" link type="danger" @click="remove(a)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="!alerts.length" :image-size="50" description="暂无提醒" />
    </div>
  </div>
</template>

<style scoped>
.nap { display: flex; flex-direction: column; gap: 12px; }
.nap-form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px; background: var(--el-fill-color-light); border-radius: 6px; }
.nap-list { display: flex; flex-direction: column; gap: 6px; }
.nap-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-bottom: 1px dashed var(--el-border-color-lighter); font-size: 13px; }
.nap-type { color: var(--el-text-color-secondary); min-width: 60px; }
.nap-desc { flex: 1; color: var(--el-text-color-primary); }
.nap-last { color: var(--el-text-color-placeholder); font-size: 12px; }
.nap-ops { display: flex; align-items: center; gap: 6px; }
</style>
