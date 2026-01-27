<template>
  <div class="review-management">
    <div class="page-header">
      <h1>审核管理</h1>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <i class="el-icon-refresh"></i> 刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card pending">
            <div class="stats-content">
              <div class="stats-number">{{ stats.pending || 0 }}</div>
              <div class="stats-label">待审核</div>
            </div>
            <i class="el-icon-time stats-icon"></i>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card approved">
            <div class="stats-content">
              <div class="stats-number">{{ stats.approved || 0 }}</div>
              <div class="stats-label">已通过</div>
            </div>
            <i class="el-icon-check stats-icon"></i>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card rejected">
            <div class="stats-content">
              <div class="stats-number">{{ stats.rejected || 0 }}</div>
              <div class="stats-label">已拒绝</div>
            </div>
            <i class="el-icon-close stats-icon"></i>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card total">
            <div class="stats-content">
              <div class="stats-number">{{ stats.total || 0 }}</div>
              <div class="stats-label">总计</div>
            </div>
            <i class="el-icon-document stats-icon"></i>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="内容类型">
          <el-select v-model="filters.content_type" placeholder="全部类型" clearable @change="handleSearch">
            <el-option label="悬赏任务" value="bounty"></el-option>
            <el-option label="悬赏视频" value="bounty_video"></el-option>
            <el-option label="用户视频" value="user_video"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="待审核" value="pending"></el-option>
            <el-option label="已通过" value="approved"></el-option>
            <el-option label="已拒绝" value="rejected"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核列表 -->
    <el-card class="table-card">
      <el-table
        :data="reviews"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column label="内容类型" width="120">
          <template #default="scope">
            <el-tag :type="getContentTypeTagType(scope.row.content_type)">
              {{ getContentTypeLabel(scope.row.content_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容预览" min-width="200">
          <template #default="scope">
            <div class="content-preview">
              <template v-if="scope.row.content_type === 'bounty'">
                <div class="bounty-preview">
                  <div class="bounty-content">
                    <div class="title">{{ scope.row.details?.title || '无标题' }}</div>
                    <div class="publisher">发布者: {{ scope.row.details?.publisher_name || '未知' }}</div>
                    <div class="amount">¥{{ scope.row.details?.reward_amount || 0 }}</div>
                    <div class="subject">{{ scope.row.details?.subject || '' }} {{ scope.row.details?.grade || '' }}</div>
                  </div>
                  <div v-if="scope.row.details?.images" class="bounty-images">
                    <img 
                      v-for="(image, index) in parseImages(scope.row.details.images)" 
                      :key="index"
                      :src="getImageUrl(image)" 
                      alt="题目图片"
                      class="bounty-image"
                      @error="handleImageError"
                    />
                  </div>
                </div>
              </template>
              <template v-else-if="scope.row.content_type === 'bounty_video'">
                <div class="bounty-video-preview">
                  <div class="video-icon">📹</div>
                  <div class="video-info">
                    <div class="title">{{ scope.row.details?.bounty_title || '解题视频' }}</div>
                    <div class="publisher">发布者: {{ scope.row.details?.publisher_name || '未知' }}</div>
                    <div class="amount">¥{{ scope.row.details?.reward_amount || 0 }}</div>
                    <div class="video-type">{{ scope.row.details?.video_type || '解题视频' }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="scope.row.content_type === 'user_video'">
                <div class="video-preview">
                  <div class="video-icon">📹</div>
                  <div class="video-info">
                    <div class="title">{{ scope.row.details?.video_type || '用户视频' }}</div>
                    <div class="video-id">视频ID: {{ scope.row.details?.video_id || '未知' }}</div>
                    <div class="reason" v-if="scope.row.details?.reject_reason">{{ scope.row.details.reject_reason }}</div>
                  </div>
                </div>
              </template>
              <template v-else-if="scope.row.content_type === 'user_avatar'">
                <div class="avatar-preview">
                  <img 
                    v-if="scope.row.details?.avatar_url" 
                    :src="getImageUrl(scope.row.details.avatar_url)" 
                    class="avatar"
                    @error="handleImageError"
                  />
                  <div class="user-info">
                    <div class="username">{{ scope.row.details?.username || '未知用户' }}</div>
                    <div class="user-id">ID: {{ scope.row.details?.user_id || '未知' }}</div>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="提交时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="review_time" label="审核时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.review_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              size="small" 
              @click="viewDetail(scope.row)"
            >
              查看详情
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              type="success" 
              @click="approveReview(scope.row)"
            >
              通过
            </el-button>
            <el-button 
              v-if="scope.row.status === 'pending'"
              size="small" 
              type="danger" 
              @click="rejectReview(scope.row)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.per_page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        >
        </el-pagination>
      </div>
    </el-card>

    <!-- 审核详情对话框 -->
    <ReviewDetailDialog
      v-model:visible="detailDialogVisible"
      :review="selectedReview"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <!-- 审核操作对话框 -->
    <ReviewActionDialog
      v-model:visible="actionDialogVisible"
      :action="currentAction"
      :review="selectedReview"
      @confirm="handleActionConfirm"
    />
  </div>
</template>

<script>
/**
 * 内容审核管理页面
 * 创建时间: 2025-09-02
 * 创建人: zzh
 */

import ReviewDetailDialog from '@/components/review/ReviewDetailDialog.vue'
import ReviewActionDialog from '@/components/review/ReviewActionDialog.vue'
import { reviewApi } from '@/api/review'
import { io } from 'socket.io-client'

export default {
  name: 'ReviewManagement',
  components: {
    ReviewDetailDialog,
    ReviewActionDialog
  },
  data() {
    return {
      loading: false,
      reviews: [],
      stats: {},
      filters: {
        content_type: '',
        status: ''
      },
      pagination: {
        page: 1,
        per_page: 20,
        total: 0,
        pages: 0,
        has_prev: false,
        has_next: false
      },
      detailDialogVisible: false,
      actionDialogVisible: false,
      selectedReview: null,
      currentAction: null,
      // Socket.IO连接实例
      socket: null
    }
  },
  created() {
    this.loadData()
    this.loadStats()
  },
  mounted() {
    // 初始化Socket订阅
    this.initSocket()
  },
  beforeUnmount() {
    // 组件卸载时清理连接
    this.cleanupSocket()
  },
  methods: {
    /**
     * 加载审核列表数据
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          per_page: this.pagination.per_page,
          ...this.filters
        }
        
        console.log('发送请求参数:', params)
        const response = await reviewApi.getReviews(params)
        console.log('收到响应数据:', response)
        
        // 修复数据访问路径
        this.reviews = response.data?.reviews || response.reviews || []
        if (response.data?.pagination || response.pagination) {
          this.pagination = response.data?.pagination || response.pagination
        }
        
        console.log('设置后的reviews:', this.reviews)
        console.log('设置后的pagination:', this.pagination)
      } catch (error) {
        this.$message.error('加载审核列表失败')
        console.error('加载审核列表失败:', error)
        // 确保即使出错也有默认值
        this.reviews = []
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载统计数据
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    async loadStats() {
      try {
        const response = await reviewApi.getStats()
        console.log('统计数据响应:', response)
        // 修复统计数据访问路径
        this.stats = response.data || response
        console.log('设置后的stats:', this.stats)
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },

    /**
     * 初始化Socket.IO连接并订阅审核更新事件
     * 创建时间: 2025-11-13
     * 创建人: zzh
     */
    initSocket() {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          console.warn('未找到JWT令牌，跳过Socket.IO连接')
          return
        }

        // 为避免影响资产管理页，使用默认命名空间连接；path 与后端保持一致
        const transports = import.meta.env.VITE_SOCKET_TRANSPORTS === 'websocket' ? ['websocket', 'polling'] : ['polling']
        
        // 使用环境变量配置的后端地址
        const apiBase = import.meta.env.VITE_API_BASE
        const wsUrl = apiBase
        
        this.socket = io(wsUrl, {
          path: '/socket.io',
          transports: transports,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          query: { token },
          extraHeaders: { 'Authorization': `Bearer ${token}` }
        })

        // 连接成功日志
        this.socket.on('connect', () => {
          console.log('审核管理 Socket.IO 已连接')
        })

        // 监听鉴权错误
        this.socket.on('auth_error', (data) => {
          console.error('审核管理 Socket.IO 鉴权失败:', data)
        })

        // 监听审核更新事件（由后台通过消息代理广播）
        this.socket.on('review_update', (evt) => {
          // evt结构: { type: 'review_created' | 'review_status_changed', data: {...}, timestamp: '...' }
          if (!evt || !evt.type) return
          const eventType = evt.type
          // 严格模式：仅在有“新审核数据”时刷新，忽略状态变更（与审核人员操作解耦）
          if (eventType === 'review_created') {
            console.log('收到审核新增事件，触发刷新:', eventType, evt)
            this.refreshData()
          } else if (eventType === 'review_status_changed') {
            // 如需多人协同同步，可改为触发刷新；默认不刷新
            console.debug('收到审核状态变更事件（默认忽略刷新）:', evt)
          }
        })

        // 错误处理日志
        this.socket.on('error', (error) => {
          console.error('审核管理 Socket.IO 错误:', error)
        })

        // 断开连接日志
        this.socket.on('disconnect', (reason) => {
          console.log('审核管理 Socket.IO 断开:', reason)
        })
      } catch (e) {
        console.warn('审核管理 Socket.IO 客户端初始化失败', e)
      }
    },

    /**
     * 清理Socket.IO连接
     * 创建时间: 2025-11-13
     * 创建人: zzh
     */
    cleanupSocket() {
      try {
        if (this.socket) {
          this.socket.removeAllListeners('review_update')
          this.socket.disconnect()
          this.socket = null
        }
      } catch (e) {
        console.warn('清理审核管理 Socket.IO 连接失败', e)
      }
    },

    /**
     * 刷新数据
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    refreshData() {
      this.loadData()
      this.loadStats()
    },

    /**
     * 搜索
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleSearch() {
      this.pagination.page = 1
      this.loadData()
    },

    /**
     * 重置筛选条件
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    resetFilters() {
      this.filters = {
        content_type: '',
        status: ''
      }
      this.pagination.page = 1
      this.loadData()
    },

    /**
     * 查看详情
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    async viewDetail(review) {
      try {
        console.log('viewDetail clicked', review)
        const resp = await reviewApi.getReviewDetail(review.id)
        const detailed = resp && resp.data ? resp.data : review
        this.selectedReview = detailed
        this.detailDialogVisible = true
        console.log('detailDialogVisible set to:', this.detailDialogVisible)
      } catch (e) {
        console.error('load review detail failed', e)
        this.selectedReview = review
        this.detailDialogVisible = true
      }
    },

    /**
     * 通过审核
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    approveReview(review) {
      console.log('approveReview clicked', review)
      this.selectedReview = review
      this.currentAction = 'approve'
      this.actionDialogVisible = true
      console.log('actionDialogVisible set to:', this.actionDialogVisible)
    },

    /**
     * 拒绝审核
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    rejectReview(review) {
      console.log('rejectReview clicked', review)
      this.selectedReview = review
      this.currentAction = 'reject'
      this.actionDialogVisible = true
      console.log('actionDialogVisible set to:', this.actionDialogVisible)
    },

    /**
     * 处理审核操作确认
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    async handleActionConfirm(data) {
      try {
        if (this.currentAction === 'approve') {
          await reviewApi.approveReview(this.selectedReview.id, data.comment)
          this.$message.success('审核通过成功')
        } else if (this.currentAction === 'reject') {
          await reviewApi.rejectReview(this.selectedReview.id, data.comment)
          this.$message.success('审核拒绝成功')
        }
        
        this.actionDialogVisible = false
        this.refreshData()
      } catch (error) {
        this.$message.error('审核操作失败')
        console.error('审核操作失败:', error)
      }
    },

    /**
     * 处理审核通过（从详情对话框）
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    async handleApprove(review) {
      // 显示操作对话框
      this.selectedReview = review
      this.currentAction = 'approve'
      this.detailDialogVisible = false
      this.actionDialogVisible = true
    },

    /**
     * 处理审核拒绝（从详情对话框）
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    async handleReject(review) {
      // 显示操作对话框
      this.selectedReview = review
      this.currentAction = 'reject'
      this.detailDialogVisible = false
      this.actionDialogVisible = true
    },

    /**
     * 分页大小改变
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleSizeChange(val) {
      this.pagination.per_page = val
      this.pagination.page = 1
      this.loadData()
    },

    /**
     * 当前页改变
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleCurrentChange(val) {
      this.pagination.page = val
      this.loadData()
    },

    /**
     * 获取内容类型标签类型
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    getContentTypeTagType(contentType) {
      const typeMap = {
        'bounty': 'warning',
        'bounty_video': 'primary',
        'user_video': 'success',
        'user_avatar': 'info'
      }
      return typeMap[contentType] || 'default'
    },

    /**
     * 获取内容类型标签文本
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    getContentTypeLabel(contentType) {
      const labelMap = {
        'bounty': '悬赏任务',
        'bounty_video': '悬赏视频',
        'user_video': '用户视频',
        'user_avatar': '用户头像'
      }
      return labelMap[contentType] || contentType
    },

    /**
     * 获取状态标签类型
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    getStatusTagType(status) {
      const typeMap = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger'
      }
      return typeMap[status] || 'default'
    },

    /**
     * 获取状态标签文本
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    getStatusLabel(status) {
      const labelMap = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
      }
      return labelMap[status] || status
    },

    /**
     * 格式化日期时间
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return new Date(dateTime).toLocaleString('zh-CN')
    },

    /**
     * 格式化视频时长
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    formatDuration(seconds) {
      if (!seconds) return '-'
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    },

    /**
     * 获取图片完整URL
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    getImageUrl(imagePath) {
      if (!imagePath) return ''
      // 如果路径已经是完整URL，直接返回
      if (imagePath.startsWith('http')) return imagePath
      // 否则拼接后端服务器地址（使用环境变量提高灵活性）
      const baseUrl = import.meta.env.VITE_API_BASE || 'https://43.136.120.26:5001'
      return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
    },

    /**
     * 处理图片加载错误
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleImageError(event) {
      if (event.target.src.startsWith('data:image/svg+xml')) {
        event.target.style.display = 'none'
        return
      }
      const svg = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#f2f2f2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="14">Image</text></svg>')
      event.target.src = `data:image/svg+xml;charset=utf-8,${svg}`
    },

    /**
     * 解析图片字符串
     * 创建时间: 2025-09-08
     * 创建人: zzh
     */
    parseImages(imagesStr) {
      if (!imagesStr) return []
      // 如果已经是数组，直接返回
      if (Array.isArray(imagesStr)) return imagesStr
      
      try {
        // 确保是字符串
        if (typeof imagesStr !== 'string') return []

        // 如果是JSON字符串，解析它
        if (imagesStr.trim().startsWith('[') || imagesStr.trim().startsWith('{')) {
          const parsed = JSON.parse(imagesStr)
          return Array.isArray(parsed) ? parsed : [parsed]
        }
        // 如果是逗号分隔的字符串
        return imagesStr.split(',').map(img => img.trim()).filter(img => img)
      } catch (e) {
        // 如果解析失败，尝试按逗号分割
        if (typeof imagesStr === 'string') {
          return imagesStr.split(',').map(img => img.trim()).filter(img => img)
        }
        return []
      }
    }
  }
}
</script>

<style scoped>
.review-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  position: relative;
  overflow: hidden;
}

.stats-content {
  position: relative;
  z-index: 2;
}

.stats-number {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.stats-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  opacity: 0.3;
}

.stats-card.pending .stats-number { color: #E6A23C; }
.stats-card.approved .stats-number { color: #67C23A; }
.stats-card.rejected .stats-number { color: #F56C6C; }
.stats-card.total .stats-number { color: #409EFF; }

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin: 0;
}

.table-card {
  margin-bottom: 20px;
}

.content-preview {
  display: flex;
  align-items: center;
}

.bounty-preview {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.bounty-preview .bounty-content {
  flex: 1;
}

.bounty-preview .title {
  font-weight: bold;
  margin-bottom: 3px;
  font-size: 14px;
}

.bounty-preview .publisher {
  color: #909399;
  font-size: 12px;
  margin-bottom: 3px;
}

.bounty-preview .amount {
  color: #E6A23C;
  font-weight: bold;
  margin-bottom: 3px;
}

.bounty-preview .subject {
  color: #606266;
  font-size: 12px;
}

.bounty-preview .bounty-images {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.bounty-preview .bounty-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: transform 0.2s;
}

.bounty-preview .bounty-image:hover {
  transform: scale(1.1);
}

.bounty-video-preview {
  display: flex;
  align-items: center;
}

.bounty-video-preview .video-icon {
  font-size: 24px;
  margin-right: 10px;
}

.bounty-video-preview .video-info .title {
  font-weight: bold;
  margin-bottom: 3px;
  font-size: 14px;
}

.bounty-video-preview .video-info .publisher {
  color: #909399;
  font-size: 12px;
  margin-bottom: 3px;
}

.bounty-video-preview .video-info .amount {
  color: #E6A23C;
  font-weight: bold;
  margin-bottom: 3px;
}

.bounty-video-preview .video-info .video-type {
  color: #606266;
  font-size: 12px;
}

.video-preview {
  display: flex;
  align-items: center;
}

.video-preview .video-icon {
  font-size: 24px;
  margin-right: 10px;
}

.video-info .title {
  font-weight: bold;
  margin-bottom: 5px;
}

.video-info .video-id {
  color: #909399;
  font-size: 12px;
  margin-bottom: 3px;
}

.video-info .reason {
  color: #F56C6C;
  font-size: 12px;
}

.avatar-preview {
  display: flex;
  align-items: center;
}

.avatar-preview .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info .username {
  font-weight: bold;
  color: #303133;
  font-size: 13px;
  margin-bottom: 2px;
}

.user-info .user-id {
  color: #909399;
  font-size: 12px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}
</style>
