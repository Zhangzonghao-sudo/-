<template>
  <div class="category-management">
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="goBack"
          size="small"
        >
          返回商城概览
        </el-button>
        <h2>分类管理</h2>
      </div>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加分类
      </el-button>
    </div>

    <!-- 分类列表 -->
    <el-card>
      <el-table 
        :data="categoryTree" 
        v-loading="loading"
        style="width: 100%"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="200">
          <template #default="{ row }">
            <span :style="{ paddingLeft: (row.level || 0) * 20 + 'px' }">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button size="small" @click="addSubCategory(row)">添加子分类</el-button>
            <el-button size="small" @click="editCategory(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteCategory(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      @close="resetForm"
    >
      <el-form 
        :model="categoryForm" 
        :rules="formRules" 
        ref="categoryFormRef"
        label-width="80px"
      >
        <el-form-item label="父分类" prop="parent_id" v-if="!isEdit || categoryForm.parent_id">
          <el-cascader
            v-model="categoryForm.parent_id"
            :options="parentCategoryOptions"
            :props="cascaderProps"
            placeholder="选择父分类（留空为顶级分类）"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number 
            v-model="categoryForm.sort_order" 
            :min="0" 
            placeholder="排序值，数字越小越靠前"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="isEdit">
          <el-radio-group v-model="categoryForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="2">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { categoryAPI } from '@/api/mall'

const router = useRouter()

// 响应式数据
const categories = ref([])
const categoryTree = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const categoryFormRef = ref()
const parentCategoryOptions = ref([])

// 表单数据
const categoryForm = reactive({
  id: null,
  name: '',
  parent_id: null,
  sort_order: 0,
  status: 1
})

// 级联选择器配置
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false
}

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 100, message: '分类名称长度在 1 到 100 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑分类' : '添加分类')

// 返回商城概览
const goBack = () => {
  router.push('/mall')
}

// 方法
const loadCategories = async () => {
  loading.value = true
  try {
    // 获取树形结构的分类数据
    const response = await categoryAPI.getCategories({ tree: true })
    if (response.code === 200) {
      categoryTree.value = addLevelToTree(response.data, 0)
      // 同时获取平铺的分类数据用于父分类选择
      const flatResponse = await categoryAPI.getCategories()
      if (flatResponse.code === 200) {
        categories.value = flatResponse.data
        buildParentCategoryOptions()
      }
    } else {
      ElMessage.error(response.message || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 为树形数据添加层级信息
const addLevelToTree = (tree, level) => {
  return tree.map(item => ({
    ...item,
    level,
    children: item.children ? addLevelToTree(item.children, level + 1) : []
  }))
}

// 构建父分类选择选项
const buildParentCategoryOptions = () => {
  const buildOptions = (categories, level = 0) => {
    return categories.map(cat => ({
      id: cat.id,
      name: '　'.repeat(level) + cat.name,
      children: cat.children ? buildOptions(cat.children, level + 1) : []
    }))
  }
  parentCategoryOptions.value = buildOptions(categoryTree.value)
}

const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const addSubCategory = (parentCategory) => {
  isEdit.value = false
  categoryForm.parent_id = parentCategory.id
  dialogVisible.value = true
}

const editCategory = (category) => {
  isEdit.value = true
  categoryForm.id = category.id
  categoryForm.name = category.name
  categoryForm.parent_id = category.parent_id
  categoryForm.sort_order = category.sort_order
  categoryForm.status = category.status
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
    submitting.value = true
    
    const formData = {
      name: categoryForm.name,
      parent_id: categoryForm.parent_id,
      sort_order: categoryForm.sort_order
    }
    
    if (isEdit.value) {
      formData.status = categoryForm.status
    }
    
    const response = isEdit.value 
      ? await categoryAPI.updateCategory(categoryForm.id, formData)
      : await categoryAPI.createCategory(formData)
    
    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '分类更新成功' : '分类创建成功')
      dialogVisible.value = false
      loadCategories()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (category) => {
  try {
    const response = await categoryAPI.toggleCategoryStatus(category.id)
    if (response.code === 200) {
      ElMessage.success('状态切换成功')
      // 局部更新，避免整表loading
      category.status = response.data?.status ?? (category.status === 1 ? 2 : 1)
      if (response.data?.updated_at) {
        category.updated_at = response.data.updated_at
      }
    } else {
      ElMessage.error(response.message || '状态切换失败')
    }
  } catch (error) {
    console.error('状态切换失败:', error)
    ElMessage.error('状态切换失败')
  }
}

const deleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？删除后不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await categoryAPI.deleteCategory(category.id)
    if (response.code === 200) {
      ElMessage.success('分类删除成功')
      loadCategories()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const resetForm = () => {
  categoryForm.id = null
  categoryForm.name = ''
  categoryForm.parent_id = null
  categoryForm.sort_order = 0
  categoryForm.status = 1
  
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}
</style>