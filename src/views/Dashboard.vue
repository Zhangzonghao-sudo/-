<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>仪表板</h1>
      <p>欢迎回来，{{ authStore.user?.username }}！</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #409eff;">
              <el-icon size="24" color="#fff"><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.total_users || 0 }}</div>
              <div class="stats-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #67c23a;">
              <el-icon size="24" color="#fff"><UserFilled /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.active_users || 0 }}</div>
              <div class="stats-label">活跃用户</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #e6a23c;">
              <el-icon size="24" color="#fff"><Avatar /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.admin_users || 0 }}</div>
              <div class="stats-label">管理员</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon" style="background: #f56c6c;">
              <el-icon size="24" color="#fff"><Warning /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.inactive_users || 0 }}</div>
              <div class="stats-label">禁用用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细信息区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 最近注册用户 -->
      <el-col :xs="24" :lg="12" v-if="authStore.isAdmin">
        <el-card>
          <template #header>
            <span style="font-weight: 600;">最近注册用户</span>
          </template>
          
          <div v-if="stats.recent_users && stats.recent_users.length > 0">
            <div 
              v-for="user in stats.recent_users.slice(0, 5)" 
              :key="user.id"
              class="recent-user-item"
            >
              <div class="user-avatar">
                <el-icon><User /></el-icon>
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.username }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-time">{{ formatDate(user.created_at) }}</div>
              </div>
              <div class="user-status">
                <el-tag 
                  :type="user.is_admin ? 'danger' : 'primary'" 
                  size="small"
                >
                  {{ user.is_admin ? '管理员' : '普通用户' }}
                </el-tag>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            <el-empty description="暂无数据" />
          </div>
        </el-card>
      </el-col>

      <!-- 普通用户信息面板 -->
      <el-col :xs="24" v-if="!authStore.isAdmin">
        <el-card>
          <template #header>
            <span style="font-weight: 600;">个人信息</span>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">
              {{ authStore.user?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ authStore.user?.email }}
            </el-descriptions-item>
            <el-descriptions-item label="账户类型">
              <el-tag :type="authStore.user?.is_admin ? 'danger' : 'primary'">
                {{ authStore.user?.is_admin ? '管理员' : '普通用户' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="账户状态">
              <el-tag :type="authStore.user?.is_active ? 'success' : 'danger'">
                {{ authStore.user?.is_active ? '正常' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDate(authStore.user?.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ formatDate(authStore.user?.last_login) || '首次登录' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Avatar, Warning } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()

// 统计数据
const stats = ref({})
const loading = ref(false)

// 获取仪表板统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/dashboard/stats')
    
    if (response.data.success) {
      stats.value = response.data.data.stats
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新统计数据
const refreshStats = () => {
  fetchStats()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 组件挂载时获取数据
onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: none;
  margin-bottom: 20px;
}

.stats-content {
  display: flex;
  align-items: center;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  color: #666;
  font-size: 14px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 6px;
}

.recent-user-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.recent-user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #666;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.user-email {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.user-time {
  font-size: 12px;
  color: #999;
}

.user-status {
  margin-left: 12px;
}

.no-data {
  text-align: center;
  padding: 40px 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .stats-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .recent-user-item {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .user-status {
    margin-left: 0;
    margin-top: 8px;
  }
}
</style>
