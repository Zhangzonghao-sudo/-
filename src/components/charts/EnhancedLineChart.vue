<template>
  <div class="enhanced-line-chart">
    <BaseChart
      :title="title"
      :option="chartOption"
      :height="height"
      :loading="loading"
      :error="error"
      :auto-refresh="autoRefresh"
      :refresh-interval="refreshInterval"
      @refresh="handleRefresh"
      @click="handleChartClick"
    >
      <template #header-actions>
        <div class="chart-controls">
          <el-select v-model="timeRange" size="small" @change="handleTimeRangeChange">
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
            <el-option label="最近90天" value="90d" />
          </el-select>
          
          <el-select v-model="groupBy" size="small" @change="handleGroupByChange">
            <el-option label="按小时" value="hour" />
            <el-option label="按天" value="day" />
            <el-option label="按周" value="week" />
          </el-select>
          
          <el-button-group size="small">
            <el-button @click="toggleDataZoom" :type="dataZoomEnabled ? 'primary' : ''">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button @click="resetZoom">
              <el-icon><RefreshLeft /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </template>
    </BaseChart>
    
    <!-- 数据详情弹窗 -->
    <el-dialog v-model="detailVisible" title="数据详情" width="600px">
      <div class="data-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间点">{{ selectedData.time }}</el-descriptions-item>
          <el-descriptions-item label="数据类型">{{ selectedData.seriesName }}</el-descriptions-item>
          <el-descriptions-item label="数值">{{ selectedData.value }}</el-descriptions-item>
          <el-descriptions-item label="增长率">{{ selectedData.growth }}%</el-descriptions-item>
        </el-descriptions>
        
        <div class="trend-analysis" v-if="trendAnalysis">
          <h4>趋势分析</h4>
          <el-tag :type="trendAnalysis.type">{{ trendAnalysis.description }}</el-tag>
          <p>{{ trendAnalysis.suggestion }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ZoomIn, RefreshLeft } from '@element-plus/icons-vue'
import BaseChart from './BaseChart.vue'

const props = defineProps({
  title: String,
  data: {
    type: Object,
    default: () => ({ categories: [], series: [] })
  },
  height: {
    type: String,
    default: '400px'
  },
  loading: Boolean,
  error: String,
  autoRefresh: Boolean,
  refreshInterval: Number,
  showControls: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['refresh', 'timeRangeChange', 'groupByChange'])

// 响应式数据
const timeRange = ref('7d')
const groupBy = ref('day')
const dataZoomEnabled = ref(false)
const detailVisible = ref(false)
const selectedData = ref({})

// 计算属性
const chartOption = computed(() => {
  if (!props.data || !props.data.categories || props.data.categories.length === 0) {
    return {}
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function(params) {
        let result = `<div style="margin-bottom: 8px; font-weight: bold;">${params[0].axisValue}</div>`
        params.forEach(param => {
          const growth = calculateGrowth(param.dataIndex, param.seriesIndex)
          result += `
            <div style="margin: 4px 0;">
              ${param.marker} ${param.seriesName}: <strong>${param.value}</strong>
              <span style="color: ${growth >= 0 ? '#67C23A' : '#F56C6C'}; margin-left: 8px;">
                ${growth >= 0 ? '↗' : '↘'} ${Math.abs(growth).toFixed(1)}%
              </span>
            </div>
          `
        })
        return result
      }
    },
    legend: {
      data: props.data.series?.map(s => s.name) || [],
      top: 10,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: dataZoomEnabled.value ? '15%' : '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.categories || [],
      axisLabel: {
        rotate: timeRange.value === '90d' ? 45 : 0,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: (props.data.series || []).map((series, index) => ({
      name: series.name,
      type: 'line',
      data: series.data || [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.1
      },
      emphasis: {
        focus: 'series',
        blurScope: 'coordinateSystem'
      },
      markPoint: {
        data: [
          { type: 'max', name: '最大值' },
          { type: 'min', name: '最小值' }
        ]
      },
      markLine: {
        data: [
          { type: 'average', name: '平均值' }
        ]
      }
    }))
  }

  // 添加数据缩放
  if (dataZoomEnabled.value) {
    option.dataZoom = [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 30
      }
    ]
  }

  return option
})

// 趋势分析
const trendAnalysis = computed(() => {
  if (!selectedData.value.value) return null

  const growth = selectedData.value.growth || 0
  let type = 'info'
  let description = '数据平稳'
  let suggestion = '当前数据变化在正常范围内'

  if (growth > 20) {
    type = 'success'
    description = '快速增长'
    suggestion = '数据呈现良好的增长趋势，建议继续保持当前策略'
  } else if (growth > 5) {
    type = 'success'
    description = '稳定增长'
    suggestion = '数据稳步上升，可以考虑进一步优化提升'
  } else if (growth < -20) {
    type = 'danger'
    description = '快速下降'
    suggestion = '数据下降明显，需要及时分析原因并采取措施'
  } else if (growth < -5) {
    type = 'warning'
    description = '轻微下降'
    suggestion = '数据有下降趋势，建议关注并分析原因'
  }

  return { type, description, suggestion }
})

// 方法
const handleRefresh = () => {
  emit('refresh')
}

const handleTimeRangeChange = (value) => {
  emit('timeRangeChange', value)
}

const handleGroupByChange = (value) => {
  emit('groupByChange', value)
}

const toggleDataZoom = () => {
  dataZoomEnabled.value = !dataZoomEnabled.value
}

const resetZoom = () => {
  // 重置缩放
  dataZoomEnabled.value = false
}

const handleChartClick = (params) => {
  if (params.componentType === 'series') {
    const growth = calculateGrowth(params.dataIndex, params.seriesIndex)
    selectedData.value = {
      time: params.name,
      seriesName: params.seriesName,
      value: params.value,
      growth: growth
    }
    detailVisible.value = true
  }
}

const calculateGrowth = (dataIndex, seriesIndex) => {
  if (!props.data.series || !props.data.series[seriesIndex] || dataIndex === 0) {
    return 0
  }

  const currentValue = props.data.series[seriesIndex].data[dataIndex]
  const previousValue = props.data.series[seriesIndex].data[dataIndex - 1]

  if (previousValue === 0) return 0

  return ((currentValue - previousValue) / previousValue) * 100
}

// 监听器
watch(() => props.data, () => {
  // 数据更新时重置缩放
  if (dataZoomEnabled.value) {
    dataZoomEnabled.value = false
  }
}, { deep: true })
</script>

<style scoped>
.enhanced-line-chart {
  position: relative;
}

.chart-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.data-detail {
  padding: 16px 0;
}

.trend-analysis {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.trend-analysis h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.trend-analysis p {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: 4px;
  }
}
</style>