<template>
  <div class="data-management">
    <!-- 密码验证遮罩层 -->
    <div v-if="!isAuthenticated" class="auth-overlay">
      <div class="auth-container">
        <div class="auth-card">
          <!-- 头部图标和标题 -->
          <div class="auth-header">
            <div class="auth-icon">
              <el-icon class="lock-icon"><Lock /></el-icon>
            </div>
            <h2 class="auth-title">访问验证</h2>
            <p class="auth-subtitle">请输入密码以访问数据管理页面</p>
          </div>
          
          <!-- 密码输入区域 -->
          <div class="auth-form">
            <el-form @submit.prevent="handlePasswordSubmit">
              <el-form-item>
                <el-input
                  v-model="password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  clearable
                  :prefix-icon="Lock"
                  @keyup.enter="handlePasswordSubmit"
                  class="password-input"
                  :class="{ 'error-shake': showError }"
                />
              </el-form-item>
              
              <el-form-item>
                <el-button 
                  type="primary" 
                  size="large" 
                  @click="handlePasswordSubmit"
                  :loading="verifying"
                  class="submit-button"
                >
                  <span v-if="!verifying">验证密码</span>
                  <span v-else>验证中...</span>
                </el-button>
              </el-form-item>
            </el-form>
            
            <!-- 错误提示 -->
            <div v-if="showError" class="error-message">
              <el-icon class="error-icon"><WarningFilled /></el-icon>
              <span>密码错误，请重新输入</span>
            </div>
          </div>
          
          <!-- 底部提示 -->
          <div class="auth-footer">
            <div class="security-tips">
              <el-icon class="tip-icon"><InfoFilled /></el-icon>
              <span>此页面包含敏感数据操作，需要管理员权限</span>
            </div>
          </div>
        </div>
        
        <!-- 背景装饰 -->
        <div class="auth-bg-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><DataAnalysis /></el-icon>
            数据管理（此页面请勿点击按钮）
          </h1>
          <p class="page-description">复盘数据任务管理与监控</p>
        </div>
        <div class="header-actions">
          <el-button 
            type="primary" 
            :icon="Refresh" 
            @click="refreshData"
            :loading="loading"
          >
            刷新统计数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <div class="overview-card success">
        <div class="card-icon">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">成功同步</div>
          <div class="card-value">{{ statistics.successCount || 0 }}</div>
          <div class="card-subtitle">最近{{ selectedDateRange }}天</div>
        </div>
      </div>
      
      <div class="overview-card error">
        <div class="card-icon">
          <el-icon><CircleCloseFilled /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">同步失败</div>
          <div class="card-value">{{ statistics.failCount || 0 }}</div>
          <div class="card-subtitle">需要处理</div>
        </div>
      </div>
      
      <div class="overview-card warning">
        <div class="card-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">跳过任务</div>
          <div class="card-value">{{ statistics.skippedCount || 0 }}</div>
          <div class="card-subtitle">已跳过</div>
        </div>
      </div>
      
      <div class="overview-card info">
        <div class="card-icon">
          <el-icon><PieChart /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-title">成功率</div>
          <div class="card-value">{{ successRate }}%</div>
          <div class="card-subtitle">总体表现</div>
        </div>
      </div>
    </div>

    <!-- 日期范围选择器 -->
    <DateRangeSelector 
      @batch-sync="handleBatchSync"
      @batch-force-sync="handleBatchForceSync"
    />

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 筛选工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-select 
            v-model="selectedDateRange" 
            @change="handleDateRangeChange"
            style="width: 120px"
          >
            <el-option label="最近7天" :value="7" />
            <el-option label="最近15天" :value="15" />
            <el-option label="最近30天" :value="30" />
          </el-select>
        </div>
        
        <div class="toolbar-right">
          <el-dropdown @command="handleBatchAction">
            <el-button type="primary" plain>
              批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="sync-today">同步今日数据</el-dropdown-item>
                <el-dropdown-item command="sync-yesterday">同步昨日数据</el-dropdown-item>
                <el-dropdown-item divided command="force-sync-today">强制更新今日</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-container">
        <el-table 
          :data="syncStatusList" 
          v-loading="loading"
          stripe
          class="data-table"
          :default-sort="{ prop: 'syncTime', order: 'descending' }"
        >
          <el-table-column prop="tradeDate" label="交易日期" width="120" sortable>
            <template #default="{ row }">
              <div class="date-cell">
                <el-icon class="date-icon"><Calendar /></el-icon>
                {{ formatDate(row.tradeDate) }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="dataTypeDesc" label="数据类型" width="140">
            <template #default="{ row }">
              <el-tag 
                :color="getDataTypeColor(row.dataType)" 
                effect="light"
                class="data-type-tag"
              >
                {{ row.dataTypeDesc }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="同步状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusInfo(row.status).type"
                effect="dark"
                class="status-tag"
              >
                {{ getStatusInfo(row.status).text }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="同步结果" width="100" align="center">
            <template #default="{ row }">
              <div class="sync-result">
                <div class="result-item success">
                  <el-icon><Check /></el-icon>
                  <span>{{ row.successCount || 0 }}</span>
                </div>
                <div class="result-item error" v-if="row.failCount > 0">
                  <el-icon><Close /></el-icon>
                  <span>{{ row.failCount }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="syncTime" label="同步时间" width="180" sortable>
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon class="time-icon"><Clock /></el-icon>
                {{ formatDateTime(row.syncTime) }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="message" label="详细信息" min-width="200">
            <template #default="{ row }">
              <div class="message-cell">
                <el-tooltip :content="row.message" placement="top" :disabled="!row.message">
                  <span class="message-text">{{ row.message || '--' }}</span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Refresh"
                  @click="handleSyncData(row.tradeDate, row.dataType, row.dataTypeDesc)"
                  :loading="loading"
                >
                  同步
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="RefreshRight"
                  @click="handleSyncData(row.tradeDate, row.dataType, row.dataTypeDesc, true)"
                  :loading="loading"
                >
                  强制更新
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete"
                  @click="handleDeleteData(row.tradeDate, row.dataType, row.dataTypeDesc)"
                  :loading="loading"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { 
  DataAnalysis, 
  Refresh, 
  SuccessFilled, 
  CircleCloseFilled, 
  WarningFilled, 
  PieChart,
  ArrowDown,
  Calendar,
  Clock,
  Check,
  Close,
  RefreshRight,
  Delete,
  Lock,
  InfoFilled
} from '@element-plus/icons-vue'
import { useDataSync } from '@/composables/useDataSync'
import { ElMessage } from 'element-plus'
import DateRangeSelector from '@/components/admin/DateRangeSelector.vue'

// 密码验证相关状态
const isAuthenticated = ref(false)
const password = ref('')
const verifying = ref(false)
const showError = ref(false)
const ADMIN_PASSWORD = '110110'

// 使用数据同步 composable
const {
  loading,
  syncStatusList,
  statistics,
  selectedDateRange,
  successRate,
  fetchRecentSyncStatus,
  fetchStatistics,
  fetchDataTypes,
  handleDeleteData,
  handleSyncData,
  handleFullSync,
  refreshData,
  formatDateTime,
  formatDate,
  getStatusInfo,
  getDataTypeColor
} = useDataSync()

// 处理日期范围变化
const handleDateRangeChange = async () => {
  await refreshData()
}

// 处理批量操作
const handleBatchAction = async (command) => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  switch (command) {
    case 'sync-today':
      await handleFullSync(today, false)
      break
    case 'sync-yesterday':
      await handleFullSync(yesterday, false)
      break
    case 'force-sync-today':
      await handleFullSync(today, true)
      break
    default:
      ElMessage.warning('未知操作')
  }
}

// 处理批量同步
const handleBatchSync = async ({ startDate, endDate, days }) => {
  try {
    const dates = generateDateRange(startDate, endDate)
    let successCount = 0
    let failCount = 0
    
    for (const date of dates) {
      try {
        await handleFullSync(date, false)
        successCount++
      } catch (error) {
        failCount++
        console.error(`同步 ${date} 失败:`, error)
      }
    }
    
    ElMessage.success(`批量同步完成：成功 ${successCount} 天，失败 ${failCount} 天`)
  } catch (error) {
    ElMessage.error('批量同步失败')
  }
}

// 处理批量强制更新
const handleBatchForceSync = async ({ startDate, endDate, days }) => {
  try {
    const dates = generateDateRange(startDate, endDate)
    let successCount = 0
    let failCount = 0
    
    for (const date of dates) {
      try {
        await handleFullSync(date, true)
        successCount++
      } catch (error) {
        failCount++
        console.error(`强制更新 ${date} 失败:`, error)
      }
    }
    
    ElMessage.success(`批量强制更新完成：成功 ${successCount} 天，失败 ${failCount} 天`)
  } catch (error) {
    ElMessage.error('批量强制更新失败')
  }
}

// 生成日期范围
const generateDateRange = (startDate, endDate) => {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }
  
  return dates
}

// 处理密码提交
const handlePasswordSubmit = async () => {
  if (!password.value.trim()) {
    ElMessage.warning('请输入密码')
    return
  }
  
  verifying.value = true
  showError.value = false
  
  // 模拟验证延迟，增加真实感
  await new Promise(resolve => setTimeout(resolve, 800))
  
  if (password.value === ADMIN_PASSWORD) {
    isAuthenticated.value = true
    ElMessage.success('验证成功，欢迎访问数据管理页面')
    // 清空密码
    password.value = ''
  } else {
    showError.value = true
    // 触发错误动画
    setTimeout(() => {
      showError.value = false
    }, 3000)
    ElMessage.error('密码错误，请重新输入')
    // 清空密码输入框
    password.value = ''
  }
  
  verifying.value = false
}

// 初始化数据
onMounted(async () => {
  await Promise.all([
    fetchDataTypes(),
    refreshData()
  ])
})
</script>

<style scoped>
.data-management {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  position: relative; /* 添加相对定位 */
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 2rem;
}

.page-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-left: 4px solid;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.overview-card.success {
  border-left-color: #67c23a;
}

.overview-card.error {
  border-left-color: #f56c6c;
}

.overview-card.warning {
  border-left-color: #e6a23c;
}

.overview-card.info {
  border-left-color: #409eff;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.success .card-icon {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.error .card-icon {
  background-color: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.warning .card-icon {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.info .card-icon {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 0.9rem;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 0.8rem;
  color: #c0c4cc;
}

/* 主要内容区 */
.main-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f2f5;
  background-color: #fafbfc;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 表格容器 */
.table-container {
  padding: 0;
}

.data-table {
  --el-table-header-bg-color: #f8f9fa;
  --el-table-header-text-color: #606266;
}

/* 表格单元格样式 */
.date-cell,
.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-icon,
.time-icon {
  color: #909399;
  font-size: 14px;
}

.data-type-tag {
  border: none;
  color: white;
  font-weight: 500;
}

.status-tag {
  font-weight: 500;
}

.sync-result {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  font-weight: 500;
}

.result-item.success {
  color: #67c23a;
}

.result-item.error {
  color: #f56c6c;
}

.message-cell {
  max-width: 200px;
}

.message-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-management {
    padding: 16px;
  }
  
  .page-header {
    padding: 24px 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

/* 加载状态 */
.el-loading-mask {
  border-radius: 16px;
}

/* 表格条纹 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #fafbfc;
}

/* 表格悬停效果 */
:deep(.el-table__body tr:hover > td) {
  background-color: #f5f7fa !important;
}

/* 密码验证遮罩层样式 */
.auth-overlay {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.5s ease-out;
  border-radius: 16px; /* 添加圆角以匹配容器 */
}

.auth-container {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 2;
  animation: slideUp 0.6s ease-out;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.lock-icon {
  font-size: 36px;
  color: white;
}

.auth-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.auth-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
}

.auth-form {
  margin-bottom: 24px;
}

.password-input {
  margin-bottom: 20px;
}

.password-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.password-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
}

.password-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.password-input.error-shake {
  animation: shake 0.5s ease-in-out;
}

.submit-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
}

.submit-button:active {
  transform: translateY(0);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e74c3c;
  font-size: 14px;
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
  animation: slideDown 0.3s ease-out;
}

.error-icon {
  font-size: 16px;
}

.auth-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.security-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #7f8c8d;
  font-size: 14px;
}

.tip-icon {
  font-size: 16px;
  color: #3498db;
}

/* 背景装饰 */
/*.auth-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 1;
}*/

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 120px;
  height: 120px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 80px;
  height: 80px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 响应式设计 - 密码验证 */
@media (max-width: 768px) {
  .auth-container {
    max-width: 90%;
    padding: 16px;
  }
  
  .auth-card {
    padding: 32px 24px;
  }
  
  .auth-icon {
    width: 64px;
    height: 64px;
  }
  
  .lock-icon {
    font-size: 28px;
  }
  
  .auth-title {
    font-size: 24px;
  }
  
  .auth-subtitle {
    font-size: 14px;
  }
}
</style>