<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <Sidebar 
      :apiKey="apiKey" 
      :currentModel="currentModel" 
      @save-api-key="saveApiKey" 
      @clear-chat="clearChat" 
      @new-chat="newChat"
    />
    
    <!-- 主内容区 -->
    <main class="main-content">
      <ChatContainer 
        ref="chatContainer"
        :conversationHistory="conversationHistory"
        :apiKey="apiKey"
        :currentModel="currentModel"
        :isEditingImage="isEditingImage"
        :editingImageData="editingImageData"
        :currentMedia="currentMedia"
        @send-message="sendMessage"
        @generate-image="showImageGenerationUI"
        @reset-media="resetMediaPreview"
        @edit-image="showImageEditUI"
        @update:conversation-history="updateConversationHistory"
        @edit-image-complete="handleEditImageComplete"
        @set-media="setMediaPreview"
      />
    </main>
    
    <!-- 隐藏的文件上传 -->
    <input type="file" id="image-upload" accept="image/*" style="display: none;" @change="handleImageUpload">
    <input type="file" id="file-upload" accept=".pdf,.txt,.doc,.docx" style="display: none;" @change="handleFileUpload">
    <input type="file" id="video-upload" accept="video/*" style="display: none;" @change="handleVideoUpload">
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import ChatContainer from './components/ChatContainer.vue'

export default {
  name: 'App',
  components: {
    Sidebar,
    ChatContainer
  },
  data() {
    return {
      apiKey: localStorage.getItem('gemini_api_key') || '',
      currentModel: 'gemini-2.0-flash-exp',
      conversationHistory: [],
      isEditingImage: false,
      editingImageData: null,
      currentMedia: null,
      lastUploadedImage: null,
      pendingSystemMessages: null,
      availableModels: [
        { id: 'gemini-2.0-flash-exp', name: '多模态' },
        { id: 'gemini-2.0-flash-exp-image-generation', name: '图像生成' },
        { id: 'gemini-2.0-flash-exp-image-generation', name: '图像编辑' }
      ],
      hideInitialMessages: true,
      hasUserStartedChat: false
    }
  },
  methods: {
    saveApiKey(key) {
      this.apiKey = key
      localStorage.setItem('gemini_api_key', key)
      this.addSystemMessage('API Key 已保存，可以开始对话了。')
      
      // 仅在用户尚未开始对话时显示提示
      if (!this.hasUserStartedChat) {
        this.showWelcomeMessages(false);
      }
    },
    
    // 显示欢迎信息和提示（可选择是否显示完整提示）
    showWelcomeMessages(showFull = true) {
      if (showFull) {
        this.addSystemMessage('欢迎使用 Gemini 2.0 多模态助手');
        
        if (!this.apiKey) {
          this.addSystemMessage('请先设置您的 API Key 以开始对话');
        } else {
          this.addSystemMessage('您可以开始对话了');
        }
      }
      
      // 添加简短的提示信息
      this.addSystemMessage('💡 输入问题开始对话，或点击左上角按钮清空对话');
    },
    
    addSystemMessage(text) {
      // 寻找ChatContainer组件实例
      if (this.$refs.chatContainer) {
        this.$refs.chatContainer.addSystemMessage(text)
      } else {
        // 如果组件还未挂载，添加到待处理队列
        this.pendingSystemMessages = this.pendingSystemMessages || []
        this.pendingSystemMessages.push(text)
      }
    },
    
    clearChat() {
      // 完全清空对话
      this.conversationHistory = []
      
      // 清空ChatContainer中的消息
      if (this.$refs.chatContainer) {
        this.$refs.chatContainer.clearConversation();
      }
      
      // 重置用户开始对话的标记
      this.hasUserStartedChat = false;
      
      // 仅显示简短的欢迎消息
      this.showWelcomeMessages(false);
    },
    
    newChat() {
      this.clearChat()
    },
    
    async sendMessage(message) {
      // 标记用户已开始对话
      this.hasUserStartedChat = true;
    },
    
    showImageGenerationUI() {
      this.addSystemMessage("您已进入图像生成模式。请输入详细的图像描述，例如：")
      this.addSystemMessage("- 画一只坐在森林里的红色狐狸，阳光透过树叶")
      this.addSystemMessage("- 生成一张未来感城市的夜景，霓虹灯和高楼大厦")
    },
    showImageEditUI(imageUrl) {
      this.isEditingImage = true
      this.editingImageData = imageUrl
      
      // 保存图像数据到currentMedia，确保预览不会消失
      if (imageUrl) {
        this.currentMedia = {
          type: 'image/jpeg',
          data: imageUrl,
          name: '正在编辑的图像'
        };
      }
      
      // 优化编辑提示消息
      this.addSystemMessage("您已进入图像编辑模式，请输入修改指令：");
    },
    resetMediaPreview() {
      this.currentMedia = null
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      if (!file.type.startsWith('image/')) {
        this.addSystemMessage(`不支持的文件类型: ${file.type}，请上传图片文件。`)
        event.target.value = ''
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        this.currentMedia = {
          type: file.type,
          data: e.target.result,
          name: file.name
        }
        
        this.lastUploadedImage = e.target.result
        this.addSystemMessage(`图片 "${file.name}" 已上传，您可以输入问题来分析此图片，或点击"编辑此图片"按钮进行修改。`)
      }
      
      reader.readAsDataURL(file)
      event.target.value = ''
    },
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      if (file.type.startsWith('application/pdf')) {
        this.currentMedia = {
          type: file.type,
          file: file,
          name: file.name
        }
        this.addSystemMessage(`PDF "${file.name}" 已上传，请输入你想了解的有关此文档的问题。`)
      } else {
        this.addSystemMessage(`不支持的文件类型: ${file.type}`)
      }
      
      event.target.value = ''
    },
    handleVideoUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      this.addSystemMessage("视频处理功能正在开发中，敬请期待。")
      event.target.value = ''
    },
    updateConversationHistory(history) {
      this.conversationHistory = history
      
      // 如果用户发送了消息（对话历史有内容），标记用户已开始对话
      if (history.length > 0) {
        this.hasUserStartedChat = true;
      }
    },
    selectModel(modelId) {
      this.currentModel = modelId
    },
    handleEditImageComplete() {
      this.isEditingImage = false
      this.editingImageData = null
    },
    startImageEditing(imageData) {
      console.log("App: 启动图像编辑模式");
      this.isEditingImage = true;
      this.editingImageData = imageData;
      
      // 保存currentMedia状态，使图像在编辑模式下仍然可见
      if (!this.currentMedia && imageData) {
        this.currentMedia = {
          type: 'image/jpeg',
          data: imageData,
          name: '正在编辑的图像'
        };
      }
    },
    editImageComplete() {
      console.log("App: 图像编辑完成");
      this.isEditingImage = false;
      this.editingImageData = null;
    },
    setMediaPreview(media) {
      this.currentMedia = media
    }
  },
  mounted() {
    // 添加简短的欢迎消息
    this.showWelcomeMessages();
    
    // 处理待处理的系统消息
    this.$nextTick(() => {
      if (this.pendingSystemMessages && this.pendingSystemMessages.length > 0) {
        this.pendingSystemMessages.forEach(msg => {
          if (this.$refs.chatContainer) {
            this.$refs.chatContainer.addSystemMessage(msg)
          }
        })
        this.pendingSystemMessages = []
      }
    })

    // 初始化文件上传监听器
    document.getElementById('image-upload').addEventListener('change', this.handleImageUpload)
    document.getElementById('file-upload').addEventListener('change', this.handleFileUpload)
    document.getElementById('video-upload').addEventListener('change', this.handleVideoUpload)
  }
}
</script>

<style>
  @import './assets/style.css';
  
  /* 添加模式选择器样式 */
  .mode-selector {
    display: flex;
    padding: 8px 16px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }
  
  .mode-btn {
    padding: 6px 12px;
    margin-right: 8px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    background-color: #fff;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
  }
  
  .mode-btn i {
    margin-right: 4px;
  }
  
  .mode-btn.active {
    background-color: #e9ecef;
    border-color: #adb5bd;
    font-weight: 500;
  }
  
  .current-mode-indicator {
    padding: 8px 16px;
    background-color: rgba(0, 0, 0, 0.03);
    display: flex;
    justify-content: center;
  }
  
  .mode-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 16px;
    font-size: 12px;
    line-height: 1;
  }
  
  .mode-badge.editing {
    background-color: #cfe2ff;
    color: #0a58ca;
  }
  
  .mode-badge.generation {
    background-color: #d1e7dd;
    color: #146c43;
  }
  
  .mode-badge i {
    margin-right: 4px;
  }
</style> 