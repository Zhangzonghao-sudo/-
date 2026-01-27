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
    default: '折线图'
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
  smooth: {
    type: Boolean,
    default: true
  },
  showArea: {
    type: Boolean,
    default: false
  },
  colors: {
    type: Array,
    default: () => ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
  }
})

// Emits定义
const emit = defineEmits(['refresh', 'export', 'click'])

// 计算属性
const chartOption = computed(() => {
  if (!props.data || !props.data.categories || !props.data.series) {
    return {}
  }

  return {
    color: props.colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: props.data.series.map(s => s.name),
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.categories
    },
    yAxis: {
      type: 'value'
    },
    series: props.data.series.map((series) => ({
      name: series.name,
      type: 'line',
      smooth: props.smooth,
      data: series.data,
      areaStyle: props.showArea ? { opacity: 0.3 } : undefined
    }))
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
