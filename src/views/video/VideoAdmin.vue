<template>
  <div style="padding:16px;">
    <div style="margin-bottom:12px; display:flex; gap:12px; align-items:center;">
      <el-select v-model="filters.is_published" placeholder="发布状态" style="width:160px;" clearable>
        <el-option label="已发布" value="1" />
        <el-option label="已下架" value="0" />
      </el-select>
      <el-input v-model="filters.q" placeholder="按标题搜索" style="width:240px;" clearable />
      <el-button type="primary" @click="loadList">查询</el-button>
    </div>
    <el-table :data="items" border style="width:100%;" size="small">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="status" label="审核状态" width="120" />
      <el-table-column label="发布" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_published ? 'success' : 'info'">{{ row.is_published ? '已发布' : '已下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="play_count" label="播放" width="100" />
      <el-table-column prop="like_count" label="点赞" width="100" />
      <el-table-column prop="reward_count" label="打赏" width="100" />
      <el-table-column prop="created_at" label="上传时间" width="180" />
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="default" @click="togglePublish(row)">{{ row.is_published ? '下架' : '上架' }}</el-button>
          <el-button size="small" type="primary" @click="openEditCounts(row)">编辑计数</el-button>
          <el-button size="small" @click="openLogs(row)">操作历史</el-button>
          <el-button size="small" type="warning" @click="openComments(row)">评论管理</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="display:flex; justify-content:flex-end; margin-top:12px;">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="page.size"
        :current-page="page.page"
        @current-change="p => { page.page = p; loadList(); }"
      />
    </div>

    <el-dialog v-model="editVisible" title="编辑计数" width="420px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="播放次数">
          <el-input-number v-model="editForm.play_count" :min="0" />
        </el-form-item>
        <el-form-item label="点赞数">
          <el-input-number v-model="editForm.like_count" :min="0" />
        </el-form-item>
        <el-form-item label="打赏数">
          <el-input-number v-model="editForm.reward_count" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible=false">取消</el-button>
        <el-button type="primary" @click="submitEditCounts">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsVisible" title="操作历史" width="700px">
      <el-table :data="logs" size="small">
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="field" label="字段" width="120" />
        <el-table-column label="变更">
          <template #default="{ row }">{{ row.old_value }} → {{ row.new_value }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="commentsVisible" :title="`评论管理 - 视频ID ${currentVideoId || ''}`" width="900px">
      <div style="margin-bottom:10px; display:flex; gap:8px; align-items:center;">
        <el-input v-model="commentFilters.q" placeholder="关键词" style="width:240px;" clearable />
        <el-button type="primary" @click="loadComments">搜索</el-button>
      </div>
      <div class="comments-tree">
        <div
          v-for="item in (flatComments || [])"
          :key="item.node.id"
          class="comment-item"
          :style="{ marginLeft: (item.level * 40) + 'px' }"
        >
          <div class="comment-main">
            <div class="comment-info">
              <span class="comment-id">ID: {{ item.node?.id || 'N/A' }}</span>
              <span class="username">{{ item.node?.username || '未知用户' }}</span>
              <span v-if="item.replyToUser" style="color: #909399; font-size: 13px; margin: 0 4px;">
                回复 <span style="color: #409eff;">@{{ item.replyToUser }}</span>
              </span>
              <span class="time">{{ formatTime(item.node?.created_at) }}</span>
            </div>
            <div class="comment-content">{{ item.node?.content || '' }}</div>
            <div class="comment-actions">
              <el-button size="small" type="danger" @click="deleteComment(item.node)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!comments || comments.length === 0" class="no-comments">暂无评论</div>
      <div style="display:flex; justify-content:flex-end; margin-top:10px;">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="commentsTotal"
          :page-size="commentsPage.size"
          :current-page="commentsPage.page"
          @current-change="p => { commentsPage.page = p; loadComments(); }"
        />
      </div>
    </el-dialog>
  </div>
  
</template>

<script setup>
import axios from 'axios'
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 格式化时间函数
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const authStore = useAuthStore()
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('access_token') || authStore.accessToken || ''}` })

const items = ref([])
const total = ref(0)
const page = reactive({ page: 1, size: 10 })
const filters = reactive({ is_published: '', q: '' })

const loadList = async () => {
  try {
    const params = { page: page.page, size: page.size }
    if (filters.is_published !== '') params.is_published = filters.is_published
    if (filters.q) params.q = filters.q
    const resp = await axios.get('/api/video/admin/videos', { params, headers: headers() })
    const data = resp.data?.data || { items: [], total: 0 }
    items.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const editVisible = ref(false)
const editForm = reactive({ id: null, play_count: 0, like_count: 0, reward_count: 0 })
const openEditCounts = (row) => {
  editForm.id = row.id
  editForm.play_count = row.play_count
  editForm.like_count = row.like_count
  editForm.reward_count = row.reward_count
  editVisible.value = true
}
const submitEditCounts = async () => {
  try {
    await ElMessageBox.confirm('确定要保存计数修改吗？', '确认', { type: 'warning' })
    await axios.post(`/api/video/admin/videos/${editForm.id}/edit-counts`, {
      play_count: editForm.play_count,
      like_count: editForm.like_count,
      reward_count: editForm.reward_count
    }, { headers: headers() })
    editVisible.value = false
    ElMessage.success('已保存')
    loadList()
  } catch (e) {}
}

const togglePublish = async (row) => {
  try {
    const toPublish = !row.is_published
    await ElMessageBox.confirm(`确定要${toPublish ? '上架' : '下架'}该视频吗？`, '确认', { type: 'warning' })
    const url = toPublish ? `/api/video/admin/videos/${row.id}/publish` : `/api/video/admin/videos/${row.id}/unpublish`
    await axios.post(url, {}, { headers: headers() })
    ElMessage.success(`${toPublish ? '已上架' : '已下架'}`)
    loadList()
  } catch (e) {}
}

const logsVisible = ref(false)
const logs = ref([])
const openLogs = async (row) => {
  try {
    const resp = await axios.get(`/api/video/admin/videos/${row.id}/logs`, { params: { page: 1, size: 50 }, headers: headers() })
    logs.value = resp.data?.data?.items || []
    logsVisible.value = true
  } catch (e) {
    ElMessage.error('日志加载失败')
  }
}

const commentsVisible = ref(false)
const currentVideoId = ref(null)
const comments = ref([])
const flatComments = ref([])
const commentsTotal = ref(0)
const commentsPage = reactive({ page: 1, size: 10 })
const commentFilters = reactive({ q: '' })

// 确保数据初始化
const resetComments = () => {
  comments.value = []
  flatComments.value = []
  commentsTotal.value = 0
}
const openComments = async (row) => {
  currentVideoId.value = row.id
  commentsPage.page = 1
  resetComments() // 重置数据
  console.log('打开评论管理，视频ID:', currentVideoId.value)
  await loadComments()
  commentsVisible.value = true
}
const processComments = (nodes, parent = null) => {
  let res = [];
  for (const node of (nodes || [])) {
    // 如果没有 parent，就是 root (level 0)
    // 如果有 parent，无论 parent 是 level 0 还是 level 1，当前节点强制 level 1
    const level = parent ? 1 : 0;
    
    const item = { 
      node: node, 
      level: level,
      // 如果是第二层及以下，显示回复的对象
      // 优先使用后端返回的 reply_to_username，如果前端递归有 parent 对象则使用 parent.username，最后兜底 ID
      replyToUser: node.reply_to_username || (parent ? parent.username : null) || (node.parent_id ? ('ID:' + node.parent_id) : null)
    };
    
    // 强制更新：为了确保 Vue 能够检测到变化，我们可以打印一下日志
    // console.log('Processing comment:', node.id, 'Parent:', parent?.id, 'ReplyTo:', item.replyToUser);
    
    res.push(item);
    
    // 递归处理子评论（后端返回在 replies 字段中）
    if (node.replies && node.replies.length > 0) {
      // 子评论的 parent 就是当前 node
      // 关键点：如果当前已经是 level 1 (第二层)，那么传递下去的 parent 依然是当前 node
      // 这样下一层评论（level 1）就会显示回复当前 node 的 username
      res = res.concat(processComments(node.replies, node));
    }
  }
  return res;
}

const loadComments = async () => {
  try {
    const params = { 
      video_id: currentVideoId.value,
      page: 1,
      size: 1000 
    }
    if (commentFilters.q) params.q = commentFilters.q
    
    const resp = await axios.get('/api/video/admin/comments', { params, headers: headers() })
    const data = resp.data?.data || { items: [], total: 0 }
    
    const commentList = data.comments || data.items || []
    comments.value = commentList
    commentsTotal.value = data.total || 0
    
    // 直接处理后端返回的树形结构
    flatComments.value = processComments(comments.value)
  } catch (e) {
    console.error('加载评论失败:', e)
    ElMessage.error('评论加载失败')
    comments.value = []
    flatComments.value = []
  }
}
const deleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？如果有子评论也会被删除。', '确认', { type: 'warning' })
    await axios.delete(`/api/video/admin/comments/${comment.id}`, { headers: headers() })
    ElMessage.success('已删除')
    loadComments()
    loadList()
  } catch (e) {}
}



onMounted(loadList)
</script>

<style scoped>
.comments-tree {
  max-height: 500px;
  overflow-y: auto;
}

.comment-item {
  margin-bottom: 15px;
}

.comment-main {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
}

.comment-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.comment-id {
  color: #909399;
  font-size: 12px;
}

.username {
  color: #409eff;
  font-weight: bold;
  font-size: 13px;
}

.time {
  color: #909399;
  font-size: 12px;
}

.comment-content {
  margin: 8px 0;
  line-height: 1.5;
  color: #303133;
  word-break: break-word;
}

.comment-actions {
  text-align: right;
}

.no-comments {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}
</style>
