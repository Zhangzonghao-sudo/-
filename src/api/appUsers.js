import request from '@/utils/request'

// APP用户管理API
export const appUserAPI = {
  // 获取APP用户列表
  getUsers(params) {
    return request({
      url: '/api/app-users/list',
      method: 'get',
      params
    })
  },

  // 获取APP用户详情
  getUserDetail(id) {
    return request({
      url: `/api/app-users/${id}`,
      method: 'get'
    })
  },

  // 创建APP用户
  createUser(data) {
    return request({
      url: '/api/app-users',
      method: 'post',
      data
    })
  },

  // 更新APP用户
  updateUser(id, data) {
    return request({
      url: `/api/app-users/${id}`,
      method: 'put',
      data
    })
  },

  // 删除APP用户
  deleteUser(id) {
    return request({
      url: `/api/app-users/${id}`,
      method: 'delete'
    })
  },

  // 获取APP用户统计数据
  getStatistics() {
    return request({
      url: '/api/app-users/statistics',
      method: 'get'
    })
  },

  // 切换用户验证状态
  toggleVerification(id) {
    return request({
      url: `/api/app-users/${id}/toggle-verification`,
      method: 'post'
    })
  },

  // 切换用户会员状态
  toggleMemberStatus(id) {
    return request({
      url: `/api/app-users/${id}/toggle-member`,
      method: 'post'
    })
  }
}