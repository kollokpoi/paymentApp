import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue({
      template:{
        compilerOptions:{
          sourceMap:true
        }
      }
    }),
    vueDevTools(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5175, 
    host: true,
  },
  css: {
    devSourcemap: true 
  },
  build: {
    sourcemap: true,
    emptyOutDir: true,
    outDir:'/var/www/AdminClient'
  }
})
