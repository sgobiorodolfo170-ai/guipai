import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as noteService from '@/services/note.service'

/**
 * 股票笔记 store —— sql.js 本地库，本地持久化（无远程后端）。
 * 浮动盈亏不落库：由 useNotes 取现价后补算到 note._floatingPnl。
 */
export const useNoteStore = defineStore('note', () => {
  const notes = ref([])
  const currentNote = ref(null)
  const tags = ref([])
  const stocks = ref([])   // 去重股票代码下拉
  const summary = ref(null)
  const loading = ref(false)
  const total = ref(0)

  const recentNotes = computed(() =>
    notes.value.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10)
  )

  // ---- 列表 ----
  const fetchNoteList = async (params = {}) => {
    try {
      loading.value = true
      const res = await noteService.getNoteList(params)
      notes.value = res.data?.list || []
      total.value = res.data?.total || 0
      return res
    } finally { loading.value = false }
  }

  const fetchNoteDetail = async (id) => {
    try {
      loading.value = true
      const res = await noteService.getNoteDetail(id)
      currentNote.value = res.data || null
      return res
    } finally { loading.value = false }
  }

  const createNote = async (noteData) => {
    const res = await noteService.createNote(noteData)
    notes.value.unshift(res.data)
    return res
  }

  const updateNote = async (id, noteData) => {
    const res = await noteService.updateNote(id, noteData)
    const data = res.data
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value[idx] = { ...notes.value[idx], ...data }
    if (currentNote.value?.id === id) currentNote.value = { ...currentNote.value, ...data }
    return res
  }

  const deleteNote = async (id) => {
    await noteService.deleteNote(id)
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value.splice(idx, 1)
    if (currentNote.value?.id === id) currentNote.value = null
  }

  const fetchStocks = async () => {
    const res = await noteService.getNoteStocks()
    stocks.value = res.data || []
  }

  const fetchTags = async () => {
    const res = await noteService.getNoteTags()
    tags.value = res.data || []
  }

  const fetchSummary = async () => {
    const res = await noteService.getNoteSummary()
    summary.value = res.data || null
  }

  const exportNote = async (id) => {
    const res = await noteService.exportNote(id)
    return res.data
  }

  // ---- 提醒 ----
  const fetchAlerts = async (noteId) => {
    const res = await noteService.getNoteAlerts(noteId)
    return res.data || []
  }
  const createAlert = async (noteId, alertData) => {
    const res = await noteService.createNoteAlert(noteId, alertData)
    if (currentNote.value?.id === noteId) {
      currentNote.value.alerts = [...(currentNote.value.alerts || []), res.data]
    }
    return res
  }
  const updateAlert = async (noteId, alertId, alertData) => {
    const res = await noteService.updateNoteAlert(noteId, alertId, alertData)
    if (currentNote.value?.id === noteId) {
      const arr = currentNote.value.alerts || []
      const i = arr.findIndex(a => a.id === alertId)
      if (i !== -1) arr[i] = { ...arr[i], ...res.data }
    }
    return res
  }
  const deleteAlert = async (noteId, alertId) => {
    await noteService.deleteNoteAlert(noteId, alertId)
    if (currentNote.value?.id === noteId) {
      currentNote.value.alerts = (currentNote.value.alerts || []).filter(a => a.id !== alertId)
    }
  }
  const checkAlerts = async () => {
    const res = await noteService.checkAlerts()
    return res.data || { due: [], price: [] }
  }

  const setCurrentNote = (note) => { currentNote.value = note }

  return {
    notes, currentNote, tags, stocks, summary, loading, total,
    recentNotes,
    fetchNoteList, fetchNoteDetail, createNote, updateNote, deleteNote,
    fetchStocks, fetchTags, fetchSummary, exportNote,
    fetchAlerts, createAlert, updateAlert, deleteAlert, checkAlerts,
    setCurrentNote
  }
})
