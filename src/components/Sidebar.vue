<template>
  <aside class="sidebar" :class="{active: showSidebar}">
    <div class="sidebar-header">
      <h1>Gemini 助手</h1>
      <div class="app-version">2.5</div>
      <!-- 隐藏侧边栏按钮 -->
      <button class="icon-only sidebar-toggle" title="隐藏侧边栏" @click="toggleSidebar">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    
    <div class="sidebar-section">
      <div class="section-header">
        <i class="bi bi-key-fill"></i>
        <span>API 配置</span>
      </div>
      <div class="api-key-container">
        <input 
          type="text" 
          id="api-domain" 
          placeholder="API 域名 (可选)"
          v-model="apiDomainInput"
        >
        <input 
          type="password" 
          id="api-key" 
          placeholder="输入您的 API Key"
          v-model="apiKeyInput"
        >
        <button id="save-api-key" class="btn-primary" @click="saveApiKey">
          <i class="bi bi-save"></i>
          <span>保存</span>
        </button>
      </div>
    </div>
    
    <div class="sidebar-section">
      <div class="section-header">
        <i class="bi bi-cpu-fill"></i>
        <span>模型信息</span>
      </div>
      <div class="model-info">
        <div class="model-name">
          <span>当前模型:</span>
          <span id="current-model">{{ currentModel }}</span>
        </div>
        <div class="badges-container">
          <span class="model-badge">多模态</span>
          <span class="model-badge image-gen">图像生成</span>
          <span class="model-badge image-gen">图像编辑</span>
        </div>
        <button id="toggle-model" title="切换模型" style="display:none" @click="toggleModel">
          <i class="bi bi-arrow-repeat"></i>
          <span>切换模型</span>
        </button>
      </div>
    </div>
    
    <div class="sidebar-section sidebar-actions">
      <button id="clear-chat-btn" class="action-button" @click="clearChat">
        <i class="bi bi-trash"></i>
        <span>清空对话</span>
      </button>
      <button id="new-chat-btn" class="action-button" @click="newChat">
        <i class="bi bi-plus-circle"></i>
        <span>新对话</span>
      </button>
    </div>
    
    <div class="sidebar-footer">
      <p>基于 Gemini 2.0 Flash Exp API</p>
      <p>支持：文本、图像、视频、文档</p>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    apiKey: {
      type: String,
      required: true
    },
    currentModel: {
      type: String,
      required: true
    },
    apiDomain: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      apiKeyInput: this.apiKey,
      apiDomainInput: this.apiDomain
    }
  },
  methods: {
    saveApiKey() {
      this.$emit('save-api-key', this.apiKeyInput, this.apiDomainInput)
    },
    clearChat() {
      this.$emit('clear-chat')
    },
    newChat() {
      this.$emit('new-chat')
    },
    toggleModel() {
      // 暂时不实现模型切换功能
      console.log('模型切换功能暂未开启')
    },
    toggleSidebar() {
      this.$emit('toggle-sidebar')
    }
  },
  watch: {
    apiKey(newValue) {
      this.apiKeyInput = newValue
    },
    apiDomain(newValue) {
      this.apiDomainInput = newValue
    }
  }
}
</script>