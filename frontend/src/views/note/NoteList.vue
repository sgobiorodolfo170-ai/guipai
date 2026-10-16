<script setup>
/**
 * 股票笔记列表 —— 顶部盈亏汇总 + 过滤栏 + 笔记卡片列表/网格。
 *
 * 过滤：关键词 / 股票 / 方向 / 标签（后端过滤）。
 * 浮动盈亏：对 open 持仓笔记调 fetchRealtimePnL 取现价补算。
 * 提醒轮询：挂载启动 startAlertPoller，卸载自动停止（useNotes 内 onUnmounted 兜底）。
 */
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotes } from '@/composables/useNotes'
import StockNoteSummary from '@/components/note/StockNoteSummary.vue'
import NoteEmptyState from '@/components/note/NoteEmptyState.vue'

const router = useRouter()
const {
  loading, notes, total, tags, stocks, summary,
  searchKeyword, selectedStock, selectedTags, selectedDirection, viewMode,
  fetchNotes, fetchStocks, fetchTags, fetchSummary, deleteNote, fetchRealtimePnL,
  startAlertPoller
} = useNotes()

const dirLabel = { buy: '买入', sell: '卖出', add: '加仓', reduce: '减仓' }
const dirType = { buy: 'danger', sell: 'success', add: 'warning', reduce: 'info' }
const holdLabel = { open: '持仓', closed: '清仓', partial: '部分' }
const holdType = { open: 'success', closed: 'info', partial: 'warning' }

const fmt = (n) => (n == null ? '-' : Number(n).toFixed(2))
const fmtPnl = (n) => (n == null ? '' : (n >= 0 ? '+' : '') + Number(n).toFixed(2))

onMounted(async () => {
  await Promise.all([fetchNotes(), fetchStocks(), fetchTags(), fetchSummary()])
  startAlertPoller()
  await fetchRealtimePnL(notes.value)
})

// 过滤变化重新拉取
watch([searchKeyword, selectedStock, selectedTags, selectedDirection], async () => {
  await fetchNotes()
  await fetchRealtimePnL(notes.value)
})

const createNote = () => router.push('/notes/create')
const viewNote = (id) => router.push(`/notes/${id}`)
const editNote = (id) => router.push(`/notes/${id}?mode=edit`)
</script>

<template>
  <div class="note-list">
    <div class="page-header">
      <div>
        <h1 class="page-title">股票笔记</h1>
        <p class="page-desc">记录交易、复盘投资、跟踪提醒</p>
      </div>
      <el-button type="primary" @click="createNote"><el-icon><EditPen /></el-icon> 写笔记</el-button>
    </div>

    <StockNoteSummary :summary="summary" />

    <!-- 过滤栏 -->
    <el-card class="filter-card">
      <el-row :gutter="12">
        <el-col :span="6" :sm="6" :xs="12">
          <el-input v-model="searchKeyword" placeholder="搜索标题/内容/股票" clearable>
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="6" :sm="6" :xs="12">
          <el-select v-model="selectedStock" clearable placeholder="按股票筛选" filterable>
            <el-option v-for="s in stocks" :key="s.code" :label="`${s.code} ${s.name||''} (${s.cnt})`" :value="s.code" />
          </el-select>
        </el-col>
        <el-col :span="4" :sm="4" :xs="12">
          <el-select v-model="selectedDirection" clearable placeholder="方向">
            <el-option label="买入" value="buy" /><el-option label="卖出" value="sell" />
            <el-option label="加仓" value="add" /><el-option label="减仓" value="reduce" />
          </el-select>
        </el-col>
        <el-col :span="5" :sm="5" :xs="12">
          <el-select v-model="selectedTags" multiple clearable filterable placeholder="标签" collapse-tags>
            <el-option v-for="t in tags" :key="t" :label="t" :value="t" />
          </el-select>
        </el-col>
        <el-col :span="3" :sm="3" :xs="24">
          <el-button-group>
            <el-button :type="viewMode==='list'?'primary':''" @click="viewMode='list'"><el-icon><List /></el-icon></el-button>
            <el-button :type="viewMode==='grid'?'primary':''" @click="viewMode='grid'"><el-icon><Grid /></el-icon></el-button>
          </el-button-group>
        </el-col>
      </el-row>
    </el-card>

    <!-- 列表 -->
    <el-card v-if="viewMode === 'list'">
      <NoteEmptyState :loading="loading" :empty="!loading && !notes.length" description="暂无笔记，点击「写笔记」开始记录">
        <el-table :data="notes" stripe>
          <el-table-column label="标题/股票" min-width="200">
            <template #default="{ row }">
              <el-link @click="viewNote(row.id)" :underline="false" class="nt">{{ row.title }}</el-link>
              <div class="sub">{{ row.stockCode || '-' }} {{ row.stockName || '' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="方向" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.direction" :type="dirType[row.direction]" size="small">{{ dirLabel[row.direction] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="价格/数量" width="130">
            <template #default="{ row }">
              <div>{{ fmt(row.tradePrice) }} × {{ row.quantity ?? '-' }}</div>
              <div class="sub">成本 ¥{{ fmt(row.cost) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="浮动盈亏" width="110" align="right">
            <template #default="{ row }">
              <span v-if="row._floatingPnl != null" :class="row._floatingPnl >= 0 ? 'pnl-in' : 'pnl-out'">{{ fmtPnl(row._floatingPnl) }}</span>
              <span v-else class="sub">-</span>
            </template>
          </el-table-column>
          <el-table-column label="持仓" width="80">
            <template #default="{ row }">
              <el-tag v-if="row.holdingStatus" :type="holdType[row.holdingStatus]" size="small" effect="plain">{{ holdLabel[row.holdingStatus] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标签" width="160">
            <template #default="{ row }">
              <el-tag v-for="t in (row.tags||[]).slice(0,3)" :key="t" size="small" type="info" class="tag">{{ t }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="日期" width="110" prop="tradeDate" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewNote(row.id)">查看</el-button>
              <el-button size="small" @click="editNote(row.id)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteNote(row.id, row.title)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </NoteEmptyState>
    </el-card>

    <!-- 网格 -->
    <div v-else class="grid">
      <NoteEmptyState :loading="loading" :empty="!loading && !notes.length" description="暂无笔记">
        <el-row :gutter="16">
          <el-col v-for="n in notes" :key="n.id" :span="8" :md="8" :sm="12" :xs="24" class="col">
            <el-card class="card" @click="viewNote(n.id)">
              <div class="card-top">
                <span class="card-title">{{ n.title }}</span>
                <el-tag v-if="n.direction" :type="dirType[n.direction]" size="small">{{ dirLabel[n.direction] }}</el-tag>
              </div>
              <div class="card-stock">{{ n.stockCode }} {{ n.stockName }}</div>
              <div class="card-price">¥{{ fmt(n.tradePrice) }} × {{ n.quantity ?? '-' }}
                <span class="card-pnl" v-if="n._floatingPnl != null" :class="n._floatingPnl>=0?'pnl-in':'pnl-out'">{{ fmtPnl(n._floatingPnl) }}</span>
              </div>
              <div class="card-foot">
                <el-tag v-if="n.holdingStatus" :type="holdType[n.holdingStatus]" size="small" effect="plain">{{ holdLabel[n.holdingStatus] }}</el-tag>
                <span class="card-date">{{ n.tradeDate || n.updatedAt }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </NoteEmptyState>
    </div>
  </div>
</template>

<style scoped>
.note-list { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 22px; font-weight: 600; }
.page-desc { margin: 4px 0 0; font-size: 13px; color: var(--el-text-color-secondary); }
.filter-card { margin-bottom: 16px; }
.filter-card :deep(.el-select), .filter-card :deep(.el-input) { width: 100%; }
.nt { font-weight: 600; }
.sub { font-size: 12px; color: var(--el-text-color-secondary); }
.tag { margin-right: 4px; }
.pnl-in { color: var(--el-color-danger); font-weight: 600; }
.pnl-out { color: var(--el-color-success); font-weight: 600; }
.grid { margin-top: 4px; }
.col { margin-bottom: 16px; }
.card { cursor: pointer; transition: transform .2s, box-shadow .2s; }
.card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
.card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.card-title { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-stock { font-size: 13px; color: var(--el-text-color-secondary); margin: 6px 0; }
.card-price { font-size: 14px; }
.card-pnl { margin-left: 8px; }
.card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.card-date { font-size: 12px; color: var(--el-text-color-placeholder); }
@media (max-width: 768px) { .note-list { padding: 10px; } }
</style>
