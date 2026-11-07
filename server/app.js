// API REST de Jarusa (Express + SQLite).
// Identificación de demostración: la cabecera X-User-Email indica la cuenta.
// ⚠ No es autenticación segura (no hay contraseñas ni tokens en el servidor);
//   el rol sí lo decide el servidor según su tabla `users`.
import express from 'express'
import { allAnnouncements, reconcile, rowToAnn, rowToProduct } from './db.js'
import { annState, applyPriceEdit, validateAnnouncement } from '../src/services/promotions.js'

const round2 = (n) => Math.round(Number(n) * 100) / 100

export function createApp(db) {
  const app = express()
  app.use(express.json({ limit: '2mb' })) // imágenes de anuncios como dataURL reducido

  // cuenta que hace la petición (si existe en la base)
  app.use((req, _res, next) => {
    const email = String(req.get('x-user-email') || '').trim()
    req.user = email ? db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null : null
    next()
  })
  const needUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: 'Inicia sesión para continuar.' }))
  const needAdmin = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Solo un administrador puede hacer esto.' }))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  // Registra (o actualiza el nombre de) la cuenta que inició sesión. Nunca eleva el rol.
  app.post('/api/session', (req, res) => {
    const email = String(req.body?.email || '').trim()
    const name = String(req.body?.name || '').trim() || email
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Correo no válido.' })
    db.prepare(`INSERT INTO users (email, name, role, created_at) VALUES (?, ?, 'user', ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name`).run(email, name, Date.now())
    reconcile(db) // le llegan los anuncios vigentes
    res.json({ user: db.prepare('SELECT email, name, role FROM users WHERE email = ?').get(email) })
  })

  // ── productos y descuentos ─────────────────────────────────
  app.get('/api/products', (req, res) => {
    const counts = Object.fromEntries(db.prepare('SELECT product_id, COUNT(*) n FROM wishlist_items GROUP BY product_id').all().map((r) => [r.product_id, r.n]))
    res.json(db.prepare('SELECT * FROM products').all().map((r) => ({ ...rowToProduct(r), ...(req.user?.role === 'admin' ? { wishlistCount: counts[r.id] || 0 } : {}) })))
  })

  // Crea o actualiza nombre y precio. Si el precio baja, avisa a quien lo tiene en su lista.
  app.put('/api/products/:id', needAdmin, (req, res) => {
    const id = req.params.id
    const name = String(req.body?.name || '').trim()
    const price = round2(req.body?.price)
    if (!name) return res.status(400).json({ error: 'Falta el nombre del producto.' })
    if (!(price > 0)) return res.status(400).json({ error: 'El precio debe ser mayor a 0.' })
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
    if (!row) {
      db.prepare('INSERT INTO products (id, name, price) VALUES (?, ?, ?)').run(id, name, price)
    } else {
      const next = applyPriceEdit(rowToProduct(row), { name, price })
      db.prepare('UPDATE products SET name = ?, price = ?, old_price = ?, price_updated_at = ? WHERE id = ?')
        .run(name, next.price, next.oldPrice ?? null, next.priceUpdatedAt ?? null, id)
    }
    const drops = reconcile(db)
    res.json({ product: rowToProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)), drops })
  })

  app.delete('/api/products/:id', needAdmin, (req, res) => {
    db.prepare('UPDATE announcements SET promo_price = NULL, product_id = NULL WHERE product_id = ?').run(req.params.id)
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id) // la lista de deseos se limpia en cascada
    res.json({ ok: true })
  })

  // ── anuncios ───────────────────────────────────────────────
  app.get('/api/announcements', (req, res) => {
    const list = allAnnouncements(db)
    res.json(req.user?.role === 'admin' ? list : list.filter((a) => annState(a) === 'publicado'))
  })

  const saveAnn = (req, res) => {
    const prev = req.params.id ? db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id) : null
    if (req.params.id && !prev) return res.status(404).json({ error: 'El anuncio no existe.' })
    const b = req.body || {}
    const a = {
      kind: b.kind, title: String(b.title || '').trim(), body: String(b.body || '').trim(), productId: b.productId || null,
      img: b.img || null, status: b.status, publishAt: b.publishAt, expiresAt: b.expiresAt || null,
      promoPrice: b.kind === 'promocion' && b.productId && b.promoPrice !== '' && b.promoPrice != null ? round2(b.promoPrice) : null,
    }
    const products = db.prepare('SELECT * FROM products').all().map(rowToProduct)
    const errors = validateAnnouncement(a, products)
    if (Object.keys(errors).length) return res.status(422).json({ errors })
    const ts = new Date().toISOString()
    const id = prev?.id || 'an' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const params = { id, ...a, ts, email: req.user.email, name: req.user.name }
    if (prev) {
      db.prepare(`UPDATE announcements SET kind=@kind, title=@title, body=@body, product_id=@productId, promo_price=@promoPrice, img=@img,
        status=@status, publish_at=@publishAt, expires_at=@expiresAt, updated_by=@email, updated_at=@ts WHERE id=@id`).run(params)
    } else {
      db.prepare(`INSERT INTO announcements (id, kind, title, body, product_id, promo_price, img, status, publish_at, expires_at, author_email, author_name, created_at, updated_at)
        VALUES (@id, @kind, @title, @body, @productId, @promoPrice, @img, @status, @publishAt, @expiresAt, @email, @name, @ts, @ts)`).run(params)
    }
    const drops = reconcile(db)
    const saved = rowToAnn(db.prepare('SELECT * FROM announcements WHERE id = ?').get(id))
    res.status(prev ? 200 : 201).json({ announcement: saved, state: annState(saved), drops })
  }
  app.post('/api/announcements', needAdmin, saveAnn)
  app.put('/api/announcements/:id', needAdmin, saveAnn)
  app.delete('/api/announcements/:id', needAdmin, (req, res) => {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id)
    reconcile(db) // si era una promoción vigente, vuelve el precio normal
    res.json({ ok: true })
  })

  // ── lista de deseos (una por cuenta) ───────────────────────
  const myWishlist = (email) => db.prepare('SELECT product_id FROM wishlist_items WHERE user_email = ? ORDER BY added_at, rowid').all(email).map((r) => r.product_id)
  app.get('/api/wishlist', needUser, (req, res) => res.json(myWishlist(req.user.email)))
  app.post('/api/wishlist/:productId', needUser, (req, res) => {
    if (!db.prepare('SELECT 1 FROM products WHERE id = ?').get(req.params.productId)) return res.status(404).json({ error: 'El producto no existe.' })
    db.prepare('INSERT OR IGNORE INTO wishlist_items (user_email, product_id, added_at) VALUES (?, ?, ?)').run(req.user.email, req.params.productId, Date.now())
    res.json(myWishlist(req.user.email))
  })
  app.delete('/api/wishlist/:productId', needUser, (req, res) => {
    db.prepare('DELETE FROM wishlist_items WHERE user_email = ? AND product_id = ?').run(req.user.email, req.params.productId)
    res.json(myWishlist(req.user.email))
  })

  // ── notificaciones (leído / no leído) ──────────────────────
  app.get('/api/notifications', needUser, (req, res) => {
    res.json(db.prepare('SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC, id DESC LIMIT 100').all(req.user.email).map((r) => ({
      id: r.id, type: r.type, title: r.title, text: r.body, link: r.link, productId: r.product_id, ts: r.created_at, read: !!r.read_at,
    })))
  })
  app.post('/api/notifications/read-all', needUser, (req, res) => {
    res.json({ updated: db.prepare('UPDATE notifications SET read_at = ? WHERE user_email = ? AND read_at IS NULL').run(Date.now(), req.user.email).changes })
  })
  app.post('/api/notifications/:id/read', needUser, (req, res) => {
    res.json({ updated: db.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_email = ? AND read_at IS NULL').run(Date.now(), req.params.id, req.user.email).changes })
  })

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }))

  // Errores no controlados: siempre JSON con un mensaje legible (nunca la página HTML de Express)
  // Express reconoce el manejador de errores por sus cuatro parámetros
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'El contenido enviado no es JSON válido.' })
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'El contenido enviado es demasiado grande (máximo 2 MB).' })
    console.error('[api]', err)
    const db = typeof err.code === 'string' && err.code.startsWith('SQLITE_')
    res.status(500).json({ error: db ? 'Error en la base de datos. Inténtalo de nuevo.' : 'Error interno del servidor.' })
  })
  return app
}

