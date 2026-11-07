import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Field, PasswordInput } from '../components/ui'
import { SplitShell, Title } from './AuthShell'

export function Recover() {
  const { startReset, notify } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Escribe un correo válido.')
    const code = startReset(email)
    if (!code) return setErr('No encontramos una cuenta con ese correo.')
    notify(`Código de prueba: ${code} (en producción llegaría por correo)`)
    nav('/verificar')
  }
  return (
    <SplitShell>
      <Title icon={<Mail size={18} />} sub="Ingresa tu correo de Gmail y te enviaremos un código de 6 dígitos para restablecer tu contraseña.">RECUPERAR CONTRASEÑA</Title>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Correo Electrónico"><input className="input" type="email" placeholder="tucorreo@gmail.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} /></Field>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{err}</p>}
        <button className="btn w-full">ENVIAR CÓDIGO</button>
      </form>
      <p className="mt-3 text-center text-[11px] text-neutral-500">¿Ya la recordaste? <Link to="/login" className="font-bold text-neutral-800 hover:text-jar-600">Inicia sesión</Link></p>
      <p className="mt-3 rounded-lg bg-neutral-100 p-2.5 text-[10px] text-neutral-500">Prueba con <b>user@hola.com</b> o <b>admin@hola.com</b>.</p>
    </SplitShell>
  )
}

export function Verify() {
  const { reset, startReset, notify } = useApp()
  const nav = useNavigate()
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [secs, setSecs] = useState(45)
  const [err, setErr] = useState('')
  const refs = useRef([])

  useEffect(() => {
    if (secs <= 0) return
    const t = setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secs])

  if (!reset) return <Navigate to="/recuperar" replace />

  const put = (i, v) => {
    const d = v.replace(/\D/g, '')
    if (!d) return
    const next = [...digits]
    d.split('').slice(0, 6 - i).forEach((c, k) => (next[i + k] = c))
    setDigits(next); setErr('')
    refs.current[Math.min(i + d.length, 5)]?.focus()
  }
  const key = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits]
      if (next[i]) next[i] = ''; else if (i > 0) { next[i - 1] = ''; refs.current[i - 1]?.focus() }
      setDigits(next)
    }
  }
  const submit = (e) => {
    e.preventDefault()
    if (digits.join('') === reset.code) { notify('Código verificado'); nav('/nueva-contrasena') }
    else setErr('El código no es correcto. Inténtalo de nuevo.')
  }
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')

  return (
    <SplitShell>
      <Title icon={<ShieldCheck size={18} />} sub={`Enviamos un código de 6 dígitos a ${reset.email}. Revisa tu bandeja de entrada o spam.`}>VERIFICAR CÓDIGO</Title>
      <form onSubmit={submit}>
        <div className="mb-3 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input key={i} ref={(el) => (refs.current[i] = el)} value={d} inputMode="numeric" maxLength={6} aria-label={`Dígito ${i + 1}`} onChange={(e) => put(i, e.target.value)} onKeyDown={(e) => key(i, e)} onFocus={(e) => e.target.select()} className={`h-10 w-9 rounded-lg border text-center text-base font-extrabold focus:border-jar-500 focus:outline-none focus:ring-2 focus:ring-jar-200 ${d ? 'border-jar-400 bg-jar-50' : 'border-neutral-200'}`} />
          ))}
        </div>
        {err && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-center text-[11px] font-medium text-rose-700">{err}</p>}
        <p className="mb-3 text-center text-[11px] text-neutral-500">
          ¿No recibiste el código?{' '}
          {secs > 0 ? <span>Reenviar en {mm}:{ss}</span> : <button type="button" className="font-bold text-jar-600 hover:underline" onClick={() => { const c = startReset(reset.email); setSecs(45); notify(`Nuevo código de prueba: ${c}`) }}>Reenviar ahora</button>}
        </p>
        <button className="btn w-full" disabled={digits.some((d) => !d)}>VERIFICAR CÓDIGO</button>
      </form>
      <p className="mt-3 text-center text-[11px] text-neutral-500">¿Te equivocaste de correo? <Link to="/recuperar" className="font-bold text-neutral-800 hover:text-jar-600">Cámbialo aquí</Link></p>
      <p className="mt-3 rounded-lg bg-neutral-100 p-2.5 text-[10px] text-neutral-500">Demo: el código de prueba aparece en el aviso inferior. Para este envío es <b className="tracking-widest text-neutral-800">{reset.code}</b>.</p>
    </SplitShell>
  )
}

export function NewPassword() {
  const { reset, finishReset, notify } = useApp()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')
  if (!reset) return <Navigate to="/recuperar" replace />

  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw)]
  const score = checks.filter(Boolean).length
  const label = ['Débil', 'Débil', 'Media', 'Buena'][score]
  const submit = (e) => {
    e.preventDefault()
    if (score < 3) return setErr('Mínimo 8 caracteres, 1 mayúscula y 1 número.')
    if (pw !== pw2) return setErr('Las contraseñas no coinciden.')
    finishReset(pw)
    notify('Contraseña actualizada. Ya puedes iniciar sesión.')
    nav('/login')
  }
  return (
    <SplitShell>
      <Title icon={<KeyRound size={18} />} sub="Crea una contraseña segura. Después podrás iniciar sesión con ella.">NUEVA CONTRASEÑA</Title>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Nueva contraseña"><PasswordInput value={pw} onChange={(e) => { setPw(e.target.value); setErr('') }} autoComplete="new-password" /></Field>
        <Field label="Confirmar contraseña"><PasswordInput value={pw2} onChange={(e) => { setPw2(e.target.value); setErr('') }} autoComplete="new-password" /></Field>
        <div>
          <div className="flex gap-1">{[0, 1, 2].map((i) => <i key={i} className={`h-1 flex-1 rounded-full ${i < score ? (score === 3 ? 'bg-emerald-500' : 'bg-jar-400') : 'bg-neutral-200'}`} />)}</div>
          <p className="mt-1 text-[10px] text-neutral-500">Seguridad: <b className="text-neutral-700">{label}</b> · mínimo 8 caracteres, 1 mayúscula y 1 número</p>
        </div>
        {err && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700">{err}</p>}
        <button className="btn w-full">GUARDAR CONTRASEÑA</button>
      </form>
      <p className="mt-3 text-center text-[11px] text-neutral-500">¿Ya la actualizaste? <Link to="/login" className="font-bold text-neutral-800 hover:text-jar-600">Inicia sesión</Link></p>
    </SplitShell>
  )
}
