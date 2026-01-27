import axios from 'axios';

// 创建一个axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || window.location.origin, // 优先环境变量，其次同源以配合代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 添加认证token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 对于FormData上传，移除默认的Content-Type，让浏览器自动设置boundary
    if (config.data instanceof FormData) {
      if (config.headers && 'Content-Type' in config.headers) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.error('API请求错误:', error);
    
    // 对于特定的错误状态码，可以在这里统一处理
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // 日志记录详细信息
      console.error(`HTTP ${status}:`, data);
      
      // 401 未授权 - 自动跳转到登录页
      if (status === 401) {
        localStorage.removeItem('access_token');
        // 可以在这里添加路由跳转逻辑
        // router.push('/login');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;