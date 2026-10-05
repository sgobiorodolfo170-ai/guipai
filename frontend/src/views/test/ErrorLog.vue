<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'

const logs = ref('')
const loading = ref(false)

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await api.get('/logs/crash')
    logs.value = res.data || '(暂无日志)'
  } catch (e) {
    logs.value = '(获取日志失败: ' + e.message + ')'
  } finally {
    loading.value = false
  }
}

const clearLogs = async () => {
  try {
    await api.delete('/logs/crash')
    logs.value = '(已清空)'
    ElMessage.success('日志已清空')
  } catch (e) {
    ElMessage.error('清空失败')
  }
}

onMounted(() => fetchLogs())
</script>

<template>
  <div class="error-log-page" v-loading="loading">
    <el-card>
      <template #header>
        <div class="header">
          <span>报错日志</span>
          <div>
            <el-button size="small" @click="fetchLogs">刷新</el-button>
            <el-button size="small" type="danger" @click="clearLogs">清空</el-button>
          </div>
        </div>
      </template>
      <el-input
        v-model="logs"
        type="textarea"
        :autosize="{ minRows: 20, maxRows: 30 }"
        readonly
        placeholder="暂无日志"
      />
    </el-card>
  </div>
</template>

<style scoped>
.error-log-page { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; }
</style>
