import request from '@/utils/request'

// 数据分析API
export const analyticsAPI = {
  // 仪表板概览
  getDashboardOverview() {
    return request({
      url: '/api/analytics/dashboard/overview',
      method: 'get'
    })
  },

  // 消息趋势
  getMessageTrend(params) {
    return request({
      url: '/api/analytics/dashboard/message-trend',
      method: 'get',
      params
    })
  },

  // 用户活跃度
  getUserActivity(params) {
    return request({
      url: '/api/analytics/dashboard/user-activity',
      method: 'get',
      params
    })
  },

  // 客服绩效
  getCSPerformance(params) {
    return request({
      url: '/api/analytics/dashboard/cs-performance',
      method: 'get',
      params
    })
  },

  // 文件分布
  getFileDistribution(params) {
    return request({
      url: '/api/analytics/dashboard/file-distribution',
      method: 'get',
      params
    })
  },

  // 会话持续时间
  getSessionDuration(params) {
    return request({
      url: '/api/analytics/dashboard/session-duration',
      method: 'get',
      params
    })
  },

  // 实时统计
  getRealtimeStats() {
    return request({
      url: '/api/analytics/dashboard/real-time-stats',
      method: 'get'
    })
  },

  // 告警信息
  getDashboardAlerts() {
    return request({
      url: '/api/analytics/dashboard/alerts',
      method: 'get'
    })
  },

  // 图表数据API
  charts: {
    // 折线图
    getLineChart(params) {
      return request({
        url: '/api/analytics/charts/line',
        method: 'get',
        params
      })
    },

    // 柱状图
    getBarChart(params) {
      return request({
        url: '/api/analytics/charts/bar',
        method: 'get',
        params
      })
    },

    // 饼图
    getPieChart(params) {
      return request({
        url: '/api/analytics/charts/pie',
        method: 'get',
        params
      })
    },

    // 热力图
    getHeatmapChart(params) {
      return request({
        url: '/api/analytics/charts/heatmap',
        method: 'get',
        params
      })
    },

    // 自定义图表
    createCustomChart(data) {
      return request({
        url: '/api/analytics/charts/custom',
        method: 'post',
        data
      })
    }
  },

  // 报表API
  reports: {
    // 获取报表模板
    getTemplates() {
      return request({
        url: '/api/analytics/reports/templates',
        method: 'get'
      })
    },

    // 生成报表
    generateReport(data) {
      return request({
        url: '/api/analytics/reports/generate',
        method: 'post',
        data
      })
    },

    // 导出报表
    exportReport(data) {
      return request({
        url: '/api/analytics/reports/export',
        method: 'post',
        data,
        responseType: 'blob'
      })
    },

    // 定时报表
    scheduleReport(data) {
      return request({
        url: '/api/analytics/reports/schedule',
        method: 'post',
        data
      })
    },

    // 报表历史
    getHistory(params) {
      return request({
        url: '/api/analytics/reports/history',
        method: 'get',
        params
      })
    }
  }
}

export default analyticsAPI
