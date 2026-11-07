import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Search, ShoppingBag, SlidersHorizontal, Store, UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, Logo } from './ui'
import { A11yMenu, Bell_ } from './A11y'

/* Cierra un menú o panel al pulsar fuera o con Escape (el foco vuelve a su botón). */
export function useClickOutside(open, close) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = (e) => ref.current && !ref.current.contains(e.target) && close()
    const k = (e) => {
      if (e.key !== 'Escape' || !ref.current) return
      close()
      ref.current.querySelector('button')?.focus()
    }
    document.addEventListener('mousedown', h)
    window.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('keydown', k) }
  }, [open, close])
  return ref
}

/* Menú desplegable del panel (admin / cuenta) */
function PanelMenu({ greet, items }) {
  const { user, logout } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-[11px] font-semibold text-white" aria-label={`Menú de cuenta de ${user?.name || 'usuario'}`} aria-expanded={open}>
        <span className="hidden sm:inline">{greet}</span>
        <Avatar name={user?.name} photo={user?.photo} size="h-7 w-7" text="text-[10px]" ring="bg-white !text-jar-700" />
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="pop absolute right-0 top-9 z-40 w-48 overflow-hidden rounded-xl bg-white py-1 text-xs text-neutral-700 shadow-pop">
          {items.map((i) => (
            <button key={i.label} onClick={() => { setOpen(false); nav(i.to) }} className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-jar-50">{i.icon}{i.label}</button>
          ))}
          <button onClick={() => { logout(); nav('/') }} className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-left text-jar-700 hover:bg-jar-50"><LogOut size={14} />Cerrar sesión</button>
        </div>
      )}
    </div>
  )
}

/* Menú de la tienda (icono de ajustes) */
function StoreMenu() {
  const { user, logout } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(open, () => setOpen(false))
  const go = (to) => { setOpen(false); nav(to) }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label="Menú de cuenta" aria-expanded={open}><SlidersHorizontal size={16} /></button>
      {open && (
        <div className="pop absolute right-0 top-8 z-40 w-52 overflow-hidden rounded-xl bg-white py-1 text-xs text-neutral-700 shadow-pop">
          <p className="px-4 pb-1 pt-2 text-[10px] text-neutral-500">{user?.email}</p>
          <button onClick={() => go(user?.role === 'admin' ? '/admin' : '/cuenta')} className="block w-full px-4 py-2.5 text-left hover:bg-jar-50">{user?.role === 'admin' ? 'Panel de administración' : 'Mi cuenta'}</button>
          {user?.role !== 'admin' && <button onClick={() => go('/cuenta/pedidos')} className="block w-full px-4 py-2.5 text-left hover:bg-jar-50">Mis pedidos</button>}
          <button onClick={() => { logout(); go('/') }} className="block w-full border-t border-neutral-100 px-4 py-2.5 text-left text-jar-700 hover:bg-jar-50">Cerrar sesión</button>
        </div>
      )}
    </div>
  )
}

/**
 * Header único de Jarusa.
 *  - variant="store": tienda y landing (invitado o con sesión)
 *  - variant="panel": panel de admin y cuenta de usuario
 *
 * Usa una grilla de 3 columnas (1fr · auto · 1fr): el logo queda SIEMPRE
 * centrado sin importar cuánto ocupen los lados, y la altura es fija (h-14)
 * para que no suba ni baje entre páginas.
 */
export default function Header({ variant = 'store', admin = false }) {
  const { user, cartCount } = useApp()
  const first = user?.name?.split(' ')[0]
  const initial = user?.name?.split(' ')[1]?.[0]

  let left, right, home
  if (variant === 'panel') {
    home = admin ? '/admin' : '/'
    left = admin
      ? <span className="rounded bg-white/20 px-2 py-1 text-[9px] font-bold tracking-widest">PANEL ADMIN</span>
      : <Link to="/tienda" className="hidden items-center gap-1.5 text-[11px] font-semibold hover:underline sm:flex"><Store size={14} />Tienda</Link>
    right = (
      <div className="flex items-center gap-3">
      <A11yMenu />
      <Bell_ />
      <PanelMenu
        greet={admin ? 'Hola, Admin' : `Hola, ${first} ${initial ? initial + '.' : ''}`}
        items={admin
          ? [{ label: 'Ver tienda', to: '/tienda', icon: <Store size={14} /> }]
          : [{ label: 'Mi perfil', to: '/cuenta/perfil', icon: <UserRound size={14} /> }, { label: 'Ir a la tienda', to: '/tienda', icon: <Store size={14} /> }]}
      />
      </div>
    )
  } else {
    home = '/'
    left = <Link to="/tienda" className="hidden text-[11px] font-bold tracking-wide hover:underline sm:block">TIENDA</Link>
    right = user ? (
      <div className="flex items-center gap-3 sm:gap-4">
        <A11yMenu />
        <Bell_ />
        <Link to="/tienda" aria-label="Buscar en la tienda"><Search size={16} /></Link>
        <Link to="/carrito" className="relative" aria-label={`Carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}>
          <ShoppingBag size={16} />
          {cartCount > 0 && <span aria-hidden="true" className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-extrabold text-jar-700">{cartCount}</span>}
        </Link>
        <StoreMenu />
      </div>
    ) : (
      <div className="flex items-center gap-3 text-[11px] font-bold">
        <A11yMenu />
        <Link to="/login" className="hover:underline">Iniciar sesión</Link>
        <Link to="/registro" className="keep-white rounded-full bg-white px-3.5 py-1.5 text-jar-700 shadow-sm transition hover:bg-jar-50">Registrarse</Link>
      </div>
    )
  }

  return (
    <header className="site-header sticky top-0 z-30 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 bg-brand px-4 text-white md:px-6">
      <div className="flex items-center justify-start">{left}</div>
      <Logo className="text-[28px]" to={home} />
      <div className="flex items-center justify-end">{right}</div>
    </header>
  )
}
