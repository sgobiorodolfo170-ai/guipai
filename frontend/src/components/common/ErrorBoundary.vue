<script setup>
/**
 * ErrorBoundary —— 捕获子组件树渲染/生命周期/副作用错误，展示降级 UI。
 *
 * 设计理由：项目此前无任何错误边界与全局 errorHandler，任一视图在渲染中抛错
 * 会让 #app 渲染为空，叠加 Electron BrowserWindow 背景色 #0d1117（近黑），
 * 用户看到的就是「间歇性黑屏」（仅当某视图随数据状态抛错时才触发，故为间歇性）。
 * 用本组件包裹 router-view，把错误限制在当前路由子树，并给出可操作的兜底，
 * 同时把错误上报到主进程日志（renderer-error.log）便于定位根因。
 *
 * 机制：onErrorCaptured 捕获后代组件抛出的错误，return false 阻止继续上抛，
 * 避免冒泡到 app.config.errorHandler 后整树卸载。retry 时自增 reloadKey 强制
 * 重建 slot 子树，让出错组件以全新状态重新挂载。
 */
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton } from 'element-plus'

const err = ref(null)
const reloadKey = ref(0)
const router = useRouter()

onErrorCaptured((e, _instance, info) => {
  err.value = {
    message: e?.message || String(e),
    stack: e?.stack || '',
    info: info || ''
  }
  console.error('[ErrorBoundary] 捕获渲染错误:', e, '| info:', info)
  // 上报到主进程持久化日志（非 Electron 环境下 window.tradeinsight 不存在，静默跳过）
  try {
    const w = window
    if (w.tradeinsight && typeof w.tradeinsight.logError === 'function') {
      w.tradeinsight.logError({
        type: 'render',
        message: e?.message || String(e),
        stack: e?.stack,
        info,
        time: new Date().toISOString(),
        href: location.href
      })
    }
  } catch (_) { /* 上报失败不影响兜底渲染 */ }
  return false // 阻止错误继续上抛，保留降级 UI
})

const retry = () => {
  err.value = null
  reloadKey.value++ // 强制 slot 子树重建
}

const goHome = () => {
  err.value = null
  reloadKey.value++
  router.push('/')
}
</script>

<template>
  <div v-if="err" class="eb-fallback">
    <div class="eb-card">
      <h2>该页面渲染出错</h2>
      <p class="eb-msg">{{ err.message }}</p>
      <p v-if="err.info" class="eb-info">触发位置：{{ err.info }}</p>
      <details>
        <summary>查看堆栈</summary>
        <pre>{{ err.stack }}</pre>
      </details>
      <div class="eb-actions">
        <ElButton type="primary" @click="retry">重试渲染</ElButton>
        <ElButton @click="goHome">返回首页</ElButton>
      </div>
    </div>
  </div>
  <div v-else :key="reloadKey" class="eb-slot-wrap">
    <slot />
  </div>
</template>

<style scoped>
.eb-fallback {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 20px;
}

.eb-card {
  max-width: 640px;
  width: 100%;
  background: #fff;
  border: 1px solid #f56c6c;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.eb-card h2 {
  margin: 0 0 12px;
  color: #f56c6c;
  font-size: 18px;
}

.eb-msg {
  font-family: 'Courier New', monospace;
  color: #303133;
  word-break: break-all;
  margin: 0 0 8px;
}

.eb-info {
  color: #909399;
  font-size: 13px;
  margin: 0 0 12px;
}

.eb-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

pre {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 240px;
  overflow: auto;
  background: #fafafa;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
