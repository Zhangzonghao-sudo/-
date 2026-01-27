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
    default: '柱状图'
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
  horizontal: {
    type: Boolean,
    default: false
  },
  stack: {
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
  if (!props.data) {
    return {}
  }

  // 处理不同的数据格式
  let categories, series
  
  if (props.data.categories && props.data.series) {
    // 标准格式：{ categories: [], series: [] }
    categories = props.data.categories
    series = props.data.series
  } else if (Array.isArray(props.data)) {
    // 简单数组格式：[{ name: '', value: '' }]
    categories = props.data.map(item => item.name)
    series = [{
      name: '数值',
      data: props.data.map(item => item.value)
    }]
  } else {
    return {}
  }

  const option = {
    color: props.colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: series.map(s => s.name),
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    }
  }

  if (props.horizontal) {
    // 水平柱状图
    option.xAxis = {
      type: 'value'
    }
    option.yAxis = {
      type: 'category',
      data: categories
    }
  } else {
    // 垂直柱状图
    option.xAxis = {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: categories.length > 8 ? 45 : 0
      }
    }
    option.yAxis = {
      type: 'value'
    }
  }

  option.series = series.map((s, index) => ({
    name: s.name,
    type: 'bar',
    data: s.data,
    stack: props.stack ? 'total' : undefined,
    emphasis: {
      focus: 'series'
    },
    itemStyle: {
      borderRadius: props.horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
    }
  }))

  return option
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
