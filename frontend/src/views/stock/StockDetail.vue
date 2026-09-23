<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStockData } from '@/composables/useStockData'
import { useWatchlistStore } from '@/store/watchlist.store'

const route = useRoute()
const watchlistStore = useWatchlistStore()

const stockCode = computed(() => route.params.code)
const {
  loading,
  stockData,
  formattedPrice,
  formattedChange,
  formattedChangePercent,
  changeStatus,
  fetchStockDetail
} = useStockData(stockCode.value)

const chartPeriod = ref('1d')

onMounted(() => {
  if (stockCode.value) {
    fetchStockDetail(stockCode.value)
  }
})

const toggleWatchlist = async () => {
  try {
    await watchlistStore.toggleWatchlist(stockCode.value)
  } catch (error) {
    console.error('操作自选股失败:', error)
  }
}

const isInWatchlist = computed(() => {
  return watchlistStore.isInWatchlist(stockCode.value)
})
</script>

<template>
  <div class="stock-detail" v-loading="loading">
    <div v-if="stockData" class="stock-content">
      <!-- 股票基本信息 -->
      <el-card class="stock-info-card">
        <div class="stock-header">
          <div class="stock-basic">
            <h1 class="stock-title">
              {{ stockData.name }} ({{ stockData.code }})
            </h1>
            <div class="stock-market">{{ stockData.market }}</div>
          </div>
          <div class="stock-actions">
            <el-button
              :type="isInWatchlist ? 'warning' : 'primary'"
              @click="toggleWatchlist"
            >
              <el-icon>
                <Star v-if="!isInWatchlist" />
                <StarFilled v-else />
              </el-icon>
              {{ isInWatchlist ? '取消自选' : '加入自选' }}
            </el-button>
          </div>
        </div>
        
        <div class="price-info">
          <div class="current-price" :class="`stock-${changeStatus}`">
            {{ formattedPrice }}
          </div>
          <div class="price-change" :class="`stock-${changeStatus}`">
            <span class="change-amount">{{ formattedChange }}</span>
            <span class="change-percent">{{ formattedChangePercent }}</span>
          </div>
        </div>
        
        <el-row :gutter="20" class="stock-stats">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">开盘</div>
              <div class="stat-value">{{ stockData.open || '--' }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">最高</div>
              <div class="stat-value">{{ stockData.high || '--' }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">最低</div>
              <div class="stat-value">{{ stockData.low || '--' }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-label">昨收</div>
              <div class="stat-value">{{ stockData.prevClose || '--' }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
      
      <!-- K线图表区域 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span>K线图</span>
            <div class="chart-controls">
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button label="1d">日K</el-radio-button>
                <el-radio-button label="1w">周K</el-radio-button>
                <el-radio-button label="1m">月K</el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </template>
        
        <div class="chart-container">
          <!-- 这里将来集成 ECharts K线图 -->
          <div class="chart-placeholder">
            <el-icon size="48" color="#ccc">
              <TrendCharts />
            </el-icon>
            <p>K线图表开发中...</p>
          </div>
        </div>
      </el-card>
      
      <!-- 详细数据 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>交易数据</span>
            </template>
            <div class="data-list">
              <div class="data-item">
                <span class="data-label">成交量</span>
                <span class="data-value">{{ stockData.volume || '--' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">成交额</span>
                <span class="data-value">{{ stockData.turnover || '--' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">换手率</span>
                <span class="data-value">{{ stockData.turnoverRate || '--' }}%</span>
              </div>
              <div class="data-item">
                <span class="data-label">市盈率</span>
                <span class="data-value">{{ stockData.pe || '--' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>基本信息</span>
            </template>
            <div class="data-list">
              <div class="data-item">
                <span class="data-label">总市值</span>
                <span class="data-value">{{ stockData.marketCap || '--' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">流通市值</span>
                <span class="data-value">{{ stockData.floatMarketCap || '--' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">市净率</span>
                <span class="data-value">{{ stockData.pb || '--' }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">所属行业</span>
                <span class="data-value">{{ stockData.industry || '--' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="股票信息不存在" />
  </div>
</template>

<style scoped>
.stock-detail {
  padding: 20px;
}

.stock-content {
  max-width: 1200px;
  margin: 0 auto;
}

.stock-info-card {
  margin-bottom: 20px;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.stock-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.stock-market {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.price-info {
  margin-bottom: 24px;
}

.current-price {
  font-size: 36px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  margin-bottom: 8px;
}

.price-change {
  font-size: 16px;
  font-weight: 500;
}

.change-amount {
  margin-right: 12px;
}

.stock-stats {
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 400px;
  position: relative;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.data-item:last-child {
  border-bottom: none;
}

.data-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.data-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  font-size: 14px;
}

@media (max-width: 768px) {
  .stock-detail {
    padding: 10px;
  }
  
  .stock-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .stock-title {
    font-size: 20px;
  }
  
  .current-price {
    font-size: 28px;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>