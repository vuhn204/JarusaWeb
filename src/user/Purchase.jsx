import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Check, Lock, Minus, Plus, ShieldCheck, Trash2, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SubNav from '../components/SubNav'
import { Field, ProductImg } from '../components/ui'
import { CATEGORIES, DISTRICTS, CITIES, fmtDate, money, orderCode } from '../data/mock'

const FREE_FROM = 100

/* ───────────────────────── CARRITO ───────────────────────── */
export function Cart() {
  const { cartLines, cartCount, totals, setQty, removeFromCart, applyCoupon, coupon, products, cart, addToCart } = useApp()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const sub = totals.subtotal
  const missing = Math.max(0, FREE_FROM - sub)
  const suggestions = products.filter((p) => !cart.some((l) => l.id === p.id) && p.stock > 0).slice(0, 3)

  return (
    <div className="bg-jar-50/70">
      <SubNav active="oferta" categories={CATEGORIES} />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="mb-4 text-lg font-extrabold text-neutral-800">MI CARRITO <span className="ml-1 text-[11px] font-medium text-neutral-400">{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span></h1>

          {cartLines.length === 0 ? (
            <div className="card grid place-items-center gap-3 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-jar-50 text-jar-500"><Trash2 size={22} /></span>
              <p className="text-sm font-bold text-neutral-700">Tu carrito está vacío</p>
              <p className="text-xs text-neutral-500">Añade productos desde la tienda para verlos aquí.</p>
              <Link to="/tienda" className="btn">IR A LA TIENDA</Link>
            </div>
          ) : (
            <>
              <div className="card mb-4 p-3.5">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-neutral-600">{missing > 0 ? <>Te faltan <b>{money(missing)}</b> para tener envío gratis</> : <b className="text-emerald-600">¡Tienes envío gratis!</b>}</span>
                  <span className="text-neutral-400">{money(sub)} / {money(FREE_FROM)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100"><i className="block h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (sub / FREE_FROM) * 100)}%` }} /></div>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-100"><tr><th className="th">Producto</th><th className="th text-center">Cant.</th><th className="th hidden sm:table-cell">Precio</th><th className="th">Total</th><th /></tr></thead>
                  <tbody>
                    {cartLines.map(({ product: p, qty }) => (
                      <tr key={p.id} className="border-t border-neutral-100">
                        <td className="td"><div className="flex items-center gap-3"><ProductImg src={p.img} className="h-12 w-12 rounded-lg" /><div><b className="block text-neutral-800">{p.name}</b><span className="text-[10px] text-neutral-400">{p.cat} · {p.sku}</span></div></div></td>
                        <td className="td"><div className="mx-auto flex w-fit items-center rounded-full border border-neutral-200"><button onClick={() => (qty > 1 ? setQty(p.id, qty - 1) : removeFromCart(p.id))} className="grid h-7 w-7 place-items-center" aria-label="Menos"><Minus size={11} /></button><span className="w-5 text-center font-bold">{qty}</span><button onClick={() => setQty(p.id, Math.min(p.stock, qty + 1))} className="grid h-7 w-7 place-items-center" aria-label="Más"><Plus size={11} /></button></div></td>
                        <td className="td hidden sm:table-cell">{money(p.price)}</td>
                        <td className="td font-bold">{money(p.price * qty)}</td>
                        <td className="td"><button onClick={() => removeFromCart(p.id)} className="text-neutral-400 hover:text-jar-600" aria-label={`Quitar ${p.name}`}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {suggestions.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 text-[11px] font-extrabold tracking-wider text-neutral-800">TE PUEDE GUSTAR</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestions.map((p) => (
                  <div key={p.id} className="card flex items-center gap-2.5 p-2.5">
                    <ProductImg src={p.img} className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 text-[11px] leading-tight"><b className="line-clamp-2 text-neutral-800">{p.name}</b><span className="text-neutral-500">{money(p.price)}</span></div>
                    <button onClick={() => addToCart(p.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white shadow" aria-label={`Añadir ${p.name}`}><Plus size={13} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
          <Link to="/tienda" className="mt-5 inline-block text-[11px] font-bold text-jar-600 hover:underline">← Seguir comprando</Link>
        </div>

        <aside className="card h-fit p-5">
          <h2 className="mb-3 text-sm font-extrabold text-neutral-800">Resumen del pedido</h2>
          <dl className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between"><dt>Subtotal ({cartCount} productos)</dt><dd className="font-semibold">{money(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Envío</dt><dd className="font-semibold">{totals.shipping === 0 ? 'Gratis' : money(totals.shipping)}</dd></div>
            <div className="flex justify-between"><dt>Impuestos</dt><dd className="font-semibold">{money(totals.tax)}</dd></div>
            {totals.discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Cupón {coupon.code}</dt><dd className="font-semibold">− {money(totals.discount)}</dd></div>}
          </dl>
          <div className="my-3 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de cupón" className="input" aria-label="Código de cupón" />
            <button onClick={() => applyCoupon(code)} className="btn-outline !px-4">APLICAR</button>
          </div>
          <div className="flex items-baseline justify-between border-t border-neutral-100 pt-3"><span className="text-xs font-bold">Total</span><b className="text-2xl font-extrabold text-neutral-800">{money(totals.total)}</b></div>
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-[10px] text-neutral-600"><Zap size={11} className="text-jar-600" />Ganarás {Math.round(totals.total)} puntos Jarusa con esta compra</p>
          <button disabled={!cartLines.length} onClick={() => nav('/pagar')} className="btn mt-4 w-full">PROCEDER AL PAGO</button>
          <p className="mt-3 text-center text-[10px] text-neutral-400">Pago 100% seguro · Envíos a todo el Perú</p>
        </aside>
      </div>
    </div>
  )
}

/* ───────────────────────── PAGO ───────────────────────── */
export const Stepper = ({ step }) => (
  <ol className="flex items-center gap-2 text-[11px] font-semibold text-neutral-500">
    {['Carrito', 'Pago', 'Confirmación'].map((s, i) => {
      const done = i < step, now = i === step
      return (
        <li key={s} className="flex items-center gap-2">
          <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-extrabold ${done ? 'bg-brand text-white' : now ? 'bg-brand text-white ring-4 ring-jar-200' : 'bg-neutral-200 text-neutral-500'}`}>{done ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
          <span className={now || done ? 'text-neutral-800' : ''}>{s}</span>
          {i < 2 && <i className={`h-px w-8 ${i < step ? 'bg-jar-500' : 'bg-neutral-300'}`} />}
        </li>
      )
    })}
  </ol>
)

export function Checkout() {
  const { user, cartLines, cartCount, totals, placeOrder, addresses, notify, failPayment, shipDraft, setShipDraft } = useApp()
  const nav = useNavigate()
  const a = shipDraft || addresses.find((x) => x.main) || addresses[0] || {}
  const [edit, setEdit] = useState(false)
  const [ship, setShipState] = useState({ name: user?.first ? `${user.first} ${user.last}` : user?.name || '', phone: user?.phone || '', line: a.line || '', district: a.district || DISTRICTS[0], city: a.city || CITIES[0], ref: a.ref || '' })
  const setShip = (next) => { setShipState(next); setShipDraft({ line: next.line, district: next.district, city: next.city, ref: next.ref }) }
  const [pay, setPay] = useState('Tarjeta')
  const [card, setCard] = useState({ num: '4532 1234 5678 4821', holder: `${user?.first || ''} ${user?.last || ''}`.trim(), exp: '08 / 27', cvv: '' })
  const [yape, setYape] = useState({ phone: user?.phone || '', op: '' })
  const [terms, setTerms] = useState(true)
  const [err, setErr] = useState('')
  const done = useRef(false)
  const set = (k) => (e) => { setShip({ ...ship, [k]: e.target.value }); setErr('') }

  if (!cartLines.length && !done.current) return <Navigate to="/carrito" replace />

  const submit = () => {
    if (!ship.name || !ship.line || !ship.phone) return setErr('Completa nombre, teléfono y dirección de envío.')
    if (pay === 'Tarjeta' && (card.num.replace(/\D/g, '').length < 16 || card.cvv.length < 3)) return setErr('Revisa el número de tarjeta y escribe el CVV (3 dígitos).')
    if ((pay === 'Yape' || pay === 'Plin') && !yape.op.trim()) return setErr(`Escribe el código de aprobación de ${pay}.`)
    if (!terms) return setErr('Debes aceptar los Términos y Condiciones.')
    // Demo: una tarjeta terminada en 0000 simula un pago rechazado
    if (pay === 'Tarjeta' && card.num.replace(/\D/g, '').endsWith('0000')) { setErr('Tu banco rechazó el pago. Prueba con otra tarjeta o con Yape.'); return failPayment('Pago rechazado por el banco: tu compra no se realizó.') }
    const method = pay === 'Tarjeta' ? 'Visa' : pay === 'Contra entrega' ? 'Contra entrega' : pay
    done.current = true
    const order = placeOrder({ pay: method, address: `${ship.line}, ${ship.district}` })
    nav('/exito', { state: { id: order.id, card: pay === 'Tarjeta' ? card.num.slice(-4) : null } })
    notify('¡Pago realizado!')
  }

  return (
    <div className="bg-jar-50/70">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-lg font-extrabold text-neutral-800">FINALIZAR COMPRA</h1><Stepper step={1} /></div>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5">
            <section className="card p-5">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-extrabold text-neutral-800">1 · Dirección de envío</h2><button onClick={() => setEdit(!edit)} className="text-[11px] font-bold text-jar-600 hover:underline">{edit ? 'Listo' : 'Editar'}</button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombres"><input className="input disabled:bg-neutral-50" disabled={!edit} value={ship.name} onChange={set('name')} /></Field>
                <Field label="Teléfono"><input className="input disabled:bg-neutral-50" disabled={!edit} value={ship.phone} onChange={set('phone')} /></Field>
                <Field label="Dirección" className="sm:col-span-2"><input className="input disabled:bg-neutral-50" disabled={!edit} value={ship.line} onChange={set('line')} /></Field>
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                  <Field label="Distrito"><select className="input disabled:bg-neutral-50" disabled={!edit} value={ship.district} onChange={set('district')}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
                  <Field label="Ciudad"><select className="input disabled:bg-neutral-50" disabled={!edit} value={ship.city} onChange={set('city')}>{CITIES.map((d) => <option key={d}>{d}</option>)}</select></Field>
                  <Field label="Referencia"><input className="input disabled:bg-neutral-50" disabled={!edit} value={ship.ref} onChange={set('ref')} /></Field>
                </div>
              </div>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 text-xs font-extrabold text-neutral-800">2 · Método de pago</h2>
              <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {['Tarjeta', 'Yape', 'Plin', 'Contra entrega'].map((m) => (
                  <button key={m} role="radio" aria-checked={pay === m} onClick={() => { setPay(m); setErr('') }} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${pay === m ? 'border-jar-500 bg-jar-50 text-jar-800 shadow-sm' : 'border-neutral-200 text-neutral-600 hover:border-jar-300'}`}>
                    <i className={`grid h-3.5 w-3.5 place-items-center rounded-full border ${pay === m ? 'border-jar-600' : 'border-neutral-300'}`}>{pay === m && <b className="h-1.5 w-1.5 rounded-full bg-jar-600" />}</i>{m}
                  </button>
                ))}
              </div>
              {pay === 'Tarjeta' && (
                <div className="pop mt-4 grid gap-3 sm:grid-cols-3">
                  <Field label="Número de tarjeta" className="sm:col-span-3"><input className="input" inputMode="numeric" value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} /></Field>
                  <Field label="Titular de la tarjeta"><input className="input" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value })} /></Field>
                  <Field label="Vencimiento"><input className="input" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} /></Field>
                  <Field label="CVV"><input className="input" type="password" inputMode="numeric" maxLength={3} placeholder="•••" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} /></Field>
                </div>
              )}
              {(pay === 'Yape' || pay === 'Plin') && (
                <div className="pop mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
                  <div className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-jar-300 bg-jar-50 text-center text-[10px] font-bold text-jar-400">QR {pay}<br />(espacio)</div>
                  <div className="space-y-3">
                    <p className="text-[11px] text-neutral-600">Yapea o plinea <b>{money(totals.total)}</b> al <b>987 654 321</b> (Jarusa SAC) y escribe el código de aprobación.</p>
                    <Field label="Tu celular"><input className="input" value={yape.phone} onChange={(e) => setYape({ ...yape, phone: e.target.value })} /></Field>
                    <Field label="Código de aprobación"><input className="input" placeholder="Ej. 123456" value={yape.op} onChange={(e) => { setYape({ ...yape, op: e.target.value }); setErr('') }} /></Field>
                  </div>
                </div>
              )}
              {pay === 'Contra entrega' && <p className="pop mt-4 rounded-xl bg-neutral-100 p-3 text-[11px] text-neutral-600">Pagarás <b>{money(totals.total)}</b> en efectivo al recibir tu pedido. Ten el monto exacto, por favor.</p>}
            </section>
            <Link to="/carrito" className="inline-block text-[11px] font-bold text-jar-600 hover:underline">← Volver al carrito</Link>
          </div>

          <aside className="card h-fit p-5">
            <h2 className="mb-3 text-sm font-extrabold text-neutral-800">Tu pedido</h2>
            <ul className="space-y-3">
              {cartLines.map(({ product: p, qty }) => (
                <li key={p.id} className="flex items-center gap-3"><ProductImg src={p.img} className="h-10 w-10 rounded-lg" /><div className="min-w-0 flex-1 text-[11px] leading-tight"><b className="block truncate">{p.name}</b><span className="text-neutral-500">Cant. {qty}</span></div><b className="text-xs">{money(p.price * qty)}</b></li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Envío</dt><dd>{totals.shipping === 0 ? 'Gratis' : money(totals.shipping)}</dd></div>
              <div className="flex justify-between"><dt>Impuestos</dt><dd>{money(totals.tax)}</dd></div>
              {totals.discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Descuento</dt><dd>− {money(totals.discount)}</dd></div>}
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-neutral-100 pt-3"><span className="text-xs font-bold">Total a pagar</span><b className="text-2xl font-extrabold">{money(totals.total)}</b></div>
            {err && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{err}</p>}
            <button onClick={submit} className="btn mt-4 w-full">PAGAR {money(totals.total)}</button>
            <label className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-600"><input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); setErr('') }} className="accent-jar-600" />Acepto los Términos y Condiciones</label>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-neutral-400"><Lock size={10} />Pago 100% seguro y encriptado · {cartCount} {cartCount === 1 ? 'producto' : 'productos'}</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── COMPRA EXITOSA ───────────────────────── */
export function Success() {
  const { state } = useLocation()
  const { orders, user } = useApp()
  const nav = useNavigate()
  const o = orders.find((x) => x.id === state?.id)
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t) }, [])
  if (!o) return <Navigate to="/tienda" replace />
  const est = (n) => { const d = new Date(o.date); d.setDate(d.getDate() + n); return d.getDate() }
  const mon = new Date(o.date).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }).replace('.', '')
  const rows = [['Nº de pedido', orderCode(o.id)], ['Fecha', fmtDate(o.date)], ['Método de pago', state.card ? `Visa •••• ${state.card}` : o.pay], ['Entrega estimada', `${est(1)} – ${est(3)} ${mon}`]]
  return (
    <div className="relative overflow-hidden bg-neutral-100">
      <span className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-neutral-200" /><span className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-neutral-200" />
      {[[10, 30], [22, 60], [30, 20], [75, 25], [85, 55], [68, 75], [18, 80]].map(([l, t], i) => <i key={i} className="absolute h-2 w-2 rounded-full bg-neutral-400/70" style={{ left: `${l}%`, top: `${t}%` }} />)}
      <div className="relative z-10 flex justify-center bg-white/60 py-4"><Stepper step={3} /></div>
      <div className="relative z-10 grid place-items-center px-4 py-8">
        <div className={`w-full max-w-[400px] rounded-2xl bg-white p-6 text-center shadow-pop transition-all duration-500 ${on ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
          <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-jar-100"><span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white shadow-lg"><Check size={22} strokeWidth={3} /></span></span>
          <h1 className="text-lg font-extrabold text-neutral-800">¡COMPRA REALIZADA CON ÉXITO!</h1>
          <p className="mx-auto mt-1 max-w-[290px] text-[11px] text-neutral-500">Gracias por tu compra, {user?.name?.split(' ')[0]}. Te enviamos el comprobante a {user?.email}</p>
          <dl className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-3 text-xs">
            {rows.map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-neutral-500">{k}</dt><dd className="font-semibold text-neutral-800">{v}</dd></div>)}
            <div className="flex items-baseline justify-between border-t border-neutral-200 pt-2"><dt className="font-bold">Total pagado</dt><dd className="text-lg font-extrabold">{money(o.total)}</dd></div>
          </dl>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[10px] text-neutral-600"><ShieldCheck size={11} className="text-jar-600" />+{Math.round(o.total)} puntos Jarusa sumados a tu cuenta</p>
          <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => nav(`/cuenta/pedidos/${o.id}`)} className="btn !px-2">VER MI PEDIDO</button><button onClick={() => nav('/tienda')} className="btn-outline !px-2">SEGUIR COMPRANDO</button></div>
        </div>
      </div>
    </div>
  )
}
