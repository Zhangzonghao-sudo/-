<template>
  <div class="stock-alert">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回商城概览
        </el-button>
        <h2>库存提醒</h2>
      </div>
      <div class="header-right">
        <el-button @click="showThresholdDialog" type="warning" plain>
          <el-icon><Setting /></el-icon>
          设置库存阈值
        </el-button>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 当前阈值显示 -->
    <el-alert
      :title="`当前库存不足阈值：${stockThreshold} 件`"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template #default>
        库存数量低于 {{ stockThreshold }} 件的商品规格将被标记为库存不足
      </template>
    </el-alert>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.total_specs }}</div>
            <div class="stat-label">总商品规格</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number warning">{{ statistics.low_stock_specs }}</div>
            <div class="stat-label">库存不足</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number danger">{{ statistics.out_of_stock_specs }}</div>
            <div class="stat-label">缺货商品</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.low_stock_rate }}%</div>
            <div class="stat-label">库存不足率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="输入商品名称或规格名称"
            clearable
            @keyup.enter="loadLowStockProducts"
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLowStockProducts">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 低库存商品列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>低库存商品列表（库存 < {{ stockThreshold }}）</span>
          <el-tag type="warning">共 {{ pagination.total }} 个商品规格需要关注</el-tag>
        </div>
      </template>

      <el-table 
        :data="lowStockProducts" 
        v-loading="loading"
        style="width: 100%"
        empty-text="暂无低库存商品"
      >
        <el-table-column label="商品图片" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.spec_image"
              :src="getFullImageUrl(row.spec_image)"
              :preview-src-list="[getFullImageUrl(row.spec_image)]"
              fit="cover"
              style="width: 50px; height: 50px; border-radius: 4px;"
            />
            <div v-else class="no-image">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="spec_name" label="规格名称" width="120" show-overflow-tooltip />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column label="库存数量" width="100">
          <template #default="{ row }">
            <el-tag :type="row.spec_stock === 0 ? 'danger' : 'warning'">
              {{ row.spec_stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewProductSpecs(row)"
            >
              查看商品
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 库存阈值设置对话框 -->
    <el-dialog
      v-model="thresholdDialogVisible"
      title="设置库存不足阈值"
      width="500px"
      :before-close="handleThresholdDialogClose"
    >
      <div class="threshold-setting">
        <el-form :model="thresholdForm" label-width="120px">
          <el-form-item label="库存不足阈值" required>
            <el-input-number
              v-model="thresholdForm.threshold"
              :min="1"
              :max="999"
              :step="1"
              placeholder="请输入库存不足阈值"
              style="width: 100%"
            />
            <div class="form-help-text">
              当商品规格库存数量低于此值时，将被标记为库存不足
            </div>
          </el-form-item>
          <el-form-item label="预览效果">
            <el-tag type="warning" size="large">
              库存 < {{ thresholdForm.threshold || 10 }} 件 = 库存不足
            </el-tag>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="thresholdDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="saveThreshold"
            :loading="thresholdSaving"
          >
            保存设置
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 规格管理对话框 -->
    <el-dialog 
      title="规格管理" 
      v-model="specDialogVisible" 
      width="1000px"
      @close="resetSpecForm"
    >
      <div class="spec-management">
        <div class="spec-header">
          <h3>{{ currentProduct?.name }} - 规格管理</h3>
        </div>
        
        <el-table :data="specs" v-loading="specLoading">
          <el-table-column prop="spec_name" label="规格名称" />
          <el-table-column prop="spec_price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ row.spec_price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="spec_stock" label="库存" width="100" />
          <el-table-column prop="is_default" label="默认" width="90">
            <template #default="{ row }">
              <el-tag :type="row.is_default ? 'success' : 'info'">
                {{ row.is_default ? '默认' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="规格图片" width="100">
            <template #default="{ row }">
              <el-image 
                v-if="row.spec_image"
                :src="row.spec_image" 
                :preview-src-list="[row.spec_image]"
                fit="cover"
                style="width: 50px; height: 50px; border-radius: 4px;"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="updateStock(row)">库存</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 库存更新对话框 -->
    <el-dialog 
      title="更新库存" 
      v-model="stockDialogVisible" 
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="当前库存">
          <span>{{ currentSpec?.spec_stock || 0 }}</span>
        </el-form-item>
        <el-form-item label="新库存">
          <el-input-number 
            v-model="newStock" 
            :min="0" 
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockUpdate" :loading="stockUpdating">
          更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Search, Picture, Setting } from '@element-plus/icons-vue'
import { stockAlertApi } from '@/api/stock-alert'
import mallApi from '@/api/mall'
import { getFullImageUrl } from '@/utils/url'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const lowStockProducts = ref([])
const stockThreshold = ref(10) // 默认库存阈值
const thresholdDialogVisible = ref(false)
const thresholdSaving = ref(false)

// 规格管理相关数据
const specDialogVisible = ref(false)
const specLoading = ref(false)
const specs = ref([])
const currentProduct = ref(null)

// 库存更新相关数据
const stockDialogVisible = ref(false)
const stockUpdating = ref(false)
const currentSpec = ref(null)
const newStock = ref(0)

const statistics = reactive({
  total_specs: 0,
  low_stock_specs: 0,
  out_of_stock_specs: 0,
  normal_stock_specs: 0,
  low_stock_rate: 0
})

const filterForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0
})

const thresholdForm = reactive({
  threshold: 10
})

// 方法
const goBack = () => {
  router.push('/mall')
}

const refreshData = () => {
  loadStatistics()
  loadLowStockProducts()
}

const showThresholdDialog = () => {
  thresholdForm.threshold = stockThreshold.value
  thresholdDialogVisible.value = true
}

const handleThresholdDialogClose = (done) => {
  if (thresholdSaving.value) {
    ElMessage.warning('正在保存设置，请稍候...')
    return
  }
  done()
}

const saveThreshold = async () => {
  if (!thresholdForm.threshold || thresholdForm.threshold < 1) {
    ElMessage.warning('请输入有效的库存阈值（大于0）')
    return
  }

  thresholdSaving.value = true
  try {
    // 保存到本地存储
    localStorage.setItem('stockThreshold', thresholdForm.threshold.toString())
    stockThreshold.value = thresholdForm.threshold
    
    ElMessage.success('库存阈值设置成功')
    thresholdDialogVisible.value = false
    
    // 重新加载数据
    refreshData()
  } catch (error) {
    console.error('保存库存阈值失败:', error)
    ElMessage.error('保存库存阈值失败')
  } finally {
    thresholdSaving.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await stockAlertApi.getStatistics(stockThreshold.value)
    if (response.success) {
      Object.assign(statistics, response.data)
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
    ElMessage.error('加载统计信息失败')
  }
}

const loadLowStockProducts = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      keyword: filterForm.keyword,
      threshold: stockThreshold.value // 传递当前阈值
    }
    
    const response = await stockAlertApi.getLowStockProducts(params)
    if (response.success) {
      lowStockProducts.value = response.data.items
      pagination.total = response.data.total
      pagination.pages = response.data.pages
    }
  } catch (error) {
    console.error('加载库存提醒失败:', error)
    ElMessage.error('加载库存提醒失败')
  } finally {
    loading.value = false
  }
}

// 加载商品规格
const loadSpecs = async (productId) => {
  specLoading.value = true
  try {
    const response = await mallApi.getProductSpecs(productId)
    specs.value = response.data
  } catch (error) {
    console.error('加载规格失败:', error)
    ElMessage.error('加载规格失败')
  } finally {
    specLoading.value = false
  }
}

// 查看商品规格
const viewProductSpecs = async (row) => {
  try {
    // 获取商品详情
    const response = await mallApi.getProduct(row.product_id)
    if (response.success) {
      currentProduct.value = response.data
      specDialogVisible.value = true
      await loadSpecs(row.product_id)
    } else {
      ElMessage.error(response.message || '获取商品信息失败')
    }
  } catch (error) {
    console.error('获取商品信息失败:', error)
    ElMessage.error('获取商品信息失败')
  }
}

// 更新库存
const updateStock = (spec) => {
  currentSpec.value = spec
  newStock.value = spec.spec_stock
  stockDialogVisible.value = true
}

// 提交库存更新
const submitStockUpdate = async () => {
  try {
    stockUpdating.value = true
    const response = await mallApi.updateSpecStock(currentSpec.value.id, { stock: newStock.value })
    if (response.code === 200) {
      ElMessage.success('库存更新成功')
      stockDialogVisible.value = false
      // 重新加载规格数据
      await loadSpecs(currentProduct.value.id)
      // 重新加载库存提醒数据
      await loadLowStockProducts()
    } else {
      ElMessage.error(response.message || '库存更新失败')
    }
  } catch (error) {
    console.error('库存更新失败:', error)
    ElMessage.error('库存更新失败')
  } finally {
    stockUpdating.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  pagination.page = 1
  loadLowStockProducts()
}

const handleSizeChange = (val) => {
  pagination.per_page = val
  pagination.page = 1
  loadLowStockProducts()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  loadLowStockProducts()
}

// 重置规格表单
const resetSpecForm = () => {
  specs.value = []
  currentProduct.value = null
}

// 初始化库存阈值
const initStockThreshold = () => {
  const savedThreshold = localStorage.getItem('stockThreshold')
  if (savedThreshold) {
    stockThreshold.value = parseInt(savedThreshold)
    thresholdForm.threshold = stockThreshold.value
  }
}

// 生命周期
onMounted(() => {
  initStockThreshold()
  loadStatistics()
  loadLowStockProducts()
})
</script>

<style scoped>
.stock-alert {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px 0;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-number.warning {
  color: #E6A23C;
}

.stat-number.danger {
  color: #F56C6C;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.no-image {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}

.price {
  color: #e6a23c;
  font-weight: bold;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.threshold-setting {
  padding: 10px 0;
}

.form-help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>