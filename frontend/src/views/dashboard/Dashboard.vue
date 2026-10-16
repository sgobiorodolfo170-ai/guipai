<script setup>
import { ref, onMounted } from 'vue'
import { useStockStore } from '@/store/stock.store'
import { useWatchlistStore } from '@/store/watchlist.store'
import { useNoteStore } from '@/store/note.store'
import KLineChart from '@/components/common/KLineChart.vue'

const stockStore = useStockStore()
const watchlistStore = useWatchlistStore()
const noteStore = useNoteStore()

const loading = ref(false)
const marketData = ref({
  shanghai: { index: '--', change: 0, changePercent: 0 },
  shenzhen: { index: '--', change: 0, changePercent: 0 },
  chinext: { index: '--', change: 0, changePercent: 0 }
})

const stats = ref({
  watchlistCount: 0,
  notesCount: 0
})

onMounted(async () => {
  // 1. 立即从 localStorage 加载上次缓存的指数数据（避免页面空白）
  loadCachedMarketData()
  loading.value = true
  try {
    await Promise.all([
      fetchMarketOverview(),
      fetchStats()
    ])
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
})

/** 从 localStorage 读取上次缓存的指数数据，立即渲染（stale-while-revalidate） */
const loadCachedMarketData = () => {
  try {
    const cached = localStorage.getItem('dashboard_market_data')
    if (cached) {
      marketData.value = JSON.parse(cached)
    }
  } catch (_) { /* ignore parse errors */ }
}

/** 将指数数据写入 localStorage（供下次启动 stale 展示） */
const saveMarketDataToCache = () => {
  try {
    localStorage.setItem('dashboard_market_data', JSON.stringify(marketData.value))
  } catch (_) { /* ignore quota errors */ }
}

const fetchMarketOverview = async () => {
  try {
    await stockStore.fetchMarketOverview()
    const list = stockStore.marketOverview?.data || []
    const find = (kw) => list.find(m =>
      (m.name || '').includes(kw) || String(m.code || '').startsWith(kw)
    )
    const sh = find('上证') || find('000001')
    const sz = find('深证') || find('399001')
    const cy = find('创业') || find('399006')
    // 仅当新数据有值时才更新（否则保持缓存数据不变）
    if (sh || sz || cy) {
      marketData.value = {
        shanghai: { index: sh?.price ?? '--', change: sh?.change ?? 0, changePercent: sh?.changePercent ?? 0 },
        shenzhen: { index: sz?.price ?? '--', change: sz?.change ?? 0, changePercent: sz?.changePercent ?? 0 },
        chinext: { index: cy?.price ?? '--', change: cy?.change ?? 0, changePercent: cy?.changePercent ?? 0 }
      }
      saveMarketDataToCache()
    }
  } catch (error) {
    console.error('获取市场概况失败:', error)
  }
}

const fetchStats = async () => {
  try {
    const [watchlist, notes] = await Promise.all([
      watchlistStore.fetchWatchlist(),
      noteStore.fetchNoteList({ pageSize: 1 })
    ])
    
    stats.value = {
      watchlistCount: watchlist?.data?.length || 0,
      notesCount: notes?.data?.total || 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const getChangeClass = (change) => {
  if (change > 0) return 'stock-up'
  if (change < 0) return 'stock-down'
  return 'stock-flat'
}

const formatChange = (change) => {
  // 后端可能返回字符串型数字或缓存形状不匹配时为 undefined，直接 .toFixed 会抛 TypeError
  // 让整页渲染崩溃（叠加 Electron 深色窗口背景 = 黑屏）。Number 强制转换 + isFinite 兜底。
  const n = Number(change)
  if (!isFinite(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}`
}

const formatPercent = (percent) => {
  const n = Number(percent)
  if (!isFinite(n)) return '--'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

// 指数K线
const indexTabs = [
  { code: '000001', name: '上证指数' },
  { code: '399001', name: '深证成指' },
  { code: '399006', name: '创业板指' }
]
const activeIndex = ref('000001')
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">仪表盘</h1>
      <p class="page-description">股票复盘分析平台概览</p>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <!-- 市场概况 -->
      <el-col :span="24" class="mb-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>市场概况</span>
              <el-tag type="success" v-if="stockStore.isMarketOpen">交易中</el-tag>
              <el-tag type="info" v-else>休市</el-tag>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="market-item">
                <div class="market-name">上证指数</div>
                <div class="market-value">{{ marketData.shanghai.index }}</div>
                <div class="market-change" :class="getChangeClass(marketData.shanghai.change)">
                  {{ formatChange(marketData.shanghai.change) }}
                  ({{ formatPercent(marketData.shanghai.changePercent) }})
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="market-item">
                <div class="market-name">深证成指</div>
                <div class="market-value">{{ marketData.shenzhen.index }}</div>
                <div class="market-change" :class="getChangeClass(marketData.shenzhen.change)">
                  {{ formatChange(marketData.shenzhen.change) }}
                  ({{ formatPercent(marketData.shenzhen.changePercent) }})
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="market-item">
                <div class="market-name">创业板指</div>
                <div class="market-value">{{ marketData.chinext.index }}</div>
                <div class="market-change" :class="getChangeClass(marketData.chinext.change)">
                  {{ formatChange(marketData.chinext.change) }}
                  ({{ formatPercent(marketData.chinext.changePercent) }})
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <!-- 指数K线 -->
      <el-col :span="24" class="mb-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>指数K线</span>
              <el-radio-group v-model="activeIndex" size="small">
                <el-radio-button
                  v-for="idx in indexTabs"
                  :key="idx.code"
                  :value="idx.code"
                >{{ idx.name }}</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <KLineChart
            :key="activeIndex"
            :stock-code="activeIndex"
            :is-index="true"
            :show-period-switcher="true"
            :show-adjust-switcher="false"
            :show-drawing-tools="false"
            :show-volume="true"
            height="400px"
          />
        </el-card>
      </el-col>
      
      <!-- 统计卡片 -->
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#409eff">
                <Star />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.watchlistCount }}</div>
              <div class="stat-label">自选股</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#67c23a">
                <Document />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.notesCount }}</div>
              <div class="stat-label">复盘笔记</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 快捷操作 -->
      <el-col :span="24" class="mt-20">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/notes/create')">
              <el-icon><EditPen /></el-icon>
              写复盘笔记
            </el-button>
            <el-button @click="$router.push('/stocks')">
              <el-icon><Search /></el-icon>
              搜索股票
            </el-button>
            <el-button @click="$router.push('/watchlist')">
              <el-icon><Star /></el-icon>
              管理自选股
            </el-button>
            <el-button @click="$router.push('/templates')">
              <el-icon><Files /></el-icon>
              分析模板
            </el-button>
            <el-button type="success" @click="$router.push('/kline-practice/random-stock')">
              <el-icon><TrendCharts /></el-icon>
              K线实战
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.market-item {
  text-align: center;
  padding: 10px;
}

.market-name {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.market-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.market-change {
  font-size: 14px;
  font-weight: 500;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .quick-actions .el-button {
    width: 100%;
  }
}
</style>