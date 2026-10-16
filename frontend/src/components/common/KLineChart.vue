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
 * 设计理由：KLineCharts 专为金融 K 线设计，内置 VOL 成交量副图
 * 与画线工具（趋势线/水平线/斐波那契等），开箱即用。相比手写 ECharts 蜡烛图，
 * 成交量计算零出错、画线工具免开发、十字光标价格轴标签自带。
 *
 * 副图策略：本项目仅保留成交量 VOL（showVolume 控制），不提供 MACD/KDJ/RSI/BIAS/BOLL 等副图切换。
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
  /** 主图均线周期列表（空数组=不显示MA） */
  maPeriods: { type: Array, default: () => [] },
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
  props.showPeriodSwitcher || props.showAdjustSwitcher || props.showDrawingTools
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
      // candle_up_stroke: 阳线(上涨)空心描边、阴线(下跌)实心填充
      // A股惯例：红涨空心阳线、绿跌实心阴线
      // type 必须为 KLineCharts 合法枚举（candle_solid|candle_stroke|candle_up_stroke|
      // candle_down_stroke|ohlc|area）；非法值会让蜡烛层 switch 无命中，静默不绘制任何蜡烛
      type: 'candle_up_stroke',
      tooltip: { showRule: 'always' },
      bar: {
        upColor: up,
        downColor: down,
        noChangeColor: '#888',
        // 空心蜡烛只描边，边界/影线颜色须显式设置，否则沿用库默认的西式绿涨红跌
        upBorderColor: up,
        downBorderColor: down,
        noChangeBorderColor: '#888',
        upWickColor: up,
        downWickColor: down,
        noChangeWickColor: '#888'
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
        // 日期一律用本地日历格式化：toISOString 走 UTC，东八区凌晨会整体回退一天
        const toCompactDate = (ms) => {
          const d = new Date(ms)
          const p = n => String(n).padStart(2, '0')
          return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
        }
        const end = toCompactDate(Date.now())
        // 根据是否为指数选择 API
        const fetchFn = props.isIndex ? getIndexKLine : getStockKLine

        if (type === 'init') {
          // 默认拉取近 900 个自然日（约 2.5 年）
          const startDate = toCompactDate(Date.now() - 900 * 86400000)
          const resp = await fetchFn(code, {
            period: currentPeriod.value,
            adjust: currentAdjust.value,
            startDate,
            endDate: end
          })
          const bars = toKLineDataList(resp?.data || [])
          callback(bars, { forward: true, backward: false })
        } else if (type === 'forward') {
          // 向左分页：以当前最早 bar 的时间戳为锚，向前取 2500 天窗口。
          // 不能用"今天 - 2500 天"：那样窗口起点永远锚在当天，越过约 6.8 年后
          // 请求区间无法再前移，历史被硬性截断（与滚动位置无关）。
          const startDateStr = toCompactDate(timestamp - 2500 * 86400000)
          const endDateStr = toCompactDate(timestamp)
          const resp = await fetchFn(code, {
            period: currentPeriod.value,
            adjust: currentAdjust.value,
            startDate: startDateStr,
            endDate: endDateStr
          })
          const bars = toKLineDataList(resp?.data || [])
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
// paneId 由本组件控制（v10 不再接受 createIndicator 的第 3 个参数，必须写进 value 对象）
const VOL_PANE = 'pane_vol'

function setupIndicators() {
  if (!chart) return

  // 主图均线：MA 叠加在蜡烛图主 pane（'candle_pane'）上
  if (props.maPeriods && props.maPeriods.length > 0) {
    chart.createIndicator({
      name: 'MA',
      calcParams: props.maPeriods,
      paneId: 'candle_pane'
    }, true)
  }

  // 成交量副图（独立 pane）——本项目仅保留 VOL，不提供 MACD/KDJ 等副图
  if (props.showVolume) {
    chart.createIndicator({ name: 'VOL', paneId: VOL_PANE })
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
  // setDataLoader 必须先于 setSymbol：setSymbol/setPeriod 都会触发一次 getBars(init)，
  // 若此时仍是 v10 内置默认 loader（走外网 CDN 示例数据），离线环境必然拉取失败；
  // setDataLoader 内部会 resetData 重新触发加载，故先装 loader 可省掉这次无效外联。
  chart.setDataLoader(buildDataLoader())
  chart.setSymbol({ ticker: props.stockCode })
  chart.setPeriod(periodToKLine(currentPeriod.value))

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
  }
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
