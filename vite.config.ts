import { defineConfig } from "vitest/config"
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/MiMIDI/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MiMIDI',
        short_name: 'MiMIDI',
        description: 'Mobile-first music lab with mathematical synthesis and a .mimod plugin system.',
        theme_color: '#f07040',
        background_color: '#0f0f0f',
        display: 'fullscreen',
        orientation: 'any',
        start_url: process.env.GITHUB_ACTIONS ? '/MiMIDI/' : '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.mimod$/,
            handler: 'CacheFirst',
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
})
