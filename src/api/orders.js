import request from '@/utils/request'

export const orderAPI = {
  // 获取订单列表
  getOrders(params) {
    return request({
      url: '/api/mall/orders',
      method: 'get',
      params
    })
  },
  
  // 获取订单详情
  getOrderDetail(id) {
    return request({
      url: `/api/mall/orders/${id}`,
      method: 'get'
    })
  },
  
  // 取消订单
  cancelOrder(id, data) {
    return request({
      url: `/api/mall/orders/${id}/cancel`,
      method: 'post',
      data
    })
  },
  
  // 发货
  shipOrder(id, data) {
    // data: { tracking_number: string }
    return request({
      url: `/api/mall/orders/${id}/ship`,
      method: 'post',
      data
    })
  },

  // 标记妥投
  markDelivered(id, data = {}) {
    // data: { delivered_time?: string(ISO) }
    return request({
      url: `/api/mall/orders/${id}/mark-delivered`,
      method: 'post',
      data
    })
  },

  // 确认收货
  receiveOrder(id, data = {}) {
    // data: { received_time?: string(ISO) }
    return request({
      url: `/api/mall/orders/${id}/receive`,
      method: 'post',
      data
    })
  },

  // 更新收件地址（发货前）
  updateAddress(id, data) {
    // data: { receiver_name, receiver_phone, receiver_area, receiver_address }
    return request({
      url: `/api/mall/orders/${id}/address`,
      method: 'put',
      data
    })
  },

  // 更新订单备注
  updateRemark(id, data) {
    // data: { remark }
    return request({
      url: `/api/mall/orders/${id}/remark`,
      method: 'put',
      data
    })
  },

  // 手工更新状态（谨慎使用）
  updateStatus(id, data) {
    // data: { status }
    return request({
      url: `/api/mall/orders/${id}/status`,
      method: 'put',
      data
    })
  },
  
  // 获取订单统计数据
  getStatistics() {
    return request({
      url: '/api/mall/orders/statistics',
      method: 'get'
    })
  }
}
