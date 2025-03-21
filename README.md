# Gemini 2.0 多模态智能助手

这是一个基于 Google 最新的gemini-2.0-flash-exp模型、gemini-2.0-flash-exp-image-generation模型构建的多模态模型的轻量级智能对话应用。使用 Vue.js 3 开发的纯前端项目，无需后端服务器即可实现与 Gemini 模型的无缝交互，包括对话识图、图文生成、图片编辑和一致性生成等多种功能。。

## ✨ 功能亮点

- 🤖 接入 Gemini 最新模型：整合 `gemini-2.0-flash-exp` 和 `gemini-2.0-flash-exp-image-generation`
- 📝 智能对话：流畅的文本交互体验，支持上下文理解和连续对话
- 🔍 图像识别：上传图片进行智能分析和识别
- 🎨 AI 图像生成：通过文本提示生成精美图片
- 🖼️ 文字内嵌图片：支持在对话中插入和展示图片
- ✏️ 图像编辑：对生成的图片进行编辑和调整
- 🎯 图像一致性：确保生成图片的风格和内容一致性
- 📄 文档分析：上传文档进行识别与分析（持续优化中）
- 🎬 视频处理：上传视频进行智能处理（持续优化中）
- 💾 本地存储：安全保存 API Key，无需重复输入
- 📱 响应式设计：完美适配各种屏幕尺寸
- ![图文并茂，文字嵌入多张图片，一键生成](https://github.com/user-attachments/assets/29b6abde-78b5-4331-81e0-70940e3d94eb)
- ![编辑图像](https://github.com/user-attachments/assets/4243f7c9-2ba1-48f3-b6b5-27062d85389d)



## 🚀 快速开始

### 获取 API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录您的 Google 账号
3. 创建一个新的 API Key
4. 复制生成的 API Key

### 本地运行

```bash
# 克隆项目
git clone https://github.com/lfglfg11/gemini-assistant.git
cd gemini-assistant

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 部署

作为纯静态项目，您可以轻松部署到任何静态托管平台：

```bash
# 构建生产版本
npm run build
```

推荐的托管平台：
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

## 💡 使用指南

1. 在应用首次启动时，输入您的 Gemini API Key 并保存
2. 在对话框中输入您的问题或指令
3. 使用工具栏执行以下操作：
   - 📷 上传图片：分析图片内容或与图片进行对话
   - 🖌️ 生成图片：输入描述，让 AI 创建图像
   - ✏️ 编辑图片：修改已生成的图片
   - 📑 上传文档：分析文档内容（功能持续优化中）
   - 🎥 上传视频：处理视频内容（功能持续优化中）

## 🛠️ 技术栈

- **前端框架**：Vue.js 3
- **构建工具**：Vite
- **API 集成**：Gemini AI API
- **样式**：自定义 CSS
- **部署**：支持多种部署方式（GitHub Pages、Vercel、Netlify 等）

## 🔒 安全提示

- API Key 仅存储在浏览器本地，不会上传至任何服务器
- 所有 API 调用直接从浏览器发起，无中间服务器
- 媒体文件仅用于即时分析，不会存储

## 🔜 开发计划

- [ ] 增强文档处理能力
- [ ] 完善视频分析功能
- [ ] 添加对话历史导出功能
- [ ] 实现更复杂的图像编辑能力
- [ ] 支持OpenAI等主流 模型切换
- [ ] 添加用户自定义主题
- [ ] 实现流式响应
- [ ] 管理后台及多用户注册、商用版本开发中

## 📄 许可证

MIT

---

## 🙏 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

如果您对这个项目感兴趣或有任何建议，欢迎联系我们！
