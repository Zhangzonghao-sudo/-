import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 优先使用代理目标，其次使用 API 基地址，最后回退到本地后端
  // 强制使用 127.0.0.1 而不是 localhost，以避免 Node.js 17+ 在 Windows 上解析为 IPv6 (::1) 导致的 ECONNREFUSED 错误
  let apiTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE || 'http://127.0.0.1:5001'
  apiTarget = apiTarget.replace('://localhost', '://127.0.0.1')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0', // 允许外部访问
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        },
        // 静态文件代理，确保开发环境可以访问上传的文件
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        },
        // API文件代理，确保开发环境可以访问API返回的文件路径
        '/api/chat/files': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        },
        // WebSocket 代理，确保开发环境实时通信正常
        '/ws': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: false, // 开发环境不检查SSL证书
          timeout: 60000,
          proxyTimeout: 60000,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('WebSocket proxy error:', err);
            });
          }
        },
        // Socket.IO 代理路径
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
          timeout: 60000,
          proxyTimeout: 60000,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              // 忽略 socket hang up 错误，这是 socket.io 轮询的正常行为
              if (err.code !== 'ECONNRESET') {
                console.log('Socket.IO proxy error:', err);
              }
            });
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    }
  }
})
