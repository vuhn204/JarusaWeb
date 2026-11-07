import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, Badge, Check16, Modal, Pagination, ProductImg, download, usePaged } from '../components/ui'
import { AreaChart, Donut } from '../components/Shell'
import { MONTHLY, MONTHS, PAYMENTS, STATUSES, fmtDate, money, orderCode } from '../data/mock'
import { useAdminOrders } from './AdminPanel'

const TABS = [['Todos', ''], ['Pendientes', 'Pendiente'], ['En camino', 'En camino'], ['Entregados', 'Entregado'], ['Cancelados', 'Cancelado']]

/* ───────────── PEDIDOS ───────────── */
export function AdminOrders() {
  const { products, setOrderStatus, notify } = useApp()
  const { state } = useLocation()
  const all = useAdminOrders()
  const [tab, setTab] = useState('')
  const [q, setQ] = useState('')
  const [days, setDays] = useState('30')
  const [pay, setPay] = useState('')
  const [sel, setSel] = useState([])
  const [openId, setOpenId] = useState(state?.open || null)

  const list = useMemo(() => all.filter((o) => {
    if (tab && o.status !== tab) return false
    if (pay && o.pay !== pay) return false
    if (days !== 'all' && (Date.now() - new Date(o.date)) / 864e5 > +days) return false
    if (q && !(o.customer + orderCode(o.id)).toLowerCase().includes(q.toLowerCase().replace('#', ''))) return false
    return true
  }), [all, tab, pay, days, q])
  const pg = usePaged(list, 8)
  const count = (s) => (s ? all.filter((o) => o.status === s).length : all.length)
  const open = all.find((o) => o.id === openId)
  const reset = (fn) => (e) => { fn(e.target.value); pg.setPage(1) }

  const exportCsv = () => {
    const rows = [['Pedido', 'Cliente', 'Fecha', 'Total', 'Pago', 'Estado'], ...list.map((o) => [orderCode(o.id), o.customer, fmtDate(o.date), o.total.toFixed(2), o.pay, o.status])]
    download('pedidos-jarusa.csv', rows.map((r) => r.join(',')).join('\n'), 'text/csv')
    notify(`Exportados ${list.length} pedidos`)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-lg font-extrabold text-neutral-800">GESTIÓN DE PEDIDOS</h1><button onClick={exportCsv} className="btn-outline"><Download size={13} />EXPORTAR</button></div>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([label, s]) => (
          <button key={label} role="tab" aria-selected={tab === s} onClick={() => { setTab(s); pg.setPage(1) }} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${tab === s ? 'bg-brand text-white shadow' : 'bg-white text-neutral-600 hover:bg-jar-50'}`}>{label}<span className={`rounded-full px-1.5 text-[9px] ${tab === s ? 'bg-white/25' : 'bg-neutral-100'}`}>{count(s)}</span></button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={q} onChange={reset(setQ)} placeholder="Buscar por cliente o Nº de pedido…" className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-jar-200" /></div>
        <select value={days} onChange={reset(setDays)} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-[11px] font-medium"><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="all">Todo</option></select>
        <select value={pay} onChange={reset(setPay)} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-[11px] font-medium"><option value="">Método de pago</option>{PAYMENTS.map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead className="bg-neutral-100"><tr><th className="th w-10"><Check16 on={pg.slice.length > 0 && pg.slice.every((o) => sel.includes(o.id))} onChange={(v) => setSel(v ? pg.slice.map((o) => o.id) : [])} label="Seleccionar todos" /></th><th className="th">Nº Ped.</th><th className="th">Cliente</th><th className="th">Fecha</th><th className="th">Total</th><th className="th">Pago</th><th className="th">Estado</th><th className="th">Acción</th></tr></thead>
            <tbody>
              {pg.slice.map((o) => (
                <tr key={o.id} className="border-t border-neutral-100 hover:bg-jar-50/40">
                  <td className="td"><Check16 on={sel.includes(o.id)} onChange={(v) => setSel(v ? [...sel, o.id] : sel.filter((x) => x !== o.id))} label={`Seleccionar ${orderCode(o.id)}`} /></td>
                  <td className="td font-bold">{orderCode(o.id)}</td>
                  <td className="td"><div className="flex items-center gap-2"><Avatar name={o.customer} size="h-6 w-6" text="text-[8px]" /><b>{o.customer}</b></div></td>
                  <td className="td">{fmtDate(o.date)}</td><td className="td font-semibold">{money(o.total)}</td><td className="td">{o.pay}</td>
                  <td className="td"><select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} aria-label={`Estado del pedido ${orderCode(o.id)}`} className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold focus:outline-none focus:ring-2 focus:ring-jar-200">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className="td"><button onClick={() => setOpenId(o.id)} className="text-[11px] font-semibold hover:text-jar-600">Ver detalle</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="td py-10 text-center">No hay pedidos con esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...pg} onPage={pg.setPage} />
      </div>

      <Modal open={!!open} onClose={() => setOpenId(null)} title={open ? `Pedido ${orderCode(open.id)}` : ''} width="max-w-lg">
        {open && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between"><div><b>{open.customer}</b><p className="text-[11px] text-neutral-500">{open.email} · {fmtDate(open.date)}</p></div><Badge>{open.status}</Badge></div>
            <ul className="space-y-2">{open.items.map((l) => { const p = products.find((x) => x.id === l.id); return p && <li key={l.id} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-2"><ProductImg src={p.img} className="h-10 w-10 rounded-lg" /><span className="flex-1"><b className="block">{p.name}</b><span className="text-neutral-500">Cant. {l.qty}</span></span><b>{money(p.price * l.qty)}</b></li> })}</ul>
            <dl className="space-y-1 text-neutral-600"><div className="flex justify-between"><dt>Dirección</dt><dd className="text-right font-semibold">{open.address}</dd></div><div className="flex justify-between"><dt>Pago</dt><dd className="font-semibold">{open.pay}</dd></div><div className="flex justify-between"><dt>Subtotal / Envío / Imp.</dt><dd>{money(open.subtotal)} / {money(open.shipping)} / {money(open.tax)}</dd></div><div className="flex justify-between border-t border-neutral-100 pt-2 text-sm"><dt className="font-bold">Total</dt><dd className="font-extrabold">{money(open.total)}</dd></div></dl>
            <div><span className="label">Cambiar estado</span><div className="flex flex-wrap gap-2">{STATUSES.map((s) => <button key={s} onClick={() => setOrderStatus(open.id, s)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${open.status === s ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-jar-50'}`}>{s}</button>)}</div></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ───────────── CLIENTES ───────────── */
export function AdminCustomers() {
  const { users } = useApp()
  const orders = useAdminOrders()
  const rows = useMemo(() => {
    const map = {}
    orders.forEach((o) => { const c = (map[o.email] ||= { email: o.email, name: o.customer, n: 0, total: 0, last: o.date }); c.n++; c.total += o.status === 'Cancelado' ? 0 : o.total; if (o.date > c.last) c.last = o.date })
    users.filter((u) => u.role === 'user').forEach((u) => { map[u.email] ||= { email: u.email, name: u.name, n: 0, total: 0, last: null }; map[u.email].name = u.name })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [orders, users])
  const pg = usePaged(rows, 8)
  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-neutral-800">CLIENTES</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full min-w-[560px]">
          <thead className="bg-neutral-100"><tr><th className="th">Cliente</th><th className="th">Correo</th><th className="th">Pedidos</th><th className="th">Total comprado</th><th className="th">Último pedido</th></tr></thead>
          <tbody>{pg.slice.map((c) => <tr key={c.email} className="border-t border-neutral-100"><td className="td"><div className="flex items-center gap-2"><Avatar name={c.name} size="h-7 w-7" text="text-[9px]" /><b>{c.name}</b></div></td><td className="td">{c.email}</td><td className="td">{c.n}</td><td className="td font-semibold">{money(c.total)}</td><td className="td">{c.last ? fmtDate(c.last) : '—'}</td></tr>)}</tbody>
        </table></div>
        <Pagination {...pg} onPage={pg.setPage} noun="clientes" />
      </div>
    </div>
  )
}

/* ───────────── REPORTES ───────────── */
export function AdminReports() {
  const { products } = useApp()
  const orders = useAdminOrders().filter((o) => o.status !== 'Cancelado')
  const colors = { Labiales: 'rgb(var(--b1))', Ojos: 'rgb(var(--b2))', Rostro: 'rgb(var(--jar-300))', Uñas: 'rgb(var(--jar-800))', Otros: 'rgb(var(--jar-200))' }
  const { cats, top } = useMemo(() => {
    const c = {}, t = {}
    orders.forEach((o) => o.items.forEach((l) => { const p = products.find((x) => x.id === l.id); if (!p) return; c[p.cat] = (c[p.cat] || 0) + p.price * l.qty; t[p.id] = (t[p.id] || 0) + l.qty }))
    return { cats: Object.entries(c).map(([label, v]) => ({ label, v, color: colors[label] || '#ccc' })), top: Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ p: products.find((x) => x.id === id), n })) }
  }, [orders, products])
  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-neutral-800">REPORTES</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-3 text-xs font-extrabold">Ventas mensuales</h2><AreaChart values={MONTHLY.map((v) => v * 30)} labels={MONTHS} /></section>
        <section className="card p-5"><h2 className="mb-4 text-xs font-extrabold">Ventas por categoría</h2><Donut data={cats} center={orders.length} sub="pedidos" /></section>
        <section className="card p-5 lg:col-span-2"><h2 className="mb-3 text-xs font-extrabold">Productos más vendidos</h2>
          <ul className="space-y-2">{top.map(({ p, n }, i) => <li key={p.id} className="flex items-center gap-3 text-xs"><b className="w-4 text-neutral-400">{i + 1}</b><ProductImg src={p.img} className="h-9 w-9 rounded-lg" /><span className="flex-1 font-semibold">{p.name}</span><span className="text-neutral-500">{n} uds</span></li>)}</ul></section>
      </div>
    </div>
  )
}
