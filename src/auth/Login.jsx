import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Field, Logo, PasswordInput, readImage } from '../components/ui'
import { SoloShell, SplitShell, Social, Title } from './AuthShell'

export function Login() {
  const { login, notify, resetDemo } = useApp()
  const nav = useNavigate()
  const from = useLocation().state?.from
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email || !pw) return setErr('Ingresa tu correo y contraseña.')
    const u = login(email, pw)
    if (!u) return setErr('Correo o contraseña incorrectos.')
    notify(`Bienvenida de vuelta, ${u.name.split(' ')[0]}`)
    nav(u.role === 'admin' ? '/admin' : from && from !== '/login' ? from : '/tienda')
  }
  const fill = (e, p) => { setEmail(e); setPw(p); setErr('') }

  return (
    <SplitShell>
      <Title sub="Inicia sesión para empezar a comprar">INICIAR SESIÓN</Title>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Correo Electrónico"><input className="input" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} /></Field>
        <Field label="Contraseña"><PasswordInput autoComplete="current-password" value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} /></Field>
        <div className="flex items-center justify-between text-[11px]">
          <label className="flex items-center gap-1.5 text-neutral-600"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-jar-600" />Recordarme</label>
          <Link to="/recuperar" className="font-semibold text-neutral-700 hover:text-jar-600 hover:underline">¿Olvidó su contraseña?</Link>
        </div>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{err}</p>}
        <button className="btn w-full">INICIAR SESIÓN</button>
      </form>
      <div className="my-3 flex items-center gap-2 text-[10px] text-neutral-400"><i className="h-px flex-1 bg-neutral-200" />O inicia sesión con<i className="h-px flex-1 bg-neutral-200" /></div>
      <Social onClick={(n) => notify(`El acceso con ${n} todavía no está disponible. Usa tu correo y contraseña.`, 'info')} />
      <p className="mt-3 text-center text-[11px] text-neutral-500">¿No tienes cuenta? <Link to="/registro" className="font-bold text-neutral-800 hover:text-jar-600">Regístrate aquí</Link></p>

      <div className="mt-4 rounded-xl bg-neutral-100 p-3 text-[10px] leading-relaxed text-neutral-600">
        <b className="text-neutral-800">Cuentas de prueba</b> (clic para autocompletar)
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => fill('user@hola.com', 'user12345')} className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm hover:bg-jar-50">Usuario · user@hola.com</button>
          <button type="button" onClick={() => fill('admin@hola.com', 'admin12345')} className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm hover:bg-jar-50">Admin · admin@hola.com</button>
        </div>
        <p className="mt-1.5">El login redirige según el rol: Usuario → Tienda · Admin → Panel admin.</p>
        <button type="button" onClick={resetDemo} className="mt-1 underline hover:text-jar-600">Restablecer datos de la demo</button>
      </div>
    </SplitShell>
  )
}

export function Register() {
  const { register, notify } = useApp()
  const nav = useNavigate()
  const file = useRef(null)
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '', phone: '', terms: false })
  const [photo, setPhoto] = useState(null)
  const [err, setErr] = useState('')
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }); setErr('') }

  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim() || !f.email.trim() || !f.pw) return setErr('Completa nombre, correo y contraseña.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Escribe un correo válido.')
    if (f.pw.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.')
    if (f.pw !== f.pw2) return setErr('Las contraseñas no coinciden.')
    if (!f.terms) return setErr('Debes aceptar los Términos y Condiciones.')
    const r = register({ name: f.name, email: f.email, password: f.pw, phone: f.phone, photo })
    if (r.error) return setErr(r.error)
    notify('¡Cuenta creada! Bienvenida a Jarusa')
    nav('/tienda')
  }

  return (
    <SoloShell>
      <div className="text-center"><Logo className="text-3xl text-neutral-700" /></div>
      <h1 className="mb-3 mt-1 text-center text-[15px] font-extrabold tracking-wide text-neutral-800">CREAR NUEVA CUENTA</h1>
      <form onSubmit={submit} className="space-y-2.5" noValidate>
        <div className="flex items-end gap-3">
          <Field label="Nombre Completo" className="flex-1"><input className="input" placeholder="Ej. Ana Pérez" value={f.name} onChange={set('name')} autoComplete="name" /></Field>
          <div className="text-center">
            <button type="button" onClick={() => file.current.click()} className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-neutral-500 hover:border-jar-400" aria-label="Subir foto">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <UserRound size={16} />}
            </button>
            <span className="text-[9px] text-neutral-500">Subir foto</span>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => e.target.files[0] && setPhoto(await readImage(e.target.files[0], 160))} />
          </div>
        </div>
        <Field label="Correo Electrónico"><input className="input" type="email" placeholder="tucorreo@ejemplo.com" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Contraseña"><PasswordInput value={f.pw} onChange={set('pw')} autoComplete="new-password" /></Field>
          <Field label="Confirmar Contraseña"><PasswordInput value={f.pw2} onChange={set('pw2')} autoComplete="new-password" /></Field>
        </div>
        <Field label="Número de Teléfono (opcional)"><input className="input" placeholder="+51 999 999 999" value={f.phone} onChange={set('phone')} autoComplete="tel" /></Field>
        <label className="flex items-center gap-1.5 text-[11px] text-neutral-600"><input type="checkbox" checked={f.terms} onChange={set('terms')} className="accent-jar-600" />Acepto los Términos y Condiciones</label>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{err}</p>}
        <button className="btn w-full">CREAR CUENTA</button>
      </form>
      <p className="mb-2 mt-3 text-center text-[10px] text-neutral-400">O regístrate con</p>
      <Social onClick={(n) => notify(`El registro con ${n} todavía no está disponible. Usa el formulario.`, 'info')} />
      <p className="mt-3 text-center text-[11px] text-neutral-500">¿Ya tienes cuenta? <Link to="/login" className="font-bold text-neutral-800 hover:text-jar-600">Inicia sesión aquí</Link></p>
    </SoloShell>
  )
}
