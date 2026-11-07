import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Search } from 'lucide-react'
import { useClickOutside } from './Header'

/* Barra secundaria de la tienda: categorías, novedades, ofertas y buscador */
export default function SubNav({ active, onSearch, search = '', category, onCategory, categories = [], bg = 'bg-white' }) {
  const nav = useNavigate()
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useClickOutside(catOpen, () => setCatOpen(false))
  const pick = (v) => (onCategory ? onCategory(v) : nav('/tienda'))
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-2.5 md:px-8 ${bg}`}>
      <nav className="flex items-center gap-6 text-[11px] font-bold tracking-wide">
        <div className="relative" ref={catRef}>
          <button onClick={() => setCatOpen(!catOpen)} className="flex items-center gap-1 text-neutral-800">CATEGORÍAS<ChevronDown size={12} /></button>
          {catOpen && (
            <div className="pop absolute left-0 top-7 z-30 w-44 overflow-hidden rounded-xl bg-white py-1 text-xs font-medium shadow-pop">
              {['Todas', ...categories].map((c) => (
                <button key={c} onClick={() => { setCatOpen(false); pick(c) }} className={`block w-full px-4 py-2 text-left hover:bg-jar-50 ${category === c ? 'font-bold text-jar-700' : ''}`}>{c}</button>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => pick('novedad')} className={active === 'novedad' ? 'text-jar-700' : 'text-neutral-800'}>NOVEDADES</button>
        <button onClick={() => pick('oferta')} className={active === 'oferta' ? 'text-jar-600' : 'text-neutral-800'}>OFERTAS</button>
      </nav>
      <div className="relative w-full max-w-xs">
        <input value={search} onChange={(e) => onSearch?.(e.target.value)} onFocus={() => !onSearch && nav('/tienda')} placeholder="Buscar productos…" className="w-full rounded-full bg-neutral-100 py-1.5 pl-4 pr-9 text-[11px] focus:outline-none focus:ring-2 focus:ring-jar-200" />
        <span className="absolute right-1 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-neutral-700 text-white"><Search size={11} /></span>
      </div>
    </div>
  )
}
