import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as watchlistService from '@/services/watchlist.service'

export const useWatchlistStore = defineStore('watchlist', () => {
  // 状态
  const watchlist = ref([])
  const groups = ref([])
  const loading = ref(false)

  // 计算属性
  const watchlistCodes = computed(() => watchlist.value.map(item => item.code))
  const groupedWatchlist = computed(() => {
    const grouped = {}
    
    groups.value.forEach(group => {
      grouped[group.id] = {
        ...group,
        stocks: watchlist.value.filter(item => item.groupId === group.id)
      }
    })
    
    // 未分组的股票
    const ungrouped = watchlist.value.filter(item => !item.groupId)
    if (ungrouped.length > 0) {
      grouped[0] = {
        id: 0,
        name: '默认分组',
        stocks: ungrouped
      }
    }
    
    return grouped
  })

  // 获取自选股列表
  const fetchWatchlist = async () => {
    try {
      loading.value = true
      const response = await watchlistService.getWatchlist()
      // 拦截器返回信封 {code,data,msg}，真实数据在 response.data
      watchlist.value = response.data || response || []
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 添加自选股（groupId 指定归入分组，name 用于自选列表名称列）
  const addToWatchlist = async (code, groupId, name) => {
    try {
      const response = await watchlistService.addToWatchlist(code, groupId, name)
      const data = response.data || response
      // 更新本地状态（后端返回行含 groupId，直接复用即可）
      const existingIndex = watchlist.value.findIndex(item => item.code === code)
      if (existingIndex === -1) {
        watchlist.value.push(data)
      }

      return response
    } catch (error) {
      throw error
    }
  }

  // 移除自选股
  const removeFromWatchlist = async (code) => {
    try {
      await watchlistService.removeFromWatchlist(code)
      
      // 更新本地状态
      const index = watchlist.value.findIndex(item => item.code === code)
      if (index !== -1) {
        watchlist.value.splice(index, 1)
      }
    } catch (error) {
      throw error
    }
  }

  // 检查是否在自选股中
  const isInWatchlist = (code) => {
    return watchlistCodes.value.includes(code)
  }

  // 批量添加自选股
  const batchAddToWatchlist = async (codes) => {
    try {
      const response = await watchlistService.batchAddToWatchlist(codes)
      const list = response.data || response || []
      // 更新本地状态
      list.forEach(item => {
        const existingIndex = watchlist.value.findIndex(w => w.code === item.code)
        if (existingIndex === -1) {
          watchlist.value.push(item)
        }
      })
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 批量移除自选股
  const batchRemoveFromWatchlist = async (codes) => {
    try {
      await watchlistService.batchRemoveFromWatchlist(codes)
      
      // 更新本地状态
      codes.forEach(code => {
        const index = watchlist.value.findIndex(item => item.code === code)
        if (index !== -1) {
          watchlist.value.splice(index, 1)
        }
      })
    } catch (error) {
      throw error
    }
  }

  // 获取自选股分组
  const fetchWatchlistGroups = async () => {
    try {
      const response = await watchlistService.getWatchlistGroups()
      groups.value = response.data || response || []
      return response
    } catch (error) {
      throw error
    }
  }

  // 创建分组
  const createGroup = async (groupData) => {
    try {
      const response = await watchlistService.createWatchlistGroup(groupData)
      groups.value.push(response.data || response)
      return response
    } catch (error) {
      throw error
    }
  }

  // 更新分组
  const updateGroup = async (id, groupData) => {
    try {
      const response = await watchlistService.updateWatchlistGroup(id, groupData)
      const data = response.data || response
      // 更新本地状态
      const index = groups.value.findIndex(group => group.id === id)
      if (index !== -1) {
        groups.value[index] = { ...groups.value[index], ...data }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 删除分组
  const deleteGroup = async (id) => {
    try {
      await watchlistService.deleteWatchlistGroup(id)
      
      // 更新本地状态
      const index = groups.value.findIndex(group => group.id === id)
      if (index !== -1) {
        groups.value.splice(index, 1)
      }
      
      // 将该分组下的股票移到默认分组
      watchlist.value.forEach(item => {
        if (item.groupId === id) {
          item.groupId = null
        }
      })
    } catch (error) {
      throw error
    }
  }

  // 移动股票到分组
  const moveToGroup = async (code, groupId) => {
    try {
      await watchlistService.moveToGroup(code, groupId)
      
      // 更新本地状态
      const stock = watchlist.value.find(item => item.code === code)
      if (stock) {
        stock.groupId = groupId
      }
    } catch (error) {
      throw error
    }
  }

  // 设置备注
  const setNote = async (code, note) => {
    try {
      await watchlistService.setWatchlistNote(code, note)
      
      // 更新本地状态
      const stock = watchlist.value.find(item => item.code === code)
      if (stock) {
        stock.note = note
      }
    } catch (error) {
      throw error
    }
  }

  // 设置价格提醒
  const setPriceAlert = async (code, alertData) => {
    try {
      const response = await watchlistService.setPriceAlert(code, alertData)
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取价格提醒
  const getPriceAlerts = async (code) => {
    try {
      const response = await watchlistService.getPriceAlerts(code)
      return response
    } catch (error) {
      throw error
    }
  }

  // 删除价格提醒
  const deletePriceAlert = async (alertId) => {
    try {
      await watchlistService.deletePriceAlert(alertId)
    } catch (error) {
      throw error
    }
  }

  // 切换自选股状态
  const toggleWatchlist = async (code) => {
    if (isInWatchlist(code)) {
      await removeFromWatchlist(code)
    } else {
      await addToWatchlist(code)
    }
  }

  return {
    // 状态
    watchlist,
    groups,
    loading,
    
    // 计算属性
    watchlistCodes,
    groupedWatchlist,
    
    // 方法
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    batchAddToWatchlist,
    batchRemoveFromWatchlist,
    fetchWatchlistGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    moveToGroup,
    setNote,
    setPriceAlert,
    getPriceAlerts,
    deletePriceAlert,
    toggleWatchlist
  }
})