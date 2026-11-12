<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import api from '@/utils/api'

const route = useRoute()

const showLayout = computed(() => !route.meta.hideLayout)

/**
 * DolphinDB 不可用时的全局降级提示。
 *
 * 为什么放在这里而不是各业务页：DDB 是日K/复盘/板块/驾驶舱行情等一批页面的共同数据源，
 * 它挂掉时这些页面会「静默空数据」——用户看到的是空表而不是"数据源断了"，
 * 于是把环境问题误判成功能 bug。评估报告 P1-6 指的就是这个。
 * 统一在布局层提示一次，各页不必各自实现，也不会重复弹窗。
 *
 * 探测复用 /api/data-mgmt/overview 已有的 connected 字段（无新增后端接口）。
 * 60s 轮询：DDB 冷启动要 60s，太频繁只会刷屏；用 unref 定时器避免测试环境挂起。
 */
const ddbDown = ref(false)
let timer = null

const probeDdb = async () => {
  try {
    const res = await api.get('/data-mgmt/overview')
    const connected = !!res?.data?.dolphindb?.connected
    ddbDown.value = !connected
  } catch (_) {
    // 探测本身失败（例如本地服务未起）不当作 DDB 故障——
    // 那种情况各页的请求错误提示已经更准确，这里再报会叠加噪音。
  }
}

const dismissDdbBanner = () => { ddbDown.value = false }

onMounted(() => {
  probeDdb()
  timer = setInterval(probeDdb, 60000)
})

onBeforeUnmount(() => {
  if (timer) { clearInterval(timer); timer = null }
})
</script>

<template>
  <div id="app">
    <div v-if="showLayout" class="app-layout">
      <AppHeader />
      <!-- DDB 不可用：明确告知"哪些能力受限"，而不是让页面静默空着 -->
      <div v-if="ddbDown" class="ddb-banner">
        <span class="ddb-banner__text">
          历史行情库（DolphinDB）未连接：日K、复盘、板块、驾驶舱行情等依赖库内数据的页面可能显示为空。
          实时报价与自选股、笔记、交易流水不受影响。
        </span>
        <el-button link type="primary" size="small" @click="probeDdb">重新检测</el-button>
        <el-button link size="small" @click="dismissDdbBanner">知道了</el-button>
      </div>
      <div class="app-body">
        <AppSidebar />
        <main class="app-main">
          <ErrorBoundary><router-view /></ErrorBoundary>
        </main>
      </div>
      <AppFooter />
    </div>

    <div v-else class="no-layout">
      <ErrorBoundary><router-view /></ErrorBoundary>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.ddb-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--el-color-warning-light-9);
  border-bottom: 1px solid var(--el-color-warning-light-5);
  color: var(--el-color-warning-dark-2);
  font-size: 13px;
  line-height: 1.5;
}

.ddb-banner__text {
  flex: 1;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

.no-layout {
  height: 100vh;
}
</style>
