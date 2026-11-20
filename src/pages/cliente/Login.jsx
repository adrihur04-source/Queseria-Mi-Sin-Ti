// Login.jsx — Inicio de sesión
// Estados: vacío, error de credenciales (la tarjeta se sacude), cuenta inactiva, cargando.
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { auth, db } from '../../firebase/config'
import { registrarEvento } from '../../utils/bitacora'
import FondoAutenticacion from '../../components/auth/FondoAutenticacion'

const MENSAJES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
}

const RUTA_POR_ROL = { admin: '/admin/dashboard', empleado: '/empleado/dashboard' }

export default function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0) // reinicia la animación de sacudida
  const [cargando, setCargando] = useState(false)

  const fallar = (mensaje) => {
    setError(mensaje)
    setIntento((n) => n + 1)
  }

  const entrar = async (e) => {
    e.preventDefault()
    setError('')
    if (!correo.trim() || !contrasena) return fallar('Escribe tu correo y tu contraseña.')
    setCargando(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, correo.trim(), contrasena)
      const snap = await getDoc(doc(db, 'usuarios', user.uid))
      const datos = snap.exists() ? snap.data() : {}

      // Cuenta desactivada por administración
      if (datos.activo === false) {
        await signOut(auth)
        return fallar('Tu cuenta está desactivada. Comunícate con la tienda para reactivarla.')
      }

      await registrarEvento({ modulo: 'Sesión', accion: 'Login', descripcion: `Login exitoso · ${correo.trim()}`, usuarioNombre: datos.nombre || correo.trim() })
      navigate(RUTA_POR_ROL[datos.role] || '/catalogo', { replace: true })
    } catch (err) {
      fallar(MENSAJES[err.code] || 'No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <FondoAutenticacion>
      <div key={intento} className={intento ? 'animate-sacudir' : ''}>
        <div className="text-center">
          <p className="sobretitulo mb-2">Bienvenido de vuelta</p>
          <h1 className="font-display text-3xl font-semibold text-cacao">Inicia sesión</h1>
          <p className="mt-2 text-sm text-textoSecundario">Aparta tus productos favoritos y recógelos en tienda.</p>
        </div>

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        <form onSubmit={entrar} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="correo" className="etiqueta">Correo electrónico</label>
            <div className="relative">
              <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario/70" />
              <input
                id="correo"
                type="email"
                autoComplete="email"
                autoFocus
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="campo h-12 pl-11"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contrasena" className="etiqueta">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario/70" />
              <input
                id="contrasena"
                type={ver ? 'text' : 'password'}
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className="campo h-12 pl-11 pr-12"
              />
              <button
                type="button"
                onClick={() => setVer(!ver)}
                aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino hover:text-vino"
              >
                {ver ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={cargando} className="btn-primario group h-12 w-full text-base">
            {cargando ? (
              <><Loader2 size={18} className="animate-spin" /> Entrando…</>
            ) : (
              <>Iniciar sesión <ArrowRight size={18} className="transition group-hover:translate-x-1" /></>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-textoSecundario/70">
          <span className="h-px flex-1 bg-borde" /> ¿Eres nuevo? <span className="h-px flex-1 bg-borde" />
        </div>

        <Link to="/registro" className="btn-secundario h-12 w-full">Crear una cuenta</Link>
      </div>
    </FondoAutenticacion>
  )
}
