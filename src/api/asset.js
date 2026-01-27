// -*- coding: utf-8 -*-
/**
 * 资产管理API接口
 * 创建时间: 2025-10-09
 * 创建人: zzh
 */

import request from '@/utils/request'

/**
 * 获取资产流水记录
 * @param {Object} params - 查询参数
 */
export function getAssetRecords(params) {
  return request({
    url: '/api/assets/records',
    method: 'get',
    params
  })
}

/**
 * 获取资产汇总数据
 * @param {Object} params - 查询参数
 */
export function getAssetSummary(params) {
  return request({
    url: '/api/assets/summary',
    method: 'get',
    params
  })
}

/**
 * 获取总资产统计
 */
export function getTotalAssets() {
  return request({
    url: '/api/assets/total',
    method: 'get'
  })
}

/**
 * 获取操作类型统计
 * @param {Object} params - 查询参数，包含start_date和end_date
 */
export function getOperationStats(params) {
  return request({
    url: '/api/assets/operation-stats',
    method: 'get',
    params
  })
}

/**
 * 处理商城支付（WebSocket调用）
 * @param {Object} data - 支付数据
 */
export function handleMallPayment(data) {
  return request({
    url: '/api/assets/mall-payment',
    method: 'post',
    data
  })
}

/**
 * WebSocket通信测试
 * @param {Object} data - 测试数据
 */
export function websocketTest(data) {
  return request({
    url: '/api/assets/websocket-test',
    method: 'post',
    data
  })
}

/**
 * 导出资产记录
 * @param {Object} params - 导出参数
 */
export function exportAssetRecords(params) {
  return request({
    url: '/api/assets/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 公司充值
 * @param {Object} data - 充值数据
 */
export function companyRecharge(data) {
  return request({
    url: '/api/assets/company-recharge',
    method: 'post',
    data
  })
}

export default {
  getRecords: getAssetRecords,
  getSummary: getAssetSummary,
  getTotalAssets,
  getOperationStats,
  handleMallPayment,
  websocketTest,
  exportRecords: exportAssetRecords,
  companyRecharge
}