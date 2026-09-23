<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplates } from '@/composables/useTemplates'
import { formatDate } from '@/utils/date'

const router = useRouter()
const {
  loading,
  filteredTemplates,
  categories,
  myTemplates,
  publicTemplates,
  searchKeyword,
  selectedCategory,
  fetchTemplates,
  fetchCategories,
  fetchPublicTemplates,
  deleteTemplate,
  copyTemplate,
  shareTemplate,
  setSearchKeyword,
  setSelectedCategory
} = useTemplates()

const activeTab = ref('my')

onMounted(() => {
  fetchTemplates()
  fetchCategories()
  fetchPublicTemplates()
})

const createTemplate = () => {
  router.push('/templates/create')
}

const editTemplate = (id) => {
  router.push(`/templates/${id}/edit`)
}

const handleTabChange = (tab) => {
  activeTab.value = tab
}

const handleSearch = () => {
  // 搜索逻辑在composable中处理
}

const handleCategoryChange = (categoryId) => {
  setSelectedCategory(categoryId)
}

const handleCopyTemplate = async (template) => {
  try {
    await copyTemplate(template.id, template.name)
  } catch (error) {
    console.error('复制模板失败:', error)
  }
}

const handleShareTemplate = async (template) => {
  try {
    await shareTemplate(template.id, template.name)
  } catch (error) {
    console.error('分享模板失败:', error)
  }
}

const handleDeleteTemplate = async (template) => {
  try {
    await deleteTemplate(template.id, template.name)
  } catch (error) {
    console.error('删除模板失败:', error)
  }
}
</script>

<template>
  <div class="template-list">
    <div class="page-header">
      <h1 class="page-title">分析模板</h1>
      <p class="page-description">创建和管理您的股票分析模板</p>
    </div>
    
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20" justify="space-between">
        <el-col :span="16">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索模板名称或描述"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="8">
              <el-select
                v-model="selectedCategory"
                placeholder="选择分类"
                clearable
                @change="handleCategoryChange"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-col>
          </el-row>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-button type="primary" @click="createTemplate">
            <el-icon><Plus /></el-icon>
            创建模板
          </el-button>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 标签页 -->
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="我的模板" name="my">
          <div class="templates-grid">
            <el-row :gutter="20" v-loading="loading">
              <el-col
                v-for="template in myTemplates"
                :key="template.id"
                :span="8"
                :md="8"
                :sm="12"
                :xs="24"
                class="template-col"
              >
                <el-card class="template-card">
                  <div class="template-header">
                    <h3 class="template-title">{{ template.name }}</h3>
                    <el-dropdown @command="(command) => {
                      if (command === 'edit') editTemplate(template.id)
                      else if (command === 'copy') handleCopyTemplate(template)
                      else if (command === 'share') handleShareTemplate(template)
                      else if (command === 'delete') handleDeleteTemplate(template)
                    }">
                      <el-button circle size="small">
                        <el-icon><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">编辑</el-dropdown-item>
                          <el-dropdown-item command="copy">复制</el-dropdown-item>
                          <el-dropdown-item command="share">分享</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                  
                  <div class="template-description">
                    {{ template.description || '暂无描述' }}
                  </div>
                  
                  <div class="template-meta">
                    <div class="template-stats">
                      <el-tag size="small" type="info">
                        {{ template.category?.name || '未分类' }}
                      </el-tag>
                      <span class="use-count">使用 {{ template.useCount || 0 }} 次</span>
                    </div>
                    <div class="template-date">
                      {{ formatDate(template.updatedAt) }}
                    </div>
                  </div>
                  
                  <div class="template-actions">
                    <el-button size="small" @click="editTemplate(template.id)">
                      编辑
                    </el-button>
                    <el-button size="small" type="primary">
                      使用模板
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 空状态 -->
            <el-empty v-if="!loading && myTemplates.length === 0" description="暂无模板" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="公共模板" name="public">
          <div class="templates-grid">
            <el-row :gutter="20" v-loading="loading">
              <el-col
                v-for="template in publicTemplates"
                :key="template.id"
                :span="8"
                :md="8"
                :sm="12"
                :xs="24"
                class="template-col"
              >
                <el-card class="template-card">
                  <div class="template-header">
                    <h3 class="template-title">{{ template.name }}</h3>
                    <el-button
                      circle
                      size="small"
                      @click="handleCopyTemplate(template)"
                    >
                      <el-icon><DocumentCopy /></el-icon>
                    </el-button>
                  </div>
                  
                  <div class="template-description">
                    {{ template.description || '暂无描述' }}
                  </div>
                  
                  <div class="template-meta">
                    <div class="template-stats">
                      <el-tag size="small" type="success">
                        {{ template.category?.name || '未分类' }}
                      </el-tag>
                      <span class="author">by {{ template.author?.username }}</span>
                    </div>
                    <div class="template-date">
                      {{ formatDate(template.createdAt) }}
                    </div>
                  </div>
                  
                  <div class="template-actions">
                    <el-button size="small" @click="handleCopyTemplate(template)">
                      复制
                    </el-button>
                    <el-button size="small" type="primary">
                      使用模板
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 空状态 -->
            <el-empty v-if="!loading && publicTemplates.length === 0" description="暂无公共模板" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.template-list {
  padding: 20px;
}

.toolbar-card {
  margin-bottom: 20px;
}

.templates-grid {
  margin-top: 20px;
}

.template-col {
  margin-bottom: 20px;
}

.template-card {
  height: 240px;
  display: flex;
  flex-direction: column;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.template-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-description {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  flex: 1;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.template-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.use-count,
.author {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.template-date {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.template-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .template-list {
    padding: 10px;
  }
  
  .template-card {
    height: auto;
    min-height: 220px;
  }
  
  .template-actions {
    justify-content: center;
  }
}
</style>