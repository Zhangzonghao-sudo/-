<template>
  <div class="system-logs-page">
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="goBack"
          size="small"
        >
          返回仪表盘
        </el-button>
        <div class="header-title">
          <h1>系统日志</h1>
          <p>查看和管理系统运行日志</p>
        </div>
      </div>
    </div>
    
    <LogViewer />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import LogViewer from '@/components/system/LogViewer.vue'

const router = useRouter()

// 返回仪表盘
const goBack = () => {
  router.push('/dashboard')
}
</script>

<style scoped>
.system-logs-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.header-title h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-title p {
  margin: 0;
  color: #666;
  font-size: 14px;
}
</style>
