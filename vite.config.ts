import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'mini-lms' with your actual GitHub repo name
export default defineConfig({
  plugins: [react()],
  base: '/mini-lms/',
})
