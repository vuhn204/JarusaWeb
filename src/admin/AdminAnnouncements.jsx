import { useRef, useState } from 'react'
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Badge, Field, Modal, Pagination, ProductImg, readImage, usePaged } from '../components/ui'
import { fmtTime, money } from '../data/mock'
import { ANN_KINDS, ANN_STATES, annState, kindLabel } from '../services/promotions'

// datetime-local <-> ISO (hora local de quien administra)
const toLocal = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const fromLocal = (v) => (v ? new Date(v).toISOString() : '')

const EMPTY = () => ({ kind: 'novedad', title: '', body: '', productId: '', img: '', status: 'publicado', publishAt: new Date().toISOString(), expiresAt: '', promoPrice: '' })

function AnnouncementForm({ initial, onDone }) {
  const { baseProducts, saveAnnouncement, interestedCount, notify } = useApp()
  const [f, setF] = useState(() => (initial?.id ? { ...initial, productId: initial.productId || '', img: initial.img || '', expiresAt: initial.expiresAt || '', promoPrice: initial.promoPrice ?? '' } : EMPTY()))
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: undefined }) }
  const product = baseProducts.find((p) => p.id === f.productId)
  const fans = product ? interestedCount(product.id) : 0

  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const res = await saveAnnouncement({ ...f, promoPrice: f.kind === 'promocion' ? f.promoPrice : '' })
    setBusy(false)
    if (res.error) return notify(res.error, 'err')
    if (res.errors) {
      setErrors(res.errors)
      const first = Object.keys(res.errors)[0]
      formRef.current?.elements[first]?.focus()
      return notify('Revisa los campos marcados del anuncio', 'err')
    }
    const st = res.state
    const msg = st === 'publicado' ? 'Anuncio publicado: ya lo ven todas las cuentas.' : st === 'programado' ? 'Anuncio programado: se publicará en la fecha indicada.' : `Anuncio guardado como ${ANN_STATES[st].toLowerCase()}.`
    notify(res.notice ? `${msg} ${res.notice}` : msg, res.notice ? 'info' : 'ok')
    onDone()
  }

  const err = (k) => errors[k] && <span id={`an-${k}-err`} className="mt-1 block text-[11px] font-semibold text-rose-700">{errors[k]}</span>
  const aria = (k) => ({ name: k, 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `an-${k}-err` : undefined })

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[150px_1fr]">
      <div>
        <label className="grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-jar-300 bg-jar-50 text-center text-[10px] font-bold text-jar-700 hover:border-jar-500 focus-within:ring-2 focus-within:ring-jar-500">
          {f.img ? <img src={f.img} alt="Vista previa de la imagen del anuncio" className="h-full w-full object-cover" /> : <span className="grid place-items-center gap-1"><ImagePlus size={22} aria-hidden="true" />Imagen (opcional)</span>}
          <input type="file" accept="image/*" className="sr-only" aria-label="Subir imagen del anuncio (opcional)" onChange={async (e) => e.target.files[0] && setF({ ...f, img: await readImage(e.target.files[0], 900) })} />
        </label>
        {f.img && <button type="button" onClick={() => setF({ ...f, img: '' })} className="mt-1 flex items-center gap-1 text-[10px] font-bold text-neutral-600 hover:text-rose-700"><X size={11} aria-hidden="true" />Quitar imagen</button>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Título" className="sm:col-span-2"><input className="input" maxLength={90} value={f.title} onChange={set('title')} data-autofocus {...aria('title')} />{err('title')}</Field>
        <Field label="Tipo de publicación"><select className="input" value={f.kind} onChange={set('kind')} {...aria('kind')}>{ANN_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>{err('kind')}</Field>
        <Field label="Estado"><select className="input" value={f.status} onChange={set('status')} {...aria('status')}><option value="publicado">Publicado</option><option value="borrador">Borrador</option><option value="archivado">Archivado</option></select>{err('status')}</Field>
        <Field label="Fecha de publicación"><input type="datetime-local" className="input" value={toLocal(f.publishAt)} onChange={(e) => setF({ ...f, publishAt: fromLocal(e.target.value) })} {...aria('publishAt')} />{err('publishAt')}</Field>
        <Field label="Fecha de expiración (opcional)"><input type="datetime-local" className="input" value={toLocal(f.expiresAt)} onChange={(e) => setF({ ...f, expiresAt: fromLocal(e.target.value) })} {...aria('expiresAt')} />{err('expiresAt')}</Field>
      </div>
      <Field label="Contenido" className="sm:col-span-2"><textarea rows={3} maxLength={1000} className="input" value={f.body} onChange={set('body')} {...aria('body')} />{err('body')}</Field>
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <Field label="Producto relacionado (opcional)"><select className="input" value={f.productId} onChange={set('productId')} {...aria('productId')}><option value="">Ninguno</option>{baseProducts.map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.price)}</option>)}</select>{err('productId')}</Field>
        {f.kind === 'promocion' && (
          <Field label="Precio promocional (S/, opcional)"><input type="number" min="0" step="0.1" className="input" value={f.promoPrice} onChange={set('promoPrice')} disabled={!product} {...aria('promoPrice')} />{err('promoPrice')}</Field>
        )}
      </div>
      {f.kind === 'promocion' && product && (
        <p className="rounded-lg bg-jar-50 px-3 py-2 text-[11px] text-neutral-700 sm:col-span-2" aria-live="polite">
          Precio actual de {product.name}: <b>{money(product.price)}</b>. {fans === 0 ? 'Ningún cliente lo tiene en su lista de deseos.' : `${fans} ${fans === 1 ? 'cliente lo tiene en su lista de deseos y recibirá' : 'clientes lo tienen en su lista de deseos y recibirán'} un aviso cuando el precio promocional entre en vigencia.`} Al vencer la promoción vuelve el precio normal.
        </p>
      )}
      <button className="btn sm:col-span-2" disabled={busy} aria-busy={busy}>{busy ? 'GUARDANDO…' : initial?.id ? 'GUARDAR CAMBIOS' : 'GUARDAR ANUNCIO'}</button>
    </form>
  )
}

export default function AdminAnnouncements() {
  const { announcements, baseProducts, deleteAnnouncement, now } = useApp()
  const [form, setForm] = useState(null)
  const [del, setDel] = useState(null)
  const list = [...announcements].sort((a, b) => new Date(b.publishAt) - new Date(a.publishAt))
  const pg = usePaged(list, 8)
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h1 className="text-lg font-extrabold text-neutral-800">ANUNCIOS Y PROMOCIONES</h1><button onClick={() => setForm({})} className="btn"><Plus size={13} aria-hidden="true" />NUEVO ANUNCIO</button></div>
      <p className="mb-3 text-[11px] text-neutral-600">Publica novedades, anuncios y promociones. Al publicarse, todas las cuentas reciben un aviso en la campanita. Si una promoción baja el precio de un producto, solo se avisa a quienes lo tienen en su lista de deseos.</p>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <caption className="sr-only">Anuncios publicados, programados y borradores</caption>
            <thead className="bg-neutral-100"><tr><th scope="col" className="th">Anuncio</th><th scope="col" className="th">Tipo</th><th scope="col" className="th">Producto</th><th scope="col" className="th">Estado</th><th scope="col" className="th">Vigencia</th><th scope="col" className="th">Publicado por</th><th scope="col" className="th">Acciones</th></tr></thead>
            <tbody>
              {pg.slice.map((a) => {
                const p = baseProducts.find((x) => x.id === a.productId)
                return (
                  <tr key={a.id} className="border-t border-neutral-100">
                    <td className="td"><div className="flex items-center gap-3">{a.img ? <ProductImg src={a.img} className="h-10 w-10 rounded-lg" /> : null}<b className="block max-w-[220px] text-neutral-800">{a.title}</b></div></td>
                    <td className="td">{kindLabel(a.kind)}</td>
                    <td className="td">{p ? <>{p.name}{a.promoPrice ? <span className="block text-[10px] text-neutral-600">{money(p.price)} → <b>{money(a.promoPrice)}</b></span> : null}</> : '—'}</td>
                    <td className="td"><Badge>{ANN_STATES[annState(a, now)]}</Badge></td>
                    <td className="td text-[11px]">Desde {fmtTime(a.publishAt)}{a.expiresAt ? <span className="block">Hasta {fmtTime(a.expiresAt)}</span> : <span className="block text-neutral-500">Sin expiración</span>}</td>
                    <td className="td text-[11px]">{a.author?.name}<span className="block text-neutral-500">{a.author?.email}</span></td>
                    <td className="td"><div className="flex gap-1">
                      <button onClick={() => setForm(a)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-600 hover:bg-jar-50 hover:text-jar-600" aria-label={`Editar ${a.title}`}><Pencil size={13} /></button>
                      <button onClick={() => setDel(a)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-600 hover:bg-rose-50 hover:text-rose-600" aria-label={`Eliminar ${a.title}`}><Trash2 size={13} /></button>
                    </div></td>
                  </tr>
                )
              })}
              {list.length === 0 && <tr><td colSpan={7} className="td py-10 text-center">Aún no hay anuncios. Crea el primero con «Nuevo anuncio».</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...pg} onPage={pg.setPage} noun="anuncios" />
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar anuncio' : 'Nuevo anuncio'} width="max-w-2xl">{form && <AnnouncementForm initial={form} onDone={() => setForm(null)} />}</Modal>
      <Modal open={!!del} onClose={() => setDel(null)} title="Eliminar anuncio" width="max-w-sm">
        <p className="text-xs text-neutral-600">¿Seguro que quieres eliminar <b>{del?.title}</b>? Dejará de verse en Novedades. Los avisos ya enviados se conservan en el historial de cada cuenta.</p>
        <div className="mt-4 flex gap-2"><button onClick={() => setDel(null)} className="btn-outline flex-1">CANCELAR</button><button onClick={() => { deleteAnnouncement(del.id); setDel(null) }} className="btn flex-1">ELIMINAR</button></div>
      </Modal>
    </div>
  )
}
