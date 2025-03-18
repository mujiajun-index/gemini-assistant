<template>
  <!-- 系统消息 -->
  <div v-if="message.type === 'system'" class="message system">
    <i class="bi bi-info-circle-fill message-icon"></i>
    <div class="message-content" v-html="formatText(message.content)"></div>
  </div>
  
  <!-- 用户消息 -->
  <div v-else-if="message.type === 'user'" class="message user">
    <div class="message-content">
      <p>{{ message.content }}</p>
      <img 
        v-if="message.media && message.media.type && message.media.type.startsWith('image/') && message.media.data"
        :src="message.media.data" 
        style="max-width: 100%; max-height: 250px; border-radius: 8px; margin-top: 10px;"
      >
    </div>
  </div>
  
  <!-- 助手消息 -->
  <div v-else-if="message.type === 'assistant'" class="assistant-message">
    <div class="avatar">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-robot" viewBox="0 0 16 16">
        <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.8 24.8 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25 25 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135"/>
        <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2zM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5"/>
      </svg>
    </div>
    <div class="content" v-html="formatContent(message)"></div>
  </div>
</template>

<script>
export default {
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatText(text) {
      // 简单的格式化：将换行符转换为<br>标签
      return text.replace(/\n/g, '<br>')
    },
    formatContent(message) {
      if (message.imageUrls && message.imageUrls.length > 0) {
        // 如果有图片，使用富文本格式
        return this.formatWithImages(message.content, message.imageUrls)
      } else {
        // 普通文本消息，应用Markdown转换
        return this.convertMarkdownToHtml(message.content)
      }
    },
    formatWithImages(text, imageUrls) {
      // 检查当前文本是否已包含图片标记
      const hasExplicitMarkers = text.includes('[图片')
      
      // 如果没有图片标记，则自动添加
      let processedText = hasExplicitMarkers ? text : this.convertToRichTextFormat(text, imageUrls.length)
      
      // 提取并处理所有图片标记
      const imageMarkerRegex = /\[图片(\d+)\]/g
      let match
      let replacedText = processedText
      let usedImages = new Set()
      
      // 替换所有明确的图片标记
      while ((match = imageMarkerRegex.exec(processedText)) !== null) {
        const imageIndex = parseInt(match[1]) - 1
        if (imageIndex >= 0 && imageIndex < imageUrls.length) {
          // 将标记替换为实际图片引用
          const imgRefId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const imgHtml = `<div class="rich-image-container">
            <img src="${imageUrls[imageIndex]}" class="rich-content-image" alt="图片${imageIndex + 1}" data-index="${imageIndex}">
            <button class="edit-image-btn" onclick="document.dispatchEvent(new CustomEvent('edit-image', {detail: '${imageUrls[imageIndex]}'}))">编辑此图片</button>
          </div>`
          
          replacedText = replacedText.replace(match[0], imgHtml)
          usedImages.add(imageIndex)
        }
      }
      
      // 处理未使用的图片
      if (usedImages.size < imageUrls.length) {
        // 添加剩余图片
        let remainingImagesHtml = ''
        for (let i = 0; i < imageUrls.length; i++) {
          if (!usedImages.has(i)) {
            const imgRefId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            remainingImagesHtml += `
            <div class="rich-image-container">
                <img src="${imageUrls[i]}" class="rich-content-image" alt="图片${i + 1}" data-index="${i}">
                <button class="edit-image-btn" onclick="document.dispatchEvent(new CustomEvent('edit-image', {detail: '${imageUrls[i]}'}))">编辑此图片</button>
            </div>`
          }
        }
        
        if (remainingImagesHtml) {
          // 在文本末尾添加未使用的图片
          replacedText += '<div class="additional-images-container"><p>附加图片：</p>' + remainingImagesHtml + '</div>'
        }
      }
      
      // 包装处理后的文本为富文本格式
      return `<div class="rich-text">${this.convertMarkdownToHtml(replacedText)}</div>`
    },
    convertToRichTextFormat(text, imageCount) {
      // 如果文本已包含图片标记，则不做更改
      if (text.includes('[图片')) {
        return text
      }
      
      // 尝试确定文本是否是菜谱/教程类内容
      const isRecipe = this.isRecipeOrTutorial(text)
      
      let richText = ''
      let currentImageIndex = 0
      
      if (isRecipe) {
        // 处理菜谱/教程内容
        const lines = text.split('\n')
        const imagePlacement = []
        
        // 首先识别所有步骤
        const stepRegexes = [
          /第(\d+)步[：:]/,
          /步骤(\d+)[：:]/,
          /^(\d+)[.．。、]\s*(.+)/,
          /^（(\d+)）\s*(.+)/,
          /^\((\d+)\)\s*(.+)/
        ]
        
        let stepLines = []
        lines.forEach((line, idx) => {
          for (const regex of stepRegexes) {
            if (regex.test(line)) {
              stepLines.push({ index: idx, text: line })
              break
            }
          }
        })
        
        // 确定每个步骤应该放置图片
        if (stepLines.length > 0) {
          // 如果步骤数量比图片多，选择均匀分布的步骤
          if (stepLines.length > imageCount) {
            const step = Math.max(1, Math.floor(stepLines.length / imageCount))
            for (let i = 0; i < imageCount; i++) {
              const stepIndex = i * step
              if (stepIndex < stepLines.length) {
                imagePlacement.push({ 
                  lineIndex: stepLines[stepIndex].index, 
                  imageIndex: currentImageIndex++ 
                })
              }
            }
          } 
          // 如果步骤数量比图片少，给每个步骤放一张，剩余的放在文末
          else {
            for (let i = 0; i < stepLines.length; i++) {
              imagePlacement.push({ 
                lineIndex: stepLines[i].index, 
                imageIndex: currentImageIndex++ 
              })
            }
          }
        }
        
        // 如果没有识别到足够的步骤，查找关键节点（如材料部分后面、最后完成图等）
        if (currentImageIndex < imageCount) {
          // 查找材料/准备部分
          for (let i = 0; i < lines.length; i++) {
            if (/材料|配料|准备|食材|用料|需要准备/i.test(lines[i]) && currentImageIndex < imageCount) {
              if (!imagePlacement.some(item => Math.abs(item.lineIndex - i) < 3)) {
                imagePlacement.push({
                  lineIndex: i,
                  imageIndex: currentImageIndex++
                })
              }
              break
            }
          }
          
          // 在文末添加完成图
          if (currentImageIndex < imageCount) {
            imagePlacement.push({
              lineIndex: lines.length - 1,
              imageIndex: currentImageIndex++
            })
          }
        }
        
        // 如果没找到足够的部分，或还有剩余图片，均匀分布剩余图片
        if (currentImageIndex < imageCount) {
          const remainingImages = imageCount - currentImageIndex
          const interval = Math.max(1, Math.floor(lines.length / (remainingImages + 1)))
          
          for (let i = 0; i < remainingImages; i++) {
            const lineIndex = (i + 1) * interval
            if (lineIndex < lines.length) {
              // 确保不与现有图片位置重复
              if (!imagePlacement.some(item => Math.abs(item.lineIndex - lineIndex) < 3)) {
                imagePlacement.push({lineIndex, imageIndex: currentImageIndex++})
              }
            }
          }
        }
        
        // 按行号排序图片位置
        imagePlacement.sort((a, b) => a.lineIndex - b.lineIndex)
        
        // 生成最终文本
        let currentLine = 0
        let currentPlacement = 0
        
        richText = ''
        
        while (currentLine < lines.length) {
          // 添加当前行
          richText += lines[currentLine] + '\n'
          
          // 检查是否需要插入图片
          if (currentPlacement < imagePlacement.length && 
              imagePlacement[currentPlacement].lineIndex === currentLine) {
            
            // 添加图片标记
            richText += '\n[图片' + (imagePlacement[currentPlacement].imageIndex + 1) + ']\n\n'
            currentPlacement++
          }
          
          // 处理下一行
          currentLine++
        }
        
        // 如果还有剩余图片位置没有处理，添加到文本末尾
        while (currentPlacement < imagePlacement.length) {
          richText += '\n[图片' + (imagePlacement[currentPlacement].imageIndex + 1) + ']\n\n'
          currentPlacement++
        }
      } else {
        // 非教程/菜谱内容：简单地将图片均匀分布在段落之间
        const paragraphs = text.split('\n\n')
        
        // 确定图片位置（每两个段落之间插入一张图片）
        if (paragraphs.length <= 1) {
          // 太短的文本，直接添加图片在末尾
          richText = text + '\n\n'
          for (let i = 0; i < imageCount; i++) {
            richText += `[图片${i + 1}]\n\n`
          }
        } else {
          const step = Math.max(1, Math.floor(paragraphs.length / (imageCount + 1)))
          
          for (let i = 0; i < paragraphs.length; i++) {
            richText += paragraphs[i] + '\n\n'
            
            // 按照计算出的间隔插入图片
            if (i > 0 && i % step === 0 && currentImageIndex < imageCount) {
              richText += `[图片${currentImageIndex + 1}]\n\n`
              currentImageIndex++
            }
          }
          
          // 如果还有未插入的图片，添加到文本末尾
          while (currentImageIndex < imageCount) {
            richText += `[图片${currentImageIndex + 1}]\n\n`
            currentImageIndex++
          }
        }
      }
      
      return richText
    },
    isRecipeOrTutorial(text) {
      // 判断是否是菜谱/教程类内容
      const recipeKeywords = [
        /食材|材料|配料/,
        /步骤|做法|流程|制作|方法/,
        /第.+步/,
        /准备工作/,
        /完成品/,
        /开始制作/
      ]
      
      const stepPatterns = [
        /第\d+步/,
        /步骤\d+/,
        /^\d+[.．。、]/m,
        /^（\d+）/m,
        /^\(\d+\)/m
      ]
      
      // 检查关键词
      const hasKeywords = recipeKeywords.some(pattern => pattern.test(text))
      
      // 检查步骤模式
      const hasStepPatterns = stepPatterns.some(pattern => pattern.test(text))
      
      // 如果同时满足关键词和步骤模式，则很可能是菜谱/教程
      return hasKeywords && hasStepPatterns
    },
    convertMarkdownToHtml(markdown) {
      if (!markdown) return ''
      
      let html = markdown
        // 处理代码块
        .replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
        // 处理行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 处理标题
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // 处理粗体
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 处理斜体
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 处理链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // 处理无序列表
        .replace(/^\s*[-*+]\s+(.*)/gm, '<li>$1</li>')
        // 处理有序列表
        .replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>')
        // 处理段落
        .replace(/^(?!<[a-z])(.*)/gm, '<p>$1</p>')
        // 处理无序列表组
        .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
        // 防止嵌套的列表
        .replace(/<\/ul>\s*<ul>/g, '')
      
      return html
    },
    editImage(imageUrl) {
      // 触发编辑图像事件
      console.log("MessageItem: 触发编辑图像事件", imageUrl.substring(0, 50) + "...");
      this.$emit('edit-image', imageUrl);
    }
  },
  mounted() {
    // 添加全局事件监听器来接收来自HTML按钮的编辑图像事件
    document.addEventListener('edit-image', (event) => {
      console.log("MessageItem: 收到edit-image自定义事件", event.detail.substring(0, 50) + "...");
      this.editImage(event.detail);
    });
  },
  beforeUnmount() {
    // 移除事件监听器
    document.removeEventListener('edit-image', this.editImage);
  }
}
</script> 