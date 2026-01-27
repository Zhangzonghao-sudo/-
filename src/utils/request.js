import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 错误消息去重
const errorMessageCache = new Set()
const showErrorMessage = (message) => {
  if (!errorMessageCache.has(message)) {
    errorMessageCache.add(message)
    ElMessage.error(message)
    // 3秒后清除缓存，允许再次显示相同错误
    setTimeout(() => {
      errorMessageCache.delete(message)
    }, 3000)
  }
}

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const { data } = response

    // 如果是文件下载等特殊情况，直接返回response
    if (response.config.responseType === 'blob') {
      return response
    }

    // 检查响应状态码，如果是2xx就认为成功
    if (response.status >= 200 && response.status < 300) {
      // 对于有success字段的响应（如登录API）
      if (data.hasOwnProperty('success')) {
        if (data.success === true) {
          return data
        } else {
          return Promise.reject(new Error(data.message || '请求失败'))
        }
      }
      
      // 对于有code字段的响应
      if (data.hasOwnProperty('code')) {
        if (data.code === 200) {
          return data
        } else {
          return Promise.reject(new Error(data.message || '请求失败'))
        }
      }
      
      // 对于审核API等直接返回数据的响应，HTTP 200就表示成功
      return data
    } else {
      // HTTP状态码不是2xx，认为是错误
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  error => {
    // 对响应错误做点什么
    console.error('响应错误:', error)

    let message = '网络错误'
    let shouldShowMessage = true

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          // 400错误通常是业务逻辑错误，直接返回数据让业务代码处理
          // 但需要确保返回的数据格式符合前端期望
          if (data && typeof data === 'object') {
            // 如果后端返回的是 {code: 400, message: "错误信息"}
            // 转换为前端期望的格式 {code: 400, message: "错误信息"}
            return Promise.resolve(data)
          }
          return Promise.resolve({ code: 400, message: data?.message || '请求参数错误' })
        case 401:
          message = '未授权，请重新登录'
          // 清除token并跳转到登录页
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          break
        case 422:
          // 422状态码表示请求格式正确但语义错误（通常是验证失败）
          message = data?.message || '请求参数验证失败'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          shouldShowMessage = false // 404通常是开发问题，不显示给用户
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = data?.message || `连接错误${status}`
      }
    } else if (error.request) {
      message = '网络连接失败'
    }

    // 只显示重要的错误消息
    if (shouldShowMessage) {
      showErrorMessage(message)
    }

    return Promise.reject(error)
  }
)

export default request
