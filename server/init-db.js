// Crea la base de demostración (npm run db:init) o la reinicia (npm run db:reset).
import fs from 'node:fs'
import path from 'node:path'
import { describeDbError, loadDbModule, prepareEnv } from './errors.js'

prepareEnv()
const { DEFAULT_DB, openDb } = await loadDbModule()
const file = path.resolve(process.env.JARUSA_DB || DEFAULT_DB)

if (process.argv.includes('--reset')) {
  try {
    for (const f of [file, file + '-wal', file + '-shm']) fs.rmSync(f, { force: true })
  } catch (e) {
    console.error(`No se pudo borrar ${file}: ${e.code === 'EBUSY' || e.code === 'EPERM' ? 'el archivo está en uso. Detén el servidor (Ctrl+C) y vuelve a intentarlo.' : e.message}`)
    process.exit(1)
  }
}

let db
try {
  db = openDb(file)
} catch (e) {
  console.error(describeDbError(e, file))
  process.exit(1)
}
const count = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n
console.log(`Base lista: ${path.relative(process.cwd(), file) || file}`)
console.log(`usuarios ${count('users')} · productos ${count('products')} · listas de deseos ${count('wishlist_items')} · anuncios ${count('announcements')} · notificaciones ${count('notifications')}`)
db.pragma('wal_checkpoint(TRUNCATE)') // deja todo en el archivo .db
db.close()
