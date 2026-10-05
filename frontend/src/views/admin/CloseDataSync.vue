<script setup>
/**
 * 收盘数据同步管理 —— 涨停/跌停/板块/指数日K 四类收盘数据的落库管理。
 *
 * 功能分区：
 *   1. 近 7 天状态矩阵：日期 × 数据类型，一眼看出哪天缺哪类（成功/失败/跳过/未同步）
 *   2. 单日操作：按日期+类型 同步 / 强制重刷 / 删除
 *   3. 完整收盘：一键同步某天全部 4 类
 *   4. 区间批量：补历史数据用，自动跳过周末与已同步日期；单次上限 62 天
 *
 * 注意：区间批量是长请求（单日×4类 最坏 ~3s），必须用长超时 + skipRetry，
 *       否则 axios 15s 默认超时后会自动重试 → 与在途任务并发压源。
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

// ---- 数据类型定义（与后端 sync.js DATA_TYPES 一致） ----
const DATA_TYPES = [
  { code: 'LIMIT_UP', label: '涨停板' },
  { code: 'LIMIT_DOWN', label: '跌停板' },
  { code: 'PLATE_MARKET', label: '板块行情' },
  { code: 'INDEX_DAILY', label: '指数日K' }
]

// ---- 状态矩阵 ----
const matrixLoading = ref(false)
const matrixDays = ref(7)
const statusRows = ref([])  // data_sync_status 行

const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d) => d.toISOString().slice(0, 10)

/** 最近 N 个自然日（倒序） */
const recentDates = computed(() => {
  const out = []
  for (let i = 0; i < matrixDays.value; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(fmtDate(d))
  }
  return out
})

/** 状态查找：trade_date + data_type → status（1成功/2失败/3跳过/undefined未同步） */
const statusMap = computed(() => {
  const m = {}
  for (const r of statusRows.value) {
    const date = String(r.trade_date || '').slice(0, 10)
    m[`${date}|${r.data_type}`] = r
  }
  return m
})
const cellOf = (date, type) => statusMap.value[`${date}|${type}`]

const STATUS_TAG = {
  1: { text: '成功', type: 'success' },
  2: { text: '失败', type: 'danger' },
  3: { text: '跳过', type: 'info' }
}

const fetchMatrix = async () => {
  matrixLoading.value = true
  try {
    const res = await api.get('/sync-status/recent', { params: { days: matrixDays.value } })
    statusRows.value = res.data || []
  } catch (e) {
    ElMessage.error('获取同步状态失败: ' + e.message)
  } finally {
    matrixLoading.value = false
  }
}

// ---- 单日操作 ----
const singleDate = ref(today())
const singleType = ref('LIMIT_UP')
const singleBusy = ref(false)

const syncOne = async (force) => {
  if (!singleDate.value) return ElMessage.warning('请选择日期')
  singleBusy.value = true
  try {
    const res = await api.post('/sync-status/manual/sync', null, {
      params: { tradeDate: singleDate.value, dataType: singleType.value, forceUpdate: force ? 'true' : 'false' }
    })
    const r = res.data || {}
    if (r.success) ElMessage.success(r.message)
    else ElMessage.warning(r.message)
    await fetchMatrix()
  } catch (e) {
    ElMessage.error('同步失败: ' + e.message)
  } finally {
    singleBusy.value = false
  }
}

const deleteOne = async () => {
  if (!singleDate.value) return ElMessage.warning('请选择日期')
  const typeLabel = DATA_TYPES.find(t => t.code === singleType.value)?.label
  try {
    await ElMessageBox.confirm(
      `将删除 ${singleDate.value} 的「${typeLabel}」数据（仅删库内数据，同步状态记录保留）。是否继续？`,
      '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  singleBusy.value = true
  try {
    const res = await api.delete('/sync-status/manual/delete', {
      params: { tradeDate: singleDate.value, dataType: singleType.value }
    })
    ElMessage.success(`已删除 ${res.data?.deleted ?? 0} 条`)
    await fetchMatrix()
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  } finally {
    singleBusy.value = false
  }
}

// ---- 完整收盘 ----
const fullDate = ref(today())
const fullBusy = ref(false)
const fullSync = async () => {
  if (!fullDate.value) return ElMessage.warning('请选择日期')
  fullBusy.value = true
  try {
    const res = await api.post('/sync-status/manual/full-sync', null, {
      params: { tradeDate: fullDate.value }
    })
    const rows = res.data || []
    const okCount = rows.filter(r => r.status === 1).length
    ElMessage.success(`完整收盘完成：${okCount}/${rows.length} 类成功`)
    await fetchMatrix()
  } catch (e) {
    ElMessage.error('完整收盘失败: ' + e.message)
  } finally {
    fullBusy.value = false
  }
}

// ---- 区间批量 ----
const rangeValue = ref(null)   // [startDate, endDate]
const rangeType = ref('')      // '' = 全部类型
const rangeForce = ref(false)
const rangeBusy = ref(false)
const rangeSummary = ref(null)
const rangeResults = ref([])

const rangeValid = computed(() =>
  Array.isArray(rangeValue.value) && rangeValue.value.length === 2 &&
  rangeValue.value[0] && rangeValue.value[1] && rangeValue.value[0] <= rangeValue.value[1]
)

const RANGE_TIMEOUT_MS = 240000 // 区间批量是长请求：62 天上限 × 单日×4类最坏 ~3s
const RANGE_SLICE_DAYS = 60     // 后端单次上限 62 天，前端按 60 天切片循环调用

const rangeSync = async () => {
  if (!rangeValid.value) return ElMessage.warning('请选择有效日期区间')
  const [start, end] = rangeValue.value
  try {
    await ElMessageBox.confirm(
      `将对 ${start} ~ ${end} 区间同步「${rangeType.value ? DATA_TYPES.find(t => t.code === rangeType.value)?.label : '全部 4 类'}」。` +
      `${rangeForce.value ? '（强制重刷：先删除已有数据）' : '（已同步的日期自动跳过）'} 是否继续？`,
      '确认区间同步', { confirmButtonText: '开始', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  rangeBusy.value = true
  rangeSummary.value = null
  rangeResults.value = []
  try {
    // 超过 60 天的区间按片循环，避免单次请求超过服务端 62 天上限
    const slices = []
    let cur = new Date(start + 'T00:00:00')
    const endD = new Date(end + 'T00:00:00')
    while (cur <= endD) {
      const sliceEnd = new Date(cur)
      sliceEnd.setDate(sliceEnd.getDate() + RANGE_SLICE_DAYS - 1)
      if (sliceEnd > endD) sliceEnd.setTime(endD.getTime())
      slices.push([fmtDate(cur), fmtDate(sliceEnd)])
      cur = new Date(sliceEnd)
      cur.setDate(cur.getDate() + 1)
    }

    const agg = { total: 0, ok: 0, skipped: 0, error: 0 }
    for (const [s, e] of slices) {
      const res = await api.post('/sync-status/manual/sync-range', null, {
        params: {
          startDate: s, endDate: e,
          dataType: rangeType.value || undefined,
          forceUpdate: rangeForce.value ? 'true' : 'false'
        },
        timeout: RANGE_TIMEOUT_MS,
        skipRetry: true
      })
      const d = res.data || {}
      for (const r of d.results || []) rangeResults.value.push(r)
      if (d.summary) {
        agg.total += d.summary.total; agg.ok += d.summary.ok
        agg.skipped += d.summary.skipped; agg.error += d.summary.error
      }
    }
    rangeSummary.value = agg
    ElMessage.success(`区间同步完成：成功 ${agg.ok}、跳过 ${agg.skipped}、失败 ${agg.error}`)
    await fetchMatrix()
  } catch (e) {
    ElMessage.error('区间同步失败: ' + e.message)
  } finally {
    rangeBusy.value = false
  }
}

onMounted(fetchMatrix)
</script>

<template>
  <div class="close-data-sync">
    <!-- 状态矩阵 -->
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>同步状态矩阵（最近 {{ matrixDays }} 天）</span>
          <div>
            <el-radio-group v-model="matrixDays" size="small" @change="fetchMatrix">
              <el-radio-button :value="7">7 天</el-radio-button>
              <el-radio-button :value="14">14 天</el-radio-button>
              <el-radio-button :value="30">30 天</el-radio-button>
            </el-radio-group>
            <el-button size="small" style="margin-left: 8px" @click="fetchMatrix">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table :data="recentDates" size="small" border v-loading="matrixLoading" max-height="420">
        <el-table-column label="日期" width="110">
          <template #default="{ row }">{{ row }}</template>
        </el-table-column>
        <el-table-column v-for="t in DATA_TYPES" :key="t.code" :label="t.label" min-width="110" align="center">
          <template #default="{ row }">
            <template v-if="cellOf(row, t.code)">
              <el-tag
                size="small"
                :type="STATUS_TAG[cellOf(row, t.code).status]?.type || 'info'"
                :title="cellOf(row, t.code).message"
              >
                {{ STATUS_TAG[cellOf(row, t.code).status]?.text || '未知' }}
                <template v-if="cellOf(row, t.code).success_count">·{{ cellOf(row, t.code).success_count }}</template>
              </el-tag>
            </template>
            <span v-else class="dim">未同步</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 单日操作 -->
    <el-card class="mb-16">
      <template #header><span>单日操作</span></template>
      <el-form :inline="true">
        <el-form-item label="日期">
          <el-date-picker v-model="singleDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="singleType" style="width: 130px">
            <el-option v-for="t in DATA_TYPES" :key="t.code" :value="t.code" :label="t.label" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="singleBusy" @click="syncOne(false)">同步</el-button>
          <el-button :loading="singleBusy" @click="syncOne(true)">强制重刷</el-button>
          <el-button type="danger" plain :loading="singleBusy" @click="deleteOne">删除</el-button>
        </el-form-item>
      </el-form>
      <div class="hint">「同步」在数据已存在时自动跳过；「强制重刷」先删后写；「删除」只清库内数据，状态记录保留以便追溯。</div>
    </el-card>

    <!-- 完整收盘 -->
    <el-card class="mb-16">
      <template #header><span>完整收盘任务</span></template>
      <el-form :inline="true">
        <el-form-item label="日期">
          <el-date-picker v-model="fullDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="fullBusy" @click="fullSync">一键收盘（同步全部 4 类）</el-button>
        </el-form-item>
      </el-form>
      <div class="hint">每日收盘后执行一次，把涨停/跌停/板块/指数日K 全部落库。已有数据的类型自动跳过。</div>
    </el-card>

    <!-- 区间批量 -->
    <el-card>
      <template #header><span>区间批量同步（补历史数据）</span></template>
      <el-form :inline="true">
        <el-form-item label="日期区间">
          <el-date-picker
            v-model="rangeValue" type="daterange" value-format="YYYY-MM-DD"
            range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-select v-model="rangeType" style="width: 130px">
            <el-option value="" label="全部 4 类" />
            <el-option v-for="t in DATA_TYPES" :key="t.code" :value="t.code" :label="t.label" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="rangeForce">强制重刷</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="rangeBusy" :disabled="rangeBusy || !rangeValid" @click="rangeSync">
            开始区间同步
          </el-button>
        </el-form-item>
      </el-form>
      <div class="hint">
        周末自动跳过（不请求上游）；节假日无数据记为「跳过」而非失败；已同步的日期不重复同步（勾选强制重刷除外）。
        单次服务端上限 62 天，更长区间由前端自动切片串行。
      </div>

      <template v-if="rangeSummary">
        <el-descriptions :column="4" border size="small" class="mt-12">
          <el-descriptions-item label="处理条目">{{ rangeSummary.total }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ rangeSummary.ok }}</el-descriptions-item>
          <el-descriptions-item label="跳过">{{ rangeSummary.skipped }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ rangeSummary.error }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <el-table v-if="rangeResults.length" :data="rangeResults" size="small" border max-height="320" class="mt-12">
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ DATA_TYPES.find(t => t.code === row.dataType)?.label || row.dataType }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'ok' ? 'success' : row.status === 'skipped' ? 'info' : 'danger'">
              {{ row.status === 'ok' ? '成功' : row.status === 'skipped' ? '跳过' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="说明" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.close-data-sync { padding: 20px; }
.mb-16 { margin-bottom: 16px; }
.mt-12 { margin-top: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.hint { margin-top: 8px; color: #86909c; font-size: 12px; }
.dim { color: #c9cdd4; font-size: 12px; }
</style>
