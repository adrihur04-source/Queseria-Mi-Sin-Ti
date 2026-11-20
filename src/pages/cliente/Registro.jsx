// Registro.jsx — Crear cuenta de cliente
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'
import Hoja from '../../components/staff/Hoja'
import { registrarEvento } from '../../utils/bitacora'
import FondoAutenticacion from '../../components/auth/FondoAutenticacion'

const TERMINOS = [
  ['Uso de la cuenta', 'Te pedimos que la información que registres sea verdadera y esté actualizada. Tu contraseña es personal, por lo que es importante que la mantengas segura y no la compartas con otras personas.'],
  ['Privacidad de tus datos', 'La información que nos proporciones será utilizada únicamente para gestionar tus pedidos, comunicarnos contigo cuando sea necesario y brindarte una mejor experiencia dentro de la aplicación. Tus datos no serán compartidos con terceros sin tu autorización.'],
  ['Pedidos', 'Los pedidos se realizan desde la aplicación para facilitar tu compra. El pago se efectúa directamente en la tienda al momento de recoger tus productos.'],
  ['Contenido de la aplicación', 'Las fotografías, el logotipo, los textos y demás contenido de la aplicación pertenecen a Quesería de mi sin ti. Si alguien desea utilizarlos, deberá contar con la autorización de la tienda.'],
]

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', contrasena: '', confirmar: '' })
  const [ver, setVer] = useState(false)
  const [terminos, setTerminos] = useState(false)
  const [verTerminos, setVerTerminos] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [cargando, setCargando] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Escribe tu nombre.'
    if (!/^\S+@\S+\.\S+$/.test(form.correo.trim())) e.correo = 'Escribe un correo válido.'
    if (form.telefono && !/^[\d\s+()-]{8,}$/.test(form.telefono)) e.telefono = 'Mínimo 8 dígitos.'
    if (form.contrasena.length < 8) e.contrasena = 'Al menos 8 caracteres.'
    if (form.confirmar !== form.contrasena) e.confirmar = 'Las contraseñas no coinciden.'
    return e
  }

  const registrar = async (ev) => {
    ev.preventDefault()
    setErrorGeneral('')
    const e = validar()
    setErrores(e)
    if (Object.keys(e).length) return
    setCargando(true)
    try {
      const correo = form.correo.trim().toLowerCase()
      const { user } = await createUserWithEmailAndPassword(auth, correo, form.contrasena)
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        nombre: form.nombre.trim(),
        correo,
        telefono: form.telefono.trim(),
        role: 'cliente',
        activo: true,
        creado: serverTimestamp(),
      })
      await registrarEvento({ modulo: 'Usuarios', accion: 'Crear', descripcion: `Registro de cliente · ${form.nombre.trim()}`, usuarioNombre: form.nombre.trim() })
      navigate('/catalogo', { replace: true })
    } catch (err) {
      setErrorGeneral(
        err.code === 'auth/email-already-in-use'
          ? 'Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?'
          : err.code === 'auth/invalid-email'
          ? 'El correo no es válido.'
          : 'No se pudo crear tu cuenta. Intenta de nuevo.',
      )
    } finally {
      setCargando(false)
    }
  }

  const campo = (k, label, props = {}) => (
    <div>
      <label htmlFor={`r-${k}`} className="etiqueta">{label}</label>
      <input id={`r-${k}`} value={form[k]} onChange={set(k)} aria-invalid={!!errores[k]} className={`campo h-12 ${errores[k] ? 'border-error' : ''}`} {...props} />
      {errores[k] && <p className="mt-1 text-xs font-medium text-error">{errores[k]}</p>}
    </div>
  )

  return (
    <FondoAutenticacion ancho="max-w-lg">
      <div>
          <div className="text-center">
            <p className="sobretitulo mb-2">Bienvenido</p>
            <h1 className="font-display text-3xl font-semibold text-cacao">Crea tu cuenta</h1>
            <p className="mt-2 text-sm text-textoSecundario">Aparta en línea y paga al recoger. Tarda menos de un minuto.</p>
          </div>
          {errorGeneral && (
            <div role="alert" className="mt-5 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {errorGeneral} {errorGeneral.includes('iniciar sesión') && <Link to="/login" className="underline">Entrar</Link>}
            </div>
          )}

          <form onSubmit={registrar} noValidate className="mt-6 space-y-4">
            {campo('nombre', 'Nombre completo', { autoComplete: 'name', placeholder: 'Nombre y apellido' })}
            {campo('correo', 'Correo electrónico', { type: 'email', autoComplete: 'email', placeholder: 'correo@ejemplo.com' })}
            {campo('telefono', 'Teléfono (opcional)', { type: 'tel', autoComplete: 'tel', placeholder: 'Para avisarte cuando tu pedido esté listo' })}
            <div className="grid gap-4 sm:grid-cols-2">
              {['contrasena', 'confirmar'].map((k) => (
                <div key={k}>
                  <label htmlFor={`r-${k}`} className="etiqueta">{k === 'contrasena' ? 'Contraseña' : 'Confirmar'}</label>
                  <div className="relative">
                    <input id={`r-${k}`} type={ver ? 'text' : 'password'} value={form[k]} onChange={set(k)} autoComplete="new-password" aria-invalid={!!errores[k]} className={`campo h-12 pr-11 ${errores[k] ? 'border-error' : ''}`} />
                    {k === 'contrasena' && (
                      <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
                        {ver ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                  {errores[k] && <p className="mt-1 text-xs font-medium text-error">{errores[k]}</p>}
                </div>
              ))}
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-textoSecundario">
              <input type="checkbox" checked={terminos} onChange={(e) => setTerminos(e.target.checked)} className="mt-0.5 h-4 w-4 accent-vino" />
              <span>
                Acepto los{' '}
                <button type="button" onClick={() => setVerTerminos(true)} className="font-medium text-vino underline">términos y condiciones</button>
              </span>
            </label>

            <button type="submit" disabled={cargando || !terminos} className="btn-primario h-12 w-full text-base">
              {cargando ? 'Creando tu cuenta…' : 'Crear cuenta'}
            </button>

            <p className="border-t border-borde/60 pt-5 text-center text-sm text-textoSecundario">
              ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-vino hover:underline">Inicia sesión</Link>
            </p>
          </form>
      </div>

      {verTerminos && (
        <Hoja
          titulo="Términos y condiciones"
          onCerrar={() => setVerTerminos(false)}
          pie={<button onClick={() => { setTerminos(true); setVerTerminos(false) }} className="btn-primario h-12 w-full">Aceptar</button>}
        >
          <p className="text-sm text-textoSecundario">Al crear una cuenta en Quesería de mi sin ti aceptas lo siguiente:</p>
          {TERMINOS.map(([t, d], i) => (
            <div key={t}>
              <p className="text-sm font-semibold text-cacao">{i + 1}. {t}</p>
              <p className="mt-1 text-sm leading-6 text-textoSecundario">{d}</p>
            </div>
          ))}
          <p className="text-sm text-textoSecundario">Gracias por confiar en nosotros.</p>
        </Hoja>
      )}
    </FondoAutenticacion>
  )
}
