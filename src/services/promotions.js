// ─────────────────────────────────────────────────────────────
// Anuncios, promociones, descuentos y avisos a la lista de deseos.
//
// Lógica pura (sin React ni almacenamiento): recibe el estado y devuelve
// resultados. La usan tanto el frontend como el servidor (server/db.js y
// server/app.js) y se prueba con `npm test`.
// ─────────────────────────────────────────────────────────────

export const ANN_KINDS = [
  { id: 'novedad', label: 'Novedad' },
  { id: 'anuncio', label: 'Anuncio' },
  { id: 'promocion', label: 'Promoción' },
]
export const kindLabel = (k) => ANN_KINDS.find((x) => x.id === k)?.label || 'Anuncio'

export const ANN_STATES = { borrador: 'Borrador', programado: 'Programado', publicado: 'Publicado', vencido: 'Vencido', archivado: 'Archivado' }

const t = (iso) => (iso ? new Date(iso).getTime() : NaN)
const round2 = (n) => Math.round(Number(n) * 100) / 100

/** Estado real de un anuncio en un instante dado. */
export function annState(a, now = Date.now()) {
  if (a.status === 'archivado') return 'archivado'
  if (a.status !== 'publicado') return 'borrador'
  if (t(a.publishAt) > now) return 'programado'
  if (a.expiresAt && t(a.expiresAt) <= now) return 'vencido'
  return 'publicado'
}
export const isActive = (a, now = Date.now()) => annState(a, now) === 'publicado'

/** Valida un anuncio antes de guardarlo. Devuelve { campo: mensaje }. */
export function validateAnnouncement(a, products = []) {
  const e = {}
  const title = (a.title || '').trim()
  const body = (a.body || '').trim()
  if (title.length < 3) e.title = 'Escribe un título de al menos 3 caracteres.'
  else if (title.length > 90) e.title = 'El título admite como máximo 90 caracteres.'
  if (body.length < 10) e.body = 'Escribe el contenido con al menos 10 caracteres.'
  else if (body.length > 1000) e.body = 'El contenido admite como máximo 1000 caracteres.'
  if (!ANN_KINDS.some((k) => k.id === a.kind)) e.kind = 'Elige el tipo de publicación.'
  if (!['borrador', 'publicado', 'archivado'].includes(a.status)) e.status = 'Elige el estado.'
  if (!a.publishAt || Number.isNaN(t(a.publishAt))) e.publishAt = 'Indica la fecha de publicación.'
  if (a.expiresAt) {
    if (Number.isNaN(t(a.expiresAt))) e.expiresAt = 'La fecha de expiración no es válida.'
    else if (!e.publishAt && t(a.expiresAt) <= t(a.publishAt)) e.expiresAt = 'La expiración debe ser posterior a la publicación.'
  }
  const product = a.productId ? products.find((p) => p.id === a.productId) : null
  if (a.productId && !product) e.productId = 'El producto relacionado ya no existe.'
  if (a.promoPrice !== null && a.promoPrice !== undefined && a.promoPrice !== '') {
    const price = Number(a.promoPrice)
    if (a.kind !== 'promocion') e.promoPrice = 'Solo las promociones pueden cambiar el precio.'
    else if (!product) e.promoPrice = 'Elige el producto al que se aplica el precio promocional.'
    else if (!(price > 0)) e.promoPrice = 'El precio promocional debe ser mayor a 0.'
    else if (price >= product.price) e.promoPrice = `Debe ser menor que el precio actual (${product.price.toFixed(2)}).`
  }
  return e
}

/**
 * Catálogo con el precio vigente: si hay una promoción publicada y en fecha
 * con precio menor al precio base, ese es el precio que ve y paga el cliente.
 */
export function effectiveProducts(products, announcements, now = Date.now()) {
  const best = {}
  for (const a of announcements) {
    if (a.kind !== 'promocion' || !a.productId || !(Number(a.promoPrice) > 0) || !isActive(a, now)) continue
    if (!best[a.productId] || Number(a.promoPrice) < Number(best[a.productId].promoPrice)) best[a.productId] = a
  }
  return products.map((p) => {
    const promo = best[p.id]
    const base = { ...p, priceSrc: `base-${p.priceUpdatedAt || 0}` }
    if (!promo || Number(promo.promoPrice) >= p.price) return base
    return { ...base, price: round2(promo.promoPrice), oldPrice: p.price, basePrice: p.price, tag: 'oferta', promoId: promo.id, promoUntil: promo.expiresAt || null, priceSrc: `promo-${promo.id}-${promo.updatedAt || ''}` }
  })
}

/** Precio guardado tras editar un producto: mantiene el precio tachado cuando baja. */
export function applyPriceEdit(prev, next, now = Date.now()) {
  const out = { ...prev, ...next }
  if (!prev || next.price === undefined || Number(next.price) === Number(prev.price)) return out
  out.priceUpdatedAt = now
  if (Number(next.price) < Number(prev.price)) out.oldPrice = Math.max(Number(prev.oldPrice) || 0, Number(prev.price))
  if (out.oldPrice && Number(out.oldPrice) <= Number(out.price)) delete out.oldPrice
  return out
}

/** Correos que tienen el producto en su lista de deseos. */
export const interestedUsers = (wishlists, productId) =>
  Object.entries(wishlists || {}).filter(([, ids]) => Array.isArray(ids) && ids.includes(productId)).map(([email]) => email)

const money = (n) => 'S/ ' + Number(n).toFixed(2)

/**
 * Compara el precio vigente con el último precio conocido y genera los avisos.
 *  - Solo si el precio BAJÓ de verdad (no si sube o se mantiene).
 *  - Solo a quien tiene el producto en su lista de deseos.
 *  - Cada aviso tiene una clave única (producto + usuario + origen + precio):
 *    la misma actualización nunca se avisa dos veces.
 * Devuelve { notes, lastPrices, drops, changed }.
 */
export function reconcilePriceDrops({ products, lastPrices = {}, wishlists = {}, sentKeys = [], now = Date.now() }) {
  const sent = new Set(sentKeys)
  const next = { ...lastPrices }
  const notes = []
  const drops = []
  let changed = false
  for (const p of products) {
    const prev = lastPrices[p.id]
    const cur = { price: round2(p.price), src: p.priceSrc || 'base-0' }
    if (!prev || prev.price !== cur.price || prev.src !== cur.src) { next[p.id] = cur; changed = true }
    if (!prev || !(cur.price < prev.price)) continue
    const emails = interestedUsers(wishlists, p.id)
    let count = 0
    for (const email of emails) {
      const key = `drop:${p.id}:${email}:${cur.src}:${cur.price}`
      if (sent.has(key)) continue
      sent.add(key)
      count++
      notes.push({
        id: 'n-' + key, key, ts: now, to: email, type: 'promo',
        title: `Bajó de precio: ${p.name}`,
        text: `Un producto de tu lista de deseos ahora cuesta ${money(cur.price)} (antes ${money(prev.price)}).${p.promoUntil ? ` Oferta válida hasta el ${new Date(p.promoUntil).toLocaleDateString('es-PE')}.` : ''}`,
        link: `/tienda?producto=${encodeURIComponent(p.id)}`,
        productId: p.id, from: prev.price, toPrice: cur.price,
      })
    }
    drops.push({ productId: p.id, name: p.name, from: prev.price, to: cur.price, notified: count, interested: emails.length })
  }
  for (const id of Object.keys(next)) if (!products.some((p) => p.id === id)) { delete next[id]; changed = true }
  return { notes, lastPrices: next, drops, changed: changed || notes.length > 0 }
}

/** Un aviso general (para todas las cuentas) por cada anuncio cuando entra en vigencia. */
export function announcementNotes({ announcements, sentKeys = [], products = [], now = Date.now() }) {
  const sent = new Set(sentKeys)
  const notes = []
  for (const a of announcements) {
    const key = `ann:${a.id}`
    if (sent.has(key) || !isActive(a, now)) continue
    const p = a.productId ? products.find((x) => x.id === a.productId) : null
    const body = a.body.length > 140 ? a.body.slice(0, 137) + '…' : a.body
    notes.push({
      id: 'n-' + key, key, ts: now, to: '*', type: a.kind === 'promocion' ? 'promo' : 'info',
      title: `${kindLabel(a.kind)}: ${a.title}`, text: body,
      link: p ? `/tienda?producto=${encodeURIComponent(p.id)}` : `/novedades#anuncio-${a.id}`,
      annId: a.id,
    })
  }
  return notes
}
