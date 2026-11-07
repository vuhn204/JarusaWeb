import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Award, ChevronRight, Download, Gift, Heart, Package, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Badge, Check16, Pagination, ProductImg, download, usePaged } from '../../components/ui'
import { ProductModal } from '../Shop'
import { fmtDate, fmtTime, money, orderCode } from '../../data/mock'

export const useMyOrders = () => {
  const { orders, user } = useApp()
  return useMemo(() => orders.filter((o) => o.email === user?.email).sort((a, b) => new Date(b.date) - new Date(a.date)), [orders, user])
}

const Check = ({ ok }) => (
  <span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? 'bg-brand text-white' : 'bg-neutral-200'}`}>{ok && <svg width="9" height="9" viewBox="0 0 12 12"><path d="M2 6.5l3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
)

/* ───────────── RESUMEN (Dashboard) ───────────── */
export function Dashboard() {
  const { user, wishlist, products } = useApp()
  const nav = useNavigate()
  const mine = useMyOrders()
  const pts = user?.points || 0
  const next = pts < 500 ? 500 : 1000
  const tier = pts < 500 ? 'Jarusa Gold' : 'Jarusa Black'
  const wished = wishlist.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  const last = mine[0]

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr_340px]">
      <section className="card p-5 xl:col-span-1">
        <h2 className="mb-3 text-xs font-extrabold text-neutral-800">Resumen de Puntos</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => nav('/cuenta/pedidos')} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 text-left hover:bg-jar-50"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-neutral-500 shadow-sm"><Package size={16} /></span><span><span className="block text-[10px] text-neutral-500">Pedidos realizados</span><b className="text-2xl font-extrabold">{mine.length}</b></span></button>
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-neutral-500 shadow-sm"><Gift size={16} /></span><span><span className="block text-[10px] text-neutral-500">Puntos Jarusa</span><b className="text-2xl font-extrabold">{pts}</b></span></div>
        </div>
        {last && <p className="mt-3 text-[10px] text-neutral-400">Último pedido: {fmtDate(last.date)} · {last.status}</p>}
      </section>

      <section className="card flex items-center justify-between gap-4 p-5">
        <div className="flex-1">
          <h2 className="text-xs font-extrabold text-neutral-800">Tus Puntos de Fidelidad</h2>
          <b className="text-6xl font-extrabold leading-none text-neutral-300">{pts}</b>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100"><i className="block h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (pts / next) * 100)}%` }} /></div>
          <p className="mt-1.5 text-[10px] text-neutral-500">{Math.max(0, next - pts)} pts para tu próximo nivel · {tier}</p>
        </div>
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand text-white shadow-lg"><Award size={26} /></span>
      </section>

      <section className="card p-5 xl:row-span-2 xl:col-start-3 xl:row-start-1">
        <h2 className="mb-3 text-xs font-extrabold text-neutral-800">Recomendaciones para ti</h2>
        <Link to="/tienda" className="mb-5 flex items-center gap-3 rounded-xl bg-neutral-50 p-3 hover:bg-jar-50"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-neutral-500 shadow-sm"><Gift size={16} /></span><span><b className="block text-2xl font-extrabold leading-none">{products.filter((p) => p.tag === 'novedad' && !wishlist.includes(p.id)).length}</b><span className="text-[10px] text-neutral-500">nuevas recomendaciones</span></span></Link>
        <h2 className="mb-3 text-xs font-extrabold text-neutral-800">Mi Lista de Deseos</h2>
        <ul className="space-y-2">
          {wished.length === 0 && <li className="rounded-xl bg-neutral-50 p-4 text-center text-[11px] text-neutral-500"><Heart size={16} className="mx-auto mb-1 text-jar-400" />Aún no tienes favoritos.</li>}
          {wished.slice(0, 4).map((p) => (
            <li key={p.id}><Link to="/cuenta/deseos" className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2 hover:bg-jar-50"><ProductImg src={p.img} className="h-10 w-10 rounded-lg" /><span className="min-w-0 flex-1 text-[11px] leading-tight"><b className="block truncate">{p.name}</b><span className="text-neutral-500">{money(p.price)}</span></span><ChevronRight size={14} className="text-neutral-400" /></Link></li>
          ))}
        </ul>
      </section>

      <section className="card overflow-hidden xl:col-span-2">
        <div className="flex items-center justify-between p-5 pb-3"><h2 className="text-xs font-extrabold text-neutral-800">Mis Pedidos Recientes</h2><Link to="/cuenta/pedidos" className="text-[11px] font-bold text-jar-600 hover:underline">Ver todos</Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead><tr><th className="th">Nº Ped.</th><th className="th">Fecha</th><th className="th">Cliente</th><th className="th">Total</th><th className="th">Estado</th></tr></thead>
            <tbody>
              {mine.slice(0, 7).map((o) => (
                <tr key={o.id} onClick={() => nav(`/cuenta/pedidos/${o.id}`)} className="cursor-pointer border-t border-neutral-100 hover:bg-jar-50/50">
                  <td className="td font-bold">{orderCode(o.id)}</td><td className="td">{fmtDate(o.date)}</td><td className="td">{user.name.split(' ')[0]} {user.name.split(' ')[1]?.[0]}.</td><td className="td font-semibold">{money(o.total)}</td><td className="td"><Badge>{o.status}</Badge></td>
                </tr>
              ))}
              {mine.length === 0 && <tr><td colSpan={5} className="td py-8 text-center">Todavía no tienes pedidos. <Link to="/tienda" className="font-bold text-jar-600">Ir a la tienda</Link></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/* ───────────── MIS PEDIDOS (Listado) ───────────── */
const Sel = ({ value, onChange, children }) => <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-jar-200">{children}</select>

export function Orders() {
  const nav = useNavigate()
  const mine = useMyOrders()
  const [pay, setPay] = useState('')
  const [st, setSt] = useState('')
  const [days, setDays] = useState('30')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState([])

  const list = useMemo(() => mine.filter((o) => {
    if (pay && o.pay !== pay) return false
    if (st && o.status !== st) return false
    if (days !== 'all' && (Date.now() - new Date(o.date)) / 864e5 > +days) return false
    if (q && !orderCode(o.id).toLowerCase().includes(q.toLowerCase().replace('#', ''))) return false
    return true
  }), [mine, pay, st, days, q])
  const pg = usePaged(list, 10)
  const allOn = pg.slice.length > 0 && pg.slice.every((o) => sel.includes(o.id))


  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-neutral-800">MIS PEDIDOS</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-neutral-500">Filtrar:</span>
        <Sel value={pay} onChange={(v) => { setPay(v); pg.setPage(1) }}><option value="">Todos los pedidos</option><option>Visa</option><option>Yape</option><option>Plin</option><option>Contra entrega</option></Sel>
        <Sel value={st} onChange={(v) => { setSt(v); pg.setPage(1) }}><option value="">Estado</option><option>Entregado</option><option>En camino</option><option>Pendiente</option><option>Cancelado</option></Sel>
        <Sel value={days} onChange={(v) => { setDays(v); pg.setPage(1) }}><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="all">Todo el historial</option></Sel>
        <div className="relative ml-auto w-full max-w-[200px]"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={q} onChange={(e) => { setQ(e.target.value); pg.setPage(1) }} placeholder="Buscar" className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-jar-200" /></div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead className="bg-neutral-100"><tr><th className="th w-10"><Check16 on={allOn} onChange={(v) => setSel(v ? pg.slice.map((o) => o.id) : [])} label="Seleccionar todos" /></th><th className="th">ID pedido</th><th className="th">Fecha</th><th className="th">Total</th><th className="th">Estado</th><th className="th">Acción</th></tr></thead>
            <tbody>
              {pg.slice.map((o) => (
                <tr key={o.id} className={`border-t border-neutral-100 hover:bg-jar-50/40 ${sel.includes(o.id) ? 'bg-jar-50/60' : ''}`}>
                  <td className="td"><Check16 on={sel.includes(o.id)} onChange={(v) => setSel(v ? [...sel, o.id] : sel.filter((x) => x !== o.id))} label={`Seleccionar ${orderCode(o.id)}`} /></td>
                  <td className="td font-bold">{orderCode(o.id)}</td><td className="td">{fmtDate(o.date)}</td><td className="td font-semibold">{money(o.total)}</td><td className="td"><Badge>{o.status}</Badge></td>
                  <td className="td"><button onClick={() => nav(`/cuenta/pedidos/${o.id}`)} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-neutral-700 hover:text-jar-600">Ver Detalle <ChevronRight size={12} /></button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="td py-10 text-center">No hay pedidos con esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...pg} onPage={pg.setPage} />
      </div>
    </div>
  )
}

/* ───────────── DETALLE DEL PEDIDO (Consulta) ───────────── */
export function OrderDetail() {
  const { id } = useParams()
  const { orders, products, user, notify } = useApp()
  const [view, setView] = useState(null)
  const o = orders.find((x) => String(x.id) === id && x.email === user?.email)
  if (!o) return <Navigate to="/cuenta/pedidos" replace />

  const d = new Date(o.date)
  const at = (h) => { const x = new Date(d); x.setHours(x.getHours() + h); return fmtTime(x.toISOString()) }
  const stage = { Pendiente: 1, 'En camino': 3, Entregado: 4, Cancelado: 1 }[o.status]
  const steps = [['Pedido recibido', at(0)], ['Pedido en preparación', at(2)], ['Pedido en camino', at(20)], ['Pedido entregado', at(30)]]
  const lines = o.items.map((l) => ({ ...l, p: products.find((p) => p.id === l.id) })).filter((l) => l.p)

  const receipt = () => {
    const rows = lines.map((l) => `<tr><td>${l.p.name}</td><td>${l.qty}</td><td>${money(l.p.price * l.qty)}</td></tr>`).join('')
    download(`comprobante-${orderCode(o.id).replace('#', '')}.html`, `<!doctype html><meta charset="utf-8"><title>Comprobante ${orderCode(o.id)}</title><body style="font-family:sans-serif;max-width:480px;margin:30px auto"><h1 style="font-weight:400;color:#C8106C">Jarusa</h1><h3>Comprobante de pedido ${orderCode(o.id)}</h3><p>${o.customer} · ${fmtDate(o.date)}<br>${o.address} · ${o.pay}</p><table width="100%" cellpadding="6" border="1" style="border-collapse:collapse"><tr><th>Producto</th><th>Cant.</th><th>Total</th></tr>${rows}</table><p>Subtotal ${money(o.subtotal)}<br>Envío ${money(o.shipping)}<br>Impuestos ${money(o.tax)}<br><b>Total ${money(o.total)}</b></p></body>`, 'text/html')
    notify('Comprobante descargado')
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className="text-lg font-extrabold text-neutral-800">DETALLES DEL PEDIDO {orderCode(o.id).startsWith('#') ? orderCode(o.id) : '#' + orderCode(o.id)}</h1><Badge>{o.status}</Badge><Link to="/cuenta/pedidos" className="ml-auto text-[11px] font-bold text-jar-600 hover:underline">← Volver a mis pedidos</Link></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 text-xs font-extrabold">Resumen</h2>
            <table className="w-full"><thead><tr><th className="th pl-0">Producto</th><th className="th">Cant.</th><th className="th">Total</th><th className="th">Detalle</th></tr></thead>
              <tbody>{lines.map(({ p, qty }) => (
                <tr key={p.id} className="border-t border-neutral-100"><td className="td pl-0"><div className="flex items-center gap-3"><ProductImg src={p.img} className="h-10 w-10 rounded-lg" /><div><b className="block text-neutral-800">{p.name}</b><span className="text-[10px] text-neutral-400">{money(p.price)} c/u</span></div></div></td><td className="td">{qty}</td><td className="td font-semibold">{money(p.price * qty)}</td><td className="td"><button onClick={() => setView(p)} className="rounded-full border border-neutral-300 px-3 py-1 text-[10px] font-bold hover:border-jar-500 hover:text-jar-600">VER</button></td></tr>
              ))}</tbody></table>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 text-xs font-extrabold">Seguimiento</h2>
            {o.status === 'Cancelado' ? <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">Este pedido fue cancelado. Si ya se realizó un cobro, se reembolsará en 3–5 días hábiles.</p> : (
              <ol className="space-y-4">{steps.map(([t, when], i) => (
                <li key={t} className="flex items-start gap-3"><Check ok={i < stage} /><div className="text-xs leading-tight"><b className={i < stage ? 'text-neutral-800' : 'text-neutral-400'}>{t}</b><span className="block text-[10px] text-neutral-400">{i < stage ? when : 'Pendiente'}</span></div></li>
              ))}</ol>
            )}
          </section>
        </div>
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="mb-3 text-xs font-extrabold">Detalles del Pedido</h2>
            <dl className="space-y-2 text-[11px]">{[['Cliente', o.customer], ['Fecha', fmtDate(o.date)], ['Dirección', o.address], ['Pago', o.pay === 'Visa' ? 'Visa •••• 4821' : o.pay]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-neutral-500">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}<div className="flex items-center justify-between"><dt className="text-neutral-500">Estado</dt><dd><Badge>{o.status}</Badge></dd></div></dl>
          </section>
          <section className="card flex flex-col p-5">
            <h2 className="mb-3 text-xs font-extrabold">Total del Pedido</h2>
            <dl className="space-y-1.5 text-[11px] text-neutral-600">{[['Subtotal', o.subtotal], ['Envío', o.shipping], ['Impuestos', o.tax]].map(([k, v]) => <div key={k} className="flex justify-between"><dt>{k}</dt><dd className="font-semibold">{money(v)}</dd></div>)}{o.discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Descuento</dt><dd>− {money(o.discount)}</dd></div>}</dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-neutral-100 pt-3"><span className="text-xs font-bold">Total</span><b className="text-2xl font-extrabold">{money(o.total)}</b></div>
            <button onClick={receipt} className="btn mt-5 w-full"><Download size={13} />DESCARGAR COMPROBANTE</button>
          </section>
        </div>
      </div>
      <ProductModal key={view?.id} product={view} onClose={() => setView(null)} />
    </div>
  )
}
