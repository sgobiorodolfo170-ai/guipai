<script setup>
/**
 * KlineNoteBlock —— 笔记内 K 线块。
 *
 * 数据流：block = { code, period, startDate, endDate, imageBase64? }
 *   - 有 imageBase64 → 优先展示手动截图（数据不可用时的兜底）
 *   - 无截图但有 code → 渲染 KLineChart（customDataLoader 按区间拉 getStockKLine）
 *   - 拉取失败/无数据 → 占位图 + 上传截图入口
 *   - 无 code → 配置表单（代码搜索 + 周期 + 日期区间）
 */
import { ref, computed, watch } from 'vue'
import { getStockKLine, searchStocks } from '@/services/stock.service'
import { toKLineDataList } from '@/utils/klineData'
import KLineChart from '@/components/common/KLineChart.vue'

const props = defineProps({
  block: { type: Object, required: true },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['update', 'remove'])

const patch = (p) => emit('update', { ...props.block, ...p })

const periodOptions = [
  { value: 'daily', label: '日K' }, { value: 'weekly', label: '周K' }, { value: 'monthly', label: '月K' }
]

// 配置编辑态
const editing = ref(!props.block.code)
const stockOptions = ref([])
const dateRange = ref(props.block.startDate && props.block.endDate ? [props.block.startDate, props.block.endDate] : null)
const stockLoading = ref(false)

const remoteSearch = async (kw) => {
  if (!kw) { stockOptions.value = []; return }
  stockLoading.value = true
  try {
    const res = await searchStocks(kw)
    const arr = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.items || [])
    stockOptions.value = arr.map(s => ({ code: s.code || s.symbol, name: s.name || '' })).filter(s => s.code)
  } catch { stockOptions.value = [] }
  finally { stockLoading.value = false }
}
const onPick = (code) => {
  const hit = stockOptions.value.find(s => s.code === code)
  patch({ code, name: hit?.name || '' })
}

const applyConfig = () => {
  const [s, e] = dateRange.value || []
  patch({ startDate: s || '', endDate: e || '' })
  editing.value = false
  loadFailed.value = false
}

const hasImage = computed(() => !!props.block.imageBase64)
const showChart = computed(() => !hasImage.value && props.block.code && !editing.value)
const chartKey = computed(() => `${props.block.code}-${props.block.period}-${props.block.startDate}-${props.block.endDate}`)

// 自定义 dataLoader：按 block 区间拉取
const customDataLoader = computed(() => ({
  getBars: async ({ type, timestamp, callback }) => {
    try {
      const fmt = (d) => (d || '').replace(/-/g, '')
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const start = fmt(props.block.startDate) || new Date(Date.now() - 900 * 864e5).toISOString().slice(0, 10).replace(/-/g, '')
      const end = fmt(props.block.endDate) || today
      if (type === 'init') {
        const resp = await getStockKLine(props.block.code, { period: props.block.period, adjust: 'qfq', startDate: start, endDate: end })
        const bars = toKLineDataList(resp?.data || [])
        if (!bars.length) loadFailed.value = true
        callback(bars, { forward: bars.length >= 200, backward: false })
      } else if (type === 'forward') {
        const s = new Date(); s.setDate(s.getDate() - 2500)
        const resp = await getStockKLine(props.block.code, { period: props.block.period, adjust: 'qfq', startDate: s.toISOString().slice(0, 10).replace(/-/g, ''), endDate: new Date(timestamp).toISOString().slice(0, 10).replace(/-/g, '') })
        const bars = toKLineDataList(resp?.data || []).filter(b => b.timestamp < timestamp)
        callback(bars, { forward: bars.length >= 200, backward: false })
      } else { callback([], { forward: false, backward: false }) }
    } catch (e) {
      console.error('[KlineNoteBlock] getBars failed:', e)
      loadFailed.value = true
      callback([], { forward: false, backward: false })
    }
  }
}))

const loadFailed = ref(false)
watch(chartKey, () => { loadFailed.value = false })

// 截图上传 → base64
const onUpload = (file) => {
  const reader = new FileReader()
  reader.onload = () => { patch({ imageBase64: reader.result }); loadFailed.value = false }
  reader.readAsDataURL(file.raw || file)
  return false
}
</script>

<template>
  <div class="knb">
    <!-- 配置编辑态 -->
    <div v-if="editing && !readonly" class="knb-config">
      <el-select filterable remote clearable :remote-method="remoteSearch" :loading="stockLoading" placeholder="股票代码/名称" style="width:200px" :model-value="block.code" @change="onPick">
        <el-option v-for="s in stockOptions" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
      </el-select>
      <el-select :model-value="block.period" placeholder="周期" style="width:110px" @change="v => patch({ period: v })">
        <el-option v-for="p in periodOptions" :key="p.value" :label="p.label" :value="p.value" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="起" end-placeholder="止" style="width:240px" />
      <el-button type="primary" size="small" :disabled="!block.code" @click="applyConfig">渲染</el-button>
      <el-button size="small" @click="emit('remove')">取消</el-button>
    </div>

    <!-- 截图展示 -->
    <div v-else-if="hasImage" class="knb-image">
      <img :src="block.imageBase64" alt="行情截图" />
      <div class="knb-bar">
        <span class="knb-cap">{{ block.code }} · {{ periodOptions.find(p=>p.value===block.period)?.label }} · {{ block.startDate }}~{{ block.endDate }}</span>
        <el-button v-if="!readonly" size="small" @click="patch({ imageBase64: null })">重渲染图表</el-button>
        <el-button v-if="!readonly" size="small" type="danger" @click="emit('remove')">删除块</el-button>
      </div>
    </div>

    <!-- 实时K线 -->
    <div v-else-if="showChart" class="knb-chart">
      <KLineChart v-if="!loadFailed" :key="chartKey" :stock-code="block.code" :period="block.period"
        :height="380" :show-period-switcher="false" :show-adjust-switcher="false"
        :show-indicator-bar="false" :show-drawing-tools="false"
        :custom-data-loader="customDataLoader" />
      <!-- 拉取失败占位 + 手动上传 -->
      <div v-else class="knb-fail">
        <el-empty :image-size="80" description="K线数据不可用，可手动上传行情截图">
          <el-upload v-if="!readonly" :show-file-list="false" :before-upload="onUpload" accept="image/*">
            <el-button size="small" type="primary">上传截图</el-button>
          </el-upload>
        </el-empty>
      </div>
      <div class="knb-bar">
        <span class="knb-cap">{{ block.code }} · {{ periodOptions.find(p=>p.value===block.period)?.label }} · {{ block.startDate }}~{{ block.endDate }}</span>
        <template v-if="!readonly">
          <el-button size="small" @click="editing = true">编辑配置</el-button>
          <el-upload :show-file-list="false" :before-upload="onUpload" accept="image/*">
            <el-button size="small">上传截图</el-button>
          </el-upload>
          <el-button size="small" type="danger" @click="emit('remove')">删除块</el-button>
        </template>
      </div>
    </div>

    <!-- 无 code 占位 -->
    <div v-else class="knb-empty">
      <el-empty :image-size="60" description="未配置K线" />
      <el-button v-if="!readonly" size="small" @click="editing = true">配置</el-button>
    </div>
  </div>
</template>

<style scoped>
.knb { border: 1px solid var(--el-border-color-light); border-radius: 6px; margin: 12px 0; background: #fff; }
.knb-config { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; align-items: center; }
.knb-image img { width: 100%; display: block; }
.knb-chart { padding: 4px; }
.knb-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; gap: 8px; border-top: 1px solid var(--el-border-color-lighter); }
.knb-cap { font-size: 12px; color: var(--el-text-color-secondary); }
.knb-fail, .knb-empty { padding: 12px; text-align: center; }
</style>
