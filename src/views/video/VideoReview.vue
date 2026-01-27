<template>
  <div class="video-review-container">
    <!-- 页面标题和统计 -->
    <div class="page-header">
      <div class="header-left">
        <h2>视频审核管理</h2>
        <p class="page-description">管理和审核用户提交的解题视频</p>
      </div>
      <div class="header-stats">
        <el-row :gutter="16">
          <el-col :span="6" v-for="stat in stats.overview" :key="stat.key">
            <div class="stat-card" :class="stat.type">
              <div class="stat-icon">
                <el-icon :size="24">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="16" align="middle">
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="审核状态" clearable @change="loadVideos">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.priority" placeholder="优先级" clearable @change="loadVideos">
            <el-option label="全部" value="" />
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="普通" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.subject" placeholder="学科" clearable @change="loadVideos">
            <el-option label="全部" value="" />
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
            <el-option label="物理" value="物理" />
            <el-option label="化学" value="化学" />
            <el-option label="生物" value="生物" />
            <el-option label="政治" value="政治" />
            <el-option label="历史" value="历史" />
            <el-option label="地理" value="地理" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="filters.uploader_name"
            placeholder="搜索上传者姓名"
            clearable
            @keyup.enter="loadVideos"
            @clear="loadVideos"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-button-group>
            <el-button @click="loadVideos" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button @click="showBatchReview" :disabled="selectedVideos.length === 0">
              <el-icon><Operation /></el-icon>
              批量审核({{ selectedVideos.length }})
            </el-button>
          </el-button-group>
        </el-col>
      </el-row>
    </el-card>

    <!-- 视频列表 -->
    <el-card class="video-list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="videos"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="视频信息" min-width="300">
          <template #default="{ row }">
            <div class="video-info">
              <div class="video-title">
                <el-tag :type="getPriorityType(row.priority)" size="small">
                  {{ getPriorityText(row.priority) }}
                </el-tag>
                <span class="title-text">{{ row.filename || '未知视频' }}</span>
              </div>
              <div class="video-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ row.uploader_name }}
                </span>
                <span class="meta-item">
                  <el-icon><Files /></el-icon>
                  {{ row.file_size_mb }}MB
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="上传时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatTime(row.upload_time) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button @click="previewVideo(row)" type="primary">
                <el-icon><VideoPlay /></el-icon>
                预览
              </el-button>
              <el-button 
                @click="reviewVideo(row)" 
                type="success"
              >
                <el-icon><Check /></el-icon>
                {{ row.status === 'pending' ? '审核' : '重新审核' }}
              </el-button>
              <el-button @click="viewDetail(row)" type="info">
                <el-icon><View /></el-icon>
                详情
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadVideos"
          @current-change="loadVideos"
        />
      </div>
    </el-card>

    <!-- 视频预览弹窗 -->
    <el-dialog v-model="previewVisible" title="视频预览" width="800px" :before-close="closePreview">
      <div class="video-preview" v-if="currentVideo">
        <div class="video-player">
          <video
            ref="videoPlayer"
            :src="getVideoUrl(currentVideo)"
            controls
            width="100%"
            height="400"
            @loadedmetadata="onVideoLoaded"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <div class="video-details">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="文件名">{{ currentVideo.filename }}</el-descriptions-item>
                <el-descriptions-item label="上传者">{{ currentVideo.uploader_name }}</el-descriptions-item>
                <el-descriptions-item label="文件大小">{{ currentVideo.file_size_mb }}MB</el-descriptions-item>
                <el-descriptions-item label="上传时间">{{ formatTime(currentVideo.upload_time) }}</el-descriptions-item>
              </el-descriptions>
            </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closePreview">关闭</el-button>
          <el-button 
            v-if="currentVideo" 
            @click="reviewVideo(currentVideo)" 
            type="success"
          >
            {{ currentVideo.status === 'pending' ? '立即审核' : '重新审核' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="reviewVisible" title="视频审核" width="600px">
      <div class="review-form" v-if="currentVideo">
        <div class="video-summary">
          <h4>{{ currentVideo.filename }}</h4>
          <p>上传者：{{ currentVideo.uploader_name }}</p>
        </div>
        
        <el-form :model="reviewForm" label-width="100px">
          <el-form-item label="审核结果" required>
            <el-radio-group v-model="reviewForm.status">
              <el-radio value="approved">
                <el-icon><CircleCheck /></el-icon>
                通过
              </el-radio>
              <el-radio value="rejected">
                <el-icon><CircleClose /></el-icon>
                拒绝
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="reviewForm.status === 'rejected'" label="拒绝原因" required>
            <el-select v-model="reviewForm.reject_reason" placeholder="请选择拒绝原因">
              <el-option label="内容违规" value="content_violation" />
              <el-option label="版权问题" value="copyright_issue" />
              <el-option label="广告内容" value="advertisement" />
              <el-option label="质量问题" value="poor_quality" />
              <el-option label="解题不完整" value="incomplete_solution" />
              <el-option label="解题错误" value="wrong_solution" />
              <el-option label="解题不清晰" value="unclear_explanation" />
              <el-option label="题目不匹配" value="topic_mismatch" />
              <el-option label="其他原因" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="reviewForm.status === 'rejected'" label="详细说明">
            <el-input
              v-model="reviewForm.reject_detail"
              type="textarea"
              :rows="3"
              placeholder="请详细说明拒绝原因..."
            />
          </el-form-item>

          <el-form-item label="审核备注">
            <el-input
              v-model="reviewForm.review_notes"
              type="textarea"
              :rows="2"
              placeholder="可选的审核备注..."
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reviewVisible = false">取消</el-button>
          <el-button 
            @click="submitReview" 
            type="primary" 
            :loading="submitting"
            :disabled="!reviewForm.status || (reviewForm.status === 'rejected' && !reviewForm.reject_reason)"
          >
            提交审核
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量审核弹窗 -->
    <el-dialog v-model="batchReviewVisible" title="批量审核" width="500px">
      <div class="batch-review-form">
        <p>已选择 <strong>{{ selectedVideos.length }}</strong> 个视频进行批量审核</p>
        
        <el-form :model="batchReviewForm" label-width="100px">
          <el-form-item label="审核结果" required>
            <el-radio-group v-model="batchReviewForm.status">
              <el-radio value="approved">批量通过</el-radio>
              <el-radio value="rejected">批量拒绝</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="batchReviewForm.status === 'rejected'" label="拒绝原因" required>
            <el-select v-model="batchReviewForm.reject_reason" placeholder="请选择拒绝原因">
              <el-option label="内容违规" value="content_violation" />
              <el-option label="版权问题" value="copyright_issue" />
              <el-option label="广告内容" value="advertisement" />
              <el-option label="质量问题" value="poor_quality" />
              <el-option label="解题不完整" value="incomplete_solution" />
              <el-option label="解题错误" value="wrong_solution" />
              <el-option label="解题不清晰" value="unclear_explanation" />
              <el-option label="题目不匹配" value="topic_mismatch" />
              <el-option label="其他原因" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="备注说明">
            <el-input
              v-model="batchReviewForm.review_notes"
              type="textarea"
              :rows="2"
              placeholder="批量审核备注..."
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchReviewVisible = false">取消</el-button>
          <el-button 
            @click="submitBatchReview" 
            type="primary" 
            :loading="submitting"
            :disabled="!batchReviewForm.status || (batchReviewForm.status === 'rejected' && !batchReviewForm.reject_reason)"
          >
            确认批量审核
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Operation, User, Document, Coin, Files,
  VideoPlay, Check, View, CircleCheck, CircleClose,
  Clock, Warning, InfoFilled, SuccessFilled
} from '@element-plus/icons-vue'
import api from '@/utils/api'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const videos = ref([])
const selectedVideos = ref([])
const currentVideo = ref(null)

// 弹窗状态
const previewVisible = ref(false)
const reviewVisible = ref(false)
const batchReviewVisible = ref(false)

// 筛选条件
const filters = reactive({
  status: '',
  priority: '',
  subject: '',
  uploader_name: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0
})

// 统计数据
const stats = reactive({
  overview: [
    { key: 'pending', label: '待审核', value: 0, type: 'warning', icon: 'Clock' },
    { key: 'approved', label: '已通过', value: 0, type: 'success', icon: 'SuccessFilled' },
    { key: 'rejected', label: '已拒绝', value: 0, type: 'danger', icon: 'Warning' },
    { key: 'total', label: '总计', value: 0, type: 'info', icon: 'InfoFilled' }
  ]
})

// 审核表单
const reviewForm = reactive({
  status: '',
  reject_reason: '',
  reject_detail: '',
  review_notes: ''
})

// 批量审核表单
const batchReviewForm = reactive({
  status: '',
  reject_reason: '',
  reject_detail: '',
  review_notes: ''
})

// 视频播放器引用
const videoPlayer = ref(null)

// 方法
const loadVideos = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...filters
    }
    
    const response = await api.get(`/api/video-review/videos`, { params })
    
    if (response.data.success) {
      videos.value = response.data.data.videos
      Object.assign(pagination, response.data.data.pagination)
    } else {
      ElMessage.error(response.data.message || '获取视频列表失败')
    }
  } catch (error) {
    console.error('加载视频列表失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await api.get(`/api/video-review/stats`)
    
    if (response.data.success) {
      const data = response.data.data.overview
      stats.overview[0].value = data.pending_videos
      stats.overview[1].value = data.approved_videos
      stats.overview[2].value = data.rejected_videos
      stats.overview[3].value = data.total_videos
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleSelectionChange = (selection) => {
  selectedVideos.value = selection
}

const previewVideo = (video) => {
  currentVideo.value = video
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
}

const reviewVideo = (video) => {
  currentVideo.value = video
  // 重置表单
  Object.assign(reviewForm, {
    status: '',
    reject_reason: '',
    reject_detail: '',
    review_notes: ''
  })
  reviewVisible.value = true
  previewVisible.value = false
}

const submitReview = async () => {
  if (!reviewForm.status) {
    ElMessage.warning('请选择审核结果')
    return
  }
  
  if (reviewForm.status === 'rejected' && !reviewForm.reject_reason) {
    ElMessage.warning('拒绝审核必须选择拒绝原因')
    return
  }

  submitting.value = true
  try {
    const response = await api.post(
      `/api/video-review/videos/${currentVideo.value.id}/review`,
      reviewForm
    )
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      reviewVisible.value = false
      loadVideos()
      loadStats()
    } else {
      ElMessage.error(response.data.message || '审核提交失败')
    }
  } catch (error) {
    console.error('提交审核失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const showBatchReview = () => {
  if (selectedVideos.value.length === 0) {
    ElMessage.warning('请先选择要审核的视频')
    return
  }
  
  // 检查是否都是待审核状态
  const pendingVideos = selectedVideos.value.filter(v => v.status === 'pending')
  if (pendingVideos.length !== selectedVideos.value.length) {
    ElMessage.warning('只能批量审核待审核状态的视频')
    return
  }
  
  // 重置表单
  Object.assign(batchReviewForm, {
    status: '',
    reject_reason: '',
    reject_detail: '',
    review_notes: ''
  })
  batchReviewVisible.value = true
}

const submitBatchReview = async () => {
  if (!batchReviewForm.status) {
    ElMessage.warning('请选择审核结果')
    return
  }
  
  if (batchReviewForm.status === 'rejected' && !batchReviewForm.reject_reason) {
    ElMessage.warning('批量拒绝必须选择拒绝原因')
    return
  }

  submitting.value = true
  try {
    const videoIds = selectedVideos.value.map(v => v.id)
    const response = await api.post(`/api/video-review/batch-review`, {
      video_ids: videoIds,
      ...batchReviewForm
    })
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      batchReviewVisible.value = false
      selectedVideos.value = []
      loadVideos()
      loadStats()
    } else {
      ElMessage.error(response.data.message || '批量审核失败')
    }
  } catch (error) {
    console.error('批量审核失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const viewDetail = (video) => {
  // 这里可以跳转到详情页面或打开详情弹窗
  ElMessage.info('详情功能开发中...')
}

const getVideoUrl = (video) => {
  const token = localStorage.getItem('access_token')
  const baseUrl = import.meta.env.VITE_API_BASE || window.location.origin
  return `${baseUrl}/api/video-review/videos/${video.id}/stream?token=${token}`
}

const onVideoLoaded = () => {
  console.log('视频加载完成')
}

// 工具方法
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || '未知'
}

const getPriorityType = (priority) => {
  const types = {
    urgent: 'danger',
    high: 'warning',
    normal: 'info',
    low: 'success'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = {
    urgent: '紧急',
    high: '高',
    normal: '普通',
    low: '低'
  }
  return texts[priority] || '普通'
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadVideos()
  loadStats()
})
</script>

<style scoped>
.video-review-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-stats {
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  border-left: 4px solid #E6A23C;
}

.stat-card.success {
  border-left: 4px solid #67C23A;
}

.stat-card.danger {
  border-left: 4px solid #F56C6C;
}

.stat-card.info {
  border-left: 4px solid #409EFF;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-card.warning .stat-icon {
  background: #fdf6ec;
  color: #E6A23C;
}

.stat-card.success .stat-icon {
  background: #f0f9ff;
  color: #67C23A;
}

.stat-card.danger .stat-icon {
  background: #fef0f0;
  color: #F56C6C;
}

.stat-card.info .stat-icon {
  background: #ecf5ff;
  color: #409EFF;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.filter-card {
  margin-bottom: 20px;
}

.video-list-card {
  margin-bottom: 20px;
}

.video-info {
  padding: 8px 0;
}

.video-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-text {
  margin-left: 8px;
  font-weight: 500;
  color: #333;
}

.video-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.video-preview {
  padding: 16px 0;
}

.video-player {
  margin-bottom: 20px;
  text-align: center;
}

.video-details {
  margin-top: 20px;
}

.review-form {
  padding: 16px 0;
}

.video-summary {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 20px;
}

.video-summary h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.video-summary p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.batch-review-form {
  padding: 16px 0;
}

.dialog-footer {
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-review-container {
    padding: 12px;
  }
  
  .header-stats .el-col {
    margin-bottom: 12px;
  }
  
  .video-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .filter-card .el-row {
    flex-direction: column;
    gap: 12px;
  }
}
</style>