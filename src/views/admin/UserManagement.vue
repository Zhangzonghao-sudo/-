<template>
  <div class="user-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">用户管理</h1>
        <div class="header-actions">
          <el-button @click="showExporter = true" type="primary">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button @click="showAddUser = true" type="success">
            <el-icon><Plus /></el-icon>
            添加用户
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="用户名、邮箱或手机号"
            clearable
            style="width: 250px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="角色">
          <el-select v-model="filterForm.role" placeholder="全部角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="客服" value="customer_service" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button @click="handleSearch" type="primary">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作组件 -->
    <BatchOperations
      :selected-items="selectedUsers"
      :all-items="users"
      :actions="batchActions"
      @select-all="handleSelectAll"
      @clear-selection="clearSelection"
      @batch-action="handleBatchAction"
      @action-complete="handleActionComplete"
    />

    <!-- 用户列表 -->
    <el-card>
      <el-table
        :data="paginatedUsers"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="40">
              {{ row.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="username" label="用户名" min-width="120" />
        
        <el-table-column prop="email" label="邮箱" min-width="180" />
        
        <el-table-column prop="phone" label="手机号" width="130" />
        
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="last_login" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatTime(row.last_login) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group size="small">
              <el-button @click="editUser(row)" type="primary" link>
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                @click="toggleUserStatus(row)"
                :type="row.status === 'active' ? 'warning' : 'success'"
                link
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button @click="deleteUser(row)" type="danger" link>
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredUsers.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 数据导出组件 -->
    <DataExporter
      v-model="showExporter"
      data-type="users"
      :default-content="['user_basic', 'user_activity']"
      @export-complete="handleExportComplete"
    />

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="showAddUser"
      :title="editingUser ? '编辑用户' : '添加用户'"
      width="600px"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" type="email" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="客服" value="customer_service" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="!editingUser" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            placeholder="请输入密码"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddUser = false">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saving">
            {{ editingUser ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Download, Plus, Search, Edit, Delete,
  User, Lock, Unlock
} from '@element-plus/icons-vue'
import BatchOperations from '@/components/common/BatchOperations.vue'
import DataExporter from '@/components/export/DataExporter.vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const users = ref([])
const selectedUsers = ref([])
const showExporter = ref(false)
const showAddUser = ref(false)
const editingUser = ref(null)
const userFormRef = ref(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 过滤
const filterForm = ref({
  keyword: '',
  role: '',
  status: ''
})

// 用户表单
const userForm = ref({
  username: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: ''
})

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 批量操作配置
const batchActions = [
  {
    key: 'enable',
    label: '批量启用',
    icon: 'Unlock',
    type: 'success',
    confirmTitle: '批量启用用户',
    confirmMessage: '确定要启用选中的用户吗？',
    confirmType: 'success'
  },
  {
    key: 'disable',
    label: '批量禁用',
    icon: 'Lock',
    type: 'warning',
    confirmTitle: '批量禁用用户',
    confirmMessage: '禁用后用户将无法登录系统，确定要继续吗？',
    confirmType: 'warning'
  },
  {
    key: 'delete',
    label: '批量删除',
    icon: 'Delete',
    type: 'danger',
    confirmTitle: '批量删除用户',
    confirmMessage: '删除后数据无法恢复，确定要删除选中的用户吗？',
    confirmType: 'danger'
  },
  {
    key: 'export',
    label: '导出选中',
    icon: 'Download',
    type: 'primary',
    requiresConfirm: false
  }
]

// 计算属性
const filteredUsers = computed(() => {
  let filtered = users.value

  // 关键词搜索
  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase()
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      (user.phone && user.phone.includes(keyword))
    )
  }

  // 角色过滤
  if (filterForm.value.role) {
    filtered = filtered.filter(user => user.role === filterForm.value.role)
  }

  // 状态过滤
  if (filterForm.value.status) {
    filtered = filtered.filter(user => user.status === filterForm.value.status)
  }

  return filtered
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

// 方法
const loadUsers = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 生成模拟用户数据
    users.value = generateMockUsers()
    
  } catch (error) {
    console.error('加载用户失败:', error)
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

const generateMockUsers = () => {
  const mockUsers = []
  const roles = ['admin', 'customer_service', 'user']
  const statuses = ['active', 'inactive']
  
  for (let i = 1; i <= 50; i++) {
    mockUsers.push({
      id: i,
      username: `user${i}`,
      email: `user${i}@example.com`,
      phone: `138${String(i).padStart(8, '0')}`,
      role: roles[Math.floor(Math.random() * roles.length)],
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
      last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return mockUsers
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetFilter = () => {
  filterForm.value = {
    keyword: '',
    role: '',
    status: ''
  }
  currentPage.value = 1
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const handleSelectAll = (value) => {
  // 这里应该由表格组件处理全选逻辑
  // 实际实现中需要调用表格的toggleAllSelection方法
}

const clearSelection = () => {
  selectedUsers.value = []
  // 实际实现中需要调用表格的clearSelection方法
}

const handleBatchAction = (actionData) => {
  const { action, items } = actionData
  
  switch (action.key) {
    case 'enable':
      batchUpdateStatus(items, 'active')
      break
    case 'disable':
      batchUpdateStatus(items, 'inactive')
      break
    case 'delete':
      batchDeleteUsers(items)
      break
    case 'export':
      exportSelectedUsers(items)
      break
  }
}

const batchUpdateStatus = (items, status) => {
  items.forEach(user => {
    const index = users.value.findIndex(u => u.id === user.id)
    if (index !== -1) {
      users.value[index].status = status
    }
  })
}

const batchDeleteUsers = (items) => {
  const userIds = items.map(user => user.id)
  users.value = users.value.filter(user => !userIds.includes(user.id))
}

const exportSelectedUsers = (items) => {
  // 触发导出功能
  showExporter.value = true
}

const handleActionComplete = (result) => {
  ElMessage.success(`批量操作完成，处理了 ${result.processedCount} 个项目`)
  clearSelection()
}

const editUser = (user) => {
  editingUser.value = user
  userForm.value = {
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    password: ''
  }
  showAddUser.value = true
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      `${action}用户`,
      {
        type: newStatus === 'active' ? 'success' : 'warning'
      }
    )
    
    user.status = newStatus
    ElMessage.success(`用户${action}成功`)
    
  } catch {
    // 用户取消操作
  }
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？删除后数据无法恢复。`,
      '删除用户',
      {
        type: 'error'
      }
    )
    
    const index = users.value.findIndex(u => u.id === user.id)
    if (index !== -1) {
      users.value.splice(index, 1)
      ElMessage.success('用户删除成功')
    }
    
  } catch {
    // 用户取消操作
  }
}

const saveUser = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    saving.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingUser.value) {
      // 更新用户
      const index = users.value.findIndex(u => u.id === editingUser.value.id)
      if (index !== -1) {
        users.value[index] = {
          ...users.value[index],
          ...userForm.value
        }
      }
      ElMessage.success('用户更新成功')
    } else {
      // 添加用户
      const newUser = {
        id: Date.now(),
        ...userForm.value,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userForm.value.username}`,
        last_login: null,
        created_at: new Date().toISOString()
      }
      users.value.unshift(newUser)
      ElMessage.success('用户创建成功')
    }
    
    showAddUser.value = false
    resetUserForm()
    
  } catch (error) {
    console.error('保存用户失败:', error)
  } finally {
    saving.value = false
  }
}

const resetUserForm = () => {
  editingUser.value = null
  userForm.value = {
    username: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: ''
  }
  
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const handleExportComplete = (result) => {
  ElMessage.success(`数据导出完成：${result.filename}`)
}

// 工具方法
const getRoleTagType = (role) => {
  const typeMap = {
    admin: 'danger',
    customer_service: 'warning',
    user: 'info'
  }
  return typeMap[role] || 'info'
}

const getRoleText = (role) => {
  const textMap = {
    admin: '管理员',
    customer_service: '客服',
    user: '普通用户'
  }
  return textMap[role] || '未知'
}

const formatTime = (timeString) => {
  if (!timeString) return '从未登录'
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-management {
    padding: 12px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
  }
}
</style>
