import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Modal } from './ui'

/* Tutorial de la tienda: un solo componente para visitantes, clientes y
   administradores. Se abre desde el menú de accesibilidad (personita), que
   está en todas las cabeceras, incluidas las de inicio de sesión. */
export const OPEN_TUTORIAL = 'jarusa:tutorial'
export const openTutorial = () => window.dispatchEvent(new Event(OPEN_TUTORIAL))

const COMMON = [
  ['Accesibilidad', 'El icono de la personita, arriba a la derecha, abre las opciones: paletas para daltonismo, tema claro u oscuro, temperatura visual, texto grande, modo lector de pantalla y avisos visuales, con sonido o vibración. Tus elecciones se recuerdan en este navegador.'],
  ['Teclado y lector de pantalla', 'Con Tab recorres enlaces y botones; con Mayús + Tab vuelves atrás. Al cargar una página, el primer enlace salta al contenido principal. Escape cierra ventanas y menús, y el foco vuelve al botón que los abrió.'],
]
const STEPS = {
  guest: [
    ['Bienvenida', 'Jarusa es una tienda de cosmética. Puedes ver la página de inicio y las novedades sin cuenta. Para comprar o guardar favoritos, inicia sesión o regístrate con los botones de la parte superior.'],
    ...COMMON,
    ['Novedades y promociones', 'En el pie de página está «Novedades». Allí verás los anuncios y promociones vigentes publicados por la tienda.'],
    ['Compra fácil', 'Compra fácil es un modo de compra en una sola página pensado para lector de pantalla. Se abre con el atajo Alt + Mayús + E o desde el menú de accesibilidad. Te pedirá iniciar sesión.'],
  ],
  user: [
    ['Bienvenida', 'Desde la tienda puedes buscar productos, filtrarlos por categoría y abrir cada uno para ver su detalle.'],
    ['Lista de deseos', 'El botón del corazón guarda un producto en tu lista de deseos. Si su precio baja, recibirás un aviso en la campanita con el precio anterior y el nuevo; al pulsarlo irás directo al producto.'],
    ['Campanita y novedades', 'La campanita guarda tus avisos: compras, estado de pedidos, anuncios y bajadas de precio. Desde allí también llegas a «Novedades y promociones».'],
    ['Compra fácil', 'Atajo Alt + Mayús + E (no se activa mientras escribes en un campo). Eliges productos, revisas el carrito y en «Entrega y pago» puedes editar la dirección de envío antes de confirmar.'],
    ...COMMON,
  ],
  admin: [
    ['Panel de administración', 'El menú lateral reúne Panel, Productos, Pedidos, Clientes, Reportes y Anuncios.'],
    ['Anuncios y promociones', 'En «Anuncios» creas novedades, anuncios o promociones con título, contenido, producto relacionado, imagen opcional, estado y fechas de publicación y expiración. Al publicarse, todas las cuentas reciben un aviso.'],
    ['Descuentos y lista de deseos', 'Si bajas el precio de un producto (editándolo o con una promoción con precio promocional), solo se avisa a los clientes que lo tienen en su lista de deseos, una sola vez por cada cambio. Si el precio sube o no cambia, no se envía ningún aviso.'],
    ['Pedidos', 'Al cambiar el estado de un pedido, el cliente recibe un aviso en su campanita.'],
    ...COMMON,
  ],
}

export function TutorialHost() {
  const { user } = useApp()
  const [open, setOpen] = useState(false)
  const [i, setI] = useState(0)
  const head = useRef(null)
  useEffect(() => {
    const h = () => { setI(0); setOpen(true) }
    window.addEventListener(OPEN_TUTORIAL, h)
    return () => window.removeEventListener(OPEN_TUTORIAL, h)
  }, [])
  // al cambiar de paso, el foco va al título del paso para que el lector lo lea
  useEffect(() => { if (open && i > 0) head.current?.focus() }, [i, open])
  const steps = STEPS[user ? (user.role === 'admin' ? 'admin' : 'user') : 'guest']
  const [title, text] = steps[Math.min(i, steps.length - 1)]
  const last = i >= steps.length - 1
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Tutorial de Jarusa">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">Paso {i + 1} de {steps.length}</p>
      <h3 ref={head} tabIndex={-1} className="mt-1 text-base font-extrabold text-neutral-800 focus:outline-none">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{text}</p>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button type="button" onClick={() => setI(i - 1)} disabled={i === 0} className="btn-outline disabled:opacity-40">ANTERIOR</button>
        {last
          ? <button type="button" onClick={() => setOpen(false)} className="btn">TERMINAR</button>
          : <button type="button" onClick={() => setI(i + 1)} className="btn" data-autofocus>SIGUIENTE</button>}
      </div>
    </Modal>
  )
}
