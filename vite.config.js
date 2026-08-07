import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path matches the GitHub Pages repo name: https://USUARIO.github.io/ricochet/
export default defineConfig({
  base: '/ricochet/',
  plugins: [react()],
})
