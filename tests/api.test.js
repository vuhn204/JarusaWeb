// Pruebas de integración: API Express + archivo SQLite real (temporal).
// Comprueba persistencia, descuentos, avisos solo a interesados, sin duplicados
// y que los datos sobreviven a un reinicio del backend.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'
import { openDb } from '../server/db.js'
import { createApp } from '../server/app.js'

const FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jarusa-')), 'test.db')
let db, server, base

const start = async () => {
  db = openDb(FILE)
  server = createApp(db).listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}`
}
const stop = async () => { await new Promise((r) => server.close(r)); db.close() }
const api = async (method, url, who, body) => {
  const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(who ? { 'x-user-email': who } : {}) }, body: body ? JSON.stringify(body) : undefined })
  return { status: res.status, data: await res.json() }
}
const ADMIN = 'admin@hola.com', ANA = 'user@hola.com', LUIS = 'luis@demo.com'
const sqlite = () => new Database(FILE, { readonly: true }) // lectura directa del archivo, sin pasar por la API

test.before(start)
test.after(async () => { await stop(); fs.rmSync(path.dirname(FILE), { recursive: true, force: true }) })

test('5. listas de deseos independientes por cuenta', async () => {
  await api('POST', '/api/session', null, { email: LUIS, name: 'Luis Demo' })
  assert.deepEqual((await api('GET', '/api/wishlist', ANA)).data, ['p5', 'p4'])
  assert.deepEqual((await api('GET', '/api/wishlist', LUIS)).data, [])
  await api('POST', '/api/wishlist/p1', LUIS)
  await api('POST', '/api/wishlist/p1', LUIS) // repetido: sin duplicar
  assert.deepEqual((await api('GET', '/api/wishlist', LUIS)).data, ['p1'])
  assert.deepEqual((await api('GET', '/api/wishlist', ANA)).data, ['p5', 'p4'])
  assert.equal((await api('GET', '/api/wishlist')).status, 401)
})

test('solo el admin (según la base) puede publicar o cambiar precios', async () => {
  assert.equal((await api('POST', '/api/session', null, { email: 'otro@demo.com', name: 'x' })).data.user.role, 'user')
  assert.equal((await api('POST', '/api/announcements', ANA, {})).status, 403)
  assert.equal((await api('PUT', '/api/products/p1', LUIS, { name: 'x', price: 1 })).status, 403)
})

test('1. un anuncio publicado se guarda en SQLite y genera un aviso por cuenta', async () => {
  const r = await api('POST', '/api/announcements', ADMIN, { kind: 'novedad', title: 'Nueva colección', body: 'Llegaron los tonos de verano.', status: 'publicado', publishAt: new Date(Date.now() - 1000).toISOString() })
  assert.equal(r.status, 201)
  const row = sqlite().prepare('SELECT * FROM announcements WHERE id = ?').get(r.data.announcement.id)
  assert.equal(row.title, 'Nueva colección')
  assert.equal(row.author_email, ADMIN)
  const n = sqlite().prepare("SELECT COUNT(*) c FROM notifications WHERE announcement_id = ?").get(row.id).c
  assert.equal(n, sqlite().prepare('SELECT COUNT(*) c FROM users').get().c)
  assert.equal((await api('POST', '/api/announcements', ADMIN, { kind: 'novedad', title: 'x', body: 'y' })).status, 422)
})

test('2 y 3. un descuento actualiza el precio y solo avisa a interesados', async () => {
  const r = await api('PUT', '/api/products/p4', ADMIN, { name: 'Paleta de Sombras Terra', price: 30 })
  assert.equal(r.status, 200)
  const row = sqlite().prepare('SELECT price, old_price FROM products WHERE id = ?').get('p4')
  assert.equal(row.price, 30)
  assert.equal(row.old_price, 45) // conserva el precio tachado más alto
  assert.deepEqual(r.data.drops.map((d) => [d.productId, d.notified]), [['p4', 1]])
  const who = sqlite().prepare("SELECT user_email, old_price, new_price, link FROM notifications WHERE dedupe_key LIKE 'drop:p4:%'").all()
  assert.deepEqual(who, [{ user_email: ANA, old_price: 38, new_price: 30, link: '/tienda?producto=p4' }])
  assert.equal((await api('GET', '/api/notifications', LUIS)).data.filter((n) => n.type === 'promo').length, 0)
})

test('promoción con precio: avisa a quien tiene el producto (Luis → p1) y respeta borradores', async () => {
  const draft = await api('POST', '/api/announcements', ADMIN, { kind: 'promocion', title: 'Promo borrador', body: 'Todavía no publicada.', productId: 'p1', promoPrice: 20, status: 'borrador', publishAt: new Date().toISOString() })
  assert.deepEqual(draft.data.drops, [])
  const pub = await api('PUT', `/api/announcements/${draft.data.announcement.id}`, ADMIN, { ...draft.data.announcement, status: 'publicado', publishAt: new Date(Date.now() - 1000).toISOString() })
  assert.deepEqual(pub.data.drops.map((d) => [d.productId, d.notified]), [['p1', 1]])
  const luis = (await api('GET', '/api/notifications', LUIS)).data.filter((n) => n.productId === 'p1')
  assert.equal(luis.length, 1)
  assert.match(luis[0].text, /S\/ 20\.00 \(antes S\/ 39\.00\)/)
})

test('6. sin duplicados ni avisos si el precio no baja', async () => {
  const before = sqlite().prepare('SELECT COUNT(*) c FROM notifications').get().c
  await api('PUT', '/api/products/p4', ADMIN, { name: 'Paleta de Sombras Terra', price: 30 }) // mismo precio
  await api('PUT', '/api/products/p4', ADMIN, { name: 'Paleta de Sombras Terra', price: 33 }) // sube
  await api('POST', '/api/session', null, { email: ANA, name: 'Ana Pérez' }) // vuelve a reconciliar
  assert.equal(sqlite().prepare('SELECT COUNT(*) c FROM notifications').get().c, before)
  const dup = sqlite().prepare('SELECT user_email, dedupe_key, COUNT(*) c FROM notifications GROUP BY 1, 2 HAVING c > 1').all()
  assert.deepEqual(dup, [])
})

test('leído / no leído', async () => {
  const list = (await api('GET', '/api/notifications', ANA)).data
  assert.ok(list.some((n) => !n.read))
  await api('POST', `/api/notifications/${list[0].id}/read`, ANA)
  assert.equal((await api('GET', '/api/notifications', ANA)).data.find((n) => n.id === list[0].id).read, true)
  await api('POST', '/api/notifications/read-all', ANA)
  assert.ok((await api('GET', '/api/notifications', ANA)).data.every((n) => n.read))
  assert.ok((await api('GET', '/api/notifications', LUIS)).data.some((n) => !n.read), 'no afecta a otras cuentas')
})

test('4. todo permanece después de reiniciar el backend', async () => {
  const before = { ana: (await api('GET', '/api/notifications', ANA)).data, luis: (await api('GET', '/api/wishlist', LUIS)).data }
  await stop()
  await start()
  assert.deepEqual((await api('GET', '/api/notifications', ANA)).data, before.ana)
  assert.deepEqual((await api('GET', '/api/wishlist', LUIS)).data, before.luis)
  assert.equal((await api('GET', '/api/products')).data.find((p) => p.id === 'p4').price, 33)
  assert.equal((await api('GET', '/api/announcements')).data.length, 2)
})
