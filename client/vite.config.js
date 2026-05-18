import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: [
        'icon-16.png',
        'icon-32.png',
        'icon-64.png',
        'icon-72.png',
        'icon-96.png',
        'icon-128.png',
        'icon-144.png',
        'icon-152.png',
        'icon-167.png',
        'icon-180.png',
        'icon-192.png',
        'icon-256.png',
        'icon-384.png',
        'icon-512.png',
        'icon-maskable-192.png',
        'icon-maskable-512.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mym-images',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mym-api',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 12,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
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
