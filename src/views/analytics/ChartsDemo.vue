<template>
  <div class="charts-demo">
    <div class="demo-header">
      <h1>图表组件演示</h1>
      <p>展示各种图表组件的使用方法和效果</p>
    </div>

    <el-row :gutter="20">
      <!-- 折线图演示 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>折线图演示</span>
          </template>
          <LineChart
            title="销售趋势"
            :data="lineChartData"
            :smooth="true"
            :show-area="false"
            height="300px"
          />
        </el-card>
      </el-col>

      <!-- 柱状图演示 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>柱状图演示</span>
          </template>
          <BarChart
            title="部门业绩"
            :data="barChartData"
            height="300px"
          />
        </el-card>
      </el-col>

      <!-- 饼图演示 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>饼图演示</span>
          </template>
          <PieChart
            title="市场份额"
            :data="pieChartData"
            :show-percentage="true"
            height="300px"
          />
        </el-card>
      </el-col>

      <!-- 热力图演示 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>热力图演示</span>
          </template>
          <HeatmapChart
            title="用户活跃度"
            :data="heatmapData"
            height="300px"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 控制面板 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>图表控制</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-button @click="refreshData" type="primary">刷新数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button @click="toggleAnimation">切换动画</el-button>
        </el-col>
        <el-col :span="6">
          <el-button @click="changeTheme">切换主题</el-button>
        </el-col>
        <el-col :span="6">
          <el-button @click="exportCharts">导出图表</el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { LineChart, BarChart, PieChart, HeatmapChart } from '@/components/charts'

// 折线图数据
const lineChartData = ref({
  categories: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    {
      name: '销售额',
      data: [120, 132, 101, 134, 90, 230]
    },
    {
      name: '利润',
      data: [220, 182, 191, 234, 290, 330]
    }
  ]
})

// 柱状图数据
const barChartData = ref({
  categories: ['技术部', '销售部', '市场部', '运营部', '财务部'],
  series: [
    {
      name: '完成率',
      data: [85, 92, 78, 88, 95]
    },
    {
      name: '目标值',
      data: [100, 100, 100, 100, 100]
    }
  ]
})

// 饼图数据
const pieChartData = ref([
  { name: 'Chrome', value: 335 },
  { name: 'Firefox', value: 310 },
  { name: 'Safari', value: 234 },
  { name: 'Edge', value: 135 },
  { name: 'Others', value: 86 }
])

// 热力图数据
const heatmapData = ref({
  xAxis: Array.from({ length: 24 }, (_, i) => `${i}:00`),
  yAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  data: generateHeatmapData(),
  max_value: 100
})

// 生成热力图数据
function generateHeatmapData() {
  const data = []
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 7; j++) {
      const value = Math.floor(Math.random() * 100)
      data.push([i, j, value])
    }
  }
  return data
}

// 方法
const refreshData = () => {
  // 刷新折线图数据
  lineChartData.value.series[0].data = lineChartData.value.series[0].data.map(() => 
    Math.floor(Math.random() * 300)
  )
  lineChartData.value.series[1].data = lineChartData.value.series[1].data.map(() => 
    Math.floor(Math.random() * 400)
  )
  
  // 刷新柱状图数据
  barChartData.value.series[0].data = barChartData.value.series[0].data.map(() => 
    Math.floor(Math.random() * 100)
  )
  
  // 刷新饼图数据
  pieChartData.value = pieChartData.value.map(item => ({
    ...item,
    value: Math.floor(Math.random() * 500)
  }))
  
  // 刷新热力图数据
  heatmapData.value.data = generateHeatmapData()
  
  ElMessage.success('数据已刷新')
}

const toggleAnimation = () => {
  ElMessage.info('动画切换功能演示')
}

const changeTheme = () => {
  ElMessage.info('主题切换功能演示')
}

const exportCharts = () => {
  ElMessage.success('图表导出功能演示')
}
</script>

<style scoped>
.charts-demo {
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.demo-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.demo-header p {
  font-size: 16px;
  color: #666;
}

.el-card {
  margin-bottom: 20px;
}
</style>
