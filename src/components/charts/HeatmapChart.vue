<template>
  <BaseChart
    :title="title"
    :option="chartOption"
    :height="height"
    :loading="loading"
    :error="error"
    :auto-refresh="autoRefresh"
    :refresh-interval="refreshInterval"
    @refresh="handleRefresh"
    @export="handleExport"
    @click="handleClick"
  />
</template>

<script setup>
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'

// Props定义
const props = defineProps({
  title: {
    type: String,
    default: '热力图'
  },
  data: {
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
    default: 30000
  },
  colorRange: {
    type: Array,
    default: () => ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
  }
})

// Emits定义
const emit = defineEmits(['refresh', 'export', 'click'])

// 计算属性
const chartOption = computed(() => {
  if (!props.data || !props.data.data || !props.data.xAxis || !props.data.yAxis) {
    return {}
  }

  // 确保数据不为空且有有效值
  if (!Array.isArray(props.data.data) || props.data.data.length === 0) {
    return {}
  }

  return {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const xLabel = props.data.xAxis[params.value[0]]
        const yLabel = props.data.yAxis[params.value[1]]
        const value = params.value[2]
        return `${xLabel} ${yLabel}<br/>数值: ${value}`
      }
    },
    grid: {
      height: '60%',
      top: '10%',
      left: '10%',
      right: '10%'
    },
    xAxis: {
      type: 'category',
      data: props.data.xAxis,
      splitArea: {
        show: true
      },
      axisLabel: {
        rotate: props.data.xAxis.length > 12 ? 45 : 0
      }
    },
    yAxis: {
      type: 'category',
      data: props.data.yAxis,
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: props.data.max_value || Math.max(...props.data.data.map(item => item[2] || 0)) || 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: props.colorRange
      }
    },
    series: [
      {
        name: props.title,
        type: 'heatmap',
        data: props.data.data,
        label: {
          show: true,
          formatter: (params) => {
            return params.value[2] > 0 ? params.value[2] : ''
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
})

// 方法
const handleRefresh = () => {
  emit('refresh')
}

const handleExport = () => {
  emit('export')
}

const handleClick = (params) => {
  emit('click', params)
}
</script>
