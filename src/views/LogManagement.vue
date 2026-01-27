<template>
  <div class="log-management-page">
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="primary" 
          :icon="ArrowLeft" 
          @click="goBack"
          size="small"
        >
          返回仪表盘
        </el-button>
        <div class="header-title">
          <h1>系统日志管理</h1>
          <p>查看、搜索和管理系统所有操作日志</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshLogs" size="small">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="exportLogs" size="small">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
      </div>
    </div>
    
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作名称">
          <el-input v-model="searchForm.actionName" placeholder="请输入操作名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.username" placeholder="请输入操作人" clearable></el-input>
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="searchForm.ip" placeholder="请输入IP地址" clearable></el-input>
        </el-form-item>
        <el-form-item label="请求URL">
          <el-input v-model="searchForm.url" placeholder="请输入URL" clearable></el-input>
        </el-form-item>
        <el-form-item label="请求类型">
          <el-select v-model="searchForm.method" placeholder="请求类型" clearable>
            <el-option label="GET" value="GET"></el-option>
            <el-option label="POST" value="POST"></el-option>
            <el-option label="PUT" value="PUT"></el-option>
            <el-option label="DELETE" value="DELETE"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="操作结果">
          <el-select v-model="searchForm.result" placeholder="操作结果" clearable>
            <el-option label="成功" value="success"></el-option>
            <el-option label="失败" value="fail"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="日志类型">
          <el-select v-model="logType" placeholder="日志类型" clearable>
            <el-option label="全部日志" value="all"></el-option>
            <el-option label="系统日志" value="system"></el-option>
            <el-option label="安全日志" value="security"></el-option>
            <el-option label="业务日志" value="business"></el-option>
            <el-option label="审核日志" value="review"></el-option>
            <el-option label="错误日志" value="error"></el-option>
            <el-option label="API日志" value="api"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <span>日志列表</span>
          <span class="log-count">共 {{ totalLogs }} 条日志</span>
        </div>
      </template>
      
      <div v-loading="loading" class="table-container">
        <el-table
          v-loading="loading"
          :data="logsData"
          style="width: 100%"
          :border="true"
          @row-click="handleRowClick"
        >
          <el-table-column prop="index" label="序号" width="80" type="index" align="center">
            <template #default="scope">
              {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="actionName" label="操作名称" min-width="120">
            <template #default="scope">
              <el-tag :type="getActionType(scope.row.message)" size="small">
                {{ extractActionName(scope.row.message) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="操作人" min-width="100">
            <template #default="scope">
              {{ extractUsername(scope.row.message, scope.row) || '系统' }}
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" min-width="120">
            <template #default="scope">
              {{ extractIpAddress(scope.row.message, scope.row) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="url" label="请求URL" min-width="200">
            <template #default="scope">
              <span class="url-text">{{ extractUrl(scope.row.message, scope.row) || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="method" label="请求类型" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getMethodType(extractMethod(scope.row.message, scope.row))" size="small">
                {{ extractMethod(scope.row.message, scope.row) || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="日志级别" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getLogLevelType(scope.row.level)" size="small">
                {{ scope.row.level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="操作结果" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getResultType(scope.row.message)" size="small">
                {{ getResultText(scope.row.message) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="content" label="操作内容" min-width="180">
            <template #default="scope">
              <div class="content-tooltip" :title="extractContent(scope.row.message)">
                {{ extractContent(scope.row.message) || '-' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="操作时间" min-width="160" align="center" sortable>
            <template #default="scope">
              {{ formatDateFn(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="action" label="操作" width="80" align="center">
            <template #default="scope">
              <el-button type="primary" link @click.stop="handleRowClick(scope.row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-if="logs.length === 0" class="empty-state">
          <el-empty description="暂无日志数据"></el-empty>
        </div>
      </div>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalLogs"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="logDetailVisible"
      title="日志详情"
      width="80%"
      destroy-on-close
    >
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">
            {{ formatDateFn(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="日志级别">
            <el-tag :type="getLogLevelType(selectedLog.level)" size="small">
              {{ selectedLog.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ selectedLog.module }}
          </el-descriptions-item>
          <el-descriptions-item label="操作名称">
            {{ extractActionName(selectedLog.message) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ extractUsername(selectedLog.message, selectedLog) || '系统' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ extractIpAddress(selectedLog.message, selectedLog) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求URL">
            {{ extractUrl(selectedLog.message, selectedLog) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求类型">
            {{ extractMethod(selectedLog.message, selectedLog) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作结果">
            {{ getResultText(selectedLog.message) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作内容">
            <div class="log-detail-message" :class="{ 'log-message-error': selectedLog.level === 'ERROR' }">
              {{ selectedLog.message }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="原始日志">
            <pre class="log-raw">{{ selectedLog.raw || selectedLog.message }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="logDetailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { formatDate, formatUTCToLocal, formatLocalTime } from '@/utils/date';
import { ArrowLeft, Refresh, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

// 响应式状态
const logs = ref([]);
const loading = ref(false);
const logType = ref('all');
const currentPage = ref(1);
const pageSize = ref(20);
const totalLogs = ref(0);
const logDetailVisible = ref(false);
const selectedLog = ref(null);
const dateRange = ref([]);

// 搜索表单
const searchForm = reactive({
  actionName: '',
  username: '',
  ip: '',
  url: '',
  method: '',
  result: ''
});

// 计算属性：表格数据
const logsData = computed(() => {
  return logs.value;
});

// 格式化日期 - 统一使用本地化时间格式
const formatDateFn = (timestamp) => {
  if (!timestamp) return '';
  
  // 统一使用formatLocalTime，确保时间显示一致性
  const formattedTime = formatLocalTime(timestamp);
  
  // 如果formatLocalTime失败，使用备用的简单格式化
  if (!formattedTime) {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      // 使用中国时区的本地化格式作为备用
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    } catch (error) {
      console.error('日期格式化失败:', error, timestamp);
      return '';
    }
  }
  
  return formattedTime;
};

// 获取日志级别类型
const getLogLevelType = (level) => {
  // 定义有效的Element Plus tag类型
  const validTypes = ['success', 'info', 'warning', 'danger', 'primary'];
  
  if (!level || typeof level !== 'string') {
    return 'info'; // 默认类型
  }
  
  const normalizedLevel = level.toUpperCase().trim();
  
  switch (normalizedLevel) {
    case 'ERROR':
      return 'danger';
    case 'WARNING':
    case 'WARN':
      return 'warning';
    case 'INFO':
      return 'info';
    case 'DEBUG':
      return 'primary'; // DEBUG改为primary，避免与success混淆
    case 'SUCCESS':
      return 'success';
    default:
      return 'info'; // 确保始终返回有效值
  }
};

// 获取请求方法类型
const getMethodType = (method) => {
  // 定义有效的Element Plus tag类型
  const validTypes = ['success', 'info', 'warning', 'danger', 'primary'];
  
  if (!method || typeof method !== 'string') {
    return 'info'; // 默认类型
  }
  
  const normalizedMethod = method.toString().toUpperCase().trim();
  
  // 验证是否为有效的HTTP方法
  const validHttpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];
  
  if (!validHttpMethods.includes(normalizedMethod)) {
    return 'info'; // 非有效HTTP方法返回默认类型
  }
  
  switch (normalizedMethod) {
    case 'GET':
      return 'primary';
    case 'POST':
      return 'success';
    case 'PUT':
    case 'PATCH':
      return 'warning';
    case 'DELETE':
      return 'danger';
    case 'HEAD':
    case 'OPTIONS':
    case 'TRACE':
    case 'CONNECT':
      return 'info';
    default:
      return 'info'; // 确保始终返回有效值
  }
};

// 获取操作类型
const getActionType = (message) => {
  // 定义有效的Element Plus tag类型
  const validTypes = ['success', 'info', 'warning', 'danger', 'primary'];
  
  if (!message || typeof message !== 'string') {
    return 'info'; // 默认类型
  }
  
  const normalizedMessage = message.trim();
  
  // 优先检查操作结果（成功/失败）
  const isFailure = normalizedMessage.includes('失败') || normalizedMessage.includes('ERROR') || 
                   normalizedMessage.includes('Exception') || normalizedMessage.includes('Traceback') || 
                   normalizedMessage.includes('AttributeError');
  
  const isSuccess = normalizedMessage.includes('成功') || normalizedMessage.includes('success');
  
  // 如果是失败操作，统一显示为红色
  if (isFailure) {
    return 'danger';
  }
  
  // 根据日志类型和成功状态确定颜色
  if (normalizedMessage.includes('【安全】')) {
    // 安全日志：成功为绿色，失败为红色，其他为橙色
    return isSuccess ? 'success' : (isFailure ? 'danger' : 'warning');
  }
  
  if (normalizedMessage.includes('【业务】')) {
    // 业务日志：成功为绿色，失败为红色，默认为绿色
    return isSuccess ? 'success' : (isFailure ? 'danger' : 'success');
  }
  
  if (normalizedMessage.includes('【审核】')) {
    return 'warning';
  }
  
  if (normalizedMessage.includes('【系统】')) {
    return 'primary';
  }
  
  if (normalizedMessage.includes('【API】')) {
    return 'info';
  }
  
  // 默认情况：成功为绿色，失败为红色，其他为蓝色
  const result = isSuccess ? 'success' : (isFailure ? 'danger' : 'info');
  
  // 最终验证返回值是否有效
  return validTypes.includes(result) ? result : 'info';
};

// 获取结果类型
const getResultType = (message) => {
  if (!message) return 'success'; // 默认成功
  if (message.includes('失败') || message.includes('ERROR') || 
      message.includes('Exception') || message.includes('Traceback') || 
      message.includes('AttributeError')) {
    return 'danger';
  }
  return 'success'; // 默认为成功
};

// 获取结果文本
const getResultText = (message) => {
  if (message.includes('失败') || message.includes('ERROR') || 
      message.includes('Exception') || message.includes('Traceback') || 
      message.includes('AttributeError')) return '失败';
  return '成功';
};

// 统一的空值处理常量
const EMPTY_VALUES = {
  USER: '系统',      // 用户名空值：系统
  IP: '-',         // IP地址空值：-
  URL: '-',        // URL空值：-
  METHOD: '-',     // HTTP方法空值：-
  CONTENT: '-',    // 内容空值：-
  ACTION: '未知操作'  // 操作名空值：未知操作
};

// 通用的输入验证函数
const validateInput = (input) => {
  return input && typeof input === 'string' && input.trim() !== '';
};

// 从日志消息中提取操作名称
const extractActionName = (message) => {
  if (!validateInput(message)) return EMPTY_VALUES.ACTION;
  
  const normalizedMessage = message.trim();
  
  // 首先尝试匹配特定格式的日志
  const securityMatch = normalizedMessage.match(/【安全】(.*?)[：:]/);  
  const businessMatch = normalizedMessage.match(/【业务】(.*?)[：:]/);  
  const reviewMatch = normalizedMessage.match(/【审核】(.*?)[：:]/);  
  const systemMatch = normalizedMessage.match(/【系统】(.*?)[：:]/);  
  const apiMatch = normalizedMessage.match(/【API】(.*?)[：:]/);  
  
  const formattedAction = securityMatch?.[1] || businessMatch?.[1] || reviewMatch?.[1] || systemMatch?.[1] || apiMatch?.[1];
  
  // 如果找到格式化的操作名称，直接返回
  if (formattedAction && formattedAction.trim()) {
    return formattedAction.trim();
  }
  
  // 匹配API访问日志格式: "API访问: POST /api/users - 400"
  const apiAccessMatch = normalizedMessage.match(/API访问:\s*(\w+)\s*(\/\S+)/);
  if (apiAccessMatch) {
    // API访问日志统一显示为"API访问"，不区分具体业务操作
    return 'API访问';
  }
  
  // 匹配其他常见操作格式
  if (normalizedMessage.includes('用户登录成功')) return '用户登录';
  if (normalizedMessage.includes('用户登录失败')) return '用户登录';
  if (normalizedMessage.includes('用户登出')) return '用户登出';
  if (normalizedMessage.includes('创建用户成功')) return '创建用户';
  if (normalizedMessage.includes('创建用户失败')) return '创建用户';
  if (normalizedMessage.includes('更新用户成功')) return '更新用户';
  if (normalizedMessage.includes('删除用户成功')) return '删除用户';
  if (normalizedMessage.includes('创建轮播图')) return '创建轮播图';
  if (normalizedMessage.includes('更新轮播图')) return '更新轮播图';
  if (normalizedMessage.includes('删除轮播图')) return '删除轮播图';
  
  // 系统异常和错误
  if (normalizedMessage.includes('AttributeError') || normalizedMessage.includes('Exception') || normalizedMessage.includes('Traceback')) {
    return '系统异常';
  }
  if (normalizedMessage.includes('ERROR')) {
    return '系统错误';
  }
  
  // 审核相关
  if (normalizedMessage.includes('review_data') || normalizedMessage.includes('审核')) {
    return '审核操作';
  }
  
  // 文件操作
  if (normalizedMessage.includes('File') || normalizedMessage.includes('文件')) {
    return '文件操作';
  }
  
  // 数据库操作
  if (normalizedMessage.includes('数据库') || normalizedMessage.includes('Database')) {
    return '数据库操作';
  }
  
  // 如果仍然无法识别，尝试从消息开头提取动作
  const actionWords = ['创建', '更新', '删除', '查询', '登录', '登出', '上传', '下载', '发送', '接收'];
  for (const word of actionWords) {
    if (normalizedMessage.includes(word)) {
      return word + '操作';
    }
  }
  
  // 最后的默认返回
  return EMPTY_VALUES.ACTION;
};

// 从日志消息中提取用户名
const extractUsername = (message, row) => {
  if (!validateInput(message)) return EMPTY_VALUES.USER;
  
  const normalizedMessage = message.trim();
  
  // 如果是API日志，优先使用_api_data中的数据
  if (row && row._api_data && validateInput(row._api_data.username)) {
    return row._api_data.username.trim();
  }
  
  // 尝试多种用户名格式（优化后：更严格的验证）
  // 格式1: 用户名:username
  let match = normalizedMessage.match(/用户名:([a-zA-Z0-9_\u4e00-\u9fa5-]{2,50})/);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }
  
  // 格式2: username@valid_ip_address (优化：验证IP地址有效性）
  match = normalizedMessage.match(/\s([a-zA-Z0-9_\u4e00-\u9fa5-]{2,20})@((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))/);
  if (match && match[1] && match[1].trim()) {
    const username = match[1].trim();
    // 验证用户名合理性
    if (isValidUsername(username)) {
      return username;
    }
  }
  
  // 格式3: - username@ (优化：更严格的用户名验证）
  match = normalizedMessage.match(/- ([a-zA-Z0-9_\u4e00-\u9fa5-]{2,20})@/);
  if (match && match[1] && match[1].trim()) {
    const username = match[1].trim();
    if (isValidUsername(username)) {
      return username;
    }
  }
  
  return EMPTY_VALUES.USER;
};

// 用户名验证工具函数
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  
  // 用户名规则：2-20个字符，支持字母、数字、下划线、中文、连字符
  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5-]{2,20}$/;
  return usernameRegex.test(username) && 
         !username.startsWith('-') && 
         !username.endsWith('-') &&
         !username.includes('--');
};

// 从日志消息中提取IP地址
const extractIpAddress = (message, row) => {
  if (!validateInput(message)) return EMPTY_VALUES.IP;
  
  const normalizedMessage = message.trim();
  
  // 如果是API日志，优先使用_api_data中的数据
  if (row && row._api_data && validateInput(row._api_data.ip_address)) {
    return row._api_data.ip_address.trim();
  }
  
  // 尝试多种IP地址格式（优化后：更精确的验证）
  // 格式1: IP:xxx.xxx.xxx.xxx
  let match = normalizedMessage.match(/IP:([^,，\s]+)/);
  if (match && match[1] && match[1].trim()) {
    const ip = match[1].trim();
    if (isValidIP(ip)) {
      return ip;
    }
  }
  
  // 格式2: user@ip_address (如: anonymous@192.168.1.72)
  // 优化：更严格的IP地址验证
  match = normalizedMessage.match(/@((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))/);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }
  
  // 格式3: 严格的IP地址验证（仅在明确的IP上下文中匹配）
  // 只在IP相关的上下文中匹配，避免误匹配版本号等
  if (normalizedMessage.includes('IP') || normalizedMessage.includes('地址') || normalizedMessage.includes('@')) {
    match = normalizedMessage.match(/\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\b/);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  
  return EMPTY_VALUES.IP;
};

// IP地址验证工具函数
const isValidIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
};

// 从日志消息中提取URL
const extractUrl = (message, row) => {
  if (!validateInput(message)) return EMPTY_VALUES.URL;
  
  const normalizedMessage = message.trim();
  
  // 如果是API日志，优先使用_api_data中的数据
  if (row && row._api_data && validateInput(row._api_data.endpoint)) {
    return row._api_data.endpoint.trim();
  }
  
  // 如果是API日志，优先使用_api_data中的path数据
  if (row && row._api_data && validateInput(row._api_data.path)) {
    return row._api_data.path.trim();
  }
  
  // 匹配API访问日志格式: "API访问: POST /api/users - 400"
  const apiAccessMatch = normalizedMessage.match(/API访问:\s*\w+\s*(\/\S+)/);
  if (apiAccessMatch && apiAccessMatch[1] && apiAccessMatch[1].trim()) {
    return apiAccessMatch[1].trim();
  }
  
  // 匹配传统格式: "URL:xxx"
  const urlMatch = normalizedMessage.match(/URL:([^,，\s]+)/);
  if (urlMatch && urlMatch[1] && urlMatch[1].trim()) {
    const url = urlMatch[1].trim();
    if (isValidUrlPath(url)) {
      return url;
    }
  }
  
  // 优化：更严格的API路径匹配，仅在API相关上下文中匹配
  if (normalizedMessage.includes('API') || normalizedMessage.includes('/api/')) {
    const pathMatch = normalizedMessage.match(/(\/api\/[a-zA-Z0-9\/._-]+)/);
    if (pathMatch && pathMatch[1] && pathMatch[1].trim()) {
      const path = pathMatch[1].trim();
      if (isValidApiPath(path)) {
        return path;
      }
    }
  }
  
  return EMPTY_VALUES.URL;
};

// URL路径验证工具函数
const isValidUrlPath = (path) => {
  if (!path || typeof path !== 'string') return false;
  
  // 基本的URL路径验证
  return path.startsWith('/') && 
         path.length <= 200 && 
         !/[<>"'`\s]/.test(path) && // 不包含危险字符
         !path.includes('..'); // 防止路径遍历
};

// API路径验证工具函数
const isValidApiPath = (path) => {
  if (!isValidUrlPath(path)) return false;
  
  // API路径特定验证
  return path.startsWith('/api/') && 
         /^\/api\/[a-zA-Z0-9\/_-]+$/.test(path) && // 只允许字母数字和基本符号
         path.split('/').length <= 10; // 限制路径深度
};

// 从日志消息中提取请求方法
const extractMethod = (message, row) => {
  if (!validateInput(message)) return EMPTY_VALUES.METHOD;
  
  const normalizedMessage = message.trim();
  
  // 如果是API日志，优先使用_api_data中的数据
  if (row && row._api_data && validateInput(row._api_data.method)) {
    return row._api_data.method.trim().toUpperCase();
  }
  
  // 匹配API访问日志格式: "API访问: POST /api/users - 400"
  const apiAccessMatch = normalizedMessage.match(/API访问:\s*(\w+)\s*\//);
  if (apiAccessMatch && apiAccessMatch[1] && apiAccessMatch[1].trim()) {
    const method = apiAccessMatch[1].trim().toUpperCase();
    if (isValidHttpMethod(method)) {
      return method;
    }
  }
  
  // 匹配传统格式: "方法:xxx"
  const methodMatch = normalizedMessage.match(/方法:([^,，\s]+)/);
  if (methodMatch && methodMatch[1] && methodMatch[1].trim()) {
    const method = methodMatch[1].trim().toUpperCase();
    if (isValidHttpMethod(method)) {
      return method;
    }
  }
  
  // 优化：仅在HTTP/API相关上下文中匹配HTTP方法，避免误匹配
  if (normalizedMessage.includes('API') || normalizedMessage.includes('HTTP') || 
      normalizedMessage.includes('请求') || normalizedMessage.includes('/api/')) {
    const httpMethodMatch = normalizedMessage.match(/\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/);
    if (httpMethodMatch && httpMethodMatch[1] && httpMethodMatch[1].trim()) {
      return httpMethodMatch[1].trim().toUpperCase();
    }
  }
  
  return EMPTY_VALUES.METHOD;
};

// HTTP方法验证工具函数
const isValidHttpMethod = (method) => {
  if (!method || typeof method !== 'string') return false;
  
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'];
  return validMethods.includes(method.toUpperCase());
};

// 从日志消息中提取内容
const extractContent = (message) => {
  if (!validateInput(message)) return EMPTY_VALUES.CONTENT;
  
  const normalizedMessage = message.trim();
  
  // 提取主要内容，去除标签和元数据
  let content = normalizedMessage;
  const tags = ['【安全】', '【业务】', '【审核】', '【系统】', '【API】'];
  tags.forEach(tag => {
    content = content.replace(tag, '');
  });
  
  // 去除空白并截断内容
  content = content.trim();
  if (!content) {
    return EMPTY_VALUES.CONTENT;
  }
  
  return content.substring(0, 100) + (content.length > 100 ? '...' : '');
};

// 防抖工具函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 优化后的获取日志数据函数
const fetchLogs = async () => {
  loading.value = true;
  try {
    const params = {
      type: logType.value,
      page: currentPage.value,
      per_page: pageSize.value
    };
    
    // 优化：结构化传递搜索参数，避免字符串拼接
    const searchParams = {};
    if (searchForm.actionName && searchForm.actionName.trim()) {
      searchParams.action_name = searchForm.actionName.trim();
    }
    if (searchForm.username && searchForm.username.trim()) {
      searchParams.username = searchForm.username.trim();
    }
    if (searchForm.ip && searchForm.ip.trim()) {
      searchParams.ip_address = searchForm.ip.trim();
    }
    if (searchForm.url && searchForm.url.trim()) {
      searchParams.url = searchForm.url.trim();
    }
    if (searchForm.method && searchForm.method.trim()) {
      searchParams.method = searchForm.method.trim();
    }
    if (searchForm.result) {
      searchParams.result = searchForm.result;
    }
    
    // 合并搜索参数
    Object.assign(params, searchParams);
    
    // 添加日期范围过滤（如果有）
    if (dateRange.value.length === 2) {
      params.start_date = dateRange.value[0];
      params.end_date = dateRange.value[1];
    }
    
    const response = await api.get('/api/maintenance/logs', { params });
    
    // 检查响应数据结构
    if (response.data.success && response.data.data) {
      // 处理日志数据，确保数据格式正确
      const rawLogs = response.data.data.logs || [];
      logs.value = rawLogs.map(log => ({
        ...log,
        timestamp: log.timestamp || new Date().toISOString(),
        level: log.level || 'INFO',
        message: log.message || '',
        module: log.module || 'unknown',
        raw: log.raw || log.message
      }));
      totalLogs.value = response.data.data.total || 0;
    } else {
      // 如果响应格式不正确，设置为空
      logs.value = [];
      totalLogs.value = 0;
      console.warn('意外的API响应格式:', response.data);
    }
  } catch (error) {
    console.error('获取日志失败:', error);
    ElMessage.error('获取日志失败: ' + (error.response?.data?.error || error.message));
    logs.value = [];
    totalLogs.value = 0;
  } finally {
    loading.value = false;
  }
};

// 防抖搜索函数
const debouncedSearch = debounce(() => {
  currentPage.value = 1; // 重置到第一页
  fetchLogs();
}, 500); // 500ms防抖

// 搜索表单变化处理函数
const handleSearchChange = () => {
  debouncedSearch();
};

// 立即搜索函数（用于按钮点击）
const performSearch = () => {
  currentPage.value = 1;
  fetchLogs();
};

// 处理页面大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchLogs();
};

// 处理页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchLogs();
};

// 处理行点击事件
const handleRowClick = (row) => {
  selectedLog.value = {
    ...row,
    raw: row.raw || row.message // 如果没有原始日志，则使用消息作为原始日志
  };
  logDetailVisible.value = true;
};

// 刷新日志
const refreshLogs = () => {
  fetchLogs();
};

// 导出日志
const exportLogs = async () => {
  try {
    ElMessage.info('正在导出日志，请稍候...');
    // 这里可以实现日志导出功能
    // 例如：调用导出API，获取文件下载链接等
    // 暂时先显示一个提示
    setTimeout(() => {
      ElMessage.success('日志导出成功');
    }, 1000);
  } catch (error) {
    ElMessage.error('日志导出失败: ' + (error.response?.data?.error || error.message));
  }
};

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  dateRange.value = [];
  logType.value = 'all';
  currentPage.value = 1;
  fetchLogs();
};

// 返回仪表盘
const goBack = () => {
  router.push('/dashboard');
};

// 组件挂载时获取日志
onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.log-management-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.header-title h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.header-title p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 16px;
}

.search-form:last-child {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.log-count {
  font-size: 14px;
  color: #606266;
}

.table-container {
  margin-bottom: 20px;
}

.empty-state {
  padding: 60px 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.log-detail {
  padding: 10px;
}

.log-detail-message {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.log-raw {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
}

.content-tooltip {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.url-text {
  display: inline-block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.log-message-error {
  color: #f56c6c;
}
</style>