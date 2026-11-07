import { Logo } from '../components/ui'
import { A11yMenu } from '../components/A11y'

const Float = () => <div className="fixed right-3 top-3 z-50 rounded-full bg-brand p-1 text-white shadow-md"><A11yMenu /></div>

const Circles = () => (
  <>
    <span className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/20" />
    <span className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full border border-white/20" />
  </>
)

// Pantalla dividida: mitad rosa con marca + mitad gris. La tarjeta flota al centro.
export function SplitShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden"><Float />
      <div className="absolute inset-0 grid md:grid-cols-2">
        <div className="relative overflow-hidden bg-brand">
          <Circles />
          <div className="hidden h-full flex-col justify-center pl-[14%] text-white md:flex">
            <Logo className="text-[64px]" />
            <p className="mt-2 text-xs">La ciencia de la belleza natural</p>
          </div>
        </div>
        <div className="hidden bg-neutral-200 md:block" />
      </div>
      <div className="relative z-10 grid min-h-screen place-items-center p-4">
        <div className="pop w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-pop">{children}</div>
      </div>
    </div>
  )
}

export function SoloShell({ children }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-neutral-200 p-4"><Float />
      <span className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/50" />
      <span className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-white/50" />
      <div className="pop relative w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-pop">{children}</div>
    </div>
  )
}

export const Title = ({ icon, children, sub }) => (
  <div className="mb-4 text-center">
    {icon && <span className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-jar-50 text-jar-600">{icon}</span>}
    <h1 className="text-[15px] font-extrabold tracking-wide text-neutral-800">{children}</h1>
    {sub && <p className="mx-auto mt-1 max-w-[270px] text-[11px] leading-snug text-neutral-500">{sub}</p>}
  </div>
)

export function Social({ onClick }) {
  return (
    <div className="flex justify-center gap-3">
      {[['G', 'Google', 'text-neutral-700'], ['f', 'Facebook', 'text-blue-600'], ['ig', 'Instagram', 'bg-gradient-to-br from-fuchsia-500 to-orange-400 text-white']].map(([t, n, c]) => (
        <button key={n} type="button" onClick={() => onClick(n)} aria-label={`Continuar con ${n}`} className={`grid h-8 w-8 place-items-center rounded-full border border-neutral-200 text-[12px] font-extrabold shadow-sm transition hover:scale-105 ${c.includes('bg-') ? c : `bg-white ${c}`}`}>{t}</button>
      ))}
    </div>
  )
}
