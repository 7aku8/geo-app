
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // mirrors the nginx proxy used in docker compose
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})

