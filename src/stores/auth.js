import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('access_token') || '')
  const refreshToken = ref(localStorage.getItem('refresh_token') || '')
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.is_admin || false)

  // 设置token
  const setToken = (accessToken, refreshTokenValue) => {
    token.value = accessToken
    refreshToken.value = refreshTokenValue
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshTokenValue)
    
    // 设置axios默认header
    request.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
  }

  // 清除token
  const clearToken = () => {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete request.defaults.headers.common['Authorization']
  }

  // 登录
  const login = async (credentials) => {
    try {
      loading.value = true
      const response = await request.post('/api/auth/login', credentials)
      
      if (response.success) {
        const { access_token, refresh_token, user: userData } = response.data
        
        setToken(access_token, refresh_token)
        user.value = userData
        
        ElMessage.success(response.message)
        return { success: true }
      } else {
        ElMessage.error(response.message)
        return { success: false, message: response.message }
      }
    } catch (error) {
      const message = error.response?.data?.message || '登录失败，请重试'
      ElMessage.error(message)
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      if (token.value) {
        await request.post('/api/auth/logout')
      }
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      clearToken()
      ElMessage.success('已成功登出')
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      if (!token.value) {
        throw new Error('No token available')
      }

      // 设置请求头
      request.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      const response = await request.get('/api/auth/me')
      
      if (response.success) {
        user.value = response.data.user
        return response.data.user
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearToken()
      throw error
    }
  }

  // 刷新token
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }

      const response = await request.post('/api/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${refreshToken.value}`
        }
      })

      if (response.success) {
        const { access_token } = response.data
        token.value = access_token
        localStorage.setItem('access_token', access_token)
        request.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        return access_token
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('刷新token失败:', error)
      clearToken()
      throw error
    }
  }

  // 检查认证状态
  const checkAuth = async () => {
    if (token.value) {
      try {
        await getCurrentUser()
      } catch (error) {
        // 尝试刷新token
        try {
          await refreshAccessToken()
          await getCurrentUser()
        } catch (refreshError) {
          clearToken()
        }
      }
    }
  }

  // 初始化时设置token
  if (token.value) {
    request.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return {
    // 状态
    user,
    token,
    loading,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    
    // 方法
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    checkAuth,
    setToken,
    clearToken
  }
})
