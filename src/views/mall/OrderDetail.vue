<template>
  <div class="order-detail">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <el-button @click="goBack" plain>返回列表</el-button>
        </div>
      </template>
      
      <div v-loading="loading">
        <!-- 订单基本信息 -->
        <div class="section">
          <h3>基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{ order.order_no }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="order.status === 0 ? 'success' : 'danger'">
                {{ order.status_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单用户">{{ order.user_name }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ formatDateTime(order.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ order.payment_method }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ formatDateTime(order.payment_time) }}</el-descriptions-item>
            <el-descriptions-item label="订单总额">¥{{ formatPrice(order.total_amount) }}</el-descriptions-item>
            <el-descriptions-item label="实付金额">¥{{ formatPrice(order.payment_amount) }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ order.tracking_number || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ formatDateTime(order.shipped_time) }}</el-descriptions-item>
            <el-descriptions-item label="订单备注" :span="2">{{ order.remark || '无' }}</el-descriptions-item>
            <el-descriptions-item v-if="order.status === 1" label="取消原因" :span="2">
              {{ order.cancel_reason || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <!-- 订单商品列表 -->
        <div class="section">
          <h3>商品信息</h3>
          <el-table :data="order.items || []" style="width: 100%">
            <el-table-column label="商品图片" width="100">
              <template #default="scope">
                <el-image 
                  style="width: 60px; height: 60px" 
                  :src="getFullImageUrl(scope.row.product_image)" 
                  fit="cover"
                  :preview-src-list="[getFullImageUrl(scope.row.product_image)]"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </template>
            </el-table-column>
            <el-table-column prop="product_name" label="商品名称" />
            <el-table-column prop="category_name" label="分类" width="120" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="scope">
                ¥{{ formatPrice(scope.row.price) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="total_price" label="小计" width="120">
              <template #default="scope">
                ¥{{ formatPrice(scope.row.total_price) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions">
          <!-- 取消按钮，兼容旧状态 0=已支付 -->
          <el-button v-if="order.status === 0" type="danger" @click="showCancelDialog">取消订单</el-button>
          <!-- 发货按钮：仅使用 tracking_number/shipped_time/remark，不引用快递公司 -->
          <el-button v-if="order.status === 2 || order.status_text === '待发货'" type="primary" @click="showShipDialog">发货</el-button>
        </div>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { orderAPI } from '@/api/orders'
import { Picture } from '@element-plus/icons-vue'
import { getFullImageUrl } from '@/utils/url'

export default {
  name: 'OrderDetail',
  components: {
    Picture
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(false)
    const order = reactive({})
    
    const cancelDialog = reactive({
      visible: false,
      reason: '',
      loading: false
    })

    // 发货对话框数据：仅包含运单号
    const shipDialog = reactive({
      visible: false,
      form: {
        tracking_number: ''
      }
    })
    
    // 加载订单详情
    const loadOrderDetail = async () => {
      const orderId = route.params.id
      if (!orderId) {
        ElMessage.error('订单ID不能为空')
        return
      }
      
      loading.value = true
      try {
        const response = await orderAPI.getOrderDetail(orderId)
        if (response.code === 200) {
          Object.assign(order, response.data)
        } else {
          ElMessage.error(response.message || '获取订单详情失败')
        }
      } catch (error) {
        console.error('获取订单详情失败:', error)
        ElMessage.error('获取订单详情失败')
      } finally {
        loading.value = false
      }
    }
    
    // 返回列表
    const goBack = () => {
      router.push('/mall/orders')
    }
    
    // 显示取消对话框
    const showCancelDialog = () => {
      cancelDialog.reason = ''
      cancelDialog.visible = true
    }
    
    // 确认取消订单
    const confirmCancel = async () => {
      cancelDialog.loading = true
      try {
        const response = await orderAPI.cancelOrder(order.id, {
          reason: cancelDialog.reason
        })
        
        if (response.code === 200) {
          ElMessage.success('订单取消成功')
          cancelDialog.visible = false
          loadOrderDetail() // 重新加载订单详情
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

    // 显示发货对话框
    const showShipDialog = () => {
      shipDialog.form.tracking_number = ''
      shipDialog.visible = true
    }

    // 确认发货：仅提交运单号
    const confirmShip = async () => {
      if (!shipDialog.form.tracking_number) {
        ElMessage.warning('请填写运单号')
        return
      }
      try {
        const response = await orderAPI.shipOrder(order.id, {
          tracking_number: shipDialog.form.tracking_number
        })
        if (response.code === 200) {
          const trackingNumber = response.data?.tracking_number || shipDialog.form.tracking_number
          ElMessage.success(`发货成功！运单号：${trackingNumber}`)
          shipDialog.visible = false
          loadOrderDetail()
        } else {
          ElMessage.error(response.message || '发货失败')
        }
      } catch (error) {
        console.error('发货失败:', error)
        ElMessage.error('发货失败')
      }
    }
    
    // 格式化价格
    const formatPrice = (price) => {
      return parseFloat(price || 0).toFixed(2)
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
    
    onMounted(() => {
      loadOrderDetail()
    })
    
    return {
      loading,
      order,
      cancelDialog,
      shipDialog,
      goBack,
      showCancelDialog,
      confirmCancel,
      showShipDialog,
      confirmShip,
      formatPrice,
      formatDateTime,
      getFullImageUrl
    }
  }
}
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-bottom: 15px;
  font-weight: 500;
  color: #303133;
}

.actions {
  margin-top: 20px;
  text-align: center;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background-color: #f5f7fa;
  color: #909399;
}
</style>