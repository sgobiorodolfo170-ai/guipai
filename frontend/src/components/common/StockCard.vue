<script setup>
import { computed } from 'vue'
import { formatPrice, formatPercent, formatChange, getChangeStatus } from '@/utils/stock'

const props = defineProps({
  stock: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['view-detail', 'toggle-watchlist'])

// 计算属性
const changeStatus = computed(() => getChangeStatus(props.stock.change))
const changeClass = computed(() => `stock-${changeStatus.value}`)

const handleViewDetail = () => {
  emit('view-detail', props.stock.code)
}

const handleToggleWatchlist = () => {
  emit('toggle-watchlist', props.stock.code)
}
</script>

<template>
  <el-card class="stock-card" @click="handleViewDetail">
    <div class="stock-header">
      <div class="stock-info">
        <div class="stock-code">{{ stock.code }}</div>
        <div class="stock-name">{{ stock.name }}</div>
      </div>
      <div class="stock-actions" v-if="showActions" @click.stop>
        <el-button
          circle
          size="small"
          @click="handleToggleWatchlist"
        >
          <el-icon>
            <Star />
          </el-icon>
        </el-button>
      </div>
    </div>
    
    <div class="stock-price">
      <div class="current-price" :class="changeClass">
        {{ formatPrice(stock.price) }}
      </div>
      <div class="price-change" :class="changeClass">
        <span class="change-amount">{{ formatChange(stock.change) }}</span>
        <span class="change-percent">{{ formatPercent(stock.changePercent) }}</span>
      </div>
    </div>
    
    <div class="stock-stats">
      <div class="stat-item">
        <span class="stat-label">最高</span>
        <span class="stat-value">{{ formatPrice(stock.high) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最低</span>
        <span class="stat-value">{{ formatPrice(stock.low) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">成交量</span>
        <span class="stat-value">{{ stock.volume }}</span>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.stock-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 180px;
}

.stock-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stock-info {
  flex: 1;
}

.stock-code {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stock-name {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.stock-actions {
  flex-shrink: 0;
}

.stock-price {
  margin-bottom: 16px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  margin-bottom: 4px;
}

.price-change {
  font-size: 14px;
  font-weight: 500;
}

.change-amount {
  margin-right: 8px;
}

.stock-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

@media (max-width: 768px) {
  .stock-card {
    height: auto;
    min-height: 160px;
  }
  
  .current-price {
    font-size: 20px;
  }
  
  .stock-stats {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .stat-item {
    flex: 0 0 calc(50% - 4px);
  }
}
</style>