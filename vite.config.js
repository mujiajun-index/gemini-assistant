import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5050,
    strictPort: true, // 如果端口已被占用，则直接退出而不是尝试其他端口
    open: true, // 自动在浏览器中打开应用程序
    // proxy: {
    //   '/v1beta': {
    //     target: 'http://localhost:5000', // 这里替换为你的API服务器地址
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/v1beta/, '')
    //   }
    // }
  }
})