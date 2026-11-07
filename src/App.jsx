import { useEffect, useRef } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { SidebarShell } from './components/Shell'
import StoreLayout from './components/StoreLayout'
import { Toast } from './components/ui'
import { AlertBeacon } from './components/A11y'
import { TutorialHost } from './components/Tutorial'

// auth/
import { Login, Register } from './auth/Login'
import { NewPassword, Recover, Verify } from './auth/Recover'

// user/
import Landing from './user/Landing'
import Shop from './user/Shop'
import EasyShop from './user/EasyShop'
import News from './user/News'
import { Cart, Checkout, Success } from './user/Purchase'
import { Dashboard, OrderDetail, Orders } from './user/account/Orders'
import { Addresses, Analytics, Profile, Wishlist } from './user/account/Profile'

// admin/
import { AdminPanel, AdminProducts } from './admin/AdminPanel'
import { AdminCustomers, AdminOrders, AdminReports } from './admin/AdminOrders'
import AdminAnnouncements from './admin/AdminAnnouncements'

function Guard({ roles }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
  return <Outlet />
}

// Sube al inicio en cada cambio de ruta y lleva el foco al contenido principal
// (así el lector de pantalla empieza a leer la página nueva, no la anterior)
function ScrollTop() {
  const { pathname, hash } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
    if (first.current) { first.current = false; return }
    document.getElementById('contenido')?.focus({ preventScroll: true })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const isEditable = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest?.('[contenteditable=""], [contenteditable="true"], [role="textbox"]'))

/* Atajo global de Compra fácil: Alt + Mayús + E (Alt + Mayús + C se mantiene por compatibilidad).
   No actúa mientras se escribe en un campo ni con Ctrl/Cmd, para no chocar con otros atajos. */
function EasyShortcut() {
  const { user, notify } = useApp()
  const nav = useNavigate()
  useEffect(() => {
    const h = (e) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey || e.repeat) return
      if (e.code !== 'KeyE' && e.code !== 'KeyC') return
      if (isEditable(e.target)) return
      e.preventDefault()
      if (user?.role === 'admin') return notify('Compra fácil está disponible para cuentas de cliente.', 'info')
      nav('/compra-facil')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [nav, user, notify])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <EasyShortcut />
      <Routes>
        {/* Acceso */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/recuperar" element={<Recover />} />
        <Route path="/verificar" element={<Verify />} />
        <Route path="/nueva-contrasena" element={<NewPassword />} />
        <Route path="/inicio" element={<Navigate to="/" replace />} />

        {/* Tienda: header + footer compartidos */}
        <Route element={<StoreLayout />}>
          {/* Página de inicio pública (antes del login) */}
          <Route path="/" element={<Landing />} />
          <Route path="/novedades" element={<News />} />
          <Route element={<Guard roles={['user', 'admin']} />}>
            <Route path="/tienda" element={<Shop />} />
          </Route>
          <Route element={<Guard roles={['user']} />}>
            <Route path="/compra-facil" element={<EasyShop />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/pagar" element={<Checkout />} />
            <Route path="/exito" element={<Success />} />
          </Route>
        </Route>

        {/* Usuario */}
        <Route element={<Guard roles={['user']} />}>
          <Route path="/cuenta" element={<SidebarShell />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<Orders />} />
            <Route path="pedidos/:id" element={<OrderDetail />} />
            <Route path="deseos" element={<Wishlist />} />
            <Route path="direcciones" element={<Addresses />} />
            <Route path="analitica" element={<Analytics />} />
            <Route path="perfil" element={<Profile />} />
          </Route>
        </Route>

        {/* Administrador */}
        <Route element={<Guard roles={['admin']} />}>
          <Route path="/admin" element={<SidebarShell admin />}>
            <Route index element={<AdminPanel />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="clientes" element={<AdminCustomers />} />
            <Route path="reportes" element={<AdminReports />} />
            <Route path="anuncios" element={<AdminAnnouncements />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
      <AlertBeacon />
      <TutorialHost />
    </>
  )
}
