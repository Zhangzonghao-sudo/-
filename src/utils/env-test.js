// 环境变量测试
console.log('=== Environment Variables Test ===');
console.log('VITE_API_BASE:', import.meta.env.VITE_API_BASE);
console.log('VITE_API_PROXY_TARGET:', import.meta.env.VITE_API_PROXY_TARGET);
console.log('All env variables:', import.meta.env);

// 测试API基础URL
const apiBase = import.meta.env.VITE_API_BASE || window.location.origin;
console.log('Actual API base URL:', apiBase);

// 测试代理配置
const testProxy = async () => {
  try {
    console.log('Testing API proxy...');
    const response = await fetch('/api/auth/test');
    console.log('Proxy test response status:', response.status);
    console.log('Proxy test response:', await response.json());
  } catch (error) {
    console.error('Proxy test error:', error);
  }
};

testProxy();

export default {
  apiBase
};