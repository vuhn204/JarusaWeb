import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, X, Check, AlertCircle, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'

export const Logo = ({ className = 'text-3xl', to }) => {
  const el = <span className={`block font-logo font-normal leading-none tracking-wide ${className}`}>Jarusa</span>
  return to ? <Link to={to} aria-label="Jarusa, inicio" className="flex items-center justify-center leading-none">{el}</Link> : el
}

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const Avatar = ({ name, photo, size = 'h-8 w-8', text = 'text-[11px]', ring }) => (
  <span className={`inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full ${ring?.includes('bg-white') ? 'keep-white' : 'bg-brand'} font-bold text-white ${text} ${ring || ''}`}>
    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initials(name)}
  </span>
)

const BADGE = {
  Entregado: 'bg-emerald-50 text-emerald-700',
  'En camino': 'bg-sky-50 text-sky-700',
  Pendiente: 'bg-amber-50 text-amber-700',
  Cancelado: 'bg-rose-50 text-rose-700',
  Activo: 'bg-emerald-50 text-emerald-700',
  'Stock bajo': 'bg-amber-50 text-amber-700',
  Agotado: 'bg-rose-50 text-rose-700',
  Publicado: 'bg-emerald-50 text-emerald-700',
  Programado: 'bg-sky-50 text-sky-700',
  Vencido: 'bg-amber-50 text-amber-700',
}
export const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${BADGE[children] || 'bg-neutral-100 text-neutral-600'} ${className}`}>
    <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
    {children}
  </span>
)

export function Pagination({ page, pages, onPage, from, to, total, noun = 'pedidos' }) {
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between px-4 py-3 text-[11px] text-neutral-500">
      <span aria-live="polite">Mostrando {total === 0 ? 0 : from}–{to} de {total} {noun}</span>
      <div className="flex items-center gap-1.5">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30" aria-label="Página anterior"><ChevronLeft size={14} /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onPage(n)} aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined} className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${n === page ? 'bg-brand text-white' : 'bg-white text-neutral-600 shadow-sm hover:bg-neutral-100'}`}>{n}</button>
        ))}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="grid h-7 w-7 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30" aria-label="Página siguiente"><ChevronRight size={14} /></button>
      </div>
    </nav>
  )
}

export function usePaged(list, size) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(list.length / size))
  const p = Math.min(page, pages)
  const slice = list.slice((p - 1) * size, p * size)
  return { page: p, pages, setPage, slice, from: (p - 1) * size + 1, to: (p - 1) * size + slice.length, total: list.length }
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const focusables = (root) => Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => el.getClientRects().length > 0)

/* Ventana modal accesible: el foco entra al abrir, Tab / Mayús+Tab quedan dentro,
   Escape cierra y el foco vuelve al botón que la abrió. */
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const titleId = useId()
  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) {
      const auto = dialog.querySelector('[data-autofocus]')
      ;(auto || focusables(dialog).find((el) => el.getAttribute('aria-label') !== 'Cerrar') || dialog).focus()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeRef.current(); return }
      if (e.key !== 'Tab' || !dialog) return
      const items = focusables(dialog)
      if (!items.length) { e.preventDefault(); dialog.focus(); return }
      const first = items[0], last = items[items.length - 1], active = document.activeElement
      if (e.shiftKey && (active === first || active === dialog || !dialog.contains(active))) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (active === last || !dialog.contains(active))) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // devuelve el foco solo si la ventana realmente se cerró (no en un re-montaje)
      if (opener && typeof opener.focus === 'function') setTimeout(() => { if ((!dialog || !dialog.isConnected) && opener.isConnected) opener.focus() }, 0)
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-jar-900/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`pop max-h-[92vh] w-full ${width} overflow-auto rounded-2xl bg-white text-neutral-800 shadow-pop focus:outline-none`}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
          <h2 id={titleId} className="text-sm font-extrabold uppercase tracking-wide text-neutral-800">{title}</h2>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full hover:bg-neutral-100" aria-label="Cerrar"><X size={15} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

/* Avisos: dos regiones live siempre presentes (cortés para éxito/información,
   «alert» para errores) y una tarjeta visual con botón para cerrarla. */
const TONE = { err: 'Error', ok: 'Éxito', info: 'Aviso' }
export function Toast() {
  const { toast, a11y, dismissToast } = useApp()
  const err = toast?.type === 'err'
  const Ico = err ? AlertCircle : toast?.type === 'info' ? Info : Check
  const live = (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{toast && !err && <p key={toast.k}>{TONE[toast.type] || 'Aviso'}: {toast.msg}</p>}</div>
      <div className="sr-only" role="alert" aria-atomic="true">{toast && err && <p key={toast.k}>Error: {toast.msg}</p>}</div>
    </>
  )
  if (!toast) return live
  // Modo sordos: aviso grande arriba con texto + icono + destello en todo el borde de la pantalla
  if (a11y.deaf) {
    return (
      <>
        {live}
        <div key={toast.k}>
          <div className={`flash pointer-events-none fixed inset-0 z-[70] border-[10px] ${err ? 'border-dashed border-orange-500' : 'border-solid border-jar-500'}`} />
          <div className="pop fixed left-1/2 top-16 z-[70] w-[min(92vw,420px)] -translate-x-1/2">
            <div className={`flex items-center gap-3 rounded-2xl border-4 bg-white p-4 text-neutral-800 shadow-pop ${err ? 'border-dashed border-orange-500' : 'border-jar-500'}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${err ? 'bg-orange-600' : 'bg-jar-600'}`}><Ico size={22} /></span>
              <p className="min-w-0 flex-1 text-sm font-bold leading-snug"><span className="block text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">{TONE[toast.type] || 'Aviso'}</span>{toast.msg}</p>
              <button type="button" onClick={dismissToast} aria-label="Cerrar aviso" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-600 hover:bg-neutral-100"><X size={16} /></button>
            </div>
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      {live}
      <div key={toast.k} className="pop fixed bottom-5 left-1/2 z-[60] w-max max-w-[92vw] -translate-x-1/2">
        <div className={`flex items-center gap-2 rounded-full py-1.5 pl-5 pr-1.5 text-xs font-semibold text-white shadow-pop ${err ? 'bg-neutral-800' : 'bg-jar-700'}`}>
          <Ico size={14} className="shrink-0" />
          <span className="min-w-0">{toast.msg}</span>
          <button type="button" onClick={dismissToast} aria-label="Cerrar aviso" className="toast-x grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/15"><X size={14} /></button>
        </div>
      </div>
    </>
  )
}

export const PasswordInput = ({ value, onChange, placeholder = '••••••••', name, autoComplete }) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input name={name} autoComplete={autoComplete} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} className="input pr-9" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700" aria-label="Mostrar u ocultar contraseña">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

export const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="label">{label}</span>
    {children}
  </label>
)

// Imagen de producto, o espacio vacío listo para recibir una foto
export const ProductImg = ({ src, alt = '', className = '' }) =>
  src ? (
    <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />
  ) : (
    <div className={`grid place-items-center bg-jar-50 text-jar-300 ${className}`}><ImagePlus size={22} /></div>
  )

export const Check16 = ({ on, onChange, label }) => (
  <button type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-jar-600 bg-jar-600 text-white' : 'border-neutral-300 bg-white'}`}>
    {on && <Check size={11} strokeWidth={3} />}
  </button>
)

// Lee una imagen del disco y la devuelve como dataURL (reducida) para previsualizar / guardar
export const readImage = (file, max = 600) =>
  new Promise((resolve) => {
    const fr = new FileReader()
    fr.onload = () => {
      const img = new Image()
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = img.width * k; c.height = img.height * k
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.85))
      }
      img.src = fr.result
    }
    fr.readAsDataURL(file)
  })

export function download(filename, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}
