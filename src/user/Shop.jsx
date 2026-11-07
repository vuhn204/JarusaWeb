import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, ImagePlus, Minus, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SubNav from '../components/SubNav'
import { Modal, ProductImg } from '../components/ui'
import { BANNERS, CATEGORIES, money } from '../data/mock'

export function ProductModal({ product, onClose }) {
  const { addToCart, toggleWish, wishlist } = useApp()
  const [qty, setQty] = useState(1)
  if (!product) return null
  const fav = wishlist.includes(product.id)
  return (
    <Modal open onClose={onClose} title={product.name} width="max-w-2xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <ProductImg src={product.img} alt={product.name} className="aspect-square w-full rounded-xl" />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest text-jar-600">{product.cat.toUpperCase()} · {product.sku}</span>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">{product.desc || 'Producto Jarusa formulado con ingredientes botánicos.'}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <b className="text-2xl font-extrabold text-neutral-800">{money(product.price)}</b>
            {product.oldPrice && <s className="text-xs text-neutral-500"><span className="sr-only">Precio anterior: </span>{money(product.oldPrice)}</s>}
          </div>
          {product.promoUntil && <p className="mt-1 text-[11px] font-semibold text-jar-700">Promoción válida hasta el {new Date(product.promoUntil).toLocaleDateString('es-PE')}</p>}
          <p className={`mt-1 text-[11px] font-semibold ${product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{product.stock > 0 ? `${product.stock} unidades disponibles` : 'Agotado'}</p>
          <div className="mt-auto flex items-center gap-2 pt-5">
            <div className="flex items-center rounded-full border border-neutral-200">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-8 w-8 place-items-center" aria-label="Reducir cantidad"><Minus size={12} /></button>
              <span className="w-6 text-center text-xs font-bold" aria-live="polite" aria-label={`Cantidad: ${qty}`}>{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock || 1, qty + 1))} className="grid h-8 w-8 place-items-center" aria-label="Aumentar cantidad"><Plus size={12} /></button>
            </div>
            <button disabled={product.stock <= 0} onClick={() => { addToCart(product.id, qty); onClose() }} className="btn flex-1">AÑADIR AL CARRITO</button>
            <button onClick={() => toggleWish(product.id)} aria-label={`Guardar ${product.name} en la lista de deseos`} aria-pressed={fav} className={`grid h-9 w-9 place-items-center rounded-full border ${fav ? 'border-jar-500 bg-jar-50 text-jar-600' : 'border-neutral-200 text-neutral-500'}`}><Heart size={15} fill={fav ? 'currentColor' : 'none'} /></button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function ProductCard({ p, onOpen }) {
  const { addToCart, toggleWish, wishlist } = useApp()
  const fav = wishlist.includes(p.id)
  return (
    <article className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="relative">
        <button onClick={() => onOpen(p)} className="block w-full" aria-label={`Ver ${p.name}`}><ProductImg src={p.img} alt={p.name} className="aspect-[5/4] w-full" /></button>
        {p.tag && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-extrabold uppercase text-jar-700">{p.tag}</span>}
        {p.stock <= 0 && <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-extrabold text-neutral-700">AGOTADO</span>}
        <button onClick={() => toggleWish(p.id)} aria-label={`Guardar ${p.name} en la lista de deseos`} aria-pressed={fav} className={`absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow ${fav ? 'text-jar-600' : 'text-neutral-400 hover:text-jar-600'}`}><Heart size={13} fill={fav ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="p-3">
        <h3 className="truncate text-xs font-bold text-neutral-800">{p.name}</h3>
        <p className="mt-0.5 text-sm font-extrabold text-neutral-700">{money(p.price)} {p.oldPrice && <s className="ml-1 text-[10px] font-medium text-neutral-500"><span className="sr-only">Precio anterior: </span>{money(p.oldPrice)}</s>}{p.stock <= 0 && <span className="sr-only"> · Agotado</span>}</p>
        <button disabled={p.stock <= 0} onClick={() => addToCart(p.id)} aria-label={p.stock <= 0 ? `${p.name} agotado` : `Añadir ${p.name} al carrito`} className="mt-2.5 w-full rounded-full border border-neutral-300 py-1.5 text-[10px] font-bold tracking-wide text-neutral-700 transition hover:border-jar-500 hover:bg-jar-600 hover:text-white disabled:opacity-40 disabled:hover:border-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-700">AÑADIR AL CARRITO</button>
      </div>
    </article>
  )
}

// Tarjeta vacía: espacio reservado para un producto futuro
export const EmptyCard = () => (
  <div aria-hidden="true" className="rounded-2xl border-2 border-dashed border-jar-200 bg-white/60 p-0 text-jar-300">
    <div className="grid aspect-[5/4] w-full place-items-center rounded-t-2xl bg-jar-50"><ImagePlus size={28} /></div>
    <div className="space-y-2 p-3">
      <div className="h-2.5 w-3/4 rounded bg-neutral-100" />
      <div className="h-3 w-1/3 rounded bg-neutral-100" />
      <div className="mt-2 rounded-full border border-dashed border-neutral-200 py-1.5 text-center text-[10px] font-bold text-neutral-300">PRÓXIMAMENTE</div>
    </div>
  </div>
)

export default function Shop() {
  const { products } = useApp()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todas')
  const [open, setOpen] = useState(null)
  // Enlace directo a un producto (por ejemplo, desde un aviso de bajada de precio)
  const [params, setParams] = useSearchParams()
  const linked = params.get('producto')
  useEffect(() => {
    if (!linked) return
    const p = products.find((x) => x.id === linked)
    if (p) setOpen(p)
  }, [linked]) // eslint-disable-line react-hooks/exhaustive-deps
  const closeProduct = () => { setOpen(null); if (linked) setParams({}, { replace: true }) }

  const list = useMemo(() => products.filter((p) => {
    const text = (p.name + ' ' + p.cat).toLowerCase().includes(q.toLowerCase())
    const c = cat === 'Todas' ? true : cat === 'novedad' || cat === 'oferta' ? p.tag === cat : p.cat === cat
    return text && c
  }), [products, q, cat])

  const title = cat === 'novedad' ? 'NOVEDADES' : cat === 'oferta' ? 'OFERTAS' : cat === 'Todas' ? 'PRODUCTOS DESTACADOS' : cat.toUpperCase()
  const empties = q || cat !== 'Todas' ? 0 : 4 + ((4 - (list.length % 4)) % 4)

  return (
    <div className="bg-white">
      <SubNav search={q} onSearch={setQ} category={cat} onCategory={setCat} categories={CATEGORIES} active={cat === 'novedad' || cat === 'oferta' ? cat : ''} />

      <section className="relative flex min-h-[210px] items-center overflow-hidden bg-neutral-100">
        <div className="relative z-10 px-6 py-8 md:px-14">
          <h1 className="text-3xl font-extrabold leading-tight text-neutral-800 md:text-[40px]">DESCUBRE<br /><span className="font-medium">TU BELLEZA</span></h1>
          <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })} className="btn mt-4">COMPRAR AHORA</button>
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-[62%] grid-cols-4 md:grid">
          {BANNERS.map((b) => <img key={b} src={b} alt="" className="h-full w-full object-cover" />)}
          <span className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-neutral-100 to-transparent" />
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="mb-5 text-center text-sm font-extrabold tracking-wide text-neutral-800">{title}</h2>
        {list.length === 0 && <p className="py-10 text-center text-xs text-neutral-500">No encontramos productos con ese filtro. <button className="font-bold text-jar-600 underline" onClick={() => { setQ(''); setCat('Todas') }}>Ver todo</button></p>}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}
          {Array.from({ length: empties }, (_, i) => <EmptyCard key={'e' + i} />)}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-10 md:grid-cols-[1.1fr_1fr_1fr]">
        <Link to="/tienda" onClick={() => setCat('oferta')} className="flex min-h-[130px] flex-col justify-center rounded-2xl bg-brand p-6 text-white transition hover:brightness-105">
          <b className="text-xl font-extrabold leading-tight">DESCUBRE<br /><span className="font-medium">TU BELLEZA</span></b>
          <span className="mt-2 text-[11px] opacity-80">Ver ofertas de la semana</span>
        </Link>
        <img src="/img/banner-sundae.jpg" alt="" className="h-full min-h-[130px] w-full rounded-2xl object-cover" />
        <img src="/img/paleta-florecer.jpg" alt="" className="h-full min-h-[130px] w-full rounded-2xl object-cover" />
      </section>
      <ProductModal key={open?.id} product={open && (products.find((x) => x.id === open.id) || open)} onClose={closeProduct} />
    </div>
  )
}
