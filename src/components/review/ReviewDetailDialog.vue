<template>
  <el-dialog
    title="审核详情"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="review" class="review-detail" ref="dialogContent">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <div slot="header" class="card-header">
          <span>基本信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>审核ID:</label>
              <span>{{ review.id }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>内容类型:</label>
              <el-tag :type="getContentTypeTagType(review.content_type)">
                {{ getContentTypeLabel(review.content_type) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>审核状态:</label>
              <el-tag :type="getStatusTagType(review.status)">
                {{ getStatusLabel(review.status) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>提交时间:</label>
              <span>{{ formatDateTime(review.created_at) }}</span>
            </div>
          </el-col>
          <el-col :span="12" v-if="review.review_time">
            <div class="info-item">
              <label>审核时间:</label>
              <span>{{ formatDateTime(review.review_time) }}</span>
            </div>
          </el-col>
          <el-col :span="12" v-if="review.reviewer_id">
            <div class="info-item">
              <label>审核员ID:</label>
              <span>{{ review.reviewer_id }}</span>
            </div>
          </el-col>
        </el-row>
        <div v-if="review.review_notes" class="info-item full-width">
          <label>审核备注:</label>
          <div class="comment-content">{{ review.review_notes }}</div>
        </div>
      </el-card>

      <!-- 内容详情 -->
      <el-card class="content-card">
        <div slot="header" class="card-header">
          <span>内容详情</span>
        </div>
        
        <!-- 悬赏任务详情 -->
        <template v-if="review.content_type === 'bounty' && review.details">
          <div class="bounty-detail">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <label>悬赏标题:</label>
                  <span>{{ review.details.title || '无标题' }}</span>
                </div>
                <div class="info-item">
                  <label>悬赏金额:</label>
                  <span class="amount">¥{{ review.details.reward_amount || 0 }}</span>
                </div>
                <div class="info-item">
                  <label>发布者:</label>
                  <span>{{ review.details.publisher_name || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>学科:</label>
                  <span>{{ review.details.subject || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>年级:</label>
                  <span>{{ review.details.grade || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>悬赏状态:</label>
                  <el-tag :type="getBountyStatusTagType(review.details.status)">
                    {{ getBountyStatusLabel(review.details.status) }}
                  </el-tag>
                </div>
                <div class="info-item">
                  <label>创建时间:</label>
                  <span>{{ formatDateTime(review.details.created_at) }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item full-width">
                  <label>题目描述:</label>
                  <div class="description-content">{{ review.details.description || '暂无描述' }}</div>
                </div>
              </el-col>
            </el-row>

            <div v-if="review.details.images" class="info-item full-width" style="margin-top: 15px;">
              <label>题目图片:</label>
              <div class="images-container">
                <el-image 
                  v-for="(image, index) in parseImages(review.details.images)" 
                  :key="index"
                  :src="getImageUrl(image)" 
                  alt="题目图片"
                  class="bounty-image"
                  :preview-src-list="getImageUrls()"
                  :initial-index="index"
                  fit="contain"
                  preview-teleported
                />
              </div>
            </div>
          </div>
        </template>

        <!-- 悬赏视频详情 -->
        <template v-else-if="review.content_type === 'bounty_video' && review.details">
          <div class="bounty-video-detail">
            <!-- 悬赏信息 -->
            <div class="bounty-info-section">
              <h4>相关悬赏信息</h4>
              <div class="info-item">
                <label>悬赏标题:</label>
                <span>{{ review.details.bounty_title || '无标题' }}</span>
              </div>
              <div class="info-item">
                <label>悬赏金额:</label>
                <span class="amount">¥{{ review.details.reward_amount || 0 }}</span>
              </div>
              <div class="info-item">
                <label>发布者:</label>
                <span>{{ review.details.publisher_name || '-' }}</span>
              </div>
              <div class="info-item">
                <label>学科:</label>
                <span>{{ review.details.subject || '-' }}</span>
              </div>
              <div class="info-item">
                <label>年级:</label>
                <span>{{ review.details.grade || '-' }}</span>
              </div>
              <div v-if="review.details.images" class="info-item full-width">
                <label>题目图片:</label>
                <div class="images-container">
                  <img 
                    v-for="(image, index) in parseImages(review.details.images)" 
                    :key="index"
                    :src="getImageUrl(image)" 
                    alt="题目图片"
                    class="bounty-image"
                    @error="handleImageError"
                  />
                </div>
              </div>
            </div>
            
            <!-- 视频信息 -->
            <div class="video-info-section">
              <h4>解题视频信息</h4>
              <div class="video-info-container">
                <!-- 左侧：基本信息 -->
                <div class="video-info-left">
                  <div class="info-item">
                    <label>提交者:</label>
                    <span>{{ review.details.submitter_name || '-' }}</span>
                  </div>
                  <div class="info-item">
                    <label>视频时长:</label>
                    <span>{{ formatDuration(review.details.video_duration) }}</span>
                  </div>
                  <div class="info-item">
                    <label>文件大小:</label>
                    <span>{{ formatFileSize(review.details.video_size) }}</span>
                  </div>
                </div>

                <!-- 右侧：拒绝原因（投诉理由） -->
                <div class="video-info-right" v-if="review.details.dispute_reason">
                  <div class="reject-reason-box">
                    <div class="reject-title">投诉理由</div>
                    <div class="reject-content">{{ review.details.dispute_reason }}</div>
                  </div>
                </div>
              </div>

              <div v-if="review.details.video_path" class="video-player-section">
                <label>视频预览:</label>
                <video 
                  :src="videoSrc" 
                  :key="videoSrc"
                  controls 
                  class="video-player"
                  preload="metadata"
                  crossorigin="anonymous"
                >
                  您的浏览器不支持视频播放
                </video>
              </div>
            </div>

        <!-- 悬赏视频特有字段 -->
        <template v-if="review.content_type === 'bounty_video'">
          <div class="info-item full-width">
            <label>答案描述:</label>
            <div class="description-content">
              {{ review.details?.video_description || '暂无描述' }}
            </div>
          </div>
        </template>

            <div class="info-item full-width" v-if="review.details.reject_reason && review.content_type !== 'bounty_video'">
              <label>拒绝原因:</label>
              <div class="comment-content">{{ review.details.reject_reason }}</div>
            </div>
          </div>
        </template>

        <!-- 用户视频详情 -->
        <template v-else-if="review.content_type === 'user_video' && review.details">
          <div class="user-video-detail">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <label>视频类型:</label>
                  <span>{{ review.details.video_type || '用户视频' }}</span>
                </div>
                <div class="info-item">
                  <label>视频ID:</label>
                  <span>{{ review.details.video_id || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>年级:</label>
                  <el-tag size="small" v-if="review.details.grade">{{ review.details.grade }}</el-tag>
                  <span v-else>无</span>
                </div>
                <div class="info-item">
                  <label>学科:</label>
                  <el-tag size="small" type="success" v-if="review.details.subject">{{ review.details.subject }}</el-tag>
                  <span v-else>无</span>
                </div>
                <div class="info-item">
                  <label>题型:</label>
                  <el-tag size="small" type="warning" v-if="review.details.topic_type">{{ review.details.topic_type }}</el-tag>
                  <span v-else>无</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item full-width">
                  <label>视频标题:</label>
                  <div class="description-content">{{ review.details.title || '无标题' }}</div>
                </div>
                <div class="info-item full-width">
                  <label>视频简介:</label>
                  <div class="description-content">{{ review.details.description || review.details.video_description || '无简介' }}</div>
                </div>
              </el-col>
            </el-row>
            
            <div class="info-item full-width" style="margin-top: 15px;">
              <label>知识点:</label>
              <div class="description-content">{{ review.details.knowledge_points || '无知识点' }}</div>
            </div>

            <div v-if="review.details.video_path" class="video-player-section">
              <label>视频预览:</label>
              <video 
                :src="videoSrc" 
                :key="videoSrc"
                controls 
                class="video-player"
                preload="metadata"
                crossorigin="anonymous"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
            
            <!-- 封面展示 -->
            <div v-if="review.details.cover_url" class="info-item full-width">
              <label>视频封面:</label>
              <div class="images-container">
                <el-image 
                  :src="getImageUrl(review.details.cover_url)" 
                  alt="视频封面"
                  class="bounty-image"
                  :preview-src-list="[getImageUrl(review.details.cover_url)]"
                  fit="contain"
                  preview-teleported
                />
              </div>
            </div>
            
            <!-- 图片列表展示 -->
            <div v-if="currentImageUrls && currentImageUrls.length > 0" class="info-item full-width">
              <label>相关图片:</label>
              <div class="images-container">
                <el-image 
                  v-for="(image, index) in currentImageUrls" 
                  :key="index"
                  :src="image" 
                  alt="相关图片"
                  class="bounty-image"
                  :preview-src-list="currentImageUrls"
                  :initial-index="index"
                  fit="contain"
                  preview-teleported
                />
              </div>
            </div>

            <div v-if="review.details.reject_reason" class="info-item full-width">
              <label>拒绝原因:</label>
              <div class="description-content">
                {{ review.details.reject_reason }}
              </div>
            </div>
          </div>
        </template>

        <!-- 头像详情 -->
        <template v-else-if="review.content_type === 'user_avatar' && review.details">
          <div class="avatar-detail">
            <div class="avatar-preview-section">
              <div class="avatar-image">
                <img 
                  v-if="review.details.avatar_url" 
                  :src="getImageUrl(review.details.avatar_url)" 
                  alt="用户头像"
                  @error="handleImageError"
                />
                <div v-else class="no-avatar">无头像</div>
              </div>
              <div class="avatar-info">
                <div class="info-item">
                  <label>用户ID:</label>
                  <span>{{ review.details.user_id || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>用户名:</label>
                  <span>{{ review.details.username || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>用户状态:</label>
                  <el-tag :type="review.details.user_exists ? 'success' : 'danger'">
                    {{ review.details.user_exists ? '正常' : '已删除' }}
                  </el-tag>
                </div>
                <div v-if="review.details.reject_reason" class="info-item full-width">
                  <label>拒绝原因:</label>
                  <div class="description-content">
                    {{ review.details.reject_reason }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="no-details">
          暂无详细信息
        </div>
      </el-card>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
      <el-button 
        v-if="review && review.status === 'pending'"
        type="success" 
        @click="handleApprove"
      >
        通过审核
      </el-button>
      <el-button 
        v-if="review && review.status === 'pending'"
        type="danger" 
        @click="handleReject"
      >
        拒绝审核
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
/**
 * 审核详情对话框组件
 * 创建时间: 2025-09-02
 * 创建人: zzh
 */
import { getSignedUrl } from '@/utils/storage'

export default {
  name: 'ReviewDetailDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    review: {
      type: Object,
      default: null
    }
  },
  emits: ['update:visible', 'approve', 'reject'],
  data() {
    return {
      videoUrlMap: {},
      videoSrc: '',
      currentImageUrls: []
    }
  },
  watch: {
    visible: {
      handler(val) {
        if (val) { 
          this.videoSrc = ''
          this.currentImageUrls = []
          this.updateVideoSrc()
          this.updateImageUrls()
        }
      },
      immediate: true
    },
    review: {
      handler() {
        if (this.visible) { 
          this.videoSrc = ''
          this.currentImageUrls = []
          this.updateVideoSrc()
          this.updateImageUrls()
        }
      },
      deep: true
    }
  },
  mounted() {
    this.updateVideoSrc()
    this.updateImageUrls()
  },
  methods: {
    /**
     * 关闭对话框
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleClose() {
      // 暂停所有视频元素
      this.$nextTick(() => {
        const videos = this.$refs.dialogContent?.querySelectorAll('video') || [];
        videos.forEach(video => {
          video.pause();
          video.currentTime = 0; // 可选：重置播放位置
        });
      });
      this.$emit('update:visible', false);
    },

    /**
     * 通过审核
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleApprove() {
      this.$emit('approve', this.review)
    },

    /**
     * 拒绝审核
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleReject() {
      this.$emit('reject', this.review)
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
     * 格式化文件大小
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    formatFileSize(bytes) {
      if (!bytes) return '-'
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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
     * 创建时间: 2025-09-05
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
    },

    /**
     * 获取图片URL
     * 创建时间: 2025-12-01
     * 创建人: zzh
     */
    getImageUrl(imagePath) {
      if (!imagePath) return ''
      if (imagePath.startsWith('http')) return imagePath
      
      return getSignedUrl(imagePath, () => this.$forceUpdate())
    },

    /**
     * 获取图片URL列表
     * 创建时间: 2025-12-17
     * 创建人: zzh
     */
    getImageUrls(images) {
      if (!images) return []
      // 如果 images 已经是数组（后端解析好的签名URL列表），直接返回
      if (Array.isArray(images)) return images
      
      // 否则解析字符串并获取签名URL
      const imageList = this.parseImages(images)
      return imageList.map(img => this.getImageUrl(img))
    },

    /**
     * 更新图片URL列表
     * 创建时间: 2025-12-17
     * 创建人: zzh
     */
    updateImageUrls() {
      const images = this.review?.details?.images
      if (!images) {
        this.currentImageUrls = []
        return
      }
      
      // 如果已经是数组，直接赋值（但也要检查是否需要签名）
      // 这里假设后端返回的images如果不是JSON字符串，就是一个URL字符串
      // 我们统一处理为数组
      let imageList = []
      if (Array.isArray(images)) {
        imageList = images
      } else {
        imageList = this.parseImages(images)
      }
      
      // 异步获取所有签名URL
      // 使用 map 触发 getSignedUrl，并通过回调更新响应式数据
      // 注意：这里我们不直接赋值给 currentImageUrls，而是先占位，等回调更新
      // 为了避免闪烁，可以先赋原始值，或者等待所有 promise 完成（如果 getSignedUrl 支持 Promise）
      // 但目前的 getSignedUrl 是基于回调/缓存的
      
      // 简单起见，我们重新计算整个数组并赋值
      // getSignedUrl 内部有缓存，第二次调用会很快
      
      const updateList = () => {
        this.currentImageUrls = imageList.map(img => {
          if (img.startsWith('http')) return img // 已经是签名URL，直接返回
          return getSignedUrl(img, () => {
            // 当某个URL获取成功时，触发重新计算
            // 注意：这里可能会导致频繁更新，防抖可能更好
            // 但考虑到图片数量不多，直接更新也可以
            updateList()
          })
        }).filter(url => url) // 过滤掉暂未获取到的URL，或者保留空字符串占位？
        // el-image src为空会显示失败，所以最好过滤掉或者给个loading占位
        // 这里保留空字符串，让el-image处理（可能会短暂显示FAILED，但很快会更新）
        // 或者我们可以只在所有URL都准备好时才显示？
        // 更好的体验是：有URL就显示
      }
      
      updateList()
    },

    /**
     * 获取视频URL
     * 创建时间: 2025-12-01
     * 创建人: zzh
     */
    updateVideoSrc() {
      const p = this.review && this.review.details && this.review.details.video_path
      if (!p) { this.videoSrc = ''; return }
      if (p.startsWith('http')) { this.videoSrc = p; return }
      
      // 使用全局缓存获取URL，传入回调触发更新
      const url = getSignedUrl(p, () => {
        this.videoSrc = getSignedUrl(p)
      })
      
      // 如果有缓存直接返回，否则等待回调更新
      if (url) {
        this.videoSrc = url
      }
    },

    /**
     * 获取悬赏状态标签类型
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    getBountyStatusTagType(status) {
      const typeMap = {
        'pending_manual_review': 'warning',
        'published': 'success',
        'accepted': 'primary',
        'submitted': 'warning',
        'completed': 'success',
        'cancelled': 'danger',
        'expired': 'info'
      }
      return typeMap[status] || 'default'
    },

    /**
     * 获取悬赏状态标签文本
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    getBountyStatusLabel(status) {
      const labelMap = {
        'pending_manual_review': '待人工审核',
        'published': '已发布',
        'accepted': '已接单',
        'submitted': '已提交',
        'completed': '已完成',
        'cancelled': '已取消',
        'expired': '已过期'
      }
      return labelMap[status] || status
    },

    /**
     * 获取所有图片URL数组
     * 创建时间: 2025-09-09
     * 创建人: zzh
     */
    getImageUrls() {
      if (!this.review?.details?.images) return []
      return this.parseImages(this.review.details.images).map(image => this.getImageUrl(image))
    }
  }
}
</script>

<style scoped>
.review-detail {
  max-height: 600px;
  overflow-y: auto;
}

.info-card, .content-card {
  margin-bottom: 20px;
}

.info-card:last-child, .content-card:last-child {
  margin-bottom: 0;
}

.card-header {
  font-weight: bold;
  color: #303133;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.info-item.full-width {
  flex-direction: column;
}

.info-item label {
  font-weight: bold;
  color: #606266;
  min-width: 100px;
  margin-right: 10px;
}

.info-item.full-width label {
  margin-bottom: 5px;
}

.comment-content, .description-content {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  white-space: pre-wrap;
  word-break: break-word;
}

.amount {
  color: #E6A23C;
  font-weight: bold;
  font-size: 16px;
}

.video-info-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.video-info-left {
  flex: 1;
}

.video-info-right {
  flex: 1;
  margin-left: 20px;
}

.reject-reason-box {
  border: 1px solid #f56c6c;
  border-radius: 4px;
  padding: 10px;
  background-color: #fef0f0;
  height: 100%;
}

.reject-title {
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 5px;
}

.reject-content {
  color: #606266;
  white-space: pre-wrap;
  word-break: break-word;
}

.video-preview-section {
  display: flex;
  margin-bottom: 20px;
}

.video-thumbnail {
  margin-right: 20px;
}

.video-thumbnail img {
  width: 160px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.no-thumbnail {
  width: 160px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  color: #909399;
}

.video-info {
  flex: 1;
}

.video-player-section {
  margin-top: 20px;
}

.video-player-section label {
  display: block;
  font-weight: bold;
  color: #606266;
  margin-bottom: 10px;
}

.video-player {
  width: 100%;
  max-width: 600px;
  height: auto;
  border-radius: 8px;
}

.avatar-preview-section {
  display: flex;
  align-items: center;
}

.avatar-image {
  margin-right: 20px;
}

.avatar-image img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 1px solid #e4e7ed;
}

.no-avatar {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 50%;
  color: #909399;
}

.avatar-info {
  flex: 1;
}

.no-details {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.dialog-footer {
  text-align: right;
}

/* 新增样式 */
.bounty-video-detail .bounty-info-section,
.bounty-video-detail .video-info-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.bounty-video-detail h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: bold;
}

.images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.bounty-image {
  width: 300px;
  height: auto;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.bounty-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

/* Element Plus 图片组件样式调整 */
.bounty-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.bounty-image :deep(.el-image__inner) {
  border-radius: 8px;
}

.user-video-detail {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.avatar-preview-section {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}
</style>
