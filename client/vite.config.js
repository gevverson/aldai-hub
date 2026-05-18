import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTE: We use a hand-written public/sw.js for PWA support (registered in main.jsx).
// The vite-plugin-pwa was removed because its workbox build step crashes with
// "ReferenceError: crypto is not defined" on the Node version used by Render's free tier.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
