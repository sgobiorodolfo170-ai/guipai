<script setup>
import { ref } from 'vue'
import * as aktoolsService from '@/services/aktools.service'
import { getLocalUser } from '@/services/kline.service'
import { ElMessage } from 'element-plus'

const testResults = ref([])
const testLoading = ref(false)

const addResult = (test, success, data = null, error = null) => {
  testResults.value.unshift({
    id: Date.now(),
    test,
    success,
    data,
    error,
    timestamp: new Date().toLocaleString()
  })
}

const testStockSpot = async () => {
  try {
    testLoading.value = true
    const result = await aktoolsService.getStockSpot()
    addResult('A股实时行情', true, result)
    ElMessage.success('行情接口正常')
  } catch (error) {
    addResult('A股实时行情', false, null, error.message)
  } finally {
    testLoading.value = false
  }
}

const testLocalUser = async () => {
  try {
    testLoading.value = true
    const result = await getLocalUser()
    addResult('本地用户信息', true, result)
    ElMessage.success('本地用户接口正常')
  } catch (error) {
    addResult('本地用户信息', false, null, error.message)
  } finally {
    testLoading.value = false
  }
}

const clearResults = () => {
  testResults.value = []
}
</script>

<template>
  <div class="api-test">
    <h2>API 测试</h2>

    <el-card class="test-card">
      <template #header>接口测试</template>
      <div class="test-buttons">
        <el-button type="primary" @click="testStockSpot" :loading="testLoading">测试行情接口</el-button>
        <el-button type="success" @click="testLocalUser" :loading="testLoading">测试本地用户接口</el-button>
        <el-button @click="clearResults">清空结果</el-button>
      </div>
    </el-card>

    <el-card v-if="testResults.length > 0" class="result-card">
      <template #header>测试结果</template>
      <el-table :data="testResults" style="width: 100%">
        <el-table-column prop="test" label="测试" width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error" label="错误信息" />
        <el-table-column prop="timestamp" label="时间" width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.api-test {
  padding: 20px;
}

.test-card {
  margin-bottom: 20px;
}

.test-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
