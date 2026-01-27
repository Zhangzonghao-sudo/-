<template>
  <div class="login-container">
    <div class="login-card">
      <!-- 登录标题 -->
      <div class="login-title">
        <el-icon size="48" color="#409eff" style="margin-bottom: 16px;">
          <Setting />
        </el-icon>
        <h2>后台管理系统</h2>
        <p style="color: #666; margin-top: 8px;">请登录您的账户</p>
      </div>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item>
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <el-checkbox v-model="loginForm.remember">
              记住登录
            </el-checkbox>
            <el-link type="primary" underline="never">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="authStore.loading"
            @click="handleLogin"
          >
            {{ authStore.loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 默认账户提示 -->
      <div style="margin-top: 20px; padding: 16px; background: #f5f7fa; border-radius: 6px; font-size: 14px; color: #666;">
        <div style="margin-bottom: 8px; font-weight: 600; color: #333;">默认管理员账户：</div>
        <div>用户名: admin</div>
        <div>密码: admin123</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 80, message: '用户名长度在 3 到 80 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    // 表单验证
    await loginFormRef.value.validate()
    
    // 执行登录
    const result = await authStore.login(loginForm)
    
    if (result.success) {
      // 登录成功，跳转到目标页面
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    }
  } catch (error) {
    console.error('登录失败:', error)
  }
}

// 组件挂载时的处理
onMounted(() => {
  // 如果已经登录，直接跳转到仪表板
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
  
  // 开发环境下自动填充默认账户信息
  if (import.meta.env.DEV) {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
}

.login-title h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__inner) {
  height: 48px;
  line-height: 48px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-title h2 {
    font-size: 20px;
  }
}
</style>
