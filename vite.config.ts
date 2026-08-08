/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const sassDir = (name: string) => fileURLToPath(new URL(`./src/sass/${name}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@abstracts': sassDir('abstracts'),
      '@base': sassDir('base'),
      '@components': sassDir('components'),
      '@layout': sassDir('layout'),
      '@pages': sassDir('pages'),
      '@themes': sassDir('themes'),
      '@vendors': sassDir('vendors'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) return 'react'
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test-setup.ts'],
  },
})
