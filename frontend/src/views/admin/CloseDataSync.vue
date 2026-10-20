<script setup>
/**
 * 收盘数据同步 —— 通达信数据包同步 + 收盘股票池 + 数据可视化。
 *
 * 功能分区：
 *   1. 数据包同步（/api/package-sync）：18:10 自动 + 启动补跑最近 5 个交易日，
 *      从通达信官网下载每日行情包（个股日K → daily_k_raw、三大指数 → stock_zh_index_daily）
 *      和季度财务包（→ SQLite stock_financial）。
 *   2. 收盘股票池（/api/market-sync）：涨停池 / 跌停池 / 板块行情 / 全市场实时行情。
 *   3. 数据可视化：daily_k_raw 覆盖率、按市场拆分、异常校验、任务历史。
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import api from '@/utils/api'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---- 数据包同步 ----
const pkgStatus = ref(null)
const pkgLoading = ref(false)
const pkgStarting = ref(false)
const pkgForce = ref(false)
let pkgTimer = null

const ddbConnected = computed(() => !!pkgStatus.value?.ddbConnected)
const pkgRunning = computed(() => !!pkgStatus.value?.running)
const pkgPercent = computed(() => pkgStatus.value?.percent ?? 0)
const pkgPhase = computed(() => pkgStatus.value?.phase || (pkgRunning.value ? '准备中…' : '空闲'))

const fetchPkgStatus = async () => {
  pkgLoading.value = true
  try {
    const res = await api.get('/package-sync/status')
    pkgStatus.value = res.data || null
  } catch (_) {
    // 后端重启中：静默，下一轮轮询恢复
  } finally {
    pkgLoading.value = false
  }
}

const startPackageSync = async () => {
  if (pkgStarting.value) return
  if (!ddbConnected.value) return ElMessage.warning('DolphinDB 未连接，无法写入。请先重连')
  try {
    await ElMessageBox.confirm(
      `将从通达信官网补跑最近 5 个交易日的数据包：\n` +
      `· 个股日K（不复权）→ daily_k_raw（已存在的日期自动跳过）\n` +
      `· 三大指数日K → stock_zh_index_daily\n` +
      (pkgForce.value ? '· 已勾选强制重跑：已存在的日期也会重新下载并覆盖\n' : '') +
      '是否继续？',
      '确认同步数据包',
      { confirmButtonText: '开始同步', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  pkgStarting.value = true
  try {
    const res = await api.post('/package-sync/start', { days: 5, force: pkgForce.value })
    ElMessage.success(`已启动：${(res.data?.dates || []).join('、')}`)
    await fetchPkgStatus()
  } catch (e) {
    ElMessage.error('启动失败: ' + e.message)
  } finally {
    pkgStarting.value = false
  }
}

const stopPackageSync = async () => {
  if (!pkgRunning.value) return
  try {
    const res = await api.post('/package-sync/stop')
    ElMessage.info(res.msg || '已请求停止')
    await fetchPkgStatus()
  } catch (e) {
    ElMessage.error('停止失败: ' + e.message)
  }
}

const reconnectDdb = async () => {
  try {
    const res = await api.post('/package-sync/connect')
    if (res.data?.connected) ElMessage.success('DolphinDB 连接成功')
    else ElMessage.warning('连接未成功，请确认本机 DolphinDB 已启动（默认 ws://127.0.0.1:8848）')
    await fetchPkgStatus()
  } catch (e) {
    ElMessage.error('连接失败: ' + e.message)
  }
}

const logType = (level) => (level === 'error' ? 'danger' : level === 'warn' ? 'warning' : 'info')
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-')

// ---- 收盘股票池 ----
const poolStatus = ref(null)
const poolLoading = ref(false)
const poolStarting = ref(false)
const syncDate = ref(today())
const poolForce = ref(false)
let poolTimer = null

const poolRunning = computed(() => !!poolStatus.value?.running)
const poolPercent = computed(() => poolStatus.value?.percent ?? 0)
const poolPhase = computed(() => poolStatus.value?.phaseLabel || (poolRunning.value ? '准备中…' : '未开始'))

const POOL_LABELS = [
  { key: 'limit_up', label: '涨停池' },
  { key: 'limit_down', label: '跌停池' },
  { key: 'plate', label: '板块行情' },
  { key: 'spot', label: '全市场实时行情' }
]

const poolTagType = (r) => {
  if (!r) return 'info'
  if (r.status === 'ok') return 'success'
  if (r.status === 'skipped') return 'warning'
  if (r.status === 'empty') return 'info'
  return 'danger'
}
const poolText = (r) => {
  if (!r) return '-'
  if (r.status === 'ok') return `${r.rows} 行`
  if (r.status === 'skipped') return '已存在'
  if (r.status === 'empty') return '无数据'
  return '失败'
}

const fetchPoolStatus = async () => {
  poolLoading.value = true
  try {
    const res = await api.get('/market-sync/status')
    poolStatus.value = res.data || null
  } catch (_) {
    // 静默
  } finally {
    poolLoading.value = false
  }
}

const startPoolSync = async () => {
  if (poolStarting.value) return
  if (!ddbConnected.value) return ElMessage.warning('DolphinDB 未连接，无法写入')
  if (!syncDate.value) return ElMessage.warning('请选择目标日期')
  try {
    await ElMessageBox.confirm(
      `将同步 ${syncDate.value} 的收盘股票池：涨停池 → 跌停池 → 板块行情 → 全市场实时行情。\n` +
      (poolForce.value ? '已勾选强制重刷：当日已存在的数据会重新拉取并覆盖。' : '已有数据会自动跳过。'),
      '确认同步收盘股票池',
      { confirmButtonText: '开始同步', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  poolStarting.value = true
  try {
    const res = await api.post('/market-sync/start', { date: syncDate.value, force: poolForce.value })
    ElMessage.success(res.msg || '任务已启动')
    await fetchPoolStatus()
  } catch (e) {
    ElMessage.error('启动失败: ' + e.message)
  } finally {
    poolStarting.value = false
  }
}

const stopPoolSync = async () => {
  if (!poolRunning.value) return
  try {
    const res = await api.post('/market-sync/stop')
    ElMessage.info(res.msg || '已请求停止')
    await fetchPoolStatus()
  } catch (e) {
    ElMessage.error('停止失败: ' + e.message)
  }
}

// ---- 数据可视化 ----
const completenessDays = ref(10)
const completeness = ref(null)
const completeLoading = ref(false)
const validateDate = ref(today())
const validateData = ref(null)
const validateLoading = ref(false)

const coverageDates = computed(() => (completeness.value?.byDate || []).map(d => d.date))
const coverageCovered = computed(() => (completeness.value?.byDate || []).map(d => d.covered))
const coverageRate = computed(() => (completeness.value?.byDate || []).map(d => d.percent))
const marketBreakdown = computed(() => completeness.value?.marketBreakdown || [])
const universeSource = computed(() => completeness.value?.universeSource || 'stock_basic')
const pools = computed(() => completeness.value?.pools || { limitUp: 0, limitDown: 0, plate: 0 })

const completenessStats = computed(() => {
  const c = completeness.value
  const item = (c?.byDate || []).find(d => d.date === (c?.date || today())) || (c?.byDate || [])[0]
  return {
    expected: c?.expected ?? 0,
    date: item?.date || '-',
    covered: item?.covered ?? 0,
    percent: item?.percent ?? 0
  }
})

const validateChecks = computed(() => validateData.value?.checks || [])
const validateTotal = computed(() => validateData.value?.total ?? 0)
const validateIssues = computed(() => validateData.value?.issues ?? 0)
const validateRate = computed(() => validateData.value?.rate ?? 0)

const fetchCompleteness = async () => {
  completeLoading.value = true
  try {
    const res = await api.get('/market-sync/completeness', { params: { days: completenessDays.value, date: today() } })
    completeness.value = res.data || null
  } catch (e) {
    ElMessage.error('获取完整性数据失败: ' + e.message)
  } finally {
    completeLoading.value = false
  }
}

const fetchValidate = async () => {
  validateLoading.value = true
  try {
    const res = await api.get('/market-sync/validate', { params: { date: validateDate.value } })
    validateData.value = res.data || null
  } catch (e) {
    ElMessage.error('获取验证数据失败: ' + e.message)
  } finally {
    validateLoading.value = false
  }
}

const refreshVisual = async () => {
  await Promise.all([fetchCompleteness(), fetchValidate()])
}

// ---- ECharts ----
const completenessChartRef = ref(null)
const marketChartRef = ref(null)
const validateChartRef = ref(null)
let completenessChart = null
let marketChart = null
let validateChart = null

const PALETTE = ['#409eff', '#67c23a', '#e6a23c', '#909399', '#f56c6c', '#7958d6']

function ensureInit(instRef, elRef) {
  const el = elRef.value
  if (!el) return null
  if (instRef !== null) return instRef
  return echarts.init(el)
}

const renderCompletenessChart = async () => {
  await nextTick()
  completenessChart = ensureInit(completenessChart, completenessChartRef)
  if (!completenessChart) return
  completenessChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['覆盖股票数', '覆盖率'], top: 0 },
    grid: { left: '3%', right: '6%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: coverageDates.value },
    yAxis: [
      { type: 'value', name: '股票数' },
      { type: 'value', name: '覆盖率', max: 100, axisLabel: { formatter: '{value}%' } }
    ],
    series: [
      { name: '覆盖股票数', type: 'bar', data: coverageCovered.value, barMaxWidth: 26, itemStyle: { color: PALETTE[0] } },
      { name: '覆盖率', type: 'line', yAxisIndex: 1, data: coverageRate.value, smooth: true, symbol: 'circle', itemStyle: { color: PALETTE[1] } }
    ]
  }, { notMerge: true })
}

const renderMarketChart = async () => {
  await nextTick()
  marketChart = ensureInit(marketChart, marketChartRef)
  if (!marketChart) return
  const m = marketBreakdown.value
  marketChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['已覆盖', '缺失'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: m.map(x => x.market), inverse: true },
    series: [
      { name: '已覆盖', type: 'bar', stack: 'm', data: m.map(x => x.covered), itemStyle: { color: PALETTE[0] } },
      { name: '缺失', type: 'bar', stack: 'm', data: m.map(x => x.missing), itemStyle: { color: '#e8ecf0' }, label: { show: true, position: 'right', formatter: p => `${(m[p.dataIndex]?.percent ?? 0)}%`, fontSize: 11, color: '#606266' } }
    ]
  }, { notMerge: true })
}

const renderValidateChart = async () => {
  await nextTick()
  validateChart = ensureInit(validateChart, validateChartRef)
  if (!validateChart) return
  const checks = validateChecks.value
  validateChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: checks.map(c => c.label) },
    yAxis: { type: 'value', name: '异常行数' },
    series: [{
      name: '异常行数', type: 'bar', data: checks.map(c => c.count || 0),
      barMaxWidth: 40,
      itemStyle: { color: p => (p.value > 0 ? '#f56c6c' : '#67c23a') }
    }]
  }, { notMerge: true })
}

const handleResize = () => {
  completenessChart?.resize()
  marketChart?.resize()
  validateChart?.resize()
}

watch([coverageDates, coverageCovered, coverageRate], () => { if (coverageDates.value.length) renderCompletenessChart() })
watch(marketBreakdown, () => { if (marketBreakdown.value.length) renderMarketChart() })
watch(validateChecks, () => { if (validateChecks.value.length) renderValidateChart() })

// ---- 生命周期 ----
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await Promise.all([fetchPkgStatus(), fetchPoolStatus()])
  await refreshVisual()
  pkgTimer = setInterval(fetchPkgStatus, 5000)
  poolTimer = setInterval(() => { if (poolRunning.value) fetchPoolStatus() }, 1500)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (pkgTimer) clearInterval(pkgTimer)
  if (poolTimer) clearInterval(poolTimer)
  completenessChart?.dispose()
  marketChart?.dispose()
  validateChart?.dispose()
})
</script>

<template>
  <div class="close-data-sync">
    <!-- ======== 1. 通达信数据包同步 ======== -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>通达信数据包同步</span>
          <el-button size="small" :loading="pkgLoading" @click="fetchPkgStatus">刷新状态</el-button>
        </div>
      </template>

      <el-descriptions :column="4" border size="small" v-loading="pkgLoading">
        <el-descriptions-item label="DolphinDB">
          <el-tag size="small" :type="ddbConnected ? 'success' : 'danger'">{{ ddbConnected ? '已连接' : '未连接' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最新日K">{{ pkgStatus?.lastDaily || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最新财报期">{{ pkgStatus?.financial?.reportDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="财务行数">{{ (pkgStatus?.financial?.rows ?? 0).toLocaleString() }}</el-descriptions-item>
      </el-descriptions>

      <el-alert
        v-if="!ddbConnected"
        type="warning"
        :closable="false"
        class="mt-12"
        title="DolphinDB 未启动：数据包无法写入 daily_k_raw / 指数日K。请启动本机 DolphinDB（默认 ws://127.0.0.1:8848）后重连。"
      >
        <el-button size="small" type="primary" plain class="mt-8" @click="reconnectDdb">立即重连</el-button>
      </el-alert>

      <div class="toolbar mt-16">
        <el-button type="primary" :loading="pkgStarting" :disabled="pkgRunning || !ddbConnected" @click="startPackageSync">
          补跑最近 5 个交易日
        </el-button>
        <el-button type="danger" plain :disabled="!pkgRunning" @click="stopPackageSync">停止</el-button>
        <el-checkbox v-model="pkgForce" :disabled="pkgRunning">强制重跑（覆盖已存在日期）</el-checkbox>
        <span class="dim">每日 18:10 自动同步；应用启动后自动补跑缺失交易日。</span>
      </div>

      <div class="progress-block mt-16" v-if="pkgStatus">
        <el-progress
          :percentage="pkgPercent"
          :status="!pkgRunning && pkgPercent === 100 ? 'success' : undefined"
          :stroke-width="18"
          :striped="pkgRunning"
        />
        <div class="dim mt-8">
          当前阶段：{{ pkgPhase }}
          <span v-if="pkgStatus.startedAt"> · 开始于 {{ fmtTime(pkgStatus.startedAt) }}</span>
        </div>
        <div v-if="pkgStatus.financial?.lastSuccess" class="dim mt-4">
          上次财报导入：{{ fmtTime(pkgStatus.financial.lastSuccess) }}
        </div>
      </div>

      <div class="mt-16">
        <div class="section-subtitle">最近 10 个交易日覆盖（daily_k_raw）</div>
        <el-table :data="pkgStatus?.recent || []" size="small" border max-height="300">
          <el-table-column prop="date" label="交易日" width="140" />
          <el-table-column label="个股行数" width="140" align="right">
            <template #default="{ row }">{{ (row.count ?? 0).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.count > 0 ? 'success' : 'info'">{{ row.count > 0 ? '已入库' : '无数据' }}</el-tag>
            </template>
          </el-table-column>
          <template #empty><span class="dim">暂无覆盖记录</span></template>
        </el-table>
      </div>

      <div class="mt-16" v-if="pkgStatus?.log?.length">
        <div class="section-subtitle">同步日志（最近 60 条）</div>
        <el-scrollbar max-height="220" class="log-box">
          <div v-for="(l, i) in pkgStatus.log" :key="i" class="log-line">
            <span class="log-time">{{ fmtTime(l.ts) }}</span>
            <el-tag size="small" :type="logType(l.level)" class="log-tag">{{ l.level }}</el-tag>
            <span>{{ l.text }}</span>
          </div>
        </el-scrollbar>
      </div>
    </el-card>

    <!-- ======== 2. 收盘股票池同步 ======== -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>收盘股票池同步</span>
          <el-button size="small" :loading="poolLoading" @click="fetchPoolStatus">刷新状态</el-button>
        </div>
      </template>

      <div class="toolbar">
        <el-date-picker v-model="syncDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" :disabled="poolRunning" />
        <el-button type="primary" :loading="poolStarting" :disabled="poolRunning || !ddbConnected" @click="startPoolSync">开始同步</el-button>
        <el-button type="danger" plain :disabled="!poolRunning" @click="stopPoolSync">停止</el-button>
        <el-checkbox v-model="poolForce" :disabled="poolRunning">强制重刷当日数据</el-checkbox>
      </div>
      <div class="hint">依次执行：涨停池 → 跌停池 → 板块行情 → 全市场实时行情。已有数据自动跳过。</div>

      <div class="progress-block mt-16" v-if="poolStatus">
        <el-progress
          :percentage="poolPercent"
          :status="!poolRunning && poolPercent === 100 ? 'success' : undefined"
          :stroke-width="18"
          :striped="poolRunning"
        />
        <div class="dim mt-8">当前阶段：{{ poolPhase }}</div>
        <div v-if="poolStatus.pools && Object.values(poolStatus.pools).some(Boolean)" class="pool-result mt-12">
          <el-tag v-for="p in POOL_LABELS" :key="p.key" size="small" class="pool-tag" :type="poolTagType(poolStatus.pools[p.key])">
            {{ p.label }}：{{ poolText(poolStatus.pools[p.key]) }}
          </el-tag>
        </div>
        <el-descriptions v-if="poolStatus.lastCompleted" :column="3" border size="small" class="mt-12">
          <el-descriptions-item label="上次任务">
            {{ poolStatus.lastCompleted.date }} · {{ fmtTime(poolStatus.lastCompleted.endedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="结果" :span="2">{{ poolStatus.lastCompleted.message || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- ======== 3. 数据可视化 ======== -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>数据可视化</span>
          <el-button size="small" :loading="completeLoading || validateLoading" @click="refreshVisual">刷新数据</el-button>
        </div>
      </template>

      <div class="viz-section">
        <div class="section-title">数据完整性（daily_k_raw）</div>
        <el-row :gutter="12" class="stat-row">
          <el-col :span="6"><el-statistic title="全市场股票数" :value="completenessStats.expected" /></el-col>
          <el-col :span="6"><el-statistic title="当日已覆盖" :value="completenessStats.covered" /></el-col>
          <el-col :span="6"><el-statistic title="当日覆盖率" :value="completenessStats.percent" suffix="%" /></el-col>
          <el-col :span="6">
            <div class="stat-mini">
              <span class="stat-mini-label">对应日期</span>
              <span class="stat-mini-value">{{ completenessStats.date }}</span>
            </div>
          </el-col>
        </el-row>
        <div v-if="universeSource === 'recent_peak'" class="dim mb-12">
          stock_basic 尚未同步：覆盖率分母按近 {{ completenessDays }} 天已覆盖峰值估算；在「股票列表」页同步后会恢复为真实全市场股票数。
        </div>

        <el-row :gutter="12" class="chart-row">
          <el-col :xs="24" :md="16">
            <div ref="completenessChartRef" class="chart-box"></div>
          </el-col>
          <el-col :xs="24" :md="8">
            <div class="board-card">
              <div class="section-subtitle">收盘股票池（当日）</div>
              <div class="board-item" v-for="(label, key) in { limitUp: '涨停池', limitDown: '跌停池', plate: '板块行情' }" :key="key">
                <span>{{ label }}</span>
                <el-tag size="small" :type="(pools[key] || 0) > 0 ? 'success' : 'info'" class="board-tag">
                  {{ (pools[key] || 0) > 0 ? `${(pools[key] || 0).toLocaleString()} 条` : '未同步' }}
                </el-tag>
              </div>
              <div class="dim">近 {{ completenessDays }} 天每日覆盖率 · 卡片显示当日收盘池是否已落库</div>
            </div>
          </el-col>
        </el-row>

        <div class="chart-row" v-if="marketBreakdown.length">
          <div class="chart-box short" ref="marketChartRef"></div>
        </div>
        <div v-else class="dim mb-12">按市场拆分需要 stock_basic（股票列表）数据；同步后显示沪/深/北覆盖对比。</div>
      </div>

      <div class="viz-section">
        <div class="section-title">数据验证</div>
        <div class="validate-toolbar">
          <el-date-picker v-model="validateDate" type="date" value-format="YYYY-MM-DD" placeholder="选择校验日期" style="width: 160px" />
          <el-button size="small" type="primary" :loading="validateLoading" @click="fetchValidate">校验</el-button>
          <span v-if="validateData && validateData.connected === false" class="dim">（{{ validateData.message }}）</span>
        </div>
        <el-row :gutter="12" class="stat-row" v-if="validateData">
          <el-col :span="8"><el-statistic title="当日行数" :value="validateTotal" /></el-col>
          <el-col :span="8"><el-statistic title="异常行数" :value="validateIssues" /></el-col>
          <el-col :span="8"><el-statistic title="异常率" :value="validateRate" suffix="%" /></el-col>
        </el-row>
        <div class="chart-box" ref="validateChartRef"></div>
        <div class="dim" v-if="validateData">
          校验规则：最高&lt;最低 / 最高&lt;开盘或收盘 / 最低&gt;开盘或收盘 / 收盘≤0 / 开盘≤0 / 成交量&lt;0 / 成交额缺失或为负。绿色=该类别无异常。
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.close-data-sync { padding: 20px; }
.mb-16 { margin-bottom: 16px; }
.mb-12 { margin-bottom: 12px; }
.mt-4 { margin-top: 4px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.hint { margin-top: 6px; color: #86909c; font-size: 12px; }
.dim { color: #86909c; font-size: 12px; }
.progress-block { padding-top: 4px; }
.pool-result { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.log-box { border: 1px solid var(--el-border-color-light); border-radius: 6px; padding: 8px 10px; }
.log-line { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 22px; color: #606266; }
.log-time { color: #909399; white-space: nowrap; }
.log-tag { flex-shrink: 0; }
.viz-section { margin-bottom: 26px; }
.section-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.section-subtitle { font-size: 13px; font-weight: 600; color: #606266; margin-bottom: 10px; }
.stat-row { margin-bottom: 14px; }
.stat-mini { line-height: 32px; }
.stat-mini-label { color: #909399; font-size: 13px; margin-right: 8px; }
.stat-mini-value { font-size: 18px; font-weight: 600; }
.chart-row { margin-bottom: 12px; }
.chart-box { width: 100%; height: 300px; }
.chart-box.short { height: 240px; }
.board-card { padding: 8px 12px; border: 1px solid var(--el-border-color-light); border-radius: 6px; }
.board-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 2px; border-bottom: 1px dashed var(--el-border-color-lighter); font-size: 13px; }
.board-item:last-child { border-bottom: none; }
.validate-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
</style>
