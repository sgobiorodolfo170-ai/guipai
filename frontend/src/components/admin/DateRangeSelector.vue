<template>
  <div class="date-range-selector">
    <el-card class="selector-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Calendar /></el-icon>
          <span class="header-title">选择日期范围更新数据</span>
        </div>
      </template>
      
      <div class="selector-content">
        <div class="date-inputs">
          <div class="input-group">
            <label class="input-label">开始日期</label>
            <el-date-picker
              v-model="startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledStartDate"
              class="date-input"
            />
          </div>
          
          <div class="input-group">
            <label class="input-label">结束日期</label>
            <el-date-picker
              v-model="endDate"
              type="date"
              placeholder="选择结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledEndDate"
              class="date-input"
            />
          </div>
        </div>
        
        <div class="quick-select">
          <span class="quick-label">快速选择：</span>
          <div class="quick-buttons">
            <el-button size="small" @click="selectLast7Days">最近7天</el-button>
            <el-button size="small" @click="selectLast15Days">最近15天</el-button>
            <el-button size="small" @click="selectLast30Days">最近30天</el-button>
            <el-button size="small" @click="selectToday">今天</el-button>
            <el-button size="small" @click="selectYesterday">昨天</el-button>
          </div>
        </div>
        
        <div class="date-info" v-if="startDate && endDate">
          <el-alert
            :title="`已选择 ${daysDiff} 天的数据范围`"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            :icon="Refresh"
            @click="handleBatchSync"
            :disabled="!canSync"
            :loading="loading"
          >
            批量同步数据
          </el-button>
          <el-button 
            type="warning" 
            :icon="RefreshRight"
            @click="handleBatchForceSync"
            :disabled="!canSync"
            :loading="loading"
          >
            强制更新数据
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Calendar, Refresh, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['batch-sync', 'batch-force-sync'])

// 响应式数据
const startDate = ref('')
const endDate = ref('')
const loading = ref(false)

// 计算属性
const daysDiff = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
})

const canSync = computed(() => {
  return startDate.value && endDate.value && daysDiff.value <= 30
})

// 禁用日期函数
const disabledStartDate = (time) => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // 禁用未来日期和30天前的日期
  return time.getTime() > today.getTime() || time.getTime() < thirtyDaysAgo.getTime()
}

const disabledEndDate = (time) => {
  const today = new Date()
  const start = startDate.value ? new Date(startDate.value) : null
  
  // 禁用未来日期和开始日期之前的日期
  if (start) {
    return time.getTime() > today.getTime() || time.getTime() < start.getTime()
  }
  return time.getTime() > today.getTime()
}

// 快速选择方法
const selectLast7Days = () => {
  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
  
  startDate.value = sevenDaysAgo.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
}

const selectLast15Days = () => {
  const today = new Date()
  const fifteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
  
  startDate.value = fifteenDaysAgo.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
}

const selectLast30Days = () => {
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
  
  startDate.value = thirtyDaysAgo.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
}

const selectToday = () => {
  const today = new Date().toISOString().split('T')[0]
  startDate.value = today
  endDate.value = today
}

const selectYesterday = () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  startDate.value = yesterday
  endDate.value = yesterday
}

// 处理批量同步
const handleBatchSync = async () => {
  // if (daysDiff.value > 10) {
  //   try {
  //     await ElMessageBox.confirm(
  //       `您选择了 ${daysDiff.value} 天的数据，批量同步可能需要较长时间，确定要继续吗？`,
  //       '批量同步确认',
  //       {
  //         confirmButtonText: '确定同步',
  //         cancelButtonText: '取消',
  //         type: 'warning'
  //       }
  //     )
  //   } catch {
  //     return
  //   }
  // }
  
  loading.value = true
  try {
    // 过滤掉周末日期
    const filteredDates = filterWeekends(startDate.value, endDate.value)
    emit('batch-sync', {
      startDate: filteredDates.startDate,
      endDate: filteredDates.endDate,
      days: daysDiff.value
    })
  } finally {
    loading.value = false
  }
}

// 处理批量强制更新
const handleBatchForceSync = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要强制更新 ${daysDiff.value} 天的数据吗？这将删除现有数据并重新同步，操作不可撤销！`,
      '强制更新确认',
      {
        confirmButtonText: '确定更新',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    loading.value = true
    const filteredDates = filterWeekends(startDate.value, endDate.value)

    emit('batch-force-sync', {
      startDate: filteredDates.startDate,
      endDate: filteredDates.endDate,
      days: daysDiff.value
    })
  } catch {
    // 用户取消
  } finally {
    loading.value = false
  }
}

// 添加一个过滤周末日期的函数
const filterWeekends = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const filteredDates = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // 周日是0，周六是6，跳过周末
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      filteredDates.push(new Date(d))
    }
  }

  // 返回过滤后的日期范围
  if (filteredDates.length === 0) {
    return { startDate, endDate } // 如果没有工作日，返回原始日期
  }

  const newStartDate = filteredDates[0].toISOString().split('T')[0]
  const newEndDate = filteredDates[filteredDates.length - 1].toISOString().split('T')[0]

  return { startDate: newStartDate, endDate: newEndDate }
}


// 监听日期变化，验证范围
watch([startDate, endDate], () => {
  if (daysDiff.value > 30) {
    ElMessage.warning('日期范围不能超过30天')
  }
})
</script>

<style scoped>
.date-range-selector {
  margin-bottom: 24px;
}

.selector-card {
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  color: #409eff;
  font-size: 18px;
}

.header-title {
  font-size: 16px;
}

.selector-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.date-input {
  width: 100%;
}

.quick-select {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.date-info {
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .date-inputs {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .quick-select {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>