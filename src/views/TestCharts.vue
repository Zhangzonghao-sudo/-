<template>
  <div class="test-charts">
    <h1>图表组件测试</h1>
    
    <el-row :gutter="20">
      <!-- 折线图测试 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>折线图测试</span>
          </template>
          <LineChart
            title="测试折线图"
            :data="lineChartData"
            height="300px"
          />
        </el-card>
      </el-col>
      
      <!-- 柱状图测试 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>柱状图测试</span>
          </template>
          <BarChart
            title="测试柱状图"
            :data="barChartData"
            height="300px"
          />
        </el-card>
      </el-col>
      
      <!-- 饼图测试 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>饼图测试</span>
          </template>
          <PieChart
            title="测试饼图"
            :data="pieChartData"
            height="300px"
          />
        </el-card>
      </el-col>
      
      <!-- 热力图测试 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>热力图测试</span>
          </template>
          <HeatmapChart
            title="测试热力图"
            :data="heatmapData"
            height="300px"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { LineChart, BarChart, PieChart, HeatmapChart } from '@/components/charts'

// 测试数据
const lineChartData = ref({
  categories: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    {
      name: '消息数',
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '会话数',
      data: [220, 182, 191, 234, 290, 330, 310]
    }
  ]
})

const barChartData = ref({
  categories: ['客服A', '客服B', '客服C', '客服D'],
  series: [
    {
      name: '处理会话数',
      data: [45, 38, 52, 41]
    },
    {
      name: '满意度',
      data: [85, 92, 78, 88]
    }
  ]
})

const pieChartData = ref([
  { name: '图片', value: 335 },
  { name: '文档', value: 310 },
  { name: '视频', value: 234 },
  { name: '音频', value: 135 },
  { name: '其他', value: 48 }
])

const heatmapData = ref({
  xAxis: ['0时', '2时', '4时', '6时', '8时', '10时', '12时', '14时', '16时', '18时', '20时', '22时'],
  yAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  data: [
    [0, 0, 5], [0, 1, 1], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0],
    [0, 6, 0], [0, 7, 0], [0, 8, 0], [0, 9, 0], [0, 10, 0], [0, 11, 0],
    [1, 0, 1], [1, 1, 0], [1, 2, 0], [1, 3, 0], [1, 4, 0], [1, 5, 0],
    [1, 6, 0], [1, 7, 0], [1, 8, 0], [1, 9, 0], [1, 10, 0], [1, 11, 0],
    [2, 0, 2], [2, 1, 2], [2, 2, 5], [2, 3, 4], [2, 4, 2], [2, 5, 4],
    [2, 6, 2], [2, 7, 4], [2, 8, 2], [2, 9, 4], [2, 10, 3], [2, 11, 4],
    [3, 0, 7], [3, 1, 3], [3, 2, 0], [3, 3, 0], [3, 4, 0], [3, 5, 0],
    [3, 6, 0], [3, 7, 0], [3, 8, 0], [3, 9, 0], [3, 10, 5], [3, 11, 4],
    [4, 0, 6], [4, 1, 4], [4, 2, 0], [4, 3, 0], [4, 4, 0], [4, 5, 0],
    [4, 6, 0], [4, 7, 0], [4, 8, 0], [4, 9, 0], [4, 10, 3], [4, 11, 1],
    [5, 0, 1], [5, 1, 3], [5, 2, 2], [5, 3, 0], [5, 4, 0], [5, 5, 0],
    [5, 6, 0], [5, 7, 0], [5, 8, 0], [5, 9, 0], [5, 10, 0], [5, 11, 0],
    [6, 0, 2], [6, 1, 1], [6, 2, 1], [6, 3, 0], [6, 4, 0], [6, 5, 0],
    [6, 6, 0], [6, 7, 0], [6, 8, 0], [6, 9, 0], [6, 10, 0], [6, 11, 0]
  ],
  max_value: 7
})
</script>

<style scoped>
.test-charts {
  padding: 20px;
}

.el-card {
  margin-bottom: 20px;
}
</style>
