import {computed, reactive, ref} from 'vue'
import {ElMessage} from 'element-plus'
import {
    getStockDrop,
    getStockIndexSpot,
    getStockIndustry,
    getStockLimit,
    getStockLimitYesterday,
    getStockSpot
} from '@/services/aktools.service'
import StockDateUtil from "@/utils/StockDateUtil.js";
import cacheStorage from "@/utils/cacheStorage.js";


export function useReview() {
    // 加载状态
    const loading = ref(false)
    const industryLoading = ref(false)

    // 数据状态
    const limitUpData = ref([])
    const limitDownData = ref([])
    const yesterdayLimit = ref([])
    const industryData = ref([])
    const marketData = ref([])
    const indexData = ref([])

    // 格式化金额
    const formatAmount = (amount) => {
        if (amount >= 1e8) {
            return (amount / 1e8).toFixed(2) + '亿'
        } else if (amount >= 1e4) {
            return (amount / 1e4).toFixed(2) + '万'
        }
        return amount.toString()
    }

    // 获取当前日期字符串
    const getCurrentDateString = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}${month}${day}`
    }

    // 数字转中文
    const numberToChinese = (num) => {
        const chineseNumbers = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
        return num > 10 ? `${num}板` : `${chineseNumbers[num]}板`
    }

    // 将昨日涨停数据转换为分类结构
    // 将涨停数据转换为分类结构
    const yesterdayTransformLimitUpData = (data) => {
        const categories = [
            {name: '高位板', min: 5, max: Infinity},
            {name: '四连板', min: 4, max: 4},
            {name: '三连板', min: 3, max: 3},
            {name: '二连板', min: 2, max: 2},
            {name: '一连板', min: 1, max: 1}
        ]
        return categories.map(category => {
            const stocks = data
                .filter(stock => stock.昨日连板数 >= category.min && stock.昨日连板数 <= category.max)
                .sort((a, b) => (b.昨日连板数 - a.昨日连板数) || (b.涨跌幅 - a.涨跌幅))
                .map(stock => {
                    return reactive(
                        {
                            code: stock.代码,
                            level: numberToChinese(stock.昨日连板数),
                            name: stock.名称,
                            change: stock.涨跌幅,
                            concept: stock.所属行业,
                            specialTag: stock.涨停统计.replace('/', '天') + '板',
                            amount: stock.成交额,
                            turnover: stock.换手率 == null ? '0.00' : Number(stock.换手率).toFixed(2),
                            showKline: false,
                            klineData: null,
                            current: stock.最新价,
                        }
                    )
                })

            return {
                name: category.name,
                count: stocks.length,
                stocks
            }
        })
    }

    // 将涨停数据转换为分类结构
    const transformLimitUpData = (data) => {
        const categories = [
            {name: '高位板', min: 5, max: Infinity},
            {name: '四连板', min: 4, max: 4},
            {name: '三连板', min: 3, max: 3},
            {name: '二连板', min: 2, max: 2},
            {name: '一连板', min: 1, max: 1}
        ]

        return categories.map(category => {
            const stocks = data
                .filter(stock => stock.连板数 >= category.min && stock.连板数 <= category.max)
                .sort((a, b) => (b.连板数 - a.连板数) || (b.涨跌幅 - a.涨跌幅))
                .map(stock => {
                    return reactive(
                        {
                            code: stock.代码,
                            level: numberToChinese(stock.连板数),
                            name: stock.名称,
                            change: stock.涨跌幅,
                            concept: stock.所属行业,
                            specialTag: stock.涨停统计.replace('/', '天') + '板',
                            amount: stock.成交额,
                            turnover: stock.换手率 == null ? '0.00' : Number(stock.换手率).toFixed(2),
                            showKline: false,
                            klineData: null,
                            current: stock.最新价,
                        }
                    )
                })

            return {
                name: category.name,
                count: stocks.length,
                stocks
            }
        })
    }


    // 获取涨停池数据
    const fetchLimitUpData = async () => {
        try {
            const dateStr = StockDateUtil.getRecentTradingDay()
            const response = await getStockLimit(dateStr)

            if (response.code === 200 && response.data) {
                limitUpData.value = response.data
                return response.data
            }
            return []
        } catch (error) {
            console.error('获取涨停池数据失败:', error)
            ElMessage.error('获取涨停池数据失败')
            return []
        }
    }

    // 获取跌停池数据
    const fetchLimitDownData = async () => {
        try {
            const dateStr = StockDateUtil.getRecentTradingDay()
            const response = await getStockDrop(dateStr)

            if (response.code === 200 && response.data) {
                limitDownData.value = response.data
                return response.data
            }
            return []
        } catch (error) {
            console.error('获取跌停池数据失败:', error)
            return []
        }
    }

    // 获取昨天涨停数据
    const fetchYesterdayLimitUpData = async () => {
        try {
            const dateStr = StockDateUtil.getRecentTradingDay()
            const response = await getStockLimitYesterday(dateStr)

            if (response.code === 200 && response.data) {
                yesterdayLimit.value = response.data
                return response.data
            }
            return []
        } catch (error) {
            console.error('获取涨停池数据失败:', error)
            ElMessage.error('获取涨停池数据失败')
            return []
        }
    }

    // 获取行业板块数据
    const fetchIndustryData = async () => {
        try {
            industryLoading.value = true
            const response = await getStockIndustry()

            if (response.code === 200 && response.data) {
                const data = response.data
                    .sort((a, b) => b.涨跌幅 - a.涨跌幅)
                    .map(industry => ({
                        name: industry.板块,
                        change: industry.涨跌幅,
                        leader: industry.领涨股,
                        upCount: industry.上涨家数,
                        downCount: industry.下跌家数,
                        leaderPercent: industry['领涨股-涨跌幅'],
                        amount: industry.总成交额,
                        netInflow: industry.净流入,
                    }))

                industryData.value = data
                return data
            }
            return []
        } catch (error) {
            console.error('获取行业板块数据失败:', error)
            ElMessage.error('获取行业板块数据失败')
            return []
        } finally {
            industryLoading.value = false
        }
    }

    // 获取市场概况数据
    const fetchMarketData = async () => {
        try {
            const response = await getStockSpot()

            if (response.code === 200 && response.data) {
                marketData.value = response.data
                return response.data
            }
            return []
        } catch (error) {
            console.error('获取市场数据失败:', error)
            return []
        }
    }

    // 计算市场统计数据
    const marketStats = computed(() => {
        if (!marketData.value.length) {
            return {
                upCount: 0,
                downCount: 0,
                flatCount: 0,
                totalAmount: 0
            }
        }

        let upCount = 0
        let downCount = 0
        let flatCount = 0
        let totalAmount = 0

        marketData.value.forEach(stock => {
            totalAmount += stock.成交额 || 0
            if (stock.涨跌幅 > 0) upCount++
            else if (stock.涨跌幅 < 0) downCount++
            else flatCount++
        })

        return {
            upCount,
            downCount,
            flatCount,
            totalAmount
        }
    })

    // 股票分类数据
    const stockCategories = computed(() => {
        return transformLimitUpData(limitUpData.value)
    })

    //昨日股票分类数据
    const yesterdayStockCategories = computed(() => {
        return yesterdayTransformLimitUpData(yesterdayLimit.value)
    })

    // 高标股
    const highFlagStock = computed(() => {
        if (!limitUpData.value.length) return '--'

        const maxBoardStock = limitUpData.value.reduce((max, stock) =>
            stock.连板数 > (max?.连板数 || 0) ? stock : max, null)

        return maxBoardStock?.名称 || '--'
    })


    // 获取最近N个交易日的日期（排除周末和节假日）
    const getTradeDates = (days) => {
        const dates = []
        const date = new Date()


        while (dates.length < days.value) {
            // 排除周末（周六0 周日6）
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                const dateStr = formatDate(date)
                dates.unshift(dateStr) // 从前往后插入保证顺序
            }
            date.setDate(date.getDate() - 1) // 向前推一天
        }
        return {
            startDate: dates[0].replace(/-/g, ''),
            endDate: dates[dates.length - 1].replace(/-/g, '')
        }
    }
// 日期格式化 YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // 转换函数
    function transformKlineData(originalData) {
        // 日期格式化 (MM-DD)
        const formatDate = (dateStr) => {

            const date = new Date(dateStr);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}-${day}`;
        };

        // 转换日期数组
        const dates = originalData.map(item => formatDate(item.日期));

        // 转换价格数组 [开盘, 收盘, 最低, 最高]
        const prices = originalData.map(item => [
            item.开盘,
            item.收盘,
            item.最低,
            item.最高
        ]);

        return { dates, prices };
    }

    // 获取年月日字符串
    const getYearMonthDay = (originalData) => {
        // 日期格式化 (MM-DD)
        const formatDate = (dateStr) => {

            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };


        // 转换价格数组 [日期, 开盘, 收盘, 最低, 最高]
        return  originalData.map(item => [
            formatDate(item.日期),
            item.开盘,
            item.收盘,
            item.最低,
            item.最高,
            item.成交额,
            item.涨跌幅


        ]) ;
    }

    //获取指数数据（上证系列指数 + 深证系列指数，合并后覆盖上证指数/深证成指/创业板指）
    const getIndexData = async () => {
        try {
            const [shResponse, szResponse] = await Promise.all([
                getStockIndexSpot('上证系列指数'),
                getStockIndexSpot('深证系列指数')
            ])
            const shData = shResponse.code === 200 && shResponse.data ? shResponse.data : []
            const szData = szResponse.code === 200 && szResponse.data ? szResponse.data : []
            indexData.value = [...shData, ...szData]
            return indexData.value
        } catch (error) {
            console.error('获取市场数据失败:', error)
            return []
        }
    }

    // ---- 复盘数据本地缓存（持久化，由用户点击刷新按钮手动更新）----
    // 复盘页所需指数代码：上证指数000001 / 深证成指399001 / 创业板指399006
    const REVIEW_CACHE_KEY = 'review:data'
    const REVIEW_INDEX_CODES = ['000001', '399001', '399006']

    /**
     * 从本地缓存载入复盘数据（不触发网络请求）
     * @returns {null|{tradingDay:string}} 命中返回 { tradingDay }，未命中返回 null
     */
    const loadCachedReview = () => {
        const cached = cacheStorage.get(REVIEW_CACHE_KEY)
        if (!cached) return null
        // 指数为空视为缓存失效：上游故障时曾把空数组写进持久缓存（无 TTL），
        // 若不判定为未命中，后端修复后打开页面仍会一直直出空白
        if (!cached.indexData || cached.indexData.length === 0) return null
        indexData.value = cached.indexData || []
        limitUpData.value = cached.limitUpData || []
        limitDownData.value = cached.limitDownData || []
        yesterdayLimit.value = cached.yesterdayLimit || []
        return { tradingDay: cached.tradingDay || null }
    }

    /**
     * 拉取全部复盘数据并写入本地缓存（刷新按钮调用）
     * 仅缓存实际使用的 3 个指数，避免 localStorage 膨胀
     * @returns {Promise<boolean>} 是否成功
     */
    const fetchAndCacheReview = async () => {
        loading.value = true
        try {
            await Promise.all([
                getIndexData(),
                fetchLimitUpData(),
                fetchLimitDownData(),
                fetchYesterdayLimitUpData(),
            ])
            cacheStorage.set(REVIEW_CACHE_KEY, {
                indexData: indexData.value.filter(item => REVIEW_INDEX_CODES.includes(item.代码)),
                limitUpData: limitUpData.value,
                limitDownData: limitDownData.value,
                yesterdayLimit: yesterdayLimit.value,
                tradingDay: StockDateUtil.getRecentTradingDay(),
            })
            return true
        } finally {
            loading.value = false
        }
    }

    return {
        // 状态
        loading,
        industryLoading,

        // 数据
        limitUpData,
        limitDownData,
        yesterdayLimit,
        industryData,
        marketData,

        // 计算属性
        stockCategories,
        marketStats,
        indexData,
        highFlagStock,
        yesterdayStockCategories,

        // 方法
        fetchLimitUpData,
        fetchYesterdayLimitUpData,
        fetchLimitDownData,
        fetchIndustryData,
        fetchMarketData,
        formatAmount,
        getCurrentDateString,
        getTradeDates,
        transformKlineData,
        yesterdayTransformLimitUpData,
        getIndexData,
        getYearMonthDay,
        loadCachedReview,
        fetchAndCacheReview,
    }
}