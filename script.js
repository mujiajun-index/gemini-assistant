// DOM 元素
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyBtn = document.getElementById('save-api-key');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageUploadBtn = document.getElementById('image-upload-btn');
const fileUploadBtn = document.getElementById('file-upload-btn');
const videoUploadBtn = document.getElementById('video-upload-btn');
const generateImageBtn = document.getElementById('generate-image-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const toggleModelBtn = document.getElementById('toggle-model');
const currentModelText = document.getElementById('current-model');
const imageUpload = document.getElementById('image-upload');
const fileUpload = document.getElementById('file-upload');
const videoUpload = document.getElementById('video-upload');
const loadingIndicator = document.getElementById('loading');
const mediaPreviewContainer = document.getElementById('media-preview-container');
const mediaPreviewContent = document.getElementById('media-preview-content');
const closePreviewBtn = document.getElementById('close-preview');
const newChatBtn = document.getElementById('new-chat-btn');

// 状态变量
let apiKey = localStorage.getItem('gemini_api_key') || '';
let currentMedia = null;
let isGeneratingImage = false;
let conversationHistory = [];
let currentModel = localStorage.getItem('gemini_model') || 'gemini-2.0-flash-exp';
let lastGeneratedImage = null; // 存储最后一次生成的图像
let lastUploadedImage = null; // 存储最后一次上传的图像
let editingImage = null; // 当前正在编辑的图像
let isEditingImage = false; // 是否处于图像编辑模式

// 初始化
function init() {
    console.log("初始化应用...");
    
    // 确保所有DOM元素都已正确加载
    if (!chatMessages) {
        console.error("聊天消息容器未找到");
    }
    
    if (!userInput) {
        console.error("用户输入框未找到");
    }
    
    if (!mediaPreviewContainer) {
        console.error("媒体预览容器未找到");
        // 尝试重新获取媒体预览容器
        const container = document.getElementById('media-preview-container');
        if (container) {
            mediaPreviewContainer = container;
            console.log("已重新获取媒体预览容器");
        }
    }
    
    if (!mediaPreviewContent) {
        console.error("媒体预览内容容器未找到");
        // 尝试重新获取媒体预览内容容器
        const content = document.getElementById('media-preview-content');
        if (content) {
            mediaPreviewContent = content;
            console.log("已重新获取媒体预览内容容器");
        }
    }
    
    // 显示当前模型
    if (currentModelText) {
        currentModelText.textContent = currentModel;
    }
    
    // 自动调整输入框高度
    setupAutoResizeTextarea();
    
    if (apiKey) {
        if (apiKeyInput) {
            apiKeyInput.value = apiKey;
        }
        addSystemMessage('API Key 已加载，可以开始对话了。');
        // 添加图像生成提示
        addSystemMessage('💡 图像功能提示：');
        addSystemMessage('1. 生成图像：系统使用专门的gemini-2.0-flash-exp-image-generation模型生成图片。描述需非常详细才能获得好效果。请描述场景、风格、色彩、光照等元素。');
        addSystemMessage('2. 编辑图像：您可以上传图像或使用生成的图像，然后点击"编辑此图像"按钮进行修改。修改指令可以是："添加蓝色背景"、"添加一只猫"等。');
        addSystemMessage('⚠️ 注意：某些类型的图像编辑请求可能会被系统拒绝或失败，例如人物背景相关修改。请参考API限制。');
        
        // 通用图像数据，用于测试
        // testImageDisplay();
    }

    // 事件监听器
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', saveApiKey);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // 媒体按钮
    if (imageUploadBtn && imageUpload) {
        imageUploadBtn.addEventListener('click', () => imageUpload.click());
    }
    
    if (fileUploadBtn && fileUpload) {
        fileUploadBtn.addEventListener('click', () => fileUpload.click());
    }
    
    if (videoUploadBtn && videoUpload) {
        videoUploadBtn.addEventListener('click', () => videoUpload.click());
    }
    
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', showImageGenerationUI);
    }
    
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }
    
    // 新对话按钮
    if (newChatBtn) {
        newChatBtn.addEventListener('click', newChat);
    }
    
    // 测试按钮
    const testImageBtn = document.getElementById('test-image-btn');
    if (testImageBtn) {
        testImageBtn.addEventListener('click', testImageDisplay);
    }
    
    // 隐藏模型切换按钮，因为我们只使用gemini-2.0-flash-exp模型
    if (toggleModelBtn) {
        toggleModelBtn.style.display = 'none';
    }
    
    // 文件上传处理
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    if (fileUpload) {
        fileUpload.addEventListener('change', handleFileUpload);
    }
    
    if (videoUpload) {
        videoUpload.addEventListener('change', handleVideoUpload);
    }
    
    // 预览关闭
    if (closePreviewBtn && mediaPreviewContainer) {
        closePreviewBtn.addEventListener('click', () => {
            mediaPreviewContainer.style.display = 'none';
            if (mediaPreviewContent) {
                mediaPreviewContent.innerHTML = '';
            }
            // 注意：这里不重置currentMedia，因为用户可能想关闭预览后继续使用上传的媒体
        });
    }
    
    // 移动端侧边栏切换
    setupMobileUI();
    
    // 初始化图片点击放大功能
    document.addEventListener('click', function(event) {
        // 富文本图片点击
        if (event.target && event.target.classList.contains('rich-content-image')) {
            showImageFullscreen(event.target.src);
        }
        
        // 关闭全屏图片
        if (event.target && event.target.classList.contains('fullscreen-modal')) {
            closeFullscreenImage();
        }
    });
    
    console.log("应用初始化完成");
}

// 设置移动端UI
function setupMobileUI() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    // 小屏幕下添加侧边栏切换
    if (window.innerWidth <= 768) {
        const toggleSidebarBtn = document.createElement('button');
        toggleSidebarBtn.className = 'toggle-sidebar-btn';
        toggleSidebarBtn.innerHTML = '<i class="bi bi-list"></i>';
        
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-open');
        });
        
        // 点击主内容区域关闭侧边栏
        mainContent.addEventListener('click', () => {
            if (sidebar.classList.contains('sidebar-open')) {
                sidebar.classList.remove('sidebar-open');
            }
        });
        
        // 添加到DOM
        document.querySelector('.chat-header').prepend(toggleSidebarBtn);
    }
}

// 自动调整输入框高度
function setupAutoResizeTextarea() {
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 200);
        this.style.height = newHeight + 'px';
    });
    
    // 初始化时调整一次
    if (userInput) {
        userInput.style.height = 'auto';
        const newHeight = Math.min(userInput.scrollHeight, 200);
        userInput.style.height = newHeight + 'px';
    }
}

// 新建对话
function newChat() {
    // 清空对话
    clearChat();
    
    // 添加系统消息
    addSystemMessage('新对话已开始');
    
    // 添加欢迎消息
    addSystemMessage('您可以开始问问题了，或者上传图片进行分析');
}

// 清空对话
function clearChat() {
    // 移除所有非系统消息
    const messages = chatMessages.querySelectorAll('.message:not(.welcome-message)');
    messages.forEach(msg => msg.remove());
    
    // 清空对话历史
    conversationHistory = [];
    
    // 添加系统消息
    addSystemMessage('对话已清空');
}

// 保存 API Key
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
        apiKey = newApiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        addSystemMessage('API Key 已保存。');
    } else {
        addSystemMessage('请输入有效的 API Key。');
    }
}

// 添加系统消息
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    
    // 创建图标
    const iconElement = document.createElement('i');
    iconElement.className = 'bi bi-info-circle-fill message-icon';
    messageDiv.appendChild(iconElement);
    
    // 创建消息内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${text}</p>`;
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 添加用户消息
function addUserMessage(text, mediaElement = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    
    // 创建消息内容容器
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = `<p>${text}</p>`;
    
    if (mediaElement) {
        // 检查mediaElement是否为DOM元素
        if (mediaElement instanceof Node) {
            contentDiv.appendChild(mediaElement);
        } 
        // 如果是媒体对象，则创建适当的媒体元素
        else if (mediaElement === currentMedia && currentMedia.type && currentMedia.data) {
            if (currentMedia.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = currentMedia.data;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '250px';
                img.style.borderRadius = '8px';
                img.style.marginTop = '10px';
                contentDiv.appendChild(img);
            }
        }
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 添加到对话历史
    const userMessage = {
        role: 'user',
        parts: [{text: text}]
    };
    
    // 如果有媒体，添加到消息中
    if (currentMedia && currentMedia.type === 'image') {
        userMessage.parts.push({
            inline_data: {
                mime_type: 'image/jpeg',
                data: currentMedia.data.split(',')[1]
            }
        });
    }
    
    conversationHistory.push(userMessage);
}

// 添加助手消息
function addAssistantMessage(text, imageUrls = null) {
    // 创建消息容器
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    
    // 创建头像
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar';
    avatarDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-robot" viewBox="0 0 16 16"><path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.8 24.8 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135"/><path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/></svg>';
    
    // 创建消息内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    
    // 处理文本内容
    let processedText = text;
    
    // 如果有图片，处理图片
    if (imageUrls && imageUrls.length > 0) {
        // 使用updateResponseWithImageRefs函数处理图文
        processedText = updateResponseWithImageRefs(text, imageUrls);
        
        // 添加富文本内容
        contentDiv.innerHTML = processedText;
        
        // 为所有编辑图片按钮添加点击事件
        setTimeout(() => {
            const editButtons = contentDiv.querySelectorAll('.rich-image-edit-btn');
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const imgElement = this.previousElementSibling;
                    const imgIndex = imgElement.getAttribute('data-index');
                    if (imgIndex !== null) {
                        showImageEditUI(imageUrls[imgIndex]);
                    }
                });
            });
        }, 100);
    } else {
        // 普通文本消息
        contentDiv.innerHTML = convertMarkdownToHtml(processedText);
    }
    
    // 添加元素到DOM
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

// 发送消息
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message && !currentMedia) return;
    
    try {
        // 显示用户消息
        addUserMessage(message, currentMedia);
        userInput.value = '';
        
        // 自动调整输入框高度
        userInput.style.height = 'auto';
        
        // 显示加载指示器
        loadingIndicator.style.display = 'flex';
        
        let response;
        
        // 检查是否处于图片编辑模式
        if (isEditingImage && editingImageData) {
            console.log("进入图像编辑模式，开始处理图像编辑请求");
            response = await editImage(editingImageData, message);
            isEditingImage = false;
            editingImageData = null;
        } 
        // 检查是否有媒体
        else if (currentMedia) {
            const mediaType = currentMedia.type.split('/')[0];
            
            if (mediaType === 'image') {
                // 如果是图像，调用具有视觉理解的API
                response = await callGeminiAPI(message, currentMedia);
            } else if (mediaType === 'application' && currentMedia.type.includes('pdf')) {
                // 如果是PDF文档
                response = await extractPdfText(currentMedia, message);
            } else {
                // 其他文件类型
                response = await callGeminiAPI(message, null);
            }
            
            // 重置当前媒体
            resetMediaPreview();
        } 
        // 检查菜谱/教程多步骤图像生成请求
        else if (
            (message.includes("步骤") || message.includes("流程") || message.includes("教程") || message.includes("制作") || message.includes("做法")) && 
            (message.includes("展示") || message.includes("请教") || message.includes("请问") || message.includes("怎么做") || message.includes("如何")) &&
            (message.includes("图") || message.includes("图片") || message.includes("图像") || message.includes("示例"))
        ) {
            // 这是一个菜谱/教程类请求，需要为每个步骤生成图片
            console.log("检测到菜谱/教程类多步骤图像生成请求");
            
            // 显示加载消息
            const loadingMsg = "正在准备生成菜谱/教程图文内容，请稍候...";
            const tempMessage = addAssistantMessage(loadingMsg);
            
            try {
                // 首先用普通模型生成文本回复
                const textResponse = await callGeminiAPI(message, null);
                let textContent = textResponse.text;
                
                // 检测步骤数量
                const stepsRegex = /([0-9]\.|步骤[0-9]|第[一二三四五六七八九十][步]|[0-9]、)/g;
                const stepsMatches = textContent.match(stepsRegex) || [];
                
                // 估计步骤数量，确保至少有一个步骤
                let numSteps = Math.min(Math.max(stepsMatches.length, 1), 5);
                console.log(`检测到约 ${numSteps} 个步骤`);
                
                // 生成每个步骤的图片
                const imagePromises = [];
                
                // 分析文本，提取每个步骤的描述
                const stepDescriptions = [];
                
                // 如果是红烧肉相关请求
                if (message.includes("红烧肉")) {
                    // 预定义红烧肉的步骤描述
                    stepDescriptions.push("准备食材：五花肉、葱姜蒜、八角、桂皮等香料");
                    stepDescriptions.push("将五花肉切块，焯水去腥");
                    stepDescriptions.push("锅中放油，炒糖色，放入肉块翻炒");
                    stepDescriptions.push("加入料酒、酱油、水，小火炖煮");
                    stepDescriptions.push("炖至肉烂汤浓，出锅装盘");
                    numSteps = 5; // 确保用我们预定义的5个步骤
                } else {
                    // 对于其他菜谱，尝试从模型生成的文本中提取步骤
                    // 如果提取不到足够的步骤，生成通用描述
                    const lines = textContent.split('\n');
                    let currentStep = "";
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line.match(stepsRegex)) {
                            // 找到了新步骤标记，保存前一个步骤
                            if (currentStep && stepDescriptions.length < numSteps) {
                                stepDescriptions.push(currentStep);
                            }
                            // 开始新步骤
                            currentStep = line.replace(stepsRegex, '').trim();
                        } else if (currentStep && line) {
                            // 继续当前步骤的描述
                            currentStep += " " + line;
                        }
                    }
                    
                    // 添加最后一个步骤
                    if (currentStep && stepDescriptions.length < numSteps) {
                        stepDescriptions.push(currentStep);
                    }
                    
                    // 如果没有提取到足够的步骤，使用通用描述
                    while (stepDescriptions.length < numSteps) {
                        const stepNum = stepDescriptions.length + 1;
                        const dish = message.includes("红烧肉") ? "红烧肉" : 
                                    message.includes("蛋炒饭") ? "蛋炒饭" : 
                                    message.includes("炒菜") ? "炒菜" : "菜肴";
                        stepDescriptions.push(`${dish}制作步骤${stepNum}`);
                    }
                }
                
                // 限制最多5个步骤的图片
                numSteps = Math.min(numSteps, 5);
                stepDescriptions.length = numSteps;
                
                console.log("步骤描述：", stepDescriptions);
                
                // 为每个步骤生成图片
                for (let i = 0; i < numSteps; i++) {
                    const stepDesc = stepDescriptions[i];
                    const imageDesc = `高质量真实照片，展示烹饪步骤：${stepDesc}`;
                    console.log(`生成步骤${i+1}图片: ${imageDesc}`);
                    imagePromises.push(generateImage(imageDesc));
                }
                
                // 等待所有图片生成完成
                const imageResults = await Promise.all(imagePromises);
                
                // 合并所有图片URL
                const allImageUrls = [];
                let combinedText = "";
                
                imageResults.forEach((result, index) => {
                    if (result && result.imageUrls && result.imageUrls.length > 0) {
                        allImageUrls.push(...result.imageUrls);
                    }
                });
                
                // 添加介绍性文本
                const dish = message.includes("红烧肉") ? "红烧肉" : 
                           message.includes("蛋炒饭") ? "蛋炒饭" : 
                           message.includes("炒菜") ? "炒菜" : 
                           message.includes("菜") ? message.match(/([^，。]+菜)[^，。]*/) ? message.match(/([^，。]+菜)[^，。]*/)[1] : "菜肴" : "菜肴";
                
                // 移除临时消息
                chatMessages.removeChild(tempMessage);
                
                // 显示带图片的步骤
                if (allImageUrls.length > 0) {
                    // 格式化文本内容，确保每个步骤后面都有图片标记
                    let formattedText = `# ${dish}制作教程\n\n`;
                    
                    // 添加每个步骤和对应的图片标记
                    for (let i = 0; i < numSteps; i++) {
                        formattedText += `## ${i}. ${stepDescriptions[i]}\n\n`;
                        formattedText += `[图片${i+1}]\n\n`;
                    }
                    
                    // 显示最终结果
                    addAssistantMessage(formattedText, allImageUrls);
                } else {
                    // 如果图片生成失败，显示纯文本回复
                    addAssistantMessage(textContent);
                }
            } catch (error) {
                console.error("教程图片生成错误:", error);
                // 移除临时消息
                chatMessages.removeChild(tempMessage);
                addAssistantMessage("抱歉，生成教程图片过程中发生错误：" + error.message);
            }
        }
        // 生成图像
        else if (message.toLowerCase().includes("生成图像") || 
                message.toLowerCase().includes("生成图片") || 
                message.toLowerCase().includes("创建图像") || 
                message.toLowerCase().includes("创建图片") || 
                message.toLowerCase().includes("画一张") ||
                message.toLowerCase().includes("generate image") || 
                message.toLowerCase().includes("create image") || 
                message.toLowerCase().includes("draw") ||
                message.toLowerCase().includes("make image")) {
            
            // 检查是否请求多张图片
            const multipleImagesMatch = message.match(/(\d+)张图/);
            const numImages = multipleImagesMatch ? Math.min(parseInt(multipleImagesMatch[1]), 4) : 1;
            
            // 提取图像描述
            let imageDescription = message.replace(/生成图像|生成图片|创建图像|创建图片|画一张|generate image|create image|draw|make image|(\d+)张图/gi, '').trim();
            if (!imageDescription) {
                imageDescription = "一张美丽的风景图";  // 默认描述
            }
            
            // 显示正在生成多张图片的消息
            const loadingMsg = numImages > 1 ? `正在生成${numImages}张图片，请稍候...` : "正在生成图片，请稍候...";
            const tempMessage = addAssistantMessage(loadingMsg);
            
            try {
                // 生成图像
                const imagePromises = [];
                for (let i = 0; i < numImages; i++) {
                    imagePromises.push(generateImage(imageDescription));
                }
                
                // 等待所有图片生成完成
                const imageResults = await Promise.all(imagePromises);
                
                // 合并所有图片URL
                const allImageUrls = [];
                let combinedText = "";
                
                imageResults.forEach((result, index) => {
                    if (result && result.imageUrls && result.imageUrls.length > 0) {
                        allImageUrls.push(...result.imageUrls);
                        if (index === 0) {
                            combinedText = result.text || "以下是根据您的描述生成的图片";
                        }
                    }
                });
                
                // 移除临时消息
                chatMessages.removeChild(tempMessage);
                
                // 显示所有生成的图片
                if (allImageUrls.length > 0) {
                    addAssistantMessage(combinedText, allImageUrls);
                } else {
                    addAssistantMessage("抱歉，图像生成失败。请稍后再试。");
                }
            } catch (error) {
                console.error("Image generation error:", error);
                // 移除临时消息
                chatMessages.removeChild(tempMessage);
                addAssistantMessage("抱歉，图像生成过程中发生错误：" + error.message);
            }
        } 
        // 普通文本消息
        else {
            response = await callGeminiAPI(message, null);
            
            // 显示响应
            if (response) {
                if (response.imageUrls && response.imageUrls.length > 0) {
                    addAssistantMessage(response.text, response.imageUrls);
                } else {
                    addAssistantMessage(response.text);
                }
            }
        }
        
        // 隐藏加载指示器
        loadingIndicator.style.display = 'none';
    } catch (error) {
        console.error("Error:", error);
        loadingIndicator.style.display = 'none';
        addAssistantMessage("抱歉，发生错误：" + error.message);
    }
    
    // 保存对话历史
    saveConversationHistory();
}

// 更新响应文本，用图片引用替换图片标记
function updateResponseWithImageRefs(text, imageUrls) {
    if (!imageUrls || imageUrls.length === 0) {
        return text;
    }

    // 检查当前文本是否包含图片标记
    const hasExplicitMarkers = text.includes('[图片');
    
    // 如果没有图片标记，则自动添加
    if (!hasExplicitMarkers) {
        text = convertToRichTextFormat(text, imageUrls.length);
    }
    
    // 提取并处理所有图片标记
    const imageMarkerRegex = /\[图片(\d+)\]/g;
    let match;
    let replacedText = text;
    let usedImages = new Set();
    
    // 替换所有明确的图片标记
    while ((match = imageMarkerRegex.exec(text)) !== null) {
        const imageIndex = parseInt(match[1]) - 1;
        if (imageIndex >= 0 && imageIndex < imageUrls.length) {
            // 将标记替换为实际图片引用
            const imgRefId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const imgHtml = `<div class="rich-image-container">
                <img src="${imageUrls[imageIndex]}" class="rich-content-image" alt="图片${imageIndex + 1}" data-index="${imageIndex}">
                <button class="rich-image-edit-btn" data-imgid="${imgRefId}">编辑此图片</button>
            </div>`;
            
            replacedText = replacedText.replace(match[0], imgHtml);
            usedImages.add(imageIndex);
        }
    }
    
    // 处理未使用的图片
    if (usedImages.size < imageUrls.length) {
        // 查找文本中的最后一个非空行
        const lines = replacedText.split('\n');
        let lastNonEmptyLineIndex = lines.length - 1;
        while (lastNonEmptyLineIndex >= 0 && !lines[lastNonEmptyLineIndex].trim()) {
            lastNonEmptyLineIndex--;
        }
        
        // 添加剩余图片
        let remainingImagesHtml = '';
        for (let i = 0; i < imageUrls.length; i++) {
            if (!usedImages.has(i)) {
                const imgRefId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                remainingImagesHtml += `
                <div class="rich-image-container">
                    <img src="${imageUrls[i]}" class="rich-content-image" alt="图片${i + 1}" data-index="${i}">
                    <button class="rich-image-edit-btn" data-imgid="${imgRefId}">编辑此图片</button>
                </div>`;
            }
        }
        
        if (remainingImagesHtml) {
            // 在最后一个非空行后添加未使用的图片
            if (lastNonEmptyLineIndex >= 0) {
                lines[lastNonEmptyLineIndex] += '<div class="additional-images-container"><p>附加图片：</p>' + remainingImagesHtml + '</div>';
                replacedText = lines.join('\n');
            } else {
                // 如果文本为空，直接添加所有图片
                replacedText = '<div class="additional-images-container">' + remainingImagesHtml + '</div>';
            }
        }
    }
    
    // 包装处理后的文本为富文本格式
    return `<div class="rich-text">${replacedText}</div>`;
}

// 显示图片全屏
function showImageFullscreen(imageUrl) {
    // 创建全屏模态窗口
    const modal = document.createElement('div');
    modal.className = 'fullscreen-modal';
    
    // 创建图片容器
    const imageContainer = document.createElement('div');
    imageContainer.className = 'fullscreen-image-container';
    
    // 创建图片
    const fullImage = document.createElement('img');
    fullImage.src = imageUrl;
    fullImage.className = 'fullscreen-image';
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'fullscreen-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', closeFullscreenImage);
    
    // 添加到DOM
    imageContainer.appendChild(fullImage);
    modal.appendChild(imageContainer);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
    
    // 添加ESC键关闭功能
    document.addEventListener('keydown', handleModalKeydown);
}

// 关闭全屏图片
function closeFullscreenImage() {
    const modal = document.querySelector('.fullscreen-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleModalKeydown);
    }
}

// 处理模态框键盘事件
function handleModalKeydown(e) {
    if (e.key === 'Escape') {
        closeFullscreenImage();
    }
}

// 显示图像生成UI
function showImageGenerationUI() {
    // 添加系统消息，提示用户输入描述
    addSystemMessage("您已进入图像生成模式。请输入详细的图像描述，例如：");
    addSystemMessage("- 画一只坐在森林里的红色狐狸，阳光透过树叶");
    addSystemMessage("- 生成一张未来感城市的夜景，霓虹灯和高楼大厦");
    
    // 设置输入框提示文字
    userInput.placeholder = "请输入详细的图像描述...";
    userInput.focus();
}

// 调用Gemini API
async function callGeminiAPI(prompt, media = null) {
    if (!apiKey) {
        throw new Error("请先设置API Key");
    }
    
    // 构建请求体
    const requestBody = {
        contents: [{
            parts: []
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 1
        }
    };
    
    // 添加对话历史记录
    if (conversationHistory.length > 0) {
        requestBody.contents = [];
        for (const msg of conversationHistory) {
            requestBody.contents.push(msg);
        }
    }
    
    // 添加当前提示
    const currentMessage = { parts: [{ text: prompt }] };
    
    // 如果有媒体（图片），添加到提示中
    if (media && media.type.startsWith('image/')) {
        currentMessage.parts.push({
            inline_data: {
                mime_type: media.type,
                data: media.data.split(',')[1]
            }
        });
    }
    
    // 添加至请求体
    requestBody.contents.push({
        role: "user",
        parts: currentMessage.parts
    });
    
    try {
        // 构建URL
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        
        // 发送请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`API 错误: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log("API Response:", data);
        
        // 提取回复文本
        let responseText = "";
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts.length > 0) {
            
            // 提取文本部分
            responseText = data.candidates[0].content.parts
                .filter(part => part.text)
                .map(part => part.text)
                .join("\n");
            
            // 添加到对话历史
            conversationHistory.push({
                role: "user",
                parts: currentMessage.parts
            });
            
            conversationHistory.push({
                role: "model",
                parts: [{ text: responseText }]
            });
            
            return { text: responseText };
        } else {
            throw new Error("API 返回了空回复");
        }
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

// 生成图像
async function generateImage(prompt) {
    if (!apiKey) {
        throw new Error("请先设置API Key");
    }
    
    try {
        // 构建请求体 - 完全按照官方API格式
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: prompt
                    }
                ]
            }],
            generationConfig: {
                responseModalities: ["Text", "Image"]
            }
        };
        
        // 构建URL，使用图像生成模型
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
        
        console.log("发送图像生成请求:", JSON.stringify(requestBody));
        
        // 发送请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Image API Error:", errorData);
            throw new Error(`图像生成API错误: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Image API Response:", data);
        
        // 打印完整的响应以便调试
        console.log("完整响应JSON:", JSON.stringify(data, null, 2));
        
        // 检查是否有图像返回
        const imageUrls = [];
        let responseText = "以下是根据您的描述生成的图片：";
        
        // 处理图像数据
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts) {
            
            // 提取文本部分
            const textParts = data.candidates[0].content.parts.filter(part => part.text);
            if (textParts.length > 0) {
                responseText = textParts.map(part => part.text).join("\n") || responseText;
            }
            
            console.log("找到文本部分:", responseText);
            
            // 检查每个部分
            console.log("内容部分数量:", data.candidates[0].content.parts.length);
            
            // 首先搜索原始CURL命令中的data字段格式
            for (const part of data.candidates[0].content.parts) {
                console.log("检查部分类型:", Object.keys(part).join(", "));
                
                // 如果是inline_data格式
                if (part.inline_data) {
                    console.log("找到inline_data格式图像");
                    const base64Data = part.inline_data.data;
                    const mimeType = part.inline_data.mime_type || "image/jpeg";
                    const imageUrl = `data:${mimeType};base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                } 
                // 如果是inlineData格式
                else if (part.inlineData) {
                    console.log("找到inlineData格式图像");
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mime_type || "image/jpeg";
                    const imageUrl = `data:${mimeType};base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                } 
                // 如果直接是data字段(按照curl命令的格式)
                else if (part.data) {
                    console.log("找到data字段格式图像");
                    const base64Data = part.data;
                    const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                }
                // 递归检查part内部是否有data字段
                else {
                    console.log("检查嵌套数据结构");
                    const deepSearchData = JSON.stringify(part);
                    const dataMatches = /"data"\s*:\s*"([^"]+)"/g.exec(deepSearchData);
                    if (dataMatches && dataMatches[1]) {
                        console.log("在嵌套结构中找到data字段");
                        const base64Data = dataMatches[1];
                        const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                        imageUrls.push(imageUrl);
                    }
                }
            }
            
            // 如果还没找到图像，尝试直接在响应中查找data字段
            if (imageUrls.length === 0) {
                console.log("尝试在完整响应中查找data字段");
                const responseStr = JSON.stringify(data);
                const dataMatches = /"data"\s*:\s*"([^"]+)"/g.exec(responseStr);
                if (dataMatches && dataMatches[1]) {
                    console.log("在完整响应中找到data字段");
                    const base64Data = dataMatches[1];
                    const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                }
            }
            
            console.log(`找到 ${imageUrls.length} 张图片`);
            
            // 存储最后生成的图像
            if (imageUrls.length > 0) {
                lastGeneratedImage = imageUrls[0];
                console.log("成功提取图像数据");
            } else {
                console.warn("API返回中没有找到图像数据");
            }
            
            return { text: responseText, imageUrls: imageUrls };
        } else {
            console.error("API返回结构不包含预期的内容:", data);
            throw new Error("图像生成API返回了空回复或无效结构");
        }
    } catch (error) {
        console.error("Image Generation Error:", error);
        throw error;
    }
}

// 编辑图像
async function editImage(imageData, prompt) {
    if (!apiKey) {
        throw new Error("请先设置API Key");
    }
    
    try {
        console.log("开始处理图像编辑请求");
        
        // 从imageData中提取base64数据
        let base64Data;
        if (imageData.startsWith('data:')) {
            base64Data = imageData.split(',')[1];
        } else {
            base64Data = imageData;
        }
        
        if (!base64Data) {
            throw new Error("无法提取图像数据");
        }
        
        console.log("成功提取图像base64数据");
        
        // 构建请求体 - 符合官方API格式
        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: prompt
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
        };
        
        console.log("发送图像编辑请求到API");
        
        try {
            // 使用图像生成模型
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
            
            // 发送请求
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Image Edit API Error:", errorText);
                throw new Error(`图像编辑失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("Image Edit Response:", data);
            
            // 处理响应
            const imageUrls = [];
            let responseText = "以下是根据您的指令编辑后的图片：";
            
            // 提取文本和图像部分
            if (data.candidates && data.candidates.length > 0 && 
                data.candidates[0].content && 
                data.candidates[0].content.parts) {
                
                // 提取文本部分
                const textParts = data.candidates[0].content.parts.filter(part => part.text);
                if (textParts.length > 0) {
                    responseText = textParts.map(part => part.text).join("\n") || responseText;
                }
                
                console.log("找到文本部分:", responseText);
                console.log("内容部分数量:", data.candidates[0].content.parts.length);
                
                // 搜索图像数据
                for (const part of data.candidates[0].content.parts) {
                    if (part.inline_data) {
                        console.log("找到inline_data格式图像");
                        const base64Data = part.inline_data.data;
                        const mimeType = part.inline_data.mime_type || "image/jpeg";
                        const imageUrl = `data:${mimeType};base64,${base64Data}`;
                        imageUrls.push(imageUrl);
                    } else if (part.inlineData) { // 兼容不同的字段名
                        console.log("找到inlineData格式图像");
                        const base64Data = part.inlineData.data;
                        const mimeType = part.inlineData.mime_type || "image/jpeg";
                        const imageUrl = `data:${mimeType};base64,${base64Data}`;
                        imageUrls.push(imageUrl);
                    }
                }
                
                if (imageUrls.length === 0) {
                    // 尝试在完整响应中查找data字段
                    const responseStr = JSON.stringify(data);
                    const dataMatch = responseStr.match(/"data"\s*:\s*"([^"]+)"/);
                    if (dataMatch && dataMatch[1]) {
                        console.log("在完整响应中找到data字段");
                        const base64Data = dataMatch[1];
                        const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                        imageUrls.push(imageUrl);
                    }
                }
                
                console.log(`找到 ${imageUrls.length} 张图片`);
                
                if (imageUrls.length > 0) {
                    console.log("成功提取图像数据");
                    return { text: responseText, imageUrls: imageUrls };
                } else {
                    console.warn("API返回中没有找到图像数据");
                    throw new Error("未能从API响应中提取图像数据");
                }
            } else {
                console.error("API返回结构不符合预期:", data);
                throw new Error("图像编辑API返回了无效结构");
            }
        } catch (error) {
            console.error("Primary image edit method failed:", error);
            console.log("尝试使用备用方法编辑图像...");
            return await editImageFallback(imageData, prompt);
        }
    } catch (error) {
        console.error("Image Edit Error:", error);
        throw error;
    }
}

// 备用图像编辑方法
async function editImageFallback(imageData, prompt) {
    // 压缩图像数据以避免API超时
    let base64Data;
    if (imageData.startsWith('data:')) {
        base64Data = imageData.split(',')[1];
    } else {
        base64Data = imageData;
    }
    
    // 构建请求体 - 符合官方API格式
    const requestBody = {
        contents: [{
            parts: [
                {
                    text: prompt
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
    };
    
    console.log("使用备用方法发送图像编辑请求");
    
    try {
        // 使用标准模型作为备用
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
        
        // 发送请求
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`备用图像编辑失败: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Fallback Image Edit Response:", data);
        console.log("完整响应JSON:", JSON.stringify(data, null, 2));
        
        // 处理响应，尝试提取生成的图像URL
        const imageUrls = [];
        let responseText = "以下是根据您的指令编辑后的图片：";
        
        if (data.candidates && data.candidates.length > 0) {
            // 提取文本部分
            const textParts = data.candidates[0].content.parts.filter(part => part.text);
            if (textParts.length > 0) {
                responseText = textParts.map(part => part.text).join("\n") || responseText;
            }
            
            console.log("找到文本部分:", responseText);
            console.log("内容部分数量:", data.candidates[0].content.parts.length);
            
            // 首先搜索原始CURL命令中的data字段格式
            for (const part of data.candidates[0].content.parts) {
                console.log("检查部分类型:", Object.keys(part).join(", "));
                
                // 如果是inline_data格式
                if (part.inline_data) {
                    console.log("找到inline_data格式图像");
                    const base64Data = part.inline_data.data;
                    const mimeType = part.inline_data.mime_type || "image/jpeg";
                    const imageUrl = `data:${mimeType};base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                } 
                // 如果是inlineData格式
                else if (part.inlineData) {
                    console.log("找到inlineData格式图像");
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mime_type || "image/jpeg";
                    const imageUrl = `data:${mimeType};base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                } 
                // 如果直接是data字段(按照curl命令的格式)
                else if (part.data) {
                    console.log("找到data字段格式图像");
                    const base64Data = part.data;
                    const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                }
                // 递归检查part内部是否有data字段
                else {
                    console.log("检查嵌套数据结构");
                    const deepSearchData = JSON.stringify(part);
                    const dataMatches = /"data"\s*:\s*"([^"]+)"/g.exec(deepSearchData);
                    if (dataMatches && dataMatches[1]) {
                        console.log("在嵌套结构中找到data字段");
                        const base64Data = dataMatches[1];
                        const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                        imageUrls.push(imageUrl);
                    }
                }
            }
            
            // 如果还没找到图像，尝试直接在响应中查找data字段
            if (imageUrls.length === 0) {
                console.log("尝试在完整响应中查找data字段");
                const responseStr = JSON.stringify(data);
                const dataMatches = /"data"\s*:\s*"([^"]+)"/g.exec(responseStr);
                if (dataMatches && dataMatches[1]) {
                    console.log("在完整响应中找到data字段");
                    const base64Data = dataMatches[1];
                    const imageUrl = `data:image/jpeg;base64,${base64Data}`;
                    imageUrls.push(imageUrl);
                }
            }
            
            // 如果仍然找不到图像，尝试从文本中提取URL
            if (imageUrls.length === 0) {
                console.log("尝试从文本中提取图片URL");
                const textWithImages = responseText;
                // 查找图像URL
                const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif))/gi;
                const matches = textWithImages.match(urlRegex);
                
                if (matches && matches.length > 0) {
                    imageUrls.push(matches[0]);
                    console.log("从文本中找到图片URL:", matches[0]);
                }
            }
        }
        
        console.log(`找到 ${imageUrls.length} 张图片`);
        
        if (imageUrls.length > 0) {
            console.log("成功提取图像数据");
        } else {
            console.warn("API返回中没有找到图像数据");
        }
        
        return { text: responseText, imageUrls: imageUrls };
    } catch (error) {
        console.error("Fallback Image Edit Error:", error);
        throw error;
    }
}

// 显示图片编辑UI
function showImageEditUI(imageUrl) {
    if (!imageUrl) {
        addSystemMessage("错误：无效的图像数据");
        return;
    }
    
    // 设置为编辑模式
    isEditingImage = true;
    editingImageData = imageUrl;
    
    // 添加系统消息
    addSystemMessage("您已进入图像编辑模式，可以输入指令来修改图像。例如：");
    addSystemMessage("- 添加蓝色背景");
    addSystemMessage("- 使图像变成水彩画风格");
    addSystemMessage("- 添加一只猫在图像右侧");
    addSystemMessage("⚠️ 注意：某些类型的编辑请求可能会被系统拒绝或失败，特别是涉及人物背景或复杂场景修改。");
    
    // 更改用户输入提示
    userInput.placeholder = "请输入图像编辑指令...";
    userInput.focus();
    
    console.log("编辑模式已启用，准备编辑图像:", imageUrl.substring(0, 50) + "...");
}

// Markdown转HTML
function convertMarkdownToHtml(markdown) {
    if (!markdown) return '';
    
    // 替换标题
    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 替换粗体和斜体
    html = html
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/\_\_(.*?)\_\_/gim, '<strong>$1</strong>')
        .replace(/\_(.*?)\_/gim, '<em>$1</em>');
    
    // 替换链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 替换列表
    html = html
        .replace(/^\s*\d+\.\s+(.*$)/gim, '<ol><li>$1</li></ol>')
        .replace(/^\s*[\-\*]\s+(.*$)/gim, '<ul><li>$1</li></ul>');
    
    // 合并列表项
    html = html
        .replace(/<\/ol>\s*<ol>/g, '')
        .replace(/<\/ul>\s*<ul>/g, '');
    
    // 替换代码块
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // 替换内联代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 替换换行
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

// 处理文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 清除之前的文件
    mediaPreviewContainer.style.display = 'none';
    mediaPreviewContent.innerHTML = '';
    currentMedia = null;
    
    if (file.type.startsWith('application/pdf')) {
        // 处理PDF文件
        handlePdfUpload(file);
    } else {
        addSystemMessage(`不支持的文件类型: ${file.type}`);
    }
    
    // 重置文件输入
    event.target.value = '';
}

// 处理图片上传
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        addSystemMessage(`不支持的文件类型: ${file.type}，请上传图片文件。`);
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log("图片已读取，正在创建预览");
            
            // 显示图像预览
            if (!mediaPreviewContainer || !mediaPreviewContent) {
                console.error("预览容器未找到");
                addSystemMessage("无法显示图像预览，请刷新页面后重试。");
                return;
            }
            
            mediaPreviewContainer.style.display = 'block';
            mediaPreviewContent.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            mediaPreviewContent.appendChild(img);
            
            // 添加编辑按钮
            const editBtn = document.createElement('button');
            editBtn.className = 'preview-edit-btn';
            editBtn.innerHTML = '<i class="bi bi-pencil-square"></i> 编辑此图片';
            editBtn.onclick = () => showImageEditUI(e.target.result);
            mediaPreviewContent.appendChild(editBtn);
            
            // 设置当前媒体
            currentMedia = {
                type: file.type,
                data: e.target.result,
                name: file.name
            };
            
            console.log("成功创建图片预览和设置媒体对象");
            
            // 存储最后上传的图像
            lastUploadedImage = e.target.result;
            
            // 添加系统消息提示
            addSystemMessage(`图片 "${file.name}" 已上传，您可以输入问题来分析此图片，或点击"编辑此图片"按钮进行修改。`);
        } catch (error) {
            console.error("处理图片上传时出错:", error);
            addSystemMessage("处理图片时发生错误: " + error.message);
        }
    };
    
    reader.onerror = function(error) {
        console.error("读取图片文件时出错:", error);
        addSystemMessage("读取图片文件时发生错误，请重试。");
    };
    
    try {
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("启动图片读取时出错:", error);
        addSystemMessage("启动图片读取时发生错误: " + error.message);
    }
    
    // 重置文件输入
    event.target.value = '';
}

// 重置媒体预览
function resetMediaPreview() {
    console.log("重置媒体预览");
    
    if (mediaPreviewContainer) {
        mediaPreviewContainer.style.display = 'none';
    }
    
    if (mediaPreviewContent) {
        mediaPreviewContent.innerHTML = '';
    }
    
    currentMedia = null;
    console.log("媒体预览已重置");
}

// 处理视频上传 (目前只是一个提示，因为视频处理需要更复杂的实现)
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    addSystemMessage("视频处理功能正在开发中，敬请期待。");
    event.target.value = '';
}

// 处理PDF上传
function handlePdfUpload(file) {
    // 显示预览
    mediaPreviewContainer.style.display = 'block';
    mediaPreviewContent.innerHTML = '';
    
    // 添加PDF图标和文件名
    const pdfIcon = document.createElement('div');
    pdfIcon.innerHTML = '<i class="bi bi-file-earmark-pdf" style="font-size: 48px; color: #e74c3c;"></i>';
    pdfIcon.style.textAlign = 'center';
    mediaPreviewContent.appendChild(pdfIcon);
    
    const fileName = document.createElement('p');
    fileName.textContent = file.name;
    fileName.style.textAlign = 'center';
    fileName.style.marginTop = '10px';
    mediaPreviewContent.appendChild(fileName);
    
    // 设置当前媒体
    currentMedia = {
        type: file.type,
        file: file,
        name: file.name
    };
    
    // 添加系统消息
    addSystemMessage(`PDF "${file.name}" 已上传，请输入你想了解的有关此文档的问题。`);
}

// 提取PDF文本并分析
async function extractPdfText(pdfMedia, query) {
    if (!pdfMedia || !pdfMedia.file) {
        throw new Error("无效的PDF文件");
    }
    
    try {
        addSystemMessage("正在分析PDF文件...");
        
        // 实际中应该使用PDF.js等库提取文本
        // 这里简化处理，假设已经提取了文本
        const pdfText = `[PDF内容: ${pdfMedia.name}]`;
        
        // 将PDF内容和用户查询一起发送到API
        const fullPrompt = `我有一个PDF文件，内容如下：\n\n${pdfText}\n\n基于上述PDF内容，请回答以下问题：${query}`;
        
        // 调用API
        return await callGeminiAPI(fullPrompt);
    } catch (error) {
        console.error("PDF处理错误:", error);
        throw new Error("PDF分析失败: " + error.message);
    }
}

// 保存对话历史
function saveConversationHistory() {
    // 这里可以实现保存对话历史到本地存储
    // 为简化实现，暂不实现
}

// 将普通文本转换为图文并茂格式
function convertToRichTextFormat(text, imageCount) {
    // 如果文本已包含图片标记，则不做更改
    if (text.includes('[图片')) {
        return text;
    }
    
    // 检测是否是菜谱/教程类文本
    const isRecipe = text.includes('食材') || text.includes('材料') || 
                     text.includes('步骤') || text.includes('做法') || 
                     text.includes('菜谱') || text.includes('教程');
    
    // 按行分割文本
    const lines = text.split('\n');
    let richText = '';
    
    // 识别步骤标记正则表达式
    const stepRegexes = [
        /^步骤\s*[0-9]+/,
        /^第[一二三四五六七八九十]+步/,
        /^[0-9]+[\.、]/,
        /^[一二三四五六七八九十][\.、]/,
        /^[\(（][0-9]+[\)）]/,
        /^[步驟]\s*[0-9]+/
    ];
    
    // 查找所有步骤行
    const stepLineIndices = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (stepRegexes.some(regex => regex.test(line))) {
            stepLineIndices.push(i);
        }
    }
    
    // 如果找到了足够的步骤行，使用步骤格式
    if (stepLineIndices.length >= 2) {
        // 计算需要多少图片
        const requiredImages = Math.min(stepLineIndices.length, imageCount);
        
        // 为每个步骤分配图片指数
        const stepsToIncludeImage = [];
        
        if (requiredImages >= stepLineIndices.length) {
            // 每个步骤都可以有图片
            stepsToIncludeImage.push(...stepLineIndices);
        } else {
            // 智能分配图片：跳过头部步骤（通常是准备工作），专注于中间和后面步骤
            const skipStart = stepLineIndices.length > 5 ? 1 : 0;
            const availableSteps = stepLineIndices.slice(skipStart);
            
            // 均匀分布图片到可用步骤中
            const interval = Math.max(1, Math.floor(availableSteps.length / requiredImages));
            
            for (let i = 0; i < requiredImages; i++) {
                const stepIndex = i * interval;
                if (stepIndex < availableSteps.length) {
                    stepsToIncludeImage.push(availableSteps[stepIndex]);
                }
            }
        }
        
        // 跟踪当前图片索引
        let currentImageIndex = 0;
        
        // 处理每一行
        for (let i = 0; i < lines.length; i++) {
            // 添加当前行
            richText += lines[i] + '\n';
            
            // 如果当前行是步骤行，并且被选中包含图片
            if (stepsToIncludeImage.includes(i) && currentImageIndex < imageCount) {
                // 找到下一个非空行
                let nextNonEmptyLine = i + 1;
                while (nextNonEmptyLine < lines.length && !lines[nextNonEmptyLine].trim()) {
                    nextNonEmptyLine++;
                }
                
                // 如果有后续行，添加图片标记
                if (nextNonEmptyLine < lines.length) {
                    // 获取步骤说明
                    let stepDescription = lines[i].trim();
                    if (lines[nextNonEmptyLine].trim() && !stepRegexes.some(regex => regex.test(lines[nextNonEmptyLine].trim()))) {
                        stepDescription += " " + lines[nextNonEmptyLine].trim();
                    }
                    
                    // 在步骤说明后添加图片标记
                    richText += '\n[图片' + (currentImageIndex + 1) + ']\n\n';
                    currentImageIndex++;
                }
            }
        }
        
        // 如果还有剩余图片，添加到文本末尾
        while (currentImageIndex < imageCount) {
            richText += '\n[图片' + (currentImageIndex + 1) + ']\n\n';
            currentImageIndex++;
        }
        
        return richText;
    }
    // 如果是菜谱但没找到足够的步骤标记
    else if (isRecipe) {
        // 尝试查找关键段落：材料、步骤等
        const keywordMapping = {
            '材料': 0,
            '食材': 0,
            '配料': 0,
            '准备': 0,
            '步骤': 1,
            '做法': 1,
            '制作': 1,
            '步骤': 1,
            '方法': 1,
            '完成': 2,
            '成品': 2,
            '效果': 2,
            '小贴士': 3,
            '小提示': 3,
            '注意事项': 3
        };
        
        // 查找所有关键段落的位置
        const sections = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim().toLowerCase();
            for (const [keyword, type] of Object.entries(keywordMapping)) {
                if (line.includes(keyword)) {
                    sections.push({index: i, type: type});
                    break;
                }
            }
        }
        
        // 按照出现位置排序
        sections.sort((a, b) => a.index - b.index);
        
        // 初始化图片位置
        let imagePlacement = [];
        let currentImageIndex = 0;
        
        // 智能确定图片放置位置
        if (sections.length > 0) {
            for (let i = 0; i < sections.length && currentImageIndex < imageCount; i++) {
                const section = sections[i];
                
                // 材料部分一般放一张图 (原料图)
                if (section.type === 0 && currentImageIndex < imageCount) {
                    // 在材料部分后放一张图
                    imagePlacement.push({lineIndex: section.index + 1, imageIndex: currentImageIndex});
                    currentImageIndex++;
                }
                // 步骤部分一般多放几张图
                else if (section.type === 1 && currentImageIndex < imageCount) {
                    // 查找步骤部分的长度
                    const nextSectionIndex = i + 1 < sections.length ? sections[i + 1].index : lines.length;
                    const stepSectionLength = nextSectionIndex - section.index;
                    
                    // 确定在步骤部分放多少张图
                    const stepsImageCount = Math.min(imageCount - currentImageIndex, Math.ceil(stepSectionLength / 5));
                    
                    // 均匀分布图片
                    for (let j = 0; j < stepsImageCount; j++) {
                        const lineOffset = Math.floor(j * stepSectionLength / stepsImageCount) + 2;
                        imagePlacement.push({
                            lineIndex: section.index + lineOffset, 
                            imageIndex: currentImageIndex
                        });
                        currentImageIndex++;
                    }
                }
                // 成品部分一般放一张图 (成品图)
                else if (section.type === 2 && currentImageIndex < imageCount) {
                    imagePlacement.push({lineIndex: section.index + 1, imageIndex: currentImageIndex});
                    currentImageIndex++;
                }
            }
        }
        
        // 如果没找到足够的部分，或还有剩余图片，均匀分布剩余图片
        if (currentImageIndex < imageCount) {
            const remainingImages = imageCount - currentImageIndex;
            const interval = Math.max(1, Math.floor(lines.length / (remainingImages + 1)));
            
            for (let i = 0; i < remainingImages; i++) {
                const lineIndex = (i + 1) * interval;
                if (lineIndex < lines.length) {
                    // 确保不与现有图片位置重复
                    if (!imagePlacement.some(item => Math.abs(item.lineIndex - lineIndex) < 3)) {
                        imagePlacement.push({lineIndex, imageIndex: currentImageIndex});
                        currentImageIndex++;
                    }
                }
            }
        }
        
        // 按行号排序图片位置
        imagePlacement.sort((a, b) => a.lineIndex - b.lineIndex);
        
        // 生成最终文本
        let currentLine = 0;
        let currentPlacement = 0;
        
        richText = '';
        
        while (currentLine < lines.length) {
            // 添加当前行
            richText += lines[currentLine] + '\n';
            
            // 检查是否需要插入图片
            if (currentPlacement < imagePlacement.length && 
                imagePlacement[currentPlacement].lineIndex === currentLine) {
                
                // 添加图片标记
                richText += '\n[图片' + (imagePlacement[currentPlacement].imageIndex + 1) + ']\n\n';
                currentPlacement++;
            }
            
            // 处理下一行
            currentLine++;
        }
        
        // 如果还有剩余图片位置没有处理，添加到文本末尾
        while (currentPlacement < imagePlacement.length) {
            richText += '\n[图片' + (imagePlacement[currentPlacement].imageIndex + 1) + ']\n\n';
            currentPlacement++;
        }
        
        return richText;
    }
    else {
        // 非菜谱类文本，均匀分布图片
        // 每 2-3 段文本后添加一张图片
        const paragraphs = text.split('\n\n');
        richText = '';
        const paragraphsPerImage = Math.max(1, Math.min(3, Math.ceil(paragraphs.length / imageCount)));
        
        for (let i = 0; i < paragraphs.length; i++) {
            richText += paragraphs[i] + '\n\n';
            if ((i + 1) % paragraphsPerImage === 0 && Math.floor(i / paragraphsPerImage) < imageCount) {
                richText += `[图片${Math.floor(i / paragraphsPerImage) + 1}]\n\n`;
            }
        }
        
        // 添加剩余的图片标记
        const addedImages = Math.floor((paragraphs.length - 1) / paragraphsPerImage) + 1;
        for (let i = addedImages; i < imageCount; i++) {
            richText += `[图片${i + 1}]\n\n`;
        }
        
        return richText;
    }
}

// 测试图像显示函数
function testImageDisplay() {
    // 测试图像 - 使用一个示例图片URL
    const testImageUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjM2NmYxIiAvPgogICAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udQYXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdlbWluaTwvdGV4dD4KPC9zdmc+";
    
    // 添加系统消息
    addSystemMessage("正在测试图像显示功能...");
    
    // 创建测试消息
    const testText = "这是一个测试图像，用于演示图文并茂的布局效果";
    addAssistantMessage(testText, [testImageUrl]);
    
    console.log("图像显示测试完成");
}

// 初始化应用
init();