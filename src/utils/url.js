/**
 * URL处理工具
 * 创建时间: 2025-10-28
 * 创建人: zzh
 */

/**
 * 获取完整的图片URL
 * @param {string} url - 图片URL（可以是相对路径或完整URL）
 * @returns {string} 完整的图片URL
 */
export function getFullImageUrl(url) {
  if (!url) return ''
  
  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }
  
  // 如果是相对路径，拼接图片基础URL
  // 优先使用 VITE_IMAGE_BASE_URL，如果没有则使用 VITE_API_BASE
  // 注意：如果后端返回的是 COS 完整链接（http开头），上面的逻辑已经处理了
  // 这里处理的是相对路径（如 /static/xxx.jpg）
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || import.meta.env.VITE_API_BASE || window.location.origin
  
  // 确保相对路径以斜杠开头
  const relativePath = url.startsWith('/') ? url : `/${url}`
  
  // 针对 /upload/mall/products/ 路径的特殊处理：
  // 如果是这种路径，说明是 COS 上的文件，但存的是相对路径
  // 需要拼接正确的 COS 域名（硬编码或从配置读取）
  if (relativePath.startsWith('/upload/mall/products/')) {
     // 这里使用腾讯云 COS 的基础域名
     return `https://xiaojia-1377837159.cos.ap-guangzhou.myqcloud.com${relativePath}`
  }
  
  return `${baseUrl}${relativePath}`
}

/**
 * 获取相对路径
 * @param {string} url - 完整URL
 * @returns {string} 相对路径
 */
export function getRelativePath(url) {
  if (!url) return ''
  
  // 如果是相对路径，直接返回
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url.startsWith('/') ? url : `/${url}`
  }
  
  // 从完整URL中提取相对路径
  const baseUrl = import.meta.env.VITE_API_BASE || window.location.origin
  
  if (url.startsWith(baseUrl)) {
    return url.substring(baseUrl.length)
  }
  
  // 如果URL不匹配基础URL，尝试提取路径部分
  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch {
    return url
  }
}

/**
 * 检查是否是相对路径
 * @param {string} url - URL
 * @returns {boolean} 是否是相对路径
 */
export function isRelativePath(url) {
  if (!url) return false
  return !url.startsWith('http://') && !url.startsWith('https://')
}

/**
 * 获取基础URL
 * @returns {string} 基础URL
 */
export function getBaseUrl() {
  return import.meta.env.VITE_API_BASE || window.location.origin
}