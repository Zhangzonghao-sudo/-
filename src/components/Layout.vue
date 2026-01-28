<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="layout-header" height="60px">
      <div style="display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 20px;">
        <!-- 左侧：菜单折叠按钮和标题 -->
        <div style="display: flex; align-items: center;">
          <el-button
            text
            @click="toggleSidebar"
            style="margin-right: 20px; font-size: 18px;"
          >
            <el-icon>
              <Fold v-if="!collapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <h2 style="color: #333; margin: 0;">后台管理系统</h2>
        </div>
        
        <!-- 右侧：用户信息和操作 -->
        <div style="display: flex; align-items: center;">
          <el-dropdown @command="handleCommand">
            <span style="display: flex; align-items: center; cursor: pointer; color: #333;">
              <el-icon style="margin-right: 8px;"><User /></el-icon>
              {{ authStore.user?.username }}
              <el-icon style="margin-left: 8px;"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主体内容区域 -->
    <div class="layout-content">
      <!-- 侧边栏 -->
      <el-aside class="layout-sidebar" :width="collapsed ? '64px' : '200px'">
        <el-menu
          :default-active="activeMenu"
          :collapse="collapsed"
          :unique-opened="true"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#1890ff"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><DataBoard /></el-icon>
            <template #title>仪表板</template>
          </el-menu-item>

          <el-menu-item index="/customer-service">
            <el-icon><ChatDotRound /></el-icon>
            <template #title>客服工作台</template>
          </el-menu-item>

          <el-menu-item index="/review-management">
            <el-icon><DocumentChecked /></el-icon>
            <template #title>审核管理</template>
          </el-menu-item>

          <el-menu-item index="/report-management">
            <el-icon><WarningFilled /></el-icon>
            <template #title>举报中心</template>
          </el-menu-item>

          <el-menu-item
            v-if="authStore.isAdmin"
            index="/banner-management"
          >
            <el-icon><Picture /></el-icon>
            <template #title>轮播图管理</template>
          </el-menu-item>

          <el-menu-item
            v-if="authStore.isAdmin"
            index="/users"
          >
            <el-icon><User /></el-icon>
            <template #title>后台用户管理</template>
          </el-menu-item>

          <el-menu-item
            v-if="authStore.isAdmin"
            index="/app-users"
          >
            <el-icon><UserFilled /></el-icon>
            <template #title>APP用户管理</template>
          </el-menu-item>

          <!-- <el-menu-item
            v-if="authStore.isAdmin"
            index="/analytics"
          >
            <el-icon><TrendCharts /></el-icon>
            <template #title>数据分析</template>
          </el-menu-item> -->

          <el-menu-item
            v-if="authStore.isAdmin"
            index="/video-admin"
          >
            <el-icon><VideoPlay /></el-icon>
            <template #title>用户视频管理</template>
          </el-menu-item>

          <el-sub-menu
            v-if="authStore.isAdmin"
            index="/mall"
          >
            <template #title>
              <el-icon><Shop /></el-icon>
              <span>商城管理</span>
            </template>
            <el-menu-item index="/mall">商城概览</el-menu-item>
            <el-menu-item index="/mall/categories">分类管理</el-menu-item>
            <el-menu-item index="/mall/products">商品管理</el-menu-item>
            <el-menu-item index="/mall/orders">订单管理</el-menu-item>
            <el-menu-item index="/mall/stock-alert">库存提醒</el-menu-item>
          </el-sub-menu>


          
          <el-menu-item
            v-if="authStore.isAdmin"
            index="/log-management"
          >
            <el-icon><DocumentCopy /></el-icon>
            <template #title>高级日志管理</template>
          </el-menu-item>

          <!-- 资产管理中心 -->
          <!-- <el-menu-item
            v-if="authStore.isAdmin"
            index="/asset-management"
          >
            <el-icon><Money /></el-icon>
            <template #title>资产管理中心</template>
          </el-menu-item> -->
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'
import {
  DataBoard,
  Fold,
  Expand,
  ChatDotRound,
  VideoPlay,
  Picture,
  TrendCharts,
  User,
  UserFilled,
  Setting,
  SwitchButton,
  ArrowDown,
  Shop,
  DocumentChecked,
  DocumentCopy,
  Money,
  WarningFilled
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 侧边栏折叠状态
const collapsed = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)

// 切换侧边栏
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

// 处理下拉菜单命令
const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人资料页面
      break
    case 'settings':
      // 跳转到系统设置页面
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        // 用户取消操作
      }
      break
  }
}

// 监听路由变化，在移动端自动收起侧边栏
watch(route, () => {
  if (window.innerWidth <= 768) {
    collapsed.value = true
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  z-index: 1000;
}

.layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  width: 100%;
}

.layout-sidebar {
  background: #001529;
  transition: width 0.3s ease-in-out;
  overflow: hidden;
  border-right: 1px solid #304156;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
}

/* 菜单样式 */
.layout-sidebar .el-menu {
  border-right: none;
}

/* 折叠状态下的菜单项样式 */
.layout-sidebar .el-menu--collapse .el-menu-item {
  padding: 0 20px !important;
  text-align: center;
}

/* 折叠状态下的图标居中 */
.layout-sidebar .el-menu--collapse .el-menu-item .el-icon {
  margin-right: 0 !important;
}

/* 选中状态的菜单项 */
.layout-sidebar .el-menu-item.is-active {
  background-color: #1890ff !important;
  color: #fff !important;
}

/* 菜单项悬浮效果 */
.layout-sidebar .el-menu-item:hover {
  background-color: #263445 !important;
}

/* 确保折叠状态下选中项的宽度正确 */
.layout-sidebar .el-menu--collapse .el-menu-item.is-active {
  width: 100% !important;
}

.layout-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f0f2f5;
  width: 0; /* 强制 flex 子项收缩 */
  min-width: 0; /* 允许内容收缩 */
}

/* 移动端适配 */
@media (max-width: 768px) {
  .layout-main {
    padding: 10px;
  }
}
</style>
