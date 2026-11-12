<template>
  <div class="heatmap-page">
    <h1 class="page-title">资金流热力图</h1>
    <p class="page-description">
      矩形树图：面积=资金流绝对值，红=净流入，绿=净流出。数据源 Tushare moneyflow（需接口权限）。
    </p>

    <div class="toolbar">
      <el-tabs v-model="activeType" @tab-change="load">
        <el-tab-pane label="个股资金" name="stock" />
        <el-tab-pane label="行业板块资金" name="industry" />
        <el-tab-pane label="市场资金" name="market" />
      </el-tabs>
      <div class="toolbar-right">
        <el-date-picker
          v-model="dateStr"
          type="date"
          value-format="YYYYMMDD"
          placeholder="选择交易日"
          :clearable="false"
          size="small"
          style="width: 150px"
        />
        <el-button size="small" type="primary" :loading="loading" @click="load">查询</el-button>
      </div>
    </div>

    <div v-if="error" class="error-tip">
      <el-alert type="warning" :closable="false" :title="error" />
    </div>

    <div v-if="!error" class="summary">
      <span>交易日：{{ latestDate || '-' }}</span>
      <span>净流入合计：<b :style="{ color: totalNet >= 0 ? upColor : downColor }">{{ fmtMoney(totalNet) }}</b></span>
      <span>个股/板块数：{{ items.length }}</span>
    </div>

    <div ref="chartEl" v-loading="loading" class="chart" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import echarts from '@/utils/echarts'
import api from '@/utils/api'

const upColor = '#ff4d4f'
const downColor = '#00b578'

const activeType = ref('stock')
const dateStr = ref(lastWeekday())
const latestDate = ref('')
const items = ref([])
const error = ref('')
const loading = ref(false)
const chartEl = ref(null)
let chart = null

const totalNet = computed(() => items.value.reduce((s, i) => s + (i.netInflow || 0), 0))

function lastWeekday() {
  const d = new Date()
  do { d.setDate(d.getDate() - 1) } while (d.getDay() === 0 || d.getDay() === 6)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

function fmtMoney(v) {
  if (v == null) return '-'
  const a = Math.abs(v)
  if (a >= 1e12) return (v / 1e12).toFixed(2) + '万亿'
  if (a >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (a >= 1e4) return (v / 1e4).toFixed(0) + '万'
  return v.toFixed(0)
}

function renderTree() {
  if (!chart) return
  const top = activeType.value === 'Stock' || activeType.value === 'stock' ? 200 : 100000
  const children = items.value.slice(0, top).map(i => ({
    name: `${i.name}  ${fmtMoney(i.netInflow)}`,
    value: Math.max(Math.abs(i.value || i.netInflow || 0), 1),
    itemStyle: { color: (i.netInflow || 0) >= 0 ? upColor : downColor },
    raw: i
  }))
  if (items.value.length > top) {
    const rest = items.value.slice(top)
    const restVal = Math.max(rest.reduce((s, i) => s + Math.abs(i.value || i.netInflow || 0), 0), 1)
    children.push({ name: `其他(${rest.length})`, value: restVal, itemStyle: { color: '#909399' } })
  }
  chart.setOption({
    tooltip: {
      formatter: (p) => {
        const i = p.data && p.data.raw ? p.data.raw : p.data
        if (!i) return p.name
        return `${i.name}<br/>净流入：${fmtMoney(i.netInflow)}<br/>主力买入：${fmtMoney(i.buyLarge)}<br/>主力卖出：${fmtMoney(i.sellLarge)}`
      }
    },
    series: [{
      type: 'treemap',
      roam: false,
      nodeClick: 'zoomToNode',
      breadcrumb: { show: false },
      leafDepth: 1,
      label: { show: true, formatter: '{b}', color: '#fff', fontSize: 12 },
      itemStyle: { borderColor: '#1f2937', borderWidth: 1, gapWidth: 1 },
      data: children
    }]
  }, true)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const r = await api.get('/money-flow', { params: { type: activeType.value, date: dateStr.value } })
    if (r.code === 200 && r.data) {
      if (r.data.placeholder) {
        items.value = []
        latestDate.value = r.data.date || ''
        error.value = r.data.message || '资金流数据源未接入（占位）'
        if (chart) chart.clear()
        return
      }
      latestDate.value = r.data.date || ''
      items.value = r.data.items || []
      renderTree()
    } else {
      error.value = (r && r.msg) || '数据加载失败'
    }
  } catch (e) {
    error.value = (e && e.message) || '请求失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  chart = echarts.init(chartEl.value)
  window.addEventListener('resize', resize)
  load()
})

function resize() { if (chart) chart.resize() }

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.heatmap-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.summary {
  display: flex;
  gap: 24px;
  padding: 8px 4px;
  color: #555;
  font-size: 13px;
}
.error-tip {
  margin: 8px 0;
}
.chart {
  flex: 1;
  min-height: calc(100vh - 220px);
}
</style>