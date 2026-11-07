import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, ClipboardList, Heart, LayoutGrid, LogOut, MapPin, Megaphone, Package, User, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar } from './ui'
import Header from './Header'

// ── Layout con sidebar: cuenta de usuario y panel de administración ──
export function SidebarShell({ admin }) {
  const { user, logout } = useApp()
  const nav = useNavigate()
  const items = admin
    ? [['/admin', 'Panel', 'LayoutGrid', true], ['/admin/productos', 'Productos', 'Package'], ['/admin/pedidos', 'Pedidos', 'ClipboardList'], ['/admin/clientes', 'Clientes', 'Users'], ['/admin/reportes', 'Reportes', 'BarChart3'], ['/admin/anuncios', 'Anuncios', 'Megaphone']]
    : [['/cuenta', 'Resumen', 'LayoutGrid', true], ['/cuenta/pedidos', 'Mis Pedidos', 'Package'], ['/cuenta/deseos', 'Lista de Deseos', 'Heart'], ['/cuenta/direcciones', 'Mis Direcciones', 'MapPin'], ['/cuenta/analitica', 'Analítica', 'BarChart3'], ['/cuenta/perfil', 'Perfil', 'User']]
  return (
    <div className="flex h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[80] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-jar-700 focus:shadow-pop">Saltar al contenido principal</a>
      <Header variant="panel" admin={admin} />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-52 shrink-0 flex-col justify-between bg-side p-3 md:flex">
          <div>
            <p className="mb-3 mt-2 px-2 text-[9px] font-bold tracking-[0.18em] text-neutral-500">{admin ? 'ADMINISTRACIÓN' : 'MI CUENTA'}</p>
            <nav aria-label={admin ? 'Administración' : 'Mi cuenta'} className="space-y-1">
              {items.map(([to, label, , end]) => (
                <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${isActive ? 'bg-brand text-white shadow-md' : 'text-neutral-600 hover:bg-white'}`}>
                  <NavIcon name={items.find((i) => i[0] === to)[2]} />{label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/70 p-2.5">
              <Avatar name={user?.name} photo={user?.photo} size="h-8 w-8" />
              <div className="min-w-0 text-[11px] leading-tight">
                <p className="truncate font-bold text-neutral-800">{user?.name}</p>
                <p className="truncate text-neutral-500">{admin ? 'Administrador' : `Jarusa Plus · ${user?.points} pts`}</p>
              </div>
            </div>
            <button onClick={() => { logout(); nav('/') }} className="flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-jar-50"><LogOut size={14} />Cerrar sesión</button>
          </div>
        </aside>
        <div className="min-w-0 flex-1 overflow-auto">
          {/* navegación móvil */}
          <nav aria-label={admin ? 'Administración' : 'Mi cuenta'} className="flex gap-1 overflow-x-auto bg-side p-2 md:hidden">
            {items.map(([to, label, , end]) => (
              <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${isActive ? 'bg-brand text-white' : 'bg-white text-neutral-600'}`}>{label}</NavLink>
            ))}
          </nav>
          <main id="contenido" tabIndex={-1} className="panel-main p-4 outline-none md:p-6"><Outlet /></main>
        </div>
      </div>
    </div>
  )
}

const ICONS = { LayoutGrid, Package, Heart, MapPin, User, BarChart3, ClipboardList, Users, Megaphone }
const NavIcon = ({ name }) => { const I = ICONS[name] || LayoutGrid; return <I size={15} aria-hidden="true" /> }

// ── Gráficos SVG sin dependencias ──
export function Donut({ data, center, sub }) {
  const total = data.reduce((s, d) => s + d.v, 0) || 1
  let acc = 0
  const R = 52, C = 2 * Math.PI * R
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Categorías más compradas">
          {data.map((d) => {
            const len = (d.v / total) * C
            const el = <circle key={d.label} cx="70" cy="70" r={R} fill="none" stroke={d.color} strokeWidth="20" strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-acc} />
            acc += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <b className="text-2xl font-extrabold text-neutral-800">{center}</b>
          <span className="text-[10px] text-neutral-500">{sub}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-xs">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-6"><span className="flex items-center gap-2 text-neutral-600"><i className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.label}</span><b>{Math.round((d.v / total) * 100)}%</b></li>
        ))}
      </ul>
    </div>
  )
}

export function AreaChart({ values, labels, height = 190 }) {
  const [hover, setHover] = useState(null)
  const W = 560, H = height, pl = 32, pb = 22, pt = 10
  const max = Math.ceil(Math.max(...values) / 100) * 100
  const x = (i) => pl + (i * (W - pl - 8)) / (values.length - 1)
  const y = (v) => pt + (1 - v / max) * (H - pb - pt)
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ventas mensuales" onMouseLeave={() => setHover(null)}>
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgb(var(--jar-500))" stopOpacity=".35" /><stop offset="1" stopColor="rgb(var(--jar-500))" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map((i) => { const v = (max / 4) * i; return <g key={i}><line x1={pl} x2={W - 8} y1={y(v)} y2={y(v)} stroke="#eee" /><text x={pl - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#999">{v}</text></g> })}
      <path d={`${line} L${x(values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#ag)" />
      <path d={line} fill="none" stroke="rgb(var(--b1))" strokeWidth="1.6" />
      {values.map((v, i) => (
        <g key={i} onMouseEnter={() => setHover(i)}>
          <rect x={x(i) - 16} y="0" width="32" height={H} fill="transparent" />
          <circle cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : 2.5} fill="rgb(var(--b1))" />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#999">{labels[i]}</text>
        </g>
      ))}
      {hover !== null && (
        <g><rect x={Math.min(x(hover) - 28, W - 70)} y={y(values[hover]) - 28} width="56" height="20" rx="6" fill="#262626" /><text x={Math.min(x(hover) - 28, W - 70) + 28} y={y(values[hover]) - 14} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">S/ {values[hover]}</text></g>
      )}
    </svg>
  )
}

export function Bars({ data }) {
  const [sel, setSel] = useState(data.reduce((b, d, i) => (d.v > data[b].v ? i : b), 0))
  const max = Math.max(...data.map((d) => d.v))
  return (
    <div className="flex h-44 items-end gap-3 px-2" role="group" aria-label="Ventas semanales">
      {data.map((d, i) => (
        <button key={d.d} aria-label={`${d.d}: S/ ${d.v.toLocaleString('en-US')}`} aria-pressed={sel === i} onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} className="group relative flex h-full flex-1 flex-col justify-end gap-1.5">
          {sel === i && <span className="pop absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-[10px] font-bold text-white" style={{ bottom: `calc(${(d.v / max) * 85}% + 26px)`, top: 'auto', height: 'fit-content' }}>S/ {d.v.toLocaleString('en-US')}</span>}
          <span className={`w-full rounded-md transition-all ${sel === i ? 'bg-brand' : 'bg-neutral-200 group-hover:bg-neutral-300'}`} style={{ height: `${(d.v / max) * 85}%` }} />
          <span className="text-center text-[10px] text-neutral-500">{d.d}</span>
        </button>
      ))}
    </div>
  )
}
