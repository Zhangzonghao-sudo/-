<template>
  <div class="log-viewer" :class="{ 'dashboard-mode': props.dashboardMode }">
    <div class="log-viewer-header" v-if="!props.dashboardMode">
      <h3>系统日志</h3>
      <div class="log-viewer-controls">
        <el-select v-model="logType" placeholder="日志类型" size="small" @change="fetchLogs">
          <el-option label="全部日志" value="all"></el-option>
          <el-option label="系统日志" value="system"></el-option>
          <el-option label="安全日志" value="security"></el-option>
          <el-option label="业务日志" value="business"></el-option>
          <el-option label="审核日志" value="review"></el-option>
          <el-option label="错误日志" value="error"></el-option>
          <el-option label="API日志" value="api"></el-option>
          <el-option label="清理日志" value="cleanup"></el-option>
          <el-option label="测试日志" value="test"></el-option>
        </el-select>
        <el-input
          v-model="searchTerm"
          placeholder="搜索日志..."
          :prefix-icon="Search"
          size="small"
          @keyup.enter="fetchLogs"
          clearable
          @clear="fetchLogs"
        ></el-input>
        <el-button type="primary" size="small" :icon="Refresh" @click="fetchLogs">刷新</el-button>
      </div>
    </div>

    <div v-loading="loading" class="log-cards-container">
      <el-empty v-if="displayLogs.length === 0" description="暂无日志数据"></el-empty>
      
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="8" :xl="6" v-for="log in displayLogs" :key="log.timestamp">
          <el-card 
            class="log-card" 
            :class="getCardClass(log)" 
            shadow="hover" 
            @click="handleRowClick(log)"
          >
            <div class="log-card-header">
              <el-tag :type="getLogLevelType(log.level)" size="small">{{ log.level }}</el-tag>
              <span class="log-time">{{ formatDateFn(log.timestamp) }}</span>
            </div>
            
            <div class="log-card-module">{{ log.module }}</div>
            
            <div class="log-card-message" :class="{ 'log-message-error': log.level === 'ERROR' }">
              {{ log.message }}
            </div>
            
            <div class="log-card-footer">
              <el-button type="primary" size="small" link @click.stop="handleRowClick(log)">
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="log-viewer-footer" v-if="!props.dashboardMode">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[20, 50, 100, 200]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalLogs"
      ></el-pagination>
    </div>
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="logDetailVisible"
      title="日志详情"
      width="80%"
      destroy-on-close
    >
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">
            {{ formatDateFn(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLogLevelType(selectedLog.level)" size="small">
              {{ selectedLog.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ selectedLog.module }}
          </el-descriptions-item>
          <el-descriptions-item label="消息">
            <div class="log-detail-message" :class="{ 'log-message-error': selectedLog.level === 'ERROR' }">
              {{ selectedLog.message }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="原始日志">
            <pre class="log-raw">{{ selectedLog.raw }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="logDetailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps } from 'vue';
import api from '@/utils/api';
import { formatDate, formatLocalTime } from '@/utils/date';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 定义组件属性
const props = defineProps({
  // 是否为仪表盘模式（只显示最新的几条日志）
  dashboardMode: {
    type: Boolean,
    default: false
  },
  // 仪表盘模式下显示的日志数量
  dashboardCount: {
    type: Number,
    default: 3
  }
});

// 响应式状态
const logs = ref([]);
const loading = ref(false);
const logType = ref('all');
const searchTerm = ref('');
const currentPage = ref(1);
const pageSize = ref(50);
const totalLogs = ref(0);
const logDetailVisible = ref(false);
const selectedLog = ref(null);

// 计算属性：根据模式决定显示的日志
const displayLogs = computed(() => {
  if (props.dashboardMode) {
    return logs.value.slice(0, props.dashboardCount);
  }
  return logs.value;
});

// 格式化日期
const formatDateFn = (timestamp) => {
  if (!timestamp) return '';
  // 使用本地化时间格式，自动处理时区转换
  return formatLocalTime(timestamp) || formatDate(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
};

// 获取日志级别类型
const getLogLevelType = (level) => {
  switch (level) {
    case 'ERROR':
      return 'danger';
    case 'WARNING':
      return 'warning';
    case 'INFO':
      return 'info';
    default:
      return '';
  }
};

// 获取日志数据
const fetchLogs = async () => {
  loading.value = true;
  try {
        const response = await api.get('/api/maintenance/logs', {
      params: {
        type: logType.value,
        search: searchTerm.value,
        page: currentPage.value,
        per_page: pageSize.value
      }
    });
    
    // 检查响应数据结构
    if (response.data.success && response.data.data) {
      logs.value = response.data.data.logs || [];
      totalLogs.value = response.data.data.total || 0;
    } else {
      logs.value = [];
      totalLogs.value = 0;
      console.warn('LogViewer: 意外的API响应格式:', response.data);
    }
  } catch (error) {
    console.error('获取日志失败:', error);
    ElMessage.error('获取日志失败: ' + (error.response?.data?.error || error.message));
    logs.value = [];
    totalLogs.value = 0;
  } finally {
    loading.value = false;
  }
};

// 处理页面大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchLogs();
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchLogs();
};

// 获取卡片的类名
const getCardClass = (log) => {
  return {
    'error-card': log.level === 'ERROR',
    'warning-card': log.level === 'WARNING',
    'info-card': log.level === 'INFO'
  };
};

// 处理行点击事件
const handleRowClick = (row) => {
  selectedLog.value = {
    ...row,
    raw: row.raw || row.message // 如果没有原始日志，则使用消息作为原始日志
  };
  logDetailVisible.value = true;
};

// 组件挂载时获取日志
onMounted(() => {
  fetchLogs();
});

// 暴露方法给父组件调用
defineExpose({
  fetchLogs
});
</script>

<style scoped>
.log-viewer {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.log-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.log-viewer-controls {
  display: flex;
  gap: 10px;
}

.log-message {
  white-space: pre-wrap;
  word-break: break-word;
}

.log-message-error {
  color: #f56c6c;
}

.log-viewer-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.log-detail {
  padding: 10px;
}

.log-detail-message {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.log-raw {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
}

/* 日志卡片样式 */
.log-cards-container {
  margin-top: 20px;
}

.log-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.log-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: #909399;
}

.log-card-module {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.log-card-message {
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.log-card-footer {
  display: flex;
  justify-content: flex-end;
}

.error-card {
  border-left: 3px solid #F56C6C;
}

.warning-card {
  border-left: 3px solid #E6A23C;
}

.info-card {
  border-left: 3px solid #409EFF;
}

/* 仪表盘模式样式 */
.dashboard-mode {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.dashboard-mode .log-cards-container {
  margin-top: 0;
}

.dashboard-mode .log-card {
  margin-bottom: 12px;
}

.dashboard-mode .log-card-message {
  -webkit-line-clamp: 1;
  font-size: 13px;
}
</style>