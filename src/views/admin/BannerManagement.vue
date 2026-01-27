<template>
  <div class="banner-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>轮播图管理</h1>
      <p>管理应用轮播图，支持增删改查和排序功能</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">总轮播图</div>
            </div>
            <el-icon class="stat-icon"><Picture /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.active || 0 }}</div>
              <div class="stat-label">启用中</div>
            </div>
            <el-icon class="stat-icon active"><CircleCheck /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.inactive || 0 }}</div>
              <div class="stat-label">已禁用</div>
            </div>
            <el-icon class="stat-icon inactive"><CircleClose /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.today_added || 0 }}</div>
              <div class="stat-label">今日新增</div>
            </div>
            <el-icon class="stat-icon today"><Plus /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增轮播图
        </el-button>
        <el-button @click="handleSort">
          <el-icon><Sort /></el-icon>
          排序管理
        </el-button>
        <el-button @click="handleRefreshApp">
          <el-icon><Refresh /></el-icon>
          刷新App
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select v-model="filters.status" placeholder="状态筛选" style="width: 120px; margin-right: 10px;" @change="handleFilter">
          <el-option label="全部" value="" />
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
        </el-select>
        <el-button @click="loadBanners">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 轮播图列表 -->
    <el-card class="table-card">
      <el-table 
        v-loading="loading" 
        :data="banners" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="预览" width="120">
          <template #default="{ row }">
            <div v-if="!row.image_url" class="no-image">
              <span>无图片</span>
            </div>
            <el-image
              v-else
              :src="getImageUrl(row.image_url)"
              :preview-src-list="[getImageUrl(row.image_url)]"
              fit="cover"
              style="width: 80px; height: 45px; border-radius: 4px;"
              :preview-teleported="true"
              @error="handleImageError"
            >
              <template #error>
                <div class="image-error">
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="轮播图标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入轮播图标题"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="排序值" prop="sort_order">
          <el-input-number
            v-model="formData.sort_order"
            :min="1"
            :max="999"
            placeholder="请输入排序值"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="轮播图图片">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/*"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择图片
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png/gif 格式，文件大小不超过 10MB
                <span v-if="!isEdit" style="color: #f56c6c;">（必选）</span>
                <span v-else style="color: #909399;">（可选，不选择则保持原图）</span>
              </div>
            </template>
          </el-upload>
          <div v-if="formData.image" class="image-preview">
            <img :src="URL.createObjectURL(formData.image)" alt="预览" />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 排序对话框 -->
    <el-dialog
      v-model="sortDialogVisible"
      title="轮播图排序"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="sort-container">
        <div class="sort-tip">
          <el-alert
            title="使用上下按钮调整轮播图显示顺序"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        
        <div class="sort-list">
          <div
            v-for="(banner, index) in sortBanners"
            :key="banner.id"
            class="sort-item"
          >
            <div class="sort-item-content">
              <div class="sort-number">{{ index + 1 }}</div>
              <div class="sort-image">
                <el-image
                  :src="getImageUrl(banner.image_url)"
                  fit="cover"
                />
              </div>
              <div class="sort-info">
                <div class="sort-title">{{ banner.title }}</div>
                <div class="sort-status">
                  <el-tag :type="banner.status === 'active' ? 'success' : 'danger'" size="small">
                    {{ banner.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </div>
              </div>
              <div class="sort-actions">
                <el-button
                  size="small"
                  :disabled="index === 0"
                  @click="moveBanner(index, 'up')"
                >
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  :disabled="index === sortBanners.length - 1"
                  @click="moveBanner(index, 'down')"
                >
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="sortDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSort">保存排序</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, triggerRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bannerApi } from '@/api/banner'
import api from '@/utils/api'
import { getSignedUrl as getSignedUrlGlobal } from '@/utils/storage'
import {
  Picture,
  CircleCheck,
  CircleClose,
  Plus,
  Sort,
  Refresh,
  Upload,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const banners = ref([])
const selectedBanners = ref([])

// 统计数据
const statistics = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  today_added: 0
})

// 筛选条件
const filters = reactive({
  status: ''
})

// 分页数据
const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0
})

// 获取图片完整URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl

  const signed = getSignedUrlGlobal(imageUrl, banners)
  if (signed) return signed

  const baseUrl = import.meta.env.VITE_API_BASE || window.location.origin
  return imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`
}

// 处理图片加载错误
const handleImageError = (error) => {
  console.warn('图片加载失败:', error)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 加载轮播图列表
const loadBanners = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      status: filters.status
    }
    
    const response = await bannerApi.getBanners(params)
    
    if (response.data && response.data.banners) {
      banners.value = response.data.banners
    }
    
    if (response.data && response.data.pagination) {
      pagination.total = response.data.pagination.total
    }
    
    // 更新统计信息
    await loadStatistics()
  } catch (error) {
    console.error('加载轮播图失败:', error)
    ElMessage.error('加载轮播图失败')
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStatistics = async () => {
  try {
    const response = await bannerApi.getStatistics()
    Object.assign(statistics, response.data)
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 处理选择变化
const handleSelectionChange = (selection) => {
  selectedBanners.value = selection
}

// 处理筛选
const handleFilter = () => {
  pagination.page = 1
  loadBanners()
}

// 处理分页大小变化
const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  loadBanners()
}

// 处理页码变化
const handleCurrentChange = (page) => {
  pagination.page = page
  loadBanners()
}

// 表单对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const currentBanner = ref(null)

// 表单数据
const formData = reactive({
  title: '',
  sort_order: 1,
  status: 'active',
  image: null
})

// 表单规则
const formRules = {
  title: [
    { required: true, message: '请输入轮播图标题', trigger: 'blur' },
    { max: 255, message: '标题不能超过255个字符', trigger: 'blur' }
  ],
  sort_order: [
    { required: true, message: '请输入排序值', trigger: 'blur' },
    { type: 'number', min: 1, message: '排序值必须大于0', trigger: 'blur' }
  ]
}

const formRef = ref()

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    title: '',
    sort_order: 1,
    status: 'active',
    image: null
  })
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 处理新增
const handleAdd = () => {
  dialogTitle.value = '新增轮播图'
  isEdit.value = false
  currentBanner.value = null
  resetForm()
  
  // 设置默认排序值为最大值+1
  const maxSortOrder = banners.value.length > 0 
    ? Math.max(...banners.value.map(b => b.sort_order)) 
    : 0
  formData.sort_order = maxSortOrder + 1
  
  dialogVisible.value = true
}

// 处理编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑轮播图'
  isEdit.value = true
  currentBanner.value = row
  Object.assign(formData, {
    title: row.title,
    sort_order: row.sort_order,
    status: row.status,
    image: null
  })
  dialogVisible.value = true
}

// 处理文件选择
const handleFileChange = (file) => {
  formData.image = file.raw
  return false // 阻止自动上传
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 验证图片（新增时必须上传图片）
    if (!isEdit.value && !formData.image) {
      ElMessage.error('请选择轮播图图片')
      return
    }
    
    const submitData = new FormData()
    submitData.append('title', formData.title)
    submitData.append('sort_order', formData.sort_order)
    submitData.append('status', formData.status)
    
    if (formData.image) {
      submitData.append('image', formData.image)
    }
    
    if (isEdit.value) {
      // 编辑
      await bannerApi.updateBanner(currentBanner.value.id, submitData)
      ElMessage.success('轮播图更新成功')
    } else {
      // 新增
      await bannerApi.createBanner(submitData)
      ElMessage.success('轮播图创建成功')
    }
    
    dialogVisible.value = false
    loadBanners()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

// 处理查看
const handleView = (row) => {
  ElMessage.info(`查看轮播图: ${row.title}`)
}

// 排序对话框相关
const sortDialogVisible = ref(false)
const sortBanners = ref([])

// 处理排序
const handleSort = async () => {
  try {
    // 获取所有轮播图用于排序
    const response = await bannerApi.getBanners({ per_page: 100 })
    if (response.data && response.data.banners) {
      sortBanners.value = [...response.data.banners].sort((a, b) => a.sort_order - b.sort_order)
      sortDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取排序数据失败:', error)
    ElMessage.error('获取排序数据失败')
  }
}

// 移动轮播图位置
const moveBanner = (index, direction) => {
  const newSortBanners = [...sortBanners.value]
  
  if (direction === 'up' && index > 0) {
    // 向上移动
    [newSortBanners[index], newSortBanners[index - 1]] = [newSortBanners[index - 1], newSortBanners[index]]
  } else if (direction === 'down' && index < newSortBanners.length - 1) {
    // 向下移动
    [newSortBanners[index], newSortBanners[index + 1]] = [newSortBanners[index + 1], newSortBanners[index]]
  }
  
  sortBanners.value = newSortBanners
}

// 保存排序
const handleSaveSort = async () => {
  try {
    // 构建排序数据
    const sortData = sortBanners.value.map((banner, index) => ({
      id: banner.id,
      sort_order: index + 1
    }))
    
    await bannerApi.updateSort(sortData)
    ElMessage.success('排序保存成功')
    sortDialogVisible.value = false
    loadBanners()
  } catch (error) {
    console.error('保存排序失败:', error)
    ElMessage.error('保存排序失败')
  }
}

// 处理状态切换
const handleToggleStatus = async (row) => {
  try {
    await bannerApi.toggleStatus(row.id)
    ElMessage.success(`轮播图已${row.status === 'active' ? '禁用' : '启用'}`)
    loadBanners()
  } catch (error) {
    console.error('切换状态失败:', error)
    ElMessage.error('切换状态失败')
  }
}

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除轮播图 "${row.title}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await bannerApi.deleteBanner(row.id)
    ElMessage.success('删除成功')
    loadBanners()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 处理刷新App
const handleRefreshApp = async () => {
  try {
    await bannerApi.refreshApp()
    ElMessage.success('App刷新请求已发送')
  } catch (error) {
    console.error('刷新App失败:', error)
    ElMessage.error('刷新App失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  font-size: 40px;
  opacity: 0.3;
}

.stat-icon.active {
  color: #67c23a;
}

.stat-icon.inactive {
  color: #f56c6c;
}

.stat-icon.today {
  color: #409eff;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.table-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.image-preview {
  margin-top: 10px;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.sort-container {
  max-height: 500px;
  overflow-y: auto;
}

.sort-tip {
  margin-bottom: 20px;
}

.sort-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sort-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 15px;
  background: #fafafa;
}

.sort-item-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sort-number {
  width: 30px;
  height: 30px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.sort-image {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
}

.sort-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.sort-info {
  flex: 1;
}

.sort-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.sort-actions {
  display: flex;
  gap: 5px;
}

/* 图片相关样式 */
.no-image,
.image-error {
  width: 80px;
  height: 45px;
  border-radius: 4px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  border: 1px dashed #ddd;
}

.image-error {
  background: #fef0f0;
  color: #f56c6c;
  border-color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .banner-management {
    padding: 10px;
  }
  
  .toolbar {
    flex-direction: column;
    gap: 10px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style>