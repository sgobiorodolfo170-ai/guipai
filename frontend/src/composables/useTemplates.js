import { ref, computed } from 'vue'
import { useTemplateStore } from '@/store/template.store'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useTemplates() {
  const templateStore = useTemplateStore()
  
  // 响应式数据
  const loading = ref(false)
  const error = ref(null)
  const searchKeyword = ref('')
  const selectedCategory = ref(null)
  
  // 计算属性
  const filteredTemplates = computed(() => {
    let templates = templateStore.templates
    
    // 按分类筛选
    if (selectedCategory.value) {
      templates = templates.filter(template => template.categoryId === selectedCategory.value)
    }
    
    // 按关键词搜索
    if (searchKeyword.value) {
      templates = templateStore.searchTemplates(searchKeyword.value)
    }
    
    return templates
  })
  
  const templateCount = computed(() => filteredTemplates.value.length)
  
  // 获取模板列表
  const fetchTemplates = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      await templateStore.fetchTemplateList(params)
    } catch (err) {
      error.value = err.message || '获取模板列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }
  
  // 创建模板
  const createTemplate = async (templateData) => {
    try {
      loading.value = true
      
      const response = await templateStore.createTemplate(templateData)
      ElMessage.success('模板创建成功')
      
      return response
    } catch (err) {
      const errorMsg = err.message || '创建模板失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 更新模板
  const updateTemplate = async (id, templateData) => {
    try {
      loading.value = true
      
      const response = await templateStore.updateTemplate(id, templateData)
      ElMessage.success('模板更新成功')
      
      return response
    } catch (err) {
      const errorMsg = err.message || '更新模板失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 删除模板
  const deleteTemplate = async (id, name = '') => {
    try {
      await ElMessageBox.confirm(
        `确定要删除模板"${name}"吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      loading.value = true
      await templateStore.deleteTemplate(id)
      ElMessage.success('模板删除成功')
      
    } catch (err) {
      if (err !== 'cancel') {
        const errorMsg = err.message || '删除模板失败'
        ElMessage.error(errorMsg)
        throw err
      }
    } finally {
      loading.value = false
    }
  }
  
  // 复制模板
  const copyTemplate = async (id, name = '') => {
    try {
      loading.value = true
      
      const response = await templateStore.copyTemplate(id)
      ElMessage.success(`模板"${name}"复制成功`)
      
      return response
    } catch (err) {
      const errorMsg = err.message || '复制模板失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 分享模板
  const shareTemplate = async (id, name = '') => {
    try {
      loading.value = true
      
      const response = await templateStore.shareTemplate(id)
      ElMessage.success(`模板"${name}"分享成功`)
      
      return response
    } catch (err) {
      const errorMsg = err.message || '分享模板失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 取消分享模板
  const unshareTemplate = async (id, name = '') => {
    try {
      await ElMessageBox.confirm(
        `确定要取消分享模板"${name}"吗？`,
        '取消分享确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      loading.value = true
      await templateStore.unshareTemplate(id)
      ElMessage.success('取消分享成功')
      
    } catch (err) {
      if (err !== 'cancel') {
        const errorMsg = err.message || '取消分享失败'
        ElMessage.error(errorMsg)
        throw err
      }
    } finally {
      loading.value = false
    }
  }
  
  // 使用模板创建笔记
  const createNoteFromTemplate = async (id, noteData) => {
    try {
      loading.value = true
      
      const response = await templateStore.createNoteFromTemplate(id, noteData)
      ElMessage.success('基于模板创建笔记成功')
      
      return response
    } catch (err) {
      const errorMsg = err.message || '创建笔记失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 获取分类
  const fetchCategories = async () => {
    try {
      await templateStore.fetchTemplateCategories()
    } catch (err) {
      ElMessage.error('获取分类失败')
    }
  }
  
  // 获取公共模板
  const fetchPublicTemplates = async (params = {}) => {
    try {
      loading.value = true
      
      await templateStore.fetchPublicTemplates(params)
    } catch (err) {
      ElMessage.error('获取公共模板失败')
    } finally {
      loading.value = false
    }
  }
  
  // 设置搜索关键词
  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }
  
  // 设置选中的分类
  const setSelectedCategory = (categoryId) => {
    selectedCategory.value = categoryId
  }
  
  // 清空筛选条件
  const clearFilters = () => {
    searchKeyword.value = ''
    selectedCategory.value = null
  }
  
  return {
    // 状态
    loading,
    error,
    searchKeyword,
    selectedCategory,
    
    // 计算属性
    filteredTemplates,
    templateCount,
    
    // Store数据
    templates: computed(() => templateStore.templates),
    currentTemplate: computed(() => templateStore.currentTemplate),
    categories: computed(() => templateStore.categories),
    publicTemplates: computed(() => templateStore.publicTemplates),
    myTemplates: computed(() => templateStore.myTemplates),
    sharedTemplates: computed(() => templateStore.sharedTemplates),
    templatesByCategory: computed(() => templateStore.templatesByCategory),
    
    // 方法
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    shareTemplate,
    unshareTemplate,
    createNoteFromTemplate,
    fetchCategories,
    fetchPublicTemplates,
    setSearchKeyword,
    setSelectedCategory,
    clearFilters
  }
}