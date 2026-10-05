<script setup>
/**
 * 设置 —— Tushare 多账号管理。
 *
 * 策略说明（与后端 tushare.js 账号池对应）：
 *   - 轮询：每次调用取「最久未用」的启用账号，负载均摊到各账号
 *   - 故障转移：无效 token → 停用；限频 → 冷却 60s；网络失败 → 冷却 10s，自动换下一账号重试
 *   - 接口本身的错误（如接口名错误）与账号无关，不换号直接报错
 * 统计（成功/失败/冷却中/无效）是内存级的，重启清零——它只是"当前会话健康度"指示。
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'

const accounts = ref([])
const loading = ref(false)
const testingIds = ref(new Set())

// ---- 添加 ----
const addName = ref('')
const addToken = ref('')
const addTest = ref(true)   // 添加前先验证，避免把打错的 token 存进去
const adding = ref(false)

// ---- 编辑 ----
const editVisible = ref(false)
const editForm = ref({ id: '', name: '', token: '', enabled: true })
const editSaving = ref(false)

const totalOk = computed(() => accounts.value.reduce((s, a) => s + (a.ok || 0), 0))
const totalFail = computed(() => accounts.value.reduce((s, a) => s + (a.fail || 0), 0))
const enabledCount = computed(() => accounts.value.filter(a => a.enabled && !a.invalid).length)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get('/settings/tushare')
    accounts.value = res.data?.accounts || []
  } catch (e) {
    ElMessage.error('获取账号列表失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

const addAccount = async () => {
  const token = addToken.value.trim()
  if (!token) return ElMessage.warning('请输入 token')
  adding.value = true
  try {
    const res = await api.post('/settings/tushare/accounts', {
      name: addName.value.trim(), token, test: addTest.value
    })
    ElMessage.success(res.msg || '已添加')
    addName.value = ''
    addToken.value = ''
    await fetchList()
  } catch (e) {
    ElMessage.error('添加失败: ' + e.message)
  } finally {
    adding.value = false
  }
}

const openEdit = (row) => {
  editForm.value = { id: row.id, name: row.name, token: '', enabled: row.enabled }
  editVisible.value = true
}

const saveEdit = async () => {
  editSaving.value = true
  try {
    const body = { name: editForm.value.name, enabled: editForm.value.enabled }
    if (editForm.value.token.trim()) body.token = editForm.value.token.trim()
    await api.put(`/settings/tushare/accounts/${editForm.value.id}`, body)
    ElMessage.success('已保存')
    editVisible.value = false
    await fetchList()
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    editSaving.value = false
  }
}

const toggleEnabled = async (row) => {
  try {
    await api.put(`/settings/tushare/accounts/${row.id}`, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '已启用' : '已停用')
  } catch (e) {
    row.enabled = !row.enabled // 回滚
    ElMessage.error('操作失败: ' + e.message)
  }
}

const removeAccount = async (row) => {
  try {
    await ElMessageBox.confirm(`将删除账号「${row.name}」（${row.tokenMasked}）。是否继续？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
  } catch { return }
  try {
    await api.delete(`/settings/tushare/accounts/${row.id}`)
    ElMessage.success('已删除')
    await fetchList()
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  }
}

const testAccount = async (row) => {
  testingIds.value.add(row.id)
  testingIds.value = new Set(testingIds.value) // 触发响应式
  try {
    const res = await api.post(`/settings/tushare/accounts/${row.id}/test`)
    ElMessage.success(`「${row.name}」${res.msg || '连接正常'}`)
  } catch (e) {
    ElMessage.error(`「${row.name}」测试失败: ${e.message}`)
  } finally {
    testingIds.value.delete(row.id)
    testingIds.value = new Set(testingIds.value)
  }
}

const statusOf = (row) => {
  if (row.invalid) return { text: '无效', type: 'danger' }
  if (!row.enabled) return { text: '已停用', type: 'info' }
  if (row.cooldownLeftSec > 0) return { text: `冷却 ${row.cooldownLeftSec}s`, type: 'warning' }
  return { text: '正常', type: 'success' }
}

onMounted(fetchList)
</script>

<template>
  <div class="settings-page">
    <h2>设置</h2>

    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Tushare 数据源（多账号池）</span>
          <el-tag :type="enabledCount > 0 ? 'success' : 'info'" size="small">
            {{ enabledCount > 0 ? `${enabledCount} 个账号可用` : '未配置' }}
          </el-tag>
        </div>
      </template>

      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        东财接口被限流/拦截时，自动回退 Tushare 取数。多个账号间按「最久未用优先」轮询分摊调用量；
        无效 token 自动停用、限频自动冷却 60 秒、网络失败自动换号重试。
      </el-alert>

      <!-- 添加账号 -->
      <el-form :inline="true" class="add-form">
        <el-form-item label="名称">
          <el-input v-model="addName" placeholder="如：主账号 / 小号" style="width: 140px" />
        </el-form-item>
        <el-form-item label="Token">
          <el-input
            v-model="addToken" type="password" show-password clearable
            placeholder="Tushare Pro token（tushare.pro 注册获取）" style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addTest">添加前先验证</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="adding" @click="addAccount">添加账号</el-button>
        </el-form-item>
      </el-form>

      <!-- 账号列表 -->
      <el-table :data="accounts" size="small" border v-loading="loading">
        <el-table-column prop="name" label="名称" min-width="110" />
        <el-table-column prop="tokenMasked" label="Token" min-width="140" />
        <el-table-column label="启用" width="70" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="statusOf(row).type">{{ statusOf(row).text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调用统计" width="130" align="center">
          <template #default="{ row }">
            <span class="stat-ok">{{ row.ok || 0 }}</span> / <span class="stat-fail">{{ row.fail || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最近错误" min-width="160">
          <template #default="{ row }">
            <span class="err-text" :title="row.lastError">{{ row.lastError ? (row.lastError.length > 40 ? row.lastError.slice(0, 40) + '…' : row.lastError) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :loading="testingIds.has(row.id)" @click="testAccount(row)">测试</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeAccount(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><span class="empty-tip">尚未添加账号，添加第一个开始启用 Tushare 兜底</span></template>
      </el-table>

      <div class="stats-line" v-if="accounts.length">
        本次会话累计调用：<span class="stat-ok">{{ totalOk }}</span> 成功 / <span class="stat-fail">{{ totalFail }}</span> 失败（重启清零）
      </div>

      <el-divider />
      <div class="tips">
        <p><strong>说明</strong></p>
        <ul>
          <li>Token 保存在本地 settings.json，不上传任何服务器</li>
          <li>注册地址：<a href="https://tushare.pro" target="_blank">tushare.pro</a>（不同积分等级的接口权限与限频不同）</li>
          <li>「无效」状态的账号需编辑修正 token 后才会重新参与轮询</li>
          <li>限频冷却（60s）结束后自动恢复轮询，无需手动操作</li>
        </ul>
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editVisible" title="编辑账号" width="480px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="Token">
          <el-input v-model="editForm.token" type="password" show-password placeholder="留空表示不更换 token" clearable />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.settings-page { padding: 20px; max-width: 1000px; }
.setting-card { margin-top: 10px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.add-form { margin-bottom: 4px; }
.stat-ok { color: #67c23a; font-weight: 600; }
.stat-fail { color: #f56c6c; font-weight: 600; }
.err-text { color: #f56c6c; font-size: 12px; }
.empty-tip { color: #c9cdd4; font-size: 13px; }
.stats-line { margin-top: 10px; color: #86909c; font-size: 13px; }
.tips { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.8; }
.tips ul { padding-left: 20px; margin: 8px 0; }
.tips a { color: var(--el-color-primary); }
</style>
