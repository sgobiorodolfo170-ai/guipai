<script setup>
import { ref, onMounted } from 'vue'
import { useWatchlistStore } from '@/store/watchlist.store'
import { useStockStore } from '@/store/stock.store'
import { formatPrice, formatPercent, formatChange, getChangeStatus } from '@/utils/stock'
import { ElMessage, ElMessageBox } from 'element-plus'

const watchlistStore = useWatchlistStore()
const stockStore = useStockStore()

const loading = ref(false)
const selectedGroup = ref(null)
const showGroupDialog = ref(false)
const groupForm = ref({ name: '', description: '' })
const selectedStocks = ref([])

onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  try {
    loading.value = true
    await Promise.all([
      watchlistStore.fetchWatchlist(),
      watchlistStore.fetchWatchlistGroups()
    ])
    
    // 获取实时数据
    if (watchlistStore.watchlistCodes.length > 0) {
      await stockStore.fetchRealtimeData(watchlistStore.watchlistCodes)
    }
  } catch (error) {
    console.error('获取自选股数据失败:', error)
  } finally {
    loading.value = false
  }
}

import { computed } from 'vue'

const filteredWatchlist = computed(() => {
  if (!selectedGroup.value) {
    return watchlistStore.watchlist
  }
  return watchlistStore.watchlist.filter(item => item.groupId === selectedGroup.value)
})

const handleGroupChange = (groupId) => {
  selectedGroup.value = groupId
}

const createGroup = async () => {
  try {
    await watchlistStore.createGroup(groupForm.value)
    showGroupDialog.value = false
    groupForm.value = { name: '', description: '' }
  } catch (error) {
    console.error('创建分组失败:', error)
  }
}

const deleteGroup = async (group) => {
  try {
    await watchlistStore.deleteGroup(group.id, group.name)
    if (selectedGroup.value === group.id) {
      selectedGroup.value = null
    }
  } catch (error) {
    console.error('删除分组失败:', error)
  }
}

const removeFromWatchlist = async (code) => {
  try {
    await watchlistStore.removeFromWatchlist(code)
  } catch (error) {
    console.error('移除自选股失败:', error)
  }
}

const batchRemove = async () => {
  if (selectedStocks.value.length === 0) {
    ElMessage.warning('请选择要移除的股票')
    return
  }
  
  try {
    await watchlistStore.batchRemoveFromWatchlist(selectedStocks.value)
    selectedStocks.value = []
  } catch (error) {
    console.error('批量移除失败:', error)
  }
}

const refreshData = async () => {
  if (watchlistStore.watchlistCodes.length > 0) {
    await stockStore.fetchRealtimeData(watchlistStore.watchlistCodes)
  }
}

const getChangeClass = (change) => {
  const status = getChangeStatus(change)
  return `stock-${status}`
}

const getRealTimeData = (code) => {
  return stockStore.realtimeData[code] || {}
}
</script>

<template>
  <div class="watchlist">
    <div class="page-header">
      <h1 class="page-title">自选股</h1>
      <p class="page-description">管理您的自选股票</p>
    </div>
    
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20" justify="space-between">
        <el-col :span="12">
          <el-select
            v-model="selectedGroup"
            placeholder="选择分组"
            clearable
            @change="handleGroupChange"
          >
            <el-option label="全部" :value="null" />
            <el-option
              v-for="group in watchlistStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-col>
        <el-col :span="12" class="text-right">
          <el-button @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="primary" @click="showGroupDialog = true">
            <el-icon><Plus /></el-icon>
            新建分组
          </el-button>
          <el-button
            type="danger"
            @click="batchRemove"
            :disabled="selectedStocks.length === 0"
          >
            <el-icon><Delete /></el-icon>
            批量移除
          </el-button>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 分组管理 -->
    <el-card v-if="watchlistStore.groups.length > 0" class="groups-card">
      <template #header>
        <span>分组管理</span>
      </template>
      <div class="groups-list">
        <el-tag
          v-for="group in watchlistStore.groups"
          :key="group.id"
          :type="selectedGroup === group.id ? 'primary' : ''"
          closable
          @click="handleGroupChange(group.id)"
          @close="deleteGroup(group)"
          class="group-tag"
        >
          {{ group.name }} ({{ watchlistStore.getTemplatesByCategory(group.id)?.length || 0 }})
        </el-tag>
      </div>
    </el-card>
    
    <!-- 自选股列表 -->
    <el-card>
      <el-table
        :data="filteredWatchlist"
        v-loading="loading"
        stripe
        @selection-change="selectedStocks = $event.map(item => item.code)"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="代码" width="100" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column label="现价" width="100">
          <template #default="{ row }">
            <span class="stock-price" :class="getChangeClass(getRealTimeData(row.code).change)">
              {{ formatPrice(getRealTimeData(row.code).price || row.price) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="涨跌额" width="100">
          <template #default="{ row }">
            <span :class="getChangeClass(getRealTimeData(row.code).change)">
              {{ formatChange(getRealTimeData(row.code).change || 0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="涨跌幅" width="100">
          <template #default="{ row }">
            <span :class="getChangeClass(getRealTimeData(row.code).change)">
              {{ formatPercent(getRealTimeData(row.code).changePercent || 0) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
        <el-table-column prop="addTime" label="添加时间" width="150" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="removeFromWatchlist(row.code)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredWatchlist.length === 0" description="暂无自选股" />
    </el-card>
    
    <!-- 新建分组对话框 -->
    <el-dialog v-model="showGroupDialog" title="新建分组" width="400px">
      <el-form :model="groupForm" label-width="80px">
        <el-form-item label="分组名称" required>
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            placeholder="请输入分组描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showGroupDialog = false">取消</el-button>
        <el-button type="primary" @click="createGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.watchlist {
  padding: 20px;
}

.toolbar-card,
.groups-card {
  margin-bottom: 20px;
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-tag {
  cursor: pointer;
  margin: 0;
}

.stock-price {
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .watchlist {
    padding: 10px;
  }
  
  :deep(.el-table) {
    font-size: 12px;
  }
}
</style>