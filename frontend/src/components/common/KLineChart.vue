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

    <!-- 图表容器；外层 wrap 为自定义悬浮窗提供绝对定位参照系 -->
    <div class="kline-chart-wrap">
      <div ref="chartRef" class="kline-chart-dom" :style="{ height: typeof height === 'number' ? height + 'px' : height }"></div>
      <!-- OHLCV 悬浮窗：仅悬停绘图区时显示、固定于鼠标右下方（越界自动翻转） -->
      <div ref="tipRef" class="kline-tip" v-show="tipVisible" :style="tipStyle">
        <div class="kline-tip-row" v-for="row in tipRows" :key="row.label">
          <span class="kline-tip-label">{{ row.label }}</span>
          <span class="kline-tip-value">{{ row.value }}</span>
        </div>
      </div>
      <!-- MA 图例：点击切换对应均线显示/隐藏；置于图表左上角（库内置图例已停用） -->
      <div v-if="maPeriods.length > 0" class="kline-ma-legend">
        <span
          v-for="(p, i) in maPeriods"
          :key="p"
          class="kline-ma-item"
          :class="{ off: hiddenMa.has(p) }"
          :style="{ color: hiddenMa.has(p) ? '#aaa' : MA_COLORS[i % MA_COLORS.length] }"
          @click="toggleMa(p)"
        >MA{{ p }}<i class="kline-ma-val">{{ maValues[p] || '--' }}</i></span>
      </div>
    </div>
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
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue'
import { getStockKLine, getIndexKLine } from '@/services/stock.service'
import { toKLineDataList, periodToKLine } from '@/utils/klineData'
import { formatPrice, formatVolume } from '@/utils/stock'

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
  /** 主图均线周期列表（默认六条均线 5/10/20/60/120/250，各周期统一按根数计算；传 [] 可关闭） */
  maPeriods: { type: Array, default: () => [5, 10, 20, 60, 120, 250] },
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
// 图表容器 DOM 引用：onMounted 保存、onUnmounted 取用（此时 chartRef 可能已置空）
let chartEl = null
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
      tooltip: {
        // 停用库内置 tooltip：内置 rect 模式 X 会自动左右翻转、Y 垂直居中，
        // 做不到「固定鼠标右下方」，且标签无法中文化。改由本组件自绘 HTML
        // 悬浮窗（见下方「OHLCV 悬浮信息窗」段），避免两套提示同屏。
        showRule: 'none'
      },
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
      // VOL 量柱配色须与蜡烛一致（A股红涨绿跌）：klinecharts 指标柱默认绿涨红跌（西式
      // alphaGreen/alphaRed），不显式覆盖会出现"红K配绿柱"的反色。样式做深合并，
      // 只给色值即可继承默认的 fill/border 形态。
      bars: [
        { upColor: up, downColor: down, noChangeColor: '#888' }
      ],
      lines: MA_COLORS.map(color => ({ color })),
      tooltip: {
        // 库内置均线图例已被 stripMaLegend() 清空标题、改由自绘图例（.kline-ma-legend）取代；
        // showParams:false 仅作兜底（万一清空失效时不给图例顶上加冗长参数前缀）
        title: { showParams: false }
      }
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

// 主图 6 条均线颜色，按 maPeriods 顺序：MA5黑/MA10黄/MA20紫/MA60绿/MA120蓝/MA250红。
// 库按「线序号 % 色板长度」取 indicator.styles.lines 的色值，故数组长度须 ≥ 均线条数
// （否则后面的线回绕复用前面的颜色）。
const MA_COLORS = ['#000000', '#e6a23c', '#9c27b0', '#4caf50', '#2196f3', '#f44336']

// 均线显示/隐藏集合（周期号为键）与图例值（周期号 → '--' 或 两位小数文本）
const hiddenMa = ref(new Set())
const maValues = ref({})
// 最近十字光标所在数据索引：未悬停时为 null，图例取值回退到最后一根
const tipIndex = ref(null)

function setupIndicators() {
  if (!chart) return

  // 主图均线：MA 叠加在蜡烛图主 pane（'candle_pane'）上
  if (props.maPeriods && props.maPeriods.length > 0) {
    chart.createIndicator({
      name: 'MA',
      calcParams: props.maPeriods,
      paneId: 'candle_pane'
    }, true)
    // 库内置均线图例不可点击，改由组件自绘（见 .kline-ma-legend）：
    // 先清空库图例标题，再按隐藏集合应用线条颜色，最后刷一版图例值
    stripMaLegend()
    applyMaVisibility()
    updateMaLegend()
  }

  // 成交量副图（独立 pane）——本项目仅保留 VOL，不提供 MACD/KDJ 等副图
  if (props.showVolume) {
    chart.createIndicator({ name: 'VOL', paneId: VOL_PANE })
  }
}

// ---- MA 图例与显隐 ----
// 移除库内置 MA 图例标题：IndicatorTooltipView 只渲染 figure.title 为字符串的条目，
// 清空 title 后线照常绘制但不再出现在库图例中；VOL 是独立 pane 的图例，不受影响
function stripMaLegend() {
  const inds = chart.getIndicators({ paneId: 'candle_pane', name: 'MA' })
  if (!inds || !inds.length) return
  chart.overrideIndicator({
    paneId: 'candle_pane',
    name: 'MA',
    figures: inds[0].figures.map(f => ({ ...f, title: undefined }))
  })
}

// 按 hiddenMa 集合重设 MA 每条线的颜色，隐藏项置 transparent：
// overrideIndicator 的 merge 对数组整体替换（clone 覆盖），故每次传完整 6 色
function applyMaVisibility() {
  const lines = props.maPeriods.map((p, i) => ({
    color: hiddenMa.value.has(p) ? 'transparent' : MA_COLORS[i % MA_COLORS.length]
  }))
  chart.overrideIndicator({
    paneId: 'candle_pane',
    name: 'MA',
    styles: { lines }
  })
}

// 图例值：取十字光标所在 bar（未悬停取最后一根）的 MA 指标 result，
// 与图内线条同源（同一份 calc 结果），只格式化不重复计算
function updateMaLegend() {
  if (!chart) return
  const inds = chart.getIndicators({ paneId: 'candle_pane', name: 'MA' })
  const ind = inds && inds[0]
  const list = chart.getDataList()
  if (!ind || !list || !list.length) return
  const idx = tipIndex.value != null ? tipIndex.value : list.length - 1
  const res = ind.result && ind.result[idx] ? ind.result[idx] : {}
  const next = {}
  props.maPeriods.forEach((p, i) => {
    const v = res[`ma${i + 1}`]
    next[p] = typeof v === 'number' ? v.toFixed(2) : '--'
  })
  maValues.value = next
}

// 图例点击切换均线显隐：更新集合 → 重设线条颜色 → 刷新图例
function toggleMa(p) {
  const next = new Set(hiddenMa.value)
  if (next.has(p)) next.delete(p)
  else next.add(p)
  hiddenMa.value = next
  applyMaVisibility()
  updateMaLegend()
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

// ---- OHLCV 悬浮信息窗（自定义 HTML）----
// 设计理由：库内置 rect tooltip 无法同时满足「标签中文」与「固定鼠标右下角」——
// 内置 pointer 模式 X 会自动左右翻转、Y 垂直居中。故将 candle.tooltip 置
// showRule:'none' 停用内置方案，改由本组件实现：数据来源取十字光标回调
// （onCrosshairChange → 光标 x 反查数据索引），定位来源取原生 mousemove 像素坐标。
const tipRef = ref(null)
const tipVisible = ref(false)
const tipData = ref(null)
const tipStyle = ref({ left: '0px', top: '0px' })

// 窗口相对鼠标的偏移（右下方），避免压住光标与当前蜡烛
const TIP_OFFSET_X = 16
const TIP_OFFSET_Y = 18

// 元素尚未渲染时定位兜底用的估算尺寸
const TIP_FALLBACK_W = 150
const TIP_FALLBACK_H = 130

// 最近一次鼠标位置（相对图表容器，与库十字光标 x/y 同坐标系）
let tipMouseX = 0
let tipMouseY = 0

// 十字光标活跃标志：鼠标位于绘图区时回调随每次移动触发；悬停坐标轴/分隔条时
// DOM mousemove 仍触发但回调不再来——以「本轮 mousemove 前是否收到回调」
// 判断鼠标是否在绘图区，不在则隐藏悬浮窗。
let crosshairTick = false

// 悬浮窗文本：中文标签，价格两位小数，成交量按万/亿压缩（复用全站格式化函数）
const tipRows = computed(() => {
  const d = tipData.value
  if (!d) return []
  const dt = new Date(d.timestamp)
  const p = n => String(n).padStart(2, '0')
  const dateStr = `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
  return [
    { label: '时间', value: dateStr },
    { label: '开盘', value: formatPrice(d.open) },
    { label: '最高', value: formatPrice(d.high) },
    { label: '最低', value: formatPrice(d.low) },
    { label: '收盘', value: formatPrice(d.close) },
    { label: '成交量', value: formatVolume(d.volume) }
  ]
})

// 按实际渲染尺寸定位：默认鼠标右下方；右缘/下缘溢出时翻转到鼠标左上方，
// 保证窗口始终完整可见（nextTick 后测量，首帧即准确）
function placeTip() {
  const el = tipRef.value
  if (!el) return
  const w = el.offsetWidth || TIP_FALLBACK_W
  const h = el.offsetHeight || TIP_FALLBACK_H
  const cw = chartEl ? chartEl.clientWidth : 0
  const ch = chartEl ? chartEl.clientHeight : 0
  let left = tipMouseX + TIP_OFFSET_X
  if (left + w > cw) left = tipMouseX - TIP_OFFSET_X - w
  let top = tipMouseY + TIP_OFFSET_Y
  if (top + h > ch) top = tipMouseY - TIP_OFFSET_Y - h
  tipStyle.value = { left: `${Math.max(0, left)}px`, top: `${Math.max(0, top)}px` }
}

function handleMouseMove(e) {
  if (!chartEl) return
  const rect = chartEl.getBoundingClientRect()
  tipMouseX = e.clientX - rect.left
  tipMouseY = e.clientY - rect.top
  if (!crosshairTick) {
    // 本轮移动未收到十字光标回调 → 鼠标不在绘图区
    tipVisible.value = false
    tipIndex.value = null
    tipData.value = null
    updateMaLegend()
    return
  }
  crosshairTick = false
  tipVisible.value = true
  nextTick(placeTip)
}

function handleMouseLeave() {
  tipVisible.value = false
  tipIndex.value = null
  tipData.value = null
  updateMaLegend()
}

// 十字光标回调：以光标 x 反查数据索引（x 与十字光标同一坐标空间）；
// convertFromPixel 对越界坐标不钳制，需手动 clamp 到有效区间
function handleCrosshairChange(crosshair) {
  if (!chart || !crosshair) return
  crosshairTick = true
  const list = chart.getDataList()
  if (!list || !list.length) return
  const res = chart.convertFromPixel([{ x: crosshair.x }], { paneId: 'candle_pane' })
  const rawIndex = res && res.length ? res[0].dataIndex : -1
  const index = Math.min(Math.max(rawIndex, 0), list.length - 1)
  tipData.value = list[index]
  tipIndex.value = index
  updateMaLegend()
}

// ---- 初始化 ----
function initChart() {
  if (!chartRef.value) return
  chart = init(chartRef.value, { styles: buildStyles() })
  // 订阅十字光标移动：自定义悬浮窗的数据索引由光标的 x 坐标反查
  chart.subscribeAction('onCrosshairChange', handleCrosshairChange)
  // 数据/布局变化（切周期、分页加载、缩放等）时刷新 MA 图例值
  chart.subscribeAction('onVisibleRangeChange', () => updateMaLegend())

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
  // 悬浮窗定位依赖原生 mousemove（库回调不带鼠标像素位置），监听挂在容器上
  chartEl = chartRef.value
  chartEl.addEventListener('mousemove', handleMouseMove)
  chartEl.addEventListener('mouseleave', handleMouseLeave)
})

let resizeObserver = null

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (chartEl) {
    chartEl.removeEventListener('mousemove', handleMouseMove)
    chartEl.removeEventListener('mouseleave', handleMouseLeave)
    chartEl = null
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

.kline-chart-wrap {
  position: relative;
  width: 100%;
}

.kline-chart-dom {
  width: 100%;
}

/* OHLCV 悬浮窗：浅色卡片风格贴近库内置 rect 样式 */
.kline-tip {
  position: absolute;
  z-index: 10;
  padding: 6px 10px;
  background: #fefefe;
  border: 1px solid #f2f3f5;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  line-height: 20px;
  color: #333;
  /* 纯展示元素：不拦截鼠标事件，避免影响图表拖拽/画线/十字光标交互 */
  pointer-events: none;
  white-space: nowrap;
}

.kline-tip-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.kline-tip-label {
  color: #888;
}

.kline-tip-value {
  font-weight: 500;
}

/* MA 图例：图表左上角，点击切换对应均线显示/隐藏 */
.kline-ma-legend {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  row-gap: 2px;
  column-gap: 10px;
  font-size: 12px;
  line-height: 18px;
  user-select: none;
  /* 允许点击但避免整块遮挡绘图区：缩小可命中区域 */
  max-width: 60%;
}

.kline-ma-item {
  cursor: pointer;
  padding: 0 2px;
  border-radius: 3px;
  white-space: nowrap;
}

.kline-ma-item:hover {
  background: rgba(0, 0, 0, 0.08);
}

.kline-ma-item.off {
  text-decoration: line-through;
}

.kline-ma-val {
  font-style: normal;
  margin-left: 4px;
}
</style>
