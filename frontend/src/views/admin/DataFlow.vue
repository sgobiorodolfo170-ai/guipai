<script setup>
/**
 * 数据流转 —— 外部取数与导入的旁路审计页。
 *
 * 数据来自 /api/data-flow：
 *   - /logs 分页明细（参数、多源尝试、错误、导入明细）
 *   - /stats 聚合（成功率、来源分布、容量）
 *
 * 只记录外部取数/导入；纯 DB 查询、进程内缓存、健康探针不落日志。
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const TYPE_LABELS = {
  kline: 'K线',
  spot: '实时行情',
  minute: '分时/分钟K',
  indexDaily: '指数日K',
  indexSpot: '指数实时',
  limitPool: '涨停池',
  dropPool: '跌停池',
  ztPrev: '昨日涨停',
  industry: '行业板块',
  info: '个股信息',
  holding: '十大股东',
  financial: '财报(离线导入)',
  indicator: '估值指标(已下线)',
  stockMeta: '股票元数据',
  boardList: '板块列表(已下线)',
  boardCons: '板块成分(已下线)',
  packageDaily: '每日数据包',
  packageFull: '全量数据包',
  packageIndex: '指数数据包',
  packageFinancial: '财报数据包',
  akshare: 'AKShare(已退役)',
  moneyFlow: '资金流',
  tdx_sector: '通达信板块',
  tdx_pool: '通达信涨跌停'
}

const RANGE_OPTIONS = [
  { value: 1, label: '近 1 小时' },
  { value: 6, label: '近 6 小时' },
  { value: 24, label: '近 24 小时' },
  { value: 168, label: '近 7 天' },
  { value: 720, label: '近 30 天' },
  { value: 0, label: '全部时间' }
]

const STATUS_OPTIONS = [
  { value: 'success', label: '成功' },
  { value: 'empty', label: '空结果' },
  { value: 'fail', label: '失败' }
]

const loading = ref(false)
const statsLoading = ref(false)
const rows = ref([])
const total = ref(0)
const stats = ref(null)
const page = ref(1)
const pageSize = ref(50)
const rangeHours = ref(24)
const dataType = ref('')
const source = ref('')
const status = ref('')
const keyword = ref('')
const autoRefresh = ref(false)

let timer = null

const rangeLabel = computed(() => RANGE_OPTIONS.find(o => o.value === rangeHours.value)?.label || '近 24 小时')
const sourceOptions = computed(() => (stats.value?.by_source || []).map(s => s.source_label).filter(Boolean))
const typeOptions = computed(() => {
  const list = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
  const known = new Set(list.map(i => i.value))
  for (const item of stats.value?.by_type || []) {
    if (item.data_type && !known.has(item.data_type)) list.push({ value: item.data_type, label: item.data_type })
  }
  return list
})
const capacityPercent = computed(() => {
  const cap = stats.value?.capacity
  if (!cap || !cap.max) return 0
  return Math.min(100, Math.round((cap.used / cap.max) * 100))
})

function typeLabel(value) {
  return TYPE_LABELS[value] || value || '-'
}

function statusLabel(value) {
  return STATUS_OPTIONS.find(o => o.value === value)?.label || value || '-'
}

function statusType(value) {
  if (value === 'success') return 'success'
  if (value === 'fail') return 'danger'
  return 'info'
}

function fmtTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('zh-CN', { hour12: false })
}

function fmtDuration(ms) {
  const n = Number(ms) || 0
  if (n >= 60000) return `${(n / 60000).toFixed(1)} 分`
  if (n >= 1000) return `${(n / 1000).toFixed(2)} 秒`
  return `${n} ms`
}

function fmtNum(value) {
  return (Number(value) || 0).toLocaleString()
}

function parseJson(value) {
  if (value == null || value === '') return null
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch { return value }
}

function pretty(value) {
  const parsed = parseJson(value)
  if (parsed == null || parsed === '') return '-'
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
}

function attempts(row) {
  const parsed = parseJson(row.attempts)
  return Array.isArray(parsed) ? parsed : []
}

function paramsSummary(row) {
  const parsed = parseJson(row.params)
  if (parsed == null || parsed === '') return '-'
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
}

async function fetchLogs(silent = false) {
  if (!silent) loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, hours: rangeHours.value }
    if (dataType.value) params.dataType = dataType.value
    if (source.value) params.source = source.value
    if (status.value) params.status = status.value
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await api.get('/data-flow/logs', { params })
    rows.value = res.data?.rows || []
    total.value = res.data?.total || 0
  } catch (e) {
    if (!silent) ElMessage.error('获取数据流转日志失败: ' + e.message)
  } finally {
    if (!silent) loading.value = false
  }
}

async function fetchStats(silent = false) {
  if (!silent) statsLoading.value = true
  try {
    const res = await api.get('/data-flow/stats', { params: { hours: rangeHours.value } })
    stats.value = res.data || null
  } catch (e) {
    if (!silent) ElMessage.error('获取统计失败: ' + e.message)
  } finally {
    if (!silent) statsLoading.value = false
  }
}

function refreshAll(silent = false) {
  return Promise.all([fetchLogs(silent), fetchStats(silent)])
}

function search() {
  page.value = 1
  refreshAll()
}

function reset() {
  rangeHours.value = 24
  dataType.value = ''
  source.value = ''
  status.value = ''
  keyword.value = ''
  page.value = 1
  refreshAll()
}

function handlePageChange(value) {
  page.value = value
  fetchLogs()
}

function handleSizeChange(value) {
  pageSize.value = value
  page.value = 1
  fetchLogs()
}

async function clearLogs() {
  try {
    await ElMessageBox.confirm('清空后无法恢复，确定清空全部数据流转日志？', '清空日志', {
      type: 'warning',
      confirmButtonText: '清空',
      cancelButtonText: '取消'
    })
    const res = await api.delete('/data-flow/logs')
    ElMessage.success(`已清空 ${res.data?.deleted || 0} 条日志`)
    page.value = 1
    await refreshAll()
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('清空失败: ' + (e.message || e))
  }
}

watch(autoRefresh, (on) => {
  if (timer) { clearInterval(timer); timer = null }
  if (on) timer = setInterval(() => refreshAll(true), 10000)
})

onMounted(() => refreshAll())
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="data-flow">
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <div>
            <span>数据流转</span>
            <span class="header-sub">外部取数与导入审计 · 最多保留 2 万条</span>
          </div>
          <span class="dim-text">
            {{ stats?.latest_at ? `最新记录：${fmtTime(stats.latest_at)}` : '暂无记录' }}
          </span>
        </div>
      </template>

      <div class="stat-grid" v-loading="statsLoading">
        <div class="stat-card">
          <div class="stat-label">取数事件</div>
          <div class="stat-value">{{ fmtNum(stats?.total) }}</div>
          <div class="stat-sub">{{ rangeLabel }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">成功率</div>
          <div class="stat-value" :class="{ 'ok-text': (stats?.success_rate || 0) >= 90 }">
            {{ stats?.success_rate ?? 0 }}%
          </div>
          <div class="stat-sub">成功 {{ fmtNum(stats?.success) }} · 空 {{ fmtNum(stats?.empty) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">失败</div>
          <div class="stat-value" :class="{ 'err-text': (stats?.fail || 0) > 0 }">{{ fmtNum(stats?.fail) }}</div>
          <div class="stat-sub">含全部多源尝试失败</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均耗时</div>
          <div class="stat-value">{{ fmtDuration(stats?.avg_duration_ms) }}</div>
          <div class="stat-sub">按事件整体耗时</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">日志容量</div>
          <div class="stat-value">
            {{ fmtNum(stats?.capacity?.used) }}
            <span class="capacity-max">/ {{ fmtNum(stats?.capacity?.max) }}</span>
          </div>
          <el-progress :percentage="capacityPercent" :show-text="false" :stroke-width="6" class="capacity-bar" />
        </div>
      </div>

      <div class="toolbar">
        <el-select v-model="rangeHours" style="width: 130px" @change="search">
          <el-option v-for="o in RANGE_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="dataType" clearable placeholder="数据类型" style="width: 150px" @change="search">
          <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="source" clearable filterable placeholder="数据源" style="width: 140px" @change="search">
          <el-option v-for="s in sourceOptions" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="status" clearable placeholder="状态" style="width: 110px" @change="search">
          <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索操作 / 错误 / 参数"
          style="width: 220px"
          @keyup.enter="search"
          @clear="search"
        />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
        <div class="toolbar-right">
          <el-switch v-model="autoRefresh" active-text="自动刷新" />
          <el-button :loading="loading || statsLoading" @click="refreshAll()">刷新</el-button>
          <el-button type="danger" plain @click="clearLogs">清空</el-button>
        </div>
      </div>
    </el-card>

    <el-card>
      <el-table
        v-loading="loading"
        :data="rows"
        size="small"
        border
        row-key="id"
        empty-text="暂无数据流转记录"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="detail-wrap">
              <div class="detail-title">多源尝试</div>
              <div v-if="attempts(row).length" class="attempt-list">
                <div v-for="(a, i) in attempts(row)" :key="i" class="attempt-item">
                  <el-tag size="small" :type="statusType(a.status)">{{ statusLabel(a.status) }}</el-tag>
                  <span class="attempt-source">{{ a.source_label || a.source || '未知' }}</span>
                  <span class="dim-text">{{ fmtNum(a.row_count) }} 行 · {{ fmtDuration(a.duration_ms) }}</span>
                  <span v-if="a.error" class="err-text">{{ a.error }}</span>
                </div>
              </div>
              <div v-else class="dim-text">无多源尝试记录（直连或导入事件）</div>

              <div class="detail-grid">
                <div>
                  <div class="detail-title">请求参数</div>
                  <pre>{{ pretty(row.params) }}</pre>
                </div>
                <div>
                  <div class="detail-title">明细</div>
                  <pre>{{ pretty(row.detail) }}</pre>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ typeLabel(row.data_type) }}</template>
        </el-table-column>
        <el-table-column prop="action" label="操作" min-width="150" show-overflow-tooltip />
        <el-table-column label="数据源" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.source_label" size="small" effect="plain">{{ row.source_label }}</el-tag>
            <span v-else class="dim-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="行数" width="100" align="right">
          <template #default="{ row }">{{ fmtNum(row.row_count) }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="100" align="right">
          <template #default="{ row }">{{ fmtDuration(row.duration_ms) }}</template>
        </el-table-column>
        <el-table-column label="参数" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="mono-text">{{ paramsSummary(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="错误" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.error" class="err-text">{{ row.error }}</span>
            <span v-else class="dim-text">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[20, 50, 100, 200]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.data-flow { padding: 20px; }
.mb-16 { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.header-sub { margin-left: 10px; color: #86909c; font-size: 12px; }
.dim-text { color: #86909c; font-size: 12px; }
.err-text { color: #f56c6c; font-size: 12px; }
.ok-text { color: #67c23a; }
.mono-text { font-family: Consolas, Monaco, monospace; font-size: 12px; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 14px 16px;
  background: var(--el-fill-color-blank);
}
.stat-label { color: #86909c; font-size: 12px; }
.stat-value { margin-top: 6px; font-size: 24px; font-weight: 600; line-height: 1.2; }
.stat-sub { margin-top: 6px; color: #86909c; font-size: 12px; }
.capacity-max { font-size: 12px; font-weight: 400; color: #86909c; }
.capacity-bar { margin-top: 10px; }

.toolbar { display: flex; flex-wrap: wrap; gap: 8px 10px; align-items: center; }
.toolbar-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }

.detail-wrap { padding: 10px 14px; }
.detail-title { font-size: 12px; font-weight: 600; color: #606266; margin-bottom: 6px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
.attempt-list { display: flex; flex-direction: column; gap: 5px; }
.attempt-item { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 12px; }
.attempt-source { font-weight: 600; color: #303133; }
pre {
  margin: 0;
  padding: 8px 10px;
  max-height: 180px;
  overflow: auto;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }

@media (max-width: 1200px) {
  .stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-grid { grid-template-columns: 1fr; }
  .toolbar-right { margin-left: 0; }
}
</style>
