import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/digital-business-card/',
  plugins: [react()],
})
