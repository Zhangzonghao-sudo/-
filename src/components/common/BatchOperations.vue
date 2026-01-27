<template>
  <div class="batch-operations">
    <!-- 批量操作工具栏 -->
    <div class="batch-toolbar" v-show="selectedItems.length > 0">
      <div class="batch-info">
        <el-checkbox
          v-model="selectAll"
          :indeterminate="isIndeterminate"
          @change="handleSelectAll"
        >
          已选择 {{ selectedItems.length }} 项
        </el-checkbox>
      </div>
      
      <div class="batch-actions">
        <el-button-group>
          <el-button
            v-for="action in availableActions"
            :key="action.key"
            :type="action.type || 'default'"
            :icon="action.icon"
            :loading="action.loading"
            :disabled="action.disabled"
            @click="handleBatchAction(action)"
            size="small"
          >
            {{ action.label }}
          </el-button>
        </el-button-group>
        
        <el-button @click="clearSelection" size="small" text>
          <el-icon><Close /></el-icon>
          清除选择
        </el-button>
      </div>
    </div>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmVisible"
      :title="currentAction?.confirmTitle || '确认操作'"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="confirm-content">
        <div class="confirm-icon">
          <el-icon :size="48" :color="getConfirmIconColor()">
            <component :is="getConfirmIcon()" />
          </el-icon>
        </div>
        <div class="confirm-text">
          <p>{{ currentAction?.confirmMessage || '确定要执行此操作吗？' }}</p>
          <p class="confirm-detail">
            将对 <strong>{{ selectedItems.length }}</strong> 个项目执行 
            <strong>{{ currentAction?.label }}</strong> 操作
          </p>
          <div v-if="currentAction?.requiresInput" class="confirm-input">
            <el-input
              v-model="actionInput"
              :placeholder="currentAction.inputPlaceholder"
              :type="currentAction.inputType || 'text'"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="confirmVisible = false">取消</el-button>
          <el-button
            :type="currentAction?.confirmType || 'primary'"
            @click="confirmBatchAction"
            :loading="executing"
          >
            确认{{ currentAction?.label }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 进度对话框 -->
    <el-dialog
      v-model="progressVisible"
      title="批量操作进度"
      width="500px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="progress-content">
        <div class="progress-info">
          <p>正在执行：{{ currentAction?.label }}</p>
          <p class="progress-detail">
            已处理 {{ processedCount }} / {{ totalCount }} 项
          </p>
        </div>
        
        <el-progress
          :percentage="progressPercentage"
          :status="progressStatus"
          :stroke-width="8"
        />
        
        <div class="progress-logs" v-if="operationLogs.length > 0">
          <h4>操作日志</h4>
          <div class="log-list">
            <div
              v-for="(log, index) in operationLogs"
              :key="index"
              class="log-item"
              :class="log.type"
            >
              <el-icon>
                <component :is="getLogIcon(log.type)" />
              </el-icon>
              <span>{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            v-if="progressStatus === 'success' || progressStatus === 'exception'"
            type="primary"
            @click="closeProgress"
          >
            完成
          </el-button>
          <el-button
            v-else
            @click="cancelOperation"
            :disabled="cancelling"
          >
            {{ cancelling ? '取消中...' : '取消操作' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Close, Check, Delete, Edit, Download, Upload,
  WarningFilled, CircleCheckFilled, CircleCloseFilled,
  InfoFilled, Loading
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 选中的项目
  selectedItems: {
    type: Array,
    default: () => []
  },
  // 所有项目
  allItems: {
    type: Array,
    default: () => []
  },
  // 可用的批量操作
  actions: {
    type: Array,
    default: () => []
  },
  // 是否显示全选
  showSelectAll: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits([
  'select-all',
  'clear-selection',
  'batch-action',
  'action-complete',
  'action-error'
])

// 响应式数据
const confirmVisible = ref(false)
const progressVisible = ref(false)
const executing = ref(false)
const cancelling = ref(false)
const currentAction = ref(null)
const actionInput = ref('')
const processedCount = ref(0)
const totalCount = ref(0)
const progressStatus = ref('')
const operationLogs = ref([])

// 计算属性
const selectAll = computed({
  get() {
    return props.selectedItems.length === props.allItems.length && props.allItems.length > 0
  },
  set(value) {
    // 由父组件处理
  }
})

const isIndeterminate = computed(() => {
  return props.selectedItems.length > 0 && props.selectedItems.length < props.allItems.length
})

const availableActions = computed(() => {
  return props.actions.filter(action => {
    // 根据选中项目数量过滤可用操作
    if (action.minItems && props.selectedItems.length < action.minItems) {
      return false
    }
    if (action.maxItems && props.selectedItems.length > action.maxItems) {
      return false
    }
    return true
  })
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((processedCount.value / totalCount.value) * 100)
})

// 方法
const handleSelectAll = (value) => {
  emit('select-all', value)
}

const clearSelection = () => {
  emit('clear-selection')
}

const handleBatchAction = (action) => {
  currentAction.value = action
  actionInput.value = ''
  
  if (action.requiresConfirm !== false) {
    confirmVisible.value = true
  } else {
    executeBatchAction()
  }
}

const confirmBatchAction = () => {
  confirmVisible.value = false
  executeBatchAction()
}

const executeBatchAction = async () => {
  if (!currentAction.value) return
  
  executing.value = true
  progressVisible.value = true
  processedCount.value = 0
  totalCount.value = props.selectedItems.length
  progressStatus.value = ''
  operationLogs.value = []
  
  try {
    // 发送批量操作事件
    emit('batch-action', {
      action: currentAction.value,
      items: props.selectedItems,
      input: actionInput.value
    })
    
    // 模拟批量操作过程
    await simulateBatchOperation()
    
    progressStatus.value = 'success'
    ElMessage.success(`${currentAction.value.label}操作完成`)
    
    emit('action-complete', {
      action: currentAction.value,
      processedCount: processedCount.value,
      logs: operationLogs.value
    })
    
  } catch (error) {
    console.error('批量操作失败:', error)
    progressStatus.value = 'exception'
    ElMessage.error(`${currentAction.value.label}操作失败`)
    
    emit('action-error', {
      action: currentAction.value,
      error,
      processedCount: processedCount.value
    })
  } finally {
    executing.value = false
  }
}

const simulateBatchOperation = async () => {
  const items = props.selectedItems
  const action = currentAction.value
  
  for (let i = 0; i < items.length; i++) {
    if (cancelling.value) {
      throw new Error('操作已取消')
    }
    
    const item = items[i]
    
    try {
      // 模拟处理单个项目
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
      
      processedCount.value++
      
      // 添加成功日志
      operationLogs.value.push({
        type: 'success',
        message: `${getItemDisplayName(item)} ${action.label}成功`
      })
      
      // 随机模拟一些失败情况
      if (Math.random() < 0.1) {
        throw new Error('模拟操作失败')
      }
      
    } catch (error) {
      // 添加错误日志
      operationLogs.value.push({
        type: 'error',
        message: `${getItemDisplayName(item)} ${action.label}失败: ${error.message}`
      })
    }
  }
}

const cancelOperation = async () => {
  cancelling.value = true
  
  try {
    await ElMessageBox.confirm('确定要取消当前操作吗？', '确认取消', {
      type: 'warning'
    })
    
    // 设置取消标志
    cancelling.value = true
    progressStatus.value = 'exception'
    
    operationLogs.value.push({
      type: 'warning',
      message: '操作已被用户取消'
    })
    
  } catch {
    cancelling.value = false
  }
}

const closeProgress = () => {
  progressVisible.value = false
  currentAction.value = null
  cancelling.value = false
}

// 工具方法
const getItemDisplayName = (item) => {
  return item.name || item.title || item.username || `项目${item.id}`
}

const getConfirmIcon = () => {
  if (!currentAction.value) return 'InfoFilled'
  
  const iconMap = {
    delete: 'WarningFilled',
    disable: 'WarningFilled',
    enable: 'CircleCheckFilled',
    export: 'InfoFilled'
  }
  
  return iconMap[currentAction.value.key] || 'InfoFilled'
}

const getConfirmIconColor = () => {
  if (!currentAction.value) return '#409EFF'
  
  const colorMap = {
    delete: '#F56C6C',
    disable: '#E6A23C',
    enable: '#67C23A',
    export: '#409EFF'
  }
  
  return colorMap[currentAction.value.key] || '#409EFF'
}

const getLogIcon = (type) => {
  const iconMap = {
    success: 'CircleCheckFilled',
    error: 'CircleCloseFilled',
    warning: 'WarningFilled',
    info: 'InfoFilled'
  }
  
  return iconMap[type] || 'InfoFilled'
}

// 监听器
watch(() => props.selectedItems.length, (newLength) => {
  if (newLength === 0) {
    // 清除选择时关闭相关对话框
    if (confirmVisible.value) {
      confirmVisible.value = false
    }
  }
})
</script>

<style scoped>
.batch-operations {
  position: relative;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-bottom: 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.batch-info {
  display: flex;
  align-items: center;
  color: #1e40af;
  font-weight: 500;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.confirm-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.confirm-icon {
  flex-shrink: 0;
}

.confirm-text {
  flex: 1;
}

.confirm-text p {
  margin: 0 0 8px 0;
  color: #333;
}

.confirm-detail {
  color: #666;
  font-size: 14px;
}

.confirm-input {
  margin-top: 16px;
}

.progress-content {
  text-align: center;
}

.progress-info {
  margin-bottom: 20px;
}

.progress-info p {
  margin: 0 0 8px 0;
  color: #333;
}

.progress-detail {
  color: #666;
  font-size: 14px;
}

.progress-logs {
  margin-top: 20px;
  text-align: left;
}

.progress-logs h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
}

.log-item.success {
  color: #16a34a;
}

.log-item.error {
  color: #dc2626;
}

.log-item.warning {
  color: #d97706;
}

.log-item.info {
  color: #2563eb;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .batch-actions {
    justify-content: center;
  }
  
  .confirm-content {
    flex-direction: column;
    text-align: center;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
  }
}
</style>