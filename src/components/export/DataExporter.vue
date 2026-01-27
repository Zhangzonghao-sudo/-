<template>
  <div class="data-exporter">
    <el-dialog
      v-model="visible"
      title="数据导出"
      width="600px"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form :model="exportForm" :rules="exportRules" ref="formRef" label-width="100px">
        <!-- 导出类型 -->
        <el-form-item label="导出类型" prop="type">
          <el-radio-group v-model="exportForm.type" @change="handleTypeChange">
            <el-radio label="excel">Excel表格</el-radio>
            <el-radio label="pdf">PDF报告</el-radio>
            <el-radio label="csv">CSV文件</el-radio>
            <el-radio label="json">JSON数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 数据范围 -->
        <el-form-item label="数据范围" prop="dateRange">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>

        <!-- 导出内容 -->
        <el-form-item label="导出内容" prop="content">
          <el-checkbox-group v-model="exportForm.content">
            <el-checkbox
              v-for="option in contentOptions"
              :key="option.value"
              :label="option.value"
              :disabled="option.disabled"
            >
              {{ option.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <!-- Excel特定选项 -->
        <template v-if="exportForm.type === 'excel'">
          <el-form-item label="工作表设置">
            <el-checkbox v-model="exportForm.excelOptions.multiSheet">
              多工作表模式
            </el-checkbox>
            <el-checkbox v-model="exportForm.excelOptions.includeCharts">
              包含图表
            </el-checkbox>
          </el-form-item>
        </template>

        <!-- PDF特定选项 -->
        <template v-if="exportForm.type === 'pdf'">
          <el-form-item label="页面设置">
            <el-select v-model="exportForm.pdfOptions.pageSize" placeholder="页面大小">
              <el-option label="A4" value="A4" />
              <el-option label="A3" value="A3" />
              <el-option label="Letter" value="Letter" />
            </el-select>
          </el-form-item>
          <el-form-item label="页面方向">
            <el-radio-group v-model="exportForm.pdfOptions.orientation">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <!-- 高级选项 -->
        <el-form-item label="高级选项">
          <el-checkbox v-model="exportForm.includeMetadata">
            包含元数据
          </el-checkbox>
          <el-checkbox v-model="exportForm.compressFile">
            压缩文件
          </el-checkbox>
          <el-checkbox v-model="exportForm.emailNotify">
            邮件通知
          </el-checkbox>
        </el-form-item>

        <!-- 邮件设置 -->
        <el-form-item v-if="exportForm.emailNotify" label="邮件地址" prop="email">
          <el-input
            v-model="exportForm.email"
            placeholder="请输入邮件地址"
            type="email"
          />
        </el-form-item>

        <!-- 文件名设置 -->
        <el-form-item label="文件名" prop="filename">
          <el-input v-model="exportForm.filename" placeholder="自动生成">
            <template #append>
              .{{ getFileExtension() }}
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 导出预览 -->
      <div class="export-preview" v-if="previewData">
        <h4>导出预览</h4>
        <div class="preview-stats">
          <el-tag>预计文件大小: {{ previewData.estimatedSize }}</el-tag>
          <el-tag type="info">记录数量: {{ previewData.recordCount }}</el-tag>
          <el-tag type="warning">预计耗时: {{ previewData.estimatedTime }}</el-tag>
        </div>
      </div>

      <!-- 导出进度 -->
      <div class="export-progress" v-if="exporting">
        <el-progress
          :percentage="exportProgress"
          :status="exportStatus"
          :stroke-width="8"
        >
          <template #default="{ percentage }">
            <span class="progress-text">{{ exportStatusText }} {{ percentage }}%</span>
          </template>
        </el-progress>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose" :disabled="exporting">取消</el-button>
          <el-button @click="previewExport" :loading="previewing">预览</el-button>
          <el-button
            type="primary"
            @click="startExport"
            :loading="exporting"
            :disabled="!isFormValid"
          >
            {{ exporting ? '导出中...' : '开始导出' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dataType: {
    type: String,
    default: 'analytics' // analytics, messages, users, etc.
  },
  defaultContent: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'export-complete'])

// 响应式数据
const formRef = ref(null)
const visible = ref(false)
const exporting = ref(false)
const previewing = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const exportStatusText = ref('')
const previewData = ref(null)

// 表单数据
const exportForm = ref({
  type: 'excel',
  dateRange: [],
  content: [],
  filename: '',
  includeMetadata: true,
  compressFile: false,
  emailNotify: false,
  email: '',
  excelOptions: {
    multiSheet: false,
    includeCharts: true
  },
  pdfOptions: {
    pageSize: 'A4',
    orientation: 'portrait'
  }
})

// 表单验证规则
const exportRules = {
  type: [
    { required: true, message: '请选择导出类型', trigger: 'change' }
  ],
  dateRange: [
    { required: true, message: '请选择数据范围', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请选择导出内容', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 内容选项
const contentOptions = computed(() => {
  const baseOptions = {
    analytics: [
      { label: '概览数据', value: 'overview', disabled: false },
      { label: '消息统计', value: 'messages', disabled: false },
      { label: '用户活跃度', value: 'user_activity', disabled: false },
      { label: '客服绩效', value: 'cs_performance', disabled: false },
      { label: '文件分布', value: 'file_distribution', disabled: false }
    ],
    messages: [
      { label: '消息记录', value: 'message_records', disabled: false },
      { label: '会话信息', value: 'session_info', disabled: false },
      { label: '文件附件', value: 'attachments', disabled: false }
    ],
    users: [
      { label: '用户基本信息', value: 'user_basic', disabled: false },
      { label: '用户活动记录', value: 'user_activity', disabled: false },
      { label: '权限信息', value: 'permissions', disabled: false }
    ]
  }
  
  return baseOptions[props.dataType] || baseOptions.analytics
})

// 计算属性
const isFormValid = computed(() => {
  return exportForm.value.type &&
         exportForm.value.dateRange.length === 2 &&
         exportForm.value.content.length > 0
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
  if (newVal) {
    resetForm()
  }
})

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
const handleClose = () => {
  if (!exporting.value) {
    visible.value = false
    resetForm()
  }
}

const resetForm = () => {
  exportForm.value = {
    type: 'excel',
    dateRange: [],
    content: props.defaultContent || [],
    filename: '',
    includeMetadata: true,
    compressFile: false,
    emailNotify: false,
    email: '',
    excelOptions: {
      multiSheet: false,
      includeCharts: true
    },
    pdfOptions: {
      pageSize: 'A4',
      orientation: 'portrait'
    }
  }
  
  exportProgress.value = 0
  exportStatus.value = ''
  exportStatusText.value = ''
  previewData.value = null
  exporting.value = false
  previewing.value = false
}

const handleTypeChange = () => {
  // 根据导出类型调整内容选项
  if (exportForm.value.type === 'pdf') {
    // PDF不支持某些复杂数据
    exportForm.value.content = exportForm.value.content.filter(
      item => !['attachments'].includes(item)
    )
  }
}

const getFileExtension = () => {
  const extensions = {
    excel: 'xlsx',
    pdf: 'pdf',
    csv: 'csv',
    json: 'json'
  }
  return extensions[exportForm.value.type] || 'xlsx'
}

const previewExport = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    previewing.value = true
    
    // 模拟预览数据计算
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const recordCount = Math.floor(Math.random() * 10000) + 1000
    const estimatedSize = formatFileSize(recordCount * 0.5 * 1024) // 假设每条记录0.5KB
    const estimatedTime = Math.ceil(recordCount / 1000) + 's'
    
    previewData.value = {
      recordCount,
      estimatedSize,
      estimatedTime
    }
    
    ElMessage.success('预览生成成功')
  } catch (error) {
    console.error('预览失败:', error)
  } finally {
    previewing.value = false
  }
}

const startExport = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    exporting.value = true
    exportProgress.value = 0
    exportStatus.value = ''
    exportStatusText.value = '准备导出'
    
    // 模拟导出过程
    const steps = [
      { text: '准备数据', duration: 1000 },
      { text: '处理数据', duration: 2000 },
      { text: '生成文件', duration: 1500 },
      { text: '压缩文件', duration: 800 },
      { text: '完成导出', duration: 500 }
    ]
    
    let currentProgress = 0
    const progressStep = 100 / steps.length
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      exportStatusText.value = step.text
      
      await new Promise(resolve => setTimeout(resolve, step.duration))
      
      currentProgress += progressStep
      exportProgress.value = Math.min(currentProgress, 100)
    }
    
    exportStatus.value = 'success'
    exportStatusText.value = '导出完成'
    
    // 生成下载链接
    const filename = exportForm.value.filename || 
                    `${props.dataType}_export_${new Date().toISOString().split('T')[0]}`
    const fullFilename = `${filename}.${getFileExtension()}`
    
    // 模拟文件下载
    downloadFile(fullFilename)
    
    // 发送邮件通知
    if (exportForm.value.emailNotify && exportForm.value.email) {
      ElNotification({
        title: '邮件通知',
        message: `导出文件已发送至 ${exportForm.value.email}`,
        type: 'success'
      })
    }
    
    emit('export-complete', {
      filename: fullFilename,
      type: exportForm.value.type,
      recordCount: previewData.value?.recordCount || 0
    })
    
    ElMessage.success('导出完成！')
    
    // 3秒后关闭对话框
    setTimeout(() => {
      handleClose()
    }, 3000)
    
  } catch (error) {
    console.error('导出失败:', error)
    exportStatus.value = 'exception'
    exportStatusText.value = '导出失败'
    ElMessage.error('导出失败，请重试')
  } finally {
    setTimeout(() => {
      exporting.value = false
    }, 1000)
  }
}

const downloadFile = (filename) => {
  // 创建模拟文件内容
  const content = generateMockFileContent()
  const blob = new Blob([content], { 
    type: getMimeType(exportForm.value.type) 
  })
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  URL.revokeObjectURL(url)
}

const generateMockFileContent = () => {
  const type = exportForm.value.type
  
  switch (type) {
    case 'csv':
      return '日期,消息数量,用户数量,客服响应时间\n2024-01-01,150,45,2.3\n2024-01-02,180,52,1.8'
    case 'json':
      return JSON.stringify({
        export_info: {
          type: props.dataType,
          date_range: exportForm.value.dateRange,
          generated_at: new Date().toISOString()
        },
        data: [
          { date: '2024-01-01', messages: 150, users: 45, response_time: 2.3 },
          { date: '2024-01-02', messages: 180, users: 52, response_time: 1.8 }
        ]
      }, null, 2)
    default:
      return '模拟导出文件内容'
  }
}

const getMimeType = (type) => {
  const mimeTypes = {
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
    csv: 'text/csv',
    json: 'application/json'
  }
  return mimeTypes[type] || 'application/octet-stream'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.data-exporter {
  /* 样式已在对话框中定义 */
}

.export-preview {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.export-preview h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.preview-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.export-progress {
  margin: 20px 0;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preview-stats {
    flex-direction: column;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
  }
}
</style>
