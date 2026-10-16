<script setup>
/**
 * WatchlistGroupPicker —— 加入自选时的「选择分组」弹窗
 *
 * 设计理由：加入自选原为直入默认分组、无从选择，需先选分组才能把股票归到自选股页对应选项卡。
 * 复用 watchlistStore 的分组数据（打开时若为空则懒加载），单选分组 + 确认即可。
 * 仅做选择，不含内联新建（新建分组仍在自选股页操作）。
 */
import { ref, watch } from 'vue'
import { useWatchlistStore } from '@/store/watchlist.store'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const watchlistStore = useWatchlistStore()
const loading = ref(false)
const selected = ref(0)

// 选项 = 默认分组(id=0) + 各自定义分组
const options = [
  { id: 0, name: '默认分组' },
  ...watchlistStore.groups
]

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    if (watchlistStore.groups.length === 0) {
      loading.value = true
      try { await watchlistStore.fetchWatchlistGroups() } catch (_) {}
      finally { loading.value = false }
    }
    // 默认选中第一个分组；无分组时入默认分组
    selected.value = watchlistStore.groups.length > 0 ? watchlistStore.groups[0].id : 0
  }
)

const close = () => emit('update:modelValue', false)

const confirm = () => {
  emit('confirm', selected.value)
  close()
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="选择分组"
    width="420px"
    append-to-body
    @update:model-value="close"
    @close="close"
  >
    <div v-loading="loading" class="wgp-body">
      <el-radio-group v-model="selected" class="wgp-list">
        <el-radio
          v-for="g in options"
          :key="g.id"
          :value="g.id"
          class="wgp-item"
        >
          {{ g.name }}
        </el-radio>
      </el-radio-group>
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="confirm">确定加入</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.wgp-body {
  min-height: 80px;
}

.wgp-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wgp-item {
  height: auto;
  margin-right: 0;
}
</style>
