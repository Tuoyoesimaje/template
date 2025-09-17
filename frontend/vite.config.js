import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/gemini': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        login: './src/pages/login.js',
        signup: './src/pages/signup.js',
        profile: './src/pages/profile.js'
      },
      output: {
        manualChunks: undefined,
      }
    }
  }
})
