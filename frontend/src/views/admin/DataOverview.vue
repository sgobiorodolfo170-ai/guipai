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
const sources = computed(() => data.value?.sources || [])

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
          <span class="table-count">共 {{ sqliteTables.length }} 张表 / {{ sqliteTotalRows }} 行 · 展开行查看字段定义</span>
        </div>
      </template>
      <el-table :data="sqliteTables" size="small" border>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div v-if="row.fields" class="field-block">
              <div class="field-title">字段定义（{{ row.fields.length }} 个）<span v-if="row.coverage" class="dim-text"> · 非空填充覆盖</span></div>
              <el-table :data="row.fields" size="small" border class="field-sub">
                <el-table-column prop="column" label="字段" width="180" />
                <el-table-column prop="label" label="含义" width="140" />
                <el-table-column label="说明" min-width="160">
                  <template #default="{ row: f }">
                    <span class="dim-text">{{ f.desc || '-' }}</span>
                    <span v-if="f.source" class="dim-text"> · {{ f.source }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="row.coverage" label="非空数" width="110" align="right">
                  <template #default="{ row: f }">
                    <span v-if="row.coverage[f.column] != null">{{ row.coverage[f.column]?.toLocaleString() }} / {{ row.rows?.toLocaleString() }}</span>
                    <span v-else class="dim-text">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <span v-else class="dim-text">该表未登记字段定义</span>
          </template>
        </el-table-column>
        <el-table-column prop="label" label="用途" min-width="160" />
        <el-table-column prop="name" label="表名" min-width="180" />
        <el-table-column label="行数" width="110" align="right">
          <template #default="{ row }">{{ row.rows?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="字段" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.fields" size="small" type="info">{{ row.fields.length }}</el-tag>
            <span v-else class="dim-text">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- DolphinDB 表 -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>时序行情库（DolphinDB · dfs://tradeinsight）</span>
          <span class="table-count">共 {{ ddbTables.length }} 张表<template v-if="ddbConnected"> / {{ ddbTotalRows.toLocaleString() }} 行</template></span>
        </div>
      </template>
      <el-table :data="ddbTables" size="small" border>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div v-if="row.fields" class="field-block">
              <div class="field-title">字段定义（{{ row.fields.length }} 个）</div>
              <el-table :data="row.fields" size="small" border class="field-sub">
                <el-table-column prop="column" label="字段" width="180" />
                <el-table-column prop="label" label="含义" width="140" />
                <el-table-column label="说明" min-width="160">
                  <template #default="{ row: f }">
                    <span class="dim-text">{{ f.desc || '-' }}</span>
                    <span v-if="f.source" class="dim-text"> · {{ f.source }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <span v-else class="dim-text">该表未登记字段定义</span>
          </template>
        </el-table-column>
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
        <el-table-column label="字段" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.fields" size="small" type="info">{{ row.fields.length }}</el-tag>
            <span v-else class="dim-text">-</span>
          </template>
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

    <!-- 数据源健康度（置于最末） -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>行情数据源（多源互补）</span>
          <span class="table-count">共 {{ sources.length }} 个源</span>
        </div>
      </template>
      <el-table :data="sources" size="small" border>
        <el-table-column prop="name" label="源" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.name === 'main' ? 'primary' : row.name === 'sina' ? 'success' : 'warning'">
              {{ row.name === 'main' ? '东财·腾讯·Tushare' : row.name === 'sina' ? '新浪' : row.name === 'netease' ? '网易' : row.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="!row.available ? 'info' : row.healthy ? 'success' : 'danger'">
              {{ !row.available ? '不可用' : row.healthy ? '正常' : `冷却${row.cooldownLeftSec}s` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="覆盖数据" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="c in row.capabilities" :key="c" size="small" class="cap-tag">{{ c }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成功/失败" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#67c23a">{{ row.ok }}</span> / <span style="color:#f56c6c">{{ row.fail }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最近错误" min-width="200">
          <template #default="{ row }">
            <span v-if="row.lastError" class="err-text">{{ row.lastError }}</span>
            <span v-else class="dim-text">-</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="dim-text" style="margin-top:8px;font-size:12px">
        主源(东财·腾讯·Tushare)未命中时自动切换新浪→网易；连续失败3次的源进入30s冷却。空结果不记失败（可能是真无数据）。
      </div>
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
.cap-tag { margin-right: 4px; }
.field-block { padding: 8px 12px; }
.field-title { font-size: 12px; color: #606266; margin-bottom: 6px; font-weight: 600; }
.field-sub { background: var(--el-fill-color-lighter); }
.field-sub :deep(.el-table__cell) { padding: 4px 0; }
</style>
