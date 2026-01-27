<template>
  <div class="video-comments">
    <div class="comment-form">
      <el-input
        v-model="newComment"
        type="textarea"
        :rows="3"
        placeholder="写下你的评论..."
        maxlength="500"
        show-word-limit
      />
      <div class="comment-actions">
        <el-button type="primary" @click="submitComment" :loading="submitting" size="small">
          发布评论
        </el-button>
      </div>
    </div>

    <div class="comments-list" v-if="comments.length > 0">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <span class="username">{{ comment.username }}</span>
          <span class="time">{{ formatTime(comment.created_at) }}</span>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
        <div class="comment-actions">
          <el-button type="text" size="small" @click="showReplyInput(comment.id)">
            回复
          </el-button>
          <el-button 
            type="text" 
            size="small" 
            @click="deleteComment(comment.id)"
            v-if="comment.user_id === currentUserId"
          >
            删除
          </el-button>
        </div>
        
        <!-- 回复输入框 -->
        <div v-if="replyToId === comment.id" class="reply-form">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="2"
            :placeholder="`回复 ${comment.username}...`"
            maxlength="500"
            show-word-limit
          />
          <div class="reply-actions">
            <el-button size="small" @click="cancelReply">取消</el-button>
            <el-button type="primary" size="small" @click="submitReply(comment.id)" :loading="submitting">
              回复
            </el-button>
          </div>
        </div>
        
        <!-- 回复列表 -->
        <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
          <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <div class="reply-header">
              <span class="username">{{ reply.username }}</span>
              <span class="time">{{ formatTime(reply.created_at) }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="reply-actions">
              <el-button 
                type="text" 
                size="small" 
                @click="deleteComment(reply.id)"
                v-if="reply.user_id === currentUserId"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-comments">
      暂无评论，快来发表第一条评论吧！
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'VideoComments',
  props: {
    videoId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const authStore = useAuthStore()
    const comments = ref([])
    const newComment = ref('')
    const replyToId = ref(null)
    const replyContent = ref('')
    const submitting = ref(false)
    
    const currentUserId = authStore.user?.id

    const loadComments = async () => {
      try {
        const response = await axios.get('/api/video/comments', {
          params: { video_id: props.videoId }
        })
        if (response.data.success) {
          comments.value = response.data.data.comments
        }
      } catch (error) {
        ElMessage.error('加载评论失败')
        console.error('Load comments error:', error)
      }
    }

    const submitComment = async () => {
      if (!newComment.value.trim()) {
        ElMessage.warning('请输入评论内容')
        return
      }

      submitting.value = true
      try {
        const response = await axios.post('/api/video/comments', {
          video_id: props.videoId,
          content: newComment.value.trim()
        })
        
        if (response.data.success) {
          ElMessage.success('评论发布成功')
          newComment.value = ''
          await loadComments()
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '发布评论失败')
      } finally {
        submitting.value = false
      }
    }

    const showReplyInput = (commentId) => {
      replyToId.value = commentId
      replyContent.value = ''
    }

    const cancelReply = () => {
      replyToId.value = null
      replyContent.value = ''
    }

    const submitReply = async (parentId) => {
      if (!replyContent.value.trim()) {
        ElMessage.warning('请输入回复内容')
        return
      }

      submitting.value = true
      try {
        const response = await axios.post('/api/video/comments', {
          video_id: props.videoId,
          content: replyContent.value.trim(),
          parent_id: parentId
        })
        
        if (response.data.success) {
          ElMessage.success('回复成功')
          cancelReply()
          await loadComments()
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '回复失败')
      } finally {
        submitting.value = false
      }
    }

    const deleteComment = async (commentId) => {
      try {
        await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await axios.delete(`/api/video/comments/${commentId}`)
        if (response.data.success) {
          ElMessage.success('删除成功')
          await loadComments()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '删除失败')
        }
      }
    }

    const formatTime = (timeStr) => {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
      
      return date.toLocaleDateString()
    }

    onMounted(() => {
      loadComments()
    })

    return {
      comments,
      newComment,
      replyToId,
      replyContent,
      submitting,
      currentUserId,
      loadComments,
      submitComment,
      showReplyInput,
      cancelReply,
      submitReply,
      deleteComment,
      formatTime
    }
  }
}
</script>

<style scoped>
.video-comments {
  padding: 20px;
}

.comment-form {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.comment-actions {
  margin-top: 10px;
  text-align: right;
}

.comments-list {
  margin-top: 20px;
}

.comment-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.username {
  font-weight: bold;
  color: #409eff;
  margin-right: 10px;
}

.time {
  color: #909399;
  font-size: 12px;
}

.comment-content {
  margin: 10px 0;
  line-height: 1.6;
}

.comment-actions {
  margin-top: 10px;
}

.replies-list {
  margin-top: 15px;
  margin-left: 30px;
  padding-left: 15px;
  border-left: 2px solid #e4e7ed;
}

.reply-item {
  margin-bottom: 15px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.reply-content {
  margin: 8px 0;
  line-height: 1.5;
  font-size: 14px;
}

.reply-actions {
  margin-top: 8px;
}

.reply-form {
  margin-top: 15px;
  padding: 12px;
  background: #f0f2f5;
  border-radius: 6px;
}

.reply-actions {
  margin-top: 8px;
  text-align: right;
}

.no-comments {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}
</style>