import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, MapPin, Plus, Star, Trash2, TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Field, Modal, PasswordInput } from '../../components/ui'
import { AreaChart, Donut } from '../../components/Shell'
import { ProductCard, ProductModal } from '../Shop'
import { ACCENTS, CITIES, DISTRICTS, LIP_TONES, MONTHLY, MONTHS, SHADOW_TONES, SKIN, money } from '../../data/mock'
import { useMyOrders } from './Orders'

const Swatches = ({ colors, value, onChange, label }) => (
  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
    {colors.map((c) => (
      <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c} onClick={() => onChange(c)} className={`h-6 w-6 rounded-full border-2 transition ${value === c ? 'scale-110 border-neutral-800 ring-2 ring-white' : 'border-white shadow'}`} style={{ background: c }} />
    ))}
  </div>
)

/* ───────────── PERFIL (Formulario) ───────────── */
export function Profile() {
  const { user, updateUser, prefs, setPrefs, addresses, setAddresses, notify } = useApp()
  const main = addresses.find((a) => a.main) || addresses[0] || {}
  const [f, setF] = useState({ first: user.first || '', last: user.last || '', email: user.email, phone: user.phone || '', line: main.line || '', district: main.district || DISTRICTS[0], city: main.city || CITIES[0], zip: main.zip || '', ref: main.ref || '' })
  const [p, setP] = useState(prefs)
  const [pwModal, setPwModal] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = () => {
    if (!f.first.trim() || !f.last.trim()) return notify('Escribe tus nombres y apellidos', 'err')
    updateUser({ first: f.first, last: f.last, phone: f.phone })
    setPrefs(p)
    setAddresses(main.id ? addresses.map((a) => (a.id === main.id ? { ...a, line: f.line, district: f.district, city: f.city, zip: f.zip, ref: f.ref } : a)) : [{ id: 'a' + Date.now(), label: 'Casa', line: f.line, district: f.district, city: f.city, zip: f.zip, ref: f.ref, main: true }])
    notify('Cambios guardados')
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-neutral-800">GESTIÓN DE PERFIL</h1>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <h2 className="mb-3 text-xs font-extrabold">Información Personal</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombres"><input className="input" value={f.first} onChange={set('first')} /></Field>
            <Field label="Apellidos"><input className="input" value={f.last} onChange={set('last')} /></Field>
            <Field label="Correo Electrónico"><input className="input bg-neutral-50" value={f.email} readOnly aria-describedby="mail-hint" /><span id="mail-hint" className="mt-1 block text-[10px] text-neutral-500">El correo no se puede cambiar.</span></Field>
            <Field label="Teléfono"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
          </div>
          <h2 className="mb-3 mt-6 text-xs font-extrabold">Dirección de Envío</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Dirección" className="sm:col-span-3"><input className="input" value={f.line} onChange={set('line')} /></Field>
            <Field label="Distrito"><select className="input" value={f.district} onChange={set('district')}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Ciudad"><select className="input" value={f.city} onChange={set('city')}>{CITIES.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="Código postal"><input className="input" value={f.zip} onChange={set('zip')} /></Field>
            <Field label="Referencia" className="sm:col-span-3"><input className="input" value={f.ref} onChange={set('ref')} /></Field>
          </div>
          <h2 className="mb-2 mt-6 text-xs font-extrabold">Seguridad</h2>
          <div className="flex items-center justify-between rounded-xl bg-neutral-100 px-4 py-3 text-xs"><span className="font-semibold">Contraseña</span><span className="tracking-widest text-neutral-400">••••••••••</span><button onClick={() => setPwModal(true)} className="font-bold text-jar-600 hover:underline">Cambiar</button></div>
        </section>

        <section className="card flex flex-col p-5">
          <h2 className="mb-3 text-xs font-extrabold">Preferencias de Colores</h2>
          <div className="space-y-4">
            <Field label="Tipo de piel"><select className="input" value={p.skin} onChange={(e) => setP({ ...p, skin: e.target.value })}>{SKIN.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <div><span className="label">Tono de labial favorito</span><Swatches label="Tono de labial" colors={LIP_TONES} value={p.lip} onChange={(c) => setP({ ...p, lip: c })} /></div>
            <div><span className="label">Paleta de sombras preferida</span><Swatches label="Paleta de sombras" colors={SHADOW_TONES} value={p.shadow} onChange={(c) => setP({ ...p, shadow: c })} /></div>
            <div><span className="label">Color de acento</span><Swatches label="Color de acento" colors={ACCENTS} value={p.accent} onChange={(c) => setP({ ...p, accent: c })} /></div>
          </div>
          <button onClick={save} className="btn mt-auto w-full !mt-8">GUARDAR CAMBIOS</button>
        </section>
      </div>
      <PasswordModal open={pwModal} onClose={() => setPwModal(false)} />
    </div>
  )
}

function PasswordModal({ open, onClose }) {
  const { user, updateUser, notify } = useApp()
  const [cur, setCur] = useState(''), [n1, setN1] = useState(''), [n2, setN2] = useState(''), [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (cur !== user.password) return setErr('La contraseña actual no es correcta.')
    if (n1.length < 8 || !/[A-Z]/.test(n1) || !/\d/.test(n1)) return setErr('Mínimo 8 caracteres, 1 mayúscula y 1 número.')
    if (n1 !== n2) return setErr('Las contraseñas no coinciden.')
    updateUser({ password: n1 }); notify('Contraseña actualizada'); setCur(''); setN1(''); setN2(''); setErr(''); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Cambiar contraseña" width="max-w-sm">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Contraseña actual"><PasswordInput value={cur} onChange={(e) => { setCur(e.target.value); setErr('') }} /></Field>
        <Field label="Nueva contraseña"><PasswordInput value={n1} onChange={(e) => { setN1(e.target.value); setErr('') }} /></Field>
        <Field label="Confirmar nueva contraseña"><PasswordInput value={n2} onChange={(e) => { setN2(e.target.value); setErr('') }} /></Field>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{err}</p>}
        <button className="btn w-full">GUARDAR CONTRASEÑA</button>
      </form>
    </Modal>
  )
}

/* ───────────── LISTA DE DESEOS ───────────── */
export function Wishlist() {
  const { wishlist, products, apiError } = useApp()
  const [open, setOpen] = useState(null)
  const list = wishlist.map((id) => products.find((p) => p.id === id)).filter(Boolean)
  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-neutral-800">LISTA DE DESEOS</h1>
      {apiError && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">No se pudo cargar tu lista de deseos: {apiError}</p>}
      {list.length === 0 ? (
        <div className="card grid place-items-center gap-3 py-16 text-center"><p className="text-sm font-bold text-neutral-700">Aún no tienes favoritos</p><p className="text-xs text-neutral-500">Toca el corazón en cualquier producto para guardarlo aquí.</p><Link to="/tienda" className="btn">VER TIENDA</Link></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-4">{list.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}</div>
      )}
      <ProductModal key={open?.id} product={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/* ───────────── MIS DIRECCIONES ───────────── */
export function Addresses() {
  const { addresses, setAddresses, notify } = useApp()
  const [modal, setModal] = useState(false)
  const [f, setF] = useState({ label: '', line: '', district: DISTRICTS[0], city: CITIES[0], zip: '', ref: '' })
  const add = (e) => {
    e.preventDefault()
    if (!f.label.trim() || !f.line.trim()) return notify('Escribe un nombre y la dirección', 'err')
    setAddresses([...addresses, { ...f, id: 'a' + Date.now(), main: addresses.length === 0 }])
    setF({ label: '', line: '', district: DISTRICTS[0], city: CITIES[0], zip: '', ref: '' }); setModal(false); notify('Dirección agregada')
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-lg font-extrabold text-neutral-800">MIS DIRECCIONES</h1><button onClick={() => setModal(true)} className="btn"><Plus size={13} />NUEVA DIRECCIÓN</button></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {addresses.map((a) => (
          <article key={a.id} className={`card p-5 ${a.main ? 'ring-2 ring-jar-300' : ''}`}>
            <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-extrabold"><MapPin size={14} className="text-jar-600" />{a.label}</span>{a.main && <span className="rounded-full bg-jar-50 px-2 py-0.5 text-[9px] font-bold text-jar-700">PRINCIPAL</span>}</div>
            <p className="text-xs text-neutral-700">{a.line}</p><p className="text-[11px] text-neutral-500">{a.district}, {a.city} {a.zip}</p>{a.ref && <p className="mt-1 text-[11px] italic text-neutral-400">{a.ref}</p>}
            <div className="mt-4 flex gap-3 text-[11px] font-bold">
              {!a.main && <button onClick={() => { setAddresses(addresses.map((x) => ({ ...x, main: x.id === a.id }))); notify('Dirección principal actualizada') }} className="text-jar-600 hover:underline">Hacer principal</button>}
              {addresses.length > 1 && <button onClick={() => { const rest = addresses.filter((x) => x.id !== a.id); setAddresses(a.main ? rest.map((x, i) => ({ ...x, main: i === 0 })) : rest); notify('Dirección eliminada') }} className="flex items-center gap-1 text-neutral-500 hover:text-rose-600"><Trash2 size={11} />Eliminar</button>}
            </div>
          </article>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva dirección">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre (Casa, Trabajo…)"><input className="input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
          <Field label="Código postal"><input className="input" value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value })} /></Field>
          <Field label="Dirección" className="sm:col-span-2"><input className="input" value={f.line} onChange={(e) => setF({ ...f, line: e.target.value })} /></Field>
          <Field label="Distrito"><select className="input" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Ciudad"><select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Referencia" className="sm:col-span-2"><input className="input" value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Field>
          <button className="btn sm:col-span-2">GUARDAR DIRECCIÓN</button>
        </form>
      </Modal>
    </div>
  )
}

/* ───────────── ANALÍTICA (Reportes) ───────────── */
export function Analytics() {
  const { user, products } = useApp()
  const mine = useMyOrders().filter((o) => o.status !== 'Cancelado')
  const total = mine.reduce((s, o) => s + o.total, 0)
  const colors = { Labiales: '#6b6b6b', Ojos: '#a3a3a3', Rostro: '#2f2f2f', Uñas: '#8a8a8a', Otros: '#d4d4d4' }
  const cats = useMemo(() => {
    const acc = {}
    mine.forEach((o) => o.items.forEach((l) => { const p = products.find((x) => x.id === l.id); if (p) acc[p.cat] = (acc[p.cat] || 0) + p.price * l.qty }))
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).map(([label, v]) => ({ label, v, color: colors[label] || '#bbb' }))
  }, [mine, products])
  const top = cats[0]
  const sum = cats.reduce((s, c) => s + c.v, 0) || 1
  const Kpi = ({ title, big, sub, icon }) => (
    <div className="card flex items-start justify-between p-4"><div><p className="text-[10px] text-neutral-500">{title}</p><b className="text-2xl font-extrabold text-neutral-800">{big}</b><p className="text-[10px] text-neutral-400">{sub}</p></div><span className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-500">{icon}</span></div>
  )
  return (
    <div>
      <h1 className="mb-4 text-lg font-extrabold text-neutral-800">ANALÍTICA DE CUENTA</h1>
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Kpi title="Total en Compras" big={money(total)} sub={`${mine.length} pedidos (sin cancelados)`} icon={<TrendingUp size={15} />} />
        <Kpi title="Puntos de Fidelidad" big={user.points} sub="Puntos acumulados" icon={<Award size={15} />} />
        <Kpi title="Categoría Más Comprada" big={top ? top.label : '—'} sub={top ? `${Math.round(top.v)} soles · ${Math.round((top.v / sum) * 100)}% del gasto` : 'Aún sin compras'} icon={<Star size={15} />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <section className="card p-5"><h2 className="mb-4 text-xs font-extrabold">Categorías Más Compradas</h2>{cats.length ? <Donut data={cats} center={user.points} sub="puntos" /> : <p className="py-10 text-center text-xs text-neutral-500">Realiza una compra para ver tu analítica.</p>}</section>
        <section className="card p-5"><h2 className="mb-3 text-xs font-extrabold">Ventas Mensuales</h2><AreaChart values={MONTHLY} labels={MONTHS} /></section>
      </div>
    </div>
  )
}
