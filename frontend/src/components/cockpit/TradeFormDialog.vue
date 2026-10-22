<script setup>
/**
 * TradeFormDialog —— 交易记账弹窗（三模式）
 *
 * 模式：
 *   - create：空白表单（默认 buy）
 *   - edit：回填既有 trade 全部字段
 *   - sell：从持仓行进入，预填 code/name/direction=sell/price=现价/quantity=持仓量
 *
 * 提交后 emit('saved')，由父组件刷新数据。
 */
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { searchStocks } from '@/services/stock.service'
import { createTrade, updateTrade } from '@/services/cockpit.service'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // create | edit | sell
  trade: { type: Object, default: null },     // edit 模式回填
  preset: { type: Object, default: null }     // sell 模式预填
})
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const form = ref({
  stockCode: '', stockName: '', direction: 'buy',
  tradePrice: null, quantity: null, fee: 0, tradeDate: '', note: ''
})
const saving = ref(false)
const stockOptions = ref([])
const stockLoading = ref(false)

const title = computed(() => ({ create: '记一笔', edit: '编辑交易', sell: '卖出' }[props.mode] || '记一笔'))

watch(visible, (v) => {
  if (!v) return
  if (props.mode === 'edit' && props.trade) {
    form.value = { ...props.trade }
    stockOptions.value = [{ code: props.trade.stockCode, name: props.trade.stockName }]
  } else if (props.mode === 'sell' && props.preset) {
    form.value = {
      stockCode: props.preset.stockCode || '',
      stockName: props.preset.stockName || '',
      direction: 'sell',
      tradePrice: props.preset.price ?? null,
      quantity: props.preset.quantity ?? null,
      fee: 0,
      tradeDate: today(),
      note: ''
    }
    stockOptions.value = [{ code: props.preset.stockCode, name: props.preset.stockName }]
  } else {
    form.value = { stockCode: '', stockName: '', direction: 'buy', tradePrice: null, quantity: null, fee: 0, tradeDate: today(), note: '' }
    stockOptions.value = []
  }
})

function today() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const remoteSearch = async (kw) => {
  if (!kw) { stockOptions.value = []; return }
  stockLoading.value = true
  try {
    const res = await searchStocks(kw)
    const arr = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.items || [])
    stockOptions.value = arr.map(s => ({ code: s.code || s.stockCode || s.symbol, name: s.name || s.stockName || '' })).filter(s => s.code)
  } catch { stockOptions.value = [] }
  finally { stockLoading.value = false }
}

const onPickStock = (code) => {
  const hit = stockOptions.value.find(s => s.code === code)
  form.value.stockName = hit?.name || ''
}

const tradeAmount = computed(() => {
  const p = Number(form.value.tradePrice) || 0
  const q = Number(form.value.quantity) || 0
  const f = Number(form.value.fee) || 0
  return form.value.direction === 'buy' ? (p * q + f) : (p * q - f)
})

const submit = async () => {
  const f = form.value
  if (!f.stockCode || !f.tradePrice || !f.quantity || !f.tradeDate) {
    return ElMessage.warning('请填写完整：代码/价格/数量/日期')
  }
  saving.value = true
  try {
    if (props.mode === 'edit' && props.trade?.id) {
      await updateTrade(props.trade.id, f)
    } else {
      await createTrade(f)
    }
    ElMessage.success('已保存')
    visible.value = false
    emit('saved')
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="520px" destroy-on-close>
    <el-form label-width="80px">
      <el-form-item label="股票代码" required>
        <el-select
          v-model="form.stockCode" filterable remote clearable
          :remote-method="remoteSearch" :loading="stockLoading"
          placeholder="输入代码/名称搜索" :disabled="mode === 'sell'"
          @change="onPickStock" style="width: 100%"
        >
          <el-option v-for="s in stockOptions" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="股票名称">
        <el-input v-model="form.stockName" disabled placeholder="选代码自动带出" />
      </el-form-item>
      <el-form-item label="交易方向" required>
        <el-radio-group v-model="form.direction" :disabled="mode === 'sell'">
          <el-radio-button value="buy">买入</el-radio-button>
          <el-radio-button value="sell">卖出</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="成交价格" required>
        <el-input-number v-model="form.tradePrice" :min="0" :precision="4" :step="0.01" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="数量" required>
        <el-input-number v-model="form.quantity" :min="0" :precision="0" :step="100" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="手续费">
        <el-input-number v-model="form.fee" :min="0" :precision="2" :step="1" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="成交日期" required>
        <el-date-picker v-model="form.tradeDate" type="date" value-format="YYYY-MM-DD" placeholder="选择" style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.note" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
      <el-form-item label="交易金额">
        <span :class="form.direction === 'buy' ? 'amt-out' : 'amt-in'">¥{{ tradeAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.amt-in { color: #f56c6c; font-weight: 600; }
.amt-out { color: #67c23a; font-weight: 600; }
</style>
