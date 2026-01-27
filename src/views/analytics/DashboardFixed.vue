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
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6" v-for="card in overviewCards" :key="card.key">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-icon" :style="{ backgroundColor: card.color }">
                <el-icon><component :is="getIconComponent(card.icon)" /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ card.value }}</div>
                <div class="card-title">{{ card.title }}</div>
                <div class="card-trend" v-if="card.trend !== 0">
                  <el-icon v-if="card.trend > 0" class="trend-up">
                    <component :is="getIconComponent('up')" />
                  </el-icon>
                  <el-icon v-else class="trend-down">
                    <component :is="getIconComponent('down')" />
                  </el-icon>
                  <span>{{ Math.abs(card.trend) }}%</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 消息趋势 -->
      <el-col :span="24" class="chart-card">
        <el-card :loading="loadingStates.messageTrend">
          <template #header>
            <div class="card-header">
              <span>消息趋势</span>
              <el-button link type="primary" size="small" @click="loadMessageTrend">刷新</el-button>
            </div>
          </template>
          <div class="chart-container" style="height: 400px;">
            <div v-if="messageTrendData.categories.length === 0" class="chart-placeholder">
              <div class="placeholder-content">
                <el-icon><Document /></el-icon>
                <p>暂无数据</p>
              </div>
            </div>
            <div v-else ref="trendChart" style="width: 100%; height: 100%;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 客服绩效 -->
      <el-col :span="12" class="chart-card">
        <el-card :loading="loadingStates.csPerformance">
          <template #header>
            <div class="card-header">
              <span>客服绩效</span>
              <el-button link type="primary" size="small" @click="loadCSPerformance">刷新</el-button>
            </div>
          </template>
          <div class="chart-container" style="height: 350px;">
            <div v-if="csPerformanceData.categories.length === 0" class="chart-placeholder">
              <div class="placeholder-content">
                <el-icon><User /></el-icon>
                <p>暂无数据</p>
              </div>
            </div>
            <div v-else ref="csChart" style="width: 100%; height: 100%;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 用户活跃度 -->
      <el-col :span="12" class="chart-card">
        <el-card :loading="loadingStates.userActivity">
          <template #header>
            <div class="card-header">
              <span>用户活跃度</span>
              <el-button link type="primary" size="small" @click="loadUserActivity">刷新</el-button>
            </div>
          </template>
          <div class="chart-container" style="height: 350px;">
            <div v-if="userActivityData.data.length === 0" class="chart-placeholder">
              <div class="placeholder-content">
                <el-icon><Timer /></el-icon>
                <p>暂无数据</p>
              </div>
            </div>
            <div v-else ref="activityChart" style="width: 100%; height: 100%;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 文件分布 -->
      <el-col :span="12" class="chart-card">
        <el-card :loading="loadingStates.fileDistribution">
          <template #header>
            <div class="card-header">
              <span>文件分布</span>
              <el-button link type="primary" size="small" @click="loadFileDistribution">刷新</el-button>
            </div>
          </template>
          <div class="chart-container" style="height: 350px;">
            <div v-if="fileDistributionData.length === 0" class="chart-placeholder">
              <div class="placeholder-content">
                <el-icon><Document /></el-icon>
                <p>暂无数据</p>
              </div>
            </div>
            <div v-else ref="fileChart" style="width: 100%; height: 100%;"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 实时统计数据 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>实时统计数据</span>
              <el-tag :type="realtimeData.status === 'normal' ? 'success' : 'warning'">
                运行正常
              </el-tag>
            </div>
          </template>
          <div class="realtime-stats">
            <div class="stat-item" v-for="stat in realtimeStats" :key="stat.key">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
/**
 * 数据分析仪表板组件 - 修复版本
 * 创建时间: 2025-09-10
 * 创建人: zzh
 * 功能: 提供数据分析和可视化功能，修复了图表渲染问题
 */

import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Message, User, Document, Timer, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { analyticsAPI } from '@/api/analytics'

// 状态管理
const globalLoading = ref(false)
const dateRange = ref([])
const realtimeTimer = ref(null)

// 图表实例
const trendChart = ref(null)
const csChart = ref(null)
const activityChart = ref(null)
const fileChart = ref(null)

const trendChartInstance = ref(null)
const csChartInstance = ref(null)
const activityChartInstance = ref(null)
const fileChartInstance = ref(null)

// 加载状态
const loadingStates = reactive({
  overview: false,
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
const messageTrendData = ref({
  categories: [],
  series: []
})

const csPerformanceData = ref({
  categories: [],
  series: []
})

const userActivityData = ref({
  data: []
})

const fileDistributionData = ref([])

// 方法
const getIconComponent = (iconName) => {
  const iconMap = {
    message: Message,
    user: User,
    document: Document,
    timer: Timer,
    up: ArrowUp,
    down: ArrowDown
  }
  return iconMap[iconName] || Document
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    // 初始化消息趋势图表
    if (trendChart.value && messageTrendData.value.categories.length > 0) {
      if (trendChartInstance.value) {
        trendChartInstance.value.dispose()
      }
      trendChartInstance.value = echarts.init(trendChart.value)
      
      const option = {
        title: {
          text: '消息趋势分析',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: messageTrendData.value.series.map(s => s.name),
          top: 30
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: messageTrendData.value.categories
        },
        yAxis: {
          type: 'value'
        },
        series: messageTrendData.value.series.map(s => ({
          ...s,
          type: 'line',
          smooth: true
        }))
      }
      
      trendChartInstance.value.setOption(option)
    }

    // 初始化客服绩效图表
    if (csChart.value && csPerformanceData.value.categories.length > 0) {
      if (csChartInstance.value) {
        csChartInstance.value.dispose()
      }
      csChartInstance.value = echarts.init(csChart.value)
      
      const option = {
        title: {
          text: '客服绩效分析',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: csPerformanceData.value.series.map(s => s.name),
          top: 30
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
        series: csPerformanceData.value.series.map(s => ({
          ...s,
          type: 'bar'
        }))
      }
      
      csChartInstance.value.setOption(option)
    }

    // 初始化用户活跃度图表
    if (activityChart.value) {
      try {
        if (activityChartInstance.value) {
          activityChartInstance.value.dispose()
        }
        activityChartInstance.value = echarts.init(activityChart.value)
        
        // 确保数据格式正确
        const heatmapData = userActivityData.value.data || []
        
        // 计算visualMap的最大值
        const maxValue = heatmapData.length > 0 ? Math.max(...heatmapData.map(item => item[2] || 0)) : 10
        
        const option = {
          title: {
            text: '用户活跃度热力图',
            left: 'center'
          },
          tooltip: {
            position: 'top',
            formatter: function (params) {
              const hour = params.data[0]
              const day = params.data[1]
              const value = params.data[2]
              const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
              return `${dayNames[day]} ${hour}:00<br/>活跃度: ${value}`
            }
          },
          grid: {
            height: '50%',
            top: '10%'
          },
          xAxis: {
            type: 'category',
            data: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'],
            splitArea: {
              show: true
            }
          },
          yAxis: {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            splitArea: {
              show: true
            }
          },
          visualMap: {
            min: 0,
            max: Math.max(maxValue, 1),
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%',
            inRange: {
              color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
          },
          series: [{
            name: '用户活跃度',
            type: 'heatmap',
            data: heatmapData,
            label: {
              show: heatmapData.length < 50 // 数据少时显示标签
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        }
        
        activityChartInstance.value.setOption(option)
      } catch (error) {
        console.error('用户活跃度图表初始化失败:', error)
      }
    }

    // 初始化文件分布图表
    if (fileChart.value && fileDistributionData.value.length > 0) {
      if (fileChartInstance.value) {
        fileChartInstance.value.dispose()
      }
      fileChartInstance.value = echarts.init(fileChart.value)
      
      const option = {
        title: {
          text: '文件类型分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '文件分布',
            type: 'pie',
            radius: '50%',
            data: fileDistributionData.value,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      fileChartInstance.value.setOption(option)
    }
  })
}

// 数据加载方法
const refreshAllData = async () => {
  globalLoading.value = true
  try {
    await Promise.all([
      loadOverviewData(),
      loadMessageTrend(),
      loadCSPerformance(),
      loadUserActivity(),
      loadFileDistribution()
    ])
    
    // 数据加载完成后初始化图表
    setTimeout(() => {
      initCharts()
    }, 100)
    
  } catch (error) {
    console.error('数据加载失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    globalLoading.value = false
  }
}

const loadOverviewData = async () => {
  loadingStates.overview = true
  try {
    const response = await analyticsAPI.getDashboardOverview()
    if (response.success && response.data) {
      const data = response.data
      
      // 处理不同的数据结构
      overviewCards.value.forEach(card => {
        if (data[card.key] !== undefined) {
          // 如果是对象结构 {value: x, trend: y}
          if (typeof data[card.key] === 'object' && data[card.key] !== null) {
            card.value = data[card.key].value || '0'
            card.trend = data[card.key].trend || 0
          } 
          // 如果是直接的数值
          else {
            card.value = String(data[card.key])
            card.trend = 0
          }
        }
      })
      
      // 实时更新概览卡片数据
      if (data.messages !== undefined) {
        overviewCards.value[0].value = String(data.messages)
      }
      if (data.sessions !== undefined) {
        overviewCards.value[1].value = String(data.sessions)
      }
      if (data.files !== undefined) {
        overviewCards.value[2].value = String(data.files)
      }
      if (data.response_time !== undefined) {
        overviewCards.value[3].value = data.response_time + '分钟'
      }
    }
  } catch (error) {
    console.error('概览数据加载失败:', error)
    // 重置为默认值
    overviewCards.value.forEach(card => {
      card.value = '0'
      card.trend = 0
    })
  } finally {
    loadingStates.overview = false
  }
}

const loadMessageTrend = async () => {
  loadingStates.messageTrend = true
  try {
    const response = await analyticsAPI.getMessageTrend()
    
    if (response.success && response.data && response.data.chart_data) {
      // 确保数据结构正确
      messageTrendData.value = {
        categories: response.data.chart_data.categories || [],
        series: response.data.chart_data.series || []
      }
    } else {
      // 如果没有数据，设置空数组
      messageTrendData.value = {
        categories: [],
        series: []
      }
    }
  } catch (error) {
    console.error('消息趋势数据加载失败:', error)
    messageTrendData.value = {
      categories: [],
      series: []
    }
  } finally {
    loadingStates.messageTrend = false
  }
}

const loadCSPerformance = async () => {
  loadingStates.csPerformance = true
  try {
    const response = await analyticsAPI.getCSPerformance()
    if (response.success && response.data && response.data.chart_data) {
      csPerformanceData.value = {
        categories: response.data.chart_data.categories || [],
        series: response.data.chart_data.series || []
      }
    } else {
      csPerformanceData.value = {
        categories: [],
        series: []
      }
    }
  } catch (error) {
    console.error('客服绩效数据加载失败:', error)
    csPerformanceData.value = {
      categories: [],
      series: []
    }
  } finally {
    loadingStates.csPerformance = false
  }
}

const loadUserActivity = async () => {
  loadingStates.userActivity = true
  try {
    const response = await analyticsAPI.getUserActivity()
    if (response.success && response.data) {
      // 用户活跃度数据可能直接在data中，也可能在chart_data中
      const activityData = response.data.chart_data ? response.data.chart_data.data : response.data.data
      
      // 确保数据格式正确 - 热力图需要 [x, y, value] 格式
      let formattedData = []
      if (Array.isArray(activityData)) {
        formattedData = activityData.map(item => {
          // 如果已经是正确格式 [x, y, value]
          if (Array.isArray(item) && item.length === 3) {
            return item
          }
          // 如果是对象格式 {hour: x, day: y, value: z}
          if (typeof item === 'object' && item !== null) {
            return [item.hour || 0, item.day || 0, item.value || 0]
          }
          return [0, 0, 0]
        })
      }
      
      userActivityData.value = {
        data: formattedData
      }
    } else {
      userActivityData.value = {
        data: []
      }
    }
  } catch (error) {
    console.error('用户活跃度数据加载失败:', error)
    userActivityData.value = {
      data: []
    }
  } finally {
    loadingStates.userActivity = false
  }
}

const loadFileDistribution = async () => {
  loadingStates.fileDistribution = true
  try {
    const response = await analyticsAPI.getFileDistribution()
    if (response.success && response.data) {
      // 文件分布数据可能直接在data中，也可能在chart_data中
      const distributionData = response.data.chart_data ? response.data.chart_data : response.data
      fileDistributionData.value = Array.isArray(distributionData) ? distributionData : []
    } else {
      fileDistributionData.value = []
    }
  } catch (error) {
    console.error('文件分布数据加载失败:', error)
    fileDistributionData.value = []
  } finally {
    loadingStates.fileDistribution = false
  }
}

const loadRealtimeData = async () => {
  try {
    const response = await analyticsAPI.getRealtimeStats()
    console.log('实时数据API响应:', response)
    if (response.success && response.data) {
      const data = response.data
      console.log('实时数据详细内容:', data)
      
      // 更新实时统计数据
      realtimeStats.value.forEach(stat => {
        if (data[stat.key] !== undefined) {
          stat.value = data[stat.key]
        }
      })
      
      // 同时更新概览卡片的实时数据
      if (data.messages !== undefined) {
        overviewCards.value[0].value = String(data.messages)
      }
      if (data.sessions !== undefined || data.active_sessions !== undefined) {
        overviewCards.value[1].value = String(data.sessions || data.active_sessions)
      }
      if (data.files !== undefined) {
        overviewCards.value[2].value = String(data.files)
      }
      if (data.response_time !== undefined) {
        overviewCards.value[3].value = data.response_time + '分钟'
      }
      
      realtimeData.timestamp = new Date().toLocaleString()
    }
  } catch (error) {
    console.error('实时数据加载失败:', error)
  }
}

const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    refreshAllData()
  }
}

// 监听数据变化，重新初始化图表
watch([messageTrendData, csPerformanceData, userActivityData, fileDistributionData], () => {
  nextTick(() => {
    initCharts()
  })
}, { deep: true })

// 生命周期
onMounted(() => {
  // 延迟加载确保DOM完全渲染
  setTimeout(() => {
    refreshAllData()
  }, 500)
})

onUnmounted(() => {

  // 销毁图表实例
  if (trendChartInstance.value) {
    trendChartInstance.value.dispose()
  }
  if (csChartInstance.value) {
    csChartInstance.value.dispose()
  }
  if (activityChartInstance.value) {
    activityChartInstance.value.dispose()
  }
  if (fileChartInstance.value) {
    fileChartInstance.value.dispose()
  }
})
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
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
  height: 120px;
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.card-icon .el-icon {
  font-size: 24px;
  color: white;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.card-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #67C23A;
}

.trend-up {
  color: #67C23A;
}

.trend-down {
  color: #F56C6C;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  position: relative;
  width: 100%;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  border: 1px dashed #e4e7ed;
  border-radius: 4px;
}

.placeholder-content {
  text-align: center;
  color: #909399;
}

.placeholder-content .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-content p {
  margin: 0;
  font-size: 14px;
}

.realtime-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}
</style>