<script setup>
/**
 * 自选股页面 —— 左右分栏 + 分组选项卡
 *
 * 设计理由：
 * - 左区常驻 KLineChart，点击右区任一股票行即自动展示其 K 线，替代原 Drawer 弹窗，
 *   看盘与看自选融为一体，减少操作跳转。
 * - 分组由 el-tabs(type=card, editable) 承载：每个分组一个选项卡，尾部 + 号新建分组，
 *   选项卡 × 删除分组，替代原「分组选择下拉框 + 分组管理标签卡片」，结构更扁平。
 * - 中间分割线可拖拽，宽度持久化到 localStorage（与 Dashboard/StockBoards 的缓存策略一致），
 *   用户布局偏好跨会话保留。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useWatchlistStore } from '@/store/watchlist.store'
import { useStockStore } from '@/store/stock.store'
import { formatPrice, formatPercent, formatChange, getChangeStatus } from '@/utils/stock'
import { ElMessage, ElMessageBox } from 'element-plus'
import KLineChart from '@/components/common/KLineChart.vue'

const watchlistStore = useWatchlistStore()
const stockStore = useStockStore()

const loading = ref(false)
const showGroupDialog = ref(false)
const groupForm = ref({ name: '', description: '' })

// 当前选中的股票（驱动左区 K 线图）
const selectedStock = ref({ code: '', name: '' })
// 当前激活的分组选项卡（el-tabs name，字符串）
const activeGroupId = ref('')

// ---- 分组选项卡数据 ----
// groupedWatchlist 已按 groupId 聚合，含默认分组(id=0，仅当存在未分组股票时)
const tabGroups = computed(() => Object.values(watchlistStore.groupedWatchlist))

onMounted(() => {
  initSplitWidth()
  fetchData()
})

onBeforeUnmount(() => {
  // 防止组件卸载时拖拽监听未清理
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

const fetchData = async () => {
  try {
    loading.value = true
    await Promise.all([
      watchlistStore.fetchWatchlist(),
      watchlistStore.fetchWatchlistGroups()
    ])
    // 获取实时行情
    if (watchlistStore.watchlistCodes.length > 0) {
      await stockStore.fetchRealtimeData(watchlistStore.watchlistCodes)
    }
    // 默认激活第一个分组选项卡
    if (!activeGroupId.value && tabGroups.value.length > 0) {
      activeGroupId.value = String(tabGroups.value[0].id)
    }
    // 默认选中第一个分组的第一只股票，左区不空
    if (!selectedStock.value.code) {
      const first = tabGroups.value.find(g => g.stocks.length > 0)
      if (first) {
        selectedStock.value = { code: first.stocks[0].code, name: first.stocks[0].name }
      }
    }
  } catch (error) {
    console.error('获取自选股数据失败:', error)
  } finally {
    loading.value = false
  }
}

// ---- 删除模式 + 新建分组 ----
// 设计理由：默认选项卡不显示 ×，避免误删；点 - 进入删除模式后各分组选项卡显示红色 ×，
// 再点 - 退出。+ 始终用于新建分组。el-tabs 原生 +（editable/addable）已弃用，
// 以便在选项卡栏右端自定义 -/+ 按钮并获得该控制位。
const deleteMode = ref(false)

// + 按钮：打开新建分组对话框
const openCreateGroup = () => {
  groupForm.value = { name: '', description: '' }
  showGroupDialog.value = true
}

// el-tabs @edit 仅处理 remove（add 改由自定义 + 按钮直接开对话框）。
// 事件签名：(paneName, action)——首参为分组名，次参为动作 'remove'
const handleTabEdit = (name, action) => {
  if (action !== 'remove') return
  const id = Number(name)
  if (id === 0) return // 默认分组不可删除
  const group = watchlistStore.groups.find(g => g.id === id)
  deleteGroup(id, group ? group.name : '')
}

const createGroup = async () => {
  if (!groupForm.value.name.trim()) {
    ElMessage.warning('请输入分组名称')
    return
  }
  try {
    const resp = await watchlistStore.createGroup(groupForm.value)
    showGroupDialog.value = false
    const newGroup = resp?.data || resp
    groupForm.value = { name: '', description: '' }
    if (newGroup && newGroup.id != null) {
      activeGroupId.value = String(newGroup.id)
    }
    ElMessage.success('分组创建成功')
  } catch (error) {
    console.error('创建分组失败:', error)
    ElMessage.error('创建分组失败')
  }
}

const deleteGroup = async (id, name) => {
  if (id === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除分组"${name}"吗？该分组下的股票将移到默认分组。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await watchlistStore.deleteGroup(id)
    ElMessage.success('分组删除成功')
    // 切换到第一个剩余选项卡
    const remaining = Object.keys(watchlistStore.groupedWatchlist)
    activeGroupId.value = remaining.length > 0 ? String(remaining[0]) : ''
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除分组失败:', err)
      ElMessage.error('删除分组失败')
    }
  }
}

const removeFromWatchlist = async (code) => {
  try {
    await watchlistStore.removeFromWatchlist(code)
    ElMessage.success(`${code} 已从自选股移除`)
  } catch (error) {
    console.error('移除自选股失败:', error)
    ElMessage.error('移除自选股失败')
  }
}

const refreshData = async () => {
  if (watchlistStore.watchlistCodes.length > 0) {
    await stockStore.fetchRealtimeData(watchlistStore.watchlistCodes)
    ElMessage.success('行情已刷新')
  }
}

// ---- 行选择 → 驱动左区 K 线 ----
const handleRowClick = (row) => {
  selectedStock.value = { code: row.code, name: row.name }
}

// ---- 行情展示辅助 ----
const getChangeClass = (change) => {
  const status = getChangeStatus(change)
  return `stock-${status}`
}

const getRealTimeData = (code) => {
  return stockStore.realtimeData[code] || {}
}

// ---- 左右分栏拖拽（宽度持久化到 localStorage）----
const SPLIT_KEY = 'watchlist_split_left'
const MIN_LEFT = 240
const MIN_RIGHT = 360

const splitContainer = ref(null)
const leftWidth = ref(420)
let dragging = false
let startX = 0
let startWidth = 0

const initSplitWidth = () => {
  const saved = localStorage.getItem(SPLIT_KEY)
  if (saved) {
    leftWidth.value = Number(saved)
  } else if (splitContainer.value) {
    leftWidth.value = Math.round(splitContainer.value.clientWidth * 0.45)
  }
}

const startDrag = (e) => {
  dragging = true
  startX = e.clientX
  startWidth = leftWidth.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.userSelect = 'none'
}

const onDrag = (e) => {
  if (!dragging || !splitContainer.value) return
  const dx = e.clientX - startX
  const maxW = splitContainer.value.clientWidth - MIN_RIGHT
  let newWidth = startWidth + dx
  if (newWidth < MIN_LEFT) newWidth = MIN_LEFT
  if (newWidth > maxW) newWidth = maxW
  leftWidth.value = newWidth
}

const stopDrag = () => {
  if (!dragging) return
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
  localStorage.setItem(SPLIT_KEY, String(leftWidth.value))
}
</script>

<template>
  <div class="watchlist">
    <!-- 标题行：自选股 + 刷新按钮（右） -->
    <div class="page-header">
      <h1 class="page-title">自选股</h1>
      <el-button @click="refreshData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <!-- 左右分栏：左区 K 线 | 分割线 | 右区分组选项卡 -->
    <div class="watchlist-split" ref="splitContainer">
      <!-- 左区：K 线图（随选中股票自动切换） -->
      <div class="split-left" :style="{ width: leftWidth + 'px' }">
        <div v-if="selectedStock.code" class="kline-wrap">
          <div class="kline-title">{{ selectedStock.name }} ({{ selectedStock.code }})</div>
          <KLineChart
            :key="selectedStock.code"
            :stock-code="selectedStock.code"
            :show-period-switcher="true"
            :show-adjust-switcher="true"
            :show-drawing-tools="true"
            :show-volume="true"
            height="100%"
          />
        </div>
        <el-empty v-else description="点击右侧股票查看 K 线图" />
      </div>

      <!-- 可拖拽分割线 -->
      <div class="split-divider" @mousedown="startDrag">
        <div class="split-divider-handle"></div>
      </div>

      <!-- 右区：分组选项卡，每个分组一页；- 切换删除模式，+ 新建分组 -->
      <div class="split-right" v-loading="loading">
        <div v-if="tabGroups.length > 0" class="tabs-wrap" :class="{ 'delete-mode': deleteMode }">
          <!-- 自定义 - / + 按钮：位于选项卡栏右端（原生 + 已禁用，腾出该控制位） -->
          <div class="tabs-controls">
            <button
              type="button"
              class="tab-btn tab-minus"
              :class="{ active: deleteMode }"
              :title="deleteMode ? '退出删除分组模式' : '进入删除分组模式'"
              @click="deleteMode = !deleteMode"
            >−</button>
            <button
              type="button"
              class="tab-btn tab-plus"
              title="新建分组"
              @click="openCreateGroup"
            >+</button>
          </div>
          <el-tabs
            v-model="activeGroupId"
            type="card"
            @edit="handleTabEdit"
          >
            <el-tab-pane
              v-for="g in tabGroups"
              :key="g.id"
              :name="String(g.id)"
              :label="g.name"
              :closable="deleteMode && g.id !== 0"
            >
            <el-table
              :data="g.stocks"
              stripe
              highlight-current-row
              @row-click="handleRowClick"
              class="watchlist-table"
            >
              <el-table-column prop="code" label="代码" width="100" sortable />
              <el-table-column prop="name" label="名称" width="120" sortable />
              <el-table-column label="现价" width="90" sortable :sort-method="(a, b) => (getRealTimeData(a.code).price || 0) - (getRealTimeData(b.code).price || 0)">
                <template #default="{ row }">
                  <span class="stock-price" :class="getChangeClass(getRealTimeData(row.code).change)">
                    {{ formatPrice(getRealTimeData(row.code).price || row.price) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="涨跌额" width="90" sortable :sort-method="(a, b) => (getRealTimeData(a.code).change || 0) - (getRealTimeData(b.code).change || 0)">
                <template #default="{ row }">
                  <span :class="getChangeClass(getRealTimeData(row.code).change)">
                    {{ formatChange(getRealTimeData(row.code).change || 0) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="涨跌幅" width="90" sortable :sort-method="(a, b) => (getRealTimeData(a.code).changePercent || 0) - (getRealTimeData(b.code).changePercent || 0)">
                <template #default="{ row }">
                  <span :class="getChangeClass(getRealTimeData(row.code).change)">
                    {{ formatPercent(getRealTimeData(row.code).changePercent || 0) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="note" label="备注" show-overflow-tooltip />
              <el-table-column prop="addTime" label="添加时间" width="150" sortable />
              <el-table-column label="操作" width="90" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="danger"
                    size="small"
                    @click.stop="removeFromWatchlist(row.code)"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        </div>

        <el-empty v-else description="暂无自选股" />
      </div>
    </div>

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
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

/* 左右分栏容器 */
.watchlist-split {
  flex: 1;
  display: flex;
  min-height: 0;
}

.split-left {
  flex-shrink: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.kline-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.kline-title {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-light);
}

/* 可拖拽分割线 */
.split-divider {
  flex-shrink: 0;
  width: 6px;
  cursor: col-resize;
  background: var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transition: background 0.15s;
}

.split-divider:hover,
.split-divider:active {
  background: var(--el-color-primary-light-5);
}

.split-divider-handle {
  width: 2px;
  height: 32px;
  background: var(--el-border-color);
  border-radius: 1px;
}

/* 右区选项卡 */
.split-right {
  flex: 1;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 4px 8px;
  min-width: 0;
}

.watchlist-table {
  cursor: pointer;
}

/* 选项卡栏自定义 -/+ 按钮（原生 + 已禁用，腾出右端控制位） */
.tabs-wrap {
  position: relative;
}

.tabs-controls {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 3;
  display: flex;
  gap: 6px;
}

.tab-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: #fff;
  color: var(--el-text-color-primary);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.tab-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

/* 删除模式激活：- 按钮高亮红 */
.tab-btn.tab-minus.active {
  color: #fff;
  background: #f56c6c;
  border-color: #f56c6c;
}

/* 删除模式下各分组选项卡的 × 红色 */
.tabs-wrap.delete-mode :deep(.el-tabs__item .is-icon-close) {
  color: #f56c6c;
}

/* 给选项卡导航右侧预留 -/+ 按钮空间，避免末尾选项卡被遮挡 */
.tabs-wrap :deep(.el-tabs__header) {
  padding-right: 74px;
}

.stock-price {
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .watchlist {
    padding: 10px;
    height: auto;
  }

  .watchlist-split {
    flex-direction: column;
  }

  .split-left {
    width: 100% !important;
    height: 320px;
  }

  .split-divider {
    width: 100%;
    height: 6px;
    cursor: row-resize;
  }

  .split-right {
    flex: 1;
    min-height: 300px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }
}
</style>
