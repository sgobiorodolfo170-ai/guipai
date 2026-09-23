'use strict'

const MAP = new Map()

function set(key, value, ttlSeconds) {
  const expire = Date.now() + ttlSeconds * 1000
  MAP.set(key, { value, expire })
}

function get(key) {
  const entry = MAP.get(key)
  if (!entry) return null
  if (Date.now() > entry.expire) { MAP.delete(key); return null }
  return entry.value
}

function del(key) { MAP.delete(key) }

function delByPattern(pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  let count = 0
  for (const key of MAP.keys()) {
    if (regex.test(key)) { MAP.delete(key); count++ }
  }
  return count
}

function clear() { MAP.clear() }

module.exports = { set, get, del, delByPattern, clear }
