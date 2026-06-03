import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    // 👇 THIS IS THE MAGIC SHIELD 👇
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Points directly to your laptop's Python server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})