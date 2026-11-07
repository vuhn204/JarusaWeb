// Conexión SQLite, creación del esquema, datos de demostración y reconciliación de precios.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { CREDENTIALS, PRODUCTS_SEED } from '../src/data/mock.js'
import { announcementNotes, effectiveProducts, reconcilePriceDrops } from '../src/services/promotions.js'

const here = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_DB = path.join(here, 'data', 'jarusa.db')

export function openDb(file = DEFAULT_DB) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'))
  seed(db)
  reconcile(db)
  return db
}

// Datos de demostración: solo si la base está vacía (nunca borra datos existentes)
function seed(db) {
  if (db.prepare('SELECT COUNT(*) n FROM users').get().n > 0) return
  const now = Date.now()
  db.transaction(() => {
    const u = db.prepare('INSERT INTO users (email, name, role, created_at) VALUES (?, ?, ?, ?)')
    for (const c of CREDENTIALS) u.run(c.email, c.name, c.role, now)
    const p = db.prepare('INSERT INTO products (id, name, price, old_price) VALUES (?, ?, ?, ?)')
    for (const x of PRODUCTS_SEED) p.run(x.id, x.name, x.price, x.oldPrice ?? null)
    const w = db.prepare('INSERT INTO wishlist_items (user_email, product_id, added_at) VALUES (?, ?, ?)')
    for (const id of ['p5', 'p4']) w.run('user@hola.com', id, now) // misma lista inicial que tenía la demo
  })()
}

// ── lecturas con el formato que usa el frontend ──────────────
export const rowToProduct = (r) => ({ id: r.id, name: r.name, price: r.price, oldPrice: r.old_price ?? undefined, priceUpdatedAt: r.price_updated_at ?? undefined })
export const rowToAnn = (r) => ({
  id: r.id, kind: r.kind, title: r.title, body: r.body, productId: r.product_id, promoPrice: r.promo_price, img: r.img,
  status: r.status, publishAt: r.publish_at, expiresAt: r.expires_at, author: { email: r.author_email, name: r.author_name },
  updatedBy: r.updated_by, createdAt: r.created_at, updatedAt: r.updated_at,
})
export const allProducts = (db) => db.prepare('SELECT * FROM products').all().map(rowToProduct)
export const allAnnouncements = (db) => db.prepare('SELECT * FROM announcements').all().map(rowToAnn)

/**
 * Detecta rebajas reales del precio vigente y crea los avisos en SQLite.
 * Reutiliza las reglas de src/services/promotions.js. INSERT OR IGNORE sobre
 * UNIQUE(user_email, dedupe_key) garantiza que no haya duplicados.
 * Devuelve [{ productId, name, from, to, notified }] con los avisos realmente creados.
 */
export function reconcile(db, now = Date.now()) {
  const shown = effectiveProducts(allProducts(db), allAnnouncements(db), now)
  const lastPrices = Object.fromEntries(db.prepare('SELECT * FROM product_price_state').all().map((r) => [r.product_id, { price: r.price, src: r.source }]))
  const wishlists = {}
  for (const r of db.prepare('SELECT user_email, product_id FROM wishlist_items').all()) (wishlists[r.user_email] ||= []).push(r.product_id)
  const res = reconcilePriceDrops({ products: shown, lastPrices, wishlists, now })
  const anns = announcementNotes({ announcements: allAnnouncements(db), products: shown, now })
  const emails = db.prepare('SELECT email FROM users').all().map((r) => r.email)

  const ins = db.prepare(`INSERT OR IGNORE INTO notifications
    (user_email, type, title, body, link, product_id, announcement_id, old_price, new_price, dedupe_key, created_at)
    VALUES (@to, @type, @title, @text, @link, @productId, @annId, @from, @toPrice, @key, @ts)`)
  const drops = []
  db.transaction(() => {
    if (res.changed) {
      db.prepare('DELETE FROM product_price_state').run()
      const st = db.prepare('INSERT INTO product_price_state (product_id, price, source) VALUES (?, ?, ?)')
      for (const [id, v] of Object.entries(res.lastPrices)) st.run(id, v.price, v.src)
    }
    for (const d of res.drops) {
      let notified = 0
      for (const n of res.notes.filter((x) => x.productId === d.productId)) notified += ins.run({ annId: null, ...n }).changes
      drops.push({ ...d, notified })
    }
    // anuncios vigentes: un aviso por cuenta (también para cuentas creadas después)
    for (const n of anns) for (const email of emails) ins.run({ ...n, to: email, productId: null, from: null, toPrice: null })
  })()
  return drops
}
