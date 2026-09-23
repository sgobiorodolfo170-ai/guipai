<script setup>
import { ref, onMounted } from 'vue'
import { getLocalUser } from '@/services/kline.service'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const userInfo = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await getLocalUser()
    userInfo.value = res.data
  } catch (error) {
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
})

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').split('.')[0]
}
</script>

<template>
  <div class="profile-page" v-loading="loading">
    <el-card class="profile-card">
      <template #header>
        <span>本地用户信息</span>
      </template>
      <el-descriptions :column="1" border v-if="userInfo">
        <el-descriptions-item label="用户ID">{{ userInfo.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ userInfo.username || 'local' }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ userInfo.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总模拟资金">{{ userInfo.totalSimulationAssets || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总训练次数">{{ userInfo.totalTransactionCount || 0 }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(userInfo.createdAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>
