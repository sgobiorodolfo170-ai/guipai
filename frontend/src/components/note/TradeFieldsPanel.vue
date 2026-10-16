<script setup>
/**
 * TradeFieldsPanel —— 结构化交易字段录入。
 *
 * 字段：股票代码+名称（远程搜索 searchStocks）、方向、价格、数量、手续费、
 * 成交日期、持仓状态、自定义标签。成本由后端自动算；此处实时预览"交易金额"。
 */
import { computed, ref } from 'vue'
import { searchStocks } from '@/services/stock.service'

const props = defineProps({
  modelValue: { type: Object, required: true },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const BUY_DIRS = new Set(['buy', 'add'])

const patch = (p) => emit('update:modelValue', { ...props.modelValue, ...p })

const directionOptions = [
  { value: 'buy', label: '买入' }, { value: 'sell', label: '卖出' },
  { value: 'add', label: '加仓' }, { value: 'reduce', label: '减仓' }
]
const holdingOptions = [
  { value: 'open', label: '持仓' }, { value: 'closed', label: '清仓' }, { value: 'partial', label: '部分' }
]

// 股票远程搜索
const stockOptions = ref([])
const stockLoading = ref(false)
const remoteSearch = async (kw) => {
  if (!kw) { stockOptions.value = []; return }
  stockLoading.value = true
  try {
    const res = await searchStocks(kw)
    const arr = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.items || [])
    stockOptions.value = arr.map(s => ({
      code: s.code || s.stockCode || s.symbol,
      name: s.name || s.stockName || ''
    })).filter(s => s.code)
  } catch { stockOptions.value = [] }
  finally { stockLoading.value = false }
}
const onPickStock = (code) => {
  const hit = stockOptions.value.find(s => s.code === code)
  patch({ stockCode: code, stockName: hit?.name || '' })
}

// 交易金额预览（买入口径：价×量＋手续费）
const tradeAmount = computed(() => {
  const p = Number(props.modelValue.tradePrice) || 0
  const q = Number(props.modelValue.quantity) || 0
  const f = Number(props.modelValue.fee) || 0
  return BUY_DIRS.has(props.modelValue.direction) ? (p * q + f) : (p * q - f)
})
</script>

<template>
  <div class="tfp">
    <el-row :gutter="16">
      <el-col :span="12" :sm="12" :xs="24">
        <div class="field">
          <label>股票代码</label>
          <el-select
            :model-value="modelValue.stockCode" filterable remote clearable
            :remote-method="remoteSearch" :loading="stockLoading"
            placeholder="输入代码/名称搜索" :disabled="readonly"
            @change="onPickStock"
          >
            <el-option v-for="s in stockOptions" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
          </el-select>
        </div>
      </el-col>
      <el-col :span="12" :sm="12" :xs="24">
        <div class="field">
          <label>股票名称</label>
          <el-input :model-value="modelValue.stockName" disabled placeholder="选代码自动带出" />
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="6" :sm="6" :xs="12">
        <div class="field">
          <label>交易方向</label>
          <el-select :model-value="modelValue.direction" :disabled="readonly" placeholder="选择"
            @change="v => patch({ direction: v })">
            <el-option v-for="d in directionOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
      </el-col>
      <el-col :span="6" :sm="6" :xs="12">
        <div class="field">
          <label>成交价格</label>
          <el-input-number :model-value="modelValue.tradePrice" :disabled="readonly" :min="0" :precision="4" :step="0.01" controls-position="right" style="width:100%" @update:modelValue="v => patch({ tradePrice: v })" />
        </div>
      </el-col>
      <el-col :span="6" :sm="6" :xs="12">
        <div class="field">
          <label>数量</label>
          <el-input-number :model-value="modelValue.quantity" :disabled="readonly" :min="0" :precision="0" :step="100" controls-position="right" style="width:100%" @update:modelValue="v => patch({ quantity: v })" />
        </div>
      </el-col>
      <el-col :span="6" :sm="6" :xs="12">
        <div class="field">
          <label>手续费</label>
          <el-input-number :model-value="modelValue.fee" :disabled="readonly" :min="0" :precision="2" :step="1" controls-position="right" style="width:100%" @update:modelValue="v => patch({ fee: v })" />
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="6" :sm="6" :xs="12">
        <div class="field">
          <label>成交日期</label>
          <el-date-picker :model-value="modelValue.tradeDate" :disabled="readonly" type="date" value-format="YYYY-MM-DD" placeholder="选择" style="width:100%" @update:modelValue="v => patch({ tradeDate: v })" />
        </div>
      </el-col>
      <el-col :span="6" :sm="6" :xs="12">
        <div class="field">
          <label>持仓状态</label>
          <el-select :model-value="modelValue.holdingStatus" :disabled="readonly" placeholder="选择" clearable
            @change="v => patch({ holdingStatus: v })">
            <el-option v-for="h in holdingOptions" :key="h.value" :label="h.label" :value="h.value" />
          </el-select>
        </div>
      </el-col>
      <el-col :span="12" :sm="12" :xs="24">
        <div class="field">
          <label>自定义标签</label>
          <el-select :model-value="modelValue.tags" multiple filterable allow-create default-first-option
            :disabled="readonly" placeholder="输入回车添加标签" style="width:100%"
            @update:modelValue="v => patch({ tags: v })" />
        </div>
      </el-col>
    </el-row>
    <div class="amount-line">
      <span class="amount-label">交易金额预览：</span>
      <span class="amount-val">¥ {{ tradeAmount.toFixed(2) }}</span>
      <span class="amount-hint">（{{ BUY_DIRS.has(modelValue.direction) ? '买入口径: 价×量＋手续费' : '卖出口径: 价×量−手续费' }}，成本由后端自动入库）</span>
    </div>
  </div>
</template>

<style scoped>
.tfp { display: flex; flex-direction: column; gap: 8px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.field label { font-size: 12px; color: var(--el-text-color-secondary); }
.amount-line { font-size: 13px; color: var(--el-text-color-regular); padding: 8px 0; }
.amount-val { font-weight: 600; color: var(--el-color-danger); margin-right: 8px; }
.amount-hint { color: var(--el-text-color-placeholder); font-size: 12px; }
</style>
