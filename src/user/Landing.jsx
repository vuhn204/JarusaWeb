import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Ear, Eye, Heart, Leaf, Palette, Quote, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Avatar, Modal, ProductImg } from '../components/ui'
import { TESTIMONIALS, money } from '../data/mock'

const COLECCIONES = [
  { img: '/img/paleta-terra.jpg', name: 'Paleta Terra' },
  { img: '/img/paleta-florecer.jpg', name: 'Florecer' },
  { img: '/img/kit-tintas.jpg', name: 'Tintas' },
]

const BENEFICIOS = [
  [Leaf, 'Ingredientes botánicos', 'Fórmulas inspiradas en la naturaleza'],
  [ShieldCheck, 'Respaldo dermatológico', 'Probadas para el cuidado de tu piel'],
  [Truck, 'Envíos a todo el Perú', 'Gratis en compras desde S/ 100'],
  [Sparkles, 'Jarusa Plus', 'Acumula puntos en cada compra'],
]

const INCLUSION = [
  { id: 'dalt', tab: 'Daltonismo', Icon: Palette, title: 'Colores que se adaptan a ti', text: 'Elegir un labial no debería ser una adivinanza. Si ves distinto el rojo, el verde o el azul, la tienda entera cambia su paleta a una que sí distingues, incluidos los avisos de éxito y error.',
    steps: ['Toca el icono de la personita en la barra superior.', 'En «Daltonismo» activa tu tipo: protanopía (rojos), deuteranopía (verdes) o tritanopía (azules).', 'Si te molesta la luz, cambia a «Oscuro» en «Apariencia». Tu elección se recuerda.'], cta: 'Probar protanopía', act: (a) => a.setA({ cb: 'protan' }) },
  { id: 'ciego', tab: 'Ceguera y baja visión', Icon: Eye, title: 'Compra fácil, sin enredos', text: 'Creamos un modo de compra en una sola página, ordenado y con descripciones completas, pensado para tu lector de pantalla. Eliges, revisas y pagas sin perderte entre menús.',
    steps: ['Con tu lector, el primer enlace de cualquier página es «Ir a Compra fácil».', 'También funciona el atajo Alt + Mayús + E, o el botón del menú de accesibilidad.', 'Activa «Modo lector de pantalla» para un foco más visible y sin carruseles automáticos.'], cta: 'Abrir Compra fácil', to: '/compra-facil' },
  { id: 'sordo', tab: 'Sordera e hipoacusia', Icon: Ear, title: 'Todo se ve, nada depende del sonido', text: 'Cada aviso importante se muestra con texto, icono y un destello en pantalla, y puede vibrar tu móvil. Además, la campanita guarda el historial de tus compras y pedidos.',
    steps: ['Abre el menú de accesibilidad (la personita).', 'En «Sordera e hipoacusia» activa «Alertas visuales» y, si quieres, «Vibración».', 'Revisa la campanita para ver si tu compra fue exitosa o si tu pedido está por llegar.'], cta: 'Activar alertas visuales', act: (a) => a.setA({ deaf: true }) },
]

function Inclusion() {
  const app = useApp()
  const [i, setI] = useState(0)
  const t = INCLUSION[i]
  return (
    <section className="mx-auto max-w-6xl px-6 pt-10" aria-labelledby="incl">
      <div className="overflow-hidden rounded-3xl border border-jar-100 bg-jar-50/60">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.4fr] md:p-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-jar-700 shadow-card"><Heart size={11} />Belleza para todos</span>
            <h2 id="incl" className="mt-3 text-xl font-extrabold leading-tight text-neutral-800">La belleza de todos nos importa</h2>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">En Jarusa creemos que la belleza no se mide por cómo ves u oyes. Por eso diseñamos la tienda para personas daltónicas, ciegas, con baja visión, sordas o con hipoacusia, y seguimos mejorando con tus ideas.</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-neutral-500"><Bell size={12} className="text-jar-600" />Y con tu cuenta, la campanita te avisa de tus compras y pedidos.</p>
          </div>
          <div>
            <div role="tablist" aria-label="Tipos de accesibilidad" className="flex flex-wrap gap-1.5">
              {INCLUSION.map((x, k) => (
                <button key={x.id} role="tab" id={`tab-${x.id}`} aria-selected={k === i} aria-controls="incl-panel" onClick={() => setI(k)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${k === i ? 'bg-jar-700 text-white shadow-md' : 'bg-white text-neutral-600 hover:bg-jar-100'}`}><x.Icon size={13} />{x.tab}</button>
              ))}
            </div>
            <div role="tabpanel" id="incl-panel" aria-labelledby={`tab-${t.id}`} className="mt-3 rounded-2xl bg-white p-5 shadow-card">
              <h3 className="text-sm font-extrabold text-neutral-800">{t.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{t.text}</p>
              <p className="mb-1.5 mt-4 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Cómo activarlo</p>
              <ol className="space-y-2">
                {t.steps.map((s, k) => <li key={k} className="flex gap-2.5 text-xs text-neutral-700"><b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-jar-100 text-[10px] text-jar-700">{k + 1}</b><span>{s}</span></li>)}
              </ol>
              {t.to ? <Link to={t.to} className="btn mt-4">{t.cta}</Link> : <button onClick={() => t.act(app)} className="btn mt-4">{t.cta}</button>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const Heading = ({ children }) => (
  <>
    <h2 className="text-sm font-extrabold text-neutral-800">{children}</h2>
    <i className="mb-3 mt-1 block h-0.5 w-6 bg-jar-600" />
  </>
)

const Dots = ({ n, i, set, label }) => (
  <div className="mt-2 flex justify-center gap-1.5">
    {Array.from({ length: n }, (_, k) => <button key={k} onClick={() => set(k)} aria-label={`${label} ${k + 1} de ${n}`} aria-pressed={k === i} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-jar-600' : 'w-1.5 bg-neutral-300'}`} />)}
  </div>
)

export default function Landing() {
  const { user, products, a11y } = useApp()
  const [col, setCol] = useState(0)
  const [tes, setTes] = useState(0)
  const [story, setStory] = useState(false)

  // sin rotación automática con «Modo lector de pantalla» o si el sistema pide reducir movimiento
  const still = a11y.sr || (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (still) return
    const t = setInterval(() => setCol((c) => (c + 1) % COLECCIONES.length), 4500)
    return () => clearInterval(t)
  }, [still])
  useEffect(() => {
    if (still) return
    const t = setInterval(() => setTes((c) => (c + 1) % TESTIMONIALS.length), 6000)
    return () => clearInterval(t)
  }, [still])

  const t = TESTIMONIALS[tes]
  // Con sesión va directo a la tienda; sin sesión, al login
  const shopTo = user ? '/tienda' : '/login'
  const featured = products.filter((p) => p.stock > 0).slice(0, 4)

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative isolate flex min-h-[340px] items-center overflow-hidden bg-[#7b5547]">
        <img src="/img/display-charm.jpg" alt="" className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover object-center md:w-[48%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#7b5547] from-50% via-[#7b5547]/75 to-transparent" />
        <div className="px-6 py-14 text-white md:px-16">
          <h1 className="text-3xl font-medium leading-tight tracking-wide md:text-[44px]">LA CIENCIA DE LA<br />BELLEZA <i className="font-logo text-[1.15em] font-normal">natural</i></h1>
          <p className="mt-3 max-w-xs text-xs text-white/85">Cosmética inspirada en la naturaleza, formulada con ciencia.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to={shopTo} className="btn">{user ? 'IR A LA TIENDA' : 'EMPIEZA A COMPRAR'}<ArrowRight size={14} /></Link>
            <button onClick={() => setStory(true)} className="rounded-full border border-white/70 px-6 py-2.5 text-xs font-bold tracking-wide text-white transition hover:bg-white/15">NUESTRA HISTORIA</button>
          </div>
          {!user && <p className="mt-3 text-[11px] text-white/80">¿Primera vez? <Link to="/registro" className="font-bold underline underline-offset-4">Crea tu cuenta</Link> y acumula puntos Jarusa Plus.</p>}
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-b border-neutral-100 bg-jar-50/60">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 py-5 md:grid-cols-4">
          {BENEFICIOS.map(([Icon, title, sub]) => (
            <li key={title} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-jar-600 shadow-card"><Icon size={16} /></span>
              <span className="text-[11px] leading-tight"><b className="block text-neutral-800">{title}</b><span className="text-neutral-500">{sub}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <Inclusion />

      {/* Productos destacados */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="mb-4 flex items-end justify-between">
          <div><Heading>Lo más querido</Heading></div>
          <Link to={shopTo} className="mb-3 text-[11px] font-bold text-jar-600 hover:underline">Ver todo →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <Link key={p.id} to={shopTo} className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
              <div className="relative">
                <ProductImg src={p.img} alt={p.name} className="aspect-[5/4] w-full" />
                {p.tag && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-extrabold uppercase text-jar-700">{p.tag}</span>}
              </div>
              <div className="p-3">
                <h3 className="truncate text-xs font-bold text-neutral-800">{p.name}</h3>
                <p className="mt-0.5 text-sm font-extrabold text-neutral-700">{money(p.price)} {p.oldPrice && <s className="ml-1 text-[10px] font-medium text-neutral-400">{money(p.oldPrice)}</s>}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Filosofía · Colecciones · Testimonios */}
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <Heading>Filosofía</Heading>
          <p className="text-xs leading-relaxed text-neutral-600">En Jarusa creemos que la belleza nace de lo natural. Formulamos cosméticos con ingredientes botánicos y respaldo dermatológico para realzar tu esencia, cuidando tu piel y el planeta en cada paso de tu rutina.</p>
        </div>
        <div>
          <Heading>Colecciones</Heading>
          <Link to={shopTo} className="group relative block aspect-[16/9] overflow-hidden rounded-xl">
            {COLECCIONES.map((c, i) => <img key={c.img} src={c.img} alt={i === col ? `Colección ${c.name}` : ''} aria-hidden={i !== col} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === col ? 'opacity-100' : 'opacity-0'}`} />)}
            <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-jar-700 opacity-0 transition group-hover:opacity-100">Ver {COLECCIONES[col].name}</span>
          </Link>
          <Dots n={COLECCIONES.length} i={col} set={setCol} label="Colección" />
        </div>
        <div>
          <Heading>Testimonios</Heading>
          <div className="rounded-xl bg-neutral-100 p-4">
            <Quote size={16} className="mb-1 text-jar-500" />
            <p className="min-h-[72px] text-xs leading-relaxed text-neutral-600">{t.text}</p>
            <div className="mt-3 flex items-center gap-2"><Avatar name={t.name} size="h-7 w-7" text="text-[9px]" /><div className="text-[10px] leading-tight"><b className="block text-neutral-800">{t.name}</b><span className="text-neutral-500">{t.role}</span></div></div>
          </div>
          <Dots n={TESTIMONIALS.length} i={tes} set={setTes} label="Testimonio" />
        </div>
      </section>

      {/* Llamado a la acción */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-10 text-center text-white md:px-12">
          <span className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full border border-white/20" />
          <span className="pointer-events-none absolute -bottom-20 right-8 h-56 w-56 rounded-full border border-white/20" />
          {user ? (
            <>
              <h2 className="text-xl font-extrabold md:text-2xl">Tu próxima rutina te espera</h2>
              <p className="mx-auto mt-2 max-w-md text-xs text-white/85">Descubre las novedades y ofertas de la semana.</p>
              <Link to="/tienda" className="mt-5 keep-white inline-flex items-center gap-2 rounded-full bg-white px-7 py-2.5 text-xs font-bold text-jar-700 shadow-md transition hover:bg-jar-50">IR A LA TIENDA<ArrowRight size={14} /></Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold md:text-2xl">Empieza a comprar</h2>
              <p className="mx-auto mt-2 max-w-md text-xs text-white/85">Inicia sesión o crea tu cuenta gratis y acumula puntos Jarusa Plus en cada pedido.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link to="/login" className="keep-white rounded-full bg-white px-7 py-2.5 text-xs font-bold text-jar-700 shadow-md transition hover:bg-jar-50">INICIAR SESIÓN</Link>
                <Link to="/registro" className="rounded-full border border-white/80 px-7 py-2.5 text-xs font-bold text-white transition hover:bg-white/15">REGISTRARSE</Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Modal open={story} onClose={() => setStory(false)} title="Nuestra historia">
        <img src="/img/banner-ruta.jpg" alt="" className="mb-4 h-44 w-full rounded-xl object-cover object-top" />
        <p className="text-xs leading-relaxed text-neutral-600">Jarusa nació de una idea simple: que el maquillaje puede cuidar tu piel. Trabajamos con ingredientes botánicos, probamos cada fórmula con respaldo dermatológico y diseñamos colores pensados para la piel latina.</p>
        <Link to={shopTo} onClick={() => setStory(false)} className="btn mt-4 w-full">{user ? 'DESCUBRE LA TIENDA' : 'EMPIEZA A COMPRAR'}</Link>
      </Modal>
    </div>
  )
}
