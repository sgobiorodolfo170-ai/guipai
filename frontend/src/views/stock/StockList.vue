<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStockStore } from '@/store/stock.store'
import { useWatchlistStore } from '@/store/watchlist.store'
import { formatPrice, formatPercent, formatChange, getChangeStatus } from '@/utils/stock'

const router = useRouter()
const route = useRoute()
const stockStore = useStockStore()
const watchlistStore = useWatchlistStore()

const loading = ref(false)
const searchKeyword = ref(route.query.search || '')
const stockList = ref([])

onMounted(() => {
  fetchStockList()
})

const fetchStockList = async () => {
  try {
    loading.value = true
    const params = {}
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    
    await stockStore.fetchStockList(params)
    stockList.value = stockStore.stockList
  } catch (error) {
    console.error('获取股票列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchStockList()
}

const viewStockDetail = (code) => {
  router.push(`/stocks/${code}`)
}

const toggleWatchlist = async (code) => {
  try {
    await watchlistStore.toggleWatchlist(code)
  } catch (error) {
    console.error('操作自选股失败:', error)
  }
}

const getChangeClass = (change) => {
  const status = getChangeStatus(change)
  return `stock-${status}`
}
</script>

<template>
  <div class="stock-list">
    <div class="page-header">
      <h1 class="page-title">股票列表</h1>
      <p class="page-description">搜索和浏览股票信息</p>
    </div>
    
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-input
            v-model="searchKeyword"
            placeholder="输入股票代码或名称搜索"
            size="large"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" size="large" @click="handleSearch" :loading="loading">
            搜索
          </el-button>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 股票列表 -->
    <el-card>
      <el-table
        :data="stockList"
        v-loading="loading"
        stripe
        @row-click="(row) => viewStockDetail(row.code)"
        style="cursor: pointer;"
      >
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="price" label="现价" width="100">
          <template #default="{ row }">
            <span class="stock-price" :class="getChangeClass(row.change)">
              {{ formatPrice(row.price) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="change" label="涨跌额" width="100">
          <template #default="{ row }">
            <span :class="getChangeClass(row.change)">
              {{ formatChange(row.change) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="changePercent" label="涨跌幅" width="100">
          <template #default="{ row }">
            <span :class="getChangeClass(row.change)">
              {{ formatPercent(row.changePercent) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="volume" label="成交量" width="120" />
        <el-table-column prop="turnover" label="成交额" width="120" />
        <el-table-column prop="high" label="最高" width="100">
          <template #default="{ row }">
            {{ formatPrice(row.high) }}
          </template>
        </el-table-column>
        <el-table-column prop="low" label="最低" width="100">
          <template #default="{ row }">
            {{ formatPrice(row.low) }}
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
      
      <!-- 空状态 -->
      <el-empty v-if="!loading && stockList.length === 0" description="暂无数据" />
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

.stock-price {
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-fill-color-light);
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