import request from '@/utils/request'

// 库存提醒API
const stockAlertApi = {
  // 获取低库存商品列表
  getLowStockProducts(params = {}) {
    return request({
      url: '/api/stock-alert/products',
      method: 'get',
      params: {
        page: params.page || 1,
        per_page: params.per_page || 20,
        keyword: params.keyword || '',
        threshold: params.threshold || 10  // 支持动态阈值
      }
    })
  },

  // 获取库存统计信息
  getStatistics(threshold = 10) {
    return request({
      url: '/api/stock-alert/statistics',
      method: 'get',
      params: {
        threshold: threshold  // 支持动态阈值
      }
    })
  },

  // 获取提醒数量
  getAlertCount(threshold = 10) {
    return request({
      url: '/api/stock-alert/alert-count',
      method: 'get',
      params: {
        threshold: threshold  // 支持动态阈值
      }
    })
  }
}

// 默认导出
export default stockAlertApi

// 命名导出
export { stockAlertApi }