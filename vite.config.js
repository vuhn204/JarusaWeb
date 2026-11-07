import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Las peticiones a /api se reenvían al backend Express. El puerto se toma de PORT
// (variable de entorno o archivo .env), igual que en server/index.js.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const apiPort = Number(env.PORT) || 3001
  const proxy = { '/api': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } }
  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
