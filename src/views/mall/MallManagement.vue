<template>
  <div class="mall-management">
    <div class="page-header">
      <h2>商城管理</h2>
    </div>

    <div class="management-cards">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="management-card" @click="goToCategories">
            <div class="card-content">
              <div class="card-icon category-icon">
                <el-icon><Collection /></el-icon>
              </div>
              <div class="card-info">
                <h3>分类管理</h3>
                <p>管理商品分类，设置分类信息和排序</p>
                <div class="card-stats">
                  <span>共 {{ stats.categories }} 个分类</span>
                </div>
              </div>
              <div class="card-arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="management-card" @click="goToProducts">
            <div class="card-content">
              <div class="card-icon product-icon">
                <el-icon><Box /></el-icon>
              </div>
              <div class="card-info">
                <h3>商品管理</h3>
                <p>管理商品信息，包括价格、图片和描述</p>
                <div class="card-stats">
                  <span>共 {{ stats.products }} 个商品</span>
                </div>
              </div>
              <div class="card-arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <el-card class="management-card" @click="goToOrders">
            <div class="card-content">
              <div class="card-icon order-icon">
                <el-icon><List /></el-icon>
              </div>
              <div class="card-info">
                <h3>订单管理</h3>
                <p>查看和管理订单信息，处理订单状态</p>
                <div class="card-stats">
                  <span>共 {{ stats.orders }} 个订单</span>
                </div>
              </div>
              <div class="card-arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 统计信息 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.categories }}</div>
            <div class="stat-label">商品分类</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.products }}</div>
            <div class="stat-label">商品总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.orders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.activeProducts }}</div>
            <div class="stat-label">上架商品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.inactiveProducts }}</div>
            <div class="stat-label">下架商品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.paidOrders }}</div>
            <div class="stat-label">已支付订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats.cancelledOrders }}</div>
            <div class="stat-label">已取消订单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Collection, Box, List, ArrowRight } from '@element-plus/icons-vue'
import { categoryAPI, productAPI } from '@/api/mall'
import { orderAPI } from '@/api/orders'

const router = useRouter()

// 统计数据
const stats = ref({
  categories: 0,
  products: 0,
  activeProducts: 0,
  inactiveProducts: 0,
  orders: 0,
  paidOrders: 0,
  cancelledOrders: 0
})

// 方法
const goToCategories = () => {
  router.push('/mall/categories')
}

const goToProducts = () => {
  router.push('/mall/products')
}

const goToOrders = () => {
  router.push('/mall/orders')
}

const loadStats = async () => {
  try {
    // 获取分类统计
    const categoryResponse = await categoryAPI.getCategories()
    if (categoryResponse.code === 200) {
      stats.value.categories = categoryResponse.data.length
    }

    // 获取商品统计
    const productResponse = await productAPI.getProducts({ per_page: 1000 })
    if (productResponse.code === 200) {
      const products = productResponse.data.items
      stats.value.products = products.length
      stats.value.activeProducts = products.filter(p => p.status === 1).length
      stats.value.inactiveProducts = products.filter(p => p.status === 2).length
    }
    
    // 获取订单统计
    try {
      const orderResponse = await orderAPI.getStatistics()
      if (orderResponse.code === 200) {
        stats.value.orders = orderResponse.data.total_orders
        stats.value.paidOrders = orderResponse.data.paid_orders
        stats.value.cancelledOrders = orderResponse.data.cancelled_orders
      }
    } catch (error) {
      console.error('获取订单统计数据失败:', error)
      stats.value.orders = 0
      stats.value.paidOrders = 0
      stats.value.cancelledOrders = 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.mall-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.management-cards {
  margin-bottom: 30px;
}

.management-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 120px;
}

.management-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.category-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.product-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.order-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.card-icon .el-icon {
  font-size: 24px;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.card-info p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.card-stats {
  color: #909399;
  font-size: 12px;
}

.card-arrow {
  color: #c0c4cc;
  font-size: 20px;
}

.stats-row {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}
</style>