import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTE: We use a hand-written public/sw.js for PWA support (registered in main.jsx).
// The vite-plugin-pwa was removed because its workbox build step crashes with
// "ReferenceError: crypto is not defined" on the Node version used by Render's free tier.

export default defineConfig({
  plugins: [react()],
  // Same proxy for `vite` (dev) and `vite preview` (prod build) so the
  // frontend can reach the API on the same origin in both modes — used by
  // the hermetic E2E run, which serves the production build via preview.
  server:  { port: 5173, proxy: apiProxy() },
  preview: { port: 4173, proxy: apiProxy() },
})

function apiProxy() {
  const target = process.env.VITE_API_URL || 'http://localhost:3001';
  return {
    '/api':     { target, changeOrigin: true },
    '/uploads': { target, changeOrigin: true },
  };
}
