import { ref, computed } from 'vue'
import { useWatchlistStore } from '@/store/watchlist.store'
import { useStockStore } from '@/store/stock.store'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useWatchlist() {
  const watchlistStore = useWatchlistStore()
  const stockStore = useStockStore()
  
  // 响应式数据
  const loading = ref(false)
  const error = ref(null)
  const selectedGroup = ref(null)
  
  // 计算属性
  const filteredWatchlist = computed(() => {
    if (!selectedGroup.value) {
      return watchlistStore.watchlist
    }
    
    return watchlistStore.watchlist.filter(item => item.groupId === selectedGroup.value)
  })
  
  const watchlistCount = computed(() => filteredWatchlist.value.length)
  
  // 获取自选股列表
  const fetchWatchlist = async () => {
    try {
      loading.value = true
      error.value = null
      
      await watchlistStore.fetchWatchlist()
    } catch (err) {
      error.value = err.message || '获取自选股列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }
  
  // 添加自选股
  const addToWatchlist = async (code, showMessage = true) => {
    try {
      loading.value = true
      
      const response = await watchlistStore.addToWatchlist(code)
      
      if (showMessage) {
        ElMessage.success(`${code} 已添加到自选股`)
      }
      
      return response
    } catch (err) {
      const errorMsg = err.message || '添加自选股失败'
      if (showMessage) {
        ElMessage.error(errorMsg)
      }
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 移除自选股
  const removeFromWatchlist = async (code, showMessage = true) => {
    try {
      loading.value = true
      
      await watchlistStore.removeFromWatchlist(code)
      
      if (showMessage) {
        ElMessage.success(`${code} 已从自选股移除`)
      }
    } catch (err) {
      const errorMsg = err.message || '移除自选股失败'
      if (showMessage) {
        ElMessage.error(errorMsg)
      }
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 切换自选股状态
  const toggleWatchlist = async (code) => {
    try {
      await watchlistStore.toggleWatchlist(code)
      
      const isInWatchlist = watchlistStore.isInWatchlist(code)
      const message = isInWatchlist ? `${code} 已添加到自选股` : `${code} 已从自选股移除`
      ElMessage.success(message)
      
    } catch (err) {
      ElMessage.error('操作失败')
      throw err
    }
  }
  
  // 批量添加自选股
  const batchAddToWatchlist = async (codes) => {
    try {
      loading.value = true
      
      const response = await watchlistStore.batchAddToWatchlist(codes)
      ElMessage.success(`成功添加 ${codes.length} 只股票到自选股`)
      
      return response
    } catch (err) {
      ElMessage.error('批量添加失败')
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 批量移除自选股
  const batchRemoveFromWatchlist = async (codes) => {
    try {
      await ElMessageBox.confirm(
        `确定要移除选中的 ${codes.length} 只股票吗？`,
        '批量移除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      loading.value = true
      await watchlistStore.batchRemoveFromWatchlist(codes)
      ElMessage.success(`成功移除 ${codes.length} 只股票`)
      
    } catch (err) {
      if (err !== 'cancel') {
        ElMessage.error('批量移除失败')
        throw err
      }
    } finally {
      loading.value = false
    }
  }
  
  // 获取分组
  const fetchGroups = async () => {
    try {
      await watchlistStore.fetchWatchlistGroups()
    } catch (err) {
      ElMessage.error('获取分组失败')
    }
  }
  
  // 创建分组
  const createGroup = async (groupData) => {
    try {
      const response = await watchlistStore.createGroup(groupData)
      ElMessage.success('分组创建成功')
      return response
    } catch (err) {
      ElMessage.error('创建分组失败')
      throw err
    }
  }
  
  // 删除分组
  const deleteGroup = async (id, name = '') => {
    try {
      await ElMessageBox.confirm(
        `确定要删除分组"${name}"吗？该分组下的股票将移到默认分组。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      await watchlistStore.deleteGroup(id)
      ElMessage.success('分组删除成功')
      
    } catch (err) {
      if (err !== 'cancel') {
        ElMessage.error('删除分组失败')
        throw err
      }
    }
  }
  
  // 移动股票到分组
  const moveToGroup = async (code, groupId) => {
    try {
      await watchlistStore.moveToGroup(code, groupId)
      ElMessage.success('移动成功')
    } catch (err) {
      ElMessage.error('移动失败')
      throw err
    }
  }
  
  // 设置备注
  const setNote = async (code, note) => {
    try {
      await watchlistStore.setNote(code, note)
      ElMessage.success('备注保存成功')
    } catch (err) {
      ElMessage.error('保存备注失败')
      throw err
    }
  }
  
  // 设置价格提醒
  const setPriceAlert = async (code, alertData) => {
    try {
      const response = await watchlistStore.setPriceAlert(code, alertData)
      ElMessage.success('价格提醒设置成功')
      return response
    } catch (err) {
      ElMessage.error('设置价格提醒失败')
      throw err
    }
  }
  
  // 获取实时数据
  const fetchRealtimeData = async () => {
    try {
      const codes = watchlistStore.watchlistCodes
      if (codes.length > 0) {
        await stockStore.fetchRealtimeData(codes)
      }
    } catch (err) {
      console.error('获取实时数据失败:', err)
    }
  }
  
  // 设置选中的分组
  const setSelectedGroup = (groupId) => {
    selectedGroup.value = groupId
  }
  
  // 检查是否在自选股中
  const isInWatchlist = (code) => {
    return watchlistStore.isInWatchlist(code)
  }
  
  return {
    // 状态
    loading,
    error,
    selectedGroup,
    
    // 计算属性
    filteredWatchlist,
    watchlistCount,
    
    // Store数据
    watchlist: computed(() => watchlistStore.watchlist),
    groups: computed(() => watchlistStore.groups),
    watchlistCodes: computed(() => watchlistStore.watchlistCodes),
    groupedWatchlist: computed(() => watchlistStore.groupedWatchlist),
    
    // 方法
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    batchAddToWatchlist,
    batchRemoveFromWatchlist,
    fetchGroups,
    createGroup,
    deleteGroup,
    moveToGroup,
    setNote,
    setPriceAlert,
    fetchRealtimeData,
    setSelectedGroup,
    isInWatchlist
  }
}