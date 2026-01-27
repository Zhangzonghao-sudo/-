import { triggerRef } from 'vue'
import api from '@/utils/api'

// 全局缓存，避免页面切换导致重复请求
// Map<key, { url: string, expiresAt: number }>
const signedUrlCache = new Map()
const fetchingKeys = new Set() // 用于防止重复请求

// 规范化文件路径
const normalizeKey = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  
  // 处理 /api/chat/files/ 路径映射到 COS 路径
  if (path.includes('/api/chat/files/')) {
    const parts = path.split('/api/chat/files/')
    if (parts.length > 1) {
      const rest = parts[1]
      if (rest.startsWith('upload/')) return rest
      if (rest.startsWith('chat/')) return `upload/${rest}`
      return `upload/chat/${rest}`
    }
  }

  const p = path.startsWith('/') ? path.slice(1) : path
  
  // 确保 banners 路径指向 upload/banners/
  if (p.startsWith('banners/')) {
    return `upload/${p}`
  }
  
  return p.startsWith('uploads/') ? p.replace(/^uploads\//, 'upload/') : p
}

/**
 * 获取签名URL（带全局缓存）
 * @param {string} path - 文件路径
 * @param {Ref|Ref[]|Function} [triggerRefObj] - 可选：需要触发更新的 ref 对象、对象数组或回调函数
 * @returns {string} - 签名URL或空字符串
 */
export const getSignedUrl = (path, triggerRefObj = null) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  
  const key = normalizeKey(path)
  const now = Date.now()
  
  // 1. 检查缓存且未过期 (预留5分钟缓冲期)
  if (signedUrlCache.has(key)) {
    const cache = signedUrlCache.get(key)
    if (now < cache.expiresAt - 5 * 60 * 1000) {
      return cache.url
    } else {
      signedUrlCache.delete(key)
    }
  }

  // 2. 发起新请求
  if (!fetchingKeys.has(key)) {
    fetchingKeys.add(key)
    api.get('/api/admin/storage/signed-url', { params: { file_path: key, expires_in: 3600 } })
      .then(resp => {
        const payload = resp && resp.data ? resp.data : resp
        const url = (payload && payload.url) || (payload && payload.data && payload.data.url)
        if (url) {
          signedUrlCache.set(key, {
            url: url,
            expiresAt: now + 3600 * 1000
          })
          
          // 触发更新
          if (triggerRefObj) {
            if (typeof triggerRefObj === 'function') {
              triggerRefObj()
            } else {
              const refs = Array.isArray(triggerRefObj) ? triggerRefObj : [triggerRefObj]
              refs.forEach(r => r && triggerRef(r))
            }
          }
        }
      })
      .catch(err => {
        console.error('获取签名链接失败:', key, err)
      })
      .finally(() => {
        fetchingKeys.delete(key)
      })
  }
  
  return ''
}

/**
 * 清除所有缓存
 */
export const clearSignedUrlCache = () => {
  signedUrlCache.clear()
}
