<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplates } from '@/composables/useTemplates'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { 
  loading,
  categories,
  createTemplate,
  updateTemplate,
  fetchCategories
} = useTemplates()

const isCreate = computed(() => route.name === 'TemplateCreate')
const templateId = computed(() => route.params.id)

const templateForm = ref({
  name: '',
  description: '',
  content: '',
  categoryId: null,
  isPublic: false,
  fields: []
})

// 模板字段类型
const fieldTypes = [
  { label: '文本输入', value: 'text' },
  { label: '多行文本', value: 'textarea' },
  { label: '数字输入', value: 'number' },
  { label: '日期选择', value: 'date' },
  { label: '单选框', value: 'radio' },
  { label: '多选框', value: 'checkbox' },
  { label: '下拉选择', value: 'select' }
]

const showFieldDialog = ref(false)
const editingField = ref(null)
const fieldForm = ref({
  label: '',
  key: '',
  type: 'text',
  required: false,
  placeholder: '',
  options: []
})

onMounted(async () => {
  await fetchCategories()
  
  if (!isCreate.value && templateId.value) {
    // 获取模板详情
    // 这里应该调用 fetchTemplateDetail，但为了简化，我们直接设置一些示例数据
    templateForm.value = {
      name: '示例分析模板',
      description: '这是一个示例分析模板',
      content: '# 股票分析模板\n\n## 基本信息\n股票代码：{{stockCode}}\n股票名称：{{stockName}}\n\n## 技术分析\n{{technicalAnalysis}}\n\n## 基本面分析\n{{fundamentalAnalysis}}',
      categoryId: null,
      isPublic: false,
      fields: [
        { label: '股票代码', key: 'stockCode', type: 'text', required: true },
        { label: '股票名称', key: 'stockName', type: 'text', required: true },
        { label: '技术分析', key: 'technicalAnalysis', type: 'textarea', required: false },
        { label: '基本面分析', key: 'fundamentalAnalysis', type: 'textarea', required: false }
      ]
    }
  }
})

const handleSave = async () => {
  if (!templateForm.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  
  if (!templateForm.value.content.trim()) {
    ElMessage.warning('请输入模板内容')
    return
  }
  
  try {
    if (isCreate.value) {
      await createTemplate(templateForm.value)
      ElMessage.success('模板创建成功')
      router.push('/templates')
    } else {
      await updateTemplate(templateId.value, templateForm.value)
      ElMessage.success('模板更新成功')
      router.push('/templates')
    }
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

const handleCancel = () => {
  router.back()
}

// 字段管理
const addField = () => {
  editingField.value = null
  fieldForm.value = {
    label: '',
    key: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: []
  }
  showFieldDialog.value = true
}

const editField = (field, index) => {
  editingField.value = index
  fieldForm.value = { ...field }
  showFieldDialog.value = true
}

const saveField = () => {
  if (!fieldForm.value.label.trim()) {
    ElMessage.warning('请输入字段标签')
    return
  }
  
  if (!fieldForm.value.key.trim()) {
    fieldForm.value.key = fieldForm.value.label.replace(/\s+/g, '')
  }
  
  if (editingField.value !== null) {
    // 编辑字段
    templateForm.value.fields[editingField.value] = { ...fieldForm.value }
  } else {
    // 添加字段
    templateForm.value.fields.push({ ...fieldForm.value })
  }
  
  showFieldDialog.value = false
}

const removeField = (index) => {
  templateForm.value.fields.splice(index, 1)
}

const moveField = (index, direction) => {
  const fields = templateForm.value.fields
  const newIndex = direction === 'up' ? index - 1 : index + 1
  
  if (newIndex >= 0 && newIndex < fields.length) {
    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]]
  }
}

import { nextTick } from 'vue'

// 插入字段变量
const insertVariable = (key) => {
  const variable = `{{${key}}}`
  const textarea = document.querySelector('.content-editor textarea')
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = templateForm.value.content
    
    templateForm.value.content = content.substring(0, start) + variable + content.substring(end)
    
    // 设置光标位置
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    })
  }
}
</script>

<template>
  <div class="template-edit">
    <div class="page-header">
      <h1 class="page-title">
        {{ isCreate ? '创建模板' : '编辑模板' }}
      </h1>
      <div class="page-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading">
          保存
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <!-- 主要编辑区 -->
      <el-col :span="16">
        <el-card>
          <div class="template-form">
            <!-- 基本信息 -->
            <div class="form-section">
              <h3>基本信息</h3>
              <el-form label-width="100px">
                <el-form-item label="模板名称" required>
                  <el-input
                    v-model="templateForm.name"
                    placeholder="请输入模板名称"
                  />
                </el-form-item>
                
                <el-form-item label="模板描述">
                  <el-input
                    v-model="templateForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入模板描述"
                  />
                </el-form-item>
                
                <el-form-item label="分类">
                  <el-select
                    v-model="templateForm.categoryId"
                    placeholder="选择分类"
                    clearable
                  >
                    <el-option
                      v-for="category in categories"
                      :key="category.id"
                      :label="category.name"
                      :value="category.id"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="公开设置">
                  <el-switch
                    v-model="templateForm.isPublic"
                    active-text="公开"
                    inactive-text="私有"
                  />
                </el-form-item>
              </el-form>
            </div>
            
            <!-- 模板内容 -->
            <div class="form-section">
              <h3>模板内容</h3>
              <div class="content-editor">
                <el-input
                  v-model="templateForm.content"
                  type="textarea"
                  :rows="15"
                  placeholder="请输入模板内容，使用 {{字段名}} 来插入动态字段"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 字段管理侧边栏 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>字段管理</span>
              <el-button size="small" type="primary" @click="addField">
                <el-icon><Plus /></el-icon>
                添加字段
              </el-button>
            </div>
          </template>
          
          <div class="fields-list">
            <div
              v-for="(field, index) in templateForm.fields"
              :key="index"
              class="field-item"
            >
              <div class="field-info">
                <div class="field-label">{{ field.label }}</div>
                <div class="field-meta">
                  <el-tag size="small" type="info">{{ field.type }}</el-tag>
                  <el-tag v-if="field.required" size="small" type="warning">必填</el-tag>
                </div>
              </div>
              
              <div class="field-actions">
                <el-button
                  size="small"
                  @click="insertVariable(field.key)"
                  title="插入变量"
                >
                  <el-icon><Position /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  @click="editField(field, index)"
                  title="编辑"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  @click="moveField(index, 'up')"
                  :disabled="index === 0"
                  title="上移"
                >
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  @click="moveField(index, 'down')"
                  :disabled="index === templateForm.fields.length - 1"
                  title="下移"
                >
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="removeField(index)"
                  title="删除"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            
            <el-empty v-if="templateForm.fields.length === 0" description="暂无字段" />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 字段编辑对话框 -->
    <el-dialog
      v-model="showFieldDialog"
      :title="editingField !== null ? '编辑字段' : '添加字段'"
      width="500px"
    >
      <el-form :model="fieldForm" label-width="100px">
        <el-form-item label="字段标签" required>
          <el-input v-model="fieldForm.label" placeholder="请输入字段标签" />
        </el-form-item>
        
        <el-form-item label="字段标识">
          <el-input v-model="fieldForm.key" placeholder="自动生成或手动输入" />
        </el-form-item>
        
        <el-form-item label="字段类型">
          <el-select v-model="fieldForm.type" style="width: 100%">
            <el-option
              v-for="type in fieldTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="占位符">
          <el-input v-model="fieldForm.placeholder" placeholder="请输入占位符文本" />
        </el-form-item>
        
        <el-form-item label="是否必填">
          <el-switch v-model="fieldForm.required" />
        </el-form-item>
        
        <el-form-item
          v-if="['radio', 'checkbox', 'select'].includes(fieldForm.type)"
          label="选项设置"
        >
          <div class="options-editor">
            <div
              v-for="(option, index) in fieldForm.options"
              :key="index"
              class="option-item"
            >
              <el-input v-model="fieldForm.options[index]" size="small" />
              <el-button
                size="small"
                type="danger"
                @click="fieldForm.options.splice(index, 1)"
              >
                删除
              </el-button>
            </div>
            <el-button size="small" @click="fieldForm.options.push('')">
              添加选项
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showFieldDialog = false">取消</el-button>
        <el-button type="primary" @click="saveField">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.template-edit {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-actions {
  display: flex;
  gap: 12px;
}

.template-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 8px;
}

.content-editor :deep(.el-textarea__inner) {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.field-info {
  margin-bottom: 8px;
}

.field-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.field-meta {
  display: flex;
  gap: 4px;
}

.field-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.field-actions .el-button {
  padding: 4px 8px;
}

.options-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 768px) {
  .template-edit {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .page-actions {
    justify-content: center;
  }
  
  .template-edit :deep(.el-col) {
    width: 100%;
    margin-bottom: 20px;
  }
}
</style>