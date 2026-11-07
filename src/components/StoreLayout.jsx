import { Link, Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const skip = 'sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[80] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-jar-700 focus:shadow-pop'

/* Estructura fija: header arriba, contenido flexible, footer siempre abajo.
   Los dos primeros enlaces (solo visibles al enfocarlos) son lo primero que lee un lector de pantalla. */
export default function StoreLayout() {
  // El atajo Alt + Mayús + E de Compra fácil vive en App.jsx para que funcione en todas las páginas
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Link to="/compra-facil" aria-keyshortcuts="Alt+Shift+E" className={skip}>Ir a Compra fácil, el modo de compra accesible</Link>
      <a href="#contenido" className={skip + ' focus:left-72'}>Saltar al contenido principal</a>
      <Header />
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none"><Outlet /></main>
      <Footer />
    </div>
  )
}
