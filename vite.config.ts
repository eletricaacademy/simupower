/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // react/react-dom isolados (carregados desde o início)
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'react'
          }
          // todo o ecossistema 3D junto (acoplado) — vai p/ chunk lazy via Stage
          if (id.includes('three') || id.includes('@react-three') || id.includes('postprocessing')) {
            return 'three'
          }
          // demais libs ficam no chunk que as importa (evita ciclos)
          return undefined
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
