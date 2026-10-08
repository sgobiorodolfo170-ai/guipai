<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStockData } from '@/composables/useStockData'
import { useWatchlistStore } from '@/store/watchlist.store'
import KLineChart from '@/components/common/KLineChart.vue'

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

// K线图状态
const klinePeriod = ref('daily')
const klineAdjust = ref('qfq')

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
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-label">开盘</div>
              <div class="stat-value">{{ stockData.open || '--' }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-label">最高</div>
              <div class="stat-value">{{ stockData.high || '--' }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-label">最低</div>
              <div class="stat-value">{{ stockData.low || '--' }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- K线图 -->
      <el-card class="kline-card">
        <KLineChart
          :stock-code="stockCode"
          v-model:period="klinePeriod"
          v-model:adjust="klineAdjust"
          :show-period-switcher="true"
          :show-adjust-switcher="true"
          :show-drawing-tools="true"
          :show-indicator-bar="true"
          :show-volume="true"
          height="600px"
        />
      </el-card>
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

.kline-card {
  margin-bottom: 20px;
}

.kline-card :deep(.el-card__body) {
  padding: 0;
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
}
</style>