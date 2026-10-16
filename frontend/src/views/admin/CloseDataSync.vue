<script setup>
/**
 * 收盘数据同步 —— 全市场数据同步 + 数据可视化（全新设计，替代原四类收盘同步页）。
 *
 * 功能分区：
 *   1. 全市场数据同步：一次「开始」= 全市场个股日K（写入 daily_k，前复权，幂等）
 *      + 四类收盘数据（涨停/跌停/板块/指数日K）。后台任务 + 实时进度轮询（1.5s）。
 *   2. 数据可视化（ECharts）：
 *      - 数据完整性：近 N 天 daily_k 覆盖率 / 按市场覆盖拆分 / 四类收盘数据存在性
 *      - 数据验证：当日 daily_k 异常分类计数（OHLC 冲突、非正价格、字段缺失）
 *      - 数据进度：进行中任务实时面板 + 最近任务历史
 *
 * 后端契约见 electron/server/market-sync.js（/api/market-sync/*）。
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import api from '@/utils/api'

// ---- 全市场同步：配置 ----
const today = () => new Date().toISOString().slice(0, 10)
const syncDate = ref(today())
const adjust = ref('qfq')
const concurrency = ref(3)
const includePools = ref(true)
const force = ref(false)
const starting = ref(false)

// ---- 全市场同步：状态 ----
const status = ref(null)
const statusLoading = ref(false)
const progressTimer = ref(null)

const ddbConnected = computed(() => !!status.value?.ddb?.connected)
const running = computed(() => !!status.value?.running)
const progressPercent = computed(() => status.value?.percent ?? 0)
const phaseLabel = computed(() => status.value?.phaseLabel || (status.value?.running ? '准备中…' : '未开始'))

/** 秒 → HH:MM:SS */
function fmtDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60
  const p = n => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(x)}`
}

const POOL_LABELS = [
  { key: 'limit_up', label: '涨停池' },
  { key: 'limit_down', label: '跌停池' },
  { key: 'plate', label: '板块行情' },
  { key: 'index', label: '指数日K' }
]

const fetchStatus = async () => {
  statusLoading.value = true
  try {
    const res = await api.get('/market-sync/status')
    status.value = res.data || null
  } catch (e) {
    // 仅静默失败一次，避免断连时刷屏；进度轮询由 running 判断兜底
  } finally {
    statusLoading.value = false
  }
}

/** 运行中 → 1.5s 轮询进度；空闲 → 停表 */
const managePolling = () => {
  if (progressTimer.value) { clearInterval(progressTimer.value); progressTimer.value = null }
  if (running.value) {
    progressTimer.value = setInterval(fetchStatus, 1500)
  }
}
watch(running, managePolling)

const startSync = async () => {
  if (starting.value) return
  if (!ddbConnected.value) return ElMessage.warning('DolphinDB 未连接，无法写入。请先在数据总览重连 DolphinDB')
  if (!syncDate.value) return ElMessage.warning('请选择目标日期')
  try {
    await ElMessageBox.confirm(
      `将启动「全市场数据同步」：\n` +
      `目标日期：${syncDate.value}（个股日K按当日拉取，前复权）\n` +
      `并发数：${concurrency.value}（全市场约 5000+ 只，预计需半小时以上，可随时停止后续拉）\n` +
      `${force.value ? '（已勾选强制重刷：四类收盘数据已存在也重新拉取）' : '（未勾选强制：四类收盘数据已存在的日期自动跳过）'}\n` +
      `是否继续？`,
      '确认启动全市场同步',
      { confirmButtonText: '开始同步', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  starting.value = true
  try {
    const res = await api.post('/market-sync/start', {
      date: syncDate.value,
      adjust: adjust.value,
      concurrency: concurrency.value,
      includePools: includePools.value,
      force: force.value
    })
    ElMessage.success(res.msg || '任务已启动')
    await fetchStatus()
    managePolling()
  } catch (e) {
    ElMessage.error('启动失败: ' + e.message)
  } finally {
    starting.value = false
  }
}

const stopSync = async () => {
  if (!running.value) return
  try {
    const res = await api.post('/market-sync/stop')
    ElMessage.info(res.msg || '已请求停止，将在当前批次结束后停止')
    await fetchStatus()
  } catch (e) {
    ElMessage.error('停止失败: ' + e.message)
  }
}

const lastCompleted = computed(() => status.value?.lastCompleted || null)

// ---- 数据可视化：完整性 ----
const completenessDays = ref(10)
const completeness = ref(null)
const completeLoading = ref(false)

const coverageDates = computed(() => (completeness.value?.byDate || []).map(d => d.date))
const coverageCovered = computed(() => (completeness.value?.byDate || []).map(d => d.covered))
const coverageRate = computed(() => (completeness.value?.byDate || []).map(d => d.percent))
const marketBreakdown = computed(() => completeness.value?.marketBreakdown || [])
const pools = computed(() => completeness.value?.pools || { limitUp: 0, limitDown: 0, plate: 0, index: 0 })

const completenessStats = computed(() => {
  const c = completeness.value
  const todayItem = (c?.byDate || []).find(d => d.date === (c?.date || today())) || (c?.byDate || [])[0]
  return {
    expected: c?.expected ?? 0,
    date: todayItem?.date || '-',
    covered: todayItem?.covered ?? 0,
    percent: todayItem?.percent ?? 0
  }
})

// ---- 数据可视化：验证 ----
const validateDate = ref(today())
const validateData = ref(null)
const validateLoading = ref(false)

const validateChecks = computed(() => validateData.value?.checks || [])
const validateTotal = computed(() => validateData.value?.total ?? 0)
const validateIssues = computed(() => validateData.value?.issues ?? 0)
const validateRate = computed(() => validateData.value?.rate ?? 0)

// ---- 自动刷新 ----
const autoRefresh = ref(false)
let autoTimer = null

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

watch(autoRefresh, (on) => {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null }
  if (on) autoTimer = setInterval(refreshVisual, 10000)
})

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
  const inst = echarts.init(el)
  return inst
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

watch([coverageDates, coverageCovered, coverageRate], () => { if (completeness.value && Object.keys(completeness.value).length) renderCompletenessChart() })
watch(marketBreakdown, () => { if (marketBreakdown.value.length) renderMarketChart() })
watch(validateChecks, () => { if (validateChecks.value.length) renderValidateChart() })

// ---- 生命周期 ----
onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await fetchStatus()
  managePolling()
  await refreshVisual()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (progressTimer.value) clearInterval(progressTimer.value)
  if (autoTimer) clearInterval(autoTimer)
  completenessChart?.dispose()
  marketChart?.dispose()
  validateChart?.dispose()
})
</script>

<template>
  <div class="close-data-sync">
    <!-- ======== 1. 全市场数据同步 ======== -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>全市场数据同步</span>
          <el-button size="small" :loading="statusLoading" @click="fetchStatus">刷新状态</el-button>
        </div>
      </template>

      <el-descriptions :column="4" border size="small" v-loading="statusLoading">
        <el-descriptions-item label="DolphinDB">
          <el-tag size="small" :type="ddbConnected ? 'success' : 'danger'">
            {{ ddbConnected ? '已连接' : '未连接' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="daily_k 总行数">{{ status?.ddb?.totalRows?.toLocaleString() ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="daily_k 覆盖股票数">{{ status?.ddb?.totalSymbols?.toLocaleString() ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="最新交易日">{{ status?.ddb?.latestDate || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="!ddbConnected"
        type="warning"
        :closable="false"
        class="mt-12"
        title="DolphinDB 未启动：全市场数据同步无法写入 daily_k / 涨跌停池 / 板块 / 指数日K。请启动本机 DolphinDB（默认 ws://127.0.0.1:8848）后刷新状态。"
      />

      <el-form class="mt-16" :inline="true" label-width="90px">
        <el-form-item label="目标日期">
          <el-date-picker v-model="syncDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" :disabled="running" />
        </el-form-item>
        <el-form-item label="复权方式">
          <el-select v-model="adjust" style="width: 110px" :disabled="running">
            <el-option label="前复权" value="qfq" />
            <el-option label="后复权" value="hfq" />
          </el-select>
        </el-form-item>
        <el-form-item label="并发数">
          <el-input-number v-model="concurrency" :min="1" :max="8" controls-position="right" :disabled="running" />
          <span class="form-hint">只并发</span>
        </el-form-item>
        <el-form-item label="四类收盘">
          <el-switch v-model="includePools" :disabled="running" active-text="同步" />
        </el-form-item>
        <el-form-item label="强制重刷">
          <el-checkbox v-model="force" :disabled="running">四类数据已存在也重拉</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="starting" :disabled="running || !ddbConnected" @click="startSync">
            开始同步
          </el-button>
          <el-button type="danger" plain :disabled="!running" @click="stopSync">停止</el-button>
        </el-form-item>
      </el-form>
      <div class="hint">
        一次「开始」依次执行：全市场个股日K（当日，逐只写入 daily_k，幂等）→ 涨停池 → 跌停池 → 板块行情 → 指数日K。
        全市场约 5000+ 只，预计耗时较长；随时可「停止」，恢复后再点「开始」续拉（已完成的股票不重复写入）。
      </div>

      <!-- 实时进度 -->
      <div class="progress-block mt-16" v-if="status">
        <el-progress
          :percentage="progressPercent"
          :status="!running && progressPercent === 100 ? 'success' : undefined"
          :stroke-width="20"
          :striped="running"
        />
        <el-descriptions v-if="running || progressPercent > 0" :column="8" border size="small" class="mt-12">
          <el-descriptions-item label="当前阶段">
            <el-tag size="small" :type="running ? 'primary' : 'info'">{{ phaseLabel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="已处理">{{ status.done }} / {{ status.total }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ status.ok }}</el-descriptions-item>
          <el-descriptions-item label="无数据">{{ status.empty }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ status.error }}</el-descriptions-item>
          <el-descriptions-item label="累计写入">{{ status.rows }} 行</el-descriptions-item>
          <el-descriptions-item label="速度">{{ status.rate ?? 0 }} 只/s</el-descriptions-item>
          <el-descriptions-item label="预计剩余">{{ running ? fmtDuration(status.etaSec) : '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="status.startedAt" class="dim mt-8">
          已运行 {{ fmtDuration(status.elapsedSec) }} · 目标日期 {{ status.date || '-' }}（并发 {{ status.concurrency }}）
        </div>
        <el-alert
          v-if="status.message"
          :title="status.message"
          type="warning"
          :closable="false"
          class="mt-8"
        />
        <!-- 四类收盘结果 -->
        <div v-if="status.pools && Object.values(status.pools).some(Boolean)" class="pool-result mt-12">
          <span class="pool-title">四类收盘数据：</span>
          <el-tag
            v-for="p in POOL_LABELS"
            :key="p.key"
            size="small"
            class="pool-tag"
            :type="!status.pools[p.key] ? 'info' : status.pools[p.key].status === 'ok' ? 'success' : status.pools[p.key].status === 'skipped' ? 'warning' : status.pools[p.key].status === 'empty' ? 'info' : 'danger'"
          >
            {{ p.label }}：
            <template v-if="!status.pools[p.key]">-</template>
            <template v-else>
              {{ status.pools[p.key].status === 'ok' ? `${status.pools[p.key].rows} 行` : status.pools[p.key].status === 'skipped' ? '已存在' : status.pools[p.key].status === 'empty' ? '无数据' : '失败' }}
            </template>
          </el-tag>
        </div>
        <!-- 最近一次完成摘要 -->
        <el-descriptions v-if="lastCompleted" :column="6" border size="small" class="mt-12">
          <el-descriptions-item label="上次任务">
            {{ lastCompleted.date }} · {{ new Date(lastCompleted.endedAt).toLocaleTimeString('zh-CN', { hour12: false }) }} 完成
          </el-descriptions-item>
          <el-descriptions-item label="成功">{{ lastCompleted.ok }}</el-descriptions-item>
          <el-descriptions-item label="无数据">{{ lastCompleted.empty }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ lastCompleted.error }}</el-descriptions-item>
          <el-descriptions-item label="写入">{{ lastCompleted.rows }} 行</el-descriptions-item>
          <el-descriptions-item label="结果">{{ lastCompleted.message || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- ======== 2. 数据可视化 ======== -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>数据可视化</span>
          <div class="header-actions">
            <el-switch v-model="autoRefresh" active-text="自动刷新(10s)" />
            <el-button size="small" style="margin-left: 8px" :loading="completeLoading || validateLoading" @click="refreshVisual">
              刷新数据
            </el-button>
          </div>
        </div>
      </template>

      <!-- 2.1 数据完整性 -->
      <div class="viz-section">
        <div class="section-title">数据完整性</div>
        <el-row :gutter="12" class="stat-row">
          <el-col :span="6"><el-statistic title="全市场股票数" :value="completenessStats.expected" /></el-col>
          <el-col :span="6"><el-statistic title="当日已覆盖" :value="completenessStats.covered" /></el-col>
          <el-col :span="6">
            <el-statistic title="当日覆盖率" :value="completenessStats.percent" suffix="%" />
          </el-col>
          <el-col :span="6">
            <div class="stat-mini">
              <span class="stat-mini-label">对应日期</span>
              <span class="stat-mini-value">{{ completenessStats.date }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="12" class="chart-row">
          <el-col :xs="24" :md="16">
            <div ref="completenessChartRef" class="chart-box"></div>
          </el-col>
          <el-col :xs="24" :md="8">
            <div class="board-card">
              <div class="section-subtitle">四类收盘数据（当日）</div>
              <div class="board-item" v-for="(label, key) in { limitUp: '涨停池', limitDown: '跌停池', plate: '板块行情', index: '指数日K' }" :key="key">
                <span>{{ label }}</span>
                <el-tag size="small" :type="(pools[key] || 0) > 0 ? 'success' : 'info'" class="board-tag">
                  {{ (pools[key] || 0) > 0 ? `${(pools[key] || 0).toLocaleString()} 条` : '未同步' }}
                </el-tag>
              </div>
              <div class="dim">近 {{ completenessDays }} 天每日覆盖率 · 板块卡显示所选日四类收盘数据是否已落库</div>
            </div>
          </el-col>
        </el-row>

        <div class="chart-row">
          <div class="chart-box short" ref="marketChartRef"></div>
        </div>
      </div>

      <!-- 2.2 数据验证 -->
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
          校验规则：最高<最低 / 最高<开盘或收盘 / 最低>开盘或收盘 / 收盘≤0 / 开盘≤0 / 成交量<0 / 涨跌幅缺失 / 成交额缺失或为负。绿色=该类别无异常。
        </div>
      </div>

      <!-- 2.3 数据进度 -->
      <div class="viz-section">
        <div class="section-title">数据进度</div>
        <div class="dim mb-8">
          实时进度见上方「全市场数据同步」卡片；此处列出最近完成的全市场同步任务记录（进程内保留最近 10 次）。
        </div>
        <el-table :data="status?.history || []" size="small" border max-height="260">
          <el-table-column label="完成时间" width="170">
            <template #default="{ row }">
              {{ row.endedAt ? new Date(row.endedAt).toLocaleString('zh-CN', { hour12: false }) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="date" label="目标日期" width="110" />
          <el-table-column label="股票数" width="90" align="right">
            <template #default="{ row }">{{ row.total?.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="成功" width="80" align="right">
            <template #default="{ row }"><span style="color:#67c23a">{{ row.ok }}</span></template>
          </el-table-column>
          <el-table-column label="无数据" width="80" align="right">
            <template #default="{ row }">{{ row.empty }}</template>
          </el-table-column>
          <el-table-column label="失败" width="80" align="right">
            <template #default="{ row }"><span style="color:#f56c6c">{{ row.error }}</span></template>
          </el-table-column>
          <el-table-column label="写入行数" width="90" align="right">
            <template #default="{ row }">{{ row.rows?.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="结果" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ row.message || '-' }}</template>
          </el-table-column>
          <template #empty>
            <span class="dim">暂无已完成的同步任务</span>
          </template>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.close-data-sync { padding: 20px; }
.mb-16 { margin-bottom: 16px; }
.mb-8 { margin-bottom: 8px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; align-items: center; }
.form-hint { margin-left: 6px; color: #86909c; font-size: 12px; }
.hint { margin-top: 6px; color: #86909c; font-size: 12px; }
.dim { color: #86909c; font-size: 12px; }
.progress-block { padding-top: 4px; }
.pool-result { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.pool-title { font-size: 13px; color: #606266; }
.pool-tag { }
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
.board-tag { }
.validate-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
</style>