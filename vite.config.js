import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/my-react-app/', // ← 添加这一行
  plugins: [react()],
})
