/**
 * 前端本地缓存工具（localStorage 封装）
 * 用于持久化复盘页等数据，避免每次打开都拉取实时数据，由用户点击刷新按钮手动更新。
 *
 * 设计说明：
 * - 选用 localStorage 而非 sessionStorage：需跨应用重启持久化（复盘数据应在关闭重开后仍可直出）
 * - JSON 序列化 { value, expireAt } 结构，支持可选 TTL（复盘数据默认不设 TTL，由用户手动刷新控制）
 * - 统一前缀 guipai: 避免与其他应用/库冲突
 */
const PREFIX = 'guipai:'

const cacheStorage = {
    /**
     * 读取缓存
     * @param {string} key 缓存键（不含前缀）
     * @param {number} [maxAgeSec] 可选：读取时校验最大存活秒数，超过则视为失效并清除
     * @returns {*} 命中则返回原值，未命中/已失效返回 null
     */
    get(key, maxAgeSec) {
        const raw = localStorage.getItem(PREFIX + key)
        if (!raw) return null
        try {
            const { value, expireAt, cachedAt } = JSON.parse(raw)
            // 写入时设定的 TTL 已过期
            if (expireAt && Date.now() > expireAt) {
                localStorage.removeItem(PREFIX + key)
                return null
            }
            // 读取时按 maxAge 校验（基于缓存写入时刻 cachedAt）
            if (maxAgeSec && cachedAt && Date.now() - cachedAt > maxAgeSec * 1000) {
                localStorage.removeItem(PREFIX + key)
                return null
            }
            return value
        } catch {
            // 解析失败（结构损坏）直接清除，避免脏数据反复报错
            localStorage.removeItem(PREFIX + key)
            return null
        }
    },

    /**
     * 写入缓存
     * @param {string} key 缓存键
     * @param {*} value 任意可序列化值
     * @param {number} [ttlSec] 可选存活秒数；不传则持久存储直到手动刷新/清除
     */
    set(key, value, ttlSec) {
        const expireAt = ttlSec ? Date.now() + ttlSec * 1000 : null
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify({ value, expireAt, cachedAt: Date.now() }))
            return true
        } catch (e) {
            // 多为 QuotaExceededError（超容量）：清除同前缀旧项后重试一次
            this.clearByPrefix('')
            try {
                localStorage.setItem(PREFIX + key, JSON.stringify({ value, expireAt, cachedAt: Date.now() }))
                return true
            } catch {
                console.error('缓存写入失败:', e)
                return false
            }
        }
    },

    /**
     * 移除单个缓存
     */
    remove(key) {
        localStorage.removeItem(PREFIX + key)
    },

    /**
     * 清除指定子前缀下的所有缓存（prefix 为空时清除全部 guipai: 缓存）
     */
    clearByPrefix(subPrefix) {
        const full = PREFIX + subPrefix
        const toRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.indexOf(full) === 0) toRemove.push(k)
        }
        toRemove.forEach(k => localStorage.removeItem(k))
    },

    /**
     * 是否存在缓存（不做时效校验，仅判断键是否存在）
     */
    has(key) {
        return localStorage.getItem(PREFIX + key) !== null
    }
}

export default cacheStorage
