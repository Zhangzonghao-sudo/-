<template>
  <div class="app-user-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>APP用户管理</span>
          <el-button type="primary" @click="showCreateDialog">新增用户</el-button>
        </div>
      </template>
      
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <el-row :gutter="20">
          <el-col :span="4">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.total_users }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.verified_users }}</div>
                <div class="stat-label">已验证用户</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.member_users }}</div>
                <div class="stat-label">会员用户</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.premium_users }}</div>
                <div class="stat-label">高级会员</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ statistics.today_users }}</div>
                <div class="stat-label">今日新增</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="用户名">
          <el-input 
            v-model="filters.username" 
            placeholder="请输入用户名"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <el-input 
            v-model="filters.email" 
            placeholder="请输入邮箱"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="手机号">
          <el-input 
            v-model="filters.phone" 
            placeholder="请输入手机号"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="年级">
          <el-select v-model="filters.grade" clearable placeholder="选择年级">
            <el-option label="小学一年级" value="小学一年级" />
            <el-option label="小学二年级" value="小学二年级" />
            <el-option label="小学三年级" value="小学三年级" />
            <el-option label="小学四年级" value="小学四年级" />
            <el-option label="小学五年级" value="小学五年级" />
            <el-option label="小学六年级" value="小学六年级" />
            <el-option label="初一" value="初一" />
            <el-option label="初二" value="初二" />
            <el-option label="初三" value="初三" />
            <el-option label="高一" value="高一" />
            <el-option label="高二" value="高二" />
            <el-option label="高三" value="高三" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="会员状态">
          <el-select 
            v-model="filters.is_member" 
            clearable 
            placeholder="选择会员状态"
            @change="handleMemberStatusChange"
          >
            <el-option label="会员用户" :value="true" />
            <el-option label="普通用户" :value="false" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="验证状态">
          <el-select 
            v-model="filters.is_verified" 
            clearable 
            placeholder="选择验证状态"
            @change="handleVerificationStatusChange"
          >
            <el-option label="已验证" :value="true" />
            <el-option label="未验证" :value="false" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 用户列表 -->
      <el-table :data="users" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="gender" label="性别" width="80" />
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="problems_solved" label="解题数" width="80" />
        <el-table-column prop="days_streak" label="连续天数" width="90" />
        <el-table-column prop="verification_status_text" label="验证状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_verified ? 'success' : 'warning'">
              {{ scope.row.verification_status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="member_status_text" label="会员状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_member ? 'success' : 'info'">
              {{ scope.row.member_status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">详情</el-button>
            <el-button size="small" type="primary" @click="editUser(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.is_verified ? 'warning' : 'success'"
              @click="toggleVerification(scope.row)"
            >
              {{ scope.row.is_verified ? '取消验证' : '验证' }}
            </el-button>
            <el-button 
              size="small" 
              :type="scope.row.is_member ? 'warning' : 'success'"
              @click="toggleMemberStatus(scope.row)"
            >
              {{ scope.row.is_member ? '取消会员' : '设为会员' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog 
      v-model="userDialog.visible" 
      :title="userDialog.isEdit ? '编辑用户' : '新增用户'" 
      width="600px"
    >
      <el-form :model="userDialog.form" :rules="userDialog.rules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userDialog.form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userDialog.form.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userDialog.form.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="年级">
          <el-select v-model="userDialog.form.grade" placeholder="选择年级">
            <el-option label="小学一年级" value="小学一年级" />
            <el-option label="小学二年级" value="小学二年级" />
            <el-option label="小学三年级" value="小学三年级" />
            <el-option label="小学四年级" value="小学四年级" />
            <el-option label="小学五年级" value="小学五年级" />
            <el-option label="小学六年级" value="小学六年级" />
            <el-option label="初一" value="初一" />
            <el-option label="初二" value="初二" />
            <el-option label="初三" value="初三" />
            <el-option label="高一" value="高一" />
            <el-option label="高二" value="高二" />
            <el-option label="高三" value="高三" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="性别">
          <el-select v-model="userDialog.form.gender" placeholder="选择性别">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="生日">
          <el-date-picker
            v-model="userDialog.form.birthday"
            type="date"
            placeholder="选择生日"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="联系方式">
          <el-input v-model="userDialog.form.contact" placeholder="请输入联系方式" />
        </el-form-item>
        
        <el-form-item label="地址">
          <el-input v-model="userDialog.form.address" placeholder="请输入地址" />
        </el-form-item>
        
        <el-form-item label="积分">
          <el-input-number v-model="userDialog.form.points" :min="0" />
        </el-form-item>
        
        <el-form-item label="状态设置">
          <el-checkbox v-model="userDialog.form.is_verified">已验证</el-checkbox>
          <el-checkbox v-model="userDialog.form.is_member">会员用户</el-checkbox>
          <el-checkbox v-model="userDialog.form.is_premium">高级会员</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="userDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="userDialog.loading">
          {{ userDialog.isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      title="用户详情" 
      width="600px"
    >
      <el-form label-width="100px" v-if="selectedUser">
        <el-form-item label="用户名">
          <span>{{ selectedUser.username }}</span>
        </el-form-item>
        <el-form-item label="邮箱">
          <span>{{ selectedUser.email || '未设置' }}</span>
        </el-form-item>
        <el-form-item label="手机号">
          <span>{{ selectedUser.phone || '未设置' }}</span>
        </el-form-item>
        <el-form-item label="头像">
          <div class="avatar-display">
            <el-image
              v-if="selectedUser.avatar"
              :src="getAvatarUrl(selectedUser.avatar)"
              :preview-src-list="[getAvatarUrl(selectedUser.avatar)]"
              fit="cover"
              style="width: 80px; height: 80px; border-radius: 50%;"
              @error="handleAvatarError"
            >
              <template #error>
                <div class="avatar-error">
                  <i class="el-icon-picture-outline"></i>
                  <div>头像加载失败</div>
                </div>
              </template>
            </el-image>
            <span v-else class="no-avatar">未设置头像</span>
          </div>
        </el-form-item>
        <el-form-item label="年级">
          <span>{{ selectedUser.grade || '未设置' }}</span>
        </el-form-item>
        <el-form-item label="性别">
          <span>{{ selectedUser.gender || '未设置' }}</span>
        </el-form-item>
        <el-form-item label="积分">
          <span>{{ selectedUser.points || 0 }}</span>
        </el-form-item>
        <el-form-item label="解题数">
          <span>{{ selectedUser.problems_solved || 0 }}</span>
        </el-form-item>
        <el-form-item label="连续学习天数">
          <span>{{ selectedUser.days_streak || 0 }}</span>
        </el-form-item>
        <el-form-item label="验证状态">
          <el-tag :type="selectedUser.is_verified ? 'success' : 'warning'">
            {{ selectedUser.is_verified ? '已验证' : '未验证' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="会员状态">
          <el-tag :type="selectedUser.is_member ? 'success' : 'info'">
            {{ selectedUser.is_member ? '会员用户' : '普通用户' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="注册时间">
          <span>{{ formatDate(selectedUser.created_at) }}</span>
        </el-form-item>
        <el-form-item label="最后登录">
          <span>{{ formatDate(selectedUser.last_login) }}</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appUserAPI } from '@/api/appUsers'

export default {
  name: 'AppUserManagement',
  setup() {
    const loading = ref(false)
    const users = ref([])
    const userFormRef = ref(null)
    const selectedUser = ref(null)
    
    const statistics = reactive({
      total_users: 0,
      verified_users: 0,
      member_users: 0,
      premium_users: 0,
      today_users: 0
    })
    
    const filters = reactive({
      username: '',
      email: '',
      phone: '',
      grade: '',
      is_member: null,
      is_verified: null
    })
    
    const pagination = reactive({
      current_page: 1,
      per_page: 20,
      total: 0
    })
    
    const userDialog = reactive({
      visible: false,
      isEdit: false,
      loading: false,
      form: {
        username: '',
        email: '',
        phone: '',
        grade: '',
        gender: '',
        birthday: '',
        contact: '',
        address: '',
        points: 0,
        is_verified: false,
        is_member: false,
        is_premium: false
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ]
      }
    })
    
    const detailDialog = reactive({
      visible: false
    })
    
    // 加载用户列表
    const loadUsers = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.current_page,
          per_page: pagination.per_page
        }
        
        // 添加筛选条件
        if (filters.username) params.username = filters.username
        if (filters.email) params.email = filters.email
        if (filters.phone) params.phone = filters.phone
        if (filters.grade) params.grade = filters.grade
        if (filters.is_member !== null) params.is_member = filters.is_member
        if (filters.is_verified !== null) params.is_verified = filters.is_verified
        
        const response = await appUserAPI.getUsers(params)
        if (response.code === 200) {
          users.value = response.data.items
          pagination.total = response.data.total
        } else {
          ElMessage.error(response.message || '加载用户列表失败')
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
        ElMessage.error('加载用户列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 加载统计数据
    const loadStatistics = async () => {
      try {
        const response = await appUserAPI.getStatistics()
        if (response.code === 200) {
          Object.assign(statistics, response.data)
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }
    
    // 会员状态变化处理（立即筛选）
    const handleMemberStatusChange = () => {
      pagination.current_page = 1
      loadUsers()
    }
    
    // 验证状态变化处理（立即筛选）
    const handleVerificationStatusChange = () => {
      pagination.current_page = 1
      loadUsers()
    }
    
    // 查询
    const handleSearch = () => {
      pagination.current_page = 1
      loadUsers()
    }
    
    // 重置筛选条件
    const handleReset = () => {
      Object.assign(filters, {
        username: '',
        email: '',
        phone: '',
        grade: '',
        is_member: null,
        is_verified: null
      })
      pagination.current_page = 1
      loadUsers()
    }
    
    // 显示创建对话框
    const showCreateDialog = () => {
      userDialog.isEdit = false
      userDialog.visible = true
      Object.assign(userDialog.form, {
        username: '',
        email: '',
        phone: '',
        grade: '',
        gender: '',
        birthday: '',
        contact: '',
        address: '',
        points: 0,
        is_verified: false,
        is_member: false,
        is_premium: false
      })
    }
    
    // 编辑用户
    const editUser = (user) => {
      userDialog.isEdit = true
      userDialog.visible = true
      Object.assign(userDialog.form, {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        gender: user.gender,
        birthday: user.birthday,
        contact: user.contact,
        address: user.address,
        points: user.points,
        is_verified: user.is_verified,
        is_member: user.is_member,
        is_premium: user.is_premium
      })
    }
    
    // 保存用户
    const saveUser = async () => {
      if (!userFormRef.value) return
      
      try {
        await userFormRef.value.validate()
        userDialog.loading = true
        
        let response
        if (userDialog.isEdit) {
          response = await appUserAPI.updateUser(userDialog.form.id, userDialog.form)
        } else {
          response = await appUserAPI.createUser(userDialog.form)
        }
        
        if (response.code === 200) {
          ElMessage.success(userDialog.isEdit ? '更新成功' : '创建成功')
          userDialog.visible = false
          loadUsers()
          loadStatistics()
        } else {
          ElMessage.error(response.message || '操作失败')
        }
      } catch (error) {
        console.error('保存用户失败:', error)
        ElMessage.error('操作失败')
      } finally {
        userDialog.loading = false
      }
    }
    
    // 查看详情
    const viewDetail = (user) => {
      selectedUser.value = user
      detailDialog.visible = true
    }
    
    // 获取头像完整URL
    const getAvatarUrl = (avatarPath) => {
      if (!avatarPath) return ''
      // 如果路径已经是完整URL，直接返回
      if (avatarPath.startsWith('http')) return avatarPath
      // 使用环境变量配置的API地址
      const baseUrl = import.meta.env.VITE_API_BASE || window.location.origin
      return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`
    }
    
    // 处理头像加载错误
    const handleAvatarError = (event) => {
      console.log('头像加载失败:', event)
    }
    
    // 切换验证状态
    const toggleVerification = async (user) => {
      try {
        const response = await appUserAPI.toggleVerification(user.id)
        if (response.code === 200) {
          ElMessage.success('操作成功')
          loadUsers()
          loadStatistics()
        } else {
          ElMessage.error(response.message || '操作失败')
        }
      } catch (error) {
        console.error('切换验证状态失败:', error)
        ElMessage.error('操作失败')
      }
    }
    
    // 切换会员状态
    const toggleMemberStatus = async (user) => {
      try {
        const response = await appUserAPI.toggleMemberStatus(user.id)
        if (response.code === 200) {
          ElMessage.success('操作成功')
          loadUsers()
          loadStatistics()
        } else {
          ElMessage.error(response.message || '操作失败')
        }
      } catch (error) {
        console.error('切换会员状态失败:', error)
        ElMessage.error('操作失败')
      }
    }
    
    // 删除用户
    const deleteUser = async (user) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        const response = await appUserAPI.deleteUser(user.id)
        if (response.code === 200) {
          ElMessage.success('删除成功')
          loadUsers()
          loadStatistics()
        } else {
          ElMessage.error(response.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error)
          ElMessage.error('删除失败')
        }
      }
    }
    
    // 分页大小变化
    const handleSizeChange = (val) => {
      pagination.per_page = val
      pagination.current_page = 1
      loadUsers()
    }
    
    // 页码变化
    const handleCurrentChange = (val) => {
      pagination.current_page = val
      loadUsers()
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '未知'
      return new Date(dateString).toLocaleString('zh-CN')
    }
    
    onMounted(() => {
      loadUsers()
      loadStatistics()
    })
    
    return {
      loading,
      users,
      statistics,
      filters,
      pagination,
      userDialog,
      detailDialog,
      selectedUser,
      userFormRef,
      handleMemberStatusChange,
      handleVerificationStatusChange,
      handleSearch,
      handleReset,
      showCreateDialog,
      editUser,
      saveUser,
      viewDetail,
      getAvatarUrl,
      handleAvatarError,
      toggleVerification,
      toggleMemberStatus,
      deleteUser,
      handleSizeChange,
      handleCurrentChange,
      formatDate
    }
  }
}
</script>

<style scoped>
.app-user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  margin-top: 8px;
  color: #606266;
}

.filter-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.avatar-display {
  display: flex;
  align-items: center;
}

.avatar-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.avatar-error i {
  font-size: 24px;
  margin-bottom: 4px;
}

.no-avatar {
  color: #909399;
  font-style: italic;
}
</style>