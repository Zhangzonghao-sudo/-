import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// ECharts - 使用完整导入
import * as echarts from 'echarts'
import VChart from 'vue-echarts'

// 全局样式
import './styles/index.css'

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册VChart组件
app.component('VChart', VChart)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
