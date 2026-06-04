import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Semua request /api diteruskan ke backend Node.js lokal
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main:           resolve(__dirname, 'index.html'),
        screening:      resolve(__dirname, 'screening.html'),
        result:         resolve(__dirname, 'result.html'),
        preva:          resolve(__dirname, 'preva.html'),
        dashboardAdmin: resolve(__dirname, 'dashboard-admin.html')
      }
    }
  }
})
