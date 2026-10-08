<template>
  <div class="kline-chart-container">
    <!-- 工具栏 -->
    <div class="kline-toolbar" v-if="hasToolbar">
      <!-- 周期切换 -->
      <div class="toolbar-group" v-if="showPeriodSwitcher">
        <button
          v-for="p in periodOptions"
          :key="p.value"
          :class="{ active: currentPeriod === p.value }"
          @click="switchPeriod(p.value)"
        >{{ p.label }}</button>
      </div>

      <!-- 复权切换 -->
      <div class="toolbar-group" v-if="showAdjustSwitcher">
        <button
          v-for="a in adjustOptions"
          :key="a.value"
          :class="{ active: currentAdjust === a.value }"
          @click="switchAdjust(a.value)"
        >{{ a.label }}</button>
      </div>

      <!-- 副图指标切换 -->
      <div class="toolbar-group" v-if="showIndicatorBar">
        <span class="toolbar-label">副图:</span>
        <button
          v-for="ind in subIndicatorOptions"
          :key="ind.value"
          :class="{ active: currentSubIndicator === ind.value }"
          @click="switchSubIndicator(ind.value)"
        >{{ ind.label }}</button>
      </div>

      <!-- 画线工具 -->
      <div class="toolbar-group" v-if="showDrawingTools">
        <span class="toolbar-label">画线:</span>
        <button
          v-for="tool in drawingTools"
          :key="tool.name"
          :class="{ active: activeOverlay === tool.name }"
          @click="startDrawing(tool.name)"
          :title="tool.label"
        >{{ tool.label }}</button>
        <button class="clear-btn" @click="clearOverlays" title="清除所有画线">清除</button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div ref="chartRef" class="kline-chart-dom" :style="{ height: typeof height === 'number' ? height + 'px' : height }"></div>
  </div>
</template>

<script setup>
/**
 * KLineChart —— 基于 KLineCharts v10 的通用 K 线组件
 *
 * 设计理由：KLineCharts 专为金融 K 线设计，内置指标（MA/MACD/KDJ/RSI/BIAS/BOLL 等）
 * 与画线工具（趋势线/水平线/斐波那契等），开箱即用。相比手写 ECharts 蜡烛图，
 * 指标计算零出错、画线工具免开发、十字光标价格轴标签自带。
 *
 * 数据流：init → setSymbol → setPeriod → setDataLoader（getBars 拉取后端数据）
 * 当 customDataLoader 提供时（实战训练渐进揭示），覆盖默认 getBars。
 */
import { init, dispose } from 'klinecharts'
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { getStockKLine, getIndexKLine } from '@/services/stock.service'
import { toKLineDataList, periodToKLine } from '@/utils/klineData'

const props = defineProps({
  /** 股票/指数代码 */
  stockCode: { type: String, required: true },
  /** 周期 'daily'|'weekly'|'monthly'，支持 .sync */
  period: { type: String, default: 'daily' },
  /** 复权 'qfq'|'hfq'|''，支持 .sync */
  adjust: { type: String, default: 'qfq' },
  /** 容器高度 */
  height: { type: [String, Number], default: '600px' },
  /** 显示成交量副图 */
  showVolume: { type: Boolean, default: true },
  /** 显示周期切换按钮 */
  showPeriodSwitcher: { type: Boolean, default: true },
  /** 显示复权切换 */
  showAdjustSwitcher: { type: Boolean, default: false },
  /** 显示画线工具栏 */
  showDrawingTools: { type: Boolean, default: false },
  /** 显示指标栏（主图MA + 副图MACD/KDJ切换） */
  showIndicatorBar: { type: Boolean, default: true },
  /** 主图均线周期列表 */
  maPeriods: { type: Array, default: () => [5, 10, 20, 30] },
  /** 默认副图指标 */
  defaultSubIndicator: { type: String, default: 'MACD' },
  /** 自定义 dataLoader（覆盖默认 API 调用，给实战训练渐进揭示用） */
  customDataLoader: { type: Object, default: null },
  /** 主题 'light'|'dark' */
  theme: { type: String, default: 'light' },
  /** 是否为指数（true 时调用 index-kline 接口，false 时调用个股 kline 接口） */
  isIndex: { type: Boolean, default: false }
})

const emit = defineEmits(['update:period', 'update:adjust', 'ready'])

// ---- 响应式状态 ----
const chartRef = ref(null)
let chart = null
const currentPeriod = ref(props.period)
const currentAdjust = ref(props.adjust)
const currentSubIndicator = ref(props.defaultSubIndicator)
const activeOverlay = ref(null)

// 当前股票代码快照（用于 setDataLoader 闭包，避免异步竞态）
let activeCode = props.stockCode

// ---- 常量配置 ----
const periodOptions = [
  { value: 'daily', label: '日K' },
  { value: 'weekly', label: '周K' },
  { value: 'monthly', label: '月K' }
]

const adjustOptions = [
  { value: 'qfq', label: '前复权' },
  { value: 'hfq', label: '后复权' }
]

const subIndicatorOptions = [
  { value: 'MACD', label: 'MACD' },
  { value: 'KDJ', label: 'KDJ' },
  { value: 'RSI', label: 'RSI' },
  { value: 'BIAS', label: 'BIAS' },
  { value: 'BOLL', label: 'BOLL' },
  { value: 'NONE', label: '无' }
]

// 画线工具：KLineCharts 内置 overlay 类型名
const drawingTools = [
  { name: 'horizontalStraightLine', label: '水平线' },
  { name: 'verticalStraightLine', label: '竖直线' },
  { name: 'straightLine', label: '趋势线' },
  { name: 'parallelStraightLine', label: '平行通道' },
  { name: 'priceChannelLine', label: '价格通道' },
  { name: 'fibonacciLine', label: '斐波那契' },
  { name: 'simpleAnnotation', label: '文字' },
  { name: 'rect', label: '矩形' }
]

const hasToolbar = computed(() =>
  props.showPeriodSwitcher || props.showAdjustSwitcher ||
  props.showIndicatorBar || props.showDrawingTools
)

// ---- 主题样式 ----
function buildStyles() {
  const isDark = props.theme === 'dark'
  const bg = isDark ? '#1e1e1e' : '#ffffff'
  const gridColor = isDark ? '#2a2a2a' : '#ececec'
  const textColor = isDark ? '#999' : '#333'
  // A股习惯：红涨绿跌
  const up = '#ef4f4f'
  const down = '#18aa3f'
  return {
    grid: {
      horizontal: { color: gridColor },
      vertical: { color: gridColor }
    },
    candle: {
      type: 'candle_solid',
      tooltip: { showRule: 'always' },
      bar: {
        upColor: up,
        downColor: down,
        noChangeColor: '#888'
      },
      priceMark: {
        last: {
          show: true,
          upColor: up,
          downColor: down
        }
      }
    },
    xAxis: {
      axisLine: { color: gridColor },
      tickText: { color: textColor }
    },
    yAxis: {
      axisLine: { color: gridColor },
      tickText: { color: textColor }
    },
    crosshair: {
      horizontal: {
        line: { color: isDark ? '#555' : '#888' },
        text: { backgroundColor: '#777' }
      },
      vertical: {
        line: { color: isDark ? '#555' : '#888' },
        text: { backgroundColor: '#777' }
      }
    },
    indicator: {
      lines: [
        { color: '#ff9900' },
        { color: '#0066ff' },
        { color: '#ff6600' },
        { color: '#33cc33' },
        { color: '#cc66cc' }
      ]
    }
  }
}

// ---- 构建 dataLoader ----
function buildDataLoader() {
  // 自定义 loader：实战训练渐进揭示场景
  if (props.customDataLoader && typeof props.customDataLoader.getBars === 'function') {
    return props.customDataLoader
  }

  // 默认 loader：调用后端 API
  return {
    async getBars({ type, timestamp, callback }) {
      try {
        const code = activeCode
        // init: 拉最近 N 根；forward: 向左加载更早数据
        const today = new Date()
        const end = today.toISOString().slice(0, 10).replace(/-/g, '')
        // 根据是否为指数选择 API
        const fetchFn = props.isIndex ? getIndexKLine : getStockKLine

        if (type === 'init') {
          // 默认拉取近 500 个交易日（约 2 年）
          const start = new Date()
          start.setDate(start.getDate() - 900)
          const startDate = start.toISOString().slice(0, 10).replace(/-/g, '')
          const resp = await fetchFn(code, {
            period: currentPeriod.value,
            adjust: currentAdjust.value,
            startDate,
            endDate: end
          })
          const bars = toKLineDataList(resp || [])
          callback(bars, { forward: true, backward: false })
        } else if (type === 'forward') {
          // 向左分页：以当前最早时间戳为终点往前拉
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 2500)
          const startDateStr = startDate.toISOString().slice(0, 10).replace(/-/g, '')
          const endDateStr = new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '')
          const resp = await fetchFn(code, {
            period: currentPeriod.value,
            adjust: currentAdjust.value,
            startDate: startDateStr,
            endDate: endDateStr
          })
          const bars = toKLineDataList(resp || [])
          // 去掉与已有数据重叠的最后一根
          const filtered = bars.filter(b => b.timestamp < timestamp)
          callback(filtered, { forward: filtered.length >= 200, backward: false })
        } else {
          callback([], { forward: false, backward: false })
        }
      } catch (e) {
        console.error('[KLineChart] getBars failed:', e)
        callback([], { forward: false, backward: false })
      }
    }
  }
}

// ---- 指标管理 ----
const VOL_PANE = 'pane_vol'
const SUB_PANE = 'pane_sub'

function setupIndicators() {
  if (!chart) return

  // 主图均线：MA 指标支持自定义周期参数
  if (props.maPeriods && props.maPeriods.length > 0) {
    chart.createIndicator({
      name: 'MA',
      calcParams: props.maPeriods
    }, true, 'candle_pane')
  }

  // 成交量副图
  if (props.showVolume) {
    chart.createIndicator('VOL', false, VOL_PANE)
  }

  // 技术指标副图
  if (props.defaultSubIndicator && props.defaultSubIndicator !== 'NONE') {
    chart.createIndicator(props.defaultSubIndicator, false, SUB_PANE)
  }
}

function switchSubIndicator(name) {
  currentSubIndicator.value = name
  if (!chart) return
  // 先移除旧副图指标
  chart.removeIndicator(SUB_PANE)
  if (name !== 'NONE') {
    chart.createIndicator(name, false, SUB_PANE)
  }
}

// ---- 画线工具 ----
function startDrawing(overlayName) {
  if (!chart) return
  // 切换工具：再次点击同一工具则取消
  if (activeOverlay.value === overlayName) {
    activeOverlay.value = null
    return
  }
  activeOverlay.value = overlayName
  // createOverlay 传入名称字符串，图表进入交互绘制模式
  chart.createOverlay(overlayName)
}

function clearOverlays() {
  if (!chart) return
  chart.removeOverlay()
  activeOverlay.value = null
}

// ---- 周期/复权切换 ----
function switchPeriod(p) {
  currentPeriod.value = p
  emit('update:period', p)
  if (!chart) return
  chart.setPeriod(periodToKLine(p))
  // setPeriod 会自动重新触发 getBars(init)
}

function switchAdjust(a) {
  currentAdjust.value = a
  emit('update:adjust', a)
  if (!chart) return
  // 复权变更需重新拉数据：resetData 重走 getBars pipeline
  chart.resetData()
}

// ---- 初始化 ----
function initChart() {
  if (!chartRef.value) return
  chart = init(chartRef.value, { styles: buildStyles() })

  activeCode = props.stockCode
  chart.setSymbol({ ticker: props.stockCode })
  chart.setPeriod(periodToKLine(currentPeriod.value))
  chart.setDataLoader(buildDataLoader())

  // 延迟设置指标，确保主图 pane 已创建
  requestAnimationFrame(() => setupIndicators())

  emit('ready', chart)
}

// ---- 生命周期 ----
onMounted(() => {
  initChart()
  // ResizeObserver 响应容器变化
  resizeObserver = new ResizeObserver(() => {
    if (chart) chart.resize()
  })
  resizeObserver.observe(chartRef.value)
})

let resizeObserver = null

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chart) {
    dispose(chartRef.value)
    chart = null
  }
})

// ---- watch：代码变化时重新初始化 ----
watch(() => props.stockCode, (newCode) => {
  if (!chart || !newCode) return
  activeCode = newCode
  chart.setSymbol({ ticker: newCode })
  // setSymbol 自动重走 getBars(init)
})

watch(() => props.theme, () => {
  if (chart) chart.setStyles(buildStyles())
})

// ---- 暴露方法 ----
defineExpose({
  /** 获取 KLineCharts 实例 */
  getInstance: () => chart,
  /** 重置数据（重新触发 getBars） */
  resetData: () => { if (chart) chart.resetData() },
  /** 创建 overlay（画线） */
  createOverlay: (opts) => chart?.createOverlay(opts),
  /** 移除 overlay */
  removeOverlay: (filter) => chart?.removeOverlay(filter),
  /** 创建指标 */
  createIndicator: (name, isStack, paneId) => chart?.createIndicator(name, isStack, paneId),
  /** 移除指标 */
  removeIndicator: (paneId) => chart?.removeIndicator(paneId),
  /** 重置图表（完全重建） */
  rebuild: () => {
    if (chart) {
      dispose(chartRef.value)
      chart = null
    }
    initChart()
  },
  /** 切换副图指标 */
  setSubIndicator: (name) => switchSubIndicator(name)
})
</script>

<style scoped>
.kline-chart-container {
  width: 100%;
}

.kline-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  flex-wrap: wrap;
  border-bottom: 1px solid #ececec;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-label {
  font-size: 13px;
  color: #888;
  margin-right: 2px;
}

.kline-toolbar button {
  padding: 3px 10px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.15s;
}

.kline-toolbar button:hover {
  border-color: #409eff;
  color: #409eff;
}

.kline-toolbar button.active {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.kline-toolbar .clear-btn {
  margin-left: 4px;
  color: #f56c6c;
  border-color: #fbc4c4;
}

.kline-toolbar .clear-btn:hover {
  background-color: #f56c6c;
  color: #fff;
}

.kline-chart-dom {
  width: 100%;
}
</style>
