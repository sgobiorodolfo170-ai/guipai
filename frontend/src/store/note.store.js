import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as noteService from '@/services/note.service'

export const useNoteStore = defineStore('note', () => {
  // 状态
  const notes = ref([])
  const currentNote = ref(null)
  const categories = ref([])
  const tags = ref([])
  const loading = ref(false)
  const searchResults = ref([])

  // 计算属性
  const notesByCategory = computed(() => {
    const grouped = {}
    
    categories.value.forEach(category => {
      grouped[category.id] = {
        ...category,
        notes: notes.value.filter(note => note.categoryId === category.id)
      }
    })
    
    // 未分类的笔记
    const uncategorized = notes.value.filter(note => !note.categoryId)
    if (uncategorized.length > 0) {
      grouped[0] = {
        id: 0,
        name: '未分类',
        notes: uncategorized
      }
    }
    
    return grouped
  })

  const recentNotes = computed(() => {
    return notes.value
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
  })

  // 获取笔记列表
  const fetchNoteList = async (params = {}) => {
    try {
      loading.value = true
      const response = await noteService.getNoteList(params)
      // 拦截器返回信封 {code,data,msg}，真实数据在 response.data
      notes.value = response.data?.list || response.data || []
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取笔记详情
  const fetchNoteDetail = async (id) => {
    try {
      loading.value = true
      const response = await noteService.getNoteDetail(id)
      currentNote.value = response.data || response
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建笔记
  const createNote = async (noteData) => {
    try {
      const response = await noteService.createNote(noteData)
      // 拦截器返回信封，真实数据在 response.data
      notes.value.unshift(response.data || response)
      return response
    } catch (error) {
      throw error
    }
  }

  // 更新笔记
  const updateNote = async (id, noteData) => {
    try {
      const response = await noteService.updateNote(id, noteData)
      const data = response.data || response
      // 更新本地状态
      const index = notes.value.findIndex(note => note.id === id)
      if (index !== -1) {
        notes.value[index] = { ...notes.value[index], ...data }
      }
      
      // 更新当前笔记
      if (currentNote.value && currentNote.value.id === id) {
        currentNote.value = { ...currentNote.value, ...data }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 删除笔记
  const deleteNote = async (id) => {
    try {
      await noteService.deleteNote(id)
      
      // 更新本地状态
      const index = notes.value.findIndex(note => note.id === id)
      if (index !== -1) {
        notes.value.splice(index, 1)
      }
      
      // 清空当前笔记
      if (currentNote.value && currentNote.value.id === id) {
        currentNote.value = null
      }
    } catch (error) {
      throw error
    }
  }

  // 获取笔记分类
  const fetchNoteCategories = async () => {
    try {
      const response = await noteService.getNoteCategories()
      categories.value = response.data || response || []
      return response
    } catch (error) {
      throw error
    }
  }

  // 创建笔记分类
  const createNoteCategory = async (categoryData) => {
    try {
      const response = await noteService.createNoteCategory(categoryData)
      categories.value.push(response.data || response)
      return response
    } catch (error) {
      throw error
    }
  }

  // 更新笔记分类
  const updateNoteCategory = async (id, categoryData) => {
    try {
      const response = await noteService.updateNoteCategory(id, categoryData)
      const data = response.data || response
      // 更新本地状态
      const index = categories.value.findIndex(category => category.id === id)
      if (index !== -1) {
        categories.value[index] = { ...categories.value[index], ...data }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 删除笔记分类
  const deleteNoteCategory = async (id) => {
    try {
      await noteService.deleteNoteCategory(id)
      
      // 更新本地状态
      const index = categories.value.findIndex(category => category.id === id)
      if (index !== -1) {
        categories.value.splice(index, 1)
      }
      
      // 将该分类下的笔记移到未分类
      notes.value.forEach(note => {
        if (note.categoryId === id) {
          note.categoryId = null
        }
      })
    } catch (error) {
      throw error
    }
  }

  // 搜索笔记
  const searchNotes = async (keyword) => {
    try {
      const response = await noteService.searchNotes(keyword)
      searchResults.value = response.data || response || []
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取笔记标签
  const fetchNoteTags = async () => {
    try {
      const response = await noteService.getNoteTags()
      tags.value = response.data || response || []
      return response
    } catch (error) {
      throw error
    }
  }

  // 上传附件
  const uploadAttachment = async (formData) => {
    try {
      const response = await noteService.uploadNoteAttachment(formData)
      return response
    } catch (error) {
      throw error
    }
  }

  // 清空搜索结果
  const clearSearchResults = () => {
    searchResults.value = []
  }

  // 设置当前笔记
  const setCurrentNote = (note) => {
    currentNote.value = note
  }

  // 根据分类获取笔记
  const getNotesByCategory = (categoryId) => {
    return notes.value.filter(note => note.categoryId === categoryId)
  }

  // 根据标签获取笔记
  const getNotesByTag = (tagName) => {
    return notes.value.filter(note => 
      note.tags && note.tags.includes(tagName)
    )
  }

  return {
    // 状态
    notes,
    currentNote,
    categories,
    tags,
    loading,
    searchResults,
    
    // 计算属性
    notesByCategory,
    recentNotes,
    
    // 方法
    fetchNoteList,
    fetchNoteDetail,
    createNote,
    updateNote,
    deleteNote,
    fetchNoteCategories,
    createNoteCategory,
    updateNoteCategory,
    deleteNoteCategory,
    searchNotes,
    fetchNoteTags,
    uploadAttachment,
    clearSearchResults,
    setCurrentNote,
    getNotesByCategory,
    getNotesByTag
  }
})