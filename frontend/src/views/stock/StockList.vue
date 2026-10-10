<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStockStore } from '@/store/stock.store'
import { useWatchlistStore } from '@/store/watchlist.store'
import { getStockRealtime } from '@/services/stock.service'
import { formatPrice, formatPercent, formatChange } from '@/utils/stock'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const stockStore = useStockStore()
const watchlistStore = useWatchlistStore()

const loading = ref(false)
const syncing = ref(false)
const searchKeyword = ref(route.query.search || '')
const stockList = ref([])
const realtimeMap = ref({}) // code -> realtime data
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const activeMarket = ref('') // '' = 全部

// 市场分类 tabs（来自本地库 stock_basic 统计）
const marketTabs = computed(() => {
  const by = stockStore.marketSummary.byMarket || {}
  const order = ['沪市主板', '科创板', '深市主板', '创业板', '北交所']
  const tabs = [{ name: '', label: '全部', count: stockStore.marketSummary.total }]
  for (const m of order) {
    if (by[m] > 0) tabs.push({ name: m, label: m, count: by[m] })
  }
  const other = Object.keys(by)
    .filter(m => !order.includes(m))
    .reduce((s, m) => s + by[m], 0)
  if (other > 0) tabs.push({ name: '其他', label: '其他', count: other })
  return tabs
})

const isEmpty = computed(() => {
  return !loading.value && (stockStore.marketSummary.total || 0) === 0
})

const fetchMarketSummary = async () => {
  try {
    await stockStore.fetchMarketSummary()
  } catch (error) {
    console.error('获取市场分类统计失败:', error)
  }
}

const fetchStockList = async () => {
  try {
    loading.value = true
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (activeMarket.value) params.market = activeMarket.value
    if (searchKeyword.value.trim()) params.search = searchKeyword.value.trim()

    const response = await stockStore.fetchStockList(params)
    stockList.value = stockStore.stockList
    total.value = response?.data?.total ?? stockList.value.length

    // 拉取当前页股票的实时行情数据（价格/涨跌幅/成交额/市值）
    await fetchRealtimeForPage()
  } catch (error) {
    console.error('获取股票列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 拉取当前页股票的实时行情，合并到 realtimeMap */
const fetchRealtimeForPage = async () => {
  const codes = stockList.value.map(s => s.code)
  if (!codes.length) return
  try {
    const resp = await getStockRealtime(codes)
    const list = Array.isArray(resp) ? resp : (resp?.data || [])
    const map = {}
    for (const item of list) {
      if (item.code) map[item.code] = item
    }
    realtimeMap.value = map
  } catch (_) {
    // 实时数据拉取失败不影响列表展示（价格列显示 '--'）
  }
}

/** 获取某只股票的实时数据 */
const rt = (code) => realtimeMap.value[code] || {}

/** 格式化市值 */
const fmtMarketCap = (v) => {
  if (v == null) return '--'
  if (v >= 1e12) return (v / 1e12).toFixed(2) + '万亿'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return String(v)
}

/** 格式化成交额 */
const fmtTurnover = (v) => {
  if (v == null) return '--'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return String(v)
}

const handleSearch = () => {
  page.value = 1
  fetchStockList()
}

const handleMarketChange = () => {
  page.value = 1
  fetchStockList()
}

const handlePageChange = (p) => {
  page.value = p
  fetchStockList()
}

const handlePageSizeChange = (size) => {
  pageSize.value = size
  page.value = 1
  fetchStockList()
}

const handleSync = async () => {
  try {
    await ElMessageBox.confirm(
      '将行情源全市场上市公司列表写入本地数据库，作为股票列表的数据源。是否继续？',
      '同步股票列表',
      { confirmButtonText: '开始同步', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  syncing.value = true
  try {
    await stockStore.syncStockList()
    ElMessage.success('股票列表同步完成')
    page.value = 1
    await fetchStockList()
  } catch (error) {
    ElMessage.error('同步失败: ' + error.message)
  } finally {
    syncing.value = false
  }
}

const viewStockDetail = (code) => {
  router.push(`/stocks/${code}`)
}

const tagType = (market) => {
  if (market === '科创板' || market === '创业板') return 'warning'
  if (market === '北交所') return 'info'
  if (market === '沪市主板') return 'success'
  if (market === '深市主板') return 'primary'
  return ''
}

const toggleWatchlist = async (code) => {
  try {
    await watchlistStore.toggleWatchlist(code)
  } catch (error) {
    console.error('操作自选股失败:', error)
  }
}

onMounted(async () => {
  await fetchMarketSummary()
  await fetchStockList()
})
</script>

<template>
  <div class="stock-list">
    <div class="page-header">
      <h1 class="page-title">股票列表</h1>
      <p class="page-description">汇总国内全部上市公司，按市场分类浏览（数据来自本地数据库）</p>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <div class="toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="输入股票代码或名称搜索"
          size="large"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" :loading="loading" @click="handleSearch">
          搜索
        </el-button>
        <el-button type="warning" size="large" plain :loading="syncing" @click="handleSync">
          同步股票列表
        </el-button>
      </div>
      <div v-if="stockStore.marketSummary.updatedAt" class="sync-tip">
        最近同步：{{ stockStore.marketSummary.updatedAt }}
      </div>
    </el-card>

    <!-- 首次使用：本地库为空，引导同步 -->
    <el-card v-if="isEmpty">
      <el-empty description="本地数据库暂无股票列表数据，请先同步一次">
        <el-button type="primary" size="large" :loading="syncing" @click="handleSync">
          同步股票列表数据
        </el-button>
      </el-empty>
    </el-card>

    <!-- 股票列表 + 市场分类 -->
    <el-card v-else>
      <el-tabs v-model="activeMarket" class="market-tabs" @tab-change="handleMarketChange">
        <el-tab-pane
          v-for="tab in marketTabs"
          :key="tab.name"
          :name="tab.name"
          :label="`${tab.label} (${tab.count})`"
        />
      </el-tabs>

      <el-table
        :data="stockList"
        v-loading="loading"
        stripe
        @row-click="(row) => viewStockDetail(row.code)"
        style="cursor: pointer;"
      >
        <el-table-column prop="code" label="代码" width="110" sortable />
        <el-table-column prop="name" label="名称" min-width="120" sortable />
        <el-table-column prop="market" label="市场" width="110" sortable>
          <template #default="{ row }">
            <el-tag size="small" :type="tagType(row.market)">{{ row.market }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最新价" width="90" align="right" sortable :sort-method="(a, b) => (rt(a.code).price || 0) - (rt(b.code).price || 0)">
          <template #default="{ row }">
            <span>{{ formatPrice(rt(row.code).price) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="涨跌幅" width="100" align="right" sortable :sort-method="(a, b) => (rt(a.code).changePercent || 0) - (rt(b.code).changePercent || 0)">
          <template #default="{ row }">
            <span :class="(rt(row.code).changePercent || 0) > 0 ? 'stock-up' : (rt(row.code).changePercent || 0) < 0 ? 'stock-down' : ''">
              {{ rt(row.code).changePercent != null ? formatPercent(rt(row.code).changePercent) : '--' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="成交额" width="100" align="right" sortable :sort-method="(a, b) => (rt(a.code).turnover || 0) - (rt(b.code).turnover || 0)">
          <template #default="{ row }">
            <span>{{ fmtTurnover(rt(row.code).turnover) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="市值" width="110" align="right" sortable :sort-method="(a, b) => (rt(a.code).totalMarketValue || 0) - (rt(b.code).totalMarketValue || 0)">
          <template #default="{ row }">
            <span>{{ fmtMarketCap(rt(row.code).totalMarketValue) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              :type="watchlistStore.isInWatchlist(row.code) ? 'warning' : 'primary'"
              size="small"
              @click.stop="toggleWatchlist(row.code)"
            >
              <el-icon>
                <Star v-if="watchlistStore.isInWatchlist(row.code)" />
                <StarFilled v-else />
              </el-icon>
              {{ watchlistStore.isInWatchlist(row.code) ? '取消' : '自选' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && stockList.length === 0" description="暂无数据" />

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.stock-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar .el-input {
  flex: 1;
}

.sync-tip {
  margin-top: 8px;
  color: #86909c;
  font-size: 12px;
}

.market-tabs {
  margin-bottom: 12px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-fill-color-light);
}

.stock-up {
  color: #f56c6c;
}

.stock-down {
  color: #67c23a;
}

@media (max-width: 768px) {
  .stock-list {
    padding: 10px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }
}
</style>
