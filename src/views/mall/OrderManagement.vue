<template>
  <div class="order-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button @click="goBack" class="back-button">
              <el-icon><ArrowLeft /></el-icon>
              返回商城概览
            </el-button>
            <span>订单管理</span>
          </div>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.total_orders }}</div>
                <div class="stat-label">总订单数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.paid_orders }}</div>
                <div class="stat-label">已支付订单</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.cancelled_orders }}</div>
                <div class="stat-label">已取消订单</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">¥{{ formatPrice(statistics.total_amount) }}</div>
                <div class="stat-label">总销售额</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="订单状态">
          <el-select 
            v-model="filters.status" 
            clearable 
            placeholder="全部状态"
            @change="handleStatusChange"
          >
            <!-- 保留原有选项，后续后端接入时改为 1..6 的枚举即可 -->
            <el-option label="已支付" :value="0" />
            <el-option label="已取消" :value="1" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="订单编号">
          <el-input 
            v-model="filters.order_no" 
            placeholder="请输入订单编号"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 订单列表 -->
      <el-table :data="orders" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_no" label="订单编号" width="180" />
        <el-table-column prop="user_name" label="用户" width="120" />
        <el-table-column prop="payment_amount" label="订单金额" width="120">
          <template #default="scope">
            ¥{{ formatPrice(scope.row.payment_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100">
          <template #default="scope">
            {{ formatPaymentMethod(scope.row.payment_method) }}
          </template>
        </el-table-column>
        <!-- 新增支付流水号列 -->
        <el-table-column prop="payment_serial" label="支付流水号" width="220" />
        <!-- 运单号列 -->
        <el-table-column prop="tracking_number" label="运单号" width="180">
          <template #default="scope">
            <span v-if="scope.row.tracking_number">{{ scope.row.tracking_number }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            <!-- 取消按钮，兼容旧状态 0=已支付 -->
            <el-button
              v-if="scope.row.status === 0"
              size="small"
              type="danger"
              @click="cancelOrder(scope.row)"
            >
              取消
            </el-button>
            <!-- 发货按钮：仅输入运单号 -->
            <el-button
              v-if="scope.row.status === 2 || scope.row.status_text === '待发货'"
              size="small"
              type="primary"
              @click="showShipDialog(scope.row)"
            >
              发货
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 取消订单对话框 -->
    <el-dialog v-model="cancelDialog.visible" title="取消订单" width="400px">
      <el-form>
        <el-form-item label="取消原因">
          <el-input
            v-model="cancelDialog.reason"
            type="textarea"
            placeholder="请输入取消原因（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmCancel" :loading="cancelDialog.loading">确认取消</el-button>
      </template>
    </el-dialog>

    <!-- 发货对话框（仅运单号） -->
    <el-dialog v-model="shipDialog.visible" title="发货" width="500px">
      <el-form :model="shipDialog.form" label-width="90px">
        <el-form-item label="运单号">
          <el-input v-model="shipDialog.form.tracking_number" placeholder="请输入运单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { orderAPI } from '@/api/orders'

export default {
  name: 'OrderManagement',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const orders = ref([])
    const statistics = reactive({
      total_orders: 0,
      paid_orders: 0,
      cancelled_orders: 0,
      total_amount: 0
    })
    
    const filters = reactive({
      status: null,
      order_no: '',
      dateRange: null
    })
    
    const pagination = reactive({
      current_page: 1,
      per_page: 20,
      total: 0
    })
    
    const cancelDialog = reactive({
      visible: false,
      order: null,
      reason: '',
      loading: false
    })

    // 发货对话框数据：仅运单号
    const shipDialog = reactive({
      visible: false,
      orderId: null,
      form: {
        tracking_number: ''
      }
    })
    
    // 加载订单列表
    const loadOrders = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.current_page,
          per_page: pagination.per_page,
          status: filters.status
        }
        
        if (filters.order_no) {
          params.order_no = filters.order_no
        }
        
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0]
          params.end_date = filters.dateRange[1]
        }
        
        const response = await orderAPI.getOrders(params)
        if (response.code === 200) {
          orders.value = response.data.items
          pagination.total = response.data.total
        } else {
          ElMessage.error(response.message || '加载订单列表失败')
        }
      } catch (error) {
        console.error('加载订单列表失败:', error)
        ElMessage.error('加载订单列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 加载统计数据
    const loadStatistics = async () => {
      try {
        const response = await orderAPI.getStatistics()
        if (response.code === 200) {
          Object.assign(statistics, response.data)
        } else {
          ElMessage.error(response.message || '加载统计数据失败')
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
        ElMessage.error('加载统计数据失败')
      }
    }
    
    // 订单状态变化处理（立即筛选）
    const handleStatusChange = () => {
      pagination.current_page = 1
      loadOrders()
    }
    
    // 查询（订单编号和时间筛选）
    const handleSearch = () => {
      pagination.current_page = 1
      loadOrders()
    }
    
    // 重置筛选条件
    const handleReset = () => {
      filters.status = null
      filters.order_no = ''
      filters.dateRange = null
      pagination.current_page = 1
      loadOrders()
    }
    
    // 查看订单详情
    const viewDetail = (order) => {
      router.push(`/mall/orders/${order.id}`)
    }
    
    // 取消订单
    const cancelOrder = (order) => {
      cancelDialog.order = order
      cancelDialog.reason = ''
      cancelDialog.visible = true
    }
    
    // 确认取消订单
    const confirmCancel = async () => {
      if (!cancelDialog.order) return
      
      cancelDialog.loading = true
      try {
        const response = await orderAPI.cancelOrder(cancelDialog.order.id, {
          reason: cancelDialog.reason
        })
        
        if (response.code === 200) {
          ElMessage.success('订单取消成功')
          cancelDialog.visible = false
          loadOrders()
          loadStatistics()
        } else {
          ElMessage.error(response.message || '取消订单失败')
        }
      } catch (error) {
        console.error('取消订单失败:', error)
        ElMessage.error('取消订单失败')
      } finally {
        cancelDialog.loading = false
      }
    }

    // 打开发货对话框
    const showShipDialog = (order) => {
      shipDialog.orderId = order.id
      shipDialog.form.tracking_number = ''
      shipDialog.visible = true
    }

    const confirmShip = async () => {
      if (!shipDialog.orderId) return
      if (!shipDialog.form.tracking_number) {
        ElMessage.warning('请填写运单号')
        return
      }
      try {
        const response = await orderAPI.shipOrder(shipDialog.orderId, {
          tracking_number: shipDialog.form.tracking_number
        })
        if (response.code === 200) {
          const trackingNumber = response.data?.tracking_number || shipDialog.form.tracking_number
          ElMessage.success(`发货成功！运单号：${trackingNumber}`)
          shipDialog.visible = false
          loadOrders()
          loadStatistics()
        } else {
          ElMessage.error(response.message || '发货失败')
        }
      } catch (error) {
        console.error('发货失败:', error)
        ElMessage.error('发货失败')
      }
    }
    
    // 分页大小变化
    const handleSizeChange = (val) => {
      pagination.per_page = val
      pagination.current_page = 1
      loadOrders()
    }
    
    // 页码变化
    const handleCurrentChange = (val) => {
      pagination.current_page = val
      loadOrders()
    }
    
    // 格式化价格
    const formatPrice = (price) => {
      return parseFloat(price).toFixed(2)
    }
    
    // 格式化支付方式
    const formatPaymentMethod = (method) => {
      const methodMap = {
        'cash': '现金',
        'coin': '金币',
        'combination': '混合'
      }
      return methodMap[method] || method
    }
    
    // 格式化时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-'
      try {
        const date = new Date(dateTime)
        if (isNaN(date.getTime())) return '-'
        
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Shanghai'
        })
      } catch (error) {
        console.error('时间格式化失败:', error)
        return '-'
      }
    }
    
    // 返回商城概览
    const goBack = () => {
      router.push('/mall')
    }
    
    onMounted(() => {
      loadOrders()
      loadStatistics()
    })
    
    return {
      loading,
      orders,
      statistics,
      filters,
      pagination,
      cancelDialog,
      shipDialog,
      handleStatusChange,
      handleSearch,
      handleReset,
      viewDetail,
      cancelOrder,
      confirmCancel,
      showShipDialog,
      confirmShip,
      handleSizeChange,
      handleCurrentChange,
      formatPrice,
      formatPaymentMethod,
      formatDateTime,
      goBack
    }
  }
}
</script>

<style scoped>
.order-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  margin-top: 8px;
  color: #606266;
}

.filter-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>