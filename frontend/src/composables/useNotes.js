import { ref, computed, onUnmounted } from 'vue'
import { useNoteStore } from '@/store/note.store'
import { getStockRealtime } from '@/services/stock.service'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

/**
 * 股票笔记 composable —— 封装列表过滤、CRUD、草稿自动保存、提醒轮询、浮动盈亏补算。
 *
 * 存储策略：主数据在 sql.js 本地库（无远程后端）；草稿自动保存用 localStorage 临时态。
 * 浮动盈亏：不落库，对 holding_status=open 的笔记调 getStockRealtime 取现价实时算。
 */

const DRAFT_PREFIX = 'stockNote:draft:'
const POLL_INTERVAL = 60000 // 提醒轮询 60s

export function useNotes() {
  const noteStore = useNoteStore()

  const loading = ref(false)
  const error = ref(null)
  const searchKeyword = ref('')
  const selectedStock = ref(null)   // 股票代码
  const selectedTags = ref([])
  const selectedDirection = ref(null)
  const viewMode = ref('list')

  // 笔记列表（store.notes），过滤参数驱动后端查询
  const notes = computed(() => noteStore.notes)
  const total = computed(() => noteStore.total)
  const tags = computed(() => noteStore.tags)
  const stocks = computed(() => noteStore.stocks)
  const summary = computed(() => noteStore.summary)
  const currentNote = computed(() => noteStore.currentNote)

  /** 组装当前过滤参数 */
  const filterParams = computed(() => {
    const p = { page: 1, pageSize: 100 }
    if (searchKeyword.value) p.keyword = searchKeyword.value
    if (selectedStock.value) p.stockCode = selectedStock.value
    if (selectedDirection.value) p.direction = selectedDirection.value
    if (selectedTags.value.length) p.tags = selectedTags.value.join(',')
    return p
  })

  /** 拉取笔记列表（应用当前过滤） */
  const fetchNotes = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      await noteStore.fetchNoteList({ ...filterParams.value, ...params })
    } catch (err) {
      error.value = err.message || '获取笔记列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  const createNote = async (noteData) => {
    try {
      loading.value = true
      const res = await noteStore.createNote(noteData)
      ElMessage.success('笔记创建成功')
      return res
    } catch (err) {
      ElMessage.error(err.message || '创建笔记失败')
      throw err
    } finally { loading.value = false }
  }

  const updateNote = async (id, noteData) => {
    try {
      loading.value = true
      const res = await noteStore.updateNote(id, noteData)
      ElMessage.success('笔记更新成功')
      return res
    } catch (err) {
      ElMessage.error(err.message || '更新笔记失败')
      throw err
    } finally { loading.value = false }
  }

  const deleteNote = async (id, title = '') => {
    try {
      await ElMessageBox.confirm(`确定删除笔记"${title}"？提醒将一并删除，不可恢复。`, '删除确认', {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      })
      loading.value = true
      await noteStore.deleteNote(id)
      ElMessage.success('已删除')
    } catch (err) {
      if (err !== 'cancel') { ElMessage.error(err.message || '删除失败'); throw err }
    } finally { loading.value = false }
  }

  const fetchStocks = () => noteStore.fetchStocks()
  const fetchTags = () => noteStore.fetchTags()
  const fetchSummary = () => noteStore.fetchSummary()

  /** 导出笔记：返回 {title,html,md}，调用方生成 Blob 下载 */
  const exportNote = async (id, format = 'html') => {
    try {
      const data = await noteStore.exportNote(id)
      const ext = format === 'md' ? 'md' : 'html'
      const content = format === 'md' ? data.md : data.html
      const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.title || '笔记'}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } catch (err) {
      ElMessage.error(err.message || '导出失败')
    }
  }

  // ============== 浮动盈亏补算 ==============
  /**
   * 对 open 持仓笔记取现价，算浮动盈亏（前端实时，不落库）。
   * @param {Array} list 笔记列表
   * @returns {Promise<Object>} code -> { price, pnl } 映射，并原地写 note._floatingPnl
   */
  const fetchRealtimePnL = async (list) => {
    const openNotes = (list || []).filter(n => n.holdingStatus === 'open' && n.stockCode && BUY_DIRS.has(n.direction))
    if (!openNotes.length) return {}
    const codes = [...new Set(openNotes.map(n => n.stockCode))]
    try {
      const res = await getStockRealtime(codes)
      // 返回结构可能是数组或对象，兼容
      const spotMap = {}
      const arr = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.items || [])
      for (const s of arr) {
        const c = s.code || s.stockCode || s.symbol
        spotMap[c] = s.price ?? s.latestPrice ?? s.close
      }
      for (const n of openNotes) {
        const cur = spotMap[n.stockCode]
        if (cur != null && n.tradePrice != null && n.quantity != null) {
          n._floatingPnl = (cur - n.tradePrice) * n.quantity - (n.fee || 0)
          n._currentPrice = cur
        }
      }
      return spotMap
    } catch {
      // 取现价失败不影响列表展示，浮动盈亏留空
      return {}
    }
  }

  // ============== 草稿自动保存（localStorage） ==============
  const saveDraft = (key, form) => {
    try {
      localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(form))
    } catch { /* 配额满等异常静默 */ }
  }
  const restoreDraft = (key) => {
    try {
      const raw = localStorage.getItem(DRAFT_PREFIX + key)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }
  const clearDraft = (key) => {
    try { localStorage.removeItem(DRAFT_PREFIX + key) } catch {}
  }

  // ============== 提醒轮询 + 通知 ==============
  let pollTimer = null

  const notifyUser = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body }); return } catch {}
    }
    // 降级：页面内提示
    ElNotification({ title, message: body, type: 'warning', duration: 8000 })
  }

  const requestNotifyPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  /** 处理到期提醒（date 一次性设 triggered；repeat 仅更新 last_triggered_at） */
  const handleDueAlerts = async (due) => {
    const now = new Date().toISOString()
    for (const a of due) {
      notifyUser(`笔记提醒: ${a.noteTitle || ''}`, buildDueMessage(a))
      const patch = { lastTriggeredAt: now }
      if (a.alertType === 'date') patch.status = 'triggered'
      try { await noteStore.updateAlert(a.noteId, a.id, patch) } catch {}
    }
  }

  /** 处理价格提醒：取现价比较 */
  const handlePriceAlerts = async (price) => {
    if (!price.length) return
    const codes = [...new Set(price.map(a => a.stockCode).filter(Boolean))]
    if (!codes.length) return
    const res = await getStockRealtime(codes)
    const spotMap = {}
    const arr = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.items || [])
    for (const s of arr) {
      const c = s.code || s.stockCode || s.symbol
      spotMap[c] = s.price ?? s.latestPrice ?? s.close
    }
    const now = new Date().toISOString()
    for (const a of price) {
      const cur = spotMap[a.stockCode]
      if (cur == null || a.targetPrice == null) continue
      const hit = a.direction === 'above' ? cur >= a.targetPrice : cur <= a.targetPrice
      if (hit) {
        const op = a.direction === 'above' ? '高于' : '低于'
        notifyUser(`价格提醒: ${a.stockName || a.stockCode}`, `现价 ${cur} 已${op} ${a.targetPrice}（${a.noteTitle || ''}）`)
        // 价格提醒一次性触发后标记，避免重复
        try { await noteStore.updateAlert(a.noteId, a.id, { status: 'triggered', lastTriggeredAt: now }) } catch {}
      }
    }
  }

  const checkAndNotify = async () => {
    try {
      const { due = [], price = [] } = await noteStore.checkAlerts()
      await handleDueAlerts(due)
      await handlePriceAlerts(price)
    } catch { /* 轮询失败静默，下次重试 */ }
  }

  const startAlertPoller = () => {
    requestNotifyPermission()
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(checkAndNotify, POLL_INTERVAL)
    // 启动时立即查一次
    checkAndNotify()
  }
  const stopAlertPoller = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  onUnmounted(() => stopAlertPoller())

  const clearFilters = () => {
    searchKeyword.value = ''
    selectedStock.value = null
    selectedTags.value = []
    selectedDirection.value = null
  }

  return {
    // 状态
    loading, error, searchKeyword, selectedStock, selectedTags, selectedDirection, viewMode,
    // 列表数据
    notes, total, tags, stocks, summary, currentNote, filterParams,
    // CRUD
    fetchNotes, createNote, updateNote, deleteNote,
    fetchStocks, fetchTags, fetchSummary, exportNote,
    // 浮动盈亏
    fetchRealtimePnL,
    // 草稿
    saveDraft, restoreDraft, clearDraft,
    // 提醒
    checkAndNotify, startAlertPoller, stopAlertPoller, requestNotifyPermission,
    clearFilters
  }
}

// ============== 内部常量/工具 ==============
const BUY_DIRS = new Set(['buy', 'add'])

function buildDueMessage(a) {
  if (a.alertType === 'date') return `日期提醒到期（${a.triggerDate || ''} ${a.triggerTime || ''}）`
  if (a.alertType === 'repeat') {
    const r = a.repeatRule || {}
    const typeLabel = { daily: '每日', weekly: '每周', monthly: '每月' }[r.type] || '定时'
    return `${typeLabel}提醒 ${a.triggerTime || ''}`
  }
  return '提醒到期'
}
