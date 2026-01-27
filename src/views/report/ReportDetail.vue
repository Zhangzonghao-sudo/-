<template>
  <div class="report-detail" v-loading="loading">
    <div v-if="report" class="detail-container">
      <!-- 左侧：被举报内容 -->
      <div class="left-panel">
        <h3>被举报内容</h3>
        <div class="video-card">
          <div class="video-player" v-if="report.video">
            <video 
              :src="report.video.content_path" 
              controls 
              style="width: 100%; max-height: 400px; background: #000;"
            ></video>
          </div>
          <div class="video-meta" v-if="report.video">
            <h4>{{ report.video.title }}</h4>
            <p>上传者: {{ report.video.uploader_name }}</p>
            <p>上传时间: {{ report.video.created_at }}</p>
            <p>当前状态: 
              <el-tag size="small">{{ report.video.status }}</el-tag>
            </p>
          </div>
          <div v-else class="error-tip">
            视频信息获取失败或已删除
          </div>
        </div>
      </div>

      <!-- 右侧：举报证据 -->
      <div class="right-panel">
        <h3>举报证据</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="举报人">
            {{ report.reporter?.username }} (ID: {{ report.reporter_id }})
          </el-descriptions-item>
          <el-descriptions-item label="举报类型">
            <span class="highlight">{{ getCategoryText(report.category) }}</span>
            <span v-if="report.sub_category"> - {{ getSubCategoryText(report.sub_category) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="具体原因">
            <el-tag type="danger">{{ getReasonText(report.reason) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">
            <div class="description-box">{{ report.description || '无描述' }}</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="侵权补充" v-if="report.category === 'legal'">
             <div v-if="report.original_link">
                <span class="label">原链接: </span>
                <a :href="report.original_link" target="_blank" class="link-item">{{ report.original_link }}</a>
             </div>
             <div style="margin-top: 5px;">
                <span class="label">同意转发: </span>
                <el-tag size="small" :type="report.agree_forward ? 'success' : 'info'">
                  {{ report.agree_forward ? '同意' : '不同意' }}
                </el-tag>
             </div>
          </el-descriptions-item>

          <el-descriptions-item label="证据图片">
            <div v-if="report.proof_imgs && report.proof_imgs.length">
              <el-image 
                v-for="(img, index) in report.proof_imgs" 
                :key="index"
                :src="img"
                :preview-src-list="report.proof_imgs"
                class="proof-img"
                fit="cover"
              />
            </div>
            <span v-else>无图片</span>
          </el-descriptions-item>
          <el-descriptions-item label="证据链接">
            <div v-if="report.proof_links && report.proof_links.length">
              <div v-for="(link, index) in report.proof_links" :key="index">
                <a :href="link" target="_blank" class="link-item">{{ link }}</a>
              </div>
            </div>
            <span v-else>无链接</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 处理结果展示 -->
        <div v-if="report.status !== 'pending'" class="result-box">
          <h3>处理结果</h3>
          <p>处理人ID: {{ report.handler_id }}</p>
          <p>处理时间: {{ report.handled_at }}</p>
          <p>处理动作: 
            <el-tag :type="report.handle_result === 'punish' ? 'success' : 'info'">
              {{ report.handle_result === 'punish' ? '确认违规/已处罚' : '已驳回' }}
            </el-tag>
          </p>
          <p>备注: {{ report.admin_notes }}</p>
        </div>

        <!-- 处理操作区 -->
        <div v-if="report.status === 'pending'" class="action-box">
          <h3>处理操作</h3>
          <el-input
            v-model="handleNote"
            type="textarea"
            placeholder="请输入处理备注/理由"
            :rows="3"
            style="margin-bottom: 10px;"
          />
          <div class="btn-group">
            <el-button type="info" @click="submitHandle('reject')">驳回举报</el-button>
            <el-button type="danger" @click="submitHandle('punish')">确认违规 (下架视频)</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { getReportDetail, handleReport } from '@/api/report'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  reportId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['processed'])

const loading = ref(false)
const report = ref(null)
const handleNote = ref('')

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getReportDetail(props.reportId)
    if (res.code === 200) {
      report.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const submitHandle = (action) => {
  const actionText = action === 'punish' ? '确认违规并下架视频' : '驳回举报'
  const confirmType = action === 'punish' ? 'warning' : 'info'
  
  ElMessageBox.confirm(
    `确定要执行【${actionText}】操作吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: confirmType
    }
  ).then(async () => {
    try {
      const res = await handleReport(props.reportId, {
        action: action,
        note: handleNote.value
      })
      if (res.code === 200) {
        ElMessage.success('处理成功')
        emit('processed')
      } else {
        ElMessage.error(res.msg || '处理失败')
      }
    } catch (error) {
      ElMessage.error('网络错误')
    }
  })
}

const getCategoryText = (val) => {
  const map = {
    'legal_rights': '侵犯合法权益',
    'community_rules': '违反社区规则'
  }
  return map[val] || val
}

const getSubCategoryText = (val) => {
  const map = {
    'personal_ip': '侵犯个人知识产权',
    'personal_rights': '侵犯个人人身权益',
    'enterprise_rights': '侵犯企业权益'
  }
  return map[val] || val
}

const getReasonText = (val) => {
  return val // 暂时直接显示
}

onMounted(() => {
  if (props.reportId) {
    fetchDetail()
  }
})
</script>

<style scoped>
.detail-container {
  display: flex;
  gap: 20px;
}
.left-panel {
  flex: 4;
  border-right: 1px solid #eee;
  padding-right: 20px;
}
.right-panel {
  flex: 6;
}
.video-card {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}
.video-meta {
  margin-top: 10px;
}
.proof-img {
  width: 100px;
  height: 100px;
  margin-right: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
.link-item {
  display: block;
  margin-bottom: 5px;
  color: #409EFF;
  text-decoration: none;
}
.description-box {
  white-space: pre-wrap;
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
}
.action-box, .result-box {
  margin-top: 20px;
  padding: 15px;
  background: #f0f9eb;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
}
.action-box {
  background: #fff6f6;
  border-color: #ffe6e6;
}
.btn-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.highlight {
  font-weight: bold;
  color: #333;
}
</style>
