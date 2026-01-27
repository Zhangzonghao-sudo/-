<template>
  <el-dialog
    :title="dialogTitle"
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    width="700px"
    :before-close="handleClose"
  >
    <div class="action-content">
      <div class="review-info">
        <p><strong>审核ID:</strong> {{ review ? review.id : '' }}</p>
        <p><strong>内容类型:</strong> {{ review ? getContentTypeLabel(review.content_type) : '' }}</p>
      </div>

      <!-- 内容预览区域 (已隐藏，避免与详情弹窗重复) -->
      <!-- <div v-if="review && review.details" class="content-preview-section">
        <h4>内容预览</h4>
        ...
      </div> -->
      
      <el-form :model="form" :rules="rules" ref="actionForm" label-width="80px">
        <el-form-item label="审核备注" prop="comment">
          <el-input
            v-model="form.comment"
            type="textarea"
            :rows="4"
            :placeholder="commentPlaceholder"
            maxlength="500"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        :type="confirmButtonType" 
        @click="handleConfirm"
        :loading="loading"
      >
        {{ confirmButtonText }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
/**
 * 审核操作对话框组件
 * 创建时间: 2025-09-02
 * 创建人: zzh
 */

import request from '@/utils/request'
import { getSignedUrl } from '@/utils/storage'

export default {
  name: 'ReviewActionDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    action: {
      type: String,
      default: null // 'approve' 或 'reject'
    },
    review: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      form: {
        comment: ''
      },
      rules: {
        comment: []
      },
      videoUrlMap: {}
    }
  },
  emits: ['update:visible', 'confirm'],
  computed: {
    
    /**
     * 对话框标题
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    dialogTitle() {
      return this.action === 'approve' ? '通过审核' : '拒绝审核'
    },
    
    /**
     * 确认按钮类型
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    confirmButtonType() {
      return this.action === 'approve' ? 'success' : 'danger'
    },
    
    /**
     * 确认按钮文本
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    confirmButtonText() {
      return this.action === 'approve' ? '确认通过' : '确认拒绝'
    },
    
    /**
     * 备注输入框占位符
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    commentPlaceholder() {
      if (this.action === 'approve') {
        return '请输入通过审核的备注（可选）'
      } else {
        return '请输入拒绝审核的原因（必填）'
      }
    }
  },
  watch: {
    /**
     * 监听action变化，更新验证规则
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    action: {
      handler(newAction) {
        this.updateValidationRules(newAction)
      },
      immediate: true
    },
    
    /**
     * 监听对话框显示状态
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    visible(newVal) {
      if (newVal) {
        this.resetForm()
      }
    }
  },
  methods: {
    /**
     * 更新验证规则
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    updateValidationRules(action) {
      if (action === 'reject') {
        // 拒绝审核时备注为必填
        this.rules.comment = [
          { required: true, message: '请输入拒绝原因', trigger: 'blur' },
          { min: 5, message: '拒绝原因至少5个字符', trigger: 'blur' }
        ]
      } else {
        // 通过审核时备注为可选
        this.rules.comment = []
      }
    },
    
    /**
     * 重置表单
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    resetForm() {
      this.form.comment = ''
      if (this.$refs.actionForm) {
        this.$refs.actionForm.clearValidate()
      }
    },
    
    /**   
     * 关闭对话框
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleClose() {
      // 在关闭对话框前暂停所有视频播放
      this.pauseAllVideos()
      this.$emit('update:visible', false)
      this.resetForm()
    },

    /**
     * 暂停所有视频播放
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    pauseAllVideos() {
      this.$nextTick(() => {
        // 获取所有视频元素并暂停播放
        const videoElements = document.querySelectorAll('video')
        videoElements.forEach(video => {
          if (!video.paused) {
            video.pause()
          }
        })
      })
    },
    
    /**
     * 确认操作
     * 创建时间: 2025-09-02
     * 创建人: zzh
     */
    handleConfirm() {
      this.$refs.actionForm.validate((valid) => {
        if (valid) {
          this.loading = true
          
          // 延迟一下模拟网络请求
          setTimeout(() => {
            this.$emit('confirm', {
              comment: this.form.comment
            })
            this.loading = false
          }, 500)
        }
      })
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
     * 获取视频URL
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    getVideoUrl(videoPath) {
      if (!videoPath) return ''
      if (videoPath.startsWith('http')) return videoPath
      
      return getSignedUrl(videoPath, () => this.$forceUpdate())
    },

    /**
     * 获取图片URL
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    getImageUrl(imagePath) {
      if (!imagePath) return ''
      if (imagePath.startsWith('http')) return imagePath
      
      return getSignedUrl(imagePath, () => this.$forceUpdate())
    },

    /**
     * 格式化视频时长
     * 创建时间: 2025-09-05
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
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    formatFileSize(bytes) {
      if (!bytes) return '-'
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    },

    /**
     * 解析图片字符串
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    parseImages(imagesStr) {
      if (!imagesStr) return []
      try {
        // 如果是JSON字符串，解析它
        if (imagesStr.startsWith('[') || imagesStr.startsWith('{')) {
          return JSON.parse(imagesStr)
        }
        // 如果是逗号分隔的字符串
        return imagesStr.split(',').map(img => img.trim()).filter(img => img)
      } catch (e) {
        // 如果解析失败，按逗号分割
        return imagesStr.split(',').map(img => img.trim()).filter(img => img)
      }
    },

    /**
     * 处理视频加载错误
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    handleVideoError(event) {
      console.error('视频加载失败:', event.target.src)
      this.$message.error('视频加载失败，请检查视频文件是否存在')
    },

    /**
     * 处理图片加载错误
     * 创建时间: 2025-09-05
     * 创建人: zzh
     */
    handleImageError(event) {
      console.error('图片加载失败:', event.target.src)
      // 设置默认占位图片或隐藏图片
      event.target.style.display = 'none'
    }
  }
}
</script>

<style scoped>
.action-content {
  padding: 0 20px;
}

.review-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
}

.review-info p {
  margin: 0 0 8px 0;
  color: #606266;
}

.review-info p:last-child {
  margin-bottom: 0;
}

.content-preview-section {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.content-preview-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
  font-weight: bold;
}

/* 视频预览样式 */
.video-preview-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.video-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.video-info p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.video-info p:last-child {
  margin-bottom: 0;
}

.video-player-container {
  display: flex;
  justify-content: center;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.preview-video-player {
  width: 100%;
  max-width: 500px;
  height: auto;
  max-height: 300px;
}

.no-video {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: #f5f7fa;
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  color: #909399;
}

.no-video i {
  font-size: 48px;
  margin-bottom: 10px;
}

.no-video p {
  margin: 0;
  font-size: 14px;
}

/* 头像预览样式 */
.avatar-preview-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-info {
  flex: 1;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.avatar-info p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.avatar-info p:last-child {
  margin-bottom: 0;
}

.avatar-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e4e7ed;
}

.no-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #f5f7fa;
  border: 2px dashed #e4e7ed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.no-avatar i {
  font-size: 36px;
  margin-bottom: 5px;
}

.no-avatar p {
  margin: 0;
  font-size: 12px;
}

/* 悬赏任务预览样式 */
.bounty-preview-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bounty-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.bounty-info p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.bounty-info p:last-child {
  margin-bottom: 0;
}

.amount {
  color: #E6A23C;
  font-weight: bold;
  font-size: 16px;
}

.images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}

.preview-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.05);
}

.dialog-footer {
  text-align: right;
}
</style>
