import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  // Deployed at nordlyssolutions.com/wuza/ (proxied from the Vercel deployment);
  // local development runs at the root.
  base: command === 'build' ? '/wuza/' : '/',
  plugins: [react(), tailwindcss()],
  server: { host: true },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
}))
