<template>
  <el-dialog
      :modelValue="visible"
    :title="modalTitle"
    width="80%"
    :before-close="handleClose"
    class="history-data-modal"
  >
    <div v-loading="loading" class="modal-content">
      <!-- 数据概览 -->
      <div class="overview-section" v-if="!loading && tableData.length > 0">
        <div class="overview-card">
          <div class="overview-title">{{ dataTypeDesc }}历史数据概览</div>
          <div class="overview-stats">
            <div class="stat-item">
              <div class="stat-label">最近30天平均</div>
              <div class="stat-value">{{ averageValue }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最高值</div>
              <div class="stat-value">{{ maxValue }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最低值</div>
              <div class="stat-value">{{ minValue }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">今日数值</div>
              <div class="stat-value current">{{ formatCurrentValue() }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空数据提示 -->
      <div v-if="!loading && tableData.length === 0" class="empty-data">
        <el-empty description="暂无历史数据" />
      </div>

      <!-- 图表展示 -->
      <div class="chart-section" v-if="!loading && tableData.length > 0">
        <div class="chart-debug" v-if="false">
          <p>图表调试信息:</p>
          <p>数据条数: {{ tableData.length }}</p>
          <p>数据类型: {{ dataType }}</p>
          <p>值字段: {{ valueField }}</p>
          <button @click="renderChart" style="margin: 10px 0; padding: 5px 10px; background: #1890ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            重新渲染图表
          </button>
        </div>
        <div ref="chartContainer" class="chart-container"></div>
      </div>

      <!-- 数据表格 -->
<!--      <div class="table-section" v-if="!loading && tableData.length > 0">-->
<!--        <el-table :data="tableData" stripe style="width: 100%">-->
<!--          <el-table-column prop="tradeDate" label="交易日期" width="120" />-->
<!--          <el-table-column :prop="valueField" :label="dataTypeDesc" width="100">-->
<!--            <template #default="scope">-->
<!--              <span :class="{ 'highlight': scope.row.tradeDate === todayDate }">-->
<!--                {{ scope.row[valueField] }}-->
<!--              </span>-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--          <el-table-column prop="limitUpDownRatio" label="涨跌停比" width="100" v-if="showRatio" />-->
<!--          <el-table-column prop="continuousLimitRate" label="连板率" width="100" v-if="showRate && dataType !== 'continuousRate'">-->
<!--            <template #default="scope">-->
<!--              {{ (scope.row.continuousLimitRate * 100).toFixed(2) }}%-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--          <el-table-column prop="yesterdayLimitUpAvgIncrease" label="昨日涨停涨幅" width="120" v-if="dataType === 'yesterdayAvgChange'">-->
<!--            <template #default="scope">-->
<!--              {{ (scope.row.yesterdayLimitUpAvgIncrease * 100).toFixed(2) }}%-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--          <el-table-column prop="totalSealFunds" label="总封单资金(亿)" width="120" v-if="showFunds">-->
<!--            <template #default="scope">-->
<!--              {{ scope.row.totalSealFunds?.toFixed(2) }}-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--          <el-table-column prop="avgSealFunds" label="平均封单资金(万)" width="130" v-if="showFunds">-->
<!--            <template #default="scope">-->
<!--              {{ scope.row.avgSealFunds?.toFixed(2) }}-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--          <el-table-column label="相比前日" width="100">-->
<!--            <template #default="scope">-->
<!--              <span :class="getDiffClass(scope.row.diff)">-->
<!--                {{ scope.row.diff > 0 ? '+' : '' }}{{ scope.row.diff }}-->
<!--              </span>-->
<!--            </template>-->
<!--          </el-table-column>-->
<!--        </el-table>-->
<!--      </div>-->
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getBasicStatisticsRange } from '@/services/limitBoardStatistics.service.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  dataType: {
    type: String,
    required: true // 'limitUp', 'limitDown', 'oneWord', 'continuousRate'
  },
  currentValue: {
    type: [Number, String],
    default: 0
  },
  todayDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'close'])

const loading = ref(false)
const chartContainer = ref(null)
const tableData = ref([])
let chartInstance = null

// 计算属性
const modalTitle = computed(() => {
  const titles = {
    limitUp: '涨停股历史数据',
    limitDown: '跌停股历史数据', 
    oneWord: '一字板数量历史数据',
    continuousRate: '连板率历史数据',
    breakAndRecover: '炸板回封数历史数据',
    maxLevel: '最高连板历史数据',
    yesterdayAvgChange: '昨日涨停平均涨幅历史数据'
  }
  return titles[props.dataType] || '历史数据'
})

const dataTypeDesc = computed(() => {
  const descs = {
    limitUp: '涨停股数量',
    limitDown: '跌停股数量',
    oneWord: '一字板数量', 
    continuousRate: '连板率',
    breakAndRecover: '炸板回封数',
    maxLevel: '最高连板数',
    yesterdayAvgChange: '昨日涨停平均涨幅'
  }
  return descs[props.dataType] || '数据'
})

const valueField = computed(() => {
  const fields = {
    limitUp: 'limitUpCount',
    limitDown: 'limitDownCount',
    oneWord: 'limitUpOneWordCount',
    continuousRate: 'limitUpContinuousRate',
    breakAndRecover: 'limitUpBlastResealCount',
    maxLevel: 'limitUpMaxContinuous',
    yesterdayAvgChange: 'yesterdayLimitUpAvgIncrease'
  }
  return fields[props.dataType] || 'value'
})

const showRatio = computed(() => ['limitUp', 'limitDown'].includes(props.dataType))
const showRate = computed(() => ['limitUp', 'continuousRate'].includes(props.dataType))
const showFunds = computed(() => ['limitUp', 'limitDown'].includes(props.dataType))

// 判断是否为百分比类型
const isPercentageType = computed(() => ['continuousRate', 'yesterdayAvgChange'].includes(props.dataType))

// 统计数据
const averageValue = computed(() => {
  if (!tableData.value.length) return 0
  const sum = tableData.value.reduce((acc, item) => {
    let value = item[valueField.value] || 0
    if (isPercentageType.value && props.dataType !== 'continuousRate') {
      value = value * 100
    }
    return acc + value
  }, 0)
  const avg = sum / tableData.value.length
  return isPercentageType.value ? `${avg.toFixed(2)}%` : Math.round(avg)
})

const maxValue = computed(() => {
  if (!tableData.value.length) return 0
  const max = Math.max(...tableData.value.map(item => {
    let value = item[valueField.value] || 0
    if (isPercentageType.value && props.dataType !== 'continuousRate') {
      value = value * 100
    }
    return value
  }))
  return isPercentageType.value ? `${max.toFixed(2)}%` : max
})

const minValue = computed(() => {
  if (!tableData.value.length) return 0
  const min = Math.min(...tableData.value.map(item => {
    let value = item[valueField.value] || 0
    if (isPercentageType.value && props.dataType !== 'continuousRate') {
      value = value * 100
    }
    return value
  }))
  return isPercentageType.value ? `${min.toFixed(2)}%` : min
})

// 监听弹窗显示状态
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 弹窗打开时，先等待DOM渲染完成再获取数据
    await nextTick()
    await fetchHistoryData()
  } else {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  }
})

// 监听表格数据变化，自动渲染图表
watch(() => tableData.value, async (newData) => {
  if (newData && newData.length > 0 && props.visible) {
    console.log('数据更新，准备渲染图表...')
    // 等待DOM更新完成
    await nextTick()
    // 再等待一小段时间确保弹窗动画完成
    setTimeout(() => {
      renderChart()
    }, 300)
  }
}, { deep: true })

// 获取历史数据
const fetchHistoryData = async () => {
  loading.value = true
  console.log('开始获取历史数据...')
  console.log('数据类型:', props.dataType)
  console.log('值字段:', valueField.value)
  
  try {
    // 计算30天前的日期
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const formatDate = (date) => {
      return date.toISOString().split('T')[0]
    }
    
    const startDateStr = formatDate(startDate)
    const endDateStr = formatDate(endDate)
    console.log('查询日期范围:', startDateStr, '到', endDateStr)
    
    // 尝试从历史统计接口获取数据
    let result
    try {
      result = await getBasicStatisticsRange(startDateStr, endDateStr)
      console.log('API响应:', result)
    } catch (apiError) {
      console.warn('API调用失败:', apiError)
      tableData.value = []
      ElMessage.error('历史数据获取失败，请检查后端服务')
      return
    }
    
    // 注意：使用api工具后，成功的响应直接返回data，不需要检查result.code
    if (result && ((result.data && result.data.length > 0) || (Array.isArray(result) && result.length > 0))) {
      const responseData = result.data || result
      console.log('获取到数据条数:', responseData.length)
      console.log('第一条数据:', responseData[0])
      
      // 处理数据并计算环比
      const processedData = responseData.map((item, index) => {
        const prevItem = responseData[index - 1]
        let diff = 0
        
        if (prevItem) {
          let currentVal = item[valueField.value] || 0
          let prevVal = prevItem[valueField.value] || 0
          
          if (props.dataType === 'continuousRate') {
            currentVal = currentVal * 100
            prevVal = prevVal * 100
          }
          
          diff = Math.round((currentVal - prevVal) * 100) / 100 // 保留两位小数
        }
        
        return {
          ...item,
          diff: diff
        }
      })
      
      tableData.value = processedData.reverse() // 最新日期在前
      console.log('处理后的数据:', tableData.value.slice(0, 3)) // 显示前3条
      
      // 数据设置完成，图表将通过watch自动渲染
    } else {
      console.error('API返回数据格式错误:', result)
      ElMessage.error('获取数据失败')
    }
  } catch (error) {
    console.error('获取历史数据失败:', error)
    ElMessage.error('获取历史数据失败，请检查网络连接或联系管理员')
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderChart = async () => {
  console.log('=== 开始渲染图表 ===')
  
  // 检查容器是否存在且可见
  if (!chartContainer.value) {
    console.error('❌ 图表容器不存在')
    return
  }
  
  // 检查容器尺寸
  const containerRect = chartContainer.value.getBoundingClientRect()
  console.log('容器尺寸:', containerRect.width + 'x' + containerRect.height)
  
  if (containerRect.width === 0 || containerRect.height === 0) {
    console.warn('⚠️ 容器尺寸为0，延迟渲染')
    setTimeout(() => renderChart(), 500)
    return
  }
  
  if (!tableData.value.length) {
    console.error('❌ 没有数据')
    return
  }
  
  console.log('tableData.value.length:', tableData.value.length)
  console.log('dataType:', props.dataType)
  console.log('valueField:', valueField.value)
  
  // 等待DOM更新
  await nextTick()
  
  if (chartInstance) {
    console.log('销毁旧的图表实例')
    chartInstance.dispose()
    chartInstance = null
  }
  
  try {
    console.log('创建ECharts实例...')
    chartInstance = echarts.init(chartContainer.value)
    console.log('✅ ECharts实例创建成功')
    
    // 简化数据处理
    const rawData = tableData.value.slice().reverse() // 时间正序
    const dates = rawData.map(item => item.tradeDate)
    const values = rawData.map(item => {
      let value = item[valueField.value]
      if (value === undefined || value === null) {
        console.warn('数据项缺少字段:', valueField.value, item)
        return 0
      }
      
      // 数据类型转换
      if (props.dataType === 'continuousRate') {
        // value = parseFloat((value * 100).toFixed(2))
      } else if (props.dataType === 'yesterdayAvgChange') {
        value = parseFloat((value * 100).toFixed(2))
      } else {
        value = parseFloat(value) || 0
      }
      return value
    })
    
    console.log('处理后的数据:')
    console.log('dates:', dates.slice(0, 3), '...(共' + dates.length + '条)')
    console.log('values:', values.slice(0, 3), '...(共' + values.length + '条)')
    
    // 图表配置
    const option = {
      title: {
        text: `${dataTypeDesc.value}趋势图`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const param = params[0]
          let suffix = '只'
          if (isPercentageType.value) {
            suffix = '%'
          }
          return `${param.name}<br/>${dataTypeDesc.value}: ${param.value}${suffix}`
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: isPercentageType.value ? '百分比(%)' : '数量(只)',
        nameTextStyle: {
          fontSize: 12
        }
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 2,
          color: '#1890ff'
        },
        itemStyle: {
          color: '#1890ff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(24, 144, 255, 0.3)'
            }, {
              offset: 1, color: 'rgba(24, 144, 255, 0.1)'
            }]
          }
        }
      }],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%'
      }
    }
    
    chartInstance.setOption(option)
    console.log('✅ 图表渲染完成')
    
    // 延迟调整大小
    setTimeout(() => {
      if (chartInstance) {
        chartInstance.resize()
        console.log('图表大小调整完成')
      }
    }, 100)
    
  } catch (error) {
    console.error('❌ 图表渲染失败:', error)
    console.error('错误堆栈:', error.stack)
  }
}

// 获取差值样式类
const getDiffClass = (diff) => {
  if (diff > 0) return 'diff-up'
  if (diff < 0) return 'diff-down'
  return 'diff-neutral'
}

// 格式化当前值显示
const formatCurrentValue = () => {
  if (isPercentageType.value) {
    if (props.dataType === 'continuousRate') {
      return `${props.currentValue }%`
    } else {
      return `${props.currentValue}%`
    }
  }
  return props.currentValue
}

// 窗口大小变化处理
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 组件挂载时添加窗口大小变化监听
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
.history-data-modal {
  .modal-content {
    min-height: 500px;
  }
  
  .empty-data {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .overview-section {
    margin-bottom: 20px;
  }
  
  .overview-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }
  
  .overview-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #333;
  }
  
  .overview-stats {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .stat-value {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    
    &.current {
      color: #1890ff;
    }
  }
  
  .chart-section {
    margin-bottom: 20px;
  }
  
  .chart-container {
    width: 100%;
    height: 300px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: #fff;
  }
  
  .chart-debug {
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    font-size: 12px;
  }
  
  .chart-debug p {
    margin: 5px 0;
  }
  
  .table-section {
    .highlight {
      color: #1890ff;
      font-weight: bold;
    }
    
    .diff-up {
      color: #f5222d;
    }
    
    .diff-down {
      color: #52c41a;
    }
    
    .diff-neutral {
      color: #666;
    }
  }
}

@media (max-width: 768px) {
  .overview-stats {
    justify-content: center;
  }
  
  .stat-item {
    min-width: 80px;
  }
}
</style>