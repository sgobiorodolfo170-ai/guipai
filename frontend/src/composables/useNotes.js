import { ref, computed, watch } from 'vue'
import { useNoteStore } from '@/store/note.store'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useNotes() {
  const noteStore = useNoteStore()
  
  // 响应式数据
  const loading = ref(false)
  const error = ref(null)
  const searchKeyword = ref('')
  const selectedCategory = ref(null)
  const selectedTags = ref([])
  
  // 计算属性
  const filteredNotes = computed(() => {
    let notes = noteStore.notes
    
    // 按分类筛选
    if (selectedCategory.value) {
      notes = notes.filter(note => note.categoryId === selectedCategory.value)
    }
    
    // 按标签筛选
    if (selectedTags.value.length > 0) {
      notes = notes.filter(note => 
        note.tags && selectedTags.value.some(tag => note.tags.includes(tag))
      )
    }
    
    // 按关键词搜索
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      notes = notes.filter(note => 
        note.title.toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword)
      )
    }
    
    return notes
  })
  
  const noteCount = computed(() => filteredNotes.value.length)
  
  // 获取笔记列表
  const fetchNotes = async (params = {}) => {
    try {
      loading.value = true
      error.value = null
      
      await noteStore.fetchNoteList(params)
    } catch (err) {
      error.value = err.message || '获取笔记列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }
  
  // 创建笔记
  const createNote = async (noteData) => {
    try {
      loading.value = true
      
      const response = await noteStore.createNote(noteData)
      ElMessage.success('笔记创建成功')
      
      return response
    } catch (err) {
      const errorMsg = err.message || '创建笔记失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 更新笔记
  const updateNote = async (id, noteData) => {
    try {
      loading.value = true
      
      const response = await noteStore.updateNote(id, noteData)
      ElMessage.success('笔记更新成功')
      
      return response
    } catch (err) {
      const errorMsg = err.message || '更新笔记失败'
      ElMessage.error(errorMsg)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 删除笔记
  const deleteNote = async (id, title = '') => {
    try {
      await ElMessageBox.confirm(
        `确定要删除笔记"${title}"吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      loading.value = true
      await noteStore.deleteNote(id)
      ElMessage.success('笔记删除成功')
      
    } catch (err) {
      if (err !== 'cancel') {
        const errorMsg = err.message || '删除笔记失败'
        ElMessage.error(errorMsg)
        throw err
      }
    } finally {
      loading.value = false
    }
  }
  
  // 搜索笔记
  const searchNotes = async (keyword) => {
    try {
      loading.value = true
      
      if (keyword) {
        await noteStore.searchNotes(keyword)
      } else {
        noteStore.clearSearchResults()
      }
    } catch (err) {
      const errorMsg = err.message || '搜索笔记失败'
      ElMessage.error(errorMsg)
    } finally {
      loading.value = false
    }
  }
  
  // 获取分类
  const fetchCategories = async () => {
    try {
      await noteStore.fetchNoteCategories()
    } catch (err) {
      ElMessage.error('获取分类失败')
    }
  }
  
  // 创建分类
  const createCategory = async (categoryData) => {
    try {
      const response = await noteStore.createNoteCategory(categoryData)
      ElMessage.success('分类创建成功')
      return response
    } catch (err) {
      ElMessage.error('创建分类失败')
      throw err
    }
  }
  
  // 上传附件
  const uploadAttachment = async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await noteStore.uploadAttachment(formData)
      ElMessage.success('文件上传成功')
      
      return response
    } catch (err) {
      ElMessage.error('文件上传失败')
      throw err
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
  
  // 设置选中的标签
  const setSelectedTags = (tags) => {
    selectedTags.value = tags
  }
  
  // 清空筛选条件
  const clearFilters = () => {
    searchKeyword.value = ''
    selectedCategory.value = null
    selectedTags.value = []
  }
  
  // 监听搜索关键词变化
  watch(searchKeyword, (newKeyword) => {
    if (newKeyword) {
      searchNotes(newKeyword)
    } else {
      noteStore.clearSearchResults()
    }
  })
  
  return {
    // 状态
    loading,
    error,
    searchKeyword,
    selectedCategory,
    selectedTags,
    
    // 计算属性
    filteredNotes,
    noteCount,
    
    // Store数据
    notes: computed(() => noteStore.notes),
    currentNote: computed(() => noteStore.currentNote),
    categories: computed(() => noteStore.categories),
    tags: computed(() => noteStore.tags),
    searchResults: computed(() => noteStore.searchResults),
    recentNotes: computed(() => noteStore.recentNotes),
    
    // 方法
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    fetchCategories,
    createCategory,
    uploadAttachment,
    setSearchKeyword,
    setSelectedCategory,
    setSelectedTags,
    clearFilters
  }
}