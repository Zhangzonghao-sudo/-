<template>
  <div class="analytics-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">数据分析仪表板</h1>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateRangeChange"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
          <el-button
            type="primary"
            :loading="globalLoading"
            @click="refreshAllData"
          >
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 概览卡片 -->
    <el-row class="overview-cards">
      <el-col :span="6" v-for="card in overviewCards" :key="card.key" :xs="24" :sm="12" :md="6">
        <div class="overview-card">
          <div class="card-icon" :style="{ backgroundColor: card.color }">
            <component :is="getIconComponent(card.icon)" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-title">{{ card.title }}</div>
            <div v-if="card.trend !== undefined" class="card-trend" :class="card.trend >= 0 ? 'positive' : 'negative'">
              <el-icon v-if="card.trend > 0"><TrendUp /></el-icon>
              <el-icon v-else-if="card.trend < 0"><TrendDown /></el-icon>
              <span>{{ Math.abs(card.trend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row>
        <el-col :span="24" class="chart-card">
          <el-card :loading="loadingStates.messageTrend">
            <template #header>
              <div class="card-header">
                <span>消息趋势</span>
                <el-button link type="primary" size="small" @click="loadMessageTrend">刷新</el-button>
              </div>
            </template>
            <VChart
              :option="getTrendChartOption"
              height="400px"
              autoresize
            />
          </el-card>
        </el-col>
        <el-col :span="12" class="chart-card">
          <el-card :loading="loadingStates.csPerformance">
            <template #header>
              <div class="card-header">
                <span>客服绩效</span>
                <el-button link type="primary" size="small" @click="loadCSPerformance">刷新</el-button>
              </div>
            </template>
            <VChart
              :option="getCSPerformanceOption"
              height="350px"
              autoresize
            />
          </el-card>
        </el-col>
        <el-col :span="12" class="chart-card">
          <el-card :loading="loadingStates.userActivity">
            <template #header>
              <div class="card-header">
                <span>用户活跃度</span>
                <el-button link type="primary" size="small" @click="loadUserActivity">刷新</el-button>
              </div>
            </template>
            <VChart
              :option="getUserActivityOption"
              height="350px"
              autoresize
            />
          </el-card>
        </el-col>
        <el-col :span="12" class="chart-card">
          <el-card :loading="loadingStates.fileDistribution">
            <template #header>
              <div class="card-header">
                <span>文件分布</span>
                <el-button link type="primary" size="small" @click="loadFileDistribution">刷新</el-button>
              </div>
            </template>
            <VChart
              :option="getFileDistributionOption"
              height="350px"
              autoresize
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 实时数据 -->
    <div class="realtime-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>实时统计数据</span>
            <el-tag :type="realtimeData.status === 'warning' ? 'warning' : 'success'" size="small">
              {{ realtimeData.status === 'warning' ? '需要关注' : '运行正常' }}
            </el-tag>
          </div>
        </template>
        <el-row>
          <el-col v-for="stat in realtimeStats" :key="stat.key" :span="6" :xs="12">
            <div class="realtime-stat">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { ElMessage, ElDatePicker, ElButton, ElCard, ElRow, ElCol, ElTag } from 'element-plus'
import VChart from 'vue-echarts'
import * as echarts from 'echarts'

import analyticsAPI from '@/api/analytics.js'

// ECharts实例
const echartsInstance = echarts

// 状态管理
const globalLoading = ref(false)
const dateRange = ref([])
const realtimeTimer = ref(null)

// 加载状态
const loadingStates = reactive({
  messageTrend: false,
  csPerformance: false,
  userActivity: false,
  fileDistribution: false
})

// 概览卡片数据
const overviewCards = ref([
  {
    key: 'messages',
    title: '今日消息',
    value: '0',
    trend: 0,
    color: '#409EFF',
    icon: 'message'
  },
  {
    key: 'sessions',
    title: '活跃会话',
    value: '0',
    trend: 0,
    color: '#67C23A',
    icon: 'user'
  },
  {
    key: 'files',
    title: '文件上传',
    value: '0',
    trend: 0,
    color: '#E6A23C',
    icon: 'document'
  },
  {
    key: 'response_time',
    title: '平均响应时间',
    value: '0分钟',
    trend: 0,
    color: '#F56C6C',
    icon: 'timer'
  }
])

// 实时数据
const realtimeData = reactive({
  status: 'normal',
  timestamp: ''
})

const realtimeStats = ref([
  { key: 'active_sessions', label: '活跃会话', value: 0 },
  { key: 'online_cs', label: '在线客服', value: 0 },
  { key: 'unread_messages', label: '未读消息', value: 0 },
  { key: 'unassigned_sessions', label: '未分配会话', value: 0 }
])

// 图表数据
const messageTrendData = ref({ categories: [], series: [] })
const csPerformanceData = ref({ categories: [], series: [] })
const userActivityData = ref({ data: [], xAxis: [], yAxis: [], max_value: 0 })
const fileDistributionData = ref([])

// 方法
const getIconComponent = (iconName) => {
  const iconMap = {
    'message': 'Message',
    'user': 'User',
    'document': 'Document',
    'timer': 'Timer'
  }
  return iconMap[iconName] || 'Message'
}

const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    refreshAllData()
  }
}

const refreshAllData = async () => {
  globalLoading.value = true
  try {
    // 使用Promise.allSettled来避免单个API失败影响整体
    const results = await Promise.allSettled([
      loadOverviewData(),
      loadMessageTrend(),
      loadCSPerformance(),
      loadUserActivity(),
      loadFileDistribution()
    ])

    // 检查结果
    const failedCount = results.filter(result => result.status === 'rejected').length
    const successCount = results.length - failedCount

    if (failedCount === 0) {
      ElMessage.success('数据刷新成功')
    } else if (successCount > 0) {
      ElMessage.warning(`部分数据刷新成功 (${successCount}/${results.length})`)
    } else {
      ElMessage.error('数据刷新失败')
    }
  } catch (error) {
    console.error('数据刷新异常:', error)
    ElMessage.error('数据刷新失败')
  } finally {
    globalLoading.value = false
  }
}

const loadOverviewData = async () => {
  try {
    const response = await analyticsAPI.getDashboardOverview()
    if (response.success) {
      const data = response.data

      // 更新概览卡片
      // 1. 今日消息 - 来自 ChatMessage 表，统计今天创建的消息数量
      overviewCards.value[0].value = data.today_stats?.messages || 0
      overviewCards.value[0].trend = data.today_stats?.message_growth || 0

      // 2. 活跃会话 - 来自 CustomerServiceSession 表，status='active' 的会话数量
      overviewCards.value[1].value = data.current_stats?.active_sessions || 0
      overviewCards.value[1].trend = data.today_stats?.session_growth || 0

      // 3. 文件上传 - 来自 ChatMessage 表，统计文件上传数量
      overviewCards.value[2].value = data.week_summary?.total_files || 0
      // 4. 平均响应时间
      overviewCards.value[3].value = `${data.current_stats?.avg_response_time || 0}分钟`
    }
  } catch (error) {
    console.error('加载概览数据失败:', error)
  }
}

const loadMessageTrend = async () => {
  loadingStates.messageTrend = true
  try {
    const params = { days: 7, group_by: 'day' }
    const response = await analyticsAPI.getMessageTrend(params)

    if (response.success && response.data.chart_data) {
      messageTrendData.value = response.data.chart_data
    } else {
      messageTrendData.value = { categories: [], series: [] }
      console.warn('消息趋势数据为空')
    }
  } catch (error) {
    console.error('加载消息趋势失败:', error)
    messageTrendData.value = { categories: [], series: [] }
  } finally {
    loadingStates.messageTrend = false
  }
}

const loadCSPerformance = async () => {
  loadingStates.csPerformance = true
  try {
    const params = { days: 30 }
    const response = await analyticsAPI.getCSPerformance(params)
    if (response.success && response.data.performance_data) {
      const data = response.data.performance_data
      if (data && data.length > 0) {
        csPerformanceData.value = {
          categories: data.map(item => item.username),
          series: [
            {
              name: '效率分数',
              data: data.map(item => item.efficiency_score)
            },
            {
              name: '满意度',
              data: data.map(item => item.satisfaction_score)
            }
          ]
        }
      } else {
        csPerformanceData.value = { categories: [], series: [] }
        console.warn('客服绩效数据为空')
      }
    } else {
      csPerformanceData.value = { categories: [], series: [] }
      console.warn('客服绩效数据为空')
    }
  } catch (error) {
    console.error('加载客服绩效失败:', error)
    csPerformanceData.value = { categories: [], series: [] }
  } finally {
    loadingStates.csPerformance = false
  }
}

const loadUserActivity = async () => {
  loadingStates.userActivity = true
  try {
    const params = { days: 7 }
    const response = await analyticsAPI.getUserActivity(params)
    if (response.success && response.data.chart_data) {
      userActivityData.value = response.data.chart_data
    } else {
      userActivityData.value = { data: [], xAxis: [], yAxis: [], max_value: 0 }
      console.warn('用户活跃度数据为空')
    }
  } catch (error) {
    console.error('加载用户活跃度失败:', error)
    userActivityData.value = { data: [], xAxis: [], yAxis: [], max_value: 0 }
  } finally {
    loadingStates.userActivity = false
  }
}

const loadFileDistribution = async () => {
  loadingStates.fileDistribution = true
  try {
    const params = { days: 30 }
    const response = await analyticsAPI.getFileDistribution(params)
    if (response.success && response.data.chart_data) {
      fileDistributionData.value = response.data.chart_data
    } else {
      fileDistributionData.value = []
      console.warn('文件分布数据为空')
    }
  } catch (error) {
    console.error('加载文件分布失败:', error)
    fileDistributionData.value = []
  } finally {
    loadingStates.fileDistribution = false
  }
}

const loadRealtimeData = async () => {
  try {
    const response = await analyticsAPI.getRealtimeStats()
    if (response.success) {
      const data = response.data
      // 1. 活跃会话 - CustomerServiceSession 表中 status='active' 的记录数
      realtimeStats.value[0].value = data.active_sessions
      // 2. 在线客服 - User 表中最近5分钟有活动的非管理员用户数
      realtimeStats.value[1].value = data.online_customer_service
      // 3. 未读消息 - CustomerServiceSession 表中 unread_count > 0 的记录数
      realtimeStats.value[2].value = data.unread_messages
      // 4. 未分配会话 - CustomerServiceSession 表中未分配客服且状态为活跃的记录数
      realtimeStats.value[3].value = data.unassigned_sessions
      realtimeData.timestamp = data.timestamp
    }
  } catch (error) {
    console.error('加载实时数据失败:', error)
  }
}

// 图表配置计算属性
const getTrendChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: messageTrendData.value.series.map(s => s.name)
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: messageTrendData.value.categories
    },
    yAxis: {
      type: 'value'
    },
    series: messageTrendData.value.series.map(s => ({
      name: s.name,
      type: 'line',
      stack: 'Total',
      data: s.data,
      smooth: true,
      emphasis: {
        focus: 'series'
      }
    }))
  }
})

const getCSPerformanceOption = computed(() => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['效率分数', '满意度']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: csPerformanceData.value.categories
    },
    yAxis: {
      type: 'value'
    },
    series: csPerformanceData.value.series.map((s, index) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        color: index === 0 ? '#5470C6' : '#91CC75'
      }
    }))
  }
})

const getUserActivityOption = computed(() => {
  return {
    tooltip: {
      position: 'top',
      formatter: function (params) {
        return `${params.value[0]}: ${params.value[1]} - ${params.value[2]} 活跃用户`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: userActivityData.value.xAxis,
      splitArea: {
        show: true
      }
    },
    yAxis: {
      type: 'category',
      data: userActivityData.value.yAxis,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: userActivityData.value.max_value,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [{
      name: '用户活跃度',
      type: 'heatmap',
      data: userActivityData.value.data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

const getFileDistributionOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '文件类型分布',
      type: 'pie',
      radius: '50%',
      data: fileDistributionData.value,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        formatter: '{b}: {c} ({d}%)'
      }
    }]
  }
})

// 生命周期
onMounted(async () => {
  // 初始化日期范围为最近7天
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]

  // 等待DOM完全渲染
  await nextTick()

  // 延迟一点时间确保容器尺寸已经计算完成
  setTimeout(() => {
    // 加载初始数据
    refreshAllData()

    // 启动实时数据更新
    realtimeTimer.value = setInterval(loadRealtimeData, 30000)
    loadRealtimeData()
  }, 200)
})

onUnmounted(() => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value)
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.card-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-trend.positive {
  color: #67C23A;
}

.card-trend.negative {
  color: #F56C6C;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.realtime-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.realtime-stat {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 12px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .overview-card {
    padding: 16px;
    height: auto;
  }
  
  .card-icon {
    width: 48px;
    height: 48px;
  }
  
  .card-value {
    font-size: 20px;
  }
}
</style>
