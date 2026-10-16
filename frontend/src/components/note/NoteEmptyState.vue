<script setup>
/**
 * NoteEmptyState —— 空数据/加载兜底。
 * loading=true 显示骨架屏；否则 empty 时显示 el-empty。
 */
defineProps({
  loading: { type: Boolean, default: false },
  empty: { type: Boolean, default: false },
  description: { type: String, default: '暂无笔记' },
  imageSize: { type: Number, default: 100 }
})
</script>

<template>
  <div class="nes">
    <el-skeleton v-if="loading" :rows="4" animated />
    <el-empty v-else-if="empty" :image-size="imageSize" :description="description">
      <slot />
    </el-empty>
    <template v-else><slot /></template>
  </div>
</template>

<style scoped>
.nes { padding: 24px 0; }
</style>
