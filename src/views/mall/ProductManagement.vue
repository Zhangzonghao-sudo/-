<template>
  <div class="product-management">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回商城概览
        </el-button>
        <h2>商品管理</h2>
      </div>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加商品
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="分类">
          <el-cascader
            v-model="filterForm.category_id"
            :options="categoryTree"
            :props="cascaderProps"
            placeholder="全部分类"
            clearable
            @change="loadProducts"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="filterForm.status" 
            placeholder="全部状态" 
            clearable
            @change="loadProducts"
          >
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="置顶">
          <el-select 
            v-model="filterForm.is_top" 
            placeholder="全部" 
            clearable
            @change="loadProducts"
          >
            <el-option label="置顶" :value="1" />
            <el-option label="普通" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input 
            v-model="filterForm.keyword" 
            placeholder="搜索商品名称"
            @keyup.enter="loadProducts"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadProducts">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 商品列表 -->
    <el-card>
      <el-table 
        :data="products" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image 
              v-if="row.images && row.images.length > 0"
              :src="getFullImageUrl(row.images[0])" 
              :preview-src-list="getPreviewImages(row.images)"
              :preview-teleported="true"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer;"
              class="product-image"
            />
            <div v-else class="no-image">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
        <el-table-column prop="category_name_cached" label="分类" width="120" />
        <el-table-column label="价格范围" width="120">
          <template #default="{ row }">
            <span class="price" v-if="row.price_range">
              ¥{{ row.price_range }}
            </span>
            <span v-else class="no-price">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_top" label="置顶" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_top ? 'warning' : 'info'">
              {{ row.is_top ? '置顶' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editProduct(row)">编辑</el-button>
            <el-button size="small" @click="manageSpecs(row)">规格</el-button>
            <el-button 
              size="small" 
              :type="row.status === 1 ? 'warning' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button 
              size="small" 
              :type="row.is_top ? 'info' : 'warning'"
              @click="toggleTop(row)"
            >
              {{ row.is_top ? '取消置顶' : '置顶' }}
            </el-button>
            <el-button size="small" type="danger" @click="deleteProduct(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadProducts"
          @current-change="loadProducts"
        />
      </div>
    </el-card>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="800px"
      @close="resetForm"
    >
      <el-form 
        :model="productForm" 
        :rules="formRules" 
        ref="productFormRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品名称" prop="name">
              <el-input v-model="productForm.name" placeholder="请输入商品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品分类" prop="category_id">
              <el-cascader
                v-model="productForm.category_id"
                :options="categoryTree"
                :props="cascaderProps"
                placeholder="请选择分类"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12" v-if="isEdit">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="productForm.status">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="2">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否置顶" prop="is_top">
              <el-radio-group v-model="productForm.is_top">
                <el-radio :value="true">置顶</el-radio>
                <el-radio :value="false">普通</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品图片">
          <div class="images-upload">
            <el-upload
              v-model:file-list="fileList"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept="image/*"
              multiple
            >
              <div class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <div>上传图片</div>
              </div>
            </el-upload>
            
            <div class="gallery-images">
              <div 
                v-for="(image, index) in displayImages" 
                :key="index" 
                class="image-preview"
              >
                <el-image 
                  :src="image.isRaw ? image.url : getFullImageUrl(image.url)" 
                  fit="cover"
                  style="width: 80px; height: 80px;"
                />
                <div class="image-overlay" @click="removeImage(index)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 规格管理对话框 -->
    <el-dialog 
      title="规格管理" 
      v-model="specDialogVisible" 
      width="1000px"
      @close="resetSpecForm"
    >
      <div class="spec-management">
        <div class="spec-header">
          <h3>{{ currentProduct?.name }} - 规格管理</h3>
          <el-button type="primary" @click="showAddSpecDialog">
            <el-icon><Plus /></el-icon>
            添加规格
          </el-button>
        </div>
        
        <el-table :data="specs" v-loading="specLoading">
          <el-table-column prop="spec_name" label="规格名称" />
          <el-table-column prop="spec_price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ row.spec_price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="spec_stock" label="库存" width="100" />
          <el-table-column prop="is_default" label="默认" width="90">
            <template #default="{ row }">
              <el-tag :type="row.is_default ? 'success' : 'info'">
                {{ row.is_default ? '默认' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="规格图片" width="100">
            <template #default="{ row }">
              <el-image 
                v-if="row.spec_image"
                :src="getFullImageUrl(row.spec_image)" 
                :preview-src-list="[getFullImageUrl(row.spec_image)]"
                fit="cover"
                style="width: 50px; height: 50px; border-radius: 4px;"
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="editSpec(row)">编辑</el-button>
              <el-button size="small" @click="updateStock(row)">库存</el-button>
              <el-button size="small" type="danger" @click="deleteSpec(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 添加/编辑规格对话框 -->
    <el-dialog 
      :title="specDialogTitle" 
      v-model="specFormVisible" 
      width="600px"
      @close="resetSpecForm"
    >
      <el-form 
        :model="specForm" 
        :rules="specFormRules" 
        ref="specFormRef"
        label-width="100px"
      >
        <el-form-item label="规格名称" prop="spec_name">
          <el-input v-model="specForm.spec_name" placeholder="请输入规格名称" />
        </el-form-item>
        <el-form-item label="价格" prop="spec_price">
          <el-input-number 
            v-model="specForm.spec_price" 
            :min="0" 
            :precision="2"
            placeholder="请输入价格"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="库存" prop="spec_stock">
          <el-input-number 
            v-model="specForm.spec_stock" 
            :min="0" 
            placeholder="请输入库存"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="默认规格">
          <el-switch v-model="specForm.is_default" />
        </el-form-item>
        <el-form-item label="规格图片">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="uploadSpecImage"
            accept="image/*"
          >
            <div v-if="specForm.spec_image" class="image-preview">
              <el-image 
                :src="getFullImageUrl(specForm.spec_image)" 
                fit="cover"
                style="width: 100px; height: 100px;"
              />
              <div class="image-overlay" @click.stop="removeSpecImage">
                <el-icon><Delete /></el-icon>
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <div>上传图片</div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="specFormVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSpecForm" :loading="specSubmitting">
          {{ isEditSpec ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 库存更新对话框 -->
    <el-dialog 
      title="更新库存" 
      v-model="stockDialogVisible" 
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="当前库存">
          <span>{{ currentSpec?.stock || 0 }}</span>
        </el-form-item>
        <el-form-item label="新库存">
          <el-input-number 
            v-model="newStock" 
            :min="0" 
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockUpdate" :loading="stockUpdating">
          更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 商品管理页面
 * 创建时间: 2024-01-01
 * 创建人: zzh
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Picture, Delete, ArrowLeft } from '@element-plus/icons-vue'
import mallApi from '@/api/mall'
import { useRouter } from 'vue-router'
import { getFullImageUrl } from '@/utils/url'
import axios from 'axios'

// 路由
const router = useRouter()

// 响应式数据
const products = ref([])
const categoryTree = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const productFormRef = ref()
const fileList = ref([])
const rawImages = ref([])

// 规格管理相关
const specDialogVisible = ref(false)
const specFormVisible = ref(false)
const stockDialogVisible = ref(false)
const specLoading = ref(false)
const specSubmitting = ref(false)
const stockUpdating = ref(false)
const specs = ref([])
const currentProduct = ref(null)
const currentSpec = ref(null)
const newStock = ref(0)
const specFormRef = ref()

// 分页数据
const pagination = reactive({
  page: 1,
  per_page: 10,
  total: 0
})

// 筛选表单
const filterForm = reactive({
  category_id: '',
  status: '',
  is_top: '',
  keyword: ''
})

// 商品表单数据
const productForm = reactive({
  id: null,
  name: '',
  category_id: '',
  images: [],
  status: 1,
  is_top: false
})

// 规格表单
const specForm = reactive({
  id: null,
  product_id: null,
  spec_name: '',
  spec_price: 0,
  spec_stock: 0,
  is_default: false,
  spec_image: ''
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
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 1, max: 200, message: '商品名称长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ]
}

// 规格表单验证规则
const specFormRules = {
  spec_name: [
    { required: true, message: '请输入规格名称', trigger: 'blur' }
  ],
  spec_price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  spec_stock: [
    { required: true, message: '请输入库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑商品' : '添加商品')
const specDialogTitle = computed(() => isEditSpec.value ? '编辑规格' : '添加规格')
const isEditSpec = computed(() => specForm.id !== null)

// 方法
const loadCategories = async () => {
  try {
    const response = await mallApi.getCategories({ tree: true, active_only: true })
    categoryTree.value = response.data
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  }
}

const normalizeImages = (images) => {
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch (e) {}
    return trimmed.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

const loadProducts = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      ...filterForm
    }
    
    // 清理空值
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === '') {
        delete params[key]
      }
    })
    
    const response = await mallApi.getProducts(params)
    const items = Array.isArray(response.data.items) ? response.data.items : []
    
    // 优化：先显示商品列表，再异步加载规格信息
    products.value = items.map(p => ({
      ...p,
      images: normalizeImages(p.images),
      defaultSpecImage: '',
      specsLoading: false
    }))
    pagination.total = response.data.total || items.length
    
    // 异步加载规格信息（不阻塞页面显示）
    if (items.length > 0) {
      loadSpecsForProducts(items)
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

// 异步加载商品规格信息
const loadSpecsForProducts = async (items) => {
  try {
    // 分批加载规格信息，避免同时发起过多请求
    const batchSize = 5
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      await Promise.all(batch.map(async (p) => {
        try {
          const specsResponse = await mallApi.getProductSpecs(p.id)
          const specs = Array.isArray(specsResponse.data) ? specsResponse.data : []
          
          // 查找默认规格的图片
          const defaultSpec = specs.find(spec => spec.is_default)
          const defaultSpecImage = defaultSpec?.spec_image || ''
          
          // 更新商品图片（如果商品没有图片但有默认规格图片）
          const productIndex = products.value.findIndex(prod => prod.id === p.id)
          if (productIndex !== -1) {
            const normalizedImages = normalizeImages(p.images)
            const finalImages = normalizedImages.length > 0 ? normalizedImages : 
                              (defaultSpecImage ? [defaultSpecImage] : [])
            
            products.value[productIndex] = {
              ...products.value[productIndex],
              images: finalImages,
              defaultSpecImage: defaultSpecImage
            }
          }
        } catch (error) {
          console.error(`获取商品 ${p.id} 规格失败:`, error)
        }
      }))
    }
  } catch (error) {
    console.error('批量加载规格信息失败:', error)
  }
}

const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const editProduct = async (product) => {
  isEdit.value = true
  productForm.id = product.id
  productForm.name = product.name
  productForm.category_id = product.category_id
  
  // 获取商品规格信息，使用默认规格的图片作为商品主图
  try {
    const specsResponse = await mallApi.getProductSpecs(product.id)
    const specs = Array.isArray(specsResponse.data) ? specsResponse.data : []
    const defaultSpec = specs.find(spec => spec.is_default)
    const defaultSpecImage = defaultSpec?.spec_image || ''
    
    // 如果商品没有图片但有默认规格图片，使用默认规格图片
    const normalizedImages = normalizeImages(product.images)
    productForm.images = normalizedImages.length > 0 ? normalizedImages : 
                       (defaultSpecImage ? [defaultSpecImage] : [])
  } catch (error) {
    console.error('获取商品规格失败:', error)
    productForm.images = normalizeImages(product.images)
  }
  
  productForm.status = product.status
  productForm.is_top = product.is_top
  
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!productFormRef.value) return
  
  try {
    await productFormRef.value.validate()
    submitting.value = true
    
    // 先上传所有新选择的图片
    const uploadedUrls = []
    
    for (const item of rawImages.value) {
      try {
        // 1. 获取预签名上传URL
        const res = await mallApi.getUploadUrl(
          item.file.name,
          item.file.type,
          'product',
          productForm.id || '',
          productForm.name || ''
        )
        
        const { upload_url, url, upload_headers } = res.data
        
        // 2. 直传COS
        await axios.put(upload_url, item.file, {
          headers: upload_headers
        })
        
        uploadedUrls.push(url)
      } catch (err) {
        console.error('Image upload failed', err)
        ElMessage.error('部分图片上传失败，请重试')
        submitting.value = false
        return
      }
    }

    // 合并原有图片和新上传的图片
    const finalImages = [...productForm.images, ...uploadedUrls]

    const formData = {
      name: productForm.name,
      category_id: productForm.category_id,
      images: finalImages,
      is_top: productForm.is_top
    }
    
    if (isEdit.value) {
      formData.status = productForm.status
      await mallApi.updateProduct(productForm.id, formData)
      ElMessage.success('商品更新成功')
    } else {
      await mallApi.createProduct(formData)
      ElMessage.success('商品创建成功')
    }
    
    dialogVisible.value = false
    await loadProducts()
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (product) => {
  try {
    const response = await mallApi.toggleProductStatus(product.id)
    if (response.code === 200) {
      const updated = response.data
      const newStatus = (updated && typeof updated.status !== 'undefined') ? updated.status : (product.status === 1 ? 2 : 1)
      product.status = newStatus
      product.updated_at = (updated && updated.updated_at) ? updated.updated_at : new Date().toISOString()
      ElMessage.success(newStatus === 1 ? '商品已上架' : '商品已下架')
    } else {
      ElMessage.error(response.message || '状态切换失败')
    }
  } catch (error) {
    console.error('状态切换失败:', error)
    ElMessage.error('状态切换失败')
  }
}

const toggleTop = async (product) => {
  try {
    const response = await mallApi.toggleProductTop(product.id)
    if (response.code === 200) {
      const updated = response.data
      product.is_top = (updated && typeof updated.is_top !== 'undefined') ? updated.is_top : !product.is_top
      product.updated_at = (updated && updated.updated_at) ? updated.updated_at : new Date().toISOString()
      ElMessage.success('置顶状态切换成功')
    } else {
      ElMessage.error(response.message || '置顶状态切换失败')
    }
  } catch (error) {
    console.error('置顶状态切换失败:', error)
    ElMessage.error('置顶状态切换失败')
  }
}

const deleteProduct = async (product) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商品吗？', '确认删除', {
      type: 'warning'
    })
    
    await mallApi.deleteProduct(product.id)
    ElMessage.success('删除成功')
    await loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 规格管理方法
const manageSpecs = async (product) => {
  currentProduct.value = product
  specDialogVisible.value = true
  await loadSpecs(product.id)
}

const loadSpecs = async (productId) => {
  specLoading.value = true
  try {
    const response = await mallApi.getProductSpecs(productId)
    specs.value = response.data
  } catch (error) {
    console.error('加载规格失败:', error)
    ElMessage.error('加载规格失败')
  } finally {
    specLoading.value = false
  }
}

const showAddSpecDialog = () => {
  resetSpecForm()
  specForm.product_id = currentProduct.value.id
  specFormVisible.value = true
}

const editSpec = (spec) => {
  specForm.id = spec.id
  specForm.product_id = spec.product_id
  specForm.spec_name = spec.spec_name
  specForm.spec_price = spec.spec_price
  specForm.spec_stock = spec.spec_stock
  specForm.is_default = !!spec.is_default
  specForm.spec_image = spec.spec_image
  specFormVisible.value = true
}

const submitSpecForm = async () => {
  if (!specFormRef.value) return
  
  try {
    await specFormRef.value.validate()
    specSubmitting.value = true
    
    const formData = {
      product_id: specForm.product_id,
      spec_name: specForm.spec_name,
      spec_price: specForm.spec_price,
      spec_stock: specForm.spec_stock,
      spec_image: specForm.spec_image,
      is_default: specForm.is_default
    }
    
    const response = isEditSpec.value 
      ? await mallApi.updateProductSpec(specForm.id, formData)
      : await mallApi.createProductSpec(specForm.product_id, formData)
    
    if (response.code === 200) {
      ElMessage.success(isEditSpec.value ? '规格更新成功' : '规格创建成功')
      
      // 如果当前规格是默认规格且有图片，自动更新商品主图
      if (specForm.is_default && specForm.spec_image) {
        try {
          // 获取当前商品信息
          const productResponse = await mallApi.getProduct(specForm.product_id)
          const product = productResponse.data
          
          // 如果商品没有图片，使用默认规格的图片作为商品主图
          const normalizedImages = normalizeImages(product.images)
          if (normalizedImages.length === 0) {
            await mallApi.updateProduct(specForm.product_id, {
              images: [specForm.spec_image]
            })
            ElMessage.success('已自动将默认规格图片设置为商品主图')
          }
        } catch (error) {
          console.error('更新商品主图失败:', error)
          // 不显示错误信息，避免干扰用户操作
        }
      }
      
      specFormVisible.value = false
      await loadSpecs(currentProduct.value.id)
      await loadProducts() // 刷新商品列表以更新价格范围
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    specSubmitting.value = false
  }
}

const deleteSpec = async (spec) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规格"${spec.spec_name}"吗？删除后不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await mallApi.deleteProductSpec(spec.id)
    if (response.code === 200) {
      ElMessage.success('规格删除成功')
      await loadSpecs(currentProduct.value.id)
      await loadProducts() // 刷新商品列表以更新价格范围
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除规格失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const updateStock = (spec) => {
  currentSpec.value = spec
  newStock.value = spec.spec_stock
  stockDialogVisible.value = true
}

const submitStockUpdate = async () => {
  try {
    stockUpdating.value = true
    const response = await mallApi.updateSpecStock(currentSpec.value.id, { stock: newStock.value })
    if (response.code === 200) {
      ElMessage.success('库存更新成功')
      stockDialogVisible.value = false
      await loadSpecs(currentProduct.value.id)
    } else {
      ElMessage.error(response.message || '库存更新失败')
    }
  } catch (error) {
    console.error('库存更新失败:', error)
    ElMessage.error('库存更新失败')
  } finally {
    stockUpdating.value = false
  }
}

const resetFilter = () => {
  filterForm.category_id = ''
  filterForm.status = ''
  filterForm.is_top = ''
  filterForm.keyword = ''
  pagination.page = 1
  loadProducts()
}

const resetForm = () => {
  productForm.id = null
  productForm.name = ''
  productForm.category_id = ''
  productForm.images = []
  productForm.status = 1
  productForm.is_top = false
  rawImages.value = []
  
  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
}

const resetSpecForm = () => {
  specForm.id = null
  specForm.product_id = null
  specForm.spec_name = ''
  specForm.spec_price = 0
  specForm.spec_stock = 0
  specForm.is_default = false
  specForm.spec_image = ''
  
  if (specFormRef.value) {
    specFormRef.value.resetFields()
  }
}

// 图片URL处理方法
const getPreviewImages = (images) => {
  if (!images || !Array.isArray(images)) return []
  return images.map(img => getFullImageUrl(img))
}

// 图片上传相关方法
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt20M = file.size / 1024 / 1024 < 20

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt20M) {
    ElMessage.error('图片大小不能超过 20MB!')
    return false
  }
  return true
}

const handleFileChange = (uploadFile) => {
  if (beforeUpload(uploadFile.raw)) {
    rawImages.value.push({
      url: URL.createObjectURL(uploadFile.raw),
      isRaw: true,
      file: uploadFile.raw
    })
  } else {
    const index = fileList.value.indexOf(uploadFile)
    if (index !== -1) {
      fileList.value.splice(index, 1)
    }
  }
}

const displayImages = computed(() => {
  const serverImages = productForm.images.map(url => ({
    url,
    isRaw: false
  }))
  return [...serverImages, ...rawImages.value]
})

const uploadProductImage = async ({ file }) => {
  try {
    // 1. 获取上传链接
    const res = await mallApi.getUploadUrl(
      file.name,
      file.type,
      'product',
      productForm.id || '',
      productForm.name || ''
    )
    
    if (res.code !== 200 && !res.success) {
      throw new Error(res.message || '获取上传链接失败')
    }
    
    const { upload_url, upload_headers, url, relative_path } = res.data
    
    // 2. 上传文件到COS
    await axios.put(upload_url, file, {
      headers: upload_headers
    })
    
    // 3. 更新表单
    productForm.images.push(url)
    ElMessage.success('图片上传成功')
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败: ' + (error.message || '未知错误'))
  }
}

const uploadSpecImage = async ({ file }) => {
  try {
    // 1. 获取上传链接
    const res = await mallApi.getUploadUrl(
      file.name,
      file.type,
      'spec',
      specForm.product_id || '',
      '',
      specForm.spec_name || ''
    )
    
    if (res.code !== 200 && !res.success) {
      throw new Error(res.message || '获取上传链接失败')
    }
    
    const { upload_url, upload_headers, url, relative_path } = res.data
    
    // 2. 上传文件到COS
    await axios.put(upload_url, file, {
      headers: upload_headers
    })
    
    // 3. 更新表单
    specForm.spec_image = url
    ElMessage.success('图片上传成功')
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败: ' + (error.message || '未知错误'))
  }
}

const removeImage = (index) => {
  const serverCount = productForm.images.length
  if (index < serverCount) {
    productForm.images.splice(index, 1)
  } else {
    const rawIndex = index - serverCount
    rawImages.value.splice(rawIndex, 1)
  }
}

const removeSpecImage = () => {
  specForm.spec_image = ''
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const goBack = () => {
  router.push('/mall')
}

// 生命周期
onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.product-management {
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
  gap: 15px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.price {
  color: #e6a23c;
  font-weight: bold;
}

.no-price {
  color: #909399;
  font-style: italic;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #909399;
}

.image-upload {
  display: flex;
  gap: 10px;
}

.images-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-placeholder {
  width: 80px;
  height: 80px;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
  color: #8c939d;
  font-size: 12px;
}

.upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.image-preview {
  position: relative;
  display: inline-block;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  border-radius: 4px;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-overlay .el-icon {
  color: white;
  font-size: 20px;
}

.gallery-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.gallery-images .image-preview {
  width: 80px;
  height: 80px;
}

.product-image {
  transition: transform 0.2s;
}

.product-image:hover {
  transform: scale(1.05);
}

.spec-management {
  padding: 10px 0;
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.spec-header h3 {
  margin: 0;
  color: #303133;
}

/* 确保图片预览层级正确 */
:deep(.el-image-viewer__wrapper) {
  z-index: 9999 !important;
}

:deep(.el-image-viewer__mask) {
  background-color: rgba(0, 0, 0, 0.8) !important;
}
</style>
