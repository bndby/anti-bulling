import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'AI Anti-Bullying Trainer',
        short_name: 'АнтиБуллинг',
        description: 'AI-симулятор для тренировки уверенных ответов на буллинг',
        theme_color: '#0078f0',
        background_color: '#ffffff',
        display: 'standalone',
        lang: 'ru',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,json,md,woff2}'],
        navigateFallback: `${base}index.html`.replace(/\/{2,}/g, '/'),
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
});
