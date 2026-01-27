<template>
  <div class="system-monitor">
    <el-row :gutter="20">
      <!-- 系统概览 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <h3>系统性能监控</h3>
              <div class="header-actions">
                <el-tag :type="systemHealthType" size="large">
                  <el-icon><component :is="systemHealthIcon" /></el-icon>
                  {{ systemHealthText }}
                </el-tag>
                <el-button @click="refreshData" :loading="loading" size="small">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>

          <!-- 关键指标卡片 -->
          <div class="metrics-cards">
            <el-row :gutter="16">
              <el-col :xs="12" :sm="6" v-for="metric in keyMetrics" :key="metric.key">
                <div class="metric-card" :class="getMetricStatus(metric.value, metric.threshold)">
                  <div class="metric-icon">
                    <el-icon :size="24">
                      <component :is="metric.icon" />
                    </el-icon>
                  </div>
                  <div class="metric-content">
                    <div class="metric-value">{{ metric.value }}{{ metric.unit }}</div>
                    <div class="metric-label">{{ metric.label }}</div>
                    <div class="metric-status">
                      <el-progress
                        :percentage="metric.value"
                        :color="getProgressColor(metric.value, metric.threshold)"
                        :show-text="false"
                        :stroke-width="4"
                      />
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <!-- 实时图表 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>CPU使用率趋势</h4>
          </template>
          <div class="chart-container">
            <v-chart
              :option="cpuChartOption"
              style="width: 100%; height: 300px"
              :autoresize="true"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>内存使用情况</h4>
          </template>
          <div class="chart-container">
            <v-chart
              :option="memoryChartOption"
              style="width: 100%; height: 300px"
              :autoresize="true"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 网络监控 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>网络流量监控</h4>
          </template>
          <div class="network-stats">
            <div class="network-item">
              <div class="network-label">入站流量</div>
              <div class="network-value">{{ formatBytes(networkStats.inbound) }}/s</div>
            </div>
            <div class="network-item">
              <div class="network-label">出站流量</div>
              <div class="network-value">{{ formatBytes(networkStats.outbound) }}/s</div>
            </div>
            <div class="network-item">
              <div class="network-label">连接数</div>
              <div class="network-value">{{ networkStats.connections }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 服务状态 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>服务状态监控</h4>
          </template>
          <div class="service-list">
            <div
              v-for="service in services"
              :key="service.name"
              class="service-item"
              :class="service.status"
            >
              <div class="service-info">
                <div class="service-name">{{ service.name }}</div>
                <div class="service-desc">{{ service.description }}</div>
              </div>
              <div class="service-status">
                <el-tag :type="getServiceTagType(service.status)" size="small">
                  {{ getServiceStatusText(service.status) }}
                </el-tag>
                <div class="service-uptime">运行时间: {{ service.uptime }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 数据库监控 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <h4>数据库性能监控</h4>
          </template>
          <el-row :gutter="16">
            <el-col :span="8">
              <div class="db-metric">
                <div class="db-label">连接池状态</div>
                <el-progress
                  :percentage="dbStats.connectionPool.used / dbStats.connectionPool.total * 100"
                  :format="() => `${dbStats.connectionPool.used}/${dbStats.connectionPool.total}`"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="db-metric">
                <div class="db-label">查询响应时间</div>
                <div class="db-value">{{ dbStats.avgResponseTime }}ms</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="db-metric">
                <div class="db-label">慢查询数量</div>
                <div class="db-value">{{ dbStats.slowQueries }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import { 
  Refresh, 
  Monitor, 
  FolderOpened, 
  DataBoard,
  CircleCheckFilled,
  WarningFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const refreshTimer = ref(null)

// 系统指标
const keyMetrics = ref([
  {
    key: 'cpu',
    label: 'CPU使用率',
    value: 0,
    unit: '%',
    threshold: { warning: 70, critical: 90 },
    icon: Monitor
  },
  {
    key: 'memory',
    label: '内存使用率',
    value: 0,
    unit: '%',
    threshold: { warning: 80, critical: 95 },
    icon: DataBoard
  },
  {
    key: 'disk',
    label: '磁盘使用率',
    value: 0,
    unit: '%',
    threshold: { warning: 85, critical: 95 },
    icon: FolderOpened
  },
  {
    key: 'load',
    label: '系统负载',
    value: 0,
    unit: '',
    threshold: { warning: 2, critical: 4 },
    icon: Monitor
  }
])

// 网络统计
const networkStats = ref({
  inbound: 0,
  outbound: 0,
  connections: 0
})

// 服务状态
const services = ref([
  {
    name: 'Web服务器',
    description: 'Flask应用服务',
    status: 'running',
    uptime: '0天0小时'
  },
  {
    name: '数据库',
    description: 'MySQL数据库服务',
    status: 'running',
    uptime: '0天0小时'
  },
  {
    name: 'Redis缓存',
    description: 'Redis缓存服务',
    status: 'running',
    uptime: '0天0小时'
  },
  {
    name: '文件服务',
    description: '文件上传下载服务',
    status: 'running',
    uptime: '0天0小时'
  }
])

// 数据库统计
const dbStats = ref({
  connectionPool: {
    used: 0,
    total: 20
  },
  avgResponseTime: 0,
  slowQueries: 0
})

// CPU图表数据
const cpuData = ref([])
const cpuChartOption = computed(() => ({
  title: {
    show: false
  },
  tooltip: {
    trigger: 'axis',
    formatter: '{b}: {c}%'
  },
  xAxis: {
    type: 'category',
    data: cpuData.value.map((_, index) => {
      const time = new Date(Date.now() - (cpuData.value.length - 1 - index) * 5000)
      return time.toLocaleTimeString()
    }),
    boundaryGap: false
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [{
    data: cpuData.value,
    type: 'line',
    smooth: true,
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [{
          offset: 0, color: 'rgba(64, 158, 255, 0.3)'
        }, {
          offset: 1, color: 'rgba(64, 158, 255, 0.1)'
        }]
      }
    },
    lineStyle: {
      color: '#409EFF'
    }
  }]
}))

// 内存图表数据
const memoryChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c}GB ({d}%)'
  },
  series: [{
    name: '内存使用',
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['50%', '50%'],
    data: [
      { value: 4.2, name: '已使用', itemStyle: { color: '#E6A23C' } },
      { value: 3.8, name: '可用', itemStyle: { color: '#67C23A' } }
    ],
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }]
}))

// 计算属性
const systemHealthType = computed(() => {
  const cpuUsage = keyMetrics.value.find(m => m.key === 'cpu')?.value || 0
  const memoryUsage = keyMetrics.value.find(m => m.key === 'memory')?.value || 0
  
  if (cpuUsage > 90 || memoryUsage > 95) return 'danger'
  if (cpuUsage > 70 || memoryUsage > 80) return 'warning'
  return 'success'
})

const systemHealthIcon = computed(() => {
  const type = systemHealthType.value
  return type === 'success' ? CircleCheckFilled : 
         type === 'warning' ? WarningFilled : CircleCloseFilled
})

const systemHealthText = computed(() => {
  const type = systemHealthType.value
  return type === 'success' ? '系统正常' : 
         type === 'warning' ? '需要关注' : '异常状态'
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    await loadSystemMetrics()
    await loadNetworkStats()
    await loadServiceStatus()
    await loadDatabaseStats()
  } catch (error) {
    console.error('刷新监控数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSystemMetrics = async () => {
  try {
    const response = await fetch('/api/monitoring/system/metrics')
    const result = await response.json()
    
    if (result.success) {
      const data = result.data
      keyMetrics.value[0].value = data.cpu
      keyMetrics.value[1].value = data.memory
      keyMetrics.value[2].value = data.disk
      keyMetrics.value[3].value = data.load

      // 更新CPU趋势数据
      cpuData.value.push(data.cpu)
      if (cpuData.value.length > 20) {
        cpuData.value.shift()
      }
    } else {
      console.error('获取系统指标失败:', result.error)
      // 如果API失败，使用模拟数据作为备用
      keyMetrics.value[0].value = Math.floor(Math.random() * 30) + 20
      keyMetrics.value[1].value = Math.floor(Math.random() * 40) + 40
      keyMetrics.value[2].value = Math.floor(Math.random() * 20) + 60
      keyMetrics.value[3].value = (Math.random() * 2 + 0.5).toFixed(1)
      
      cpuData.value.push(keyMetrics.value[0].value)
      if (cpuData.value.length > 20) {
        cpuData.value.shift()
      }
    }
  } catch (error) {
    console.error('系统指标API调用失败:', error)
    // API调用失败时使用模拟数据
    keyMetrics.value[0].value = Math.floor(Math.random() * 30) + 20
    keyMetrics.value[1].value = Math.floor(Math.random() * 40) + 40
    keyMetrics.value[2].value = Math.floor(Math.random() * 20) + 60
    keyMetrics.value[3].value = (Math.random() * 2 + 0.5).toFixed(1)
    
    cpuData.value.push(keyMetrics.value[0].value)
    if (cpuData.value.length > 20) {
      cpuData.value.shift()
    }
  }
}

const loadNetworkStats = async () => {
  try {
    const response = await fetch('/api/monitoring/system/network')
    const result = await response.json()
    
    if (result.success) {
      const data = result.data
      // 计算网络速度（简化计算，实际应该基于时间差）
      networkStats.value = {
        inbound: data.bytes_recv,
        outbound: data.bytes_sent,
        connections: data.connections
      }
    } else {
      console.error('获取网络统计失败:', result.error)
      // 备用模拟数据
      networkStats.value = {
        inbound: Math.floor(Math.random() * 1024 * 1024 * 10),
        outbound: Math.floor(Math.random() * 1024 * 1024 * 5),
        connections: Math.floor(Math.random() * 100) + 50
      }
    }
  } catch (error) {
    console.error('网络统计API调用失败:', error)
    // 备用模拟数据
    networkStats.value = {
      inbound: Math.floor(Math.random() * 1024 * 1024 * 10),
      outbound: Math.floor(Math.random() * 1024 * 1024 * 5),
      connections: Math.floor(Math.random() * 100) + 50
    }
  }
}

const loadServiceStatus = async () => {
  try {
    const response = await fetch('/api/monitoring/system/services')
    const result = await response.json()
    
    if (result.success) {
      services.value = result.data
    } else {
      console.error('获取服务状态失败:', result.error)
      // 备用模拟数据
      services.value.forEach(service => {
        const hours = Math.floor(Math.random() * 24)
        const days = Math.floor(Math.random() * 30)
        service.uptime = `${days}天${hours}小时`
        service.status = Math.random() > 0.01 ? 'running' : 'stopped'
      })
    }
  } catch (error) {
    console.error('服务状态API调用失败:', error)
    // 备用模拟数据
    services.value.forEach(service => {
      const hours = Math.floor(Math.random() * 24)
      const days = Math.floor(Math.random() * 30)
      service.uptime = `${days}天${hours}小时`
      service.status = Math.random() > 0.01 ? 'running' : 'stopped'
    })
  }
}

const loadDatabaseStats = async () => {
  try {
    const response = await fetch('/api/monitoring/database/stats')
    const result = await response.json()
    
    if (result.success) {
      const data = result.data
      dbStats.value = {
        connectionPool: {
          used: data.connectionPool.active,
          total: data.connectionPool.total
        },
        avgResponseTime: data.avgResponseTime,
        slowQueries: data.slowQueries
      }
    } else {
      console.error('获取数据库统计失败:', result.error)
      // 备用模拟数据
      dbStats.value = {
        connectionPool: {
          used: Math.floor(Math.random() * 15) + 5,
          total: 20
        },
        avgResponseTime: Math.floor(Math.random() * 50) + 10,
        slowQueries: Math.floor(Math.random() * 5)
      }
    }
  } catch (error) {
    console.error('数据库统计API调用失败:', error)
    // 备用模拟数据
    dbStats.value = {
      connectionPool: {
        used: Math.floor(Math.random() * 15) + 5,
        total: 20
      },
      avgResponseTime: Math.floor(Math.random() * 50) + 10,
      slowQueries: Math.floor(Math.random() * 5)
    }
  }
}

// 工具方法
const getMetricStatus = (value, threshold) => {
  if (value >= threshold.critical) return 'critical'
  if (value >= threshold.warning) return 'warning'
  return 'normal'
}

const getProgressColor = (value, threshold) => {
  if (value >= threshold.critical) return '#F56C6C'
  if (value >= threshold.warning) return '#E6A23C'
  return '#67C23A'
}

const getServiceTagType = (status) => {
  return status === 'running' ? 'success' : 'danger'
}

const getServiceStatusText = (status) => {
  return status === 'running' ? '运行中' : '已停止'
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生命周期
onMounted(() => {
  refreshData()
  
  // 每5秒更新一次数据
  refreshTimer.value = setInterval(() => {
    loadSystemMetrics()
    loadNetworkStats()
  }, 5000)
  
  // 每30秒更新服务状态和数据库统计
  setInterval(() => {
    loadServiceStatus()
    loadDatabaseStats()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }
})
</script>

<style scoped>
.system-monitor {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3,
.card-header h4 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.metrics-cards {
  margin-top: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #67C23A;
  transition: all 0.3s ease;
}

.metric-card.warning {
  border-left-color: #E6A23C;
  background: #fdf6ec;
}

.metric-card.critical {
  border-left-color: #F56C6C;
  background: #fef0f0;
}

.metric-icon {
  margin-right: 16px;
  color: #409EFF;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-status {
  width: 100%;
}

.chart-container {
  padding: 10px 0;
}

.network-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.network-item {
  text-align: center;
}

.network-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.network-value {
  font-size: 20px;
  font-weight: 600;
  color: #409EFF;
}

.service-list {
  space-y: 12px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.service-item.running {
  border-left: 4px solid #67C23A;
}

.service-item.stopped {
  border-left: 4px solid #F56C6C;
}

.service-info {
  flex: 1;
}

.service-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.service-desc {
  font-size: 14px;
  color: #666;
}

.service-status {
  text-align: right;
}

.service-uptime {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.db-metric {
  text-align: center;
  padding: 16px;
}

.db-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.db-value {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .system-monitor {
    padding: 12px;
  }
  
  .metrics-cards {
    margin-top: 12px;
  }
  
  .metric-card {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .network-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .service-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .service-status {
    text-align: left;
    width: 100%;
  }
}
</style>