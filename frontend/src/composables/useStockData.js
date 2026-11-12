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

  // 详情快照 + 实时行情合并：实时接口只覆盖行情字段，名称/代码/市场等身份字段
  // 必须保留详情接口的值——库内 stock_spot 无名称列，/realtime 会以代码兜底，
  // 直接 spread 会把「平安银行」覆盖成「000001」。
  const quote = computed(() => {
    if (!stockData.value) return null
    if (!realtimeData.value) return stockData.value
    return {
      ...stockData.value,
      ...realtimeData.value,
      code: stockData.value.code || realtimeData.value.code,
      name: stockData.value.name || realtimeData.value.name,
      market: stockData.value.market || realtimeData.value.market
    }
  })

  // 计算属性
  const formattedPrice = computed(() => {
    if (!quote.value) return '--'
    return formatPrice(quote.value.price)
  })
  
  const formattedChange = computed(() => {
    if (!quote.value) return '--'
    return formatChange(quote.value.change)
  })
  
  const formattedChangePercent = computed(() => {
    if (!quote.value) return '--'
    return formatPercent(quote.value.changePercent)
  })
  
  const changeStatus = computed(() => {
    if (!quote.value) return 'flat'
    return getChangeStatus(quote.value.change)
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
      // 拦截器返回信封 {code,data,msg}，/realtime 的 data 是数组；按代码取第一条
      const payload = response?.data ?? response
      const list = Array.isArray(payload) ? payload : (payload?.list || [])
      realtimeData.value = list.find(item => String(item.code) === String(stockCode)) || list[0] || null
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
    quote,
    
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