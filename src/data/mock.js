// ─────────────────────────────────────────────────────────────
// DATOS DE EJEMPLO · Jarusa
// Para agregar productos nuevos con foto: copia la imagen a /public/img
// y añade un objeto más en PRODUCTS_SEED (o créalo desde el panel Admin).
// ─────────────────────────────────────────────────────────────
export const CREDENTIALS = [
  { email: 'user@hola.com', password: 'user12345', role: 'user', name: 'Ana Pérez', first: 'Ana María', last: 'Pérez Quispe', phone: '+51 987 654 321', points: 350 },
  { email: 'admin@hola.com', password: 'admin12345', role: 'admin', name: 'Admin Jarusa', first: 'Admin', last: 'Jarusa', phone: '+51 999 000 111', points: 0 },
]

export const CATEGORIES = ['Labiales', 'Rostro', 'Ojos', 'Uñas', 'Otros']

export const PRODUCTS_SEED = [
  { id: 'p1', sku: 'JR 0101', name: 'Display de Labios The Charm', cat: 'Labiales', price: 39, stock: 48, img: '/img/display-charm.jpg', tag: 'novedad', desc: 'Display de 24 gloss labiales con efecto volumen y brillo espejo. Ideal para regalar o para vender.' },
  { id: 'p2', sku: 'JR 0155', name: 'Corrector Smoky Pixie', cat: 'Rostro', price: 24, stock: 6, img: '/img/corrector-pixie.jpg', tag: 'novedad', desc: 'Corrector líquido de cobertura media, 6 tonos, acabado natural de larga duración.' },
  { id: 'p3', sku: 'JR 0412', name: 'Cubos de Sombras Star', cat: 'Ojos', price: 18, stock: 3, img: '/img/cubos-star.jpg', tag: '', desc: 'Iluminador en forma de corazón con micro-brillos dorados. Se aplica en seco o húmedo.' },
  { id: 'p4', sku: 'JR 0338', name: 'Paleta de Sombras Terra', cat: 'Ojos', price: 38, oldPrice: 45, stock: 21, img: '/img/paleta-terra.jpg', tag: 'oferta', desc: 'Paleta de 12 sombras inspirada en tonos andinos: mates, satinados y glitter.' },
  { id: 'p5', sku: 'JR 0204', name: 'Tinte de Labios The Sorbo', cat: 'Labiales', price: 25.5, stock: 64, img: '/img/tinte-sorbo.jpg', tag: 'novedad', desc: 'Labial líquido efecto tinte en 6 tonos. Tono 04 en el carrito de ejemplo.' },
  { id: 'p6', sku: 'JR 0287', name: 'Máscara de Pestañas Lash', cat: 'Ojos', price: 22, stock: 0, img: '/img/mascara-lash.jpg', tag: '', desc: 'Máscara de pestañas con cepillo curvo, volumen y definición sin grumos.' },
  { id: 'p7', sku: 'JR 0610', name: 'Kit Combo Tintas', cat: 'Labiales', price: 50, stock: 15, img: '/img/kit-tintas.jpg', tag: 'oferta', desc: 'Kit de 6 mini tintas en tonos rojos y borgoña.' },
  { id: 'p8', sku: 'JR 0521', name: 'Paleta de Sombras Florecer', cat: 'Ojos', price: 38, stock: 27, img: '/img/paleta-florecer.jpg', tag: '', desc: 'Paleta de 24 sombras neutras en tonos rosados y marrones.' },
]

export const BANNERS = ['/img/banner-ruta.jpg', '/img/tinte-sorbo.jpg', '/img/banner-lipgloss.jpg', '/img/banner-corrector.jpg']

export const TESTIMONIALS = [
  { name: 'Valeria Gonzales', role: 'Clienta Jarusa Plus', text: 'Mi piel nunca se había visto tan luminosa. Los labiales son suaves, duran todo el día y huelen increíble.' },
  { name: 'Lucía Ramos', role: 'Clienta Jarusa Gold', text: 'La paleta Terra tiene unos colores preciosos y rinde muchísimo. Ya es mi favorita para el día a día.' },
  { name: 'Camila Torres', role: 'Clienta Jarusa', text: 'Pedí el kit de tintas y llegó en dos días. Los tonos son tal cual las fotos. ¡Volveré a comprar!' },
]

export const DISTRICTS = ['Miraflores', 'San Isidro', 'Surco', 'La Molina', 'Barranco', 'San Borja']
export const CITIES = ['Lima', 'Arequipa', 'Cusco', 'Trujillo']
export const SKIN = ['Mixta', 'Seca', 'Grasa', 'Normal', 'Sensible']
export const LIP_TONES = ['#B3122F', '#D6457A', '#E88AA8', '#C97B63', '#8C2A3F', '#F2A7A0', '#7A1F3D']
export const SHADOW_TONES = ['#C9A27C', '#8E6A4F', '#D8A7B1', '#6B4E71', '#E9C46A', '#3F6F76', '#F4D6CC']
export const ACCENTS = ['#D01A78', '#8F0C52', '#E0338A', '#5E0835', '#F59BC4']
export const STATUSES = ['Entregado', 'En camino', 'Pendiente', 'Cancelado']
export const PAYMENTS = ['Visa', 'Yape', 'Plin', 'Contra entrega']

// ── helpers ──────────────────────────────────────────────────
export const money = (n) => 'S/ ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const daysAgo = (n, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d.toISOString() }
export const fmtDate = (iso) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` }
export const fmtTime = (iso) => { const d = new Date(iso); return `${fmtDate(iso)} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
export const orderCode = (id) => (id >= 1000 ? `#${id}` : String(id).padStart(3, '0'))
export const stockState = (p) => (p.stock <= 0 ? 'Agotado' : p.stock <= 10 ? 'Stock bajo' : 'Activo')

export function calcTotals(lines, products, discount = 0) {
  const subtotal = lines.reduce((s, l) => s + (products.find((p) => p.id === l.id)?.price || 0) * l.qty, 0)
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 8
  const tax = +(subtotal * 0.0835).toFixed(2)
  const disc = +(subtotal * discount).toFixed(2)
  const total = +(subtotal + shipping + tax - disc).toFixed(2)
  return { subtotal: +subtotal.toFixed(2), shipping, tax, discount: disc, total }
}

const ex = (id, customer, email, d, items, total, pay, status, full = false) => ({
  id, customer, email, date: daysAgo(d), items,
  subtotal: full ? 63.5 : total, shipping: full ? 8 : 0, tax: full ? 5.3 : 0, discount: 0, total,
  pay, status, address: 'Av. Larco 1234, Miraflores',
})

// Pedidos del panel admin (1001–1008) + historial de Ana (001–023)
export function buildOrders() {
  const admin = [
    ex(1008, 'Valeria Gonzales', 'valeria@correo.com', 2, [{ id: 'p5', qty: 1 }, { id: 'p8', qty: 1 }], 76.8, 'Visa', 'Entregado', true),
    ex(1007, 'Lucía Ramos', 'lucia@correo.com', 2, [{ id: 'p1', qty: 1 }], 39, 'Yape', 'En camino'),
    ex(1006, 'Camila Torres', 'camila@correo.com', 3, [{ id: 'p2', qty: 2 }], 48, 'Plin', 'Pendiente'),
    ex(1005, 'Mariana Silva', 'mariana@correo.com', 4, [{ id: 'p7', qty: 1 }], 50, 'Visa', 'Entregado'),
    ex(1004, 'Rosa Quispe', 'rosa@correo.com', 5, [{ id: 'p3', qty: 1 }], 18.5, 'Yape', 'Cancelado'),
    ex(1003, 'Daniela Mendoza', 'daniela@correo.com', 5, [{ id: 'p2', qty: 1 }], 24, 'Visa', 'Entregado'),
    ex(1002, 'Fiorella Vega', 'fiorella@correo.com', 6, [{ id: 'p4', qty: 1 }, { id: 'p2', qty: 1 }], 62.5, 'Plin', 'En camino'),
    ex(1001, 'Ana Pérez', 'user@hola.com', 8, [{ id: 'p5', qty: 1 }, { id: 'p8', qty: 1 }], 76.8, 'Visa', 'Entregado', true),
  ]
  const hist = []
  const pays = ['Visa', 'Yape', 'Plin', 'Visa']
  const sts = ['Entregado', 'Entregado', 'En camino', 'Pendiente', 'Entregado', 'Cancelado', 'Entregado']
  for (let i = 1; i <= 23; i++) {
    const a = PRODUCTS_SEED[i % 8], b = PRODUCTS_SEED[(i * 3 + 1) % 8]
    const items = i % 3 === 0 ? [{ id: a.id, qty: 1 }] : [{ id: a.id, qty: 1 }, { id: b.id, qty: i % 2 ? 1 : 2 }]
    const t = calcTotals(items, PRODUCTS_SEED)
    hist.push({ id: i, customer: 'Ana Pérez', email: 'user@hola.com', date: daysAgo(8 + i * 3), items, ...t, pay: pays[i % 4], status: sts[i % 7], address: 'Av. Larco 1234, Miraflores' })
  }
  return [...admin, ...hist]
}

export const MONTHLY = [90, 150, 110, 190, 150, 240, 190, 330, 260, 360, 300, 420]
export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const WEEKLY = [{ d: 'Lun', v: 1100 }, { d: 'Mar', v: 1500 }, { d: 'Mié', v: 900 }, { d: 'Jue', v: 1800 }, { d: 'Vie', v: 1700 }, { d: 'Sáb', v: 2140 }, { d: 'Dom', v: 1400 }]
