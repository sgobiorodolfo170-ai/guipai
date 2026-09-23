<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotes } from '@/composables/useNotes'
import { formatDate } from '@/utils/date'

const router = useRouter()
const {
  loading,
  filteredNotes,
  categories,
  searchKeyword,
  selectedCategory,
  fetchNotes,
  fetchCategories,
  deleteNote,
  setSearchKeyword,
  setSelectedCategory
} = useNotes()

const viewMode = ref('list') // 'list' | 'grid'

onMounted(() => {
  fetchNotes()
  fetchCategories()
})

const createNote = () => {
  router.push('/notes/create')
}

const viewNote = (id) => {
  router.push(`/notes/${id}`)
}

const editNote = (id) => {
  router.push(`/notes/${id}?mode=edit`)
}

const handleSearch = () => {
  // 搜索逻辑在composable中自动处理
}

const handleCategoryChange = (categoryId) => {
  setSelectedCategory(categoryId)
}
</script>

<template>
  <div class="note-list">
    <div class="page-header">
      <h1 class="page-title">复盘笔记</h1>
      <p class="page-description">记录您的股票分析和投资心得</p>
    </div>
    
    <!-- 工具栏 -->
    <el-card class="toolbar-card">
      <el-row :gutter="20" justify="space-between">
        <el-col :span="16">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索笔记标题或内容"
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
            <el-col :span="4">
              <el-button-group>
                <el-button
                  :type="viewMode === 'list' ? 'primary' : ''"
                  @click="viewMode = 'list'"
                >
                  <el-icon><List /></el-icon>
                </el-button>
                <el-button
                  :type="viewMode === 'grid' ? 'primary' : ''"
                  @click="viewMode = 'grid'"
                >
                  <el-icon><Grid /></el-icon>
                </el-button>
              </el-button-group>
            </el-col>
          </el-row>
        </el-col>
        <el-col :span="8" class="text-right">
          <el-button type="primary" @click="createNote">
            <el-icon><EditPen /></el-icon>
            写笔记
          </el-button>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 列表视图 -->
    <el-card v-if="viewMode === 'list'">
      <el-table :data="filteredNotes" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <el-link @click="viewNote(row.id)" :underline="false">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" size="small">
              {{ row.category.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag"
              size="small"
              type="info"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewNote(row.id)">
              查看
            </el-button>
            <el-button size="small" @click="editNote(row.id)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteNote(row.id, row.title)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredNotes.length === 0" description="暂无笔记" />
    </el-card>
    
    <!-- 网格视图 -->
    <div v-else class="notes-grid">
      <el-row :gutter="20" v-loading="loading">
        <el-col
          v-for="note in filteredNotes"
          :key="note.id"
          :span="8"
          :md="8"
          :sm="12"
          :xs="24"
          class="note-col"
        >
          <el-card class="note-card" @click="viewNote(note.id)">
            <div class="note-header">
              <h3 class="note-title">{{ note.title }}</h3>
              <el-dropdown @command="(command) => command === 'edit' ? editNote(note.id) : deleteNote(note.id, note.title)">
                <el-button circle size="small" @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="note-content">
              {{ note.summary || note.content?.substring(0, 100) + '...' }}
            </div>
            
            <div class="note-meta">
              <div class="note-tags">
                <el-tag
                  v-for="tag in note.tags?.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div class="note-date">
                {{ formatDate(note.updatedAt) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredNotes.length === 0" description="暂无笔记" />
    </div>
  </div>
</template>

<style scoped>
.note-list {
  padding: 20px;
}

.toolbar-card {
  margin-bottom: 20px;
}

.tag-item {
  margin-right: 4px;
}

.notes-grid {
  margin-top: 20px;
}

.note-col {
  margin-bottom: 20px;
}

.note-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 200px;
}

.note-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.note-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-content {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.note-date {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 768px) {
  .note-list {
    padding: 10px;
  }
  
  .note-card {
    height: auto;
    min-height: 180px;
  }
}
</style>