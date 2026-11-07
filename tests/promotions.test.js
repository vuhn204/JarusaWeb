// Pruebas de la lógica de anuncios, descuentos y avisos a la lista de deseos.
// Ejecutar: npm test   (usa node:test, sin dependencias extra)
import test from 'node:test'
import assert from 'node:assert/strict'
import { annState, announcementNotes, applyPriceEdit, effectiveProducts, interestedUsers, reconcilePriceDrops, validateAnnouncement } from '../src/services/promotions.js'

const NOW = Date.parse('2026-11-07T12:00:00Z')
const H = 3600e3
const iso = (ms) => new Date(ms).toISOString()
const P = [
  { id: 'p1', name: 'Labial', price: 40 },
  { id: 'p2', name: 'Paleta', price: 50 },
]
const W = { 'ana@x.com': ['p1'], 'luis@x.com': ['p1', 'p2'], 'eva@x.com': [] }
const promo = (o = {}) => ({ id: 'a1', kind: 'promocion', title: 'Promo labial', body: 'Precio especial esta semana', productId: 'p1', promoPrice: 30, status: 'publicado', publishAt: iso(NOW - H), expiresAt: iso(NOW + 24 * H), updatedAt: 'u1', ...o })

// primera pasada: registra precios sin avisar (estado inicial)
const baseline = (products) => reconcilePriceDrops({ products: effectiveProducts(products, [], NOW), now: NOW }).lastPrices

test('estado del anuncio según estado y fechas', () => {
  assert.equal(annState(promo(), NOW), 'publicado')
  assert.equal(annState(promo({ status: 'borrador' }), NOW), 'borrador')
  assert.equal(annState(promo({ status: 'archivado' }), NOW), 'archivado')
  assert.equal(annState(promo({ publishAt: iso(NOW + H) }), NOW), 'programado')
  assert.equal(annState(promo({ expiresAt: iso(NOW - 1) }), NOW), 'vencido')
})

test('validación: campos obligatorios, fechas y precio promocional menor al actual', () => {
  assert.deepEqual(validateAnnouncement(promo(), P), {})
  const e = validateAnnouncement(promo({ title: 'x', body: 'corto', expiresAt: iso(NOW - 2 * H), promoPrice: 45 }), P)
  assert.ok(e.title && e.body && e.expiresAt && e.promoPrice)
  assert.ok(validateAnnouncement(promo({ kind: 'novedad' }), P).promoPrice, 'solo promociones cambian precio')
  assert.ok(validateAnnouncement(promo({ productId: 'nope' }), P).productId)
})

test('descuento real: avisa solo a quien tiene el producto en su lista de deseos', () => {
  const last = baseline(P)
  const res = reconcilePriceDrops({ products: effectiveProducts(P, [promo()], NOW), lastPrices: last, wishlists: W, now: NOW })
  assert.deepEqual(res.notes.map((n) => n.to).sort(), ['ana@x.com', 'luis@x.com'])
  const n = res.notes[0]
  assert.match(n.title, /Labial/)
  assert.match(n.text, /S\/ 30\.00/)
  assert.match(n.text, /antes S\/ 40\.00/)
  assert.equal(n.link, '/tienda?producto=p1')
  assert.equal(res.drops[0].notified, 2)
})

test('sin duplicados: la misma actualización no se avisa dos veces', () => {
  const shown = effectiveProducts(P, [promo()], NOW)
  const first = reconcilePriceDrops({ products: shown, lastPrices: baseline(P), wishlists: W, now: NOW })
  // repetir con el estado ya actualizado
  const again = reconcilePriceDrops({ products: shown, lastPrices: first.lastPrices, wishlists: W, sentKeys: first.notes.map((x) => x.key), now: NOW })
  assert.equal(again.notes.length, 0)
  // repetir con precios antiguos (p. ej. doble ejecución) pero con las claves ya enviadas
  const replay = reconcilePriceDrops({ products: shown, lastPrices: baseline(P), wishlists: W, sentKeys: first.notes.map((x) => x.key), now: NOW })
  assert.equal(replay.notes.length, 0)
})

test('no avisa si el precio no cambia o sube', () => {
  const last = baseline(P)
  assert.equal(reconcilePriceDrops({ products: effectiveProducts(P, [], NOW), lastPrices: last, wishlists: W, now: NOW }).notes.length, 0)
  const up = P.map((p) => (p.id === 'p1' ? applyPriceEdit(p, { price: 45 }, NOW) : p))
  assert.equal(reconcilePriceDrops({ products: effectiveProducts(up, [], NOW), lastPrices: last, wishlists: W, now: NOW }).notes.length, 0)
})

test('respeta estado y vigencia: borrador, programada o vencida no bajan el precio', () => {
  const last = baseline(P)
  for (const a of [promo({ status: 'borrador' }), promo({ publishAt: iso(NOW + H) }), promo({ expiresAt: iso(NOW - 1) })]) {
    const shown = effectiveProducts(P, [a], NOW)
    assert.equal(shown[0].price, 40)
    assert.equal(reconcilePriceDrops({ products: shown, lastPrices: last, wishlists: W, now: NOW }).notes.length, 0)
  }
  // la promoción programada avisa cuando entra en vigencia
  const later = effectiveProducts(P, [promo({ publishAt: iso(NOW + H) })], NOW + 2 * H)
  assert.equal(later[0].price, 30)
  assert.equal(reconcilePriceDrops({ products: later, lastPrices: last, wishlists: W, now: NOW + 2 * H }).notes.length, 2)
})

test('al vencer la promoción vuelve el precio normal sin avisar', () => {
  const during = reconcilePriceDrops({ products: effectiveProducts(P, [promo()], NOW), lastPrices: baseline(P), wishlists: W, now: NOW })
  const after = effectiveProducts(P, [promo()], NOW + 48 * H)
  assert.equal(after[0].price, 40)
  assert.equal(reconcilePriceDrops({ products: after, lastPrices: during.lastPrices, wishlists: W, sentKeys: during.notes.map((n) => n.key), now: NOW + 48 * H }).notes.length, 0)
})

test('rebaja editando el producto: guarda precio anterior y avisa', () => {
  const edited = applyPriceEdit(P[1], { price: 42 }, NOW)
  assert.equal(edited.oldPrice, 50)
  const res = reconcilePriceDrops({ products: effectiveProducts([P[0], edited], [], NOW), lastPrices: baseline(P), wishlists: W, now: NOW })
  assert.deepEqual(res.notes.map((n) => n.to), ['luis@x.com'])
  // una segunda rebaja distinta del mismo producto sí es un aviso nuevo
  const edited2 = applyPriceEdit(edited, { price: 39 }, NOW + 1)
  const res2 = reconcilePriceDrops({ products: effectiveProducts([P[0], edited2], [], NOW + 1), lastPrices: res.lastPrices, wishlists: W, sentKeys: res.notes.map((n) => n.key), now: NOW + 1 })
  assert.equal(res2.notes.length, 1)
  assert.equal(applyPriceEdit(edited2, { price: 60 }, NOW + 2).oldPrice, undefined, 'si sube por encima del anterior se quita el tachado')
})

test('anuncio publicado: un único aviso general, enlazado al producto o al anuncio', () => {
  const a = promo()
  const notes = announcementNotes({ announcements: [a, promo({ id: 'a2', status: 'borrador' })], products: P, now: NOW })
  assert.equal(notes.length, 1)
  assert.equal(notes[0].to, '*')
  assert.equal(notes[0].link, '/tienda?producto=p1')
  assert.equal(announcementNotes({ announcements: [a], sentKeys: [notes[0].key], products: P, now: NOW }).length, 0)
  const n2 = announcementNotes({ announcements: [promo({ id: 'a3', kind: 'novedad', productId: null, promoPrice: null })], products: P, now: NOW })
  assert.equal(n2[0].link, '/novedades#anuncio-a3')
})

test('consulta de interesados por producto', () => {
  assert.deepEqual(interestedUsers(W, 'p2'), ['luis@x.com'])
  assert.deepEqual(interestedUsers(W, 'p9'), [])
})
