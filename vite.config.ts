import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { crisishubDevApi } from './server/devApiPlugin.ts'

export default defineConfig(({ mode }) => {
  // Empty prefix: load server secrets without exposing them as VITE_* client vars
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      crisishubDevApi({
        CF_ACCOUNT_ID: env.CF_ACCOUNT_ID,
        CF_API_TOKEN: env.CF_API_TOKEN,
        NASA_FIRMS_MAP_KEY: env.NASA_FIRMS_MAP_KEY,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/leaflet') ||
              id.includes('node_modules/react-leaflet')
            ) {
              return 'map'
            }
            if (id.includes('node_modules/recharts')) return 'charts'
            if (id.includes('node_modules/framer-motion')) return 'motion'
          },
        },
      },
    },
  }
})
