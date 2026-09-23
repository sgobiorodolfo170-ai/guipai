import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as templateService from '@/services/template.service'

export const useTemplateStore = defineStore('template', () => {
  // 状态
  const templates = ref([])
  const currentTemplate = ref(null)
  const categories = ref([])
  const publicTemplates = ref([])
  const loading = ref(false)

  // 计算属性
  const templatesByCategory = computed(() => {
    const grouped = {}
    
    categories.value.forEach(category => {
      grouped[category.id] = {
        ...category,
        templates: templates.value.filter(template => template.categoryId === category.id)
      }
    })
    
    // 未分类的模板
    const uncategorized = templates.value.filter(template => !template.categoryId)
    if (uncategorized.length > 0) {
      grouped[0] = {
        id: 0,
        name: '未分类',
        templates: uncategorized
      }
    }
    
    return grouped
  })

  const myTemplates = computed(() => {
    return templates.value.filter(template => template.isOwner)
  })

  const sharedTemplates = computed(() => {
    return templates.value.filter(template => template.isShared && !template.isOwner)
  })

  // 获取模板列表
  const fetchTemplateList = async (params = {}) => {
    try {
      loading.value = true
      const response = await templateService.getTemplateList(params)
      templates.value = response.list || response
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取模板详情
  const fetchTemplateDetail = async (id) => {
    try {
      loading.value = true
      const response = await templateService.getTemplateDetail(id)
      currentTemplate.value = response
      return response
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建模板
  const createTemplate = async (templateData) => {
    try {
      const response = await templateService.createTemplate(templateData)
      templates.value.unshift(response)
      return response
    } catch (error) {
      throw error
    }
  }

  // 更新模板
  const updateTemplate = async (id, templateData) => {
    try {
      const response = await templateService.updateTemplate(id, templateData)
      
      // 更新本地状态
      const index = templates.value.findIndex(template => template.id === id)
      if (index !== -1) {
        templates.value[index] = { ...templates.value[index], ...response }
      }
      
      // 更新当前模板
      if (currentTemplate.value && currentTemplate.value.id === id) {
        currentTemplate.value = { ...currentTemplate.value, ...response }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 删除模板
  const deleteTemplate = async (id) => {
    try {
      await templateService.deleteTemplate(id)
      
      // 更新本地状态
      const index = templates.value.findIndex(template => template.id === id)
      if (index !== -1) {
        templates.value.splice(index, 1)
      }
      
      // 清空当前模板
      if (currentTemplate.value && currentTemplate.value.id === id) {
        currentTemplate.value = null
      }
    } catch (error) {
      throw error
    }
  }

  // 复制模板
  const copyTemplate = async (id) => {
    try {
      const response = await templateService.copyTemplate(id)
      templates.value.unshift(response)
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取模板分类
  const fetchTemplateCategories = async () => {
    try {
      const response = await templateService.getTemplateCategories()
      categories.value = response
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取公共模板
  const fetchPublicTemplates = async (params = {}) => {
    try {
      const response = await templateService.getPublicTemplates(params)
      publicTemplates.value = response.list || response
      return response
    } catch (error) {
      throw error
    }
  }

  // 分享模板
  const shareTemplate = async (id) => {
    try {
      const response = await templateService.shareTemplate(id)
      
      // 更新本地状态
      const template = templates.value.find(t => t.id === id)
      if (template) {
        template.isShared = true
        template.shareCode = response.shareCode
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // 取消分享模板
  const unshareTemplate = async (id) => {
    try {
      await templateService.unshareTemplate(id)
      
      // 更新本地状态
      const template = templates.value.find(t => t.id === id)
      if (template) {
        template.isShared = false
        template.shareCode = null
      }
    } catch (error) {
      throw error
    }
  }

  // 使用模板创建笔记
  const createNoteFromTemplate = async (id, noteData) => {
    try {
      const response = await templateService.createNoteFromTemplate(id, noteData)
      return response
    } catch (error) {
      throw error
    }
  }

  // 设置当前模板
  const setCurrentTemplate = (template) => {
    currentTemplate.value = template
  }

  // 根据分类获取模板
  const getTemplatesByCategory = (categoryId) => {
    return templates.value.filter(template => template.categoryId === categoryId)
  }

  // 搜索模板
  const searchTemplates = (keyword) => {
    if (!keyword) return templates.value
    
    return templates.value.filter(template => 
      template.name.toLowerCase().includes(keyword.toLowerCase()) ||
      template.description?.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  return {
    // 状态
    templates,
    currentTemplate,
    categories,
    publicTemplates,
    loading,
    
    // 计算属性
    templatesByCategory,
    myTemplates,
    sharedTemplates,
    
    // 方法
    fetchTemplateList,
    fetchTemplateDetail,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    copyTemplate,
    fetchTemplateCategories,
    fetchPublicTemplates,
    shareTemplate,
    unshareTemplate,
    createNoteFromTemplate,
    setCurrentTemplate,
    getTemplatesByCategory,
    searchTemplates
  }
})