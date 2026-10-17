import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Served at nordlyssolutions.com/wuza/ (proxied from the Vercel deployment).
  base: '/wuza/',
  plugins: [react(), tailwindcss()],
  server: { host: true },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
