// -*- coding: utf-8 -*-
/**
 * 资产管理路由配置
 * 创建时间: 2025-10-09
 * 创建人: zzh
 */

import AssetManagement from '@/views/AssetManagement.vue'

const assetRoutes = [
  {
    path: '/asset-management',
    name: 'AssetManagement',
    component: AssetManagement,
    meta: {
      title: '资产管理中心',
      requiresAuth: true,
      permissions: ['asset:view']
    }
  }
]

export default assetRoutes