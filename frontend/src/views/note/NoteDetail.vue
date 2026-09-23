<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotes } from '@/composables/useNotes'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const { 
  loading,
  currentNote,
  categories,
  createNote,
  updateNote,
  fetchCategories
} = useNotes()

const isEdit = computed(() => route.query.mode === 'edit' || route.name === 'NoteCreate')
const isCreate = computed(() => route.name === 'NoteCreate')
const noteId = computed(() => route.params.id)

const noteForm = ref({
  title: '',
  content: '',
  categoryId: null,
  tags: [],
  isPublic: false
})

const tagInput = ref('')
const showTagInput = ref(false)

onMounted(async () => {
  await fetchCategories()
  
  if (!isCreate.value && noteId.value) {
    // 获取笔记详情
    // 这里应该调用 fetchNoteDetail，但为了简化，我们直接设置一些示例数据
    noteForm.value = {
      title: '示例笔记标题',
      content: '这是一个示例笔记内容...',
      categoryId: null,
      tags: ['股票分析', '复盘'],
      isPublic: false
    }
  }
})

const handleSave = async () => {
  if (!noteForm.value.title.trim()) {
    ElMessage.warning('请输入笔记标题')
    return
  }
  
  if (!noteForm.value.content.trim()) {
    ElMessage.warning('请输入笔记内容')
    return
  }
  
  try {
    if (isCreate.value) {
      await createNote(noteForm.value)
      ElMessage.success('笔记创建成功')
      router.push('/notes')
    } else {
      await updateNote(noteId.value, noteForm.value)
      ElMessage.success('笔记更新成功')
      router.push('/notes')
    }
  } catch (error) {
    console.error('保存笔记失败:', error)
  }
}

const handleCancel = () => {
  router.back()
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !noteForm.value.tags.includes(tag)) {
    noteForm.value.tags.push(tag)
    tagInput.value = ''
  }
  showTagInput.value = false
}

const removeTag = (tag) => {
  const index = noteForm.value.tags.indexOf(tag)
  if (index > -1) {
    noteForm.value.tags.splice(index, 1)
  }
}

import { nextTick } from 'vue'

const showAddTag = () => {
  showTagInput.value = true
  nextTick(() => {
    const input = document.querySelector('.tag-input input')
    if (input) input.focus()
  })
}
</script>

<template>
  <div class="note-detail">
    <div class="page-header">
      <h1 class="page-title">
        {{ isCreate ? '创建笔记' : isEdit ? '编辑笔记' : '笔记详情' }}
      </h1>
      <div class="page-actions">
        <el-button @click="handleCancel">
          {{ isEdit ? '取消' : '返回' }}
        </el-button>
        <el-button v-if="isEdit" type="primary" @click="handleSave" :loading="loading">
          保存
        </el-button>
        <el-button v-else type="primary" @click="$router.push(`/notes/${noteId}?mode=edit`)">
          编辑
        </el-button>
      </div>
    </div>
    
    <div class="note-content">
      <el-row :gutter="20">
        <!-- 主要内容区 -->
        <el-col :span="18">
          <el-card>
            <div v-if="isEdit" class="edit-mode">
              <!-- 标题输入 -->
              <el-input
                v-model="noteForm.title"
                placeholder="请输入笔记标题"
                size="large"
                class="title-input"
              />
              
              <!-- 内容编辑器 -->
              <div class="content-editor">
                <el-input
                  v-model="noteForm.content"
                  type="textarea"
                  placeholder="开始写下您的复盘心得..."
                  :rows="20"
                  resize="none"
                />
              </div>
            </div>
            
            <div v-else class="view-mode">
              <!-- 标题显示 -->
              <h1 class="note-title">{{ noteForm.title }}</h1>
              
              <!-- 内容显示 -->
              <div class="note-content-display">
                <pre>{{ noteForm.content }}</pre>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 侧边栏 -->
        <el-col :span="6">
          <el-card>
            <template #header>
              <span>笔记信息</span>
            </template>
            
            <div class="note-meta">
              <!-- 分类选择 -->
              <div class="meta-item">
                <label class="meta-label">分类</label>
                <el-select
                  v-if="isEdit"
                  v-model="noteForm.categoryId"
                  placeholder="选择分类"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
                <span v-else class="meta-value">
                  {{ categories.find(c => c.id === noteForm.categoryId)?.name || '未分类' }}
                </span>
              </div>
              
              <!-- 标签管理 -->
              <div class="meta-item">
                <label class="meta-label">标签</label>
                <div class="tags-container">
                  <el-tag
                    v-for="tag in noteForm.tags"
                    :key="tag"
                    :closable="isEdit"
                    @close="removeTag(tag)"
                    class="tag-item"
                  >
                    {{ tag }}
                  </el-tag>
                  
                  <el-input
                    v-if="showTagInput && isEdit"
                    v-model="tagInput"
                    size="small"
                    class="tag-input"
                    @keyup.enter="addTag"
                    @blur="addTag"
                  />
                  
                  <el-button
                    v-else-if="isEdit"
                    size="small"
                    @click="showAddTag"
                  >
                    + 添加标签
                  </el-button>
                </div>
              </div>
              
              <!-- 公开设置 -->
              <div class="meta-item" v-if="isEdit">
                <label class="meta-label">公开设置</label>
                <el-switch
                  v-model="noteForm.isPublic"
                  active-text="公开"
                  inactive-text="私有"
                />
              </div>
              
              <!-- 创建时间等信息 -->
              <div class="meta-item" v-if="!isCreate">
                <label class="meta-label">创建时间</label>
                <span class="meta-value">2024-01-15 10:30</span>
              </div>
              
              <div class="meta-item" v-if="!isCreate">
                <label class="meta-label">更新时间</label>
                <span class="meta-value">2024-01-15 15:45</span>
              </div>
            </div>
          </el-card>
          
          <!-- 快捷操作 -->
          <el-card class="quick-actions" v-if="!isEdit">
            <template #header>
              <span>快捷操作</span>
            </template>
            
            <div class="actions-list">
              <el-button type="primary" @click="$router.push(`/notes/${noteId}?mode=edit`)">
                <el-icon><Edit /></el-icon>
                编辑笔记
              </el-button>
              <el-button>
                <el-icon><Share /></el-icon>
                分享笔记
              </el-button>
              <el-button>
                <el-icon><Download /></el-icon>
                导出PDF
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.note-detail {
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

.title-input {
  margin-bottom: 20px;
}

.title-input :deep(.el-input__inner) {
  font-size: 20px;
  font-weight: 600;
  border: none;
  box-shadow: none;
  padding: 0;
}

.content-editor {
  min-height: 500px;
}

.content-editor :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
}

.note-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 16px;
}

.note-content-display {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.note-content-display pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-family: inherit;
}

.note-meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.meta-value {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 100px;
}

.quick-actions {
  margin-top: 20px;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions-list .el-button {
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .note-detail {
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
  
  .note-content :deep(.el-col) {
    width: 100%;
    margin-bottom: 20px;
  }
}
</style>