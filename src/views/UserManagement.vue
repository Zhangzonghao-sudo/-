<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理系统用户账户</p>
    </div>

    <!-- 操作栏 -->
    <div class="table-container">
      <div class="table-header">
        <div class="table-title">用户列表</div>
        <div class="table-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户名或邮箱"
            style="width: 200px; margin-right: 16px;"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
          <el-button @click="refreshUsers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 用户表格 -->
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <div style="display: flex; align-items: center;">
              <el-avatar :size="32" style="margin-right: 8px;">
                <el-icon><User /></el-icon>
              </el-avatar>
              {{ row.username }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="email" label="邮箱" min-width="180" />
        
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'danger' : 'primary'" size="small">
              {{ row.is_admin ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="last_login" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDate(row.last_login) || '从未登录' }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="showEditDialog(row)"
              >
                编辑
              </el-button>
              <el-button
                :type="row.is_active ? 'warning' : 'success'"
                size="small"
                @click="toggleUserStatus(row)"
              >
                {{ row.is_active ? '禁用' : '启用' }}
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteUser(row)"
                :disabled="row.id === authStore.user?.id"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right;">
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
    </div>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      :title="dialogMode === 'create' ? '新增用户' : '编辑用户'"
      v-model="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="userForm.email"
            placeholder="请输入邮箱"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            :placeholder="dialogMode === 'create' ? '请输入密码' : '留空则不修改密码'"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item label="角色">
          <el-switch
            v-model="userForm.is_admin"
            active-text="管理员"
            inactive-text="普通用户"
          />
        </el-form-item>
        
        <el-form-item label="状态" v-if="dialogMode === 'edit'">
          <el-switch
            v-model="userForm.is_active"
            active-text="正常"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            {{ dialogMode === 'create' ? '创建' : '更新' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { debounce } from 'lodash-es'

const authStore = useAuthStore()

// 数据状态
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')

// 分页数据
const pagination = reactive({
  page: 1,
  per_page: 10,
  total: 0,
  pages: 0
})

// 对话框状态
const dialogVisible = ref(false)
const dialogMode = ref('create') // 'create' | 'edit'
const submitLoading = ref(false)
const userFormRef = ref()

// 用户表单数据
const userForm = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  is_admin: false,
  is_active: true
})

// 表单验证规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 80, message: '用户名长度在 3 到 80 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
    { max: 120, message: '邮箱长度不能超过120个字符', trigger: 'blur' }
  ],
  password: [
    { 
      validator: (rule, value, callback) => {
        if (dialogMode.value === 'create' && !value) {
          callback(new Error('请输入密码'))
        } else if (value && value.length < 6) {
          callback(new Error('密码长度至少6个字符'))
        } else if (value && value.length > 128) {
          callback(new Error('密码长度不能超过128个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      per_page: pagination.per_page
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await api.get('/api/users', { params })
    
    if (response.data.success) {
      users.value = response.data.data.users
      Object.assign(pagination, response.data.data.pagination)
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    
    let errorMessage = '获取用户列表失败'
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message
    } else if (error.response && error.response.status === 403) {
      errorMessage = '没有权限查看用户列表'
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络连接'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 搜索处理（防抖）
const handleSearch = debounce(() => {
  pagination.page = 1
  fetchUsers()
}, 500)

// 刷新用户列表
const refreshUsers = () => {
  fetchUsers()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.page = 1
  fetchUsers()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchUsers()
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetUserForm()
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (user) => {
  dialogMode.value = 'edit'
  Object.assign(userForm, {
    id: user.id,
    username: user.username,
    email: user.email,
    password: '',
    is_admin: user.is_admin,
    is_active: user.is_active
  })
  dialogVisible.value = true
}

// 重置表单
const resetUserForm = () => {
  Object.assign(userForm, {
    id: null,
    username: '',
    email: '',
    password: '',
    is_admin: false,
    is_active: true
  })
  userFormRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!userFormRef.value) return

  try {
    await userFormRef.value.validate()
    submitLoading.value = true

    const data = { ...userForm }
    delete data.id

    let response
    if (dialogMode.value === 'create') {
      response = await api.post('/api/users', data)
    } else {
      response = await api.put(`/api/users/${userForm.id}`, data)
    }

    if (response.data.success) {
      ElMessage.success(response.data.message)
      dialogVisible.value = false
      fetchUsers()
    }
  } catch (error) {
    console.error('提交失败:', error)
    
    // 显示具体的错误信息
    let errorMessage = '操作失败，请重试'
    
    if (error.response && error.response.data) {
      // 后端返回的错误信息
      if (error.response.data.message) {
        errorMessage = error.response.data.message
      }
      // 根据状态码提供更具体的提示
      else if (error.response.status === 400) {
        errorMessage = '请检查输入的信息是否正确（用户名或邮箱可能已存在）'
      } else if (error.response.status === 403) {
        errorMessage = '没有权限执行此操作'
      } else if (error.response.status === 500) {
        errorMessage = '服务器内部错误，请稍后重试'
      }
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络连接'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    submitLoading.value = false
  }
}

// 切换用户状态
const toggleUserStatus = async (user) => {
  try {
    const action = user.is_active ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await api.patch(`/api/users/${user.id}/toggle-status`)
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      fetchUsers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换用户状态失败:', error)
      
      let errorMessage = '切换用户状态失败'
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      }
      ElMessage.error(errorMessage)
    }
  }
}

// 删除用户
const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const response = await api.delete(`/api/users/${user.id}`)
    
    if (response.data.success) {
      ElMessage.success(response.data.message)
      fetchUsers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      
      let errorMessage = '删除用户失败'
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      }
      ElMessage.error(errorMessage)
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听对话框关闭，重置表单
watch(dialogVisible, (visible) => {
  if (!visible) {
    resetUserForm()
  }
})

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.table-actions {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons .el-button {
  margin-left: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .table-actions {
    flex-direction: column;
    gap: 12px;
  }

  .table-actions .el-input {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
