import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    getAllSyncStatus,
    getSyncStatusByDate,
    getRecentSyncStatus,
    getSyncStatistics,
    getDataTypes,
    deleteDataManual,
    syncDataManual,
    fullSyncManual
} from '@/services/dataSync.service'

export function useDataSync() {
    // 响应式数据
    const loading = ref(false)
    const syncStatusList = ref([])
    const statistics = ref({})
    const dataTypes = ref([])
    const selectedDateRange = ref(7)

    // 状态映射
    const statusMap = {
        0: { text: '初始状态', type: 'info' },
        1: { text: '成功', type: 'success' },
        2: { text: '失败', type: 'danger' },
        3: { text: '跳过', type: 'warning' }
    }

    // 数据类型颜色映射
    const dataTypeColors = {
        'LIMIT_UP': '#f56c6c',
        'LIMIT_DOWN': '#67c23a',
        'PLATE_MARKET': '#409eff',
        'INDEX': '#e6a23c',
        'INDEX_DAILY': '#909399'
    }

    // 计算属性
    const successRate = computed(() => {
        if (!statistics.value.totalSyncCount) return 0
        return (((statistics.value.successCount + statistics.value.skippedCount) / statistics.value.totalSyncCount) * 100).toFixed(1)
    })

    const recentDates = computed(() => {
        const dates = []
        const today = new Date()
        for (let i = 0; i < 30; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() - i)
            dates.push({
                value: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('zh-CN', { 
                    month: '2-digit', 
                    day: '2-digit',
                    weekday: 'short'
                })
            })
        }
        return dates
    })

    // 获取所有同步状态
    const fetchAllSyncStatus = async () => {
        try {
            loading.value = true
            const response = await getAllSyncStatus()
            if (response.code === 200) {
                syncStatusList.value = response.data || []
            }
        } catch (error) {
            console.error('获取同步状态失败:', error)
            ElMessage.error('获取同步状态失败')
        } finally {
            loading.value = false
        }
    }

    // 获取最近N天的同步状态
    const fetchRecentSyncStatus = async (days = 7) => {
        try {
            loading.value = true
            const response = await getRecentSyncStatus(days)
            if (response.code === 200) {
                syncStatusList.value = response.data || []
            }
        } catch (error) {
            console.error('获取最近同步状态失败:', error)
            ElMessage.error('获取最近同步状态失败')
        } finally {
            loading.value = false
        }
    }

    // 获取统计信息
    const fetchStatistics = async (days = 7) => {
        try {
            const response = await getSyncStatistics(days)
            if (response.code === 200) {
                statistics.value = response.data || {}
            }
        } catch (error) {
            console.error('获取统计信息失败:', error)
        }
    }

    // 获取数据类型列表
    const fetchDataTypes = async () => {
        try {
            const response = await getDataTypes()
            if (response.code === 200) {
                dataTypes.value = response.data || []
            }
        } catch (error) {
            console.error('获取数据类型失败:', error)
        }
    }

    // 手动删除数据
    const handleDeleteData = async (tradeDate, dataType, dataTypeDesc) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除 ${tradeDate} 的 ${dataTypeDesc} 数据吗？此操作不可撤销！`,
                '删除确认',
                {
                    confirmButtonText: '确定删除',
                    cancelButtonText: '取消',
                    type: 'warning',
                    confirmButtonClass: 'el-button--danger'
                }
            )

            loading.value = true
            const response = await deleteDataManual(tradeDate, dataType)
            
            if (response.code === 200) {
                ElMessage.success(response.msg || '删除成功')
                await refreshData()
            } else {
                ElMessage.error(response.msg || '删除失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('删除数据失败:', error)
                ElMessage.error('删除数据失败')
            }
        } finally {
            loading.value = false
        }
    }

    // 手动同步数据
    const handleSyncData = async (tradeDate, dataType, dataTypeDesc, forceUpdate = false) => {
        try {
            const action = forceUpdate ? '强制更新' : '同步'
            await ElMessageBox.confirm(
                `确定要${action} ${tradeDate} 的 ${dataTypeDesc} 数据吗？`,
                `${action}确认`,
                {
                    confirmButtonText: `确定${action}`,
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            loading.value = true
            const response = await syncDataManual(tradeDate, dataType, forceUpdate)
            
            if (response.code === 200) {
                ElMessage.success(response.msg || '同步成功')
                await refreshData()
            } else {
                ElMessage.error(response.msg || '同步失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('同步数据失败:', error)
                ElMessage.error('同步数据失败')
            }
        } finally {
            loading.value = false
        }
    }

    // 手动执行完整收盘任务
    const handleFullSync = async (tradeDate, forceUpdate = false) => {
        try {
            const action = forceUpdate ? '强制更新' : '同步'
            await ElMessageBox.confirm(
                `确定要${action} ${tradeDate} 的所有数据吗？这将同步该日期的所有数据类型。`,
                `完整${action}确认`,
                {
                    confirmButtonText: `确定${action}`,
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            loading.value = true
            const response = await fullSyncManual(tradeDate, forceUpdate)
            
            if (response.code === 200) {
                ElMessage.success('完整同步任务执行成功')
                await refreshData()
            } else {
                ElMessage.error(response.msg || '完整同步失败')
            }
        } catch (error) {
            if (error !== 'cancel') {
                console.error('完整同步失败:', error)
                ElMessage.error('完整同步失败')
            }
        } finally {
            loading.value = false
        }
    }

    // 刷新数据
    const refreshData = async () => {
        await Promise.all([
            fetchRecentSyncStatus(selectedDateRange.value),
            fetchStatistics(selectedDateRange.value)
        ])
    }

    // 格式化日期时间
    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '--'
        const date = new Date(dateTimeStr)
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    // 格式化日期
    const formatDate = (dateStr) => {
        if (!dateStr) return '--'
        const date = new Date(dateStr)
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    // 获取状态信息
    const getStatusInfo = (status) => {
        return statusMap[status] || { text: '未知', type: 'info' }
    }

    // 获取数据类型颜色
    const getDataTypeColor = (dataType) => {
        return dataTypeColors[dataType] || '#909399'
    }

    return {
        // 响应式数据
        loading,
        syncStatusList,
        statistics,
        dataTypes,
        selectedDateRange,
        
        // 计算属性
        successRate,
        recentDates,
        
        // 方法
        fetchAllSyncStatus,
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
    }
}