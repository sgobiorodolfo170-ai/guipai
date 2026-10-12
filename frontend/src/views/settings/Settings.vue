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

// ---- AKShare Python 桥接 ----
const ak = ref({ config: { enabled: false, pythonPath: '', port: 8889 }, python: {}, running: false })
const akLoading = ref(false)
const akInstalling = ref(false)
const akTesting = ref(false)

const fetchAk = async () => {
  akLoading.value = true
  try {
    const res = await api.get('/settings/akshare')
    ak.value = res.data || {}
  } catch (e) {
    ElMessage.error('获取 AKShare 配置失败: ' + e.message)
  } finally {
    akLoading.value = false
  }
}

const toggleAk = async (enabled) => {
  try {
    await api.put('/settings/akshare', { enabled })
    if (enabled) {
      ElMessage.success('已启用。服务将在应用重启时自动拉起（aktools-server.exe）')
    } else {
      await api.post('/settings/akshare/stop')
      ElMessage.success('已停用')
    }
    await fetchAk()
  } catch (e) {
    ElMessage.error('操作失败: ' + e.message)
  }
}

const saveAkPath = async () => {
  try {
    await api.put('/settings/akshare', { pythonPath: ak.value.config.pythonPath })
    ElMessage.success('已保存')
    await fetchAk()
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  }
}

const testAk = async () => {
  akTesting.value = true
  try {
    const res = await api.post('/settings/akshare/test')
    ElMessage.success(res.msg || '服务正常')
  } catch (e) {
    ElMessage.error('探活失败: ' + e.message)
  } finally {
    akTesting.value = false
  }
}

const installAk = async () => {
  try {
    await ElMessageBox.confirm(
      '将通过 pip 安装 akshare + flask（约 1-3 分钟，下载 pandas/numpy 等依赖）。是否继续？',
      '安装 AKShare 依赖',
      { confirmButtonText: '开始安装', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  akInstalling.value = true
  try {
    // 流式响应：axios 不便逐块读，这里用 fetch 读流
    const resp = await fetch('/api/settings/akshare/install', { method: 'POST' })
    const reader = resp.body.getReader()
    const dec = new TextDecoder()
    let last = ''
    let done = false
    while (!done) {
      const { value, done: d } = await reader.read()
      done = d
      if (value) last = dec.decode(value)
    }
    ElMessage.success(last.includes('安装完成') ? '安装完成' : '安装流程结束')
    await fetchAk()
  } catch (e) {
    ElMessage.error('安装失败: ' + e.message)
  } finally {
    akInstalling.value = false
  }
}

onMounted(() => {
  fetchList()
  fetchAk()
  fetchTdx()
})

// ---- 通达信 Key 多账号 ----
const tdx = ref({ config: {}, keys: [], activeKey: null })
const tdxLoading = ref(false)
const tdxTestingIds = ref(new Set())
const tdxKeyName = ref('')
const tdxKeyVal = ref('')
const tdxAdding = ref(false)

const fetchTdx = async () => {
  tdxLoading.value = true
  try {
    const res = await api.get('/settings/tdx')
    tdx.value = res.data || {}
  } catch (e) {
    ElMessage.error('获取通达信配置失败: ' + e.message)
  } finally {
    tdxLoading.value = false
  }
}

const addTdxKey = async () => {
  const key = tdxKeyVal.value.trim()
  if (!key) return ElMessage.warning('请输入 Key')
  tdxAdding.value = true
  try {
    await api.post('/settings/tdx/keys', { name: tdxKeyName.value.trim(), key })
    ElMessage.success('Key 已添加')
    tdxKeyName.value = ''
    tdxKeyVal.value = ''
    await fetchTdx()
  } catch (e) {
    ElMessage.error('添加失败: ' + e.message)
  } finally {
    tdxAdding.value = false
  }
}

const toggleTdxKey = async (row) => {
  try {
    await api.put(`/settings/tdx/keys/${row.id}`, { enabled: row.enabled })
    ElMessage.success(row.enabled ? '已启用' : '已停用')
    await fetchTdx()
  } catch (e) {
    row.enabled = !row.enabled
    ElMessage.error('操作失败: ' + e.message)
  }
}

const removeTdxKey = async (row) => {
  try {
    await ElMessageBox.confirm(`将删除 Key「${row.name}」（${row.keyMasked}）。是否继续？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
  } catch { return }
  try {
    await api.delete(`/settings/tdx/keys/${row.id}`)
    ElMessage.success('已删除')
    await fetchTdx()
  } catch (e) {
    ElMessage.error('删除失败: ' + e.message)
  }
}

const testTdxKey = async (row) => {
  tdxTestingIds.value.add(row.id)
  tdxTestingIds.value = new Set(tdxTestingIds.value)
  try {
    const res = await api.post(`/settings/tdx/keys/${row.id}/test`)
    ElMessage.success(res.msg || '验证通过')
  } catch (e) {
    ElMessage.error(`「${row.name}」测试失败: ${e.message}`)
  } finally {
    tdxTestingIds.value.delete(row.id)
    tdxTestingIds.value = new Set(tdxTestingIds.value)
  }
}

const applyTdxKey = async (row) => {
  try {
    const res = await api.post(`/settings/tdx/keys/${row.id}/apply`)
    ElMessage.success(res.msg)
    await fetchTdx()
  } catch (e) {
    ElMessage.error('应用失败: ' + e.message)
  }
}
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

    <!-- AKShare Python 桥接数据源 -->
    <el-card class="setting-card" shadow="hover" v-loading="akLoading">
      <template #header>
        <div class="card-header">
          <span>AKShare Python 数据源（末级兜底）</span>
          <el-tag :type="ak.running ? 'success' : ak.config.enabled ? 'warning' : 'info'" size="small">
            {{ ak.running ? '服务运行中' : ak.config.enabled ? '已启用(待启动)' : '未启用' }}
          </el-tag>
        </div>
      </template>

      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        东财/新浪均失败时，由 AKShare（Python）作为末级兜底取数；尤其补强涨跌停池/昨日涨停（此前仅东财+Tushare）。
        打包版内置 aktools-server.exe 自包含；开发态需 pip install akshare flask 或构建 exe。
      </el-alert>

      <el-descriptions :column="2" border size="small" class="mb-12">
        <el-descriptions-item label="Python">
          <span v-if="ak.python?.pythonExe">{{ ak.python.pythonExe }} · {{ ak.python.pythonVersion }}</span>
          <span v-else class="err-text">未检测到 Python</span>
        </el-descriptions-item>
        <el-descriptions-item label="akshare">
          <el-tag v-if="ak.python?.akshareVersion" type="success" size="small">{{ ak.python.akshareVersion }}</el-tag>
          <el-tag v-else type="danger" size="small">未安装</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="服务端口">{{ ak.config.port }}</el-descriptions-item>
        <el-descriptions-item label="服务状态">
          <el-tag :type="ak.running ? 'success' : 'info'" size="small">{{ ak.running ? '运行中' : '未运行' }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-form :inline="true" class="add-form">
        <el-form-item label="启用">
          <el-switch v-model="ak.config.enabled" @change="toggleAk" />
        </el-form-item>
        <el-form-item label="Python 路径">
          <el-input v-model="ak.config.pythonPath" placeholder="留空自动探测 python" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="saveAkPath">保存路径</el-button>
          <el-button size="small" :loading="akTesting" :disabled="!ak.running" @click="testAk">探活</el-button>
          <el-button size="small" type="primary" plain :loading="akInstalling" :disabled="!ak.python?.pythonExe" @click="installAk">
            pip 安装 akshare
          </el-button>
        </el-form-item>
      </el-form>

      <div class="tips" v-if="ak.python?.akshareError">
        <p class="err-text">akshare 未安装：{{ ak.python.akshareError }}</p>
        <p>点上方「pip 安装 akshare」自动安装，或手动：<code>pip install akshare flask</code></p>
      </div>
      <div class="tips" v-else>
        <p>启用后，应用启动时自动拉起 aktools-server（端口 {{ ak.config.port }}），失败静默降级不影响其他源。</p>
      </div>
    </el-card>

    <!-- 通达信数据源 Key 多账号 -->
    <el-card class="setting-card" shadow="hover" v-loading="tdxLoading">
      <template #header>
        <div class="card-header">
          <span>通达信数据源（tqs Key 多账号）</span>
          <el-tag :type="tdx.keys.length > 0 ? 'success' : 'info'" size="small">
            {{ tdx.keys.length > 0 ? `${tdx.keys.length} 个 Key` : '未配置' }}
          </el-tag>
        </div>
      </template>

      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        通达信 tqs（tdxaidata）免客户端数据服务，Key 从通达信会员中心创建。多 Key 可添加后切换。
        活跃 Key 写入 TdxAiData.ini，切换后需重启数据服务生效。
      </el-alert>

      <el-descriptions :column="2" border size="small" class="mb-12">
        <el-descriptions-item label="活跃Key">{{ tdx.activeKey || '未配置' }}</el-descriptions-item>
        <el-descriptions-item label="通达信目录">{{ tdx.config?.installPath || '自动探测' }}</el-descriptions-item>
      </el-descriptions>

      <el-form :inline="true" class="add-form">
        <el-form-item label="名称">
          <el-input v-model="tdxKeyName" placeholder="如：主Key / 备用Key" style="width: 140px" />
        </el-form-item>
        <el-form-item label="Key">
          <el-input v-model="tdxKeyVal" type="password" show-password clearable placeholder="TDX-xxxxxxxx" style="width: 280px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="tdxAdding" @click="addTdxKey">添加 Key</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tdx.keys" size="small" border>
        <el-table-column prop="name" label="名称" min-width="100" />
        <el-table-column prop="keyMasked" label="Key" min-width="140" />
        <el-table-column label="启用" width="70" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" @change="toggleTdxKey(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" :loading="tdxTestingIds.has(row.id)" @click="testTdxKey(row)">测试</el-button>
            <el-button link type="success" size="small" @click="applyTdxKey(row)">应用为活跃</el-button>
            <el-button link type="danger" size="small" @click="removeTdxKey(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><span class="empty-tip">尚未添加 Key，从通达信会员中心创建数据服务 Key 后添加</span></template>
      </el-table>
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
.mb-12 { margin-bottom: 12px; }
.stat-ok { color: #67c23a; font-weight: 600; }
.stat-fail { color: #f56c6c; font-weight: 600; }
.err-text { color: #f56c6c; font-size: 12px; }
.empty-tip { color: #c9cdd4; font-size: 13px; }
.stats-line { margin-top: 10px; color: #86909c; font-size: 13px; }
.tips { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.8; }
.tips ul { padding-left: 20px; margin: 8px 0; }
.tips a { color: var(--el-color-primary); }
</style>
