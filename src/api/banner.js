import request from '@/utils/request'

export const bannerApi = {
  // 获取轮播图列表
  getBanners(params = {}) {
    return request({
      url: '/api/public/banners',
      method: 'get',
      params
    })
  },

  // 获取单个轮播图
  getBanner(id) {
    return request({
      url: `/api/public/banners/${id}`,
      method: 'get'
    })
  },

  // 创建轮播图
  createBanner(data) {
    return request({
      url: '/api/public/banners',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 更新轮播图
  updateBanner(id, data) {
    return request({
      url: `/api/public/banners/${id}`,
      method: 'put',
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除轮播图
  deleteBanner(id) {
    return request({
      url: `/api/public/banners/${id}`,
      method: 'delete'
    })
  },

  // 切换状态
  toggleStatus(id) {
    return request({
      url: `/api/public/banners/${id}/status`,
      method: 'put'
    })
  },

  // 批量更新排序
  updateSort(banners) {
    return request({
      url: '/api/public/banners/sort',
      method: 'put',
      data: { banners }
    })
  },

  // 获取启用的轮播图
  getActiveBanners() {
    return request({
      url: '/api/public/banners/active',
      method: 'get'
    })
  },

  // 获取统计信息
  getStatistics() {
    return request({
      url: '/api/public/banners/statistics',
      method: 'get'
    })
  },

  // 手动刷新App
  refreshApp() {
    return request({
      url: '/api/public/banners/admin/refresh',
      method: 'post',
      data: {
        action: "refresh",
        timestamp: Math.floor(Date.now() / 1000),
        operator: "admin_user"
      }
    })
  }
}
