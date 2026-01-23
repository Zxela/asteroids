import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'ES2020',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    open: false
  },
  preview: {
    port: 4173
  },
  optimizeDeps: {
    include: ['three', 'howler']
  },
  assetsInclude: ['**/*.mp3', '**/*.ogg', '**/*.wav', '**/*.png', '**/*.jpg', '**/*.glb', '**/*.gltf']
})
