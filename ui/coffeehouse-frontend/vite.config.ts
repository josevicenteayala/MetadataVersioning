import path from 'node:path'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@tests': path.resolve(__dirname, 'tests'),
      '@lib': path.resolve(__dirname, 'src/lib'),
    },
  },
  build: {
    // Code splitting configuration for optimal performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React ecosystem
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Data fetching chunk
          query: ['@tanstack/react-query'],
          // State management chunk
          state: ['zustand'],
          // Diff visualization chunk (loaded when needed)
          diff: ['jsondiffpatch'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Target modern browsers for smaller bundles
    target: 'esnext',
    // Chunk size warning threshold (500KB)
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'axios',
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    include: [
      ...configDefaults.include,
      'tests/unit/**/*.spec.{ts,tsx}',
      'tests/unit/**/*.test.{ts,tsx}',
    ],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
