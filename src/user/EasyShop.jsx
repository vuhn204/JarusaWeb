import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { CATEGORIES, CITIES, DISTRICTS, money } from '../data/mock'

/**
 * COMPRA FÁCIL · módulo pensado para lector de pantalla (NVDA, JAWS, VoiceOver, TalkBack).
 * Una sola columna, encabezados jerárquicos (H1 > H2 > H3), sin imágenes ni carruseles,
 * botones con nombres completos y un anunciador aria-live que confirma cada acción.
 * Todo el proceso (elegir → revisar → pagar) ocurre en esta misma página.
 */
const bigBtn = 'rounded-xl bg-jar-700 px-5 py-3 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50'
const ghost = 'rounded-xl border-2 border-neutral-400 bg-white px-4 py-2.5 text-sm font-bold text-neutral-800 hover:bg-neutral-100'
const field = 'w-full rounded-xl border-2 border-neutral-400 bg-white px-3 py-3 text-sm text-neutral-800 aria-[invalid=true]:border-rose-700'
const fromAddr = (a) => ({ line: a?.line || '', district: a?.district || DISTRICTS[0], city: a?.city || CITIES[0], ref: a?.ref || '' })
const withValue = (list, v) => (v && !list.includes(v) ? [v, ...list] : list)

export default function EasyShop() {
  const { products, cartLines, cartCount, totals, addToCart, setQty, removeFromCart, placeOrder, addresses, setAddresses, user, notify, failPayment, shipDraft, setShipDraft } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [pay, setPay] = useState('Contra entrega')
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  const [say, setSay] = useState('')
  const addr = addresses.find((a) => a.main) || addresses[0]
  // Dirección de envío editable: parte de la predeterminada y se conserva durante la compra
  const [ship, setShipState] = useState(() => shipDraft || fromAddr(addr))
  const [saveMain, setSaveMain] = useState(false)
  const [errs, setErrs] = useState({})
  const formRef = useRef(null)
  const setShip = (k) => (e) => {
    const next = { ...ship, [k]: e.target.value }
    setShipState(next); setShipDraft(next)
    if (errs[k]) setErrs({ ...errs, [k]: undefined })
  }
  const resetShip = () => { const d = fromAddr(addr); setShipState(d); setShipDraft(null); setErrs({}); announce('Se restauró tu dirección predeterminada.') }
  const edited = !!addr && (ship.line !== addr.line || ship.district !== addr.district || ship.city !== addr.city || (ship.ref || '') !== (addr.ref || ''))

  const list = products.filter((p) => (cat === 'Todas' || p.cat === cat) && (p.name + ' ' + p.desc).toLowerCase().includes(q.trim().toLowerCase()))
  const announce = (t) => setSay(t + ' ') // el espacio final fuerza la relectura

  const add = (p) => {
    if (p.stock <= 0) return announce(`${p.name} está agotado.`)
    addToCart(p.id)
    announce(`${p.name} añadido. Tu carrito tiene ${cartCount + 1} productos.`)
  }
  const change = (l, d) => {
    const n = l.qty + d
    if (n < 1) return
    if (n > l.product.stock) return announce(`Solo hay ${l.product.stock} unidades de ${l.product.name}.`)
    setQty(l.id, n)
    announce(`${l.product.name}: ${n} unidades.`)
  }
  const remove = (l) => { removeFromCart(l.id); announce(`${l.product.name} eliminado del carrito.`) }

  const confirm = (e) => {
    e.preventDefault()
    if (!cartLines.length) return announce('Tu carrito está vacío. Añade al menos un producto.')
    const e2 = {}
    if (ship.line.trim().length < 5) e2.line = 'Escribe tu dirección de envío: calle, número y, si aplica, departamento.'
    if (!ship.district.trim()) e2.district = 'Elige el distrito.'
    if (!ship.city.trim()) e2.city = 'Elige la ciudad.'
    if (phone.replace(/\D/g, '').length < 6) e2.tel = 'Escribe un teléfono de contacto válido.'
    setErrs(e2)
    const bad = Object.keys(e2)[0]
    if (bad) {
      formRef.current?.elements[bad]?.focus()
      return announce(`Revisa la entrega: ${e2[bad]}`)
    }
    if ((pay === 'Yape' || pay === 'Plin') && !code.trim()) return announce(`Escribe el código de aprobación de ${pay}.`)
    if (pay === 'Yape' && code.trim() === '000000') { announce('El pago con Yape fue rechazado. Tu compra no se realizó.'); return failPayment('Pago rechazado: tu compra no se realizó.') }
    const line = ship.line.trim()
    if (saveMain || !addr) {
      setAddresses(addr
        ? addresses.map((a) => (a.id === addr.id ? { ...a, line, district: ship.district, city: ship.city, ref: ship.ref.trim() } : a))
        : [{ id: 'a' + Date.now(), label: 'Casa', line, district: ship.district, city: ship.city, zip: '', ref: ship.ref.trim(), main: true }])
    }
    const order = placeOrder({ pay, address: `${line}, ${ship.district}, ${ship.city}${ship.ref.trim() ? ` (Ref.: ${ship.ref.trim()})` : ''}` })
    nav('/exito', { state: { id: order.id, card: null } })
    notify('¡Compra realizada!')
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 text-neutral-800">
      <div className="sr-only" role="status" aria-live="polite">{say}</div>

      <h1 className="text-2xl font-extrabold">Compra fácil</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Modo de compra sencillo para lectores de pantalla. Tiene tres pasos en una sola página: <b>1. Elegir productos</b>, <b>2. Revisar tu carrito</b> y <b>3. Entrega y pago</b>.
        Navega con la tecla H para saltar entre secciones o con Tab entre botones. Atajo desde cualquier página: Alt + Mayús + E.
      </p>
      <nav aria-label="Saltos rápidos" className="mt-3 flex flex-wrap gap-2 text-sm">
        <a href="#paso1" className="font-bold text-jar-700 underline">Ir a productos</a>
        <a href="#paso2" className="font-bold text-jar-700 underline">Ir al carrito ({cartCount})</a>
        <a href="#paso3" className="font-bold text-jar-700 underline">Ir a entrega y pago</a>
      </nav>

      <section id="paso1" aria-labelledby="h1" className="mt-8">
        <h2 id="h1" className="text-lg font-extrabold">1. Elegir productos</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="q" className="mb-1 block text-sm font-bold">Buscar por nombre</label><input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ejemplo: labial" className="w-full rounded-xl border-2 border-neutral-400 bg-white px-3 py-3 text-sm text-neutral-800" /></div>
          <div><label htmlFor="cat" className="mb-1 block text-sm font-bold">Categoría</label><select id="cat" value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-xl border-2 border-neutral-400 bg-white px-3 py-3 text-sm text-neutral-800">{['Todas', ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <p className="mt-3 text-sm" aria-live="polite">{list.length} {list.length === 1 ? 'producto encontrado' : 'productos encontrados'}.</p>
        <ul className="mt-3 space-y-3">
          {list.map((p) => (
            <li key={p.id} className="rounded-2xl border-2 border-neutral-300 bg-white p-4">
              <h3 className="text-base font-extrabold">{p.name}</h3>
              <p className="mt-1 text-sm">{p.cat} · {money(p.price)}{p.oldPrice ? ` (antes ${money(p.oldPrice)})` : ''} · {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}</p>
              <p className="mt-1 text-sm text-neutral-600">{p.desc}</p>
              <button onClick={() => add(p)} disabled={p.stock <= 0} aria-label={`Añadir ${p.name} al carrito, ${money(p.price)}`} className={`mt-3 ${bigBtn}`}>Añadir al carrito</button>
            </li>
          ))}
        </ul>
      </section>

      <section id="paso2" aria-labelledby="h2" className="mt-10">
        <h2 id="h2" className="text-lg font-extrabold">2. Tu carrito</h2>
        {!cartLines.length ? <p className="mt-2 text-sm">Tu carrito está vacío.</p> : (
          <>
            <ul className="mt-3 space-y-3">
              {cartLines.map((l) => (
                <li key={l.id} className="rounded-2xl border-2 border-neutral-300 bg-white p-4">
                  <h3 className="text-base font-extrabold">{l.product.name}</h3>
                  <p className="mt-1 text-sm">{l.qty} {l.qty === 1 ? 'unidad' : 'unidades'} · subtotal {money(l.product.price * l.qty)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => change(l, -1)} disabled={l.qty <= 1} aria-label={`Quitar una unidad de ${l.product.name}`} className={ghost}>− Quitar una</button>
                    <button onClick={() => change(l, 1)} aria-label={`Añadir una unidad de ${l.product.name}`} className={ghost}>+ Añadir una</button>
                    <button onClick={() => remove(l)} aria-label={`Eliminar ${l.product.name} del carrito`} className={ghost}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 rounded-2xl bg-jar-50 p-4 text-sm">
              <div className="flex justify-between py-0.5"><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
              <div className="flex justify-between py-0.5"><dt>Envío</dt><dd>{totals.shipping ? money(totals.shipping) : 'Gratis'}</dd></div>
              <div className="flex justify-between py-0.5"><dt>IGV</dt><dd>{money(totals.tax)}</dd></div>
              <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-extrabold"><dt>Total a pagar</dt><dd>{money(totals.total)}</dd></div>
            </dl>
          </>
        )}
      </section>

      <section id="paso3" aria-labelledby="h3" className="mt-10">
        <h2 id="h3" className="text-lg font-extrabold">3. Entrega y pago</h2>
        <form ref={formRef} onSubmit={confirm} noValidate className="mt-3 space-y-4">
          <fieldset className="space-y-3 rounded-2xl border-2 border-neutral-300 bg-white p-4 text-sm">
            <legend className="px-1 font-extrabold">Dirección de envío</legend>
            <p className="text-neutral-700">{addr ? <>Usamos tu dirección predeterminada ({addr.label}). Puedes cambiarla aquí solo para este pedido.</> : 'No tienes direcciones guardadas. Escribe una para este pedido; se guardará como tu dirección predeterminada.'}</p>
            <div>
              <label htmlFor="line" className="mb-1 block font-bold">Dirección (obligatoria)</label>
              <input id="line" name="line" autoComplete="street-address" value={ship.line} onChange={setShip('line')} required aria-required="true" aria-invalid={!!errs.line} aria-describedby={errs.line ? 'line-err' : undefined} className={field} />
              {errs.line && <p id="line-err" className="mt-1 font-semibold text-rose-700">{errs.line}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="district" className="mb-1 block font-bold">Distrito</label>
                <select id="district" name="district" value={ship.district} onChange={setShip('district')} aria-invalid={!!errs.district} aria-describedby={errs.district ? 'district-err' : undefined} className={field}>{withValue(DISTRICTS, ship.district).map((d) => <option key={d}>{d}</option>)}</select>
                {errs.district && <p id="district-err" className="mt-1 font-semibold text-rose-700">{errs.district}</p>}
              </div>
              <div>
                <label htmlFor="city" className="mb-1 block font-bold">Ciudad</label>
                <select id="city" name="city" value={ship.city} onChange={setShip('city')} aria-invalid={!!errs.city} aria-describedby={errs.city ? 'city-err' : undefined} className={field}>{withValue(CITIES, ship.city).map((d) => <option key={d}>{d}</option>)}</select>
                {errs.city && <p id="city-err" className="mt-1 font-semibold text-rose-700">{errs.city}</p>}
              </div>
            </div>
            <div><label htmlFor="ref" className="mb-1 block font-bold">Referencia (opcional)</label><input id="ref" name="ref" value={ship.ref} onChange={setShip('ref')} className={field} /></div>
            {addr && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2"><input type="checkbox" checked={saveMain} onChange={(e) => setSaveMain(e.target.checked)} className="h-5 w-5" />Guardar como mi dirección predeterminada</label>
                {edited && <button type="button" onClick={resetShip} className="font-bold text-jar-700 underline">Volver a la dirección predeterminada</button>}
              </div>
            )}
            {!addr && <p className="text-xs text-neutral-600">También puedes gestionar tus direcciones en <Link to="/cuenta/direcciones" className="font-bold text-jar-700 underline">Mi cuenta, Direcciones</Link>.</p>}
          </fieldset>
          <div>
            <label htmlFor="tel" className="mb-1 block text-sm font-bold">Teléfono de contacto</label>
            <input id="tel" name="tel" type="tel" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); if (errs.tel) setErrs({ ...errs, tel: undefined }) }} aria-invalid={!!errs.tel} aria-describedby={errs.tel ? 'tel-err' : undefined} className={field} />
            {errs.tel && <p id="tel-err" className="mt-1 text-sm font-semibold text-rose-700">{errs.tel}</p>}
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-bold">Método de pago</legend>
            {['Contra entrega', 'Yape', 'Plin'].map((m) => (
              <label key={m} className="flex items-center gap-3 rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm [&:not(:first-of-type)]:mt-2"><input type="radio" name="pay" checked={pay === m} onChange={() => setPay(m)} className="h-5 w-5" />{m}{m === 'Contra entrega' ? ' (pagas al recibir)' : ''}</label>
            ))}
            <p className="mt-2 text-xs text-neutral-500">¿Prefieres tarjeta? <Link to="/pagar" className="font-bold text-jar-700 underline">Ir al pago con tarjeta</Link></p>
          </fieldset>
          {(pay === 'Yape' || pay === 'Plin') && <div><label htmlFor="cod" className="mb-1 block text-sm font-bold">Código de aprobación de {pay}</label><input id="cod" name="cod" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} className={field} /></div>}
          <button type="submit" className={`w-full ${bigBtn}`}>Confirmar compra por {money(totals.total)}</button>
        </form>
      </section>
    </div>
  )
}
