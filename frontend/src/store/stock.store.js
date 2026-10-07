import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as stockService from '@/services/stock.service'

export const useStockStore = defineStore('stock', () => {
  // 状态
  const stockList = ref([])
  const currentStock = ref(null)
  const klineData = ref([])
  const realtimeData = ref({})
  const marketOverview = ref(null)
  const hotStocks = ref([])
  const loading = ref(false)
  const searchResults = ref([])
  const marketSummary = ref({ total: 0, byMarket: {}, updatedAt: null })

  // 计算属性
  const currentStockCode = computed(() => currentStock.value?.code)
  const isMarketOpen = computed(() => {
    // 简单的市场开盘判断逻辑
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const day = now.getDay()
    
    // 周末不开盘
    if (day === 0 || day === 6) return false
    
    // 上午 9:30-11:30, 下午 13:00-15:00
    const morningStart = 9 * 60 + 30
    const morningEnd = 11 * 60 + 30
    const afternoonStart = 13 * 60
    const afternoonEnd = 15 * 60
    
    const currentTime = hour * 60 + minute
    
    return (currentTime >= morningStart && currentTime <= morningEnd) ||
           (currentTime >= afternoonStart && currentTime <= afternoonEnd)
  })

  // 获取股票列表
  const fetchStockList = async (params = {}) => {
    try {
      loading.value = true
      const response = await stockService.getStockList(params)
      // 拦截器返回信封 {code,data,msg}，真实列表在 response.data.list
      stockList.value = response.data?.list || response.data || []
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取股票详情
  const fetchStockDetail = async (code) => {
    try {
      loading.value = true
      const response = await stockService.getStockDetail(code)
      currentStock.value = response
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取K线数据
  const fetchKLineData = async (code, params = {}) => {
    try {
      const response = await stockService.getStockKLine(code, params)
      klineData.value = response
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取实时数据
  const fetchRealtimeData = async (codes) => {
    try {
      const response = await stockService.getStockRealtime(codes)
      
      // 更新实时数据
      if (Array.isArray(codes)) {
        codes.forEach(code => {
          const data = response.find(item => item.code === code)
          if (data) {
            realtimeData.value[code] = data
          }
        })
      } else {
        realtimeData.value[codes] = response
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 搜索股票
  const searchStocks = async (keyword) => {
    try {
      const response = await stockService.searchStocks(keyword)
      searchResults.value = response
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取市场概况
  const fetchMarketOverview = async () => {
    try {
      const response = await stockService.getMarketOverview()
      marketOverview.value = response
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取热门股票
  const fetchHotStocks = async (params = {}) => {
    try {
      const response = await stockService.getHotStocks(params)
      hotStocks.value = response
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取股票基础信息状态（总数 + 各市场数量）
  const fetchMarketSummary = async () => {
    try {
      const response = await stockService.getStockBasicStatus()
      marketSummary.value = {
        total: response.data?.total ?? 0,
        byMarket: response.data?.byMarket || {},
        updatedAt: response.data?.updatedAt || null
      }
      return marketSummary.value
    } catch (error) {
      throw error
    }
  }

  // 同步股票基础信息入库（全市场列表写入本地库）
  const syncStockList = async () => {
    try {
      const response = await stockService.syncStockBasic()
      await fetchMarketSummary()
      return response.data
    } catch (error) {
      throw error
    }
  }

  // 获取股票历史数据
  const fetchStockHistory = async (code, params = {}) => {
    try {
      const response = await stockService.getStockHistory(code, params)
      return response
    } catch (error) {
      throw error
    }
  }

  // 清空搜索结果
  const clearSearchResults = () => {
    searchResults.value = []
  }

  // 设置当前股票
  const setCurrentStock = (stock) => {
    currentStock.value = stock
  }

  // 获取实时价格
  const getRealtimePrice = (code) => {
    return realtimeData.value[code]
  }

  return {
    // 状态
    stockList,
    currentStock,
    klineData,
    realtimeData,
    marketOverview,
    hotStocks,
    loading,
    searchResults,
    marketSummary,
    
    // 计算属性
    currentStockCode,
    isMarketOpen,
    
    // 方法
    fetchStockList,
    fetchStockDetail,
    fetchKLineData,
    fetchRealtimeData,
    searchStocks,
    fetchMarketOverview,
    fetchHotStocks,
    fetchMarketSummary,
    syncStockList,
    fetchStockHistory,
    clearSearchResults,
    setCurrentStock,
    getRealtimePrice
  }
})