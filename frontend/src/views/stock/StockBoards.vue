<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBoards, getBoardCons } from '@/services/stock.service'
import { ElMessage } from 'element-plus'

const router = useRouter()

const boards = ref([])
const boardLoading = ref(false)
const consDrawer = ref(false)
const currentBoard = ref('')
const consList = ref([])
const consLoading = ref(false)

const fetchBoards = async () => {
  boardLoading.value = true
  try {
    const res = await getBoards()
    const list = res.data || []
    if (list.length) {
      boards.value = list
      // 持久化到 localStorage（stale-while-revalidate：下次启动立即展示旧数据）
      try { localStorage.setItem('stock_boards_cache', JSON.stringify(list)) } catch (_) {}
    } else {
      // 空结果时保持旧数据（不空白页面）
      if (!boards.value.length) boards.value = []
    }
  } catch (e) {
    // 拉取失败时保持旧数据，不空白
    if (!boards.value.length) boards.value = []
  } finally {
    boardLoading.value = false
  }
}

/** 从 localStorage 加载缓存的板块数据（stale 展示，避免页面空白） */
const loadCachedBoards = () => {
  try {
    const cached = localStorage.getItem('stock_boards_cache')
    if (cached) {
      boards.value = JSON.parse(cached)
    }
  } catch (_) { /* ignore */ }
}

const openBoardCons = async (row) => {
  currentBoard.value = row['板块'] || row.label || ''
  consDrawer.value = true
  consList.value = []
  consLoading.value = true
  // 先加载缓存的成分股（stale 展示）
  try {
    const cachedCons = localStorage.getItem(`board_cons_${row.label}`)
    if (cachedCons) consList.value = JSON.parse(cachedCons)
  } catch (_) {}
  try {
    const res = await getBoardCons(row.label)
    const list = res.data || []
    if (list.length) {
      consList.value = list
      try { localStorage.setItem(`board_cons_${row.label}`, JSON.stringify(list)) } catch (_) {}
    }
  } catch (e) {
    if (!consList.value.length) ElMessage.error('成分股获取失败: ' + e.message)
  } finally {
    consLoading.value = false
  }
}

const viewStockDetail = (code) => {
  router.push(`/stocks/${code}`)
}

const fmtAmt = (v) => {
  if (v == null) return '--'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return String(v)
}

onMounted(() => {
  loadCachedBoards()
  fetchBoards()
})
</script>

<template>
  <div class="stock-boards">
    <div class="page-header">
      <h1 class="page-title">行业板块</h1>
      <p class="page-description">浏览行业板块行情，点击板块查看成分股（数据来自新浪行业板块）</p>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>板块列表</span>
          <el-button size="small" @click="fetchBoards" :loading="boardLoading">刷新</el-button>
        </div>
      </template>
      <el-table :data="boards" v-loading="boardLoading" size="small" stripe @row-click="openBoardCons" style="cursor:pointer">
        <el-table-column prop="板块" label="板块" min-width="120" sortable />
        <el-table-column prop="公司家数" label="家数" width="70" align="right" sortable />
        <el-table-column label="涨跌幅" width="100" sortable :sort-method="(a, b) => (a['涨跌幅'] || 0) - (b['涨跌幅'] || 0)">
          <template #default="{ row }">
            <span :class="row['涨跌幅'] > 0 ? 'stock-up' : row['涨跌幅'] < 0 ? 'stock-down' : ''">
              {{ row['涨跌幅'] != null ? (row['涨跌幅'] > 0 ? '+' : '') + Number(row['涨跌幅']).toFixed(2) + '%' : '--' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总成交额" width="120" align="right" sortable :sort-method="(a, b) => (a['总成交额'] || 0) - (b['总成交额'] || 0)">
          <template #default="{ row }">{{ fmtAmt(row['总成交额']) }}</template>
        </el-table-column>
        <el-table-column label="平均价格" width="100" align="right" sortable :sort-method="(a, b) => (a['平均价格'] || 0) - (b['平均价格'] || 0)">
          <template #default="{ row }">{{ row['平均价格'] != null ? Number(row['平均价格']).toFixed(2) : '--' }}</template>
        </el-table-column>
        <el-table-column label="领涨股" min-width="160">
          <template #default="{ row }">
            <span v-if="row['股票名称']">{{ row['股票名称'] }}（{{ row['股票代码'] }}）</span>
            <span v-else class="dim-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default>
            <el-button link type="primary" size="small">成分股</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <span class="dim-text">{{ boardLoading ? '加载中…' : '板块列表为空（需数据源服务运行，点上方刷新）' }}</span>
        </template>
      </el-table>
      <div class="dim-text board-tip">点击板块行查看成分股</div>
    </el-card>

    <!-- 成分股抽屉 -->
    <el-drawer v-model="consDrawer" :title="`${currentBoard} · 成分股`" size="720px" direction="rtl">
      <el-table :data="consList" v-loading="consLoading" size="small" stripe @row-click="(row) => viewStockDetail(row['代码'])" style="cursor:pointer">
        <el-table-column prop="代码" label="代码" width="90" sortable />
        <el-table-column prop="名称" label="名称" min-width="120" sortable />
        <el-table-column label="最新价" width="90" align="right" sortable :sort-method="(a, b) => (a['最新价'] || 0) - (b['最新价'] || 0)">
          <template #default="{ row }">{{ row['最新价'] != null ? Number(row['最新价']).toFixed(2) : '--' }}</template>
        </el-table-column>
        <el-table-column label="涨跌幅" width="90" sortable :sort-method="(a, b) => (a['涨跌幅'] || 0) - (b['涨跌幅'] || 0)">
          <template #default="{ row }">
            <span :class="row['涨跌幅'] > 0 ? 'stock-up' : row['涨跌幅'] < 0 ? 'stock-down' : ''">
              {{ row['涨跌幅'] != null ? (row['涨跌幅'] > 0 ? '+' : '') + Number(row['涨跌幅']).toFixed(2) + '%' : '--' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="PE" width="70" align="right" sortable :sort-method="(a, b) => (a['市盈率'] || 0) - (b['市盈率'] || 0)">
          <template #default="{ row }">{{ row['市盈率'] != null ? Number(row['市盈率']).toFixed(1) : '--' }}</template>
        </el-table-column>
        <el-table-column label="PB" width="70" align="right" sortable :sort-method="(a, b) => (a['市净率'] || 0) - (b['市净率'] || 0)">
          <template #default="{ row }">{{ row['市净率'] != null ? Number(row['市净率']).toFixed(2) : '--' }}</template>
        </el-table-column>
        <el-table-column label="总市值" width="100" align="right" sortable :sort-method="(a, b) => (a['总市值'] || 0) - (b['总市值'] || 0)">
          <template #default="{ row }">{{ fmtAmt(row['总市值']) }}</template>
        </el-table-column>
        <template #empty>
          <span class="dim-text">{{ consLoading ? '加载中…' : '暂无成分股数据' }}</span>
        </template>
      </el-table>
    </el-drawer>
  </div>
</template>

<style scoped>
.stock-boards {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-tip {
  margin-top: 8px;
  font-size: 12px;
}

.dim-text {
  color: #86909c;
  font-size: 12px;
}

.stock-up {
  color: #f56c6c;
}

.stock-down {
  color: #67c23a;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-fill-color-light);
}
</style>
