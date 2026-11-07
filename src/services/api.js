// Cliente de la API REST (Express + SQLite). En desarrollo Vite reenvía /api al puerto 3001.
// La cabecera X-User-Email identifica la cuenta de demostración (no es autenticación segura).
export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors }
}

const OFFLINE = 'No se pudo conectar con el servidor de Jarusa. Revisa que la aplicación se haya iniciado con «npm run dev».'

export async function api(method, path, { user, body } = {}) {
  let res
  try {
    res = await fetch('/api' + path, {
      method,
      headers: { 'content-type': 'application/json', ...(user ? { 'x-user-email': user } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(OFFLINE, 0)
  }
  const data = await res.json().catch(() => null)
  // sin JSON y con 5xx: el proxy de Vite no encontró el backend
  if (!res.ok) throw new ApiError(data?.error || (data?.errors ? 'Revisa los campos marcados' : res.status >= 500 && !data ? OFFLINE : `Error del servidor (${res.status})`), res.status, data?.errors)
  return data
}
