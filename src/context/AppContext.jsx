import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ACCENTS, CREDENTIALS, LIP_TONES, PRODUCTS_SEED, SHADOW_TONES, buildOrders, calcTotals, money } from '../data/mock'
import { annState, applyPriceEdit, effectiveProducts, validateAnnouncement } from '../services/promotions'
import { api } from '../services/api'
import { canVibrate, playCue, primeAudio } from '../utils/alertCues'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const KEY = 'jarusa-v1'
const AKEY = 'jarusa-a11y'
// cb: none | protan (rojo) | deutan (verde) | tritan (azul)
// temp: warm | neutral | cool (temperatura visual, solo comodidad)
// sound / vibrate / keep: desactivados por defecto
const A11Y0 = { cb: 'none', dark: false, deaf: false, vibrate: false, sr: false, big: false, sound: false, keep: false, temp: 'neutral' }
const loadA11y = () => {
  try { return { ...A11Y0, ...JSON.parse(localStorage.getItem(AKEY)) } } catch { return A11Y0 }
}
const DAY = 864e5
const SEED_NOTES = () => [
  { id: 'n1', to: '*', type: 'info', title: 'Bienvenida a Jarusa Plus', text: 'Acumula puntos en cada compra y canjéalos en tus próximos pedidos.', ts: Date.now() - 3 * DAY },
  { id: 'n2', to: '*', type: 'info', title: 'Cupón JARUSA10', text: 'Usa el cupón JARUSA10 en tu carrito y obtén 10% de descuento.', ts: Date.now() - DAY },
]
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export function AppProvider({ children }) {
  const saved = useMemo(load, [])
  const [users, setUsers] = useState(saved?.users || CREDENTIALS)
  const [session, setSession] = useState(saved?.session || null)
  const [products, setProducts] = useState(saved?.products || PRODUCTS_SEED) // catálogo base (precio sin promociones)
  const [orders, setOrders] = useState(saved?.orders || buildOrders())
  const [cart, setCart] = useState(saved?.cart || [])
  // ── Datos que viven en SQLite (se leen y escriben solo mediante la API) ──
  const [serverProducts, setServerProducts] = useState([]) // precio oficial, precio anterior y nº de interesados
  const [announcements, setAnnouncements] = useState([])
  const [wishlist, setWishlist] = useState([]) // lista de deseos de la cuenta actual
  const [serverNotes, setServerNotes] = useState([]) // avisos de anuncios y bajadas de precio
  const [apiError, setApiError] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [shipDraft, setShipDraft] = useState(null) // dirección editada en Compra fácil / pago (dura la sesión)
  const [toastLog, setToastLog] = useState([]) // historial de avisos de esta sesión
  const [addresses, setAddresses] = useState(
    saved?.addresses || [{ id: 'a1', label: 'Casa', line: 'Av. Larco 1234, Dpto. 502', district: 'Miraflores', city: 'Lima', zip: '15074', ref: 'Frente al parque Kennedy', main: true }],
  )
  const [prefs, setPrefs] = useState(saved?.prefs || { skin: 'Mixta', lip: LIP_TONES[0], shadow: SHADOW_TONES[0], accent: ACCENTS[0] })
  const [coupon, setCoupon] = useState(null)
  const [toast, setToast] = useState(null)
  const [reset, setReset] = useState(null)
  const [a11y, setA11y] = useState(loadA11y)
  const [notes, setNotes] = useState(saved?.notes || SEED_NOTES())
  const [readMap, setReadMap] = useState(saved?.readMap || {})
  const a11yRef = useRef(a11y)
  a11yRef.current = a11y
  const timer = useRef()

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ users, session, products, orders, cart, addresses, prefs, notes, readMap }))
    } catch { /* almacenamiento lleno o bloqueado: no se puede guardar */ }
  }, [users, session, products, orders, cart, addresses, prefs, notes, readMap])

  // Reloj: revisa cada 30 s si una promoción programada empezó o venció
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  // Accesibilidad: aplica la configuración al <html> y la recuerda
  useEffect(() => {
    const d = document.documentElement
    d.dataset.cb = a11y.cb
    d.classList.toggle('dark', a11y.dark)
    d.classList.toggle('sr', a11y.sr)
    d.classList.toggle('big', a11y.big)
    d.classList.toggle('deaf', a11y.deaf)
    d.dataset.temp = a11y.temp || 'neutral'
    try { localStorage.setItem(AKEY, JSON.stringify(a11y)) } catch { /* ignorar */ }
  }, [a11y])
  const setA = (patch) => {
    if (patch.sound) primeAudio() // el audio del navegador se habilita con un gesto del usuario
    setA11y((a) => ({ ...a, ...patch }))
  }
  const buzz = (type) => { try { if (a11yRef.current.vibrate && canVibrate()) navigator.vibrate(type === 'err' ? [220, 90, 220, 90, 220] : type === 'info' ? [80] : [140]) } catch { /* sin soporte */ } }

  /* Avisos (toasts): siempre visibles y anunciados por lector de pantalla.
     - Éxito / información: se cierran solos (más tarde con «Alertas visuales»), salvo «Mantener los avisos».
     - Error: se queda hasta que la persona lo cierra.
     - Sonido (Web Audio) y vibración solo si se activaron; nunca son la única señal. */
  const notify = useCallback((msg, type = 'ok') => {
    const a = a11yRef.current
    const k = Date.now() + Math.random()
    setToast({ msg, type, k })
    setToastLog((l) => [{ id: k, msg, type, ts: Date.now() }, ...l].slice(0, 15))
    clearTimeout(timer.current)
    if (type !== 'err' && !a.keep) timer.current = setTimeout(() => setToast(null), a.deaf ? 7000 : 3200)
    buzz(type)
    if (a.sound) playCue(type)
  }, [])
  const dismissToast = useCallback(() => { clearTimeout(timer.current); setToast(null) }, [])
  const clearToastLog = () => setToastLog([])

  // ── campanita: historial de actividad y anuncios ───────
  const pushNote = (n) => setNotes((xs) => [{ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5), ts: Date.now(), ...n }, ...xs].slice(0, 120))
  const user = users.find((u) => u.email === session) || null
  const isAdmin = user?.role === 'admin'

  const me = user?.email

  // ── sincronización con la API (SQLite) ─────────────────
  const loadShared = useCallback(async () => {
    try {
      const [ps, as] = await Promise.all([api('GET', '/products', { user: me }), api('GET', '/announcements', { user: me })])
      setServerProducts(ps); setAnnouncements(as); setApiError(null)
    } catch (e) { setApiError(e.message) }
  }, [me])
  const loadMine = useCallback(async () => {
    if (!me) { setWishlist([]); setServerNotes([]); return }
    try {
      const [w, ns] = await Promise.all([api('GET', '/wishlist', { user: me }), api('GET', '/notifications', { user: me })])
      setWishlist(w); setServerNotes(ns); setApiError(null)
    } catch (e) { setApiError(e.message) }
  }, [me])
  // al iniciar sesión, el servidor registra la cuenta (sin contraseña) y luego se cargan sus datos
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (me) { try { await api('POST', '/session', { body: { email: me, name: user?.name } }) } catch (e) { setApiError(e.message) } }
      if (alive) { loadShared(); loadMine() }
    })()
    return () => { alive = false }
  }, [me]) // eslint-disable-line react-hooks/exhaustive-deps
  // sin WebSockets: se consulta periódicamente (avisos cada 15 s, catálogo y anuncios con el reloj de 30 s)
  useEffect(() => { if (!me) return undefined; const id = setInterval(loadMine, 15000); return () => clearInterval(id) }, [me, loadMine])
  useEffect(() => { loadShared() }, [now]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── catálogo: datos locales + precio oficial guardado en SQLite + promociones vigentes ──
  const priced = useMemo(() => {
    const sp = Object.fromEntries(serverProducts.map((x) => [x.id, x]))
    return products.map((p) => (sp[p.id] ? { ...p, price: sp[p.id].price, oldPrice: sp[p.id].oldPrice, priceUpdatedAt: sp[p.id].priceUpdatedAt } : p))
  }, [products, serverProducts])
  const shown = useMemo(() => effectiveProducts(priced, announcements, now), [priced, announcements, now])

  const dropNotice = (drops = []) => drops.map((d) => (d.notified
    ? `Bajó el precio de ${d.name} a ${money(d.to)}: se avisó a ${d.notified} ${d.notified === 1 ? 'cliente que lo tiene' : 'clientes que lo tienen'} en su lista de deseos.`
    : `Bajó el precio de ${d.name} a ${money(d.to)}: ningún cliente lo tiene en su lista de deseos.`)).join(' ')

  // ── campanita: avisos locales (pedidos, cuenta) + avisos guardados en SQLite ──
  const localNotes = user ? notes.filter((n) => !n.key && (n.to === '*' || n.to === user.email || n.to === 'role:' + user.role)) : []
  const myNotes = [...localNotes, ...serverNotes.map((n) => ({ ...n, id: 's' + n.id, server: true }))].sort((a, b) => b.ts - a.ts)
  const unread = localNotes.filter((n) => n.ts > (readMap[user?.email] || 0)).length + serverNotes.filter((n) => !n.read).length
  const markAllRead = () => {
    if (!user) return
    setReadMap((m) => ({ ...m, [user.email]: Date.now() }))
    if (serverNotes.some((n) => !n.read)) {
      setServerNotes((xs) => xs.map((n) => ({ ...n, read: true })))
      api('POST', '/notifications/read-all', { user: me }).catch((e) => notify(e.message, 'err'))
    }
  }

  // ── auth ───────────────────────────────────────────────
  const login = (email, password) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password)
    if (u) setSession(u.email)
    return u || null
  }
  const register = ({ name, email, password, phone, photo }) => {
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) return { error: 'Ya existe una cuenta con ese correo.' }
    const [first, ...rest] = name.trim().split(' ')
    const u = { email: email.trim(), password, role: 'user', name: name.trim(), first, last: rest.join(' '), phone: phone || '', points: 0, photo }
    setUsers((x) => [...x, u])
    pushNote({ to: u.email, type: 'ok', title: '¡Cuenta creada!', text: `Bienvenida/o ${first}. Ya puedes comprar y acumular puntos Jarusa Plus.` })
    setSession(u.email)
    return { user: u }
  }
  const logout = () => { setSession(null); setCoupon(null) }
  const updateUser = (patch) => setUsers((xs) => xs.map((u) => (u.email === session ? { ...u, ...patch, name: patch.first ? `${patch.first.split(' ')[0]} ${(patch.last || u.last).split(' ')[0]}` : u.name } : u)))

  // recuperar contraseña (demo: el código se muestra en pantalla porque no hay servidor de correo)
  const startReset = (email) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u) return null
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setReset({ email: u.email, code })
    return code
  }
  const finishReset = (password) => {
    setUsers((xs) => xs.map((u) => (u.email === reset?.email ? { ...u, password } : u)))
    setReset(null)
  }

  // ── carrito ────────────────────────────────────────────
  const addToCart = (id, qty = 1) => {
    const p = products.find((x) => x.id === id)
    if (!p) return
    if (p.stock <= 0) return notify('Este producto está agotado', 'err')
    setCart((c) => (c.some((l) => l.id === id) ? c.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, p.stock) } : l)) : [...c, { id, qty }]))
    notify(`${p.name} añadido al carrito`)
  }
  const setQty = (id, qty) => setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)))
  const removeFromCart = (id) => setCart((c) => c.filter((l) => l.id !== id))
  const cartLines = cart.map((l) => ({ ...l, product: shown.find((p) => p.id === l.id) })).filter((l) => l.product)
  const cartCount = cart.reduce((s, l) => s + l.qty, 0)
  const totals = calcTotals(cart, shown, coupon?.pct || 0)
  const applyCoupon = (code) => {
    if (code.trim().toUpperCase() === 'JARUSA10') { setCoupon({ code: 'JARUSA10', pct: 0.1 }); notify('Cupón aplicado: 10% de descuento'); return true }
    notify('Cupón no válido (prueba JARUSA10)', 'err'); return false
  }
  const toggleWish = async (id) => {
    if (!user) return notify('Inicia sesión para usar tu lista de deseos', 'err')
    const had = wishlist.includes(id)
    const name = products.find((p) => p.id === id)?.name || 'Producto'
    try {
      setWishlist(await api(had ? 'DELETE' : 'POST', `/wishlist/${encodeURIComponent(id)}`, { user: me }))
      notify(had ? `${name} quitado de tu lista de deseos` : `${name} añadido a tu lista de deseos. Te avisaremos si baja de precio.`)
    } catch (e) { notify(e.message, 'err') }
  }

  // Pago rechazado (simulado): queda en el historial y se avisa con alerta visual
  const failPayment = (reason) => {
    pushNote({ to: user.email, type: 'err', title: 'Tu compra no se realizó', text: reason })
    notify(reason, 'err')
  }
  const placeOrder = ({ pay, address }) => {
    const id = Math.max(1008, ...orders.map((o) => o.id)) + 1
    const order = { id, customer: user.name, email: user.email, date: new Date().toISOString(), items: cart.map(({ id, qty }) => ({ id, qty })), ...totals, pay, status: 'Pendiente', address }
    setOrders((o) => [order, ...o])
    setProducts((ps) => ps.map((p) => { const l = cart.find((x) => x.id === p.id); return l ? { ...p, stock: Math.max(0, p.stock - l.qty) } : p }))
    updateUser({ points: (user.points || 0) + Math.round(totals.total) })
    setCart([]); setCoupon(null); setShipDraft(null)
    pushNote({ to: user.email, type: 'ok', title: '¡Compra exitosa!', text: `Tu pedido #${id} por ${money(totals.total)} fue registrado. Te avisaremos cuando salga a reparto.` })
    pushNote({ to: 'role:admin', type: 'info', title: 'Nuevo pedido', text: `#${id} de ${user.name} por ${money(totals.total)}.` })
    return order
  }

  // ── admin ──────────────────────────────────────────────
  // El precio (y su historial) se guarda en SQLite; stock, foto y descripción siguen siendo locales.
  const syncPrice = async (id, name, price) => {
    try {
      const r = await api('PUT', `/products/${encodeURIComponent(id)}`, { user: me, body: { name, price } })
      setServerProducts((xs) => [...xs.filter((x) => x.id !== id), { ...xs.find((x) => x.id === id), ...r.product }])
      return r
    } catch (e) { notify(`No se guardó el precio en el servidor: ${e.message}`, 'err'); return null }
  }
  const saveProduct = async (p) => {
    if (!isAdmin) return notify('Solo un administrador puede modificar productos', 'err')
    if (p.id) {
      setProducts((ps) => ps.map((x) => (x.id === p.id ? applyPriceEdit(x, p) : x)))
      const r = await syncPrice(p.id, p.name, p.price)
      if (r) { notify(dropNotice(r.drops) || 'Producto actualizado', r.drops.length ? 'info' : 'ok'); loadShared(); loadMine() }
    } else {
      const n = products.length + 1
      const id = 'p' + Date.now()
      setProducts((ps) => [...ps, { ...p, id, sku: p.sku || `JR ${String(700 + n).padStart(4, '0')}`, tag: 'novedad' }])
      if (await syncPrice(id, p.name, p.price)) notify('Producto creado: ya aparece en la tienda')
    }
  }
  const deleteProduct = async (id) => {
    if (!isAdmin) return notify('Solo un administrador puede eliminar productos', 'err')
    setProducts((ps) => ps.filter((p) => p.id !== id)); setCart((c) => c.filter((l) => l.id !== id))
    try { await api('DELETE', `/products/${encodeURIComponent(id)}`, { user: me }); notify('Producto eliminado') } catch (e) { notify(e.message, 'err') }
    loadShared()
  }

  // ── anuncios, novedades y promociones (solo admin, guardados en SQLite) ──
  const saveAnnouncement = async (draft) => {
    if (!isAdmin) return { error: 'Solo un administrador puede publicar anuncios.' }
    const body = {
      kind: draft.kind, title: (draft.title || '').trim(), body: (draft.body || '').trim(),
      productId: draft.productId || null, img: draft.img || null, status: draft.status,
      publishAt: draft.publishAt, expiresAt: draft.expiresAt || null,
      promoPrice: draft.kind === 'promocion' && draft.productId && draft.promoPrice !== '' && draft.promoPrice != null ? Math.round(Number(draft.promoPrice) * 100) / 100 : null,
    }
    const errors = validateAnnouncement(body, priced) // validación inmediata; el servidor vuelve a validar
    if (Object.keys(errors).length) return { errors }
    try {
      const r = await api(draft.id ? 'PUT' : 'POST', draft.id ? `/announcements/${encodeURIComponent(draft.id)}` : '/announcements', { user: me, body })
      setNow(Date.now()) // estado (publicado / programado) calculado con la hora actual
      await loadShared(); loadMine()
      return { announcement: r.announcement, state: r.state, notice: dropNotice(r.drops) }
    } catch (e) { return e.errors ? { errors: e.errors } : { error: e.message } }
  }
  const deleteAnnouncement = async (id) => {
    if (!isAdmin) return notify('Solo un administrador puede eliminar anuncios', 'err')
    try { await api('DELETE', `/announcements/${encodeURIComponent(id)}`, { user: me }); notify('Anuncio eliminado') } catch (e) { notify(e.message, 'err') }
    loadShared()
  }
  const publicAnnouncements = useMemo(() => announcements.filter((a) => annState(a, now) === 'publicado').sort((a, b) => new Date(b.publishAt) - new Date(a.publishAt)), [announcements, now])
  const interestedCount = (productId) => serverProducts.find((x) => x.id === productId)?.wishlistCount || 0
  const STATUS_NOTE = {
    'En camino': ['ship', 'Tu pedido está por llegar', 'va en camino. Mantente atenta/o a la entrega.'],
    Entregado: ['ok', '¡Pedido entregado!', 'fue entregado. ¡Gracias por elegir Jarusa!'],
    Cancelado: ['err', 'Pedido cancelado', 'fue cancelado. Si no lo solicitaste, escríbenos.'],
    Pendiente: ['info', 'Pedido en preparación', 'está pendiente de preparación.'],
  }
  const setOrderStatus = (id, status) => {
    const o = orders.find((x) => x.id === id)
    const m = STATUS_NOTE[status]
    if (o && m && o.email && o.status !== status) pushNote({ to: o.email, type: m[0], title: m[1], text: `Tu pedido #${id} ${m[2]}` })
    setOrders((os) => os.map((x) => (x.id === id ? { ...x, status } : x)))
    notify(`Pedido ${id >= 1000 ? "#" + id : id} → ${status}`)
  }

  const resetDemo = () => { try { localStorage.removeItem(KEY) } catch { /* nada */ } window.location.href = '/' }

  const value = {
    users, user, login, register, logout, updateUser, startReset, finishReset, reset, setReset,
    products: shown, baseProducts: priced, saveProduct, deleteProduct, orders, setOrderStatus, placeOrder,
    announcements, publicAnnouncements, saveAnnouncement, deleteAnnouncement, interestedCount, now,
    cart, cartLines, cartCount, totals, coupon, addToCart, setQty, removeFromCart, applyCoupon,
    a11y, setA, notes: myNotes, unread, markAllRead, pushNote, failPayment,
    wishlist, toggleWish, addresses, setAddresses, prefs, setPrefs, toast, notify, dismissToast, toastLog, clearToastLog, resetDemo,
    shipDraft, setShipDraft, apiError,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
