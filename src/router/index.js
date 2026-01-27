import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// 路由组件
const Login = () => import('@/views/Login.vue')
const Layout = () => import('@/components/Layout.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const UserManagement = () => import('@/views/UserManagement.vue')
const CustomerService = () => import('@/views/CustomerService.vue')
const VideoReview = () => import('@/views/video/VideoReview.vue')
const VideoAdmin = () => import('@/views/video/VideoAdmin.vue')
const ReviewManagement = () => import('@/views/ReviewManagement.vue')
const BannerManagement = () => import('@/views/admin/BannerManagement.vue')
const AnalyticsDashboard = () => import('@/views/analytics/DashboardFixed.vue')
const TestCharts = () => import('@/views/TestCharts.vue')
const SystemLogs = () => import('@/views/SystemLogs.vue')
const LogManagement = () => import('@/views/LogManagement.vue')
const MallManagement = () => import('@/views/mall/MallManagement.vue')
const CategoryManagement = () => import('@/views/mall/CategoryManagement.vue')
const ProductManagement = () => import('@/views/mall/ProductManagement.vue')
const OrderManagement = () => import('@/views/mall/OrderManagement.vue')
const OrderDetail = () => import('@/views/mall/OrderDetail.vue')
const StockAlert = () => import('@/views/mall/StockAlert.vue')
const AppUserManagement = () => import('@/views/user/AppUserManagement.vue')
const AssetManagement = () => import('@/views/AssetManagement.vue')
const ReportManagement = () => import('@/views/report/ReportManagement.vue')
const NotFound = () => import('@/views/NotFound.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '仪表板',
          icon: 'Dashboard',
          requiresAuth: true
        }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          title: '后台用户管理',
          icon: 'User',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'app-users',
        name: 'AppUserManagement',
        component: AppUserManagement,
        meta: {
          title: 'APP用户管理',
          icon: 'UserFilled',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'customer-service',
        name: 'CustomerService',
        component: CustomerService,
        meta: {
          title: '客服工作台',
          icon: 'ChatDotRound',
          requiresAuth: true
        }
      },
      {
        path: 'video-review',
        name: 'VideoReview',
        component: VideoReview,
        meta: {
          title: '视频审核',
          icon: 'VideoPlay',
          requiresAuth: true
        }
      },
      {
        path: 'review-management',
        name: 'ReviewManagement',
        component: ReviewManagement,
        meta: {
          title: '审核管理',
          icon: 'DocumentChecked',
          requiresAuth: true
        }
      },
      {
        path: 'video-admin',
        name: 'VideoAdmin',
        component: VideoAdmin,
        meta: {
          title: '用户视频管理',
          icon: 'VideoPlay',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'banner-management',
        name: 'BannerManagement',
        component: BannerManagement,
        meta: {
          title: '轮播图管理',
          icon: 'Picture',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: AnalyticsDashboard,
        meta: {
          title: '数据分析',
          icon: 'TrendCharts',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'mall',
        name: 'MallManagement',
        component: MallManagement,
        meta: {
          title: '商城管理',
          icon: 'Shop',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'mall/categories',
        name: 'CategoryManagement',
        component: CategoryManagement,
        meta: {
          title: '分类管理',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'mall/products',
        name: 'ProductManagement',
        component: ProductManagement,
        meta: {
          title: '商品管理',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'mall/orders',
        name: 'OrderManagement',
        component: OrderManagement,
        meta: {
          title: '订单管理',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'mall/orders/:id',
        name: 'OrderDetail',
        component: OrderDetail,
        meta: {
          title: '订单详情',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'mall/stock-alert',
        name: 'StockAlert',
        component: StockAlert,
        meta: {
          title: '库存提醒',
          icon: 'Warning',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'test-charts',
        name: 'TestCharts',
        component: TestCharts,
        meta: {
          title: '图表测试',
          icon: 'DataBoard',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'system-logs',
        name: 'SystemLogs',
        component: SystemLogs,
        meta: {
          title: '系统日志',
          icon: 'Document',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'log-management',
        name: 'LogManagement',
        component: LogManagement,
        meta: {
          title: '高级日志管理',
          icon: 'DocumentCopy',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'asset-management',
        name: 'AssetManagement',
        component: AssetManagement,
        meta: {
          title: '资产管理中心',
          icon: 'Money',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      {
        path: 'report-management',
        name: 'ReportManagement',
        component: ReportManagement,
        meta: {
          title: '举报中心',
          icon: 'WarningFilled', // 使用内置图标
          requiresAuth: true,
          requiresAdmin: true
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面不存在'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 后台管理系统` : '后台管理系统'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 尝试从本地存储恢复登录状态
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          await authStore.getCurrentUser()
          if (authStore.isAuthenticated) {
            // 检查管理员权限
            if (to.meta.requiresAdmin && !authStore.isAdmin) {
              ElMessage.error('您没有权限访问此页面')
              next('/dashboard')
              return
            }
            next()
            return
          }
        } catch (error) {
          console.error('恢复登录状态失败:', error)
        }
      }
      
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查管理员权限
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      ElMessage.error('您没有权限访问此页面')
      next('/dashboard')
      return
    }
  }
  
  // 已登录用户访问登录页，重定向到仪表板
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
