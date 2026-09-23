<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStockData } from '@/composables/useStockData'

const route = useRoute()
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

const analysisData = ref({
  technicalIndicators: {
    rsi: 65.2,
    macd: 0.15,
    ma5: 12.45,
    ma10: 12.38,
    ma20: 12.25,
    ma60: 12.10
  },
  fundamentalData: {
    pe: 15.6,
    pb: 1.8,
    roe: 12.5,
    eps: 0.85,
    revenue: '125.6亿',
    netProfit: '8.9亿'
  }
})

const chartType = ref('kline')

onMounted(() => {
  if (stockCode.value) {
    fetchStockDetail(stockCode.value)
  }
})
</script>

<template>
  <div class="stock-analysis" v-loading="loading">
    <div v-if="stockData" class="analysis-content">
      <!-- 股票基本信息 -->
      <el-card class="stock-header-card">
        <div class="stock-header">
          <div class="stock-info">
            <h1 class="stock-title">
              {{ stockData.name }} ({{ stockData.code }}) - 技术分析
            </h1>
            <div class="price-info">
              <span class="current-price" :class="`stock-${changeStatus}`">
                {{ formattedPrice }}
              </span>
              <span class="price-change" :class="`stock-${changeStatus}`">
                {{ formattedChange }} ({{ formattedChangePercent }})
              </span>
            </div>
          </div>
        </div>
      </el-card>
      
      <el-row :gutter="20">
        <!-- 技术指标 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>技术指标</span>
            </template>
            
            <div class="indicators-grid">
              <div class="indicator-item">
                <div class="indicator-label">RSI (14)</div>
                <div class="indicator-value">
                  {{ analysisData.technicalIndicators.rsi }}
                  <el-tag
                    :type="analysisData.technicalIndicators.rsi > 70 ? 'danger' : 
                           analysisData.technicalIndicators.rsi < 30 ? 'success' : 'info'"
                    size="small"
                  >
                    {{ analysisData.technicalIndicators.rsi > 70 ? '超买' : 
                        analysisData.technicalIndicators.rsi < 30 ? '超卖' : '正常' }}
                  </el-tag>
                </div>
              </div>
              
              <div class="indicator-item">
                <div class="indicator-label">MACD</div>
                <div class="indicator-value">
                  {{ analysisData.technicalIndicators.macd }}
                  <el-tag
                    :type="analysisData.technicalIndicators.macd > 0 ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ analysisData.technicalIndicators.macd > 0 ? '多头' : '空头' }}
                  </el-tag>
                </div>
              </div>
              
              <div class="indicator-item">
                <div class="indicator-label">MA5</div>
                <div class="indicator-value">{{ analysisData.technicalIndicators.ma5 }}</div>
              </div>
              
              <div class="indicator-item">
                <div class="indicator-label">MA10</div>
                <div class="indicator-value">{{ analysisData.technicalIndicators.ma10 }}</div>
              </div>
              
              <div class="indicator-item">
                <div class="indicator-label">MA20</div>
                <div class="indicator-value">{{ analysisData.technicalIndicators.ma20 }}</div>
              </div>
              
              <div class="indicator-item">
                <div class="indicator-label">MA60</div>
                <div class="indicator-value">{{ analysisData.technicalIndicators.ma60 }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 基本面数据 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>基本面数据</span>
            </template>
            
            <div class="fundamental-grid">
              <div class="fundamental-item">
                <div class="fundamental-label">市盈率 (PE)</div>
                <div class="fundamental-value">{{ analysisData.fundamentalData.pe }}</div>
              </div>
              
              <div class="fundamental-item">
                <div class="fundamental-label">市净率 (PB)</div>
                <div class="fundamental-value">{{ analysisData.fundamentalData.pb }}</div>
              </div>
              
              <div class="fundamental-item">
                <div class="fundamental-label">净资产收益率 (ROE)</div>
                <div class="fundamental-value">{{ analysisData.fundamentalData.roe }}%</div>
              </div>
              
              <div class="fundamental-item">
                <div class="fundamental-label">每股收益 (EPS)</div>
                <div class="fundamental-value">{{ analysisData.fundamentalData.eps }}</div>
              </div>
              
              <div class="fundamental-item">
                <div class="fundamental-label">营业收入</div>
                <div class="fundamental-value">{{ analysisData.fundamentalData.revenue }}</div>
              </div>
              
              <div class="fundamental-item">
                <div class="fundamental-label">净利润</div>
                <div class="fundamental-value">{{ analysisData.fundamentalData.netProfit }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 分析图表 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>技术分析图表</span>
                <el-radio-group v-model="chartType" size="small">
                  <el-radio-button label="kline">K线图</el-radio-button>
                  <el-radio-button label="volume">成交量</el-radio-button>
                  <el-radio-button label="indicators">技术指标</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            
            <div class="chart-container">
              <!-- 这里将来集成 ECharts 图表 -->
              <div class="chart-placeholder">
                <el-icon size="64" color="#ccc">
                  <TrendCharts />
                </el-icon>
                <p>技术分析图表开发中...</p>
                <p>将集成K线图、成交量、RSI、MACD等技术指标</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 分析建议 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>技术面分析</span>
            </template>
            
            <div class="analysis-content">
              <div class="analysis-item">
                <h4>趋势分析</h4>
                <p>当前股价位于5日、10日、20日均线之上，短期趋势向好。成交量配合放大，显示资金关注度较高。</p>
              </div>
              
              <div class="analysis-item">
                <h4>支撑阻力</h4>
                <p>支撑位：12.20元（20日均线）、12.10元（60日均线）</p>
                <p>阻力位：12.80元（前期高点）、13.00元（整数关口）</p>
              </div>
              
              <div class="analysis-item">
                <h4>技术指标</h4>
                <p>RSI指标显示股价处于正常区间，MACD金叉向上，技术面偏多。</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>基本面分析</span>
            </template>
            
            <div class="analysis-content">
              <div class="analysis-item">
                <h4>估值水平</h4>
                <p>当前PE为15.6倍，PB为1.8倍，相对于行业平均水平处于合理区间。</p>
              </div>
              
              <div class="analysis-item">
                <h4>盈利能力</h4>
                <p>ROE为12.5%，显示公司盈利能力较强。EPS为0.85元，同比增长15%。</p>
              </div>
              
              <div class="analysis-item">
                <h4>财务状况</h4>
                <p>营业收入125.6亿元，净利润8.9亿元，财务状况稳健。</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 投资建议 -->
      <el-card>
        <template #header>
          <span>投资建议</span>
        </template>
        
        <div class="investment-advice">
          <el-alert
            title="综合评级：买入"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>基于技术面和基本面分析，该股票当前具备以下特点：</p>
              <ul>
                <li>技术面：短期趋势向好，技术指标偏多</li>
                <li>基本面：估值合理，盈利能力较强</li>
                <li>风险提示：关注大盘走势和行业政策变化</li>
              </ul>
              <p><strong>建议操作：</strong>可在12.20-12.30区间分批买入，止损位12.00，目标位13.00。</p>
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>
    
    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="股票信息不存在" />
  </div>
</template>

<style scoped>
.stock-analysis {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stock-header-card {
  margin-bottom: 20px;
}

.stock-title {
  margin: 0 0 12px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.price-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-price {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.price-change {
  font-size: 16px;
  font-weight: 500;
}

.indicators-grid,
.fundamental-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.indicator-item,
.fundamental-item {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.indicator-label,
.fundamental-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.indicator-value,
.fundamental-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
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
  text-align: center;
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.analysis-item h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.analysis-item p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.investment-advice {
  margin-top: 16px;
}

.investment-advice ul {
  margin: 12px 0;
  padding-left: 20px;
}

.investment-advice li {
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .stock-analysis {
    padding: 10px;
  }
  
  .indicators-grid,
  .fundamental-grid {
    grid-template-columns: 1fr;
  }
  
  .price-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .current-price {
    font-size: 24px;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>