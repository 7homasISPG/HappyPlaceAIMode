// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // <<< CHANGE THIS SECTION >>>
  server: {
    proxy: {
      // Any request starting with /api will be forwarded
      '/api': {
        // Your Python backend server
        target: 'http://localhost:8001', 
        changeOrigin: true, // Recommended for virtual hosts
        // Optional: remove /api prefix before sending to backend
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})