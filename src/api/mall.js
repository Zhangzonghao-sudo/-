/**
 * 商城管理API接口
 * 创建时间: 2024-01-01
 * 创建人: zzh
 */
import request from '@/utils/request'

// 分类管理API
export const categoryAPI = {
  // 获取分类列表
  getCategories(params = {}) {
    return request({
      url: '/api/mall/categories',
      method: 'get',
      params
    })
  },

  // 创建分类
  createCategory(data) {
    return request({
      url: '/api/mall/categories',
      method: 'post',
      data
    })
  },

  // 更新分类
  updateCategory(id, data) {
    return request({
      url: `/api/mall/categories/${id}`,
      method: 'put',
      data
    })
  },

  // 删除分类
  deleteCategory(id) {
    return request({
      url: `/api/mall/categories/${id}`,
      method: 'delete'
    })
  },

  // 切换分类状态
  toggleCategoryStatus(id) {
    return request({
      url: `/api/mall/categories/${id}/toggle`,
      method: 'post'
    })
  },

  // 搜索分类
  searchCategories(params) {
    return request({
      url: '/api/mall/categories/search',
      method: 'get',
      params
    })
  }
}

// 商品管理API
export const productAPI = {
  // 获取商品列表
  getProducts(params) {
    return request({
      url: '/api/mall/products',
      method: 'get',
      params
    })
  },

  // 创建商品
  createProduct(data) {
    return request({
      url: '/api/mall/products',
      method: 'post',
      data
    })
  },

  // 更新商品
  updateProduct(id, data) {
    return request({
      url: `/api/mall/products/${id}`,
      method: 'put',
      data
    })
  },

  // 删除商品
  deleteProduct(id) {
    return request({
      url: `/api/mall/products/${id}`,
      method: 'delete'
    })
  },

  // 切换商品状态
  toggleProductStatus(id) {
    return request({
      url: `/api/mall/products/${id}/toggle`,
      method: 'post'
    })
  },

  // 切换商品置顶状态
  toggleProductTop(id) {
    return request({
      url: `/api/mall/products/${id}/toggle-top`,
      method: 'post'
    })
  },

  // 获取单个商品详情
  getProduct(id) {
    return request({
      url: `/api/mall/products/${id}`,
      method: 'get'
    })
  },

  // 获取商品规格列表
  getProductSpecs(productId) {
    return request({
      url: `/api/mall/products/${productId}/specs`,
      method: 'get'
    })
  },

  // 创建商品规格
  createProductSpec(productId, data) {
    return request({
      url: `/api/mall/products/${productId}/specs`,
      method: 'post',
      data
    })
  },

  // 更新商品规格
  updateProductSpec(id, data) {
    return request({
      url: `/api/mall/specs/${id}`,
      method: 'put',
      data
    })
  },

  // 删除商品规格
  deleteProductSpec(id) {
    return request({
      url: `/api/mall/specs/${id}`,
      method: 'delete'
    })
  },

  // 获取单个商品规格
  getProductSpec(id) {
    return request({
      url: `/api/mall/specs/${id}`,
      method: 'get'
    })
  },

  // 更新规格库存
  updateSpecStock(id, data) {
    return request({
      url: `/api/mall/specs/${id}/stock`,
      method: 'put',
      data
    })
  }
}

// 图片上传API
export const uploadAPI = {
  // 上传图片（改为获取预签名URL）
  getUploadUrl(filename, fileType, uploadType = 'product', productId = '', productName = '', specName = '') {
    return request({
      url: '/api/mall/upload',
      method: 'post',
      data: {
        filename,
        file_type: fileType,
        type: uploadType,
        product_id: productId || '',
        product_name: productName || '',
        spec_name: specName || ''
      }
    })
  },
  
  // 保持兼容性，但不再使用
  uploadImage: null
}

// 统一导出
const mallApi = {
  // 分类相关
  getCategories: categoryAPI.getCategories,
  createCategory: categoryAPI.createCategory,
  updateCategory: categoryAPI.updateCategory,
  deleteCategory: categoryAPI.deleteCategory,
  toggleCategoryStatus: categoryAPI.toggleCategoryStatus,
  searchCategories: categoryAPI.searchCategories,

  // 商品相关
  getProducts: productAPI.getProducts,
  createProduct: productAPI.createProduct,
  updateProduct: productAPI.updateProduct,
  deleteProduct: productAPI.deleteProduct,
  toggleProductStatus: productAPI.toggleProductStatus,
  toggleProductTop: productAPI.toggleProductTop,
  getProduct: productAPI.getProduct,

  // 规格相关
  getProductSpecs: productAPI.getProductSpecs,
  createProductSpec: productAPI.createProductSpec,
  updateProductSpec: productAPI.updateProductSpec,
  deleteProductSpec: productAPI.deleteProductSpec,
  getProductSpec: productAPI.getProductSpec,
  updateSpecStock: productAPI.updateSpecStock,

  // 上传相关
  uploadImage: uploadAPI.uploadImage,
  getUploadUrl: uploadAPI.getUploadUrl
}

export default mallApi
