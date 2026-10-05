<script setup>
/**
 * 股票往期数据拉取 —— 手动分批次把个股日K写入 DolphinDB daily_k。
 *
 * 交互要点：
 *   - 选股：支持搜索添加 / 批量粘贴代码（空格、逗号、换行分隔）
 *   - 分批：按 batchSize 切分，逐批串行调用后端 /api/data-pull/batch，
 *          每批返回逐只结果并累积进度，可随时「停止」在批次边界中断
 *   - 限速：批次内由后端串行 + intervalMs 间隔；批次之间前端额外等待，避免触发行情源限流
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

// ---- 状态与库状态 ----
const status = ref({ connected: false, totalSymbols: 0, totalRows: 0, latestDate: null, hint: '' })
const statusLoading = ref(false)

// ---- 选股 ----
const keyword = ref('')
const searchOptions = ref([])
const searching = ref(false)
const stockList = ref([])          // [{ code, name }]
const bulkInput = ref('')

// ---- 拉取参数 ----
const dateRange = ref(null)        // [startDate, endDate] YYYY-MM-DD
const batchSize = ref(10)
const intervalMs = ref(300)
const batchGapMs = ref(1000)

// ---- 拉取进度 ----
const running = ref(false)
const stopFlag = ref(false)
const totalBatches = ref(0)
const currentBatch = ref(0)
const progress = ref({ total: 0, done: 0, ok: 0, empty: 0, error: 0, rows: 0 })
const resultRows = ref([])         // 逐只结果（可导出查看）

const hasStocks = computed(() => stockList.value.length > 0)
const dateRangeValid = computed(() =>
  Array.isArray(dateRange.value) && dateRange.value.length === 2 &&
  dateRange.value[0] && dateRange.value[1] &&
  new Date(dateRange.value[0]) <= new Date(dateRange.value[1])
)
const progressPercent = computed(() => {
  if (!progress.value.total) return 0
  return Math.round((progress.value.done / progress.value.total) * 100)
})

const fetchStatus = async () => {
  statusLoading.value = true
  try {
    const res = await api.get('/data-pull/status')
    status.value = res.data || {}
  } catch (e) {
    status.value = { connected: false, hint: '状态查询失败: ' + e.message }
  } finally {
    statusLoading.value = false
  }
}

const connectDdb = async () => {
  try {
    const res = await api.post('/data-pull/connect')
    if (res.data?.connected) {
      ElMessage.success('DolphinDB 连接成功')
    } else {
      ElMessage.warning('连接未成功，请确认 DolphinDB 服务已启动')
    }
    await fetchStatus()
  } catch (e) {
    ElMessage.error('连接失败: ' + e.message)
  }
}

// ---- 搜索选股 ----
const doSearch = async (q) => {
  const kw = String(q || '').trim()
  if (!kw) { searchOptions.value = []; return }
  searching.value = true
  try {
    const res = await api.get('/stocks/search', { params: { keyword: kw } })
    searchOptions.value = res.data || []
  } catch (e) {
    searchOptions.value = []
  } finally {
    searching.value = false
  }
}

const addStock = (item) => {
  const code = String(item.code || '').trim()
  if (!code) return
  if (stockList.value.some(s => s.code === code)) {
    ElMessage.info(`${code} 已在列表中`)
    return
  }
  stockList.value.push({ code, name: item.name || '' })
  searchOptions.value = []
  keyword.value = ''
}

// ---- 批量粘贴解析 ----
const parseCodes = (raw) => {
  const set = new Map()
  for (const token of String(raw || '').split(/[\s,;，；、]+/)) {
    const code = token.trim().toUpperCase()
    // A股代码：6 位数字（沪深）；兼容 4/5 位前缀式（sh600519 / 600519.SH）
    const digits = code.replace(/^(SH|SZ|BJ)/, '').replace(/\.(SH|SZ|BJ)$/, '')
    if (/^\d{6}$/.test(digits)) set.set(digits, stockList.value.find(s => s.code === digits)?.name || '')
  }
  return [...set].map(([code, name]) => ({ code, name }))
}

const addFromBulk = () => {
  const parsed = parseCodes(bulkInput.value)
  if (!parsed.length) {
    ElMessage.warning('未识别到有效股票代码（6 位数字）')
    return
  }
  let added = 0
  for (const s of parsed) {
    if (!stockList.value.some(x => x.code === s.code)) {
      stockList.value.push(s)
      added++
    }
  }
  ElMessage.success(`新增 ${added} 只（跳过重复 ${parsed.length - added} 只）`)
  bulkInput.value = ''
}

const removeStock = (code) => {
  stockList.value = stockList.value.filter(s => s.code !== code)
}
const clearStocks = () => { stockList.value = [] }

// ---- 覆盖度查询 ----
const checkCoverage = async () => {
  if (!hasStocks.value) return ElMessage.warning('请先添加股票')
  const codes = stockList.value.slice(0, 50).map(s => s.code)
  try {
    const res = await api.get('/data-pull/coverage', { params: { codes: codes.join(',') } })
    const data = res.data || []
    const map = Object.fromEntries(data.map(d => [d.code, d]))
    stockList.value = stockList.value.map(s => ({
      ...s,
      rows: map[s.code]?.rows ?? null,
      latest: map[s.code]?.latest ?? null
    }))
    ElMessage.success('覆盖度查询完成')
  } catch (e) {
    ElMessage.error('查询失败: ' + e.message)
  }
}

// ---- 分批拉取 ----
// 批请求是长请求：服务端逐只串行，单只最坏 ~14s（东财 10s 超时 + 腾讯 4s），
// 且服务端有 150s 墙钟预算封顶。故这里的超时必须大于服务端预算，且必须禁用重试——
// 超时后重发会让同一批数据被并发执行多份，正是服务端要规避的压源。
const BATCH_TIMEOUT_MS = 180000

const startPull = async () => {
  if (!hasStocks.value) return ElMessage.warning('请先添加股票')
  if (!dateRangeValid.value) return ElMessage.warning('请选择有效的日期范围')
  if (running.value) return

  const [startDate, endDate] = dateRange.value
  const size = Math.min(Math.max(Number(batchSize.value) || 10, 1), 50)

  // 按批切分
  const batches = []
  for (let i = 0; i < stockList.value.length; i += size) {
    batches.push(stockList.value.slice(i, i + size).map(s => s.code))
  }

  try {
    await ElMessageBox.confirm(
      `将对 ${stockList.value.length} 只股票、${batches.length} 个批次拉取 ${startDate} ~ ${endDate} 的日K数据。是否继续？`,
      '确认拉取',
      { confirmButtonText: '开始拉取', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  running.value = true
  stopFlag.value = false
  totalBatches.value = batches.length
  currentBatch.value = 0
  resultRows.value = []
  progress.value = { total: stockList.value.length, done: 0, ok: 0, empty: 0, error: 0, rows: 0 }

  const interval = Math.min(Math.max(Number(intervalMs.value) || 0, 0), 3000)
  const gap = Math.min(Math.max(Number(batchGapMs.value) || 0, 0), 5000)

  for (let bi = 0; bi < batches.length; bi++) {
    if (stopFlag.value) break
    currentBatch.value = bi + 1
    try {
      const res = await api.post(
        '/data-pull/batch',
        { codes: batches[bi], startDate, endDate, intervalMs: interval },
        { timeout: BATCH_TIMEOUT_MS, skipRetry: true }
      )
      const data = res.data || {}
      if (data.warning) ElMessage.warning(data.warning)
      // skipped = 服务端撞上时间预算未处理，不能计入进度（否则总进度永远到不了 100%）
      for (const r of (data.results || []).filter(x => x.status !== 'skipped')) {
        resultRows.value.push(r)
        progress.value.done++
        if (r.status === 'ok') progress.value.ok++
        else if (r.status === 'empty') progress.value.empty++
        else progress.value.error++
        progress.value.rows += r.rows || 0
      }
      // 截断：把未处理的代码补成新批次继续拉，而不是整批判失败
      if (data.truncated) {
        const handled = new Set((data.results || []).map(r => r.code))
        const rest = batches[bi].filter(c => !handled.has(c))
        if (rest.length) {
          batches.splice(bi + 1, 0, rest)
          totalBatches.value = batches.length
          ElMessage.warning(`第 ${bi + 1} 批超出服务端时间预算，${rest.length} 只已顺延到下一批`)
        }
      }
    } catch (e) {
      // 整批失败：逐只标记错误，继续下一批
      for (const code of batches[bi]) {
        resultRows.value.push({ code, status: 'error', rows: 0, message: e.message })
        progress.value.done++
        progress.value.error++
      }
      ElMessage.error(`第 ${bi + 1} 批失败: ${e.message}`)
    }
    // 批次间隔，避免连续请求触发限流
    if (gap > 0 && bi < batches.length - 1 && !stopFlag.value) {
      await new Promise(r => setTimeout(r, gap))
    }
  }

  running.value = false
  await fetchStatus()
  if (stopFlag.value) {
    ElMessage.warning(`已停止，完成 ${progress.value.done}/${progress.value.total} 只`)
  } else {
    ElMessage.success(`拉取完成：成功 ${progress.value.ok}、无数据 ${progress.value.empty}、失败 ${progress.value.error}，写入 ${progress.value.rows} 行`)
  }
}

const stopPull = () => {
  if (!running.value) return
  stopFlag.value = true
  ElMessage.info('将在当前批次结束后停止')
}

const resetProgress = () => {
  resultRows.value = []
  progress.value = { total: 0, done: 0, ok: 0, empty: 0, error: 0, rows: 0 }
  currentBatch.value = 0
  totalBatches.value = 0
}

// ---- 默认日期：近 2 年 ----
const initDefaultRange = () => {
  const end = new Date()
  const start = new Date()
  start.setFullYear(start.getFullYear() - 2)
  const fmt = d => d.toISOString().slice(0, 10)
  dateRange.value = [fmt(start), fmt(end)]
}

onMounted(async () => {
  initDefaultRange()
  await fetchStatus()
})
</script>

<template>
  <div class="stock-data-pull" v-loading="statusLoading">
    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>存储状态（DolphinDB daily_k）</span>
          <div>
            <el-button size="small" @click="fetchStatus">刷新</el-button>
            <el-button size="small" type="primary" @click="connectDdb">连接/重连</el-button>
          </div>
        </div>
      </template>
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="连接状态">
          <el-tag :type="status.connected ? 'success' : 'danger'" size="small">
            {{ status.connected ? '已连接' : '未连接' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="已入库股票数">{{ status.totalSymbols ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="已入库总行数">{{ status.totalRows ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="最新交易日">{{ status.latestDate || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert v-if="!status.connected && status.hint" type="warning" :closable="false" class="mt-8" :title="status.hint" />
    </el-card>

    <el-card class="mb-16">
      <template #header>
        <div class="card-header">
          <span>1. 选择股票</span>
          <div>
            <el-button size="small" @click="checkCoverage" :disabled="!hasStocks">查询已存覆盖度</el-button>
            <el-button size="small" type="danger" plain @click="clearStocks" :disabled="!hasStocks">清空列表</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索添加 -->
      <el-autocomplete
        v-model="keyword"
        :fetch-suggestions="doSearch"
        :trigger-on-focus="false"
        placeholder="输入代码或名称搜索（如 600519 / 茅台）"
        clearable
        class="mb-8"
        @select="addStock"
      >
        <template #default="{ item }">
          <div class="opt-row">
            <span class="opt-code">{{ item.code }}</span>
            <span class="opt-name">{{ item.name }}</span>
          </div>
        </template>
      </el-autocomplete>

      <!-- 批量粘贴 -->
      <div class="bulk-row">
        <el-input
          v-model="bulkInput"
          type="textarea"
          :rows="2"
          placeholder="批量粘贴股票代码，支持空格/逗号/换行分隔，如：600519 000001 300750"
        />
        <el-button type="primary" plain @click="addFromBulk" class="bulk-btn">解析添加</el-button>
      </div>

      <!-- 已选列表 -->
      <el-table :data="stockList" size="small" border max-height="320" class="mt-8">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="name" label="名称" min-width="120">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="已存行数" width="100">
          <template #default="{ row }">
            <span v-if="row.rows === null || row.rows === undefined">-</span>
            <span v-else>{{ row.rows }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已存最新日期" width="130">
          <template #default="{ row }">{{ row.latest || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="removeStock(row.code)">移除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <span class="empty-tip">尚未添加股票，可搜索或批量粘贴代码</span>
        </template>
      </el-table>
      <div class="stock-count">共 {{ stockList.length }} 只</div>
    </el-card>

    <el-card class="mb-16">
      <template #header><span>2. 拉取参数</span></template>
      <el-form :inline="true" label-width="90px">
        <el-form-item label="日期范围" required>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="每批数量">
          <el-input-number v-model="batchSize" :min="1" :max="50" controls-position="right" />
        </el-form-item>
        <el-form-item label="批内间隔">
          <el-input-number v-model="intervalMs" :min="0" :max="3000" :step="100" controls-position="right" />
          <span class="form-hint">毫秒</span>
        </el-form-item>
        <el-form-item label="批间间隔">
          <el-input-number v-model="batchGapMs" :min="0" :max="5000" :step="500" controls-position="right" />
          <span class="form-hint">毫秒</span>
        </el-form-item>
      </el-form>
      <div class="form-hint">
        每批最多 50 只；批次间按批顺序串行执行。单批最长 150 秒（服务端时间预算），超出的代码会自动顺延到下一批。可先小批量试拉确认速率后再扩大范围。
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>3. 执行拉取</span>
          <div>
            <el-button
              type="primary"
              size="small"
              :loading="running"
              :disabled="running || !hasStocks || !dateRangeValid"
              @click="startPull"
            >
              开始拉取
            </el-button>
            <el-button type="danger" size="small" plain :disabled="!running" @click="stopPull">
              停止
            </el-button>
            <el-button size="small" :disabled="running" @click="resetProgress">重置进度</el-button>
          </div>
        </div>
      </template>

      <el-progress
        :percentage="progressPercent"
        :status="progressPercent === 100 ? 'success' : undefined"
        :stroke-width="18"
      />

      <el-descriptions :column="6" border size="small" class="mt-12">
        <el-descriptions-item label="总股票数">{{ progress.total }}</el-descriptions-item>
        <el-descriptions-item label="已处理">{{ progress.done }}</el-descriptions-item>
        <el-descriptions-item label="成功">{{ progress.ok }}</el-descriptions-item>
        <el-descriptions-item label="无数据">{{ progress.empty }}</el-descriptions-item>
        <el-descriptions-item label="失败">{{ progress.error }}</el-descriptions-item>
        <el-descriptions-item label="写入行数">{{ progress.rows }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="totalBatches" class="batch-info">
        批次进度：第 {{ currentBatch }} / {{ totalBatches }} 批{{ running ? '（执行中…）' : '' }}
      </div>

      <el-table :data="resultRows" size="small" border max-height="360" class="mt-12">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="name" label="名称" width="120">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'ok' ? 'success' : row.status === 'empty' ? 'info' : 'danger'">
              {{ row.status === 'ok' ? '成功' : row.status === 'empty' ? '无数据' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rows" label="写入行数" width="90" />
        <el-table-column prop="latest" label="库内最新日期" width="120">
          <template #default="{ row }">{{ row.latest || '-' }}</template>
        </el-table-column>
        <el-table-column prop="message" label="说明" min-width="200" />
        <template #empty>
          <span class="empty-tip">尚未执行拉取</span>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.stock-data-pull { padding: 20px; }
.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.opt-row { display: flex; justify-content: space-between; gap: 12px; }
.opt-code { font-weight: 600; }
.opt-name { color: #86909c; }
.bulk-row { display: flex; gap: 8px; align-items: flex-start; }
.bulk-btn { flex-shrink: 0; }
.form-hint { margin-left: 8px; color: #86909c; font-size: 12px; }
.stock-count { margin-top: 8px; color: #86909c; font-size: 13px; }
.batch-info { margin-top: 8px; color: #86909c; font-size: 13px; }
.empty-tip { color: #c9cdd4; font-size: 13px; }
</style>