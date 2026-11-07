import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { kindLabel } from '../services/promotions'
import { fmtDate, money } from '../data/mock'

/* Novedades, anuncios y promociones vigentes publicados por la tienda (página pública). */
export default function News() {
  const { publicAnnouncements, products, user, apiError } = useApp()
  const { hash } = useLocation()
  const [kind, setKind] = useState('todas')
  const list = publicAnnouncements.filter((a) => kind === 'todas' || a.kind === kind)

  // si se llega desde un aviso (#anuncio-id), se lleva el foco a ese anuncio
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) { el.scrollIntoView({ block: 'start' }); el.focus({ preventScroll: true }) }
  }, [hash, publicAnnouncements.length])

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <h1 className="flex items-center gap-2 text-xl font-extrabold text-neutral-800"><Megaphone size={20} className="text-jar-600" aria-hidden="true" />Novedades y promociones</h1>
      <p className="mt-1 text-xs text-neutral-600">Anuncios vigentes publicados por Jarusa.</p>
      <div role="group" aria-label="Filtrar por tipo" className="mt-4 flex flex-wrap gap-1.5">
        {[['todas', 'Todas'], ['novedad', 'Novedades'], ['anuncio', 'Anuncios'], ['promocion', 'Promociones']].map(([v, l]) => (
          <button key={v} aria-pressed={kind === v} onClick={() => setKind(v)} className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${kind === v ? 'bg-jar-700 text-white shadow-md' : 'bg-neutral-100 text-neutral-700 hover:bg-jar-100'}`}>{l}</button>
        ))}
      </div>
      {apiError && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">No se pudieron cargar los anuncios: {apiError}</p>}
      <p className="sr-only" aria-live="polite">{list.length} {list.length === 1 ? 'anuncio' : 'anuncios'}</p>
      {list.length === 0 ? (
        <p className="card mt-6 px-6 py-12 text-center text-xs text-neutral-600">No hay anuncios vigentes{kind !== 'todas' ? ' de este tipo' : ''} por ahora.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((a) => {
            const p = products.find((x) => x.id === a.productId)
            return (
              <li key={a.id}>
                <article id={`anuncio-${a.id}`} tabIndex={-1} aria-labelledby={`t-${a.id}`} className="card grid gap-4 overflow-hidden p-5 outline-none focus-visible:ring-2 focus-visible:ring-jar-600 sm:grid-cols-[160px_1fr]">
                  {a.img && <img src={a.img} alt="" className="aspect-square w-full rounded-xl object-cover" />}
                  <div className={a.img ? '' : 'sm:col-span-2'}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-jar-700">{kindLabel(a.kind)} · <time dateTime={a.publishAt}>{fmtDate(a.publishAt)}</time></p>
                    <h2 id={`t-${a.id}`} className="mt-1 text-base font-extrabold text-neutral-800">{a.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-neutral-700">{a.body}</p>
                    {a.expiresAt && <p className="mt-2 text-[11px] font-semibold text-neutral-600">Válido hasta el {fmtDate(a.expiresAt)}.</p>}
                    {p && (
                      <p className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <span><b className="text-neutral-800">{p.name}</b>: {money(p.price)}{p.oldPrice ? <> <s className="text-neutral-500" aria-label={`antes ${money(p.oldPrice)}`}>{money(p.oldPrice)}</s></> : null}</span>
                        <Link to={user ? `/tienda?producto=${p.id}` : '/login'} state={user ? undefined : { from: '/tienda' }} className="btn !px-4 !py-1.5">{user ? 'Ver producto' : 'Inicia sesión para comprar'}</Link>
                      </p>
                    )}
                    <p className="mt-3 text-[10px] text-neutral-500">Publicado por {a.author?.name || 'Jarusa'}</p>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
