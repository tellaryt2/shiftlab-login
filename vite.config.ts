import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: "/shiftlab-login/",
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://juniorsbootcamp.ru',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
