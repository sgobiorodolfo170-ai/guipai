<script setup>
/**
 * 数据总览 —— 一眼看清项目的数据资产分布。
 *
 * 设计：
 *   - 数据源 /api/data-mgmt/overview（一次请求返回 sql.js + DolphinDB 两库全况）
 *   - DolphinDB 未连接时不报错，显示提示 + 一键重连（复用 /api/data-pull/connect 的 force 重连）
 *   - 10 秒自动刷新关闭，改为手动刷新（总览是低频查看页，不需要轮询）
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const loading = ref(false)
const reconnecting = ref(false)
const data = ref(null)
const lastRefreshedAt = ref('')

const sqliteTables = computed(() => data.value?.sqlite?.tables || [])
const ddbTables = computed(() => data.value?.dolphindb?.tables || [])
const ddbConnected = computed(() => !!data.value?.dolphindb?.connected)

const sqliteTotalRows = computed(() => sqliteTables.value.reduce((s, t) => s + (t.rows || 0), 0))
const ddbTotalRows = computed(() => ddbTables.value.reduce((s, t) => s + (t.rows || 0), 0))

function fmtSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0, n = bytes
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

const fetchOverview = async () => {
  loading.value = true
  try {
    const res = await api.get('/data-mgmt/overview')
    data.value = res.data || null
    lastRefreshedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (e) {
    ElMessage.error('获取总览失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

const reconnectDdb = async () => {
  reconnecting.value = true
  try {
    const res = await api.post('/data-pull/connect')
    if (res.data?.connected) {
      ElMessage.success('DolphinDB 连接成功')
    } else {
      ElMessage.warning('连接未成功，请确认本机 DolphinDB 服务已启动（默认 ws://127.0.0.1:8848）')
    }
    await fetchOverview()
  } catch (e) {
    ElMessage.error('连接失败: ' + e.message)
  } finally {
    reconnecting.value = false
  }
}

onMounted(fetchOverview)
</script>

<template>
  <div class="data-overview" v-loading="loading">
    <!-- 存储总览卡片 -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>存储总览</span>
          <div>
            <el-button size="small" @click="fetchOverview">刷新</el-button>
            <el-button size="small" type="primary" :loading="reconnecting" @click="reconnectDdb">
              重连 DolphinDB
            </el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="sql.js（业务元数据）">
          {{ fmtSize(data?.sqlite?.fileSize) }} · {{ sqliteTotalRows }} 行
        </el-descriptions-item>
        <el-descriptions-item label="DolphinDB（时序行情）">
          <el-tag :type="ddbConnected ? 'success' : 'danger'" size="small">
            {{ ddbConnected ? '已连接' : '未连接' }}
          </el-tag>
          <span v-if="ddbConnected" style="margin-left: 6px">{{ ddbTotalRows }} 行</span>
        </el-descriptions-item>
        <el-descriptions-item label="DolphinDB 库">dfs://tradeinsight</el-descriptions-item>
        <el-descriptions-item label="上次刷新">{{ lastRefreshedAt || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="data && !ddbConnected"
        type="warning"
        :closable="false"
        class="mt-12"
        title="DolphinDB 未启动：K线/涨跌停池/板块/指数的持久化与统计功能不可用（行情实时展示不受影响，已自动走腾讯/同花顺/Tushare 兜底）。需要持久化时请启动本机 DolphinDB 后点「重连」。"
      />
    </el-card>

    <!-- sql.js 表 -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>业务数据库（sql.js · tradeinsight.db）</span>
          <span class="table-count">共 {{ sqliteTables.length }} 张表 / {{ sqliteTotalRows }} 行</span>
        </div>
      </template>
      <el-table :data="sqliteTables" size="small" border>
        <el-table-column prop="label" label="用途" min-width="160" />
        <el-table-column prop="name" label="表名" min-width="180" />
        <el-table-column label="行数" width="110" align="right">
          <template #default="{ row }">{{ row.rows?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.legacy" size="small" type="info">已迁移至 DolphinDB</el-tag>
            <el-tag v-else size="small" type="success">使用中</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- DolphinDB 表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>时序行情库（DolphinDB · dfs://tradeinsight）</span>
          <span class="table-count">共 {{ ddbTables.length }} 张表<template v-if="ddbConnected"> / {{ ddbTotalRows.toLocaleString() }} 行</template></span>
        </div>
      </template>
      <el-table :data="ddbTables" size="small" border>
        <el-table-column prop="label" label="用途" min-width="160" />
        <el-table-column prop="name" label="表名" min-width="180" />
        <el-table-column label="行数" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.rows === null || row.rows === undefined">-</span>
            <span v-else>{{ row.rows.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最新交易日" width="130">
          <template #default="{ row }">{{ row.latestDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="140">
          <template #default="{ row }">
            <span v-if="row.error" class="err-text">{{ row.error }}</span>
            <span v-else-if="!ddbConnected" class="dim-text">未连接</span>
            <span v-else class="dim-text">正常</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.data-overview { padding: 20px; }
.mb-16 { margin-bottom: 16px; }
.mt-12 { margin-top: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.table-count { color: #86909c; font-size: 13px; }
.err-text { color: #f56c6c; font-size: 12px; }
.dim-text { color: #86909c; font-size: 12px; }
</style>
