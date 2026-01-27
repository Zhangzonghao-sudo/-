/**
 * 审核模块API接口
 * 创建时间: 2025-09-02
 * 创建人: zzh
 */

import request from '@/utils/request'

export const reviewApi = {
  /**
   * 获取审核列表
   * 创建时间: 2025-09-02
   * 创建人: zzh
   */
  getReviews(params) {
    return request({
      url: '/api/review/list',
      method: 'get',
      params
    }).then(response => {
      // 后端直接返回数据，不需要额外包装
      return { data: response }
    })
  },

  /**
   * 获取审核详情
   * 创建时间: 2025-09-02
   * 创建人: zzh
   */
  getReviewDetail(reviewId) {
    return request({
      url: `/api/review/${reviewId}`,
      method: 'get'
    })
  },

  /**
   * 通过审核
   * 创建时间: 2025-09-02
   * 创建人: zzh
   */
  approveReview(reviewId, comment = '') {
    return request({
      url: `/api/review/${reviewId}/approve`,
      method: 'post',
      data: { comment }
    })
  },

  /**
   * 拒绝审核
   * 创建时间: 2025-09-02
   * 创建人: zzh
   */
  rejectReview(reviewId, comment) {
    return request({
      url: `/api/review/${reviewId}/reject`,
      method: 'post',
      data: { comment }
    })
  },

  /**
   * 获取审核统计信息
   * 创建时间: 2025-09-02
   * 创建人: zzh
   */
  getStats() {
    return request({
      url: '/api/review/stats',
      method: 'get'
    }).then(response => {
      // 后端直接返回数据，不需要额外包装
      return { data: response }
    })
  }
}