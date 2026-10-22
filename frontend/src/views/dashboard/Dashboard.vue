<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStockStore } from '@/store/stock.store'
import KLineChart from '@/components/common/KLineChart.vue'

const stockStore = useStockStore()

const loading = ref(false)
// date 为最新交易日（后端双源比对结果）：展示在标题后，明确数值是哪天的；
// source 标记该数值来自实时快照(snapshot)还是指数日K(daily)，三指数来源不一致时显示“混合”
const marketData = ref({
  shanghai: { index: '--', change: 0, changePercent: 0, source: '' },
  shenzhen: { index: '--', change: 0, changePercent: 0, source: '' },
  chinext: { index: '--', change: 0, changePercent: 0, source: '' },
  date: ''
})

const SOURCE_LABELS = { snapshot: '快照', daily: '日K' }
const sourceLabel = (source) => SOURCE_LABELS[source] || ''

const marketSourceLabel = computed(() => {
  const sources = ['shanghai', 'shenzhen', 'chinext']
    .map(key => marketData.value[key]?.source)
    .filter(Boolean)
  if (!sources.length) return ''
  const unique = [...new Set(sources)]
  return unique.length === 1 ? sourceLabel(unique[0]) : '混合'
})

// 指数K线数据源：由 KLineChart 透传后端 meta，随指数/周期切换更新
const klineMeta = ref(null)
const klineSourceLabel = computed(() => sourceLabel(klineMeta.value?.latestSource))
const onKlineLoaded = (meta) => { klineMeta.value = meta }

onMounted(async () => {
  // 1. 立即从 localStorage 加载上次缓存的指数数据（避免页面空白）
  loadCachedMarketData()
  initKlineHeight()
  loading.value = true
  try {
    await fetchMarketOverview()
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
})

/** 从 localStorage 读取上次缓存的指数数据，立即渲染（stale-while-revalidate） */
const loadCachedMarketData = () => {
  try {
    const cached = localStorage.getItem('dashboard_market_data_v2')
    if (cached) {
      marketData.value = JSON.parse(cached)
    }
  } catch (_) { /* ignore parse errors */ }
}

/** 将指数数据写入 localStorage（供下次启动 stale 展示） */
const saveMarketDataToCache = () => {
  try {
    localStorage.setItem('dashboard_market_data_v2', JSON.stringify(marketData.value))
  } catch (_) { /* ignore quota errors */ }
}

const fetchMarketOverview = async () => {
  try {
    await stockStore.fetchMarketOverview()
    const list = stockStore.marketOverview?.data || []
    const find = (kw) => list.find(m =>
      (m.name || '').includes(kw) || String(m.code || '').startsWith(kw)
    )
    const sh = find('上证') || find('000001')
    const sz = find('深证') || find('399001')
    const cy = find('创业') || find('399006')
    // 仅当新数据有值时才更新（否则保持缓存数据不变）
    if (sh || sz || cy) {
      marketData.value = {
        shanghai: { index: sh?.price ?? '--', change: sh?.change ?? 0, changePercent: sh?.changePercent ?? 0, source: sh?.source || '' },
        shenzhen: { index: sz?.price ?? '--', change: sz?.change ?? 0, changePercent: sz?.changePercent ?? 0, source: sz?.source || '' },
        chinext: { index: cy?.price ?? '--', change: cy?.change ?? 0, changePercent: cy?.changePercent ?? 0, source: cy?.source || '' },
        // 最新日期：旧缓存/旧后端可能没有该字段，取不到时保留原值（空则模板隐藏）
        date: sh?.date || sz?.date || cy?.date || marketData.value.date || ''
      }
      saveMarketDataToCache()
    }
  } catch (error) {
    console.error('获取市场概况失败:', error)
  }
}

const getChangeClass = (change) => {
  if (change > 0) return 'stock-up'
  if (change < 0) return 'stock-down'
  return 'stock-flat'
}

const formatChange = (change) => {
  // 后端可能返回字符串型数字或缓存形状不匹配时为 undefined，直接 .toFixed 会抛 TypeError
  // 让整页渲染崩溃（叠加 Electron 深色窗口背景 = 黑屏）。Number 强制转换 + isFinite 兜底。
  const n = Number(change)
  if (!isFinite(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}`
}

const formatPercent = (percent) => {
  const n = Number(percent)
  if (!isFinite(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

// 指数K线
const indexTabs = [
  { code: '000001', name: '上证指数' },
  { code: '399001', name: '深证成指' },
  { code: '399006', name: '创业板指' }
]
const activeIndex = ref('000001')

// 切换指数时 KLineChart 会重建，先清空旧 meta，避免来源标签短暂显示上一指数的数据
watch(activeIndex, () => { klineMeta.value = null })

// ---- 指数K线卡片高度拖拽（持久化到 localStorage，与 Watchlist 分栏拖拽同模式）----
// 需求：卡片高度可自由调节。上限仅作防御性封顶（防止拖出远超视口的不可用状态），
// 下限保护图表可读性；高度变化由 KLineChart 内置 ResizeObserver 自动触发 chart.resize()。
const KLINE_HEIGHT_KEY = 'dashboard_kline_height'
const KLINE_HEIGHT_DEFAULT = 400
const KLINE_HEIGHT_MIN = 240
const KLINE_HEIGHT_MAX = 1400

const klineHeight = ref(KLINE_HEIGHT_DEFAULT)
let klineDragging = false
let klineStartY = 0
let klineStartHeight = 0

/** 读取持久化高度；缺失/越界（视为损坏）回落默认值 */
const initKlineHeight = () => {
  const saved = Number(localStorage.getItem(KLINE_HEIGHT_KEY))
  if (Number.isFinite(saved) && saved >= KLINE_HEIGHT_MIN && saved <= KLINE_HEIGHT_MAX) {
    klineHeight.value = Math.round(saved)
  }
}

const startKlineDrag = (e) => {
  klineDragging = true
  klineStartY = e.clientY
  klineStartHeight = klineHeight.value
  document.addEventListener('mousemove', onKlineDrag)
  document.addEventListener('mouseup', stopKlineDrag)
  document.body.style.userSelect = 'none' // 拖拽期间禁止选中文本
}

const onKlineDrag = (e) => {
  if (!klineDragging) return
  let h = klineStartHeight + (e.clientY - klineStartY)
  if (h < KLINE_HEIGHT_MIN) h = KLINE_HEIGHT_MIN
  if (h > KLINE_HEIGHT_MAX) h = KLINE_HEIGHT_MAX
  klineHeight.value = Math.round(h)
}

const stopKlineDrag = () => {
  if (!klineDragging) return
  klineDragging = false
  document.removeEventListener('mousemove', onKlineDrag)
  document.removeEventListener('mouseup', stopKlineDrag)
  document.body.style.userSelect = ''
  localStorage.setItem(KLINE_HEIGHT_KEY, String(klineHeight.value))
}

/** 双击手柄复位默认高度 */
const resetKlineHeight = () => {
  klineHeight.value = KLINE_HEIGHT_DEFAULT
  localStorage.setItem(KLINE_HEIGHT_KEY, String(KLINE_HEIGHT_DEFAULT))
}

onUnmounted(() => {
  // 拖拽中途切走路由会留下悬挂监听，需清理（同 Watchlist 处理）
  document.removeEventListener('mousemove', onKlineDrag)
  document.removeEventListener('mouseup', stopKlineDrag)
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <p class="page-description">股票复盘分析平台概览</p>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <!-- 市场概况 -->
      <el-col :span="24" class="mb-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="market-title">
                <span>市场概况</span>
                <!-- 最新交易日：与指数数值同属一个交易日的口径，避免"数据是哪天的"歧义 -->
                <span v-if="marketData.date" class="market-date">{{ marketData.date }}</span>
                <!-- 数据来源：快照/日K，三指数不一致时显示混合 -->
                <el-tag v-if="marketSourceLabel" size="small" type="info" effect="plain">{{ marketSourceLabel }}</el-tag>
              </div>
              <el-tag type="success" v-if="stockStore.isMarketOpen">交易中</el-tag>
              <el-tag type="info" v-else>休市</el-tag>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="market-item">
                <div class="market-name">上证指数</div>
                <div class="market-value">{{ marketData.shanghai.index }}</div>
                <div class="market-change" :class="getChangeClass(marketData.shanghai.change)">
                  {{ formatChange(marketData.shanghai.change) }}
                  ({{ formatPercent(marketData.shanghai.changePercent) }})
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="market-item">
                <div class="market-name">深证成指</div>
                <div class="market-value">{{ marketData.shenzhen.index }}</div>
                <div class="market-change" :class="getChangeClass(marketData.shenzhen.change)">
                  {{ formatChange(marketData.shenzhen.change) }}
                  ({{ formatPercent(marketData.shenzhen.changePercent) }})
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="market-item">
                <div class="market-name">创业板指</div>
                <div class="market-value">{{ marketData.chinext.index }}</div>
                <div class="market-change" :class="getChangeClass(marketData.chinext.change)">
                  {{ formatChange(marketData.chinext.change) }}
                  ({{ formatPercent(marketData.chinext.changePercent) }})
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <!-- 指数K线 -->
      <el-col :span="24" class="mb-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="market-title">
                <span>指数K线</span>
                <!-- 末根K线来源：盘中跟随快照、盘后跟随日K -->
                <el-tag v-if="klineSourceLabel" size="small" type="info" effect="plain" :title="klineMeta?.latestDate || ''">
                  {{ klineSourceLabel }}
                </el-tag>
              </div>
              <el-radio-group v-model="activeIndex" size="small">
                <el-radio-button
                  v-for="idx in indexTabs"
                  :key="idx.code"
                  :value="idx.code"
                >{{ idx.name }}</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <KLineChart
            :key="activeIndex"
            :stock-code="activeIndex"
            :is-index="true"
            :show-period-switcher="true"
            :show-adjust-switcher="false"
            :show-drawing-tools="false"
            :show-volume="true"
            :height="klineHeight + 'px'"
            @loaded="onKlineLoaded"
          />
          <!-- 高度拖拽手柄：整条可拖，grip 仅视觉提示；双击复位默认高度 -->
          <div
            class="kline-resize-handle"
            title="拖拽调节高度，双击复位（默认 400px）"
            @mousedown="startKlineDrag"
            @dblclick="resetKlineHeight"
          >
            <div class="kline-resize-grip"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.market-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.market-date {
  font-size: 13px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.market-item {
  text-align: center;
  padding: 10px;
}

.market-name {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.market-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.market-change {
  font-size: 14px;
  font-weight: 500;
}

/* 指数K线高度拖拽手柄：cursor ns-resize 提示可上下拖拽 */
.kline-resize-handle {
  height: 16px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
}

.kline-resize-grip {
  width: 64px;
  height: 4px;
  border-radius: 2px;
  background: var(--el-border-color);
  transition: background 0.2s;
}

.kline-resize-handle:hover .kline-resize-grip,
.kline-resize-handle:active .kline-resize-grip {
  background: var(--el-color-primary);
}

@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
}
</style>