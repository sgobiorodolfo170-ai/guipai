import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStockStore } from '@/store/stock.store'
import { formatPrice, formatPercent, formatChange, getChangeStatus } from '@/utils/stock'

export function useStockData(code = null) {
  const stockStore = useStockStore()
  
  // 响应式数据
  const loading = ref(false)
  const error = ref(null)
  const stockData = ref(null)
  const klineData = ref([])
  const realtimeData = ref(null)
  
  // 计算属性
  const formattedPrice = computed(() => {
    if (!stockData.value) return '--'
    return formatPrice(stockData.value.price)
  })
  
  const formattedChange = computed(() => {
    if (!stockData.value) return '--'
    return formatChange(stockData.value.change)
  })
  
  const formattedChangePercent = computed(() => {
    if (!stockData.value) return '--'
    return formatPercent(stockData.value.changePercent)
  })
  
  const changeStatus = computed(() => {
    if (!stockData.value) return 'flat'
    return getChangeStatus(stockData.value.change)
  })
  
  const isUp = computed(() => changeStatus.value === 'up')
  const isDown = computed(() => changeStatus.value === 'down')
  const isFlat = computed(() => changeStatus.value === 'flat')

  // 获取股票详情
  const fetchStockDetail = async (stockCode) => {
    try {
      loading.value = true
      error.value = null

      const response = await stockStore.fetchStockDetail(stockCode)
      // 拦截器返回信封 {code,data,msg}，真实股票对象在 response.data
      stockData.value = response.data || response

      return response
    } catch (err) {
      error.value = err.message || '获取股票数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取K线数据
  const fetchKLineData = async (stockCode, params = {}) => {
    try {
      const response = await stockStore.fetchKLineData(stockCode, params)
      klineData.value = response
      return response
    } catch (err) {
      error.value = err.message || '获取K线数据失败'
      throw err
    }
  }

  // 获取实时数据
  const fetchRealtimeData = async (stockCode) => {
    try {
      const response = await stockStore.fetchRealtimeData(stockCode)
      realtimeData.value = response
      return response
    } catch (err) {
      error.value = err.message || '获取实时数据失败'
      throw err
    }
  }

  // 刷新数据
  const refreshData = async () => {
    if (!code) return
    
    await Promise.all([
      fetchStockDetail(code),
      fetchRealtimeData(code)
    ])
  }

  // 自动刷新
  let refreshTimer = null
  const startAutoRefresh = (interval = 5000) => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
    
    refreshTimer = setInterval(() => {
      if (code && stockStore.isMarketOpen) {
        fetchRealtimeData(code)
      }
    }, interval)
  }

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // 监听代码变化
  watch(() => code, (newCode) => {
    if (newCode) {
      refreshData()
    }
  }, { immediate: true })

  // 生命周期
  onMounted(() => {
    if (code) {
      startAutoRefresh()
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // 状态
    loading,
    error,
    stockData,
    klineData,
    realtimeData,
    
    // 计算属性
    formattedPrice,
    formattedChange,
    formattedChangePercent,
    changeStatus,
    isUp,
    isDown,
    isFlat,
    
    // 方法
    fetchStockDetail,
    fetchKLineData,
    fetchRealtimeData,
    refreshData,
    startAutoRefresh,
    stopAutoRefresh
  }
}