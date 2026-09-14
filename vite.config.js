import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Student Job Survey',
        short_name: 'Job Survey',
        description: 'Khảo sát nhu cầu việc làm của sinh viên',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
      },

      workbox: {
        navigateFallback: '/index.html',
      },
    }),
  ],
})