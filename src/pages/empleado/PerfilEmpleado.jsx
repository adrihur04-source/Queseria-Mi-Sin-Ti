// PerfilEmpleado.jsx — Perfil del cajero/empleado
// Guarda datos en Firestore (usuarios/{uid}), cambia contraseña con reautenticación
// y cierra sesión de verdad con signOut.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth'
import { Eye, EyeOff, UserRound, Lock, Bell, ClipboardList, LogOut, ChevronRight, CheckCircle2, Mail, Phone, MapPin, Trash2, Settings2 } from 'lucide-react'
import { auth, db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import Confirmacion from '../../components/staff/Confirmacion'
import { registrarEvento } from '../../utils/bitacora'
import Avatar from '../../components/Avatar'
import { prepararFotoPerfil } from '../../utils/foto'

const ROLES = { admin: 'Administración', empleado: 'Equipo de tienda', cliente: 'Cliente' }

function CampoContrasena({ id, label, valor, onCambio, visible, onVer, error }) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          autoComplete={id === 'actual' ? 'current-password' : 'new-password'}
          className={`campo h-12 pr-12 ${error ? 'border-error' : ''}`}
        />
        <button type="button" onClick={onVer} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

export default function PerfilEmpleado() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const base = usuario?.role === 'admin' ? '/admin' : '/empleado'

  const [vista, setVista] = useState('perfil')
  const [modalCerrar, setModalCerrar] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [toast, setToast] = useState('')

  // Datos guardados (lo que se muestra) y borrador (lo que se edita)
  const [datos, setDatos] = useState({
    nombre: usuario?.nombre || '',
    telefono: usuario?.telefono || '',
    direccion: usuario?.direccion || '',
  })
  const [borrador, setBorrador] = useState(datos)
  const [guardando, setGuardando] = useState(false)
  const [errorDatos, setErrorDatos] = useState('')

  const [pass, setPass] = useState({ actual: '', nueva: '', confirmar: '' })
  const [ver, setVer] = useState({ actual: false, nueva: false, confirmar: false })
  const [errorPass, setErrorPass] = useState('')
  const [actualizando, setActualizando] = useState(false)

  const correo = usuario?.email || ''
  const nombreMostrado = datos.nombre || 'Sin nombre'

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const guardarDatos = async () => {
    setErrorDatos('')
    if (!borrador.nombre.trim()) return setErrorDatos('El nombre no puede quedar vacío.')
    if (borrador.telefono && !/^[\d\s+()-]{8,}$/.test(borrador.telefono)) return setErrorDatos('Revisa el teléfono (mínimo 8 dígitos).')
    setGuardando(true)
    try {
      const limpio = { nombre: borrador.nombre.trim(), telefono: borrador.telefono.trim(), direccion: borrador.direccion.trim() }
      await updateDoc(doc(db, 'usuarios', usuario.uid), limpio)
      await registrarEvento({ modulo: 'Usuarios', accion: 'Editar', descripcion: `Actualizó sus datos de perfil · ${limpio.nombre}`, usuarioNombre: limpio.nombre })
      setDatos(limpio)
      setVista('perfil')
      mostrarToast('Datos guardados')
    } catch (err) {
      console.error(err)
      setErrorDatos(err.code === 'permission-denied' ? 'No tienes permiso para editar tu perfil.' : 'No se pudieron guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  // Foto de perfil: se recorta/comprime en el navegador y se guarda en usuarios/{uid}.foto
  const cambiarFoto = async (archivo) => {
    try {
      const foto = await prepararFotoPerfil(archivo)
      await updateDoc(doc(db, 'usuarios', usuario.uid), { foto })
      mostrarToast('Foto actualizada')
    } catch (err) {
      mostrarToast(err.code === 'permission-denied' ? 'No tienes permiso para cambiar tu foto' : err.message || 'No se pudo subir la foto')
    }
  }
  const quitarFoto = async () => {
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), { foto: null })
      mostrarToast('Foto eliminada')
    } catch {
      mostrarToast('No se pudo quitar la foto')
    }
  }

  const actualizarContrasena = async () => {
    setErrorPass('')
    if (!pass.actual) return setErrorPass('Ingresa tu contraseña actual.')
    if (pass.nueva.length < 8) return setErrorPass('La nueva contraseña debe tener al menos 8 caracteres.')
    if (pass.nueva !== pass.confirmar) return setErrorPass('Las contraseñas no coinciden.')
    setActualizando(true)
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, pass.actual)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, pass.nueva)
      await registrarEvento({ modulo: 'Sesión', accion: 'Editar', descripcion: `Cambio de contraseña · ${nombreMostrado}`, usuarioNombre: nombreMostrado })
      setPass({ actual: '', nueva: '', confirmar: '' })
      setVista('perfil')
      mostrarToast('Contraseña actualizada')
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setErrorPass('Tu contraseña actual es incorrecta.')
      else if (err.code === 'auth/too-many-requests') setErrorPass('Demasiados intentos. Espera unos minutos.')
      else setErrorPass('No se pudo actualizar la contraseña. Intenta de nuevo.')
    } finally {
      setActualizando(false)
    }
  }

  const cerrarSesion = async () => {
    setCerrando(true)
    try {
      await registrarEvento({ modulo: 'Sesión', accion: 'Logout', descripcion: `Cierre de sesión · ${correo}`, usuarioNombre: nombreMostrado })
      await signOut(auth)
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      setCerrando(false)
      setModalCerrar(false)
      mostrarToast('No se pudo cerrar sesión')
    }
  }

  // Fuerza de contraseña simple: longitud + variedad
  const fuerza = (() => {
    const p = pass.nueva
    if (!p) return null
    let s = 0
    if (p.length >= 8) s++
    if (p.length >= 12) s++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++
    return [
      { label: 'Muy débil', color: 'bg-error', w: '20%' },
      { label: 'Débil', color: 'bg-error', w: '40%' },
      { label: 'Aceptable', color: 'bg-miel', w: '60%' },
      { label: 'Fuerte', color: 'bg-exito', w: '80%' },
      { label: 'Muy fuerte', color: 'bg-exito', w: '100%' },
    ][s]
  })()

  // ── Editar datos ──
  if (vista === 'editar') {
    return (
      <div className="min-h-screen bg-crema pb-28">
        <EncabezadoStaff titulo="Datos personales" atras={false} acciones={<button onClick={() => { setBorrador(datos); setVista('perfil') }} className="btn-fantasma h-11 text-marfil hover:bg-white/10">Cancelar</button>} />
        <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
          <div>
            <label htmlFor="nombre" className="etiqueta">Nombre completo</label>
            <input id="nombre" value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} className="campo h-12" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="correo" className="etiqueta">Correo electrónico</label>
            <input id="correo" value={correo} disabled className="campo h-12 cursor-not-allowed bg-pergamino/50 text-textoSecundario" />
            <p className="mt-1 text-xs text-textoSecundario">Para cambiar el correo, pide ayuda a administración.</p>
          </div>
          <div>
            <label htmlFor="telefono" className="etiqueta">Teléfono</label>
            <input id="telefono" type="tel" value={borrador.telefono} onChange={(e) => setBorrador({ ...borrador, telefono: e.target.value })} className="campo h-12" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="direccion" className="etiqueta">Dirección</label>
            <input id="direccion" value={borrador.direccion} onChange={(e) => setBorrador({ ...borrador, direccion: e.target.value })} className="campo h-12" autoComplete="street-address" />
          </div>
          {errorDatos && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{errorDatos}</p>}
          <button onClick={guardarDatos} disabled={guardando} className="btn-primario h-14 w-full text-base">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
        <BottomNavEmpleado />
      </div>
    )
  }

  // ── Cambiar contraseña ──
  if (vista === 'contrasena') {
    return (
      <div className="min-h-screen bg-crema pb-28">
        <EncabezadoStaff titulo="Cambiar contraseña" atras={false} acciones={<button onClick={() => { setPass({ actual: '', nueva: '', confirmar: '' }); setErrorPass(''); setVista('perfil') }} className="btn-fantasma h-11 text-marfil hover:bg-white/10">Cancelar</button>} />
        <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
          <p className="text-sm text-textoSecundario">Por seguridad, primero confirma tu contraseña actual.</p>
          <CampoContrasena id="actual" label="Contraseña actual" valor={pass.actual} onCambio={(v) => setPass({ ...pass, actual: v })} visible={ver.actual} onVer={() => setVer({ ...ver, actual: !ver.actual })} />
          <div>
            <CampoContrasena id="nueva" label="Nueva contraseña" valor={pass.nueva} onCambio={(v) => setPass({ ...pass, nueva: v })} visible={ver.nueva} onVer={() => setVer({ ...ver, nueva: !ver.nueva })} />
            {fuerza && (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-pergamino"><div className={`h-full ${fuerza.color} transition-all`} style={{ width: fuerza.w }} /></div>
                <p className="mt-1 text-xs text-textoSecundario">{fuerza.label} · usa 8+ caracteres, mayúsculas, números y símbolos</p>
              </div>
            )}
          </div>
          <CampoContrasena id="confirmar" label="Confirmar nueva contraseña" valor={pass.confirmar} onCambio={(v) => setPass({ ...pass, confirmar: v })} visible={ver.confirmar} onVer={() => setVer({ ...ver, confirmar: !ver.confirmar })} error={pass.confirmar && pass.confirmar !== pass.nueva} />
          {errorPass && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{errorPass}</p>}
          <button onClick={actualizarContrasena} disabled={actualizando} className="btn-primario h-14 w-full text-base">
            {actualizando ? 'Actualizando…' : 'Actualizar contraseña'}
          </button>
        </div>
        <BottomNavEmpleado />
      </div>
    )
  }

  // ── Perfil ──
  const opciones = [
    { icono: UserRound, titulo: 'Datos personales', sub: 'Nombre, teléfono, dirección', accion: () => { setBorrador(datos); setVista('editar') } },
    { icono: Lock, titulo: 'Cambiar contraseña', sub: 'Seguridad de tu cuenta', accion: () => setVista('contrasena') },
    { icono: ClipboardList, titulo: 'Pedidos', sub: 'Pedidos por atender', accion: () => navigate(`${base}/pedidos`) },
    { icono: Bell, titulo: 'Alertas de stock', sub: 'Productos por reabastecer', accion: () => navigate(`${base}/alertas`) },
    ...(usuario?.role === 'admin' ? [{ icono: Settings2, titulo: 'Ajustes de la tienda', sub: 'Envío, horario y contacto', accion: () => navigate('/admin/ajustes') }] : []),
  ]

  return (
    <div className="min-h-screen bg-crema pb-28">
      <header className="relative overflow-hidden bg-tinta pb-24 pt-6 text-center text-marfil">
        <span className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 animate-deriva rounded-full bg-vino/50 blur-3xl" />
        <span className="pointer-events-none absolute -right-10 top-0 h-48 w-48 animate-deriva rounded-full bg-miel/30 blur-3xl [animation-delay:-8s]" />
        <p className="relative text-xs uppercase tracking-[0.24em] text-marfil/60">Mi perfil</p>
      </header>

      <div className="mx-auto -mt-16 max-w-lg space-y-5 px-4">
        <div className="vidrio rounded-3xl p-6 text-center">
          <div className="relative mx-auto -mt-16 w-fit">
            <Avatar usuario={usuario} tam="h-28 w-28" texto="text-3xl" editable onCambiar={cambiarFoto} className="shadow-elevada ring-4 ring-superficie" />
          </div>
          <p className="mt-2 text-xs text-textoSecundario">Toca tu foto para cambiarla{usuario?.foto && <> · <button onClick={quitarFoto} className="inline-flex items-center gap-1 font-medium text-error hover:underline"><Trash2 size={11} /> Quitar</button></>}</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-cacao">{nombreMostrado}</h1>
          <span className="mt-2 inline-block rounded-full bg-oliva/10 px-3 py-1 text-xs font-semibold text-oliva">
            {ROLES[usuario?.role] || 'Equipo de tienda'}
          </span>
          <ul className="mt-5 space-y-2 border-t border-borde/60 pt-4 text-left text-sm">
            <li className="flex items-center gap-3 text-textoSecundario"><Mail size={16} className="text-oliva" /> {correo}</li>
            <li className="flex items-center gap-3 text-textoSecundario"><Phone size={16} className="text-oliva" /> {datos.telefono || 'Sin teléfono'}</li>
            <li className="flex items-center gap-3 text-textoSecundario"><MapPin size={16} className="text-oliva" /> {datos.direccion || 'Sin dirección'}</li>
          </ul>
        </div>

        <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
          {opciones.map(({ icono: Icono, titulo, sub, accion }) => (
            <li key={titulo}>
              <button onClick={accion} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vino/10 text-vino"><Icono size={18} /></span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-cacao">{titulo}</span>
                  <span className="text-xs text-textoSecundario">{sub}</span>
                </span>
                <ChevronRight size={18} className="text-textoSecundario" />
              </button>
            </li>
          ))}
        </ul>

        <button onClick={() => setModalCerrar(true)} className="tarjeta flex min-h-[60px] w-full items-center gap-3 px-4 text-left text-error hover:bg-error/5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10"><LogOut size={18} /></span>
          <span className="text-sm font-semibold">Cerrar sesión</span>
        </button>
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 top-4 z-[70] mx-auto flex max-w-sm animate-aparecer items-center gap-2 rounded-2xl bg-tinta px-4 py-3 text-sm font-medium text-white shadow-elevada">
          <CheckCircle2 size={18} className="text-exito" /> {toast}
        </div>
      )}

      {modalCerrar && (
        <Confirmacion
          titulo="¿Cerrar sesión?"
          mensaje="Tendrás que volver a ingresar tu correo y contraseña la próxima vez."
          textoConfirmar="Cerrar sesión"
          textoCancelar="Quedarme"
          peligro
          cargando={cerrando}
          onConfirmar={cerrarSesion}
          onCancelar={() => setModalCerrar(false)}
        />
      )}

      <BottomNavEmpleado />
    </div>
  )
}
