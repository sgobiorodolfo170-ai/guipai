<script setup>
/**
 * RichTextEditor —— 轻量自研富文本编辑器（contenteditable）。
 *
 * 设计理由：项目未安装富文本库，需求仅需标题/加粗/列表/引用等基础能力，
 * 用 contenteditable + document.execCommand 零依赖实现，契合原型阶段与依赖审查护栏。
 * execCommand 虽已标记 deprecated，但 Chromium/Electron 仍稳定支持，原型阶段可接受。
 *
 * 数据流：v-model 双向绑定 HTML 字符串；失焦时去 <script> 防 XSS（本地单用户，低风险仍做基础净化）。
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  placeholder: { type: String, default: '记录买卖逻辑、复盘总结与经验教训…' },
  height: { type: [String, Number], default: 360 }
})
const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let emitTimer = null

const setHtml = (html) => {
  if (editorRef.value && editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html || ''
  }
}

onMounted(() => setHtml(props.modelValue))

// 外部覆盖内部（如草稿恢复、详情回填）
watch(() => props.modelValue, (v) => {
  if (editorRef.value && editorRef.value.innerHTML !== v) setHtml(v)
})

const debounceEmit = () => {
  if (emitTimer) clearTimeout(emitTimer)
  emitTimer = setTimeout(() => {
    emit('update:modelValue', editorRef.value ? editorRef.value.innerHTML : '')
  }, 300)
}

const exec = (cmd, val) => {
  if (props.readonly) return
  editorRef.value?.focus()
  document.execCommand(cmd, false, val)
  debounceEmit()
}

// 失焦时净化：剥离 <script> 与事件属性（基础 XSS 防护）
const onBlur = () => {
  const el = editorRef.value
  if (!el) return
  el.querySelectorAll('script').forEach(n => n.remove())
  el.querySelectorAll('*').forEach(n => {
    ;[...n.attributes].forEach(a => {
      if (/^on/i.test(a.name)) n.removeAttribute(a.name)
    })
  })
  debounceEmit()
}

const buttons = [
  { cmd: 'formatBlock', val: '<h1>', label: 'H1', title: '标题1' },
  { cmd: 'formatBlock', val: '<h2>', label: 'H2', title: '标题2' },
  { cmd: 'bold', val: null, label: 'B', title: '加粗', style: 'font-weight:bold' },
  { cmd: 'insertUnorderedList', val: null, label: '• 列表', title: '无序列表' },
  { cmd: 'insertOrderedList', val: null, label: '1. 列表', title: '有序列表' },
  { cmd: 'formatBlock', val: '<blockquote>', label: '“ 引用', title: '引用' }
]

onBeforeUnmount(() => { if (emitTimer) clearTimeout(emitTimer) })
</script>

<template>
  <div class="rte" :class="{ readonly }">
    <div class="rte-toolbar" v-if="!readonly">
      <button v-for="b in buttons" :key="b.cmd + (b.val || '')" type="button"
        :title="b.title" :style="b.style || ''" @mousedown.prevent="exec(b.cmd, b.val)">{{ b.label }}</button>
    </div>
    <div ref="editorRef" class="rte-content" :contenteditable="!readonly"
      :data-placeholder="placeholder" :style="{ minHeight: (typeof height === 'number' ? height + 'px' : height) }"
      @input="debounceEmit" @blur="onBlur"></div>
  </div>
</template>

<style scoped>
.rte { border: 1px solid var(--el-border-color); border-radius: 6px; background: #fff; }
.rte-toolbar {
  display: flex; flex-wrap: wrap; gap: 4px;
  padding: 8px; border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}
.rte-toolbar button {
  min-width: 34px; height: 28px; padding: 0 8px;
  border: 1px solid var(--el-border-color-light); border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 13px; color: var(--el-text-color-regular);
}
.rte-toolbar button:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.rte-content {
  padding: 12px 16px; outline: none; font-size: 14px; line-height: 1.7;
  overflow-y: auto; color: var(--el-text-color-primary);
}
.rte-content :deep(h1) { font-size: 22px; margin: 12px 0 8px; }
.rte-content :deep(h2) { font-size: 18px; margin: 10px 0 6px; }
.rte-content :deep(blockquote) {
  margin: 8px 0; padding: 6px 12px; border-left: 3px solid var(--el-color-primary);
  background: var(--el-fill-color-light); color: var(--el-text-color-secondary);
}
.rte-content :deep(ul), .rte-content :deep(ol) { padding-left: 24px; margin: 6px 0; }
.rte-content:empty::before {
  content: attr(data-placeholder); color: var(--el-text-color-placeholder);
}
</style>
