<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useStockStore } from '@/store/stock.store'
import { useWatchlistStore } from '@/store/watchlist.store'
import { useNoteStore } from '@/store/note.store'

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
  notesCount: 0,
  templatesCount: 0
})

// 资产信息
const assetInfo = ref({
  totalAssets: 101500, // 总资产
  availableFunds: 101500, // 可用资金
  positionValue: 0, // 持仓市值
  todayProfit: 0, // 今日盈亏
  totalProfit: 0, // 总盈亏
  profitRate: 0 // 收益率
})

// 资产变化趋势数据（模拟数据）
const assetTrendData = ref([
  { date: '2024-01-01', value: 100000 },
  { date: '2024-01-02', value: 100500 },
  { date: '2024-01-03', value: 101000 },
  { date: '2024-01-04', value: 100800 },
  { date: '2024-01-05', value: 101500 },
  { date: '2024-01-06', value: 101200 },
  { date: '2024-01-07', value: 101800 }
])

onMounted(async () => {
  loading.value = true
  try {
    // 获取基础数据
    await Promise.all([
      fetchMarketOverview(),
      fetchStats(),
      initAssetChart()
    ])
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
})

const fetchMarketOverview = async () => {
  try {
    await stockStore.fetchMarketOverview()
    const list = stockStore.marketOverview?.data || []
    // 按名称/代码映射三大指数到本地展示
    const find = (kw) => list.find(m =>
      (m.name || '').includes(kw) || String(m.code || '').startsWith(kw)
    )
    const sh = find('上证') || find('000001')
    const sz = find('深证') || find('399001')
    const cy = find('创业') || find('399006')
    marketData.value = {
      shanghai: { index: sh?.price ?? '--', change: sh?.change ?? 0, changePercent: sh?.changePercent ?? 0 },
      shenzhen: { index: sz?.price ?? '--', change: sz?.change ?? 0, changePercent: sz?.changePercent ?? 0 },
      chinext: { index: cy?.price ?? '--', change: cy?.change ?? 0, changePercent: cy?.changePercent ?? 0 }
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
      notesCount: notes?.data?.total || 0,
      templatesCount: 0
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
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}`
}

const formatPercent = (percent) => {
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

// 初始化资产趋势图表
const assetChartContainer = ref(null)
const assetChart = ref(null)

// 资产图表 resize 处理（固定引用，供注册与卸载共用，避免监听器累积）
const handleAssetResize = () => {
  assetChart.value?.resize()
}

const initAssetChart = async () => {
  await nextTick()
  if (!assetChartContainer.value) return
  
  const echarts = await import('echarts')
  assetChart.value = echarts.init(assetChartContainer.value)
  
  const option = {
    title: {
      text: '资产变化趋势',
      left: 'center',
      textStyle: {
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        const data = params[0]
        return `${data.name}<br/>总资产: ¥${(data.value / 10000).toFixed(2)}万`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: assetTrendData.value.map(item => item.date),
      axisLabel: {
        formatter: function(value) {
          return value.substring(5) // 只显示月-日
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value) {
          return (value / 10000).toFixed(1) + '万'
        }
      }
    },
    series: [
      {
        name: '总资产',
        type: 'line',
        data: assetTrendData.value.map(item => item.value),
        smooth: true,
        lineStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(64, 158, 255, 0.3)'
            }, {
              offset: 1, color: 'rgba(64, 158, 255, 0.1)'
            }]
          }
        }
      }
    ]
  }
  
  assetChart.value.setOption(option)
  
  // 响应式调整（幂等注册，避免每次初始化都叠加监听器）
  window.removeEventListener('resize', handleAssetResize)
  window.addEventListener('resize', handleAssetResize)
}

// 格式化金额
const formatAmount = (amount) => {
  return (amount / 10000).toFixed(2)
}

// 获取盈亏颜色类
const getProfitClass = (profit) => {
  if (profit > 0) return 'profit-positive'
  if (profit < 0) return 'profit-negative'
  return 'profit-neutral'
}

// 组件卸载时移除 resize 监听并销毁图表
onUnmounted(() => {
  window.removeEventListener('resize', handleAssetResize)
  if (assetChart.value) {
    assetChart.value.dispose()
    assetChart.value = null
  }
})
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
      
      <!-- 资产概况 -->
      <el-col :span="24" class="mb-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>资产概况</span>
              <el-tag type="primary">模拟账户</el-tag>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="asset-item">
                <div class="asset-label">总资产</div>
                <div class="asset-value primary">¥{{ formatAmount(assetInfo.totalAssets) }}万</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="asset-item">
                <div class="asset-label">可用资金</div>
                <div class="asset-value">¥{{ formatAmount(assetInfo.availableFunds) }}万</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="asset-item">
                <div class="asset-label">持仓市值</div>
                <div class="asset-value">¥{{ formatAmount(assetInfo.positionValue) }}万</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="asset-item">
                <div class="asset-label">总盈亏</div>
                <div class="asset-value" :class="getProfitClass(assetInfo.totalProfit)">
                  ¥{{ formatAmount(assetInfo.totalProfit) }}万
                  ({{ formatPercent(assetInfo.profitRate) }})
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <!-- 资产趋势图 -->
      <el-col :span="12" class="mb-20">
        <el-card>
          <div ref="assetChartContainer" class="asset-chart"></div>
        </el-card>
      </el-col>
      
      <!-- 统计卡片 -->
      <el-col :span="4">
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
      
      <el-col :span="4">
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
      
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32" color="#e6a23c">
                <Files />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.templatesCount }}</div>
              <div class="stat-label">分析模板</div>
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

.asset-item {
  text-align: center;
  padding: 10px;
}

.asset-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.asset-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.asset-value.primary {
  font-size: 24px;
  color: var(--el-color-primary);
}

.profit-positive {
  color: #f56c6c;
}

.profit-negative {
  color: #67c23a;
}

.profit-neutral {
  color: var(--el-text-color-primary);
}

.asset-chart {
  width: 100%;
  height: 300px;
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
  
  .asset-chart {
    height: 250px;
  }
}
</style>