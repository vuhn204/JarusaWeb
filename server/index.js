// Arranque del backend: API en /api y, si existe dist/, también la web compilada.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createApp } from './app.js'
import { describeDbError, loadDbModule, prepareEnv } from './errors.js'

prepareEnv()
const here = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PORT) || 3001

const { DEFAULT_DB, openDb, reconcile } = await loadDbModule()
const file = path.resolve(process.env.JARUSA_DB || DEFAULT_DB)

let db
try {
  db = openDb(file)
} catch (e) {
  console.error(describeDbError(e, file))
  process.exit(1)
}
const app = createApp(db)

const dist = path.join(here, '..', 'dist')
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

// promociones programadas que empiezan o vencen sin que nadie edite nada
const tick = setInterval(() => { try { reconcile(db) } catch (e) { console.error('[api] Error al revisar promociones:', e.message) } }, 30000)

const server = app.listen(port, () => {
  console.log(`Jarusa API en http://localhost:${port}`)
  console.log(`Base de datos SQLite: ${path.relative(process.cwd(), file) || file}`)
})
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`El puerto ${port} ya está en uso. Cierra el otro proceso que lo ocupa (¿otra instancia de Jarusa?) o define otro puerto con la variable PORT en el archivo .env.`)
  } else {
    console.error('No se pudo iniciar el servidor:', e.message)
  }
  db.close()
  process.exit(1)
})

let stopping = false
const stop = () => {
  if (stopping) return
  stopping = true
  clearInterval(tick)
  server.close()
  db.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
