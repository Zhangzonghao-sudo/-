<template>
  <div class="alert-center">
    <el-card>
      <template #header>
        <div class="alert-header">
          <div class="header-left">
            <h3>系统告警中心</h3>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" type="danger">
              <el-tag :type="getStatusType(systemStatus)">
                {{ getStatusText(systemStatus) }}
              </el-tag>
            </el-badge>
          </div>
          <div class="header-actions">
            <el-button-group size="small">
              <el-button @click="refreshAlerts" :loading="loading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button @click="markAllRead" :disabled="unreadCount === 0">
                <el-icon><Check /></el-icon>
                全部已读
              </el-button>
              <el-button @click="showSettings">
                <el-icon><Setting /></el-icon>
                设置
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 告警统计 -->
      <div class="alert-stats">
        <el-row :gutter="16">
          <el-col :span="6" v-for="stat in alertStats" :key="stat.type">
            <div class="stat-card" :class="stat.type">
              <div class="stat-icon">
                <el-icon :size="20">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stat.count }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 告警过滤 -->
      <div class="alert-filters">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-select v-model="filterLevel" placeholder="告警级别" clearable size="small">
              <el-option label="全部" value="" />
              <el-option label="严重" value="critical" />
              <el-option label="错误" value="error" />
              <el-option label="警告" value="warning" />
              <el-option label="信息" value="info" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filterStatus" placeholder="状态" clearable size="small">
              <el-option label="全部" value="" />
              <el-option label="未处理" value="unresolved" />
              <el-option label="已处理" value="resolved" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索告警内容"
              size="small"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button @click="exportAlerts" size="small">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 告警列表 -->
      <div class="alert-list">
        <el-timeline>
          <el-timeline-item
            v-for="alert in filteredAlerts"
            :key="alert.id"
            :timestamp="formatTime(alert.created_at)"
            :type="getAlertTimelineType(alert.level)"
            :color="getAlertColor(alert.level)"
            :hollow="alert.is_resolved"
          >
            <div class="alert-item" :class="{ 'resolved': alert.is_resolved, 'unread': !alert.is_read }">
              <div class="alert-content">
                <div class="alert-title">
                  <el-tag :type="getAlertTagType(alert.level)" size="small">
                    {{ getLevelText(alert.level) }}
                  </el-tag>
                  <span class="title-text">{{ alert.title }}</span>
                  <div class="alert-actions">
                    <el-button
                      v-if="!alert.is_resolved"
                      @click="resolveAlert(alert)"
                      type="success"
                      size="small"
                      link
                    >
                      标记已解决
                    </el-button>
                    <el-button @click="viewAlertDetail(alert)" type="primary" size="small" link>
                      查看详情
                    </el-button>
                  </div>
                </div>
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-meta">
                  <span class="meta-item">
                    <el-icon><Timer /></el-icon>
                    {{ formatTime(alert.created_at) }}
                  </span>
                  <span class="meta-item" v-if="alert.count > 1">
                    <el-icon><Warning /></el-icon>
                    重复 {{ alert.count }} 次
                  </span>
                  <span class="meta-item" v-if="alert.is_resolved">
                    <el-icon><Check /></el-icon>
                    已于 {{ formatTime(alert.resolved_at) }} 解决
                  </span>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>

        <!-- 空状态 -->
        <el-empty v-if="filteredAlerts.length === 0" description="暂无告警信息">
          <el-button type="primary" @click="refreshAlerts">刷新数据</el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div class="alert-pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 告警详情弹窗 -->
    <el-dialog v-model="detailVisible" title="告警详情" width="600px">
      <div class="alert-detail" v-if="selectedAlert">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="告警级别">
            <el-tag :type="getAlertTagType(selectedAlert.level)">
              {{ getLevelText(selectedAlert.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警状态">
            <el-tag :type="selectedAlert.is_resolved ? 'success' : 'danger'">
              {{ selectedAlert.is_resolved ? '已解决' : '未解决' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatTime(selectedAlert.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="解决时间" v-if="selectedAlert.is_resolved">
            {{ formatTime(selectedAlert.resolved_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="重复次数" v-if="selectedAlert.count > 1">
            {{ selectedAlert.count }} 次
          </el-descriptions-item>
        </el-descriptions>

        <div class="alert-description">
          <h4>告警描述</h4>
          <p>{{ selectedAlert.message }}</p>
        </div>

        <div class="alert-suggestion" v-if="selectedAlert.suggestion">
          <h4>处理建议</h4>
          <p>{{ selectedAlert.suggestion }}</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button
            v-if="selectedAlert && !selectedAlert.is_resolved"
            type="success"
            @click="resolveAlert(selectedAlert)"
          >
            标记已解决
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设置弹窗 -->
    <el-dialog v-model="settingsVisible" title="告警设置" width="500px">
      <el-form :model="alertSettings" label-width="120px">
        <el-form-item label="自动刷新">
          <el-switch v-model="alertSettings.autoRefresh" />
          <span class="form-help">开启后每30秒自动刷新告警数据</span>
        </el-form-item>
        <el-form-item label="声音提醒">
          <el-switch v-model="alertSettings.soundAlert" />
          <span class="form-help">新告警时播放提示音</span>
        </el-form-item>
        <el-form-item label="桌面通知">
          <el-switch v-model="alertSettings.desktopNotification" />
          <span class="form-help">新告警时显示桌面通知</span>
        </el-form-item>
        <el-form-item label="告警级别过滤">
          <el-checkbox-group v-model="alertSettings.levelFilter">
            <el-checkbox label="critical">严重</el-checkbox>
            <el-checkbox label="error">错误</el-checkbox>
            <el-checkbox label="warning">警告</el-checkbox>
            <el-checkbox label="info">信息</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="settingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Refresh, Check, Setting, Search, Download, Timer, Warning,
  InfoFilled, WarningFilled, CircleCloseFilled, CircleCheckFilled
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const alerts = ref([])
const selectedAlert = ref(null)
const detailVisible = ref(false)
const settingsVisible = ref(false)
const refreshTimer = ref(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 过滤
const filterLevel = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')

// 设置
const alertSettings = ref({
  autoRefresh: true,
  soundAlert: true,
  desktopNotification: true,
  levelFilter: ['critical', 'error', 'warning', 'info']
})

// 计算属性
const systemStatus = computed(() => {
  const criticalCount = alerts.value.filter(a => a.level === 'critical' && !a.is_resolved).length
  const errorCount = alerts.value.filter(a => a.level === 'error' && !a.is_resolved).length

  if (criticalCount > 0) return 'critical'
  if (errorCount > 0) return 'error'
  return 'normal'
})

const unreadCount = computed(() => {
  return alerts.value.filter(a => !a.is_read).length
})

const alertStats = computed(() => [
  {
    type: 'critical',
    label: '严重',
    count: alerts.value.filter(a => a.level === 'critical' && !a.is_resolved).length,
    icon: 'CircleCloseFilled'
  },
  {
    type: 'error',
    label: '错误',
    count: alerts.value.filter(a => a.level === 'error' && !a.is_resolved).length,
    icon: 'WarningFilled'
  },
  {
    type: 'warning',
    label: '警告',
    count: alerts.value.filter(a => a.level === 'warning' && !a.is_resolved).length,
    icon: 'Warning'
  },
  {
    type: 'info',
    label: '信息',
    count: alerts.value.filter(a => a.level === 'info' && !a.is_resolved).length,
    icon: 'InfoFilled'
  }
])

const filteredAlerts = computed(() => {
  let filtered = alerts.value

  // 级别过滤
  if (filterLevel.value) {
    filtered = filtered.filter(a => a.level === filterLevel.value)
  }

  // 状态过滤
  if (filterStatus.value === 'resolved') {
    filtered = filtered.filter(a => a.is_resolved)
  } else if (filterStatus.value === 'unresolved') {
    filtered = filtered.filter(a => !a.is_resolved)
  }

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(keyword) ||
      a.message.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 方法
const refreshAlerts = async () => {
  loading.value = true
  try {
    // 基于真实监控数据生成告警
    alerts.value = await generateAlertsFromRealData()
    total.value = alerts.value.length

    ElMessage.success('告警数据刷新成功')
  } catch (error) {
    console.error('刷新告警失败:', error)
    ElMessage.error('刷新告警失败')
  } finally {
    loading.value = false
  }
}

const markAllRead = () => {
  alerts.value.forEach(alert => {
    if (!alert.is_read) {
      alert.is_read = true
    }
  })
  ElMessage.success('已标记所有告警为已读')
}

const resolveAlert = (alert) => {
  alert.is_resolved = true
  alert.resolved_at = new Date().toISOString()
  ElMessage.success('告警已标记为已解决')
  
  if (detailVisible.value) {
    detailVisible.value = false
  }
}

const viewAlertDetail = (alert) => {
  selectedAlert.value = alert
  alert.is_read = true
  detailVisible.value = true
}

const showSettings = () => {
  settingsVisible.value = true
}

const saveSettings = () => {
  // 保存设置到本地存储
  localStorage.setItem('alertSettings', JSON.stringify(alertSettings.value))
  
  // 重新设置自动刷新
  if (alertSettings.value.autoRefresh) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }

  settingsVisible.value = false
  ElMessage.success('设置已保存')
}

const exportAlerts = () => {
  // 导出告警数据为CSV
  const csvContent = generateCSV(filteredAlerts.value)
  downloadCSV(csvContent, `alerts_${new Date().toISOString().split('T')[0]}.csv`)
  ElMessage.success('告警数据导出成功')
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 工具方法
const getStatusType = (status) => {
  const types = {
    critical: 'danger',
    error: 'warning',
    normal: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    critical: '严重告警',
    error: '错误告警',
    normal: '系统正常'
  }
  return texts[status] || '未知状态'
}

const getAlertTagType = (level) => {
  const types = {
    critical: 'danger',
    error: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return types[level] || 'info'
}

const getAlertTimelineType = (level) => {
  const types = {
    critical: 'danger',
    error: 'warning',
    warning: 'warning',
    info: 'primary'
  }
  return types[level] || 'primary'
}

const getAlertColor = (level) => {
  const colors = {
    critical: '#F56C6C',
    error: '#E6A23C',
    warning: '#E6A23C',
    info: '#409EFF'
  }
  return colors[level] || '#409EFF'
}

const getLevelText = (level) => {
  const texts = {
    critical: '严重',
    error: '错误',
    warning: '警告',
    info: '信息'
  }
  return texts[level] || '未知'
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

const generateAlertsFromRealData = async () => {
  const generatedAlerts = []
  let alertId = 1

  try {
    // 获取真实系统数据
    const [metricsRes, networkRes, servicesRes, dbRes] = await Promise.all([
      fetch('/api/monitoring/system/metrics'),
      fetch('/api/monitoring/system/network'),
      fetch('/api/monitoring/system/services'),
      fetch('/api/monitoring/database/stats')
    ])

    const metrics = await metricsRes.json()
    const network = await networkRes.json()
    const services = await servicesRes.json()
    const database = await dbRes.json()

    // 基于真实数据生成告警
    if (metrics.success) {
      const data = metrics.data
      
      // CPU使用率告警
      if (data.cpu > 80) {
        generatedAlerts.push({
          id: alertId++,
          level: data.cpu > 90 ? 'critical' : 'warning',
          title: 'CPU使用率过高',
          message: `当前CPU使用率为${data.cpu}%，系统负载较高`,
          created_at: new Date().toISOString(),
          is_resolved: false,
          is_read: false,
          count: 1,
          suggestion: '建议检查系统进程，关闭不必要的应用程序'
        })
      }

      // 内存使用率告警
      if (data.memory > 85) {
        generatedAlerts.push({
          id: alertId++,
          level: data.memory > 95 ? 'critical' : 'warning',
          title: '内存使用率过高',
          message: `当前内存使用率为${data.memory}%，可用内存不足`,
          created_at: new Date().toISOString(),
          is_resolved: false,
          is_read: false,
          count: 1,
          suggestion: '建议关闭不必要的程序或增加系统内存'
        })
      }

      // 磁盘使用率告警
      if (data.disk > 85) {
        generatedAlerts.push({
          id: alertId++,
          level: data.disk > 95 ? 'critical' : 'warning',
          title: '磁盘空间不足',
          message: `当前磁盘使用率为${data.disk}%，存储空间不足`,
          created_at: new Date().toISOString(),
          is_resolved: false,
          is_read: false,
          count: 1,
          suggestion: '建议清理临时文件、日志文件或扩展存储空间'
        })
      }
    }

    // 服务状态告警
    if (services.success) {
      services.data.forEach(service => {
        if (service.status === 'stopped') {
          generatedAlerts.push({
            id: alertId++,
            level: 'error',
            title: '服务停止运行',
            message: `${service.name}服务已停止，可能影响系统功能`,
            created_at: new Date().toISOString(),
            is_resolved: false,
            is_read: false,
            count: 1,
            suggestion: `请检查${service.name}服务状态并尝试重启`
          })
        }
      })
    }

    // 数据库连接告警
    if (database.success) {
      const dbData = database.data
      const connectionUsage = (dbData.connectionPool.active / dbData.connectionPool.total) * 100
      
      if (connectionUsage > 80) {
        generatedAlerts.push({
          id: alertId++,
          level: connectionUsage > 90 ? 'critical' : 'warning',
          title: '数据库连接池使用率过高',
          message: `数据库连接池使用率为${connectionUsage.toFixed(1)}%，可能影响性能`,
          created_at: new Date().toISOString(),
          is_resolved: false,
          is_read: false,
          count: 1,
          suggestion: '建议优化数据库查询或增加连接池大小'
        })
      }

      if (dbData.avgResponseTime > 100) {
        generatedAlerts.push({
          id: alertId++,
          level: dbData.avgResponseTime > 500 ? 'error' : 'warning',
          title: '数据库响应时间过长',
          message: `数据库平均响应时间为${dbData.avgResponseTime}ms，性能下降`,
          created_at: new Date().toISOString(),
          is_resolved: false,
          is_read: false,
          count: 1,
          suggestion: '建议检查数据库索引和查询优化'
        })
      }
    }

    // 如果没有告警，添加一个系统正常的信息
    if (generatedAlerts.length === 0) {
      generatedAlerts.push({
        id: alertId++,
        level: 'info',
        title: '系统运行正常',
        message: '所有监控指标均在正常范围内，系统运行稳定',
        created_at: new Date().toISOString(),
        is_resolved: false,
        is_read: true,
        count: 1,
        suggestion: '继续保持良好的系统维护习惯'
      })
    }

  } catch (error) {
    console.error('获取监控数据失败:', error)
    // 如果API调用失败，添加一个连接错误告警
    generatedAlerts.push({
      id: alertId++,
      level: 'error',
      title: '监控数据获取失败',
      message: '无法获取系统监控数据，请检查监控服务状态',
      created_at: new Date().toISOString(),
      is_resolved: false,
      is_read: false,
      count: 1,
      suggestion: '请检查后端监控API服务是否正常运行'
    })
  }

  return generatedAlerts
}

const generateCSV = (data) => {
  const headers = ['ID', '级别', '标题', '消息', '创建时间', '状态', '重复次数']
  const csvRows = [headers.join(',')]

  data.forEach(alert => {
    const row = [
      alert.id,
      getLevelText(alert.level),
      `"${alert.title}"`,
      `"${alert.message}"`,
      formatTime(alert.created_at),
      alert.is_resolved ? '已解决' : '未解决',
      alert.count
    ]
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  if (alertSettings.value.autoRefresh) {
    refreshTimer.value = setInterval(refreshAlerts, 30000)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const playAlertSound = () => {
  if (alertSettings.value.soundAlert) {
    // 创建音频提示
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    audio.play().catch(() => {
      // 忽略播放失败
    })
  }
}

const showDesktopNotification = (alert) => {
  if (alertSettings.value.desktopNotification && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(`${getLevelText(alert.level)}告警`, {
        body: alert.message,
        icon: '/favicon.ico'
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`${getLevelText(alert.level)}告警`, {
            body: alert.message,
            icon: '/favicon.ico'
          })
        }
      })
    }
  }
}

// 生命周期
onMounted(() => {
  // 加载设置
  const savedSettings = localStorage.getItem('alertSettings')
  if (savedSettings) {
    alertSettings.value = { ...alertSettings.value, ...JSON.parse(savedSettings) }
  }

  // 初始化数据
  refreshAlerts()

  // 启动自动刷新
  if (alertSettings.value.autoRefresh) {
    startAutoRefresh()
  }

  // 请求桌面通知权限
  if (alertSettings.value.desktopNotification && 'Notification' in window) {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.alert-center {
  padding: 20px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.alert-stats {
  margin: 20px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.critical {
  border-left: 4px solid #F56C6C;
}

.stat-card.error {
  border-left: 4px solid #E6A23C;
}

.stat-card.warning {
  border-left: 4px solid #E6A23C;
}

.stat-card.info {
  border-left: 4px solid #409EFF;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-card.critical .stat-icon {
  background: #fef0f0;
  color: #F56C6C;
}

.stat-card.error .stat-icon {
  background: #fdf6ec;
  color: #E6A23C;
}

.stat-card.warning .stat-icon {
  background: #fdf6ec;
  color: #E6A23C;
}

.stat-card.info .stat-icon {
  background: #ecf5ff;
  color: #409EFF;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.alert-filters {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.alert-list {
  margin: 20px 0;
  min-height: 400px;
}

.alert-item {
  padding: 16px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e4e7ed;
  margin-bottom: 8px;
  transition: all 0.3s;
}

.alert-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-item.unread {
  border-left: 4px solid #409EFF;
  background: #ecf5ff;
}

.alert-item.resolved {
  opacity: 0.7;
}

.alert-content {
  width: 100%;
}

.alert-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.title-text {
  font-weight: 600;
  color: #333;
  margin-left: 8px;
  flex: 1;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.alert-message {
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.alert-pagination {
  margin-top: 20px;
  text-align: center;
}

.alert-detail {
  padding: 16px 0;
}

.alert-description,
.alert-suggestion {
  margin-top: 20px;
}

.alert-description h4,
.alert-suggestion h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.alert-description p,
.alert-suggestion p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.form-help {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .alert-center {
    padding: 12px;
  }

  .alert-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .alert-filters .el-row {
    flex-direction: column;
    gap: 12px;
  }

  .alert-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .alert-actions {
    align-self: flex-end;
  }

  .alert-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
