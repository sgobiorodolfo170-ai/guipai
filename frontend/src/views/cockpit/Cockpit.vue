<script setup>
/**
 * 驾驶舱 —— 个人投资管理中枢
 *
 * 六区块：资产KPI条 / 风险预警面板 / 持仓明细 / 仓位饼图+统计卡 / 最近交易流水 / 回撤趋势
 * 数据流：trade（唯一事实源）→ position（物化视图）→ 前端取现价合并计算市值/浮盈
 * 风控：risk/overview 计算指标+分级告警，调用即落当日 risk_snapshot
 * 空态：无 trade 时提供「记一笔」+「载入示例数据」引导
 * 红级告警：页面挂载时系统通知推送，sessionStorage 当日去重
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import echarts from '@/utils/echarts'
import { useRouter } from 'vue-router'
import { getStockRealtime } from '@/services/stock.service'
import * as cockpitService from '@/services/cockpit.service'
import TradeFormDialog from '@/components/cockpit/TradeFormDialog.vue'

const router = useRouter()

// ---- 数据状态 ----
const loading = ref(false)
const summary = ref(null)
const positions = ref([])
const trades = ref([])
const tradesTotal = ref(0)
const capital = ref(100000)
const riskData = ref(null)
const snapshots = ref([])
const realtimeMap = ref({}) // code -> { price, changePercent }

// ---- 弹窗 ----
const tradeDialog = ref(false)
const tradeMode = ref('create')
const currentTrade = ref(null)
const sellPreset = ref(null)

// ---- 图表 ----
const pieChartEl = ref(null)
const trendChartEl = ref(null)
let pieChart = null
let trendChart = null

// ---- 格式化 ----
const fmt = (n) => (n == null ? '--' : Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 }))
const fmtPct = (n) => (n == null ? '--' : `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`)
const fmtPnl = (n) => (n == null ? '--' : `${n >= 0 ? '+' : ''}¥${fmt(Math.abs(n))}`)

// ---- 现价合并 ----
const positionsWithPrice = computed(() => {
  return positions.value.map(p => {
    const rt = realtimeMap.value[p.stockCode] || {}
    const price = rt.price != null ? Number(rt.price) : null
    const marketValue = price != null ? price * p.quantity : p.avgCost * p.quantity
    const pnl = price != null ? (price - p.avgCost) * p.quantity : 0
    const pnlPct = price != null && p.avgCost > 0 ? ((price - p.avgCost) / p.avgCost) * 100 : null
    const breakeven = p.avgCost > 0 ? p.avgCost * 1.00025 : 0 // 保本价 ≈ 成本 + 双边费用
    return { ...p, price, marketValue, pnl, pnlPct, breakeven, stalePrice: price == null }
  })
})

const totalMarketValue = computed(() => positionsWithPrice.value.reduce((s, p) => s + p.marketValue, 0))
const totalFloatingPnl = computed(() => positionsWithPrice.value.reduce((s, p) => s + p.pnl, 0))
const cash = computed(() => capital.value - (summary.value?.totalInvested || 0) + (summary.value?.totalProceeds || 0))
const totalAssets = computed(() => totalMarketValue.value + cash.value)
const totalPositionPct = computed(() => totalAssets.value > 0 ? (totalMarketValue.value / totalAssets.value) * 100 : 0)
const floatingPnlPct = computed(() => {
  const cost = positionsWithPrice.value.reduce((s, p) => s + p.avgCost * p.quantity, 0)
  return cost > 0 ? (totalFloatingPnl.value / cost) * 100 : null
})

// ---- 风控指标 ----
const riskIndicators = computed(() => riskData.value?.indicators || [])
const riskAlerts = computed(() => riskData.value?.alerts || [])
const hasRedAlert = computed(() => riskAlerts.value.some(a => a.level === 'red'))

// ---- 空态 ----
const isEmpty = computed(() => !loading.value && tradesTotal.value === 0 && positions.value.length === 0)
const hasDemo = computed(() => trades.value.some(t => t.isDemo))

// ---- 数据加载 ----
const fetchData = async () => {
  loading.value = true
  try {
    const [s, p, t, c] = await Promise.all([
      cockpitService.getSummary(),
      cockpitService.getPositions(),
      cockpitService.getTrades({ page: 1, pageSize: 20 }),
      cockpitService.getCapital()
    ])
    summary.value = s.data || {}
    positions.value = p.data || []
    trades.value = t.data?.list || []
    tradesTotal.value = t.data?.total || 0
    capital.value = c.data?.initialCapital ?? 100000

    // 取现价（静默降级）
    const codes = positions.value.map(x => x.stockCode)
    if (codes.length) {
      try {
        const resp = await getStockRealtime(codes)
        const list = Array.isArray(resp) ? resp : (resp?.data || [])
        const map = {}
        for (const item of list) if (item.code) map[item.code] = item
        realtimeMap.value = map
      } catch { /* 现价失败不影响本地数据展示 */ }
    }

    // 风控
    await fetchRisk()
    // 历史快照
    await fetchSnapshots()
  } catch (e) {
    ElMessage.error('加载驾驶舱失败: ' + e.message)
  } finally {
    loading.value = false
  }
  // 数据变化后等 DOM 更新完成再重绘图表（空态/有数据切换、增删改后都需要）
  await nextTick()
  renderPie()
  renderTrend()
}

const fetchRisk = async () => {
  try {
    const prices = {}
    for (const p of positionsWithPrice.value) if (p.price != null) prices[p.stockCode] = p.price
    const res = await cockpitService.getRiskOverview(prices)
    riskData.value = res.data || null
    // 红级告警系统通知（当日去重）
    if (riskData.value?.alerts?.length) {
      const today = new Date().toISOString().slice(0, 10)
      const pushed = sessionStorage.getItem('cockpit_alert_date')
      if (pushed !== today) {
        const redAlerts = riskData.value.alerts.filter(a => a.level === 'red')
        if (redAlerts.length && Notification.permission === 'granted') {
          new Notification('驾驶舱风险预警', { body: redAlerts.map(a => a.message).join('\n') })
          sessionStorage.setItem('cockpit_alert_date', today)
        }
      }
    }
  } catch (e) {
    console.error('风控计算失败:', e)
    riskData.value = null
  }
}

const fetchSnapshots = async () => {
  try {
    const res = await cockpitService.getRiskSnapshots(30)
    snapshots.value = res.data || []
  } catch { snapshots.value = [] }
}

// ---- 图表渲染 ----
const renderPie = () => {
  const el = pieChartEl.value
  if (!el) return
  // 空态与数据态切换会重建 DOM，实例绑定的旧节点需销毁重初始化
  if (pieChart && pieChart.getDom() !== el) { pieChart.dispose(); pieChart = null }
  if (!pieChart) pieChart = echarts.init(el)
  const data = positionsWithPrice.value.map(p => ({
    name: `${p.stockName || p.stockCode} ${fmt(p.marketValue)}`,
    value: Math.max(p.marketValue, 0.01),
    itemStyle: { color: p.pnl >= 0 ? '#ff4d4f' : '#00b578' }
  }))
  if (cash.value > 0) {
    data.push({ name: `现金 ${fmt(cash.value)}`, value: cash.value, itemStyle: { color: '#909399' } })
  }
  pieChart.setOption({
    tooltip: { formatter: p => `${p.name}<br/>占比 ${p.percent}%` },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      label: { show: true, formatter: '{b}\n{d}%' },
      data
    }]
  }, true)
  pieChart.resize()
}

const renderTrend = () => {
  const el = trendChartEl.value
  if (!el || !snapshots.value.length) return
  if (trendChart && trendChart.getDom() !== el) { trendChart.dispose(); trendChart = null }
  if (!trendChart) trendChart = echarts.init(el)
  const dates = snapshots.value.map(s => s.date)
  const mvs = snapshots.value.map(s => s.marketValue)
  const dds = snapshots.value.map(s => s.drawdown)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['总市值', '回撤%'], top: 0 },
    grid: { left: 50, right: 50, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: dates },
    yAxis: [
      { type: 'value', name: '市值', axisLabel: { formatter: v => (v / 10000).toFixed(0) + '万' } },
      { type: 'value', name: '回撤%', max: 0, axisLabel: { formatter: '{value}%' } }
    ],
    series: [
      { name: '总市值', type: 'line', data: mvs, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { opacity: 0.1 } },
      { name: '回撤%', type: 'line', yAxisIndex: 1, data: dds, smooth: true, itemStyle: { color: '#f56c6c' } }
    ]
  }, true)
  trendChart.resize()
}

// ---- 交易操作 ----
const openCreate = () => { tradeMode.value = 'create'; currentTrade.value = null; tradeDialog.value = true }
const openEdit = (row) => { tradeMode.value = 'edit'; currentTrade.value = { ...row }; tradeDialog.value = true }
const openSell = (row) => {
  tradeMode.value = 'sell'
  sellPreset.value = { stockCode: row.stockCode, stockName: row.stockName, price: row.price, quantity: row.quantity }
  tradeDialog.value = true
}

const deleteTrade = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.tradeDate} ${row.stockName || row.stockCode} 的${row.direction === 'buy' ? '买入' : '卖出'}记录吗？`, '删除交易', { type: 'warning' })
  } catch { return }
  try {
    await cockpitService.deleteTrade(row.id)
    ElMessage.success('已删除')
    await fetchData()
  } catch (e) { ElMessage.error('删除失败: ' + e.message) }
}

const loadDemo = async () => {
  try {
    await cockpitService.loadDemoTrades()
    ElMessage.success('示例数据已载入')
    await fetchData()
  } catch (e) { ElMessage.error('载入失败: ' + e.message) }
}

const clearDemo = async () => {
  try {
    await cockpitService.clearDemoTrades()
    ElMessage.success('示例数据已清除')
    await fetchData()
  } catch (e) { ElMessage.error('清除失败: ' + e.message) }
}

const onTradeSaved = async () => { await fetchData() }

const viewStock = (code) => router.push(`/stocks/${code}`)

// ---- 生命周期 ----
onMounted(async () => {
  window.addEventListener('resize', onResize)
  await fetchData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (pieChart) { pieChart.dispose(); pieChart = null }
  if (trendChart) { trendChart.dispose(); trendChart = null }
})

const onResize = () => { pieChart?.resize(); trendChart?.resize() }
</script>

<template>
  <div class="cockpit-page" v-loading="loading">
    <!-- 空态引导 -->
    <el-card v-if="isEmpty" class="empty-card">
      <el-empty description="暂无交易记录，开始记账后此处将展示资产总览与持仓明细">
        <el-button type="primary" size="large" @click="openCreate">记一笔</el-button>
        <el-button size="large" @click="loadDemo">载入示例数据</el-button>
      </el-empty>
    </el-card>

    <template v-else>
      <!-- 1. 资产 KPI 条 -->
      <div class="kpi-bar">
        <div class="kpi-item">
          <div class="kpi-label">总市值</div>
          <div class="kpi-value">¥{{ fmt(totalMarketValue) }}</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-label">浮动盈亏</div>
          <div class="kpi-value" :class="totalFloatingPnl >= 0 ? 'pnl-in' : 'pnl-out'">{{ fmtPnl(totalFloatingPnl) }}</div>
          <div class="kpi-sub" v-if="floatingPnlPct != null">{{ fmtPct(floatingPnlPct) }}</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-label">已实现盈亏</div>
          <div class="kpi-value" :class="(summary?.totalRealized || 0) >= 0 ? 'pnl-in' : 'pnl-out'">{{ fmtPnl(summary?.totalRealized || 0) }}</div>
        </div>
        <div class="kpi-item">
          <div class="kpi-label">总仓位</div>
          <div class="kpi-value">{{ totalPositionPct.toFixed(1) }}%</div>
          <div class="kpi-sub">现金 ¥{{ fmt(cash) }}</div>
        </div>
      </div>

      <!-- 2. 风险预警面板 -->
      <el-card class="risk-panel" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>风险预警</span>
            <el-tag v-if="hasRedAlert" type="danger" size="small">{{ riskAlerts.filter(a => a.level === 'red').length }} 项高危</el-tag>
            <el-tag v-else-if="riskAlerts.length" type="warning" size="small">{{ riskAlerts.length }} 项预警</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </div>
        </template>

        <div v-if="riskAlerts.length" class="alert-list">
          <el-alert
            v-for="(a, i) in riskAlerts" :key="i"
            :type="a.level === 'red' ? 'error' : a.level === 'yellow' ? 'warning' : 'info'"
            :title="a.message" :closable="false" show-icon
            class="alert-item"
          />
        </div>

        <div class="indicator-grid">
          <div v-for="ind in riskIndicators" :key="ind.key" class="indicator-card" :class="`lv-${ind.level}`">
            <div class="ind-label">{{ ind.label }}</div>
            <div class="ind-value">{{ ind.value }}{{ ind.unit }}</div>
            <div class="ind-ref" v-if="ind.ref">{{ ind.ref }}</div>
          </div>
        </div>
      </el-card>

      <!-- 3. 持仓明细表 -->
      <el-card class="position-card">
        <template #header>
          <div class="panel-header">
            <span>当前持仓（{{ positions.length }} 只）</span>
            <el-button size="small" type="primary" @click="openCreate">记一笔</el-button>
          </div>
        </template>
        <el-table :data="positionsWithPrice" stripe border>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-trades">
                <div class="expand-title">该股交易流水</div>
                <el-table :data="trades.filter(t => t.stockCode === row.stockCode)" size="small">
                  <el-table-column prop="tradeDate" label="日期" width="110" />
                  <el-table-column label="方向" width="70">
                    <template #default="{ row: t }">
                      <el-tag :type="t.direction === 'buy' ? 'danger' : 'success'" size="small">{{ t.direction === 'buy' ? '买入' : '卖出' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="tradePrice" label="价格" width="90" align="right" />
                  <el-table-column prop="quantity" label="数量" width="80" align="right" />
                  <el-table-column prop="fee" label="手续费" width="80" align="right" />
                  <el-table-column label="金额" width="110" align="right">
                    <template #default="{ row: t }">¥{{ fmt(t.tradePrice * t.quantity) }}</template>
                  </el-table-column>
                  <el-table-column prop="note" label="备注" min-width="120" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="股票" min-width="140">
            <template #default="{ row }">
              <el-link @click="viewStock(row.stockCode)" :underline="false" class="stock-link">{{ row.stockCode }}</el-link>
              <div class="stock-name">{{ row.stockName }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="持仓数量" width="90" align="right" sortable />
          <el-table-column label="平均成本" width="100" align="right">
            <template #default="{ row }">¥{{ fmt(row.avgCost) }}</template>
          </el-table-column>
          <el-table-column label="保本价" width="100" align="right">
            <template #default="{ row }">¥{{ fmt(row.breakeven) }}</template>
          </el-table-column>
          <el-table-column label="现价" width="90" align="right">
            <template #default="{ row }">
              <span v-if="row.price != null">{{ row.price.toFixed(2) }}</span>
              <span v-else class="dim">--</span>
            </template>
          </el-table-column>
          <el-table-column label="市值" width="110" align="right" sortable :sort-method="(a,b) => a.marketValue - b.marketValue">
            <template #default="{ row }">¥{{ fmt(row.marketValue) }}</template>
          </el-table-column>
          <el-table-column label="浮动盈亏" width="110" align="right" sortable :sort-method="(a,b) => a.pnl - b.pnl">
            <template #default="{ row }">
              <span :class="row.pnl >= 0 ? 'pnl-in' : 'pnl-out'">{{ fmtPnl(row.pnl) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏%" width="90" align="right" sortable :sort-method="(a,b) => (a.pnlPct || 0) - (b.pnlPct || 0)">
            <template #default="{ row }">
              <span :class="(row.pnlPct || 0) >= 0 ? 'pnl-in' : 'pnl-out'">{{ fmtPct(row.pnlPct) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="仓位%" width="80" align="right" sortable :sort-method="(a,b) => (a.marketValue / totalMarketValue) - (b.marketValue / totalMarketValue)">
            <template #default="{ row }">{{ totalMarketValue > 0 ? ((row.marketValue / totalMarketValue) * 100).toFixed(1) : '--' }}%</template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openSell(row)">卖出</el-button>
              <el-button size="small" type="primary" plain @click="openCreate">买入</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 4. 左饼图 + 右统计卡 -->
      <el-row :gutter="16" class="chart-row">
        <el-col :span="12" :md="12" :xs="24">
          <el-card>
            <template #header><span>仓位分布</span></template>
            <div ref="pieChartEl" class="pie-chart" />
          </el-card>
        </el-col>
        <el-col :span="12" :md="12" :xs="24">
          <el-card>
            <template #header><span>交易统计</span></template>
            <div class="stat-grid">
              <div class="stat-item"><span>总笔数</span><b>{{ summary?.totalTrades || 0 }}</b></div>
              <div class="stat-item"><span>买入</span><b class="pnl-in">{{ summary?.buyCount || 0 }}</b></div>
              <div class="stat-item"><span>卖出</span><b class="pnl-out">{{ summary?.sellCount || 0 }}</b></div>
              <div class="stat-item"><span>胜率</span><b>{{ summary?.sellStockCount ? ((summary.winCount / summary.sellStockCount) * 100).toFixed(1) : '--' }}%</b></div>
              <div class="stat-item"><span>总投入</span><b>¥{{ fmt(summary?.totalInvested) }}</b></div>
              <div class="stat-item"><span>总回收</span><b>¥{{ fmt(summary?.totalProceeds) }}</b></div>
              <div class="stat-item"><span>累计已实现</span><b :class="(summary?.totalRealized || 0) >= 0 ? 'pnl-in' : 'pnl-out'">¥{{ fmt(summary?.totalRealized) }}</b></div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 5. 回撤趋势 -->
      <el-card v-if="snapshots.length" class="trend-card">
        <template #header><span>近 30 天市值与回撤</span></template>
        <div ref="trendChartEl" class="trend-chart" />
      </el-card>

      <!-- 6. 最近交易流水 -->
      <el-card class="trade-card">
        <template #header>
          <div class="panel-header">
            <span>最近交易流水（{{ tradesTotal }} 条）</span>
            <div>
              <el-button v-if="hasDemo" size="small" type="warning" plain @click="clearDemo">清除示例数据</el-button>
              <el-button size="small" type="primary" @click="openCreate">记一笔</el-button>
            </div>
          </div>
        </template>
        <el-table :data="trades" stripe border>
          <el-table-column prop="tradeDate" label="日期" width="110" sortable />
          <el-table-column label="股票" min-width="140">
            <template #default="{ row }">
              <span>{{ row.stockCode }}</span>
              <span class="dim ml-4">{{ row.stockName }}</span>
              <el-tag v-if="row.isDemo" size="small" type="info" class="ml-4">示例</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="方向" width="70">
            <template #default="{ row }">
              <el-tag :type="row.direction === 'buy' ? 'danger' : 'success'" size="small">{{ row.direction === 'buy' ? '买入' : '卖出' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="tradePrice" label="价格" width="90" align="right" />
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column prop="fee" label="手续费" width="80" align="right" />
          <el-table-column label="金额" width="110" align="right">
            <template #default="{ row }">¥{{ fmt(row.tradePrice * row.quantity) }}</template>
          </el-table-column>
          <el-table-column prop="note" label="备注" min-width="120" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteTrade(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <!-- 统一记账弹窗 -->
    <TradeFormDialog v-model="tradeDialog" :mode="tradeMode" :trade="currentTrade" :preset="sellPreset" @saved="onTradeSaved" />
  </div>
</template>

<style scoped>
.cockpit-page { padding: 20px; }
.empty-card { min-height: 400px; display: flex; align-items: center; justify-content: center; }

/* KPI 条 */
.kpi-bar { display: flex; gap: 16px; margin-bottom: 16px; overflow-x: auto; flex-wrap: nowrap; }
.kpi-item { flex: 1; min-width: 160px; background: #f9fafb; border-radius: 12px; padding: 16px; text-align: center; }
.kpi-label { font-size: 13px; color: #86909c; margin-bottom: 8px; }
.kpi-value { font-size: 24px; font-weight: 600; color: #1d2129; }
.kpi-sub { font-size: 12px; color: #86909c; margin-top: 4px; }

/* 面板 */
.panel-header { display: flex; justify-content: space-between; align-items: center; }
.risk-panel { margin-bottom: 16px; }
.alert-list { margin-bottom: 16px; }
.alert-item { margin-bottom: 8px; }
.indicator-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.indicator-card { padding: 12px; border-radius: 8px; background: #f9fafb; border-left: 4px solid #dcdfe6; }
.indicator-card.lv-green { border-left-color: #67c23a; }
.indicator-card.lv-yellow { border-left-color: #e6a23c; }
.indicator-card.lv-red { border-left-color: #f56c6c; }
.indicator-card.lv-blue { border-left-color: #409eff; }
.ind-label { font-size: 12px; color: #86909c; margin-bottom: 4px; }
.ind-value { font-size: 18px; font-weight: 600; }
.ind-ref { font-size: 11px; color: #c0c4cc; margin-top: 4px; }

/* 持仓 */
.position-card { margin-bottom: 16px; }
.stock-link { font-weight: 600; }
.stock-name { font-size: 12px; color: #86909c; }
.expand-trades { padding: 8px 16px; background: #fafafa; }
.expand-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; }

/* 图表 */
.chart-row { margin-bottom: 16px; }
.pie-chart { height: 300px; }
.trend-card { margin-bottom: 16px; }
.trend-chart { height: 260px; }

/* 统计 */
.stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 8px 0; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-item span { font-size: 12px; color: #86909c; }
.stat-item b { font-size: 18px; }

/* 流水 */
.trade-card { margin-bottom: 16px; }
.dim { color: #86909c; font-size: 12px; }
.ml-4 { margin-left: 4px; }

/* 盈亏色 */
.pnl-in { color: #f56c6c; }
.pnl-out { color: #67c23a; }

/* 响应式 */
@media (max-width: 900px) {
  .kpi-bar { flex-wrap: nowrap; }
  .indicator-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-grid { grid-template-columns: 1fr; }
}
</style>
