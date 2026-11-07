import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Bell, BookOpen, Check, Eye, Info, Megaphone, Moon, Pin, PersonStanding, Smartphone, Sun, Tag, Thermometer, Trash2, Truck, Type, Volume2, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useClickOutside } from './Header'
import { canVibrate } from '../utils/alertCues'
import { openTutorial } from './Tutorial'

export const CB_MODES = [
  { id: 'protan', name: 'Protanopía', hint: 'Dificultad con rojos · la tienda usa azules', sw: 'bg-[#1e40af]' },
  { id: 'deutan', name: 'Deuteranopía', hint: 'Dificultad con verdes · la tienda usa azul petróleo', sw: 'bg-[#155e75]' },
  { id: 'tritan', name: 'Tritanopía', hint: 'Dificultad con azules y amarillos · la tienda usa rojos', sw: 'bg-[#991b1b]' },
]

export const TEMPS = [
  ['warm', 'Cálida'],
  ['neutral', 'Neutra'],
  ['cool', 'Fría'],
]

/* Interruptor accesible (role="switch") */
export function Switch({ on, onChange, label, hint, icon, id, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={on} id={id} disabled={disabled} onClick={() => onChange(!on)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-jar-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent">
      {icon && <span className="shrink-0 text-jar-600" aria-hidden="true">{icon}</span>}
      <span className="min-w-0 flex-1">
        <b className="block text-[11px] text-neutral-800">{label}</b>
        {hint && <span className="block text-[10px] leading-tight text-neutral-500">{hint}</span>}
      </span>
      <span aria-hidden="true" className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? 'bg-jar-600' : 'bg-neutral-300'}`}>
        <i className={`absolute top-0.5 grid h-4 w-4 place-items-center rounded-full bg-white text-[8px] font-black text-jar-700 shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`}>{on ? '✓' : ''}</i>
      </span>
    </button>
  )
}

const hhmm = (ts) => new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/* Botón + panel de accesibilidad (header) */
export function A11yMenu({ className = '' }) {
  const { a11y, setA, notify, toastLog, clearToastLog } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  const vib = canVibrate()
  const Head = ({ children }) => <h3 className="px-3 pb-0.5 pt-2.5 text-[9px] font-extrabold uppercase tracking-widest text-neutral-500">{children}</h3>
  const smallBtn = 'rounded-full border border-neutral-300 px-3 py-1 text-[10px] font-bold text-neutral-700 hover:bg-jar-50'
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Accesibilidad" aria-haspopup="dialog" aria-expanded={open} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/15"><PersonStanding size={17} /></button>
      {open && (
        <div role="dialog" aria-label="Opciones de accesibilidad" className="pop absolute right-0 top-9 z-50 max-h-[80vh] w-[300px] max-w-[92vw] overflow-y-auto rounded-2xl bg-white pb-2 text-neutral-700 shadow-pop">
          <div className="flex items-center justify-between px-4 pt-3"><h2 className="text-xs font-extrabold text-neutral-800">Accesibilidad</h2><button onClick={() => setOpen(false)} aria-label="Cerrar opciones de accesibilidad" className="text-neutral-500 hover:text-neutral-700"><X size={14} /></button></div>

          <Head>Daltonismo</Head>
          {CB_MODES.map((m) => (
            <Switch key={m.id} on={a11y.cb === m.id} onChange={(v) => setA({ cb: v ? m.id : 'none' })} label={m.name} hint={m.hint} icon={<i className={`block h-3.5 w-3.5 rounded-full ${m.sw}`} />} />
          ))}

          <Head>Apariencia</Head>
          <div className="mx-3 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1" role="group" aria-label="Tema de color">
            {[[false, 'Claro', Sun], [true, 'Oscuro', Moon]].map(([v, l, Ico]) => (
              <button key={l} aria-pressed={a11y.dark === v} onClick={() => setA({ dark: v })} className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold ${a11y.dark === v ? 'bg-white text-jar-700 shadow-sm' : 'text-neutral-600'}`}><Ico size={13} aria-hidden="true" />{l}</button>
            ))}
          </div>
          <p id="temp-hint" className="mx-3 mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-neutral-800"><Thermometer size={13} className="text-jar-600" aria-hidden="true" />Temperatura visual</p>
          <div className="mx-3 mt-1 grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1" role="group" aria-labelledby="temp-hint" aria-describedby="temp-note">
            {TEMPS.map(([v, l]) => (
              <button key={v} aria-pressed={(a11y.temp || 'neutral') === v} onClick={() => setA({ temp: v })} className={`rounded-lg py-1.5 text-[11px] font-bold ${(a11y.temp || 'neutral') === v ? 'bg-white text-jar-700 shadow-sm' : 'text-neutral-600'}`}>{l}</button>
            ))}
          </div>
          <p id="temp-note" className="mx-3 mt-1 text-[10px] leading-tight text-neutral-500">Ajuste de comodidad para la vista. No trata ni corrige problemas visuales.</p>
          <Switch on={a11y.big} onChange={(v) => setA({ big: v })} label="Texto más grande" hint="Agranda toda la interfaz" icon={<Type size={15} />} />

          <Head>Ceguera y baja visión</Head>
          <Switch on={a11y.sr} onChange={(v) => setA({ sr: v })} label="Modo lector de pantalla" hint="Foco reforzado y sin animaciones ni carruseles" icon={<Eye size={15} />} />
          <button onClick={() => { setOpen(false); nav('/compra-facil') }} aria-keyshortcuts="Alt+Shift+E" className="mx-3 mt-1 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-full bg-brand py-2 text-[11px] font-bold text-white">Ir a Compra fácil (Alt + Mayús + E)</button>

          <Head>Sordera e hipoacusia</Head>
          <p className="px-3 text-[10px] leading-tight text-neutral-500">Los avisos siempre se muestran con texto en pantalla. El sonido y la vibración son un complemento.</p>
          <Switch on={a11y.deaf} onChange={(v) => setA({ deaf: v })} label="Alertas visuales" hint="Avisos grandes con texto, icono y destello de pantalla" icon={<Bell size={15} />} />
          <Switch on={a11y.sound} onChange={(v) => setA({ sound: v })} label="Sonido en los avisos" hint="Un tono para éxito y dos tonos graves para error" icon={<Volume2 size={15} />} />
          <Switch on={a11y.vibrate && vib} disabled={!vib} onChange={(v) => { setA({ vibrate: v }); if (v && vib) { try { navigator.vibrate(150) } catch { /* sin soporte */ } } }} label="Vibración" hint={vib ? 'Vibra el dispositivo en éxitos y errores' : 'Este dispositivo o navegador no admite vibración'} icon={<Smartphone size={15} />} />
          <Switch on={a11y.keep} onChange={(v) => setA({ keep: v })} label="Mantener los avisos" hint="Las confirmaciones no se cierran solas. Los errores siempre se cierran a mano." icon={<Pin size={15} />} />
          <div className="mt-1 flex flex-wrap gap-2 px-3">
            <button type="button" className={smallBtn} onClick={() => notify('Así se ve un aviso de éxito.')}>Probar aviso de éxito</button>
            <button type="button" className={smallBtn} onClick={() => notify('Así se ve un aviso de error.', 'err')}>Probar aviso de error</button>
          </div>
          <div className="mt-2 px-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[11px] font-bold text-neutral-800">Historial de avisos</h4>
              <button type="button" onClick={clearToastLog} disabled={!toastLog.length} className="flex items-center gap-1 text-[10px] font-bold text-jar-600 hover:underline disabled:text-neutral-400 disabled:no-underline"><Trash2 size={11} aria-hidden="true" />Borrar</button>
            </div>
            {toastLog.length === 0 ? <p className="mt-1 text-[10px] text-neutral-500">Todavía no hay avisos en esta sesión.</p> : (
              <ul aria-label="Últimos avisos de esta sesión" className="mt-1 max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-neutral-200 p-2">
                {toastLog.map((n) => (
                  <li key={n.id} className="flex gap-2 text-[10px] leading-snug">
                    {n.type === 'err' ? <AlertCircle size={12} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true" /> : <Check size={12} className="mt-0.5 shrink-0 text-jar-600" aria-hidden="true" />}
                    <span className="min-w-0"><b className="text-neutral-800">{hhmm(n.ts)} · {n.type === 'err' ? 'Error' : n.type === 'info' ? 'Aviso' : 'Éxito'}</b><span className="block break-words text-neutral-600">{n.msg}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Head>Ayuda</Head>
          <button type="button" onClick={() => { setOpen(false); openTutorial() }} className="mx-3 flex w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-full border border-neutral-300 py-2 text-[11px] font-bold text-neutral-700 hover:bg-jar-50"><BookOpen size={13} aria-hidden="true" />Ver tutorial de la tienda</button>
        </div>
      )}
    </div>
  )
}

const ICON = { ok: [Check, 'bg-emerald-50 text-emerald-600'], err: [AlertCircle, 'bg-rose-50 text-rose-600'], ship: [Truck, 'bg-sky-50 text-sky-700'], info: [Bell, 'bg-jar-50 text-jar-600'], promo: [Tag, 'bg-jar-50 text-jar-600'] }
const ago = (ts) => {
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  if (m < 1440) return `hace ${Math.round(m / 60)} h`
  return `hace ${Math.round(m / 1440)} d`
}

export const OPEN_BELL = 'jarusa:open-bell'

/* Campanita: historial de actividad, anuncios y bajadas de precio (usuarios registrados) */
export function Bell_() {
  const { notes, unread, markAllRead, a11y } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const btn = useRef(null)
  const close = () => { setOpen(false); markAllRead() }
  const ref = useClickOutside(open, close)
  useEffect(() => {
    const h = () => { setOpen(true); btn.current?.focus() }
    window.addEventListener(OPEN_BELL, h)
    return () => window.removeEventListener(OPEN_BELL, h)
  }, [])
  const go = (link) => { close(); nav(link) }
  return (
    <div className="relative" ref={ref}>
      <button ref={btn} onClick={() => (open ? close() : setOpen(true))} aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`} aria-haspopup="dialog" aria-expanded={open} className="relative grid h-7 w-7 place-items-center rounded-full hover:bg-white/15">
        <Bell size={16} className={unread && a11y.deaf ? 'ring-bell' : ''} />
        {unread > 0 && <span aria-hidden="true" className="alert-badge absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-extrabold">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notificaciones" className="pop absolute right-0 top-9 z-50 w-[320px] max-w-[92vw] overflow-hidden rounded-2xl bg-white text-neutral-700 shadow-pop">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 className="text-xs font-extrabold text-neutral-800">Notificaciones</h2>
            <button onClick={markAllRead} disabled={!unread} className="text-[10px] font-bold text-jar-600 hover:underline disabled:text-neutral-400 disabled:no-underline">Marcar todo como leído</button>
          </div>
          <ul className="max-h-[360px] divide-y divide-neutral-100 overflow-y-auto">
            {notes.length === 0 && <li className="px-4 py-8 text-center text-[11px] text-neutral-500">Aún no tienes notificaciones.</li>}
            {notes.map((n) => {
              const [Ico, tone] = ICON[n.type] || ICON.info
              const inner = (
                <>
                  <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${tone}`}><Ico size={14} /></span>
                  <div className="min-w-0 flex-1 text-[11px] leading-snug">
                    <p className="flex items-center justify-between gap-2"><b className="text-neutral-800">{n.title}</b><span className="shrink-0 text-[9px] text-neutral-500">{ago(n.ts)}</span></p>
                    <p className="mt-0.5 text-neutral-600">{n.text}</p>
                    {n.link && <span className="mt-1 block text-[10px] font-bold text-jar-600">{n.productId || n.link.includes('producto=') ? 'Ver producto →' : 'Ver anuncio →'}</span>}
                  </div>
                </>
              )
              return (
                <li key={n.id}>
                  {n.link
                    ? <button type="button" onClick={() => go(n.link)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-jar-50">{inner}</button>
                    : <div className="flex gap-3 px-4 py-3">{inner}</div>}
                </li>
              )
            })}
          </ul>
          <Link to="/novedades" onClick={close} className="flex items-center justify-center gap-1.5 border-t border-neutral-100 py-2.5 text-[11px] font-bold text-jar-600 hover:bg-jar-50"><Megaphone size={12} aria-hidden="true" />Ver novedades y promociones</Link>
        </div>
      )}
    </div>
  )
}

/* Indicador fijo de alertas sin leer (con «Alertas visuales»).
   Color universal amarillo/negro: no depende de la paleta de daltonismo y
   sigue visible al desplazarse. Se coloca abajo a la derecha, fuera del encabezado. */
export function AlertBeacon() {
  const { user, unread, a11y } = useApp()
  const show = !!user && a11y.deaf && unread > 0
  useEffect(() => {
    document.documentElement.classList.toggle('beacon', show)
    return () => document.documentElement.classList.remove('beacon')
  }, [show])
  if (!show) return null
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_BELL))} className="alert-beacon fixed bottom-3 right-3 z-[65] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold shadow-pop">
      <Info size={15} aria-hidden="true" />
      {unread} {unread === 1 ? 'aviso sin leer' : 'avisos sin leer'}
    </button>
  )
}
