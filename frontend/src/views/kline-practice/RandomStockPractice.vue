<template>
  <div class="kline-practice" v-loading="loading">
    <!--    <div class="page-header">-->
    <!--      <h1 class="page-title">A股随机K线实战</h1>-->
    <!--      <p class="page-description">通过模拟交易提升K线分析能力</p>-->
    <!--    </div>-->

    <div class="practice-container">
      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- K线图区域 -->
        <div class="chart-section">
          <el-card class="chart-card">
            <!--            <template #header>-->
            <!--              <div class="chart-header">-->
            <!--                <span>{{ stockInfo.codeName }}({{ stockInfo.code }})</span>-->
            <!--                <el-tag v-if="stockInfo.status" :type="stockInfo.status === '上市' ? 'success' : 'info'">-->
            <!--                  {{ stockInfo.status }}-->
            <!--                </el-tag>-->
            <!--              </div>-->
            <!--            </template>-->
            <KLine
                ref="klineRef"
                :data="chartData"
                :style="{ height: '710px', width: '100%' }"
                :mas="[5, 10, 30, 120]"
                :showMA="true"
                :showVolume="true"
                :showLegendData="true"
                :tooltip-display-items="{
                  kline: true,    // 显示K线核心数据
                  volume: true,  // 关闭成交量显示
                  indicator: true // 显示技术指标
                }"
                :showIndicatorButtons="true"
            />
          </el-card>
        </div>
      </div>

      <!-- 右侧操作面板 -->
      <div class="trading-panel">
        <el-card class="panel-card">
          <!-- 价格信息卡片 -->
          <div class="price-card">
            <div class="price-header">
              <span class="price-title">当前价格</span>
            </div>
            <div class="current-price-container">
              <div class="current-price">
                {{ tradingState.currentPrice.toFixed(2) }}
                <span
                  class="change-percent"
                  :class="{
                    'price-up': tradingState.priceChange > 0,
                    'price-down': tradingState.priceChange < 0,
                    'price-flat': tradingState.priceChange === 0
                  }"
                >
                  {{ tradingState.priceChange > 0 ? '+' : '' }}{{ tradingState.priceChangePercent.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- 资金持仓信息 -->
          <div class="account-info">
            <div class="info-section-title">账户信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">总资产:</span>
                <span class="value highlight">{{ formatAmount(tradingState.totalAssets) }}</span>
              </div>
              <div class="info-item">
                <span class="label">可用资金:</span>
                <span class="value">{{ formatAmount(tradingState.availableFunds) }}</span>
              </div>
              <div class="info-item">
                <span class="label">持仓市值:</span>
                <span class="value">{{ formatAmount(tradingState.positionValue) }}</span>
              </div>
              <div class="info-item">
                <span class="label">持仓数量:</span>
                <span class="value">{{ tradingState.position }}</span>
              </div>

              <div class="info-item">
                <span class="label">持仓成本:</span>
                <span class="value">{{ formatAmount(tradingState.positionCost) }}</span>
              </div>

              <div class="info-item">
                <span class="label">持仓收益:</span>
                <span
                    class="value"
                    :class="{
              'profit': tradingState.positionProfit > 0,
              'loss': tradingState.positionProfit < 0
            }"
                >
            {{ formatAmount(tradingState.positionProfit) }}
          </span>
              </div>
            </div>
          </div>

          <!-- 交易操作区 -->
          <div class="trading-actions">
            <!-- 统一交易输入框 -->
            <div class="trade-input-section">
              <el-input-number
                  v-model="tradeAmount"
                  :min="0"
                  :step="100"
                  placeholder="交易数量"
                  size="small"
                  class="amount-input"
              />
              <div class="max-hint">最大可买入: {{ maxBuyAmount }}</div>
            </div>

            <!-- 交易按钮组 -->
<!--            <div class="trade-buttons-group">-->
<!--              <el-button-->
<!--                  type="default"-->
<!--                  @click="handleBatchBuy"-->
<!--                  :disabled="maxBuyAmount <= 0"-->
<!--                  size="small"-->
<!--                  class="action-btn batch-buy-btn"-->
<!--              >-->
<!--                批量买入-->
<!--              </el-button>-->

<!--              <el-button-->
<!--                  type="default"-->
<!--                  @click="handleBatchSell"-->
<!--                  :disabled="maxSellAmount <= 0"-->
<!--                  size="small"-->
<!--                  class="action-btn batch-sell-btn"-->
<!--              >-->
<!--                批量卖出-->
<!--              </el-button>-->
            </div>

            <!-- 快捷操作 -->
            <div class="quick-actions">
              <div class="quick-actions">
                <el-button
                    type="danger"
                    @click="handleBuy"
                    :disabled="maxBuyAmount <= 0"
                    size="small"
                    class="quick-action-btn"
                >
                  买入
                </el-button>
              <el-button
                  type="danger"
                  @click="handleFullPosition"
                  :disabled="maxBuyAmount <= 0 || isTrainingCompleted"
                  size="small"
                  class="quick-action-btn"
              >
                一键满仓
              </el-button>
              <el-button
                  type="success"
                  @click="handleSell"
                  :disabled="maxSellAmount <= 0"
                  size="small"
                  class="quick-action-btn"
              >
                卖出
              </el-button>
              <el-button
                  type="success"
                  @click="handleClearPosition"
                  :disabled="tradingState.position <= 0 || isTrainingCompleted"
                  size="small"
                  class="quick-action-btn"
              >
                一键空仓
              </el-button>
            </div>
          </div>

          <!-- 训练控制区 -->
          <div class="training-controls">
            <div class="control-section-title">训练控制</div>
            <div class="progress-info">
              <div class="progress-text">
                K线进度: {{ tradeProgress.current - 199 }}/{{ tradeProgress.total - 200 }}
              </div>
              <el-progress
                  :percentage="progressPercentage"
                  :stroke-width="6"
                  text-inside
                  :status="getProgressStatus()"
                  class="progress-bar"
              ></el-progress>
            </div>

            <div class="control-buttons">
              <el-button
                  type="primary"
                  @click="handleStartTraining"
                  :disabled="currentIndex >= klineData.length - 1 || isTrainingCompleted"
                  size="small"
                  class="control-btn"
              >
                {{ trainingSettings.autoPlay ? '暂停播放' : '自动播放' }}
              </el-button>
              <el-button
                  type="warning"
                  @click="handleNextStep"
                  :disabled="currentIndex > klineData.length - 1 || isTrainingCompleted"
                  size="small"
                  class="control-btn"
              >
                下一天
              </el-button>
            </div>

            <div class="speed-control">
              <span class="speed-label">速度:</span>
              <el-select v-model="trainingSettings.speed" size="small" class="speed-select">
                <el-option label="0.5秒" :value="0.5"/>
                <el-option label="1秒" :value="1"/>
                <el-option label="2秒" :value="2"/>
                <el-option label="5秒" :value="5"/>
              </el-select>
            </div>

            <el-button
                type="primary"
                @click="handleChangeStock"
                size="small"
                class="change-stock-btn"
            >
              换股
            </el-button>
          </div>
        </el-card>
      </div>

    </div>

    <!-- 交易记录区 -->
    <div class="trade-records">
      <el-card>
        <template #header>
          <span>交易记录 (共 {{ tradeRecords.length }} 笔交易)</span>
        </template>

        <el-table :data="tradeRecords" size="small">
          <el-table-column prop="position" label="交易位置" width="80"/>
          <el-table-column prop="operation" label="操作主体" width="80"/>
          <el-table-column prop="direction" label="方向" width="80">
            <template #default="{ row }">
              <el-tag :type="row.direction === '买入' ? 'danger' : 'success'">
                {{ row.direction }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="成交价" width="100">
            <template #default="{ row }">
              {{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="成交量" width="100"/>
          <el-table-column prop="total" label="成交额" width="120">
            <template #default="{ row }">
              {{ row.total.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="index" label="交易序号" width="100"/>
        </el-table>
      </el-card>
    </div>

    <!-- 训练结果弹窗 -->
    <el-dialog
        v-model="resultDialogVisible"
        title="实战结果"
        width="500px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
    >
      <div class="result-content">
        <div class="result-header">
          <h3>{{ stockInfo.codeName }}({{ stockInfo.code }})</h3>
          <div class="result-summary">
            <div class="profit-info" :class="getProfitClass(trainingResult.totalProfit)">
              <div class="profit-rate">
                收益率: {{ formatPercent(trainingResult.operationProfitRate) }}
              </div>
              <div class="profit-amount">
                收益金额: ¥{{ (trainingResult.totalProfit || 0).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <div class="result-details">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">操作次数:</span>
                <span class="detail-value">{{ trainingResult.tradeTimes || 0 }}次</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">股票名称:</span>
                <span class="detail-value">{{ stockInfo.codeName }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">股票代码:</span>
                <span class="detail-value">{{ stockInfo.code }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <span class="detail-label">交易时间:</span>
                <span class="detail-value">{{ formatDateRange() }}</span>
              </div>
            </el-col>
            <el-col :span="24">
              <div class="detail-item">
                <span class="detail-label">{{ stockInfo.codeName }}区间涨跌幅:</span>
                <span class="detail-value" :class="getProfitClass(trainingResult.stockRangeProfitRate)">
                  {{ formatPercent(trainingResult.stockRangeProfitRate) }}
                </span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleRestartTraining">重新开始</el-button>
          <el-button @click="resultDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue'
import {ElMessage} from 'element-plus'
import {getRandomKlineData, submitTrainingResult, getLocalUser} from '@/services/kline.service'
import KLine from '@/components/common/KLine.vue'

// 常量定义
const TRAINING_START_INDEX = 200 // 训练开始的索引位置

// 响应式数据
const loading = ref(false)
const klineRef = ref(null)

// 股票数据
const stockInfo = ref({})
const klineData = ref([])
const currentIndex = ref(0)
const visibleData = ref([])
const chartData = ref([])
// 训练的天数
const trainingDays = ref(50)

//储初始资金
const initialCapital = ref(0)

// 交易状态
const tradingState = ref({
  currentPrice: 0,
  priceChange: 0,
  priceChangePercent: 0,
  availableFunds: 0, // 可用资金
  position: 0, // 持仓数量
  positionValue: 0, // 持仓市值
  positionCost: 0, // 持仓成本
  totalAssets: 0, // 总资产
  positionProfit: 0, // 持仓收益
  strategy: ''
})

// 交易记录
const tradeRecords = ref([])
const tradeProgress = ref({current: TRAINING_START_INDEX, total: TRAINING_START_INDEX + trainingDays.value})

// 交易输入
const tradeForm = ref({
  buyAmount: TRAINING_START_INDEX,
  sellAmount: TRAINING_START_INDEX
})

// 统一交易数量（用于新UI格式）
const tradeAmount = ref(200)

// 结果弹窗
const resultDialogVisible = ref(false)
const trainingResult = ref({})

// 训练设置
const trainingSettings = ref({
  speed: 0.5, // 秒
  autoPlay: false
})

// 自动播放定时器（模块级引用，供换股/卸载时清理，避免泄漏）
let autoPlayTimer = null
const stopAutoPlay = () => {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
  trainingSettings.value.autoPlay = false
}

// 训练完成状态标记
const isTrainingCompleted = ref(false)

// 计算属性
const maxBuyAmount = computed(() => {
  if (tradingState.value.currentPrice <= 0 || isTrainingCompleted.value) return 0
  return Math.floor(tradingState.value.availableFunds / (tradingState.value.currentPrice * 100)) * 100
})

const maxSellAmount = computed(() => {
  if (isTrainingCompleted.value) return 0
  return tradingState.value.position
})

const progressPercentage = computed(() => {
  if (tradeProgress.value.total === 0) return 0
  return Math.round(((tradeProgress.value.current - 199) / (tradeProgress.value.total - 200)) * 100)
})

// 获取随机股票K线数据
const fetchRandomKlineData = async () => {
  loading.value = true
  try {
    const result = await getRandomKlineData(trainingDays.value)

    if (result.code === 200) {
      stockInfo.value = result.data.stockInfo
      klineData.value = result.data.klineData
      currentIndex.value = TRAINING_START_INDEX // 从第200天开始显示
      tradeProgress.value.total = result.data.klineData.length
      tradeProgress.value.current = TRAINING_START_INDEX
      updateVisibleData()
      updateTradingState()
      updateChartData()
      isTrainingCompleted.value = false
      // 保存初始资金
      initialCapital.value = tradingState.value.availableFunds + tradingState.value.positionValue

      ElMessage.success('获取K线数据成功')
    } else {
      ElMessage.error(result.msg || '获取K线数据失败')
    }
  } catch (error) {
    console.error('获取K线数据失败:', error)
    ElMessage.error('获取K线数据失败')
  } finally {
    loading.value = false
  }
}

// 更新可见数据
const updateVisibleData = () => {
  visibleData.value = klineData.value.slice(0, currentIndex.value + 1)
}

// 更新图表数据
const updateChartData = () => {
  if (visibleData.value.length === 0) return

  // 转换数据格式为KLine组件需要的格式
  chartData.value = visibleData.value.map(item => {
    // 计算涨跌幅
    const prevClose = item.preclose || item.open
    const changePercent = ((item.close - prevClose) / prevClose) * 100

    return [
      item.date,
      item.open,
      item.close,
      item.low,
      item.high,
      item.amount, // 成交金额
      changePercent
    ]
  })

}

// 更新交易状态
const updateTradingState = () => {
  if (klineData.value.length === 0 || currentIndex.value < 0) return

  const currentKline = klineData.value[currentIndex.value]
  const prevKline = currentIndex.value > 0 ? klineData.value[currentIndex.value - 1] : currentKline

  tradingState.value.currentPrice = currentKline.close
  tradingState.value.priceChange = currentKline.close - prevKline.close
  tradingState.value.priceChangePercent = (tradingState.value.priceChange / prevKline.close) * 100

  // 更新持仓市值和总资产
  tradingState.value.positionValue = tradingState.value.position * tradingState.value.currentPrice
  tradingState.value.totalAssets = tradingState.value.availableFunds + tradingState.value.positionValue

  // 更新持仓收益
  if (tradingState.value.position > 0 && tradingState.value.positionCost > 0) {
    tradingState.value.positionProfit = tradingState.value.positionValue - tradingState.value.positionCost
  } else {
    tradingState.value.positionProfit = 0
  }
}

// 买入操作
const handleBuy = () => {
  if (tradeAmount.value <= 0) {
    ElMessage.warning('请输入买入数量')
    return
  }

  if (tradeAmount.value > maxBuyAmount.value) {
    ElMessage.warning('买入数量超过最大可买入数量')
    return
  }

  const cost = tradeAmount.value * tradingState.value.currentPrice

  // 更新交易状态
  tradingState.value.availableFunds -= cost
  tradingState.value.position += tradeAmount.value
  tradingState.value.positionCost += cost

  // 记录交易
  tradeRecords.value.push({
    position: currentIndex.value,
    operation: '买入',
    direction: '买入',
    price: tradingState.value.currentPrice,
    amount: tradeAmount.value,
    total: cost,
    index: currentIndex.value
  })

  updateTradingState()
  // 判断可买入的数量是否大于200，大于200时，将可买入数量设置为200
  if (maxBuyAmount.value > TRAINING_START_INDEX) {
    tradeAmount.value = TRAINING_START_INDEX
  } else {
    tradeAmount.value = 0
  }

  ElMessage.success('买入成功')
}

// 批量买入操作
const handleBatchBuy = () => {
  // 这里可以实现批量买入的逻辑，比如分多次买入
  // 简化处理，这里先调用handleBuy
  handleBuy()
}

// 卖出操作
const handleSell = () => {
  if (tradeAmount.value <= 0) {
    ElMessage.warning('请输入卖出数量')
    return
  }

  if (tradeAmount.value > maxSellAmount.value) {
    ElMessage.warning('卖出数量超过持仓数量')
    return
  }

  const income = tradeAmount.value * tradingState.value.currentPrice

  // 先保存当前持仓数量，因为后面要减去卖出数量
  const currentPosition = tradingState.value.position

  // 更新交易状态
  tradingState.value.availableFunds += income
  tradingState.value.position -= tradeAmount.value

  // 安全地计算要减去的持仓成本，避免除零
  if (currentPosition > 0) {
    tradingState.value.positionCost -= (tradingState.value.positionCost / currentPosition) * tradeAmount.value
  } else {
    // 防止出现负数成本
    tradingState.value.positionCost = 0
  }

  // 记录交易
  tradeRecords.value.push({
    position: currentIndex.value,
    operation: '卖出',
    direction: '卖出',
    price: tradingState.value.currentPrice,
    amount: tradeAmount.value,
    total: income,
    index: currentIndex.value
  })

  updateTradingState()
  // 判断可卖出的数量是否大于200，大于200时，将可卖出数量设置为200
  if (maxSellAmount.value > TRAINING_START_INDEX) {
    tradeAmount.value = TRAINING_START_INDEX
  } else {
    tradeAmount.value = 0
  }

  ElMessage.success('卖出成功')
}

// 批量卖出操作
const handleBatchSell = () => {
  // 这里可以实现批量卖出的逻辑，比如分多次卖出
  // 简化处理，这里先调用handleSell
  handleSell()
}

// 设置买入数量快捷选项
const setBuyAmount = (ratio) => {
  const maxAmount = maxBuyAmount.value
  switch (ratio) {
    case '1/2':
      tradeForm.value.buyAmount = Math.floor(maxAmount / 2 / 100) * 100
      break
    case '1/5':
      tradeForm.value.buyAmount = Math.floor(maxAmount / 5 / 100) * 100
      break
    case '1/10':
      tradeForm.value.buyAmount = Math.floor(maxAmount / 10 / 100) * 100
      break
  }
}

// 设置卖出数量快捷选项
const setSellAmount = (ratio) => {
  const maxAmount = maxSellAmount.value
  switch (ratio) {
    case '1/2':
      tradeForm.value.sellAmount = Math.floor(maxAmount / 2 / 100) * 100
      break
    case '1/5':
      tradeForm.value.sellAmount = Math.floor(maxAmount / 5 / 100) * 100
      break
    case '1/10':
      tradeForm.value.sellAmount = Math.floor(maxAmount / 10 / 100) * 100
      break
  }
}

// 一键满仓
const handleFullPosition = () => {
  if (maxBuyAmount.value <= 0) {
    ElMessage.warning('可用资金不足')
    return
  }

  tradeAmount.value = maxBuyAmount.value
  handleBuy()
}

// 一键空仓
const handleClearPosition = () => {
  if (tradingState.value.position <= 0) {
    ElMessage.warning('当前无持仓')
    return
  }

  tradeAmount.value = tradingState.value.position
  handleSell()
}

// 下一步
const handleNextStep = () => {
  if (currentIndex.value >= klineData.value.length - 1 || isTrainingCompleted.value) {
    // 训练结束，检查是否有交易记录
    if (!isTrainingCompleted.value) {
      checkTrainingResult()
    }
    return
  }

  currentIndex.value++
  tradeProgress.value.current++
  updateVisibleData()
  updateTradingState()
  updateChartData()
}

// 开始训练
const handleStartTraining = () => {
  if (isTrainingCompleted.value) return

  trainingSettings.value.autoPlay = !trainingSettings.value.autoPlay

  if (trainingSettings.value.autoPlay) {
    autoPlayTimer = setInterval(() => {
      if (!trainingSettings.value.autoPlay || currentIndex.value >= klineData.value.length - 1) {
        stopAutoPlay()
        if (currentIndex.value >= klineData.value.length - 1 && !isTrainingCompleted.value) {
          checkTrainingResult()
        }
        return
      }
      handleNextStep()
    }, trainingSettings.value.speed * 1000)
  } else {
    stopAutoPlay()
  }
}

import {ElMessageBox} from 'element-plus'

const localUser = ref(null)
const fetchLocalUser = async () => {
  try {
    const res = await getLocalUser()
    localUser.value = res.data
  } catch (error) {
    console.error('获取本地用户信息失败:', error)
    localUser.value = { id: 1, totalSimulationAssets: 100000 }
  }
}

// 检查训练结果
const checkTrainingResult = async () => {
  // 检查是否有交易记录
  if (tradeRecords.value.length === 0) {
    // 没有操作，提示用户并换股
    try {
      await ElMessageBox.confirm(
          '本次实战没有进行任何交易操作，点击确定换股重新开始实战。',
          '实战结果',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            showCancelButton: false,
            closeOnClickModal: false,
            closeOnPressEscape: false
          }
      )
      // 用户点击确定后换股
      handleChangeStock()
    } catch (error) {
      // 用户取消或其他错误，也执行换股
      handleChangeStock()
    }
  } else {
    // 有交易记录，正常提交结果
    handleTrainingComplete()
  }
}

// 训练完成处理
const handleTrainingComplete = async () => {
  try {
    // 标记训练已完成，防止重复提交
    isTrainingCompleted.value = true

    // 获取用户资金作为初始资金
    const finalCapital = tradingState.value.totalAssets
    const totalProfit = finalCapital - initialCapital.value
    const operationProfitRate = initialCapital.value !== 0 ? totalProfit / initialCapital.value : 0

    // 计算股票区间涨跌幅（从训练开始索引位置计算）
    const startIndex = TRAINING_START_INDEX
    const startPrice = klineData.value[startIndex]?.close || 0
    const endPrice = klineData.value[klineData.value.length - 1]?.close || 0
    const stockRangeProfitRate = startPrice > 0 ? (endPrice - startPrice) / startPrice : 0

    // 计算超额收益率
    const excessProfitRate = operationProfitRate - stockRangeProfitRate

    // 准备提交数据
    const trainingData = {
      userId: localUser.value?.id || 1,
      stockName: stockInfo.value.codeName,
      stockCode: stockInfo.value.code,
      // 从训练开始索引位置计算交易时间
      startTime: klineData.value[TRAINING_START_INDEX]?.date,
      endTime: klineData.value[klineData.value.length - 1]?.date,
      initialCapital: initialCapital.value, // 修复：使用 .value 获取实际值
      finalCapital: finalCapital,
      totalProfit: totalProfit,
      operationProfitRate: operationProfitRate,
      excessProfitRate: excessProfitRate,
      stockRangeProfitRate: stockRangeProfitRate,
      tradeTimes: tradeRecords.value.length,
      tradeDatas: tradeRecords.value.map(record => ({
        tradeType: record.direction === '买入' ? 'buy' : 'sell',
        price: record.price,
        amount: record.amount,
        total: record.total,
        klineIndex: record.index,
        tradeDate: klineData.value[record.index]?.date
      })),
      status: 1
    }

    // 提交到后端
    const result = await submitTrainingResult(trainingData)

    if (result.code === 200) {
      // 设置结果数据并显示弹窗
      trainingResult.value = {
        ...trainingData,
        id: result.data.id
      }
      resultDialogVisible.value = true
      ElMessage.success('实战结果已保存')
    } else {
      ElMessage.error('保存实战结果失败: ' + result.msg)
    }
  } catch (error) {
    console.error('提交实战结果失败:', error)
    ElMessage.error('提交实战结果失败')
  }
}

// 重新开始训练
const handleRestartTraining = () => {
  resultDialogVisible.value = false
  handleChangeStock()
}

// 格式化百分比
const formatPercent = (value) => {
  if (value === null || value === undefined) return '0.00%'
  return (value * 100).toFixed(2) + '%'
}

// 格式化日期范围
const formatDateRange = () => {
  if (!klineData.value.length) return ''
  // 从训练开始索引位置计算日期范围
  const startIndex = TRAINING_START_INDEX
  const startDate = klineData.value[startIndex]?.date || ''
  const endDate = klineData.value[klineData.value.length - 1]?.date || ''
  return `${startDate} ~ ${endDate}`
}

// 获取盈亏样式类
const getProfitClass = (value) => {
  if (value > 0) return 'profit-positive'
  if (value < 0) return 'profit-negative'
  return 'profit-neutral'
}

// 格式化资金显示
const formatAmount = (amount) => {
  if (amount < 10000) {
    // 小于1万，按元为单位，保留2位小数
    return `¥${amount.toFixed(2)}`
  } else {
    // 大于等于1万，按万元为单位，保留2位小数
    return `¥${(amount / 10000).toFixed(2)}万`
  }
}

// 获取进度条状态
const getProgressStatus = () => {
  if (currentIndex.value >= klineData.value.length - 1) return 'success'
  return ''
}

// 换股
const handleChangeStock = async () => {
  // 换股时停止自动播放，避免定时器跨股票运行
  stopAutoPlay()
  await fetchLocalUser()
  // 重置状态
  currentIndex.value = 0
  tradeRecords.value = []
  tradeProgress.value.current = TRAINING_START_INDEX
  // 获取本地用户资金信息
  let userCapital = localUser.value?.totalSimulationAssets || 100000

  tradingState.value = {
    currentPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    availableFunds: userCapital,
    position: 0,
    positionValue: 0,
    positionCost: 0,
    totalAssets: userCapital,
    positionProfit: 0,
    strategy: 'MACD金叉死叉 + 固定仓位'
  }

  // 重置交易表单
  tradeForm.value = {
    buyAmount: TRAINING_START_INDEX,
    sellAmount: TRAINING_START_INDEX
  }
  tradeAmount.value = TRAINING_START_INDEX

  // 获取新的股票数据
  await fetchRandomKlineData()
  tradingState.value.availableFunds = localUser.value?.totalSimulationAssets || 100000
}

// 组件挂载
onMounted(async () => {
  // 获取本地用户信息
  await fetchLocalUser()

  // 获取随机股票数据
  fetchRandomKlineData()
  tradingState.value.availableFunds = localUser.value?.totalSimulationAssets || 100000
})

// 组件卸载时清理自动播放定时器
onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.kline-practice {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
}

.practice-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.main-content {
  flex: 1;
}

.chart-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-card {
  min-height: 650px;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}




.label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}







/* 响应式调整 */
@media (max-width: 768px) {




  .additional-info {
    gap: 10px;
  }

}

.label {
  color: var(--el-text-color-secondary);
}

.value {
  font-weight: 500;
}

.profit {
  color: #f56c6c;
}

.loss {
  color: #67c23a;
}



/* 结果弹窗样式 */
.result-content {
  padding: 20px 0;
}

.result-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 20px;
}

.result-header h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.result-summary {
  display: flex;
  justify-content: center;
}

.profit-info {
  padding: 15px 25px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
}

.profit-info.profit-positive {
  background-color: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.profit-info.profit-negative {
  background-color: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.profit-rate {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.profit-positive .profit-rate {
  color: #f56c6c;
}

.profit-negative .profit-rate {
  color: #67c23a;
}

.profit-amount {
  font-size: 16px;
  font-weight: 500;
}

.profit-positive .profit-amount {
  color: #f56c6c;
}

.profit-negative .profit-amount {
  color: #67c23a;
}

.result-details {
  margin-top: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.detail-value {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.detail-value.profit-positive {
  color: #f56c6c;
}

.detail-value.profit-negative {
  color: #67c23a;
}

.dialog-footer {
  text-align: center;
  padding-top: 20px;
}

.dialog-footer .el-button {
  min-width: 100px;
  margin: 0 10px;
}

@media (max-width: 1200px) {
  .practice-container {
    flex-direction: column;
  }

}

/* 主容器样式 */
.practice-container {
  display: flex;
  gap: 20px;
  height: 100%;
  min-height: 800px;
}

.main-content {
  flex: 1;
  height: 100%;
}

.chart-section {
  height: 100%;
}

.chart-card {
  height: 120%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.09);
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 右侧操作面板整体样式 */
.trading-panel {
  width: 400px;
  flex-shrink: 0;
  height: 100%;
}

.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.09);
  background-color: #ffffff;
  transition: all 0.3s ease;
}

.panel-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.price-card {
  background: linear-gradient(135deg, #fcfcfd 0%, #f8f9fb 100%);
  border-radius: 12px;
  padding: 14px 0 0 18px;
  margin-bottom: 10px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.06);

}

.price-header {

}

.price-title {
  color: #666;
  font-size: 17px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.current-price {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.change-percent {
  font-size: 16px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.price-up {
  color: #f53f3f;
  background-color: rgba(245, 63, 63, 0.12);
}

.price-down {
  color: #00b42a;
  background-color: rgba(0, 180, 42, 0.12);
}

.price-flat {
  color: #86909c;
  background-color: rgba(134, 144, 156, 0.12);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .current-price {
    font-size: 24px;
  }

  .change-percent {
    font-size: 14px;
  }
}

.current-price-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.current-price {
  font-size: 34px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-change {
  font-size: 18px;
  padding: 4px 14px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.price-up {
  color: #f53f3f;
  background-color: rgba(245, 63, 63, 0.12);
}

.price-down {
  color: #00b42a;
  background-color: rgba(0, 180, 42, 0.12);
}

.price-flat {
  color: #86909c;
  background-color: rgba(134, 144, 156, 0.12);
}

.change-percent {
  margin-left: 6px;
  font-size: 16px;
}

/* 账户信息样式 */
.account-info {
  margin-bottom: 24px;
}

.info-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 14px;
  padding-left: 6px;
  display: flex;
  align-items: center;
}

.info-section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background-color: #165dff;
  border-radius: 2px;
  margin-right: 6px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 3px 5px;
  margin: 0px 0px 0px 10px;
  background-color: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.25s ease;
  border: 1px solid transparent;
}

.info-item:hover {
  background-color: #f1f3f5;
  border-color: rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.info-item .label {
  color: #666;
  font-weight: 400;
}

.info-item .value {
  font-weight: 500;
  color: #333;
}

.info-item .highlight {
  color: #165dff;
  font-weight: 600;
  position: relative;
}

.info-item .highlight::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: #165dff;
  opacity: 0.6;
}

/* 交易操作区样式 */
.trading-actions {
  margin-bottom: 24px;
  flex-shrink: 0;
}

/* 统一交易输入区域样式 */
.trade-input-section {
  margin-bottom: 14px;
  padding: 16px;
  border-radius: 10px;
  background-color: #f9fafb;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* 交易按钮组样式 */
.trade-buttons-group {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.action-btn {
  height: 38px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.25s;
  font-size: 14px;
  border: none;
}

.buy-btn {
  background-color: #f56c6c;
  color: white;
  box-shadow: 0 2px 5px rgba(245, 108, 108, 0.2);
}

.buy-btn:hover {
  background-color: #f78989;
  box-shadow: 0 4px 8px rgba(245, 108, 108, 0.25);
  transform: translateY(-1px);
  color: white;
}

.sell-btn {
  background-color: #67c23a;
  color: white;
  box-shadow: 0 2px 5px rgba(103, 194, 58, 0.2);
}

.sell-btn:hover {
  background-color: #85ce61;
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.25);
  transform: translateY(-1px);
  color: white;
}

.batch-buy-btn,
.batch-sell-btn {
  background-color: #f2f3f5;
  color: #666;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.batch-buy-btn:hover,
.batch-sell-btn:hover {
  background-color: #e5e6eb;
  color: #333;
  transform: translateY(-1px);
}

.quick-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.quick-action-btn {
  flex: 1;
  height: 38px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.25s;
  font-weight: 500;
  min-width: 70px;
}

.amount-input {
  width: 100%;
  border-radius: 8px;
  height: 38px;
  border-color: rgba(0, 0, 0, 0.1);
}

.max-hint {
  font-size: 12px;
  color: #86909c;
  margin-top: 6px;
  text-align: right;
  padding-right: 4px;
}

/* 训练控制区样式 */
.training-controls {
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px dashed #e5e7eb;
}

.control-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 14px;
  padding-left: 6px;
  display: flex;
  align-items: center;
}

.control-section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background-color: #165dff;
  border-radius: 2px;
  margin-right: 6px;
}

.progress-info {
  margin-bottom: 18px;
}

.progress-text {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
}

.progress-bar {
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background-color: #f1f3f5;
}

.progress-bar .el-progress-bar__inner {
  border-radius: 3px;
  transition: width 0.6s ease;
}

.control-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.control-btn {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.25s;
  font-weight: 500;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  font-size: 14px;
}

.speed-label {
  color: #666;
  white-space: nowrap;
  font-weight: 500;
}

.speed-select {
  flex: 1;
  border-radius: 8px;
  height: 38px;
}

.change-stock-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  transition: all 0.25s;
  font-size: 14px;
  font-weight: 500;
}

.change-stock-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .trading-panel {
    width: 100%;
    height: auto;
    margin-top: 20px;
  }

  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .trading-panel {
    padding: 0 10px;
  }

  .info-grid {
    grid-template-columns: 1fr 1fr;
  }

  .current-price {
    font-size: 28px;
  }

  .price-change {
    font-size: 16px;
  }
}

</style>