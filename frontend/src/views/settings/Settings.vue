<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const token = ref('')
const configured = ref(false)
const saving = ref(false)
const message = ref('')

onMounted(async () => {
  try {
    const res = await api.get('/settings/tushare')
    configured.value = res.data?.configured || false
  } catch (e) {
    message.value = '获取配置状态失败: ' + (e.message || e)
  }
})

const handleSave = async () => {
  saving.value = true
  message.value = ''
  try {
    const res = await api.post('/settings/tushare', { token: token.value })
    configured.value = !!token.value
    message.value = res.msg || '保存成功'
    if (!token.value) message.value = 'token 已清除'
  } catch (e) {
    message.value = '保存失败: ' + (e.message || e)
  } finally {
    saving.value = false
  }
}

const handleClear = async () => {
  token.value = ''
  await handleSave()
}
</script>

<template>
  <div class="settings-page">
    <h2>设置</h2>

    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Tushare 数据源配置</span>
          <el-tag :type="configured ? 'success' : 'info'" size="small">
            {{ configured ? '已配置' : '未配置' }}
          </el-tag>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        Tushare 作为东财接口限流时的兜底数据源。配置 token 后，当东财涨停池/跌停池接口失败（限流/超时）时，
        自动从 Tushare limit_list_d 接口获取数据，保证涨跌停统计功能持续可用。
      </el-alert>

      <el-form label-width="120px">
        <el-form-item label="Tushare Token">
          <el-input
            v-model="token"
            type="password"
            show-password
            placeholder="输入 Tushare Pro token（可在 tushare.pro 注册获取）"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存
          </el-button>
          <el-button v-if="configured" @click="handleClear" :disabled="saving">
            清除
          </el-button>
        </el-form-item>

        <el-form-item v-if="message">
          <el-text :type="message.includes('失败') ? 'danger' : 'success'">
            {{ message }}
          </el-text>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="tips">
        <p><strong>说明：</strong></p>
        <ul>
          <li>Token 保存在本地（settings.json），不上传任何服务器。</li>
          <li>Tushare Pro 注册地址：<a href="https://tushare.pro" target="_blank">tushare.pro</a></li>
          <li>limit_list_d 接口需要一定积分（免费注册通常够用）。</li>
          <li>兜底数据相比东财直连可能缺少部分字段（成交额/市值/换手率/行业），核心统计（涨停数/连板/封板时间/炸板）不受影响。</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
}

.setting-card {
  margin-top: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tips {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.8;
}

.tips ul {
  padding-left: 20px;
  margin: 8px 0;
}

.tips a {
  color: var(--el-color-primary);
}
</style>
