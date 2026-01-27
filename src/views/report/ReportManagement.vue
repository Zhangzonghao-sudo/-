<template>
  <div class="report-management">
    <div class="header">
      <h2>举报中心</h2>
      <div class="filters">
        <el-select v-model="filters.status" placeholder="状态筛选" clearable @change="fetchReports">
          <el-option label="待处理" value="pending" />
          <el-option label="已处理" value="processed" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-select v-model="filters.category" placeholder="类型筛选" clearable @change="fetchReports" style="margin-left: 10px;">
          <el-option label="侵犯合法权益" value="legal_rights" />
          <el-option label="违反社区规则" value="community_rules" />
        </el-select>
      </div>
    </div>

    <el-table :data="reports" v-loading="loading" style="width: 100%; margin-top: 20px;">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="举报时间" width="180">
        <template #default="{ row }">
          {{ row.created_at }}
        </template>
      </el-table-column>
      <el-table-column label="举报人" width="150">
        <template #default="{ row }">
          {{ row.reporter_name }} (ID: {{ row.reporter_id }})
        </template>
      </el-table-column>
      <el-table-column label="被举报视频" min-width="200">
        <template #default="{ row }">
          <div class="video-info">
            <span>{{ row.video_title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="违规类型" width="180">
        <template #default="{ row }">
          <el-tag :type="row.category === 'legal_rights' ? 'danger' : 'warning'">
            {{ getCategoryText(row.category) }}
          </el-tag>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">
            {{ getReasonText(row.reason) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="viewDetail(row)">
            {{ row.status === 'pending' ? '处理' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="举报详情处理"
      width="80%"
      destroy-on-close
    >
      <report-detail 
        v-if="currentReportId" 
        :report-id="currentReportId" 
        @processed="handleProcessed"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getReports } from '@/api/report'
import ReportDetail from './ReportDetail.vue'

const loading = ref(false)
const reports = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentReportId = ref(null)

const filters = reactive({
  status: 'pending', // 默认看待处理
  category: ''
})

const fetchReports = async () => {
  loading.value = true
  try {
    const res = await getReports({
      page: currentPage.value,
      per_page: pageSize.value,
      ...filters
    })
    if (res.code === 200) {
      reports.value = res.data.items
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取举报列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchReports()
}

const viewDetail = (row) => {
  currentReportId.value = row.id
  detailVisible.value = true
}

const handleProcessed = () => {
  detailVisible.value = false
  fetchReports() // 刷新列表
}

const getCategoryText = (val) => {
  const map = {
    'legal_rights': '侵犯合法权益',
    'community_rules': '违反社区规则'
  }
  return map[val] || val
}

const getReasonText = (val) => {
  // 这里可以维护一个完整的映射表，暂时直接显示key
  // 实际项目中建议引入一个常量文件
  const map = {
    'plagiarism': '搬运抄袭',
    'porn': '色情低俗',
    // ... 其他映射
  }
  return map[val] || val
}

const getStatusType = (status) => {
  const map = {
    'pending': 'danger',
    'processed': 'success',
    'rejected': 'info'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'processed': '已处罚',
    'rejected': '已驳回'
  }
  return map[status] || status
}

onMounted(() => {
  fetchReports()
})
</script>

<style scoped>
.report-management {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.video-info {
  display: flex;
  align-items: center;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
