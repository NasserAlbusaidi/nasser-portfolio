import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit (mapbox-gl is inherently large ~1.6MB)
    chunkSizeWarningLimit: 2000,
  }
})
