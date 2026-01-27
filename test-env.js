// 测试环境变量加载
console.log('VITE_API_BASE:', import.meta.env.VITE_API_BASE);
console.log('VITE_API_PROXY_TARGET:', import.meta.env.VITE_API_PROXY_TARGET);
console.log('Window location:', window.location.origin);

// 测试API请求
const testApiRequest = async () => {
  try {
    const response = await fetch('/api/auth/test');
    console.log('API response status:', response.status);
    console.log('API response:', await response.json());
  } catch (error) {
    console.error('API request error:', error);
  }
};

testApiRequest();