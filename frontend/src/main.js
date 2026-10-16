import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import '@/assets/styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

// 全局错误兜底：捕获 Vue 渲染/生命周期错误 + window 未捕获错误 + Promise 未处理拒绝
// 设计理由：项目此前无任何错误边界，任一组件渲染抛错会让整页 #app 渲染为空，
// 叠加 Electron 窗口深色背景(#0d1117)表现为「间歇性黑屏」。此处集中上报，
// 控制台可见、并转发到主进程写入 renderer-error.log，便于定位根因。
function reportError(type, err, extra) {
  const payload = {
    type,
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : '',
    extra: extra || {},
    time: new Date().toISOString(),
    href: typeof location !== 'undefined' ? location.href : ''
  }
  console.error(`[gp-error:${type}]`, err, extra || '')
  try {
    const w = window
    if (w.tradeinsight && typeof w.tradeinsight.logError === 'function') {
      w.tradeinsight.logError(payload)
    }
  } catch (_) { /* 上报失败静默 */ }
}

app.config.errorHandler = (err, _instance, info) => reportError('vue', err, { info })
window.addEventListener('error', (ev) => reportError('window', ev.error || ev.message, { filename: ev.filename, lineno: ev.lineno, colno: ev.colno }))
window.addEventListener('unhandledrejection', (ev) => reportError('promise', ev.reason))

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')
