<template>
  <div class="chart-container">
    <div class="chart-header" v-if="title">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-actions">
        <el-button-group size="small">
          <el-button @click="refreshChart" :loading="loading">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="exportChart">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <div class="chart-content" :class="{ 'fullscreen': isFullscreen }">
      <div v-if="loading" class="chart-loading">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
          </template>
        </el-skeleton>
      </div>
      
      <div v-else-if="error" class="chart-error">
        <el-empty description="图表加载失败">
          <el-button type="primary" @click="refreshChart">重新加载</el-button>
        </el-empty>
      </div>
      
      <v-chart
        v-else-if="chartReady && Object.keys(chartOption).length > 0"
        ref="chartRef"
        :option="chartOption"
        :style="{ width: '100%', height: height }"
        :autoresize="true"
        :init-options="{ renderer: 'canvas' }"
        @click="handleChartClick"
        @mouseover="handleChartMouseover"
        @mouseout="handleChartMouseout"
      />

      <div v-else-if="!loading && !error && chartReady && Object.keys(chartOption).length === 0" class="chart-empty">
        <el-empty description="暂无数据">
          <el-button type="primary" @click="refreshChart">重新加载</el-button>
        </el-empty>
      </div>

      <div v-else-if="!loading && !error && !chartReady" class="chart-loading">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
          </template>
        </el-skeleton>
      </div>
    </div>
    
    <!-- 全屏遮罩 -->
    <div v-if="isFullscreen" class="fullscreen-overlay" @click="toggleFullscreen">
      <div class="fullscreen-chart" @click.stop>
        <div class="fullscreen-header">
          <h3>{{ title }}</h3>
          <el-button @click="toggleFullscreen" circle>
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <v-chart
          :option="chartOption"
          style="width: 100%; height: calc(100% - 60px)"
          :autoresize="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import VChart from 'vue-echarts'
import { Refresh, Download, FullScreen, Close } from '@element-plus/icons-vue'

// Props定义
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  option: {
    type: Object,
    required: true
  },
  height: {
    type: String,
    default: '400px'
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  autoRefresh: {
    type: Boolean,
    default: false
  },
  refreshInterval: {
    type: Number,
    default: 30000 // 30秒
  }
})

// Emits定义
const emit = defineEmits(['refresh', 'export', 'click', 'mouseover', 'mouseout'])

// 响应式数据
const chartRef = ref(null)
const isFullscreen = ref(false)
const refreshTimer = ref(null)
const chartReady = ref(false)

// 计算属性
const chartOption = computed(() => {
  // 如果没有配置或配置为空对象，返回空配置
  if (!props.option || Object.keys(props.option).length === 0) {
    return {}
  }

  // 合并默认配置和传入的配置
  const defaultOption = {
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif'
    },
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  }

  return { ...defaultOption, ...props.option }
})

// 方法
const refreshChart = () => {
  emit('refresh')
}

const exportChart = () => {
  if (chartRef.value) {
    const chart = chartRef.value
    const url = chart.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = `${props.title || 'chart'}_${new Date().getTime()}.png`
    link.href = url
    link.click()
  }
  emit('export')
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleChartClick = (params) => {
  emit('click', params)
}

const handleChartMouseover = (params) => {
  emit('mouseover', params)
}

const handleChartMouseout = (params) => {
  emit('mouseout', params)
}

// 自动刷新
const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer.value = setInterval(() => {
      refreshChart()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 监听器
watch(() => props.autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// 监听option变化，确保图表正确渲染
watch(() => props.option, (newOption) => {
  if (newOption && Object.keys(newOption).length > 0 && chartReady.value) {
    // 确保在下一个tick中处理
    nextTick(() => {
      // 如果图表还没准备好，延迟处理
      if (!chartReady.value) {
        setTimeout(() => {
          chartReady.value = true
        }, 100)
      }
    })
  }
}, { deep: true, immediate: false })

// 生命周期
onMounted(async () => {
  // 等待DOM完全渲染
  await nextTick()

  // 再等待一个微任务，确保容器尺寸已经计算完成
  setTimeout(() => {
    chartReady.value = true
  }, 100)

  if (props.autoRefresh && props.refreshInterval > 0) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.chart-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.chart-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-content {
  position: relative;
  padding: 20px;
}

.chart-loading,
.chart-error,
.chart-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fullscreen-chart {
  width: 90%;
  height: 90%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.fullscreen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.fullscreen-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .chart-content {
    padding: 12px;
  }
  
  .fullscreen-chart {
    width: 95%;
    height: 95%;
  }
}
</style>
