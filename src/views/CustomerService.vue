<template>
  <div class="customer-service-container">
    <div class="header">
      <h2>💬 客服工作台</h2>
      <div class="stats">
        <el-statistic title="待处理会话" :value="unreadSessionsCount" />
        <el-statistic title="今日消息" :value="todayMessagesCount" />
        <el-statistic title="在线状态" :value="1" suffix="在线" />
      </div>
    </div>

    <div class="chat-workspace">
      <!-- 左侧会话列表 -->
      <div class="session-list">
        <div class="session-list-header">
          <h3>会话列表</h3>
          <div class="header-controls">
            <el-select
              v-model="sortType"
              @change="handleSortChange"
              size="small"
              style="width: 120px; margin-right: 8px;"
            >
              <el-option label="📊 智能排序" value="smart" />
              <el-option label="🔴 未读优先" value="unread" />
              <el-option label="⏰ 时间排序" value="time" />
              <el-option label="📋 状态排序" value="status" />
            </el-select>
            <el-button @click="refreshSessions" :loading="loading" size="small" type="primary">
              刷新
            </el-button>
          </div>
        </div>
        
        <div class="session-items" v-loading="loading">
          <div
            v-for="session in sortedSessions"
            :key="session.id"
            class="session-item"
            :class="{ active: currentSessionId === session.id, unread: session.unread_count > 0, current: currentSessionId === session.id }"
            @click="selectSession(session)"
          >
            <div class="session-info">
              <div class="user-name">
                {{ session.app_user_name }}
                <el-badge 
                  v-if="session.unread_count > 0" 
                  :value="session.unread_count" 
                  class="unread-badge"
                />
              </div>
              <div class="last-message-time">
                {{ formatTime(session.last_message_at) }}
              </div>
            </div>
          </div>
          
          <div v-if="sessions.length === 0" class="empty-sessions">
            <el-empty description="暂无会话" />
          </div>
        </div>
      </div>

      <!-- 右侧聊天窗口 -->
      <div class="chat-window">
        <div v-if="!currentSessionId" class="no-session-selected">
          <el-empty description="请选择一个会话开始聊天" />
        </div>
        
        <div v-else class="chat-content">
          <!-- 聊天头部 -->
          <div class="chat-header">
            <div class="user-info">
              <h3>{{ currentSession?.app_user_name }}</h3>
              <span class="user-id">ID: {{ currentSession?.app_user_id }}</span>
            </div>
            <div class="chat-actions">
              <el-button @click="refreshMessages" :loading="messagesLoading" size="small">
                刷新消息
              </el-button>
            </div>
          </div>

          <!-- 消息列表 -->
          <div class="messages-container" ref="messagesContainer" v-loading="messagesLoading">
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="message-item"
              :class="{ 'user-message': message.sender_type === 'app_user', 'service-message': message.sender_type === 'customer_service' }"
            >
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">{{ formatSenderName(message) }}</span>
                  <div class="message-meta">
                    <span class="message-time">{{ formatTime(message.created_at) }}</span>
                    <!-- 已读状态指示器 -->
                    <span v-if="message.sender_type === 'app_user'" class="read-status">
                      <el-icon v-if="message.is_read" class="read-icon" :size="12">
                        <Check />
                      </el-icon>
                      <span v-else class="unread-dot"></span>
                    </span>
                  </div>
                </div>

                <!-- 文本消息 -->
                <div v-if="message.message_type === 'text'" class="message-text" style="white-space: pre-wrap;">
                  {{ message.content }}
                </div>

                <!-- 图片消息 -->
                <div v-else-if="message.message_type === 'image'" class="message-media">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="image-container">
                    <el-image
                      :src="getSignedUrl(message.thumbnail_url || message.file_url)"
                      :preview-src-list="[getSignedUrl(message.file_url)]"
                      fit="cover"
                      style="width: 200px; max-height: 150px; border-radius: 4px;"
                      preview-teleported
                    />
                  </div>
                </div>

                <!-- 视频消息 -->
                <div v-else-if="message.message_type === 'video'" class="message-media">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="video-container">
                    <video
                      v-if="getSignedUrl(message.file_url)"
                      :src="getSignedUrl(message.file_url)"
                      :poster="getSignedUrl(message.thumbnail_url)"
                      controls
                      preload="none"
                      style="width: 300px; max-height: 200px; border-radius: 4px;"
                      @error="handleVideoError"
                      @loadstart="handleVideoLoadStart"
                      @canplay="handleVideoCanPlay"
                    >
                      您的浏览器不支持视频播放
                    </video>
                    <div v-if="message.file_name" class="file-info">
                      📹 {{ message.file_name }} 
                      <span v-if="message.file_size">({{ formatFileSize(message.file_size) }})</span>
                    </div>
                  </div>
                </div>

                <!-- 文件消息 -->
                <div v-else-if="message.message_type === 'file'" class="message-media">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="file-container">
                    <el-link
                      :href="getSignedUrl(message.file_url)"
                      target="_blank"
                      type="primary"
                      :icon="Document"
                      underline="hover"
                    >
                      📄 {{ message.file_name }} ({{ formatFileSize(message.file_size) }})
                    </el-link>
                  </div>
                </div>

                <!-- 其他类型消息 -->
                <div v-else class="message-text">
                  {{ message.content }}
                </div>
              </div>
            </div>
            
            <div v-if="messages.length === 0" class="empty-messages">
              <p>暂无消息记录</p>
            </div>
          </div>

          <!-- 消息输入区域 -->
          <div class="message-input-area">
            <div class="input-controls">
              <el-input
                ref="messageInputRef"
                v-model="newMessage"
                type="textarea"
                placeholder="输入回复消息..."
                @keydown="handleKeyDown"
                :disabled="sendingMessage || uploadingFile"
                :autosize="{ minRows: 2, maxRows: 6 }"
              />
            </div>

            <!-- 文件上传预览 -->
            <div v-if="selectedFile" class="file-preview">
              <div class="file-info">
                <el-icon><Document /></el-icon>
                <span>{{ selectedFile.name }}</span>
                <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
                <el-button @click="clearSelectedFile" size="small" type="danger" link>
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>

            <div class="input-actions">
              <!-- 表情包按钮 -->
              <div class="emoji-button">
                <el-popover
                  placement="top-start"
                  :width="320"
                  trigger="click"
                  popper-class="emoji-popover"
                >
                  <template #reference>
                    <el-button size="small" :disabled="sendingMessage || uploadingFile">
                      😊 表情
                    </el-button>
                  </template>
                  <div class="emoji-panel">
                    <div class="emoji-categories">
                      <div
                        v-for="category in emojiCategories"
                        :key="category.name"
                        class="emoji-category"
                        :class="{ active: activeEmojiCategory === category.name }"
                        @click="activeEmojiCategory = category.name"
                      >
                        {{ category.icon }} {{ category.label }}
                      </div>
                    </div>
                    <div class="emoji-grid">
                      <span
                        v-for="emoji in currentCategoryEmojis"
                        :key="emoji"
                        class="emoji-item"
                        @click="insertEmoji(emoji)"
                        :title="emoji"
                      >
                        {{ emoji }}
                      </span>
                    </div>
                  </div>
                </el-popover>
              </div>

              <!-- 常用语按钮 -->
              <div class="quick-phrases-button">
                <el-popover
                  placement="top-start"
                  :width="400"
                  trigger="click"
                  popper-class="quick-phrases-popover"
                >
                  <template #reference>
                    <el-button size="small" :disabled="sendingMessage || uploadingFile">
                      📝 常用语
                    </el-button>
                  </template>
                  <div class="quick-phrases-panel">
                    <div class="phrases-header">
                      <div class="phrases-categories">
                        <div
                          v-for="category in quickPhrasesCategories"
                          :key="category.name"
                          class="phrases-category"
                          :class="{ active: activePhrasesCategory === category.name }"
                          @click="activePhrasesCategory = category.name"
                        >
                          {{ category.icon }} {{ category.label }}
                        </div>
                      </div>
                      <el-button
                        size="small"
                        type="primary"
                        text
                        @click="showEditPhrasesDialog = true"
                      >
                        编辑
                      </el-button>
                    </div>
                    <div class="phrases-list">
                      <div
                        v-for="phrase in currentCategoryPhrases"
                        :key="phrase.id"
                        class="phrase-item"
                        @click="insertPhrase(phrase.content)"
                        :title="phrase.content"
                      >
                        {{ phrase.content }}
                      </div>
                      <div v-if="currentCategoryPhrases.length === 0" class="empty-phrases">
                        暂无常用语，点击右上角"编辑"添加
                      </div>
                    </div>
                  </div>
                </el-popover>
              </div>

              <!-- 文件上传按钮 -->
              <div class="file-upload-buttons">
                <el-upload
                  ref="imageUpload"
                  :show-file-list="false"
                  :before-upload="handleFileSelect"
                  accept="image/*"
                  :disabled="uploadingFile"
                >
                  <el-button size="small" :disabled="uploadingFile">
                    <el-icon><Picture /></el-icon>
                    图片
                  </el-button>
                </el-upload>

                <el-upload
                  ref="videoUpload"
                  :show-file-list="false"
                  :before-upload="handleFileSelect"
                  accept="video/*"
                  :disabled="uploadingFile"
                >
                  <el-button size="small" :disabled="uploadingFile">
                    <el-icon><VideoPlay /></el-icon>
                    视频
                  </el-button>
                </el-upload>

                <el-upload
                  ref="fileUpload"
                  :show-file-list="false"
                  :before-upload="handleFileSelect"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  :disabled="uploadingFile"
                >
                  <el-button size="small" :disabled="uploadingFile">
                    <el-icon><Document /></el-icon>
                    文件
                  </el-button>
                </el-upload>
              </div>

              <div class="send-buttons">
                <el-button
                  v-if="selectedFile"
                  @click="sendFileMessage"
                  type="success"
                  :loading="uploadingFile"
                >
                  发送文件
                </el-button>
                <el-button
                  @click="sendMessage"
                  type="primary"
                  :loading="sendingMessage"
                  :disabled="uploadingFile"
                >
                  发送（Shift+Enter 换行）
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常用语编辑对话框 -->
    <el-dialog
    v-model="showEditPhrasesDialog"
    title="编辑常用语"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="edit-phrases-content">
      <div class="phrases-category-tabs">
        <el-tabs v-model="editingCategory" type="card">
          <el-tab-pane
            v-for="category in quickPhrasesCategories"
            :key="category.name"
            :label="`${category.icon} ${category.label}`"
            :name="category.name"
          >
            <div class="phrases-edit-list">
              <div
                v-for="(phrase, index) in getPhrasesForCategory(category.name)"
                :key="phrase.id"
                class="phrase-edit-item"
              >
                <el-input
                  v-model="phrase.content"
                  placeholder="输入常用语内容"
                  @blur="updatePhrase(phrase)"
                />
                <el-button
                  type="danger"
                  size="small"
                  text
                  @click="deletePhrase(category.name, index)"
                >
                  删除
                </el-button>
              </div>
              <el-button
                type="primary"
                text
                @click="addPhrase(category.name)"
                class="add-phrase-btn"
              >
                + 添加新常用语
              </el-button>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showEditPhrasesDialog = false">取消</el-button>
        <el-button type="primary" @click="saveQuickPhrases">保存</el-button>
      </div>
    </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, triggerRef } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Picture, VideoPlay, Close, Check } from '@element-plus/icons-vue'
import api from '@/utils/api'
import io from 'socket.io-client'
import { getSignedUrl as getSignedUrlGlobal } from '@/utils/storage'

export default {
  name: 'CustomerService',
  setup() {
    // 响应式数据
    const sessions = ref([])
    const messages = ref([])
    const currentSessionId = ref(null)
    const currentSession = ref(null)
    const newMessage = ref('')
    const loading = ref(false)
    const messagesLoading = ref(false)
    const sendingMessage = ref(false)
    const uploadingFile = ref(false)
    const selectedFile = ref(null)
    const sortType = ref('smart') // 默认智能排序
    const messagesContainer = ref(null)
    const messageInputRef = ref(null)

    // WebSocket相关数据（仅用于接收实时消息）
    const socket = ref(null)
    const isSocketConnected = ref(false)



    // 表情包相关数据 - 专为客服场景设计
    const activeEmojiCategory = ref('service')
    const emojiCategories = ref([
      {
        name: 'service',
        label: '客服专用',
        icon: '🌹',
        emojis: ['😊', '😘', '🥰', '😇', '🤗', '😌', '🙂', '😉', '🌹', '🌸', '🌺', '🌻', '🌷', '💐', '🎀', '💝', '✨', '⭐', '🌟', '💫', '🎉', '👍', '👌', '🤝', '🙏', '💪', '✊', '👏', '🎊', '🥳', '💯', '❤️']
      },
      {
        name: 'greeting',
        label: '问候',
        icon: '👋',
        emojis: ['👋', '🤚', '✋', '🙋‍♀️', '🙋‍♂️', '💁‍♀️', '💁‍♂️', '🙆‍♀️', '🙆‍♂️', '🤷‍♀️', '🤷‍♂️', '🙇‍♀️', '🙇‍♂️', '🤝', '🫱', '🫲', '👐', '🙌', '🤲', '🙏', '☀️', '🌅', '🌄', '🌇', '🌆', '🌃', '🌉', '🌈', '⛅', '☁️', '🌤️', '⭐']
      },
      {
        name: 'love',
        label: '温馨',
        icon: '💕',
        emojis: ['💕', '💖', '💗', '💓', '💞', '💘', '💝', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '🖤', '🤎', '💋', '👄', '🫶', '🤟', '🤘', '✌️', '🤞', '🫰', '🤌', '🤏', '👌']
      },
      {
        name: 'support',
        label: '服务',
        icon: '🎯',
        emojis: ['🎯', '✅', '☑️', '✔️', '💯', '🔥', '⚡', '💪', '🚀', '🎊', '🎉', '🏆', '🥇', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '📱', '💻', '⌨️', '🖥️', '🖨️', '📞', '☎️', '📧', '📨']
      }
    ])

    // 常用语相关数据
    const activePhrasesCategory = ref('greeting')
    const showEditPhrasesDialog = ref(false)
    const editingCategory = ref('greeting')
    const quickPhrasesCategories = ref([
      {
        name: 'greeting',
        label: '问候语',
        icon: '👋'
      },
      {
        name: 'inquiry',
        label: '询问语',
        icon: '🔍'
      },
      {
        name: 'confirm',
        label: '确认语',
        icon: '✅'
      },
      {
        name: 'closing',
        label: '结束语',
        icon: '🙏'
      },
      {
        name: 'explain',
        label: '解释语',
        icon: '⚠️'
      }
    ])

    // 常用语数据 - 使用localStorage存储
    const quickPhrases = ref({
      greeting: [
        { id: 1, content: '亲亲您好！🌹 很高兴为您服务，请问有什么可以帮助您的吗？😊' },
        { id: 2, content: '您好！欢迎咨询，我是您的专属客服，有什么问题尽管问我哦~' },
        { id: 3, content: 'Hi！感谢您的咨询，我会竭诚为您服务！✨' }
      ],
      inquiry: [
        { id: 4, content: '请问您遇到了什么问题呢？我来帮您解决~' },
        { id: 5, content: '能详细描述一下具体情况吗？这样我能更好地帮助您' },
        { id: 6, content: '请问您需要了解哪方面的信息呢？' }
      ],
      confirm: [
        { id: 7, content: '好的，我马上为您处理！💪✨ 请稍等片刻哦~' },
        { id: 8, content: '收到！正在为您查询，请稍候...' },
        { id: 9, content: '明白了，我这就为您安排！' }
      ],
      closing: [
        { id: 10, content: '问题已经为您解决了！✅🎉 还有其他需要帮助的吗？' },
        { id: 11, content: '感谢您的耐心等待！🙏💕 祝您生活愉快！🌸' },
        { id: 12, content: '很高兴能为您服务！如有其他问题随时联系我们哦~' }
      ],
      explain: [
        { id: 13, content: '由于系统维护，可能会有延迟，请您谅解' },
        { id: 14, content: '这个问题需要进一步核实，我会尽快给您回复' },
        { id: 15, content: '抱歉给您带来不便，我们会尽快处理' }
      ]
    })

    // 统计数据
    const unreadSessionsCount = ref(0)
    const todayMessagesCount = ref(0)
    
    // WebSocket连接管理
    const connectSocket = () => {
      try {
        // 创建Socket.IO连接
        const transports = ['polling', 'websocket']
        
        // 使用环境变量配置的后端地址
        const apiBase = import.meta.env.VITE_API_BASE
        const wsUrl = apiBase
        
        socket.value = io(`${wsUrl}/customer-service`, {
          path: '/socket.io',
          transports: transports,
          timeout: 20000,
        })

        // 设置事件监听器
        socket.value.on('connect', () => {
          console.log('Socket.IO连接成功')
          isSocketConnected.value = true
          
          // 连接成功后发送管理员加入事件
          // 这里需要获取当前管理员信息，暂时使用默认值
          socket.value.emit('admin_join', {
            admin_id: 1, // 需要从用户信息中获取实际ID
            admin_name: '客服管理员' // 需要从用户信息中获取实际名称
          })
          
          // 连接成功后立即加载会话列表
          loadSessions()
        })

        socket.value.on('disconnect', () => {
          console.log('Socket.IO连接断开')
          isSocketConnected.value = false
        })

        // 接收新消息（核心功能）
        socket.value.on('new_message', (data) => {
          handleNewMessage(data)
        })

        // 监听会话列表更新事件
        socket.value.on('sessions_updated', () => {
          console.log('收到会话列表更新通知')
          loadSessions()
        })

        // 监听新用户加入事件
        socket.value.on('user_joined', (data) => {
          console.log('新用户加入:', data)
          ElMessage.info(`新用户 ${data.user_name} 加入聊天`)
          loadSessions()
        })

        socket.value.on('error', (error) => {
          console.error('WebSocket错误:', error)
          ElMessage.error(`WebSocket连接错误: ${error.message || '未知错误'}`)
        })

      } catch (error) {
        console.error('WebSocket连接失败:', error)
        ElMessage.error('WebSocket连接失败')
      }
    }

    // 处理新消息
    const handleNewMessage = (data) => {
      const sidIncoming = Number(data.session_id)
      const sidCurrent = Number(currentSessionId.value)
      if (sidCurrent && sidIncoming === sidCurrent) {
        const newMsg = {
          id: data.message_id || data.id,
          session_id: data.session_id,
          sender_type: data.sender_type,
          sender_id: data.sender_id,
          sender_name: data.sender_name,
          message_type: data.message_type || 'text',
          content: data.content,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size,
          thumbnail_url: data.thumbnail_url,
          created_at: data.created_at,
          is_read: data.sender_type === 'customer_service'
        }
        messages.value = messages.value.concat(newMsg)
        nextTick(() => {
          scrollToBottom()
        })
      } else if (sidCurrent) {
        loadMessages(currentSessionId.value)
      }
      loadSessions()
    }

    // 处理新用户等待服务
    const handleNewUserWaiting = (data) => {
      console.log('新用户等待服务:', data)
      ElMessage.info(`新用户 ${data.user_name} 等待服务`)
      
      // 刷新会话列表
      loadSessions()
    }

    // 处理用户离线
    const handleUserOffline = (data) => {
      console.log('用户离线:', data)
      
      // 如果当前查看的会话用户离线
      if (currentSessionId.value && data.user_id === currentSession.value?.app_user_id) {
        ElMessage.warning('用户已离线')
      }
      
      // 刷新会话列表
      loadSessions()
    }

    // 排序后的会话列表
    const sortedSessions = computed(() => {
      if (!sessions.value || sessions.value.length === 0) {
        return []
      }

      const sessionsCopy = [...sessions.value]

      return sessionsCopy.sort((a, b) => {
        // 1. 当前会话永远置顶（如果有选中的会话）
        if (currentSessionId.value) {
          if (a.id === currentSessionId.value) return -1
          if (b.id === currentSessionId.value) return 1
        }

        // 2. 根据排序类型进行排序
        switch (sortType.value) {
          case 'smart': // 智能排序：未读优先 + 时间排序
            // 未读消息数量排序
            if (a.unread_count !== b.unread_count) {
              return b.unread_count - a.unread_count
            }
            // 相同未读数量时按时间排序
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)

          case 'unread': // 未读优先
            // 先按是否有未读消息分组
            const aHasUnread = a.unread_count > 0
            const bHasUnread = b.unread_count > 0
            if (aHasUnread !== bHasUnread) {
              return bHasUnread ? 1 : -1
            }
            // 同组内按时间排序
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)

          case 'time': // 纯时间排序
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)

          case 'status': // 状态排序
            // 活跃会话优先
            if (a.status !== b.status) {
              return a.status === 'active' ? -1 : 1
            }
            // 相同状态按时间排序
            return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)

          default:
            return 0
        }
      })
    })

    // 当前分类的表情包
    const currentCategoryEmojis = computed(() => {
      const category = emojiCategories.value.find(cat => cat.name === activeEmojiCategory.value)
      return category ? category.emojis : []
    })

    // 当前分类的常用语
    const currentCategoryPhrases = computed(() => {
      return quickPhrases.value[activePhrasesCategory.value] || []
    })

    // 获取会话列表
    const loadSessions = async () => {
      try {
        loading.value = true
        const response = await api.get('/api/customer-service/sessions')
        
        if (response.data.success) {
          sessions.value = response.data.data.sessions
          updateStats()
        } else {
          ElMessage.error(response.data.message || '获取会话列表失败')
        }
      } catch (error) {
        console.error('获取会话列表失败:', error)
        ElMessage.error('获取会话列表失败')
      } finally {
        loading.value = false
      }
    }

    // 更新统计数据
    const updateStats = () => {
      unreadSessionsCount.value = sessions.value.filter(s => s.unread_count > 0).length
      // 这里可以添加更多统计逻辑
    }

    // 处理排序方式变更
    const handleSortChange = (newSortType) => {
      console.log('排序方式变更:', newSortType)
      // sortType已经通过v-model自动更新，computed会自动重新计算
    }

    // 选择会话
    const selectSession = async (session) => {
      currentSessionId.value = session.id
      currentSession.value = session
      await loadMessages(session.id)
    }

    // 获取消息列表
    const loadMessages = async (sessionId) => {
      try {
        messagesLoading.value = true
        const response = await api.get(`/api/customer-service/sessions/${sessionId}/messages`)
        
        if (response.data.success) {
          messages.value = response.data.data.messages
          await nextTick()
          scrollToBottom()
        } else {
          ElMessage.error(response.data.message || '获取消息失败')
        }
      } catch (error) {
        console.error('获取消息失败:', error)
        ElMessage.error('获取消息失败')
      } finally {
        messagesLoading.value = false
      }
    }

    // 发送消息
    const sendMessage = async () => {
      // 检查是否有内容（保留换行符，只去除首尾空白）
      const messageContent = newMessage.value.replace(/^\s+|\s+$/g, '')
      if (!messageContent || !currentSessionId.value) {
        return
      }

      try {
        sendingMessage.value = true
        
        // 使用HTTP API发送消息
        const response = await api.post(`/api/customer-service/sessions/${currentSessionId.value}/reply`, {
          content: messageContent,
          message_type: 'text'
        })

        if (response.data.success) {
          newMessage.value = ''
          await loadMessages(currentSessionId.value)
          await loadSessions()
          ElMessage.success('消息发送成功')
          
          // 发送成功后自动聚焦到输入框
          nextTick(() => {
            if (messageInputRef.value) {
              messageInputRef.value.focus()
            }
          })
        } else {
          ElMessage.error(response.data.message || '发送消息失败')
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        ElMessage.error('发送消息失败')
      } finally {
        sendingMessage.value = false
      }
    }

    // 键盘事件处理
    const handleKeyDown = (event) => {
      // Enter键发送消息（不按Shift）
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault() // 阻止默认换行
        sendMessage()
      }
      // Shift+Enter允许换行（默认行为，不需要特殊处理）
    }

    // 刷新会话列表
    const refreshSessions = () => {
      loadSessions()
    }

    // 刷新消息
    const refreshMessages = () => {
      if (currentSessionId.value) {
        loadMessages(currentSessionId.value)
      }
    }

    // 滚动到底部
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    // 格式化时间
    const formatTime = (timeStr) => {
      if (!timeStr) return '未知时间'

      // 确保正确解析ISO时间字符串
      const date = new Date(timeStr)

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '时间格式错误'
      }

      const now = new Date()
      const diff = now - date

      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 24小时内
        return date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Shanghai' // 明确指定时区
        })
      } else {
        return date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) + ' ' +
               date.toLocaleTimeString('zh-CN', {
                 hour: '2-digit',
                 minute: '2-digit',
                 timeZone: 'Asia/Shanghai'
               })
      }
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'

      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 包装全局签名URL获取函数，传入需要更新的ref
    const getSignedUrl = (path) => {
      return getSignedUrlGlobal(path, [sessions, messages])
    }

    // 视频错误处理
    const handleVideoError = (event) => {
      console.error('视频加载错误:', event)
      const video = event.target
      console.error('视频URL:', video.src)
      console.error('错误详情:', video.error)
      ElMessage.error('视频加载失败，请检查文件是否存在')
    }

    // 视频开始加载
    const handleVideoLoadStart = (event) => {
      console.log('视频开始加载:', event.target.src)
    }

    // 视频可以播放
    const handleVideoCanPlay = (event) => {
      console.log('视频可以播放:', event.target.src)
    }

    // 格式化发送者名称
    const formatSenderName = (message) => {
      if (message.sender_type === 'customer_service') {
        return `客服${message.sender_name}:`
      }
      return message.sender_name
    }

    // 插入表情到输入框
    const insertEmoji = (emoji) => {
      const textarea = document.querySelector('.message-input-area textarea')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = newMessage.value

        // 在光标位置插入表情
        newMessage.value = text.substring(0, start) + emoji + text.substring(end)

        // 恢复光标位置
        nextTick(() => {
          textarea.focus()
          textarea.setSelectionRange(start + emoji.length, start + emoji.length)
        })
      } else {
        // 如果找不到textarea，直接追加到末尾
        newMessage.value += emoji
      }
    }

    // 插入常用语到输入框
    const insertPhrase = (phrase) => {
      const textarea = document.querySelector('.message-input-area textarea')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = newMessage.value

        // 在光标位置插入常用语
        newMessage.value = text.substring(0, start) + phrase + text.substring(end)

        // 恢复光标位置
        nextTick(() => {
          textarea.focus()
          textarea.setSelectionRange(start + phrase.length, start + phrase.length)
        })
      } else {
        // 如果找不到textarea，直接设置为常用语内容
        newMessage.value = phrase
      }
    }

    // 获取指定分类的常用语
    const getPhrasesForCategory = (categoryName) => {
      return quickPhrases.value[categoryName] || []
    }

    // 添加新常用语
    const addPhrase = (categoryName) => {
      if (!quickPhrases.value[categoryName]) {
        quickPhrases.value[categoryName] = []
      }

      const newId = Date.now()
      quickPhrases.value[categoryName].push({
        id: newId,
        content: ''
      })
    }

    // 删除常用语
    const deletePhrase = (categoryName, index) => {
      if (quickPhrases.value[categoryName]) {
        quickPhrases.value[categoryName].splice(index, 1)
      }
    }

    // 更新常用语
    const updatePhrase = () => {
      // 实时更新，不需要特殊处理
    }

    // 保存常用语到localStorage
    const saveQuickPhrases = () => {
      try {
        localStorage.setItem('customerServiceQuickPhrases', JSON.stringify(quickPhrases.value))
        ElMessage.success('常用语保存成功')
        showEditPhrasesDialog.value = false
      } catch (error) {
        console.error('保存常用语失败:', error)
        ElMessage.error('保存常用语失败')
      }
    }

    // 从localStorage加载常用语
    const loadQuickPhrases = () => {
      try {
        const saved = localStorage.getItem('customerServiceQuickPhrases')
        if (saved) {
          quickPhrases.value = JSON.parse(saved)
        }
      } catch (error) {
        console.error('加载常用语失败:', error)
      }
    }



    // 处理文件选择
    const handleFileSelect = (file) => {
      // 检查文件大小
      const maxSizes = {
        'image': 20 * 1024 * 1024,   // 20MB
        'video': 1000 * 1024 * 1024,  // 1GB
        'file': 5 * 1024 * 1024     // 5MB
      }

      let fileType = 'file'
      if (file.type.startsWith('image/')) {
        fileType = 'image'
      } else if (file.type.startsWith('video/')) {
        fileType = 'video'
      }

      const maxSize = maxSizes[fileType]
      if (file.size > maxSize) {
        ElMessage.error(`文件大小不能超过 ${formatFileSize(maxSize)}`)
        return false
      }

      selectedFile.value = file
      return false // 阻止自动上传
    }

    // 清除选中的文件
    const clearSelectedFile = () => {
      selectedFile.value = null
    }

    // 发送文件消息
    const sendFileMessage = async () => {
      if (!selectedFile.value || !currentSessionId.value) {
        return
      }

      try {
        uploadingFile.value = true

        const formData = new FormData()
        const fileToSend = selectedFile.value && selectedFile.value.raw ? selectedFile.value.raw : selectedFile.value
        formData.append('file', fileToSend)

        const response = await api.post(
          `/api/customer-service/sessions/${currentSessionId.value}/send-file`,
          formData
        )

        if (response.data.success) {
          selectedFile.value = null
          await loadMessages(currentSessionId.value)
          await loadSessions() // 刷新会话列表
          ElMessage.success('文件发送成功')
        } else {
          ElMessage.error(response.data.message || '发送文件失败')
        }
      } catch (error) {
        console.error('发送文件失败:', error)
        ElMessage.error('发送文件失败')
      } finally {
        uploadingFile.value = false
      }
    }

    // 启动定时刷新（已停用，改用WebSocket实时推送）
    const startAutoRefresh = () => {
      // 停止旧的定时器机制，防止流量浪费
      // WebSocket会自动处理会话更新和新消息通知
    }

    // 停止定时刷新
    const stopAutoRefresh = () => {
      if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
      if (messageRefreshTimer) {
        clearInterval(messageRefreshTimer)
        messageRefreshTimer = null
      }
    }

    // 组件挂载
    onMounted(() => {
      loadSessions()
      loadQuickPhrases()
      
      // 连接WebSocket
      connectSocket()
    })

    // 组件卸载
    onUnmounted(() => {
      // 断开WebSocket连接
      if (socket.value) {
        socket.value.disconnect()
        socket.value = null
      }
    })

    return {
      sessions,
      sortedSessions,
      sortType,
      messages,
      currentSessionId,
      currentSession,
      newMessage,
      loading,
      messagesLoading,
      sendingMessage,
      uploadingFile,
      selectedFile,
      messagesContainer,
      messageInputRef,
      unreadSessionsCount,
      todayMessagesCount,
      selectSession,
      sendMessage,
      sendFileMessage,
      handleFileSelect,
      clearSelectedFile,
      refreshSessions,
      refreshMessages,
      handleSortChange,
      handleKeyDown,
      formatTime,
      formatFileSize,
      formatSenderName,
      // 视频处理函数
      handleVideoError,
      handleVideoLoadStart,
      handleVideoCanPlay,
      // 表情包相关
      activeEmojiCategory,
      emojiCategories,
      currentCategoryEmojis,
      insertEmoji,
      // 常用语相关
      activePhrasesCategory,
      quickPhrasesCategories,
      currentCategoryPhrases,
      showEditPhrasesDialog,
      editingCategory,
      insertPhrase,
      getPhrasesForCategory,
      addPhrase,
      deletePhrase,
      updatePhrase,
      saveQuickPhrases,
      // 图标
      Document,
      Picture,
      VideoPlay,
      Close
      ,
      getSignedUrl
    }
  }
}
</script>

<style scoped>
.customer-service-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden; /* 防止整体滚动 */
}

.header {
  background: white;
  padding: 15px 20px; /* 减少padding节省空间 */
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 防止压缩 */
}

.header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px; /* 稍微减小字体 */
}

.stats {
  display: flex;
  gap: 30px; /* 减少间距 */
}

.chat-workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden; /* 防止工作区滚动 */
}

.session-list {
  width: 300px;
  background: white;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满工作区高度 */
  overflow: hidden; /* 防止整体滚动 */
}

.session-list-header {
  padding: 12px 15px; /* 减少padding */
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 防止压缩 */
}

.session-list-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px; /* 稍微减小字体 */
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-items {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* 允许flex子项缩小 */
}

.session-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-item:hover {
  background: #f5f7fa;
}

.session-item.active {
  background: #ecf5ff;
  border-right: 3px solid #409eff;
}

.session-item.current {
  position: relative;
}

.session-item.current::before {
  content: '📌';
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
}

.session-item.current .session-info {
  margin-left: 15px;
}

.session-item.unread {
  background: #fdf6ec;
}

.session-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-name {
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.last-message-time {
  font-size: 12px;
  color: #909399;
}

.chat-window {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满工作区高度 */
  overflow: hidden; /* 防止整体滚动 */
}

.no-session-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满工作区高度 */
  overflow: hidden; /* 防止整体滚动 */
}

.chat-header {
  padding: 12px 20px; /* 减少padding */
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 防止压缩 */
}

.user-info h3 {
  margin: 0;
  color: #303133;
  font-size: 16px; /* 稍微减小字体 */
}

.user-id {
  font-size: 12px;
  color: #909399;
}

.messages-container {
  flex: 1;
  padding: 15px 20px; /* 减少padding */
  overflow-y: auto;
  background: #fafafa;
  min-height: 0; /* 允许flex子项缩小 */
}

.message-item {
  margin-bottom: 20px;
}

.message-item.user-message .message-content {
  background: #e3f2fd;
  margin-left: 0;
  margin-right: 60px;
}

.message-item.service-message .message-content {
  background: #f0f9ff;
  margin-left: 60px;
  margin-right: 0;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sender-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.read-status {
  display: flex;
  align-items: center;
}

.read-icon {
  color: #67c23a;
}

.unread-dot {
  width: 6px;
  height: 6px;
  background: #f56c6c;
  border-radius: 50%;
  display: inline-block;
}

.message-text {
  color: #606266;
  line-height: 1.5;
  word-break: break-word;
}

.message-input-area {
  padding: 15px 20px; /* 减少padding */
  border-top: 1px solid #e4e7ed;
  background: white;
  flex-shrink: 0; /* 防止压缩 */
}

.input-controls {
  margin-bottom: 15px;
}

.input-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}

.file-upload-buttons {
  display: flex;
  gap: 8px;
}

.send-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.file-preview {
  margin: 10px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.message-media {
  margin-top: 8px;
}

.image-container, .video-container, .file-container {
  margin-top: 8px;
}

.image-container img {
  cursor: pointer;
}

.file-container .el-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.empty-sessions, .empty-messages {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
}

/* 响应式设计 */
@media (max-height: 700px) {
  .header {
    padding: 10px 20px;
  }

  .header h2 {
    font-size: 16px;
  }

  .session-list-header {
    padding: 10px 15px;
  }

  .chat-header {
    padding: 10px 20px;
  }

  .messages-container {
    padding: 10px 20px;
  }

  .message-input-area {
    padding: 10px 20px;
  }


}

/* 小屏幕适配 */
@media (max-width: 768px) {
  .session-list {
    width: 250px;
  }

  .stats {
    gap: 20px;
  }
}

/* 表情包面板样式 */
.emoji-panel {
  padding: 0;
}

.emoji-categories {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.emoji-category {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  border-right: 1px solid #e4e7ed;
  transition: all 0.2s;
  white-space: nowrap;
}

.emoji-category:hover {
  background: #e6f7ff;
  color: #409eff;
}

.emoji-category.active {
  background: #409eff;
  color: white;
}

.emoji-category:last-child {
  border-right: none;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 18px;
  transition: all 0.2s;
}

.emoji-item:hover {
  background: #f0f9ff;
  transform: scale(1.2);
}

/* 常用语样式 */
.quick-phrases-panel {
  padding: 0;
}

.phrases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.phrases-categories {
  display: flex;
  gap: 4px;
}

.phrases-category {
  padding: 4px 8px;
  cursor: pointer;
  font-size: 11px;
  color: #606266;
  border-radius: 4px;
  transition: all 0.2s;
  white-space: nowrap;
}

.phrases-category:hover {
  background: #e6f7ff;
  color: #409eff;
}

.phrases-category.active {
  background: #409eff;
  color: white;
}

.phrases-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
}

.phrase-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.4;
  color: #606266;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.phrase-item:hover {
  background: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

.phrase-item:last-child {
  margin-bottom: 0;
}

.empty-phrases {
  text-align: center;
  color: #909399;
  font-size: 12px;
  padding: 20px;
}

/* 编辑对话框样式 */
.edit-phrases-content {
  max-height: 400px;
}

.phrases-edit-list {
  padding: 10px 0;
}

.phrase-edit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.phrase-edit-item .el-input {
  flex: 1;
}

.add-phrase-btn {
  width: 100%;
  margin-top: 10px;
  border: 1px dashed #d9d9d9;
  color: #666;
}

.add-phrase-btn:hover {
  border-color: #409eff;
  color: #409eff;
}
</style>

<style>
/* 表情包弹窗全局样式 */
.emoji-popover.el-popover {
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 常用语弹窗全局样式 */
.quick-phrases-popover.el-popover {
  padding: 0 !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
</style>
