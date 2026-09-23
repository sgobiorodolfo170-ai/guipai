import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: false
})

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

api.interceptors.request.use(
  config => {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    const { data } = response
    if (data.code === 200) {
      return data
    } else {
      const errorMsg = data.msg || data.message || '请求失败'
      ElMessage.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }
  },
  async error => {
    const config = error.config || {}
    const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED')

    if (isNetworkError && (config.__retryCount || 0) < MAX_RETRIES) {
      config.__retryCount = (config.__retryCount || 0) + 1
      await new Promise(r => setTimeout(r, RETRY_DELAY))
      return api(config)
    }

    let message = '网络错误'
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = data?.msg || data?.message || `连接错误${status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (isNetworkError) {
      message = '无法连接本地服务，请稍后重试'
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default api
