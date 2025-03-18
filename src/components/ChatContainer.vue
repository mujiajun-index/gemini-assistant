<template>
  <div class="chat-container">
    <!-- 顶部信息栏 -->
    <div class="chat-header">
      <div class="chat-title">
        <i class="bi bi-chat-square-text-fill"></i>
        <span>Gemini 多模态对话</span>
      </div>
      <div class="chat-actions">
        <button class="icon-only" title="清空对话" @click="clearConversation">
          <i class="bi bi-trash"></i>
        </button>
        <button class="icon-only" title="设置">
          <i class="bi bi-gear"></i>
        </button>
      </div>
    </div>
    
    <!-- 模式选择器 -->
    <div class="mode-selector">
      <button 
        :class="['mode-btn', currentMode === 'chat' ? 'active' : '']" 
        @click="switchMode('chat')">
        <i class="bi bi-chat-dots"></i> 对话识图模式
      </button>
      <button 
        :class="['mode-btn', currentMode === 'image' ? 'active' : '']" 
        @click="switchMode('image')">
        <i class="bi bi-image"></i> 图文并茂模式
      </button>
    </div>
    
    <!-- 当前模式指示 -->
    <div class="current-mode-indicator" v-if="isEditingImage">
      <div class="mode-badge editing">
        <i class="bi bi-pencil-square"></i> 图像编辑模式
      </div>
    </div>
    <div class="current-mode-indicator" v-else-if="currentMode === 'image'">
      <div class="mode-badge generation">
        <i class="bi bi-palette"></i> 图文并茂模式
      </div>
    </div>
    
    <!-- 聊天消息区域 -->
    <div class="messages-container">
      <div class="chat-messages" ref="chatMessages">
        <MessageItem
          v-for="(message, index) in messages"
          :key="index"
          :message="message"
          @edit-image="handleEditImageRequest"
        />
      </div>
      
      <!-- 媒体预览 -->
      <div class="media-preview" v-show="showMediaPreview" id="media-preview-container">
        <div class="media-preview-header">
          <div class="preview-title">
            <i class="bi bi-image"></i>
            <span>媒体预览</span>
          </div>
          <button id="close-preview" class="icon-only" @click="closePreview">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="media-preview-content" id="media-preview-content" ref="mediaPreviewContent">
          <!-- 媒体预览内容将在这里动态添加 -->
        </div>
      </div>
      
      <!-- 加载指示器 -->
      <div id="loading" class="loading" v-show="loading">
        <div class="spinner"></div>
        <p>思考中...</p>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="media-toolbar">
        <div class="media-controls">
          <button id="image-upload-btn" title="上传图片" class="media-button" @click="triggerImageUpload">
            <i class="bi bi-image"></i>
          </button>
          <button id="file-upload-btn" title="上传文档" class="media-button" @click="triggerFileUpload">
            <i class="bi bi-file-earmark-text"></i>
          </button>
          <button id="video-upload-btn" title="上传视频" class="media-button" @click="triggerVideoUpload">
            <i class="bi bi-camera-video"></i>
          </button>
          <button 
            id="generate-image-btn" 
            title="图像模式" 
            :class="['media-button', currentMode === 'image' ? 'highlighted-btn' : '']" 
            @click="switchMode('image')">
            <i class="bi bi-palette"></i>
          </button>
        </div>
      </div>
      
      <div class="message-input-container">
        <textarea 
          id="user-input" 
          class="message-input" 
          :placeholder="getInputPlaceholder()" 
          rows="1" 
          v-model="userInput"
          @keydown.enter.prevent="onEnterPress"
          ref="userInput"
        ></textarea>
        <button id="send-btn" class="send-button" title="发送" @click="sendMessage">
          <i class="bi bi-send"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import MessageItem from './MessageItem.vue'

export default {
  name: 'ChatContainer',
  components: {
    MessageItem
  },
  props: {
    conversationHistory: {
      type: Array,
      required: true
    },
    apiKey: {
      type: String,
      required: true
    },
    currentModel: {
      type: String,
      required: true
    },
    isEditingImage: {
      type: Boolean,
      default: false
    },
    editingImageData: {
      type: String,
      default: null
    },
    currentMedia: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      messages: [], // 本地消息列表，用于显示
      userInput: '',
      loading: false,
      showMediaPreview: false,
      currentMode: 'chat', // 默认为对话模式，可选值：'chat', 'image'
      lastGeneratedImage: null, // 存储最后一次生成或上传的图像数据
    }
  },
  computed: {
    // 获取当前使用的模型
    activeModel() {
      if (this.currentMode === 'image' || this.isEditingImage) {
        return 'gemini-2.0-flash-exp-image-generation'; // 图像生成/编辑模型
      }
      return this.currentModel || 'gemini-2.0-flash-exp'; // 默认对话模型
    }
  },
  methods: {
    // 切换模式
    switchMode(mode) {
      if (this.currentMode !== mode) {
        this.currentMode = mode;
        
        if (mode === 'chat') {
          this.addSystemMessage("已切换到对话识图模式 (使用gemini-2.0-flash-exp模型)");
        } else if (mode === 'image') {
          this.addSystemMessage("已切换到图文并茂模式 (使用gemini-2.0-flash-exp-image-generation模型) - 您可以：1) 直接输入文字描述生成图像；2) 上传图片后编辑图像");
        }
        
        // 清空输入框并聚焦
        this.userInput = '';
        this.$nextTick(() => {
          if (this.$refs.userInput) {
            this.$refs.userInput.focus();
          }
        });
      }
    },
    
    // 根据当前模式获取输入框占位符
    getInputPlaceholder() {
      if (this.isEditingImage) {
        return "描述如何编辑图像（例如：添加一朵云、将背景改成蓝色）";
      } else if (this.currentMode === 'image') {
        return "描述您想要生成的图像，或输入图像相关问题...";
      } else {
        return "输入您的问题或指令，也可以上传图片进行识别...";
      }
    },
    
    // 处理编辑图像请求
    handleEditImageRequest(imageData) {
      // 直接启动编辑模式
      this.startImageEditing(imageData);
    },
    
    // 添加系统消息
    addSystemMessage(text) {
      this.messages.push({
        type: 'system',
        content: text
      })
      this.scrollToBottom()
    },
    
    // 添加用户消息
    addUserMessage(text, media = null) {
      this.messages.push({
        type: 'user',
        content: text,
        media: media
      })
      this.scrollToBottom()
      
      // 更新对话历史
      const userMessage = {
        role: 'user',
        parts: [{text: text}]
      }
      
      // 如果有媒体，添加到消息中
      if (media && media.type && media.type.startsWith('image/') && media.data) {
        userMessage.parts.push({
          inline_data: {
            mime_type: media.type,
            data: media.data.split(',')[1]
          }
        })
      }
      
      this.$emit('update:conversationHistory', [...this.conversationHistory, userMessage])
    },
    
    // 添加助手消息
    addAssistantMessage(text, imageUrls = null) {
      const message = {
        type: 'assistant',
        content: text
      }
      
      if (imageUrls && imageUrls.length > 0) {
        message.imageUrls = imageUrls
        // 保存最后生成的图像数据以便后续编辑
        this.lastGeneratedImage = imageUrls[0]
        console.log("保存最后生成的图像用于编辑:", this.lastGeneratedImage.substring(0, 50) + "...")
      }
      
      this.messages.push(message)
      this.scrollToBottom()
      
      // 更新对话历史
      this.$emit('update:conversationHistory', [...this.conversationHistory, {
        role: 'model',
        parts: [{text: text}]
      }])
    },
    
    // 启用图像编辑模式
    startImageEditing(imageData) {
      console.log("启动图像编辑模式");
      
      // 保存图像数据用于编辑
      this.lastGeneratedImage = imageData;
      
      // 通知父组件进入编辑模式
      this.$emit('start-image-editing', imageData);
      
      // 更新UI提示用户输入编辑指令
      this.userInput = "请描述如何编辑该图片（例如：添加一朵云、将背景改成蓝色）";
      
      // 添加合并后的系统提示消息
      this.addSystemMessage(`📝 图像编辑模式已启动 - 请输入编辑指令，例如：「添加一只小猫在右下角」「将背景改为海滩场景」「给图像添加雪花效果」`);
      
      // 添加当前编辑的图像到消息流，以便用户可以看到
      this.addUserMessage("准备编辑以下图像：", { type: 'image/jpeg', data: imageData });
      
      this.$nextTick(() => {
        if (this.$refs.userInput) {
          this.$refs.userInput.focus();
          this.$refs.userInput.select();
        }
      });
    },
    
    // 发送消息
    async sendMessage() {
      const message = this.userInput.trim()
      if (!message && !this.currentMedia) return
      
      this.addUserMessage(message, this.currentMedia)
      this.userInput = ''
      this.autoResizeTextarea()
      
      this.loading = true
      
      try {
        let response
        
        // 根据当前状态选择操作
        if (this.isEditingImage && this.editingImageData) {
          // 图像编辑模式 - 使用图文并茂模型进行图像编辑
          console.log("使用图文并茂模型进行图像编辑");
          
          // 显示正在编辑的原始图像(如果尚未显示)
          const existingEditMessage = this.messages.find(m => 
            m.type === 'user' && m.content === "准备编辑以下图像：" && m.media);
          
          if (!existingEditMessage) {
            this.addUserMessage("使用以下图像进行编辑:", { 
              type: 'image/jpeg', 
              data: this.editingImageData 
            });
          }
          
          response = await this.editImage(this.editingImageData, message)
          this.$emit('edit-image-complete')
        }
        // 判断是否是编辑请求 - 无论是在哪种模式下
        else if (this.isImageEditRequest(message) && (this.lastGeneratedImage || (this.currentMedia && this.currentMedia.type && this.currentMedia.type.startsWith('image/')))) {
          // 确定要编辑的图像数据
          const imageToEdit = this.currentMedia?.data || this.lastGeneratedImage;
          
          if (imageToEdit) {
            console.log("检测到图像编辑请求，使用图文并茂模型编辑现有图像");
            response = await this.editImage(imageToEdit, message);
            // 如果是通过上传图片编辑，编辑完成后重置媒体
            if (this.currentMedia) {
              this.$emit('reset-media');
            }
          } else {
            console.error("未找到可编辑的图像数据");
            this.addSystemMessage("未找到可编辑的图像。请先生成或上传一张图片。");
            this.loading = false;
            return;
          }
        }
        else if (this.currentMode === 'image') {
          if (this.currentMedia && this.currentMedia.type && this.currentMedia.type.startsWith('image/')) {
            // 上传图片的图像分析请求
            console.log("使用图文并茂模型分析图像并响应");
            response = await this.callGeminiAPI(message, this.currentMedia);
            this.$emit('reset-media'); // 处理完成后重置媒体
          } else {
            // 图文并茂模式，但没有上传图片，执行图像生成
            console.log("使用图文并茂模型生成图像");
            this.addSystemMessage(`正在生成图像: "${message}"，请稍候...`)
            response = await this.generateImage(message)
          }
        }
        else if (this.currentMedia) {
          // 对话识图模式下上传了媒体
          const mediaType = this.currentMedia.type.split('/')[0]
          
          if (mediaType === 'image') {
            console.log("使用对话识图模型分析图像");
            response = await this.callGeminiAPI(message, this.currentMedia)
          } else if (mediaType === 'application' && this.currentMedia.type.includes('pdf')) {
            response = await this.extractPdfText(this.currentMedia, message)
          } else {
            response = await this.callGeminiAPI(message, null)
          }
          
          // 重置当前媒体
          this.$emit('reset-media')
        }
        else {
          // 普通对话模式 - 使用对话识图模型
          console.log("使用对话识图模型进行对话");
          response = await this.callGeminiAPI(message)
        }
        
        // 处理响应
        if (response) {
          if (response.text && response.imageUrls) {
            this.addAssistantMessage(response.text, response.imageUrls)
          } else {
            this.addAssistantMessage(response.text || response)
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
        this.addSystemMessage(`发送消息时出错: ${error.message}`)
      } finally {
        this.loading = false
      }
    },
    
    // 回车键处理
    onEnterPress(e) {
      if (!e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    },
    
    // 调用Gemini API
    async callGeminiAPI(prompt, media = null) {
      if (!this.apiKey) {
        throw new Error("请先设置API Key")
      }
      
      // 使用当前活动模型
      const modelToUse = this.activeModel;
      console.log(`使用模型: ${modelToUse}`);
      
      // 构建请求体
      const requestBody = {
        contents: [],
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 1
        }
      }
      
      // 如果是图像相关模型，添加响应模态设置
      if (modelToUse === 'gemini-2.0-flash-exp-image-generation') {
        requestBody.generationConfig.responseModalities = ["Text", "Image"];
      }
      
      // 添加对话历史记录
      for (const msg of this.conversationHistory) {
        requestBody.contents.push(msg)
      }
      
      // 添加当前提示
      const currentMessage = { parts: [{ text: prompt }] }
      
      // 如果有媒体（图片），添加到提示中
      if (media && media.type && media.type.startsWith('image/') && media.data) {
        currentMessage.parts.push({
          inline_data: {
            mime_type: media.type,
            data: media.data.split(',')[1]
          }
        })
      }
      
      // 添加至请求体
      requestBody.contents.push({
        role: "user",
        parts: currentMessage.parts
      })
      
      // 发送请求
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        if (!response.ok) {
          throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // 提取回复内容（包括可能的图像）
        return this.extractApiResponse(data, modelToUse);
      } catch (error) {
        console.error("API调用错误:", error)
        throw error
      }
    },
    
    // 提取API响应内容
    extractApiResponse(data, modelUsed) {
      console.log("API响应:", JSON.stringify({
        ...data,
        candidates: data.candidates?.map(c => ({
          ...c,
          content: {
            ...c.content,
            parts: c.content?.parts?.map(p => p.inline_data || p.inlineData ? {
              ...(p.inline_data || p.inlineData),
              data: "BASE64_DATA_TRUNCATED"
            } : p)
          }
        }))
      }, null, 2));
      
      // 检查基本数据结构
      if (!data.candidates || !data.candidates.length || !data.candidates[0].content) {
        console.error("API响应缺少必要字段");
        throw new Error("API响应格式异常");
      }
      
      const parts = data.candidates[0].content.parts;
      
      // 如果是图像生成模型，可能包含图像
      if (modelUsed === 'gemini-2.0-flash-exp-image-generation') {
        const imageUrls = [];
        let responseText = "以下是根据您的指令生成的内容：";
        
        // 提取文本部分
        const textParts = parts.filter(part => part.text);
        if (textParts.length > 0) {
          responseText = textParts.map(part => part.text).join("\n");
        }
        
        // 提取图像部分
        for (const part of parts) {
          const imageData = part.inline_data || part.inlineData;
          if (imageData) {
            const base64Data = imageData.data;
            const mimeType = imageData.mime_type || imageData.mimeType || "image/jpeg";
            const imageUrl = `data:${mimeType};base64,${base64Data}`;
            imageUrls.push(imageUrl);
          }
        }
        
        if (imageUrls.length > 0) {
          return { text: responseText, imageUrls: imageUrls };
        } else {
          return { text: responseText };
        }
      } else {
        // 对于普通文本模型，直接返回文本
        return parts.map(part => part.text).join('');
      }
    },
    
    // 生成图像
    async generateImage(prompt) {
      if (!this.apiKey) {
        throw new Error("请先设置API Key")
      }
      
      console.log("开始生成图像，提示词:", prompt)
      
      // 优化提示词
      let enhancedPrompt = prompt
      if (prompt.match(/[\u4e00-\u9fa5]/)) {
        // 如果包含中文，添加英文描述，但保留原始中文
        enhancedPrompt = `${prompt} (Create a detailed, high-quality illustration of this description)`
      }
      
      // 严格按照官方提供的格式构建请求
      const requestBody = {
        contents: [{
          parts: [
            { text: enhancedPrompt }
          ]
        }],
        generationConfig: {
          responseModalities: ["Text", "Image"]
        }
      }
      
      console.log("图像生成API请求体:", JSON.stringify(requestBody, null, 2))
      
      try {
        // 使用图文并茂模型
        const modelToUse = 'gemini-2.0-flash-exp-image-generation';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`
        
        console.log("发送图像生成请求到URL:", url.replace(this.apiKey, "API_KEY_HIDDEN"))
        
        // 发送请求
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        console.log("图像生成API响应状态:", response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("图像生成API错误响应:", errorText)
          throw new Error(`图像生成失败: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        return this.extractApiResponse(data, modelToUse);
      } catch (error) {
        console.error("图像生成错误:", error)
        // 返回用户友好的错误提示
        return { 
          text: `图像生成失败: ${error.message}\n\n可能的原因:\n1. API密钥权限不足\n2. 提示词可能违反内容政策\n3. 服务暂时不可用\n\n解决方案:\n1. 检查API密钥设置和权限\n2. 尝试使用更简单的描述`,
          imageUrls: []
        }
      }
    },
    
    // 编辑图像
    async editImage(imageData, prompt) {
      if (!this.apiKey) {
        throw new Error("请先设置API Key")
      }
      
      console.log("开始编辑图像，指令:", prompt);
      this.addSystemMessage(`正在按照您的指令编辑图像: "${prompt}"，请稍候...`);
      
      // 从imageData中提取base64数据
      let base64Data
      if (imageData.startsWith('data:')) {
        base64Data = imageData.split(',')[1]
      } else {
        base64Data = imageData
      }
      
      if (!base64Data) {
        throw new Error("无法提取图像数据")
      }
      
      // 如果提示词包含中文，添加英文描述，但保留原始中文
      let enhancedPrompt = prompt
      if (prompt.match(/[\u4e00-\u9fa5]/)) {
        enhancedPrompt = `${prompt} (Edit the image based on this description in Chinese)`
      }
      
      // 严格按照官方提供的格式构建请求体
      const requestBody = {
        contents: [{
          parts: [
            {
              text: enhancedPrompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["Text", "Image"]
        }
      }
      
      console.log("图像编辑API请求体:", JSON.stringify({
        ...requestBody,
        contents: [
          {
            parts: [
              { text: enhancedPrompt },
              { inline_data: { mime_type: "image/jpeg", data: "BASE64_DATA_TRUNCATED" } }
            ]
          }
        ]
      }, null, 2));
      
      try {
        // 使用图文并茂模型
        const modelToUse = 'gemini-2.0-flash-exp-image-generation';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${this.apiKey}`
        
        console.log("发送图像编辑请求到URL:", url.replace(this.apiKey, "API_KEY_HIDDEN"));
        
        // 发送请求
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })
        
        console.log("图像编辑API响应状态:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("图像编辑API错误响应:", errorText)
          throw new Error(`图像编辑失败: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        return this.extractApiResponse(data, modelToUse);
      } catch (error) {
        console.error("图像编辑错误:", error)
        // 返回用户友好的错误提示
        return { 
          text: `图像编辑失败: ${error.message}\n\n可能的原因:\n1. API密钥权限不足\n2. 编辑指令可能违反内容政策\n3. 服务暂时不可用\n\n解决方案:\n1. 检查API密钥权限\n2. 尝试使用更简单的编辑指令`,
          imageUrls: []
        }
      }
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.chatMessages) {
          this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight
        }
      })
    },
    
    // 自动调整文本区域高度
    autoResizeTextarea() {
      const textarea = this.$refs.userInput
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
      }
    },
    
    // 触发图片上传
    triggerImageUpload() {
      document.getElementById('image-upload').click()
    },
    
    // 触发文件上传
    triggerFileUpload() {
      document.getElementById('file-upload').click()
    },
    
    // 触发视频上传
    triggerVideoUpload() {
      document.getElementById('video-upload').click()
    },
    
    // 关闭预览
    closePreview() {
      this.showMediaPreview = false
      if (this.$refs.mediaPreviewContent) {
        this.$refs.mediaPreviewContent.innerHTML = ''
      }
    },
    
    // 添加一个判断是否是图像编辑请求的方法
    isImageEditRequest(message) {
      // 如果用户上传了图片并立即输入文本，更倾向于认为这是编辑请求
      const hasUploadedImageRecently = this.lastGeneratedImage !== null;
      
      // 直接检查是否包含明确的编辑指令
      if (message.startsWith("编辑") || message.startsWith("修改") || 
          message.includes("编辑这张图") || message.includes("编辑此图") || 
          message.includes("修改这张图") || message.includes("修改此图")) {
        console.log("明确的编辑指令检测到:", message);
        return true;
      }
      
      // 定义可能的编辑图像请求模式
      const editPatterns = [
        /编辑(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?/i,
        /修改(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?/i,
        /更改(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?/i,
        /调整(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?/i,
        /(对|把)(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?(进行)?(编辑|修改|更改|调整)/i,
        /(在|将)(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?(中|上|里)?(添加|加上|放入|加入|插入)/i,
        /(能不能|可不可以|请|麻烦)(编辑|修改|更改|调整)(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?/i,
        /(把|将)(这|此|当前|上面的|最后的|最新的|这张|这个|这幅)?图(片|像)?(的)?背景(改成|换成|变成)/i,
        /把.*(改为|改成|换成|变成|替换为|替换成)/i,
        /将.*(改为|改成|换成|变成|替换为|替换成)/i,
        /edit( this| the| current)? image/i,
        /modify( this| the| current)? image/i,
        /change( this| the| current)? image/i,
        /adjust( this| the| current)? image/i,
        /add (a|an|some) .+ to (this|the) image/i
      ];
      
      // 判断是否包含某些关键动词和可能的对象
      const editVerbs = ["添加", "加上", "放", "插入", "改变", "修改", "调整", "变成", "改成", "改为", "换成", "移除", "删除", "擦除"];
      const hasEditVerb = editVerbs.some(verb => message.includes(verb));
      
      // 特定的编辑场景关键词
      const editScenarios = [
        "背景", "前景", "效果", "滤镜", "颜色", "色彩", "亮度", "对比度", 
        "风格", "样式", "大小", "位置", "旋转", "翻转", "剪裁", "元素"
      ];
      const hasEditScenario = editScenarios.some(scenario => message.includes(scenario));
      
      // 检查是否明确提到物体添加
      const objectAddition = /添加.+到?图(片|像)?上?/i.test(message) || 
                           /在图(片|像)?上?添加/i.test(message) ||
                           /加上.+到?图(片|像)?上?/i.test(message);
      
      // 检查"把...改为"这种格式
      const changeFormatPattern = /把.*([改变成]|替换)/i.test(message) ||
                                /将.*([改变成]|替换)/i.test(message);
      
      // 检查是否匹配任何一个模式
      const matchesPattern = editPatterns.some(pattern => pattern.test(message));
      
      // 检查是否在提到图像元素的同时有修改意图
      const elementChangeIntent = hasEditScenario && 
        (message.includes("改") || message.includes("变") || message.includes("换") || 
         message.includes("调") || message.includes("替换"));
      
      // 如果匹配明确的模式，或者既有编辑动词又有明确的编辑场景，或者明确提到物体添加
      // 或者使用了"把...改为"格式，或者明确提到了图像元素的修改
      const isEditRequest = matchesPattern || 
                          (hasEditVerb && hasEditScenario) || 
                          objectAddition || 
                          changeFormatPattern || 
                          elementChangeIntent;
      
      console.log("检查是否是图像编辑请求:", message, isEditRequest);
      console.log("- 匹配模式:", matchesPattern);
      console.log("- 包含编辑动词:", hasEditVerb);
      console.log("- 包含编辑场景:", hasEditScenario);
      console.log("- 明确物体添加:", objectAddition);
      console.log("- 使用'把...改为'格式:", changeFormatPattern);
      console.log("- 图像元素修改意图:", elementChangeIntent);
      
      // 当用户明确提到背景且看起来是在进行图像修改时，默认认为是编辑请求
      // 特别是当用户刚上传或生成了图像时
      if (hasEditScenario && hasUploadedImageRecently && message.length < 30) {
        console.log("- 检测到用户刚上传图像并简短提到了图像元素，判定为编辑请求");
        return true;
      }
      
      return isEditRequest;
    },
    
    // 清空对话
    clearConversation() {
      // 完全清空消息列表
      this.messages = [];
      this.userInput = '';
      
      // 重置图像状态
      this.lastGeneratedImage = null;
      this.$emit('reset-media');
      this.$emit('edit-image-complete');
      
      // 清空媒体预览
      this.closePreview();
      
      // 重置对话历史
      this.$emit('update:conversationHistory', []);
      
      // 自动调整输入框
      this.autoResizeTextarea();
      
      // 如果当前不是对话模式，切换回对话模式
      if (this.currentMode !== 'chat') {
        this.currentMode = 'chat';
      }
      
      // 添加简短的欢迎消息
      this.addSystemMessage("对话已清空");
    },
    
    // 处理粘贴事件
    handlePaste(e) {
      // 只有当焦点在输入框上时才处理粘贴事件
      if (document.activeElement !== this.$refs.userInput) {
        return;
      }
      
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file && file.type.startsWith('image/')) {
            e.preventDefault();
            this.processPastedImage(file);
            break;
          }
        }
      }
    },
    
    // 处理粘贴的图片
    processPastedImage(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // 创建媒体对象
        const media = {
          type: file.type,
          data: e.target.result,
          name: 'Pasted image ' + new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        
        // 通过事件通知父组件更新媒体数据，而不是直接修改props
        this.$emit('set-media', media);
        
        // 保存最后上传的图像用于编辑
        this.lastGeneratedImage = e.target.result;
        console.log("保存粘贴的图像用于编辑:", this.lastGeneratedImage.substring(0, 50) + "...");
        
        // 显示提示消息
        this.addSystemMessage(`图片已粘贴，您可以输入问题来分析此图片，或点击"编辑此图片"按钮进行修改。`);
      };
      reader.readAsDataURL(file);
    }
  },
  watch: {
    // 监听用户输入变化，调整文本区域高度
    userInput() {
      this.autoResizeTextarea()
    },
    
    // 监听当前媒体变化，显示预览
    currentMedia(newMedia) {
      if (newMedia) {
        this.showMediaPreview = true
        
        // 如果是图片，保存它以便后续编辑
        if (newMedia.type && newMedia.type.startsWith('image/') && newMedia.data) {
          this.lastGeneratedImage = newMedia.data
          console.log("保存上传的图像用于编辑:", this.lastGeneratedImage.substring(0, 50) + "...")
        }
        
        // 在下一个DOM更新周期添加预览内容
        this.$nextTick(() => {
          if (this.$refs.mediaPreviewContent) {
            this.$refs.mediaPreviewContent.innerHTML = ''
            
            if (newMedia.type.startsWith('image/')) {
              const img = document.createElement('img')
              img.src = newMedia.data
              img.style.maxWidth = '100%'
              img.style.maxHeight = '300px'
              this.$refs.mediaPreviewContent.appendChild(img)
              
              // 添加编辑按钮
              const editBtn = document.createElement('button')
              editBtn.className = 'preview-edit-btn'
              editBtn.innerHTML = '<i class="bi bi-pencil-square"></i> 编辑此图片'
              editBtn.onclick = () => this.startImageEditing(newMedia.data)
              this.$refs.mediaPreviewContent.appendChild(editBtn)
            }
          }
        })
      } else {
        this.showMediaPreview = false
      }
    }
  },
  mounted() {
    // 初始化自动调整文本区域高度
    this.autoResizeTextarea()
    
    // 初始化消息
    this.messages = [] // 清空现有消息
    
    // 从对话历史中添加消息
    for (const message of this.conversationHistory) {
      if (message.role === 'user') {
        this.addUserMessage(message.parts[0].text)
      } else if (message.role === 'model') {
        this.addAssistantMessage(message.parts[0].text)
      }
    }
    
    // 添加粘贴事件监听器，支持直接粘贴图片
    document.addEventListener('paste', this.handlePaste);
  },
  
  beforeUnmount() {
    // 移除粘贴事件监听器
    document.removeEventListener('paste', this.handlePaste);
  }
}
</script> 