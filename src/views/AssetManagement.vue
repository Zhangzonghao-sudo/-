<!--
资产管理中心页面
创建时间: 2025-10-09
创建人: zzh
-->
<template>
  <div class="asset-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>资产管理中心</h1>
      <p>实时监控和管理系统资产流动</p>
    </div>

    <!-- 总资产概览 -->
    <div class="asset-overview">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="asset-card cash-card">
            <div class="asset-info">
              <div class="asset-icon">
                <i class="el-icon-money"></i>
              </div>
              <div class="asset-details">
                <h3>现金总额</h3>
                <div class="asset-amount">¥ {{ formatAmount(totalAssets.total_cash) }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="asset-card coin-card">
            <div class="asset-info">
              <div class="asset-icon">
                <i class="el-icon-coin"></i>
              </div>
              <div class="asset-details">
                <h3>金币总额</h3>
                <div class="asset-amount">{{ formatAmount(totalAssets.total_coins) }} 金币</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 操作类型统计 -->
    <div class="operation-stats" v-if="Object.keys(operationStats).length > 0">
      <el-card>
        <template #header>
          <div class="stat-header">
            <span>财务统计</span>
            <div class="stat-controls">
              <!-- 时间筛选组件 -->
              <div class="time-filter">
                <el-button-group>
                  <el-button 
                    :type="timeFilter.type === '1d' ? 'primary' : ''"
                    size="small"
                    @click="setTimeFilter('1d')">
                    1天
                  </el-button>
                  <el-button 
                    :type="timeFilter.type === '7d' ? 'primary' : ''"
                    size="small"
                    @click="setTimeFilter('7d')">
                    7天
                  </el-button>
                  <el-button 
                    :type="timeFilter.type === '15d' ? 'primary' : ''"
                    size="small"
                    @click="setTimeFilter('15d')">
                    15天
                  </el-button>
                  <el-button 
                    :type="timeFilter.type === '30d' ? 'primary' : ''"
                    size="small"
                    @click="setTimeFilter('30d')">
                    30天
                  </el-button>
                  <el-button 
                    :type="timeFilter.type === 'all' ? 'primary' : ''"
                    size="small"
                    @click="setTimeFilter('all')">
                    总计
                  </el-button>
                </el-button-group>
                <el-date-picker
                  v-model="timeFilter.customRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="margin-left: 10px; width: 240px;"
                  @change="setCustomTimeFilter">
                </el-date-picker>
              </div>
              <el-button type="primary" size="small" @click="showCompanyRechargeDialog">公司充值</el-button>
            </div>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col 
            v-for="(stat, operationType) in operationStats" 
            :key="operationType" 
            :span="6"
            class="stat-item"
          >
            <div class="stat-card">
              <div class="stat-title">{{ stat.operation_type_text }}</div>
              <div class="stat-amount">
                {{ formatAmount(stat.total_amount) }} 
                <span v-if="stat.unit === '元'">元</span>
                <span v-else>金币</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 资产流水记录 -->
    <div class="asset-records">
      <el-card>
        <template #header>
          <div class="record-header">
            <span>资产流水记录</span>
            <div class="header-actions">
              <el-button type="primary" @click="exportRecords">导出记录</el-button>
            </div>
          </div>
        </template>

        <!-- 查询条件 -->
        <div class="search-form">
          <el-form :model="searchForm" inline>
            <el-form-item label="资产类型">
              <el-select v-model="searchForm.asset_type" placeholder="请选择资产类型" clearable>
                <el-option label="现金" value="cash"></el-option>
                <el-option label="金币" value="coin"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="操作类型">
              <el-select v-model="searchForm.operation_type" placeholder="请选择操作类型" clearable>
                <el-option 
                  v-for="type in operationTypes" 
                  :key="type.value" 
                  :label="type.label" 
                  :value="type.value">
                </el-option>
              </el-select>
            </el-form-item>
            <!-- 新增：用户ID筛选（仅管理员适用） -->
            <el-form-item label="用户ID">
              <el-input v-model="searchForm.user_id" placeholder="输入用户ID（管理员）" clearable />
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD">
              </el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格 -->
        <el-table
          :data="records"
          v-loading="loading"
          style="width: 100%">
          <el-table-column prop="id" label="记录ID" width="100"></el-table-column>
          <el-table-column label="用户ID" width="100">
          <template #default="{ row }">
          {{ row.user_id === null ? '公司' : row.user_id }}
          </template>
          </el-table-column>
          <el-table-column prop="user_id_2" label="用户ID2" width="100"></el-table-column>
          <el-table-column prop="operation_type_text" label="操作类型" width="150"></el-table-column>
          <el-table-column prop="asset_type_text" label="资产类型" width="100"></el-table-column>
          <el-table-column prop="amount" label="变动金额" width="120">
            <template #default="scope">
              <span :class="scope.row.amount >= 0 ? 'positive' : 'negative'">
                {{ scope.row.amount >= 0 ? '+' : '' }}{{ formatAmount(scope.row.amount) }}
              </span>
            </template>
          </el-table-column>
          <!-- 移除变动后余额列 -->
          <!-- 移除交易流水号列 -->
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange">
          </el-pagination>
        </div>
      </el-card>
    </div>

    <!-- WebSocket状态 -->
    <div class="websocket-status">
      <el-alert
        :title="websocketStatus.title"
        :type="websocketStatus.type"
        :description="websocketStatus.description"
        :closable="false"
        show-icon>
      </el-alert>
    </div>

    <!-- 公司充值对话框 -->
    <el-dialog
      v-model="companyRechargeDialogVisible"
      title="公司充值"
      width="500px"
      @close="handleCompanyRechargeDialogClose"
    >
      <el-form :model="companyRechargeForm" ref="companyRechargeFormRef" :rules="companyRechargeRules" label-width="80px">
        <el-form-item label="金额" prop="amount">
          <el-input v-model="companyRechargeForm.amount" placeholder="请输入充值金额"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="companyRechargeForm.description" placeholder="请输入充值备注"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="companyRechargeDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="companyRechargeLoading" @click="handleCompanyRecharge">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import io from 'socket.io-client'
import assetApi from '@/api/asset'

// 总资产数据
const totalAssets = reactive({
  total_cash: 0,
  total_coins: 0,
  update_time: ''
})

const operationStats = ref({})

// 时间筛选相关
const timeFilter = reactive({
  type: 'all', // 当前选择的时间类型：1d, 7d, 15d, 30d, all, custom
  customRange: null, // 自定义时间范围
  startDate: null, // 计算后的开始日期
  endDate: null // 计算后的结束日期
})

// 计算属性
// 今日收入展示已移除，相关计算不再使用

const todayCoinChange = computed(() => {
  // 这里应该计算今日金币变动
  const income = totalAssets.today_coin_income || 0
  const expense = totalAssets.today_coin_expense || 0
  return income - expense
})

const records = ref([])
const loading = ref(false)
const socket = ref(null)

const searchForm = reactive({
  asset_type: '',
  operation_type: '',
  // 新增：用户ID筛选字段
  user_id: '',
  dateRange: []
})

// 分页信息
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// WebSocket状态
const websocketStatus = reactive({
  connected: false,
  title: 'WebSocket连接状态',
  type: 'info',
  description: '正在连接...'
})

// 公司充值对话框相关
const companyRechargeDialogVisible = ref(false)
const companyRechargeForm = reactive({
  amount: '',
  description: ''
})
const companyRechargeLoading = ref(false)
const companyRechargeFormRef = ref(null)

// 表单验证规则
const companyRechargeRules = {
  amount: [
    { required: true, message: '请输入充值金额', trigger: 'blur' },
    { validator: validateAmount, trigger: 'blur' }
  ],
  description: [
    { required: false, message: '请输入备注', trigger: 'blur' }
  ]
}

function validateAmount(rule, value, callback) {
  const num = Number(value)
  if (isNaN(num) || num <= 0) {
    callback(new Error('金额必须为正数'))
  } else {
    callback()
  }
}

// 显示公司充值对话框
function showCompanyRechargeDialog() {
  companyRechargeDialogVisible.value = true
}

// 关闭公司充值对话框
function handleCompanyRechargeDialogClose() {
  companyRechargeForm.amount = ''
  companyRechargeForm.description = ''
  if (companyRechargeFormRef.value) {
    companyRechargeFormRef.value.resetFields()
  }
}

// 处理公司充值
async function handleCompanyRecharge() {
  if (companyRechargeFormRef.value) {
    await companyRechargeFormRef.value.validate(async (valid) => {
      if (valid) {
        companyRechargeLoading.value = true
        try {
          const resp = await assetApi.companyRecharge({
            amount: parseFloat(companyRechargeForm.amount),
            description: companyRechargeForm.description
          })
          
          if (resp.code === 200) {
            ElMessage.success('公司充值成功')
            companyRechargeDialogVisible.value = false
            // 重置表单
            handleCompanyRechargeDialogClose()
            // 刷新数据
            loadTotalAssets()
            loadOperationStats()
            loadAssetRecords()
          } else {
            ElMessage.error(resp.message || '充值失败')
          }
        } catch (error) {
          console.error('公司充值失败', error)
          ElMessage.error('充值失败，请重试')
        } finally {
          companyRechargeLoading.value = false
        }
      }
    })
  }
}

// 获取操作类型列表
const operationTypes = [
  { label: '个人用户金币充值', value: 'user_coin_recharge' },
  { label: '个人用户商城消费', value: 'user_mall_consume' },
  { label: '公司金币充值', value: 'company_coin_recharge' },
  { label: '商城回收金币', value: 'mall_coin_recovery' },
  { label: '悬赏服务费', value: 'bounty_service_fee' },
  { label: '悬赏保证金', value: 'bounty_deposit' },
  { label: '打赏', value: 'tip' },
  { label: '任务系统发出', value: 'task_reward' }
]

// 时间筛选方法
function setTimeFilter(type) {
  timeFilter.type = type
  timeFilter.customRange = null
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999) // 今天的结束时间
  
  switch (type) {
    case '1d':
      // 1天：从昨天开始到今天结束
      const oneDayAgo = new Date(today)
      oneDayAgo.setDate(today.getDate() - 1)
      oneDayAgo.setHours(0, 0, 0, 0) // 昨天的开始时间
      timeFilter.startDate = formatDate(oneDayAgo)
      timeFilter.endDate = formatDate(today)
      break
    case '7d':
      // 7天：从7天前开始到今天结束
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      timeFilter.startDate = formatDate(sevenDaysAgo)
      timeFilter.endDate = formatDate(today)
      break
    case '15d':
      // 15天：从15天前开始到今天结束
      const fifteenDaysAgo = new Date(today)
      fifteenDaysAgo.setDate(today.getDate() - 15)
      fifteenDaysAgo.setHours(0, 0, 0, 0)
      timeFilter.startDate = formatDate(fifteenDaysAgo)
      timeFilter.endDate = formatDate(today)
      break
    case '30d':
      // 30天：从30天前开始到今天结束
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      timeFilter.startDate = formatDate(thirtyDaysAgo)
      timeFilter.endDate = formatDate(today)
      break
    case 'all':
    default:
      timeFilter.startDate = null
      timeFilter.endDate = null
      break
  }
  
  // 重新加载统计数据
  loadOperationStats()
}

function setCustomTimeFilter(dateRange) {
  if (dateRange && dateRange.length === 2) {
    timeFilter.type = 'custom'
    timeFilter.startDate = dateRange[0]
    timeFilter.endDate = dateRange[1]
  } else {
    timeFilter.type = 'all'
    timeFilter.startDate = null
    timeFilter.endDate = null
  }
  
  // 重新加载统计数据
  loadOperationStats()
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化金额
function formatAmount(value) {
  if (value === null || value === undefined) return '0.00'
  const num = Number(value)
  return num.toFixed(2)
}

// 格式化时间
function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`
}

async function loadTotalAssets() {
  try {
    const resp = await assetApi.getTotalAssets()
    if (resp.code === 200) {
      Object.assign(totalAssets, resp.data)
    }
  } catch (e) {
    console.error('获取总资产失败', e)
  }
}

async function loadOperationStats() {
  try {
    const params = {}
    
    // 添加时间筛选参数
    if (timeFilter.startDate) {
      params.start_date = timeFilter.startDate
    }
    if (timeFilter.endDate) {
      params.end_date = timeFilter.endDate
    }
    
    const resp = await assetApi.getOperationStats(params)
    if (resp.code === 200) {
      operationStats.value = resp.data
    }
  } catch (e) {
    console.error('获取操作统计失败', e)
  }
}

async function loadAssetRecords() {
  try {
    loading.value = true

    const params = {}
    if (searchForm.asset_type) params.asset_type = searchForm.asset_type
    if (searchForm.operation_type) params.operation_type = searchForm.operation_type
    // 新增：传递用户ID参数（转为数字）
    if (searchForm.user_id !== '' && searchForm.user_id !== null) {
      const uid = Number(searchForm.user_id)
      if (!Number.isNaN(uid)) params.user_id = uid
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.start_date = searchForm.dateRange[0]
      params.end_date = searchForm.dateRange[1]
    }
    params.page = pagination.current
    params.per_page = pagination.size

    const resp = await assetApi.getRecords(params)
    if (resp.code === 200) {
      records.value = resp.data.records || []
      pagination.total = resp.data.total || 0
    }
  } catch (e) {
    console.error('获取资产记录失败', e)
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.asset_type = ''
  searchForm.operation_type = ''
  // 新增：清空用户ID筛选
  searchForm.user_id = ''
  searchForm.dateRange = []
  pagination.current = 1
  pagination.size = 20
  loadAssetRecords()
}

function handleSearch() {
  pagination.current = 1
  loadAssetRecords()
}

function handleSizeChange(size) {
  pagination.size = size
  loadAssetRecords()
}

function handleCurrentChange(current) {
  pagination.current = current
  loadAssetRecords()
}

function exportRecords() {
  // 简单导出为CSV
  const headers = ['记录ID', '用户ID', '用户ID2', '操作类型', '资产类型', '变动金额', '描述', '创建时间']
  const rows = records.value.map(r => [
    r.id,
-    r.user_id,
+    r.user_id === null ? '公司' : r.user_id,
    r.user_id_2 ?? '',
    r.operation_type_text,
    r.asset_type_text,
    r.amount,
    r.description,
    formatDateTime(r.created_at)
  ])
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `资产记录_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 初始化WebSocket连接（只用于接收最新状态）
function initWebSocket() {
  try {
    // 获取JWT令牌
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.warn('未找到JWT令牌，无法建立Socket.IO连接')
      websocketStatus.title = 'WebSocket连接状态'
      websocketStatus.type = 'error'
      websocketStatus.description = '未找到认证令牌'
      return
    }

    // 创建Socket.IO连接，传递JWT令牌
    const transports = import.meta.env.VITE_SOCKET_TRANSPORTS === 'websocket' ? ['websocket', 'polling'] : ['polling']
    
    // 使用环境变量配置的后端地址
    const apiBase = import.meta.env.VITE_API_BASE
    const wsUrl = apiBase
    
    socket.value = io(wsUrl, {
      path: '/socket.io',
      transports: transports,
      reconnection: true, 
      reconnectionAttempts: 5, 
      reconnectionDelay: 1000,
      // 通过查询参数传递JWT令牌
      query: {
        token: token
      },
      // 也可以通过额外头部传递（备用方案）
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    })

    socket.value.on('connect', () => {
      websocketStatus.connected = true
      websocketStatus.title = 'WebSocket连接状态'
      websocketStatus.type = 'success'
      websocketStatus.description = '连接已建立'
    })

    socket.value.on('disconnect', (reason) => {
      websocketStatus.connected = false
      websocketStatus.title = 'WebSocket连接状态'
      websocketStatus.type = 'warning'
      websocketStatus.description = '连接已断开: ' + reason;
    });

    // 监听鉴权错误
    socket.value.on('auth_error', (data) => {
      console.error('Socket.IO鉴权失败:', data)
      websocketStatus.connected = false
      websocketStatus.title = 'WebSocket连接状态'
      websocketStatus.type = 'error'
      websocketStatus.description = `鉴权失败: ${data.message}`
      ElMessage.error(`WebSocket鉴权失败: ${data.message}`)
    })

    // 监听资产更新通知
    socket.value.on('asset_update', (data) => {
      console.log('收到资产更新通知:', data);
      // 自动刷新数据
      loadTotalAssets();
      loadOperationStats();
      loadAssetRecords();
    });

    // 监听资产响应
    socket.value.on('asset_response', (data) => {
      console.log('收到资产响应:', data);
      // 处理资产响应
      if (data.data && data.data.success) {
        ElMessage.success('操作成功');
        // 操作成功后刷新数据
        loadTotalAssets();
        loadOperationStats();
        loadAssetRecords();
      } else {
        ElMessage.error(data.data?.message || '操作失败');
      }
    });
    
    // 添加错误处理
    socket.value.on('error', (error) => {
      console.log('WebSocket错误:', error);
      ElMessage.error('WebSocket连接错误: ' + error.message);
    })
  } catch (e) {
    console.warn('Socket.IO客户端加载失败', e)
    websocketStatus.title = 'WebSocket连接状态'
    websocketStatus.type = 'warning'
    websocketStatus.description = 'Socket.IO客户端加载失败'
  }
}

// 生命周期
onMounted(() => {
  loadTotalAssets()
  loadOperationStats()
  loadAssetRecords()
  initWebSocket()
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
})
</script>

<style scoped>
.asset-card {
  margin-bottom: 20px;
}

.cash-card {
  background: linear-gradient(135deg, #67c23a, #a5d6a7);
  color: white;
}

.coin-card {
  background: linear-gradient(135deg, #409eff, #90caf9);
  color: white;
}

.asset-info {
  display: flex;
  align-items: center;
}

.asset-icon {
  font-size: 40px;
  margin-right: 20px;
}

.asset-details h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: normal;
}

.asset-amount {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.asset-trend {
  display: flex;
  align-items: center;
}

.trend-label {
  margin-right: 10px;
  font-size: 12px;
}

.trend-value {
  font-size: 12px;
  font-weight: bold;
}

.trend-value.positive {
  color: #67c23a;
}

.trend-value.negative {
  color: #f56c6c;
}

.operation-stats {
  margin-bottom: 30px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.time-filter {
  display: flex;
  align-items: center;
}

.stat-item {
  margin-bottom: 20px;
}

.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-amount {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.asset-records {
  margin-bottom: 30px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.websocket-status {
  margin-top: 30px;
}

.dialog-footer {
  text-align: right;
}

.positive { color: #67c23a; }
.negative { color: #f56c6c; }
</style>