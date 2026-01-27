import request from '@/utils/request'

export function getReports(params) {
  return request({
    url: '/api/admin/reports',
    method: 'get',
    params
  })
}

export function getReportDetail(id) {
  return request({
    url: `/api/admin/reports/${id}`,
    method: 'get'
  })
}

export function handleReport(id, data) {
  return request({
    url: `/api/admin/reports/${id}/handle`,
    method: 'post',
    data
  })
}
