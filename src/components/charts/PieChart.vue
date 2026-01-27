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
    default: '饼图'
  },
  data: {
    type: Array,
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
  donut: {
    type: Boolean,
    default: false
  },
  showPercentage: {
    type: Boolean,
    default: true
  },
  colors: {
    type: Array,
    default: () => ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
  }
})

// Emits定义
const emit = defineEmits(['refresh', 'export', 'click'])

// 计算属性
const chartOption = computed(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) {
    return {}
  }

  // 验证数据格式
  const validData = props.data.filter(item =>
    item && typeof item === 'object' &&
    item.name && (typeof item.value === 'number' && !isNaN(item.value))
  )

  if (validData.length === 0) {
    return {}
  }

  return {
    color: props.colors,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const percentage = props.showPercentage ? ` (${params.percent}%)` : ''
        return `${params.marker} ${params.name}: ${params.value}${percentage}`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      data: validData.map(item => item.name)
    },
    series: [
      {
        name: props.title,
        type: 'pie',
        radius: props.donut ? ['40%', '70%'] : '70%',
        center: ['60%', '50%'],
        data: validData.map(item => ({
          name: item.name,
          value: item.value
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: (params) => {
            if (props.showPercentage) {
              return `${params.name}\n${params.percent}%`
            }
            return params.name
          }
        },
        labelLine: {
          show: true
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
