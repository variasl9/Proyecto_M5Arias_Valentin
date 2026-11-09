/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Librerías en archivos propios: cambian poco y el navegador las reutiliza de la caché
        codeSplitting: {
          groups: [
            // Firebase separado en partes: se descargan en paralelo
            {
              name: 'firebase-auth',
              test: /[\\/]node_modules[\\/]@firebase[\\/]auth[\\/]/,
              priority: 20,
            },
            {
              name: 'firebase-firestore',
              test: /[\\/]node_modules[\\/]@firebase[\\/]firestore[\\/]/,
              priority: 20,
            },
            {
              name: 'firebase-core',
              test: /[\\/]node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 10,
            },
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // Cada test arranca con los mocks limpios: así el orden de los tests no importa
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/env.d.ts',
        'api/_tests/**',
      ],
      reporter: ['text', 'html'],
    },
  },
})