import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Field, Logo, Modal } from './ui'

/* Footer único de Jarusa: siempre al final de la página, con newsletter, novedades y ayuda escrita */
export default function Footer() {
  const { notify, user } = useApp()
  const [mail, setMail] = useState('')
  const subscribe = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(mail)) return notify('Escribe un correo válido, por ejemplo nombre@correo.com', 'err')
    // No hay servicio de correo conectado: no se simula una suscripción exitosa
    notify('La suscripción a la newsletter todavía no está disponible. Tu correo no se guardó.', 'info')
  }

  // Ayuda por escrito: valida el mensaje, pero no finge enviarlo (no hay servicio que lo reciba)
  const [help, setHelp] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const formRef = useRef(null)
  const openHelp = () => {
    setForm((f) => ({ name: f.name || user?.name || '', email: f.email || user?.email || '', message: f.message }))
    setErrors({}); setStatus(''); setHelp(true)
  }
  const field = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })) }
  const sendHelp = (e) => {
    e.preventDefault()
    const err = {}
    if (!form.name.trim()) err.name = 'Escribe tu nombre.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.'
    if (form.message.trim().length < 10) err.message = 'Cuéntanos tu consulta con al menos 10 caracteres.'
    setErrors(err)
    const first = Object.keys(err)[0]
    if (first) { setStatus(''); formRef.current?.elements[first]?.focus(); return }
    setStatus('El envío de mensajes desde la web todavía no está disponible, así que tu mensaje no se ha enviado. Lo conservamos en este formulario mientras sigas en la página.')
  }
  const fieldErr = (k) => errors[k] && <span id={`help-${k}-err`} className="mt-1 block text-xs font-semibold text-rose-700">{errors[k]}</span>
  const aria = (k) => ({ name: k, 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `help-${k}-err` : undefined })

  return (
    <footer className="site-footer mt-auto bg-brand text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-5 px-6 py-7 md:grid-cols-[1fr_auto_1fr]">
        <div className="text-center md:text-left">
          <Logo className="text-2xl" to="/" />
          <p className="mt-1 text-[10px] text-white/90">La ciencia de la belleza natural</p>
        </div>
        <form onSubmit={subscribe} className="flex w-full items-center justify-center gap-2 md:w-auto">
          <span className="hidden whitespace-nowrap text-xs font-bold lg:block" aria-hidden="true">Suscríbete a nuestra newsletter</span>
          <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="tucorreo@ejemplo.com" aria-label="Correo para la newsletter" autoComplete="email" className="min-w-0 flex-1 rounded-full px-4 py-2 text-[11px] text-neutral-800 focus:outline-none focus:ring-2 focus:ring-white/60 md:w-56 md:flex-none" />
          <button className="rounded-full bg-neutral-700 px-4 py-2 text-[10px] font-bold hover:bg-neutral-800">SUSCRIBIRME</button>
        </form>
        <nav aria-label="Enlaces del pie de página" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold md:justify-end">
          <Link to="/tienda" className="underline-offset-4 hover:underline">Tienda</Link>
          <Link to="/novedades" className="underline-offset-4 hover:underline">Novedades</Link>
          <button type="button" onClick={openHelp} className="font-bold underline-offset-4 hover:underline">Ayuda por escrito</button>
          {user
            ? <Link to={user.role === 'admin' ? '/admin' : '/cuenta'} className="underline-offset-4 hover:underline">{user.role === 'admin' ? 'Panel' : 'Mi cuenta'}</Link>
            : <><Link to="/login" className="underline-offset-4 hover:underline">Iniciar sesión</Link><Link to="/registro" className="underline-offset-4 hover:underline">Registrarse</Link></>}
        </nav>
      </div>
      <p className="border-t border-white/20 px-6 py-3 text-center text-[10px] text-white/90">© {new Date().getFullYear()} Jarusa · Cosmética inspirada en la naturaleza</p>

      <Modal open={help} onClose={() => setHelp(false)} title="Ayuda por escrito">
        <form ref={formRef} onSubmit={sendHelp} noValidate className="space-y-3 text-neutral-800">
          <p className="text-xs text-neutral-700">Escríbenos tu consulta. Todos los campos son obligatorios.</p>
          <Field label="Nombre"><input className="input" value={form.name} onChange={field('name')} autoComplete="name" required data-autofocus {...aria('name')} />{fieldErr('name')}</Field>
          <Field label="Correo electrónico"><input type="email" className="input" value={form.email} onChange={field('email')} autoComplete="email" required {...aria('email')} />{fieldErr('email')}</Field>
          <Field label="Mensaje"><textarea rows={4} className="input resize-y" value={form.message} onChange={field('message')} required {...aria('message')} />{fieldErr('message')}</Field>
          <div role="status" aria-live="polite">{status && <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{status}</p>}</div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button type="button" onClick={() => setHelp(false)} className="btn-outline">CERRAR</button>
            <button type="submit" className="btn">ENVIAR MENSAJE</button>
          </div>
        </form>
      </Modal>
    </footer>
  )
}
