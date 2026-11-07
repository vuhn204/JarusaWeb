// Preparación del entorno del backend y mensajes claros para los fallos habituales al arrancar SQLite.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MIN_NODE = 22
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

// Comprueba la versión de Node.js y carga el archivo .env opcional de la raíz del proyecto.
// Las variables ya definidas en la terminal tienen prioridad sobre las del archivo.
export function prepareEnv() {
  const major = Number(process.versions.node.split('.')[0])
  if (major < MIN_NODE) {
    console.error(`Jarusa necesita Node.js ${MIN_NODE} o superior. Versión en uso: ${process.version}.`)
    process.exit(1)
  }
  const file = path.join(root, '.env')
  if (fs.existsSync(file)) process.loadEnvFile(file)
}

// Carga db.js (y con él el módulo nativo better-sqlite3) mostrando una causa entendible si falla.
export async function loadDbModule() {
  try {
    return await import('./db.js')
  } catch (e) {
    const native = /better[-_]sqlite3|\.node\b|NODE_MODULE_VERSION|ERR_DLOPEN_FAILED/i.test(`${e.code} ${e.message}`)
    if (native || e.code === 'ERR_MODULE_NOT_FOUND') {
      console.error([
        'No se pudo cargar better-sqlite3, el controlador de SQLite.',
        `Versión de Node.js en uso: ${process.version}.`,
        'Solución: borra la carpeta node_modules y vuelve a ejecutar «npm install».',
        `Detalle: ${e.message}`,
      ].join('\n'))
    } else {
      console.error(e)
    }
    process.exit(1)
  }
}

// Traduce un error al abrir o preparar la base de datos.
export function describeDbError(e, file) {
  const why = {
    SQLITE_BUSY: 'la base está bloqueada por otro proceso (¿hay otra instancia del servidor en marcha?).',
    SQLITE_LOCKED: 'la base está bloqueada por otro proceso (¿hay otra instancia del servidor en marcha?).',
    SQLITE_CANTOPEN: 'no se pudo abrir el archivo. Revisa que la ruta exista y que tengas permisos de escritura.',
    SQLITE_READONLY: 'el archivo es de solo lectura. Revisa sus permisos.',
    SQLITE_NOTADB: 'el archivo no es una base SQLite válida. Ejecuta «npm run db:reset» para crearla de nuevo.',
    SQLITE_CORRUPT: 'el archivo está dañado. Ejecuta «npm run db:reset» para crearla de nuevo.',
    EACCES: 'no hay permisos para crear o escribir el archivo.',
    EPERM: 'no hay permisos para crear o escribir el archivo.',
  }[e.code] || e.message
  return `No se pudo abrir la base de datos SQLite (${file}): ${why}`
}
