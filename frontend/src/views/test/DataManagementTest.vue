<template>
  <div class="test-page">
    <h1>数据管理页面测试</h1>
    
    <div class="test-section">
      <h2>1. 服务测试</h2>
      <el-button @click="testServices" :loading="testing">测试API服务</el-button>
      <div v-if="testResults.length > 0" class="test-results">
        <div v-for="result in testResults" :key="result.name" class="test-result">
          <el-tag :type="result.success ? 'success' : 'danger'">
            {{ result.name }}: {{ result.success ? '成功' : '失败' }}
          </el-tag>
          <span v-if="result.error" class="error-msg">{{ result.error }}</span>
        </div>
      </div>
    </div>
    
    <div class="test-section">
      <h2>2. 组件测试</h2>
      <DateRangeSelector 
        @batch-sync="handleBatchSync"
        @batch-force-sync="handleBatchForceSync"
      />
    </div>
    
    <div class="test-section">
      <h2>3. 工具类测试</h2>
      <el-button @click="testUtils">测试日期工具</el-button>
      <div v-if="utilResults.length > 0" class="test-results">
        <div v-for="result in utilResults" :key="result.name" class="test-result">
          <strong>{{ result.name }}:</strong> {{ result.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import DateRangeSelector from '@/components/admin/DateRangeSelector.vue'
import StockDateUtil from '@/utils/StockDateUtil.js'
import {
  getAllSyncStatus,
  getDataTypes,
  getSyncStatistics
} from '@/services/dataSync.service'

const testing = ref(false)
const testResults = ref([])
const utilResults = ref([])

// 测试API服务
const testServices = async () => {
  testing.value = true
  testResults.value = []
  
  const tests = [
    {
      name: '获取数据类型',
      fn: getDataTypes
    },
    {
      name: '获取同步状态',
      fn: getAllSyncStatus
    },
    {
      name: '获取统计信息',
      fn: () => getSyncStatistics(7)
    }
  ]
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      testResults.value.push({
        name: test.name,
        success: true,
        data: result
      })
    } catch (error) {
      testResults.value.push({
        name: test.name,
        success: false,
        error: error.message
      })
    }
  }
  
  testing.value = false
}

// 测试工具类
const testUtils = () => {
  utilResults.value = [
    {
      name: '最近交易日',
      value: StockDateUtil.getRecentTradingDay()
    },
    {
      name: '昨日交易日',
      value: StockDateUtil.getYesterdayTradingDay()
    },
    {
      name: '今天日期',
      value: StockDateUtil.formatDate(new Date())
    },
    {
      name: '是否交易日',
      value: StockDateUtil.isTradingDay(new Date()) ? '是' : '否'
    },
    {
      name: '最近5个交易日',
      value: StockDateUtil.getTradingDays(5).join(', ')
    }
  ]
}

// 处理批量同步
const handleBatchSync = (data) => {
  ElMessage.success(`批量同步测试：${data.startDate} 到 ${data.endDate}，共 ${data.days} 天`)
  console.log('批量同步数据:', data)
}

// 处理批量强制更新
const handleBatchForceSync = (data) => {
  ElMessage.warning(`批量强制更新测试：${data.startDate} 到 ${data.endDate}，共 ${data.days} 天`)
  console.log('批量强制更新数据:', data)
}
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.test-section h2 {
  margin-top: 0;
  color: #303133;
}

.test-results {
  margin-top: 20px;
}

.test-result {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-msg {
  color: #f56c6c;
  font-size: 12px;
}
</style>