import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Box, DollarSign, Eye, ImagePlus, Pencil, Plus, Search, Settings, Trash2, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, Check16, Field, Modal, Pagination, ProductImg, readImage, usePaged } from '../components/ui'
import { Bars } from '../components/Shell'
import { CATEGORIES, WEEKLY, money, orderCode, stockState } from '../data/mock'

export const useAdminOrders = () => {
  const { orders } = useApp()
  return useMemo(() => orders.filter((o) => o.id >= 1000).sort((a, b) => b.id - a.id), [orders])
}

/* ───────────── PANEL ───────────── */
export function AdminPanel() {
  const { products, users } = useApp()
  const nav = useNavigate()
  const orders = useAdminOrders()
  const fresh = orders.filter((o) => o.id > 1008)
  const low = products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock)
  const Kpi = ({ t, v, s, icon }) => (
    <div className="card flex items-start justify-between p-4"><div><p className="text-[10px] text-neutral-500">{t}</p><b className="text-2xl font-extrabold text-neutral-800">{v}</b><p className="text-[10px] text-neutral-500">{s}</p></div><span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-500">{icon}</span></div>
  )
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-lg font-extrabold text-neutral-800">PANEL DE ADMINISTRACIÓN</h1><select aria-label="Periodo" className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-medium"><option>Últimos 30 días</option><option>Últimos 90 días</option></select></div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi t="Ventas del mes" v={money(12480 + fresh.reduce((s, o) => s + o.total, 0)).replace('.00', '')} s="+12% vs. mes anterior" icon={<DollarSign size={14} />} />
        <Kpi t="Pedidos nuevos" v={38 + fresh.length} s="+8% vs. mes anterior" icon={<Box size={14} />} />
        <Kpi t="Productos activos" v={products.filter((p) => p.stock > 0).length} s={`${low.length} con stock bajo`} icon={<Settings size={14} />} />
        <Kpi t="Clientes registrados" v={856 + users.filter((u) => u.role === 'user').length - 1} s="+5% vs. mes anterior" icon={<Users size={14} />} />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="card p-5">
          <div className="mb-3 flex items-start justify-between"><h2 className="text-xs font-extrabold">Ventas semanales</h2><span className="text-right text-[10px] text-neutral-500"><b className="block text-sm text-neutral-800">S/ 2,140</b>S/ 12,480 este mes</span></div>
          <Bars data={WEEKLY} />
        </section>
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-extrabold">Stock bajo</h2><button onClick={() => nav('/admin/productos', { state: { estado: 'low' } })} className="text-[11px] font-bold text-jar-600 hover:underline">Ver todos</button></div>
          <ul className="space-y-2.5">
            {low.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center gap-3"><ProductImg src={p.img} className="h-9 w-9 rounded-lg" /><div className="min-w-0 flex-1 text-[11px] leading-tight"><b className="block truncate">{p.name}</b><span className="text-neutral-400">{p.sku}</span></div><Badge>{p.stock === 0 ? 'Agotado' : 'Stock bajo'}</Badge><span className="w-14 text-right text-[10px] font-semibold text-neutral-500">{p.stock === 0 ? 'Agotado' : `Quedan ${p.stock}`}</span></li>
            ))}
            {low.length === 0 && <li className="py-6 text-center text-xs text-neutral-500">Todo el inventario está al día 🎉</li>}
          </ul>
        </section>
      </div>
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3"><h2 className="text-xs font-extrabold">Pedidos recientes</h2><button onClick={() => nav('/admin/pedidos')} className="text-[11px] font-bold text-jar-600 hover:underline">Ver todos los pedidos</button></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]"><thead><tr><th className="th">Nº Ped.</th><th className="th">Cliente</th><th className="th">Productos</th><th className="th">Total</th><th className="th">Estado</th><th className="th">Acción</th></tr></thead>
            <tbody>{orders.slice(0, 3).map((o) => (
              <tr key={o.id} className="border-t border-neutral-100"><td className="td font-bold">{orderCode(o.id)}</td><td className="td font-semibold">{o.customer}</td><td className="td max-w-[200px] truncate">{o.items.map((l) => { const p = products.find((x) => x.id === l.id); return p ? `${p.name.split(' ').slice(0, 3).join(' ')}${l.qty > 1 ? ' × ' + l.qty : ''}` : '' }).join(', ')}</td><td className="td font-semibold">{money(o.total)}</td><td className="td"><Badge>{o.status}</Badge></td><td className="td"><button onClick={() => nav('/admin/pedidos', { state: { open: o.id } })} className="text-[11px] font-semibold hover:text-jar-600">Ver detalle</button></td></tr>
            ))}</tbody></table>
        </div>
      </section>
    </div>
  )
}

/* ───────────── PRODUCTOS ───────────── */
const EMPTY = { name: '', sku: '', cat: 'Labiales', price: '', stock: '', desc: '', img: '' }

function ProductForm({ initial, onClose }) {
  const { saveProduct, notify } = useApp()
  const [f, setF] = useState(initial?.id ? { ...initial } : EMPTY)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return notify('Escribe el nombre del producto', 'err')
    if (!(+f.price > 0)) return notify('El precio debe ser mayor a 0', 'err')
    if (!(+f.stock >= 0) || f.stock === '') return notify('Indica el stock disponible', 'err')
    saveProduct({ ...f, price: +f.price, stock: Math.floor(+f.stock) })
    onClose()
  }
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[150px_1fr]">
      <label className="grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-jar-300 bg-jar-50 text-center text-[10px] font-bold text-jar-400 hover:border-jar-500">
        {f.img ? <img src={f.img} alt="" className="h-full w-full object-cover" /> : <span className="grid place-items-center gap-1"><ImagePlus size={22} />Subir foto</span>}
        <input type="file" accept="image/*" hidden onChange={async (e) => e.target.files[0] && setF({ ...f, img: await readImage(e.target.files[0]) })} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre" className="sm:col-span-2"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="SKU (opcional)"><input className="input" placeholder="JR 0700" value={f.sku} onChange={set('sku')} /></Field>
        <Field label="Categoría"><select className="input" value={f.cat} onChange={set('cat')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Precio normal (S/)"><input className="input" type="number" min="0" step="0.1" value={f.price} onChange={set('price')} aria-describedby="price-hint" /><span id="price-hint" className="mt-1 block text-[10px] text-neutral-500">Si lo bajas, se avisa a quienes lo tienen en su lista de deseos.</span></Field>
        <Field label="Stock (uds)"><input className="input" type="number" min="0" value={f.stock} onChange={set('stock')} /></Field>
      </div>
      <Field label="Descripción" className="sm:col-span-2"><textarea rows={3} className="input" value={f.desc} onChange={set('desc')} /></Field>
      <button className="btn sm:col-span-2">{initial?.id ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}</button>
    </form>
  )
}

export function AdminProducts() {
  const { products, baseProducts, deleteProduct } = useApp()
  const { state } = useLocation()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [st, setSt] = useState(state?.estado === 'low' ? 'low' : '')
  const [form, setForm] = useState(null) // null | {} (nuevo) | producto
  const [view, setView] = useState(null)
  const [del, setDel] = useState(null)
  const [sel, setSel] = useState([])

  const list = products.filter((p) => {
    if (q && !(p.name + p.sku).toLowerCase().includes(q.toLowerCase())) return false
    if (cat && p.cat !== cat) return false
    if (st === 'low' ? p.stock > 10 : st && stockState(p) !== st) return false
    return true
  })
  const pg = usePaged(list, 8)
  const S = (v, fn) => (e) => { fn(e.target.value); pg.setPage(1) }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-lg font-extrabold text-neutral-800">GESTIÓN DE PRODUCTOS</h1><button onClick={() => setForm({})} className="btn"><Plus size={13} />NUEVO PRODUCTO</button></div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs"><Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={q} onChange={S(q, setQ)} placeholder="Buscar producto o SKU…" className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-jar-200" /></div>
        <select value={cat} onChange={S(cat, setCat)} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-[11px] font-medium"><option value="">Categoría</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={st} onChange={S(st, setSt)} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-[11px] font-medium"><option value="">Estado</option><option>Activo</option><option value="low">Stock bajo (≤10)</option><option>Agotado</option></select>
        <span className="ml-auto text-[11px] text-neutral-500">{products.length} productos</span>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-neutral-100"><tr><th className="th w-10"><Check16 on={pg.slice.length > 0 && pg.slice.every((p) => sel.includes(p.id))} onChange={(v) => setSel(v ? pg.slice.map((p) => p.id) : [])} label="Seleccionar todos" /></th><th className="th">Producto</th><th className="th">Categoría</th><th className="th">Precio</th><th className="th">Stock</th><th className="th">Estado</th><th className="th">Acciones</th></tr></thead>
            <tbody>
              {pg.slice.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100 hover:bg-jar-50/40">
                  <td className="td"><Check16 on={sel.includes(p.id)} onChange={(v) => setSel(v ? [...sel, p.id] : sel.filter((x) => x !== p.id))} label={`Seleccionar ${p.name}`} /></td>
                  <td className="td"><div className="flex items-center gap-3"><ProductImg src={p.img} className="h-10 w-10 rounded-lg" /><div><b className="block text-neutral-800">{p.name}</b><span className="text-[10px] text-neutral-400">{p.sku}</span></div></div></td>
                  <td className="td">{p.cat}</td><td className="td font-semibold">{money(p.price)}{p.promoId && <span className="block text-[10px] font-medium text-neutral-500">Promoción · normal {money(p.basePrice)}</span>}</td><td className="td">{p.stock} uds</td><td className="td"><Badge>{stockState(p)}</Badge></td>
                  <td className="td"><div className="flex gap-1">
                    <button onClick={() => setForm(baseProducts.find((x) => x.id === p.id) || p)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-jar-50 hover:text-jar-600" aria-label={`Editar ${p.name}`}><Pencil size={13} /></button>
                    <button onClick={() => setView(p)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-jar-50 hover:text-jar-600" aria-label={`Ver ${p.name}`}><Eye size={13} /></button>
                    <button onClick={() => setDel(p)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Eliminar ${p.name}`}><Trash2 size={13} /></button>
                  </div></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="td py-10 text-center">No hay productos con esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...pg} onPage={pg.setPage} noun="productos" />
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar producto' : 'Nuevo producto'} width="max-w-2xl">{form && <ProductForm initial={form} onClose={() => setForm(null)} />}</Modal>
      <Modal open={!!view} onClose={() => setView(null)} title="Detalle del producto" width="max-w-md">
        {view && <div className="space-y-3"><ProductImg src={view.img} className="h-52 w-full rounded-xl" /><div className="flex items-start justify-between"><div><b className="text-sm">{view.name}</b><p className="text-[11px] text-neutral-400">{view.sku} · {view.cat}</p></div><Badge>{stockState(view)}</Badge></div><p className="text-xs text-neutral-600">{view.desc || 'Sin descripción.'}</p><p className="text-lg font-extrabold">{money(view.price)} <span className="text-xs font-medium text-neutral-400">· {view.stock} uds</span></p></div>}
      </Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Eliminar producto" width="max-w-sm">
        <p className="text-xs text-neutral-600">¿Seguro que quieres eliminar <b>{del?.name}</b>? Dejará de verse en la tienda.</p>
        <div className="mt-4 flex gap-2"><button onClick={() => setDel(null)} className="btn-outline flex-1">CANCELAR</button><button onClick={() => { deleteProduct(del.id); setDel(null) }} className="btn flex-1">ELIMINAR</button></div>
      </Modal>
    </div>
  )
}
