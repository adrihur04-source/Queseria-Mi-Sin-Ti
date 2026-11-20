// Perfil.jsx — Perfil del cliente
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth'
import { Eye, EyeOff, UserRound, Lock, Heart, Receipt, LogOut, ChevronRight, CheckCircle2, Mail, Phone, MapPin, Store, ClipboardList, Gift, Trash2, Home } from 'lucide-react'
import { useClub } from '../../hooks/useClub'
import { auth, db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../context/CarritoContext'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import BottomNav from '../../components/layout/BottomNav'
import Hoja from '../../components/staff/Hoja'
import Confirmacion from '../../components/staff/Confirmacion'
import { registrarEvento } from '../../utils/bitacora'
import Avatar from '../../components/Avatar'
import { prepararFotoPerfil } from '../../utils/foto'

function CampoPass({ id, label, valor, onCambio }) {
  const [ver, setVer] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="etiqueta">{label}</label>
      <div className="relative">
        <input id={id} type={ver ? 'text' : 'password'} value={valor} onChange={(e) => onCambio(e.target.value)} autoComplete={id === 'pass-actual' ? 'current-password' : 'new-password'} className="campo h-12 pr-12" />
        <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar' : 'Mostrar'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
          {ver ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

export default function Perfil() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { limpiarCarrito } = useCarrito()

  const [datos, setDatos] = useState({ nombre: usuario?.nombre || '', telefono: usuario?.telefono || '', direccion: usuario?.direccion || '' })
  const [panel, setPanel] = useState(null) // null | 'datos' | 'pass'
  const [borrador, setBorrador] = useState(datos)
  const [pass, setPass] = useState({ actual: '', nueva: '', confirmar: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [salir, setSalir] = useState(false)
  const club = useClub()
  const direcciones = Array.isArray(usuario?.direcciones) ? usuario.direcciones : usuario?.direccionEntrega?.calle ? [{ id: 'principal', alias: 'Casa', ...usuario.direccionEntrega }] : []
  const borrarDireccion = async (id) => {
    try {
      const resto = direcciones.filter((d) => d.id !== id)
      await updateDoc(doc(db, 'usuarios', usuario.uid), { direcciones: resto, direccionEntrega: resto[0] || null })
      avisar('Dirección eliminada')
    } catch {
      avisar('No se pudo eliminar')
    }
  }

  const correo = usuario?.email || ''
  const nombre = datos.nombre || 'Mi cuenta'

  const avisar = (m) => {
    setToast(m)
    setTimeout(() => setToast(''), 3000)
  }

  const abrir = (p) => {
    setError('')
    setBorrador(datos)
    setPass({ actual: '', nueva: '', confirmar: '' })
    setPanel(p)
  }

  const guardarDatos = async () => {
    if (!borrador.nombre.trim()) return setError('Escribe tu nombre.')
    if (borrador.telefono && !/^[\d\s+()-]{8,}$/.test(borrador.telefono)) return setError('Revisa el teléfono (mínimo 8 dígitos).')
    setGuardando(true)
    setError('')
    try {
      const limpio = { nombre: borrador.nombre.trim(), telefono: borrador.telefono.trim(), direccion: borrador.direccion.trim() }
      await updateDoc(doc(db, 'usuarios', usuario.uid), limpio)
      setDatos(limpio)
      setPanel(null)
      avisar('Datos guardados')
    } catch (err) {
      console.error(err)
      setError('No se pudieron guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarFoto = async (archivo) => {
    try {
      await updateDoc(doc(db, 'usuarios', usuario.uid), { foto: await prepararFotoPerfil(archivo) })
      avisar('Foto actualizada')
    } catch (err) {
      avisar(err.message || 'No se pudo subir la foto')
    }
  }

  const cambiarPass = async () => {
    if (!pass.actual) return setError('Escribe tu contraseña actual.')
    if (pass.nueva.length < 8) return setError('La nueva contraseña debe tener al menos 8 caracteres.')
    if (pass.nueva !== pass.confirmar) return setError('Las contraseñas no coinciden.')
    setGuardando(true)
    setError('')
    try {
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, pass.actual))
      await updatePassword(auth.currentUser, pass.nueva)
      setPanel(null)
      avisar('Contraseña actualizada')
    } catch (err) {
      setError(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 'Tu contraseña actual es incorrecta.' : err.code === 'auth/too-many-requests' ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo actualizar la contraseña.')
    } finally {
      setGuardando(false)
    }
  }

  const cerrarSesion = async () => {
    setGuardando(true)
    try {
      await registrarEvento({ modulo: 'Sesión', accion: 'Logout', descripcion: `Cierre de sesión · ${correo}`, usuarioNombre: nombre })
      limpiarCarrito()
      await signOut(auth)
      navigate('/', { replace: true })
    } catch {
      setGuardando(false)
      setSalir(false)
    }
  }

  const opciones = [
    { icono: ClipboardList, titulo: 'Mis pedidos', sub: 'Sigue en vivo lo que apartaste', accion: () => navigate('/historial') },
    { icono: Receipt, titulo: 'Mis compras', sub: 'Historial, tickets y volver a pedir', accion: () => navigate('/compras') },
    { icono: Gift, titulo: 'Club Quesero', sub: `${club.disponibles} puntos · nivel ${club.nivel.nombre} ${club.nivel.emoji}`, accion: () => navigate('/recompensas') },
    { icono: Heart, titulo: 'Favoritos', sub: 'Productos que guardaste', accion: () => navigate('/favoritos') },
    { icono: MapPin, titulo: 'Mis direcciones', sub: direcciones.length ? `${direcciones.length} guardada${direcciones.length === 1 ? '' : 's'}` : 'Se guardan al pedir a domicilio', accion: () => abrir('direcciones') },
    { icono: UserRound, titulo: 'Datos personales', sub: 'Nombre, teléfono y dirección', accion: () => abrir('datos') },
    { icono: Lock, titulo: 'Contraseña', sub: 'Cambia tu contraseña', accion: () => abrir('pass') },
  ]

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda titulo="Mi perfil" />

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-8">
        <div className="tarjeta p-6 text-center">
          <Avatar usuario={usuario} tam="h-24 w-24" texto="text-2xl" editable onCambiar={cambiarFoto} className="mx-auto shadow-elevada ring-4 ring-vino/10" />
          <p className="mt-1.5 text-xs text-textoSecundario">Toca para {usuario?.foto ? 'cambiar' : 'agregar'} tu foto</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-cacao">{nombre}</h1>
          <ul className="mt-4 space-y-2 border-t border-borde/60 pt-4 text-left text-sm text-textoSecundario">
            <li className="flex items-center gap-3"><Mail size={16} className="text-oliva" /> {correo}</li>
            <li className="flex items-center gap-3"><Phone size={16} className="text-oliva" /> {datos.telefono || 'Agrega tu teléfono para que te avisemos'}</li>
            {datos.direccion && <li className="flex items-center gap-3"><MapPin size={16} className="text-oliva" /> {datos.direccion}</li>}
          </ul>
        </div>

        <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
          {opciones.map(({ icono: Icono, titulo, sub, accion }) => (
            <li key={titulo}>
              <button onClick={accion} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vino/10 text-vino"><Icono size={18} /></span>
                <span className="flex-1"><span className="block text-sm font-semibold text-cacao">{titulo}</span><span className="text-xs text-textoSecundario">{sub}</span></span>
                <ChevronRight size={18} className="text-textoSecundario" />
              </button>
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2 rounded-xl bg-pergamino px-4 py-3 text-sm text-textoSecundario">
          <Store size={18} className="shrink-0 text-oliva" /> Aparta en línea y paga al recoger en tienda.
        </p>

        <button onClick={() => setSalir(true)} className="tarjeta flex min-h-[60px] w-full items-center gap-3 px-4 text-left text-error hover:bg-error/5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10"><LogOut size={18} /></span>
          <span className="text-sm font-semibold">Cerrar sesión</span>
        </button>
      </main>

      {panel === 'datos' && (
        <Hoja
          titulo="Datos personales"
          onCerrar={() => setPanel(null)}
          bloqueado={guardando}
          pie={<button onClick={guardarDatos} disabled={guardando} className="btn-primario h-12 w-full">{guardando ? 'Guardando…' : 'Guardar'}</button>}
        >
          <div><label htmlFor="p-nombre" className="etiqueta">Nombre</label><input id="p-nombre" value={borrador.nombre} onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })} autoComplete="name" className="campo h-12" /></div>
          <div><label htmlFor="p-tel" className="etiqueta">Teléfono</label><input id="p-tel" type="tel" value={borrador.telefono} onChange={(e) => setBorrador({ ...borrador, telefono: e.target.value })} autoComplete="tel" className="campo h-12" /></div>
          <div><label htmlFor="p-dir" className="etiqueta">Dirección <span className="font-normal text-textoSecundario">(opcional)</span></label><input id="p-dir" value={borrador.direccion} onChange={(e) => setBorrador({ ...borrador, direccion: e.target.value })} autoComplete="street-address" className="campo h-12" /></div>
          {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
        </Hoja>
      )}

      {panel === 'direcciones' && (
        <Hoja titulo="Mis direcciones" subtitulo="Para tus pedidos a domicilio" onCerrar={() => setPanel(null)}>
          {direcciones.length === 0 ? (
            <p className="py-6 text-center text-sm text-textoSecundario">Aún no tienes direcciones. Se guardan cuando pides a domicilio desde tu carrito.</p>
          ) : (
            <ul className="space-y-2">
              {direcciones.map((d) => (
                <li key={d.id} className="flex items-start gap-3 rounded-xl border border-borde p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vino/10 text-vino"><Home size={16} /></span>
                  <span className="min-w-0 flex-1 text-sm">
                    <b className="block text-cacao">{d.alias || 'Dirección'}</b>
                    <span className="text-textoSecundario">{d.calle}, {d.colonia}</span>
                  </span>
                  <button onClick={() => borrarDireccion(d.id)} aria-label={`Eliminar ${d.alias}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-textoSecundario hover:bg-error/10 hover:text-error"><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          )}
        </Hoja>
      )}

      {panel === 'pass' && (
        <Hoja
          titulo="Cambiar contraseña"
          subtitulo="Primero confirma la actual"
          onCerrar={() => setPanel(null)}
          bloqueado={guardando}
          pie={<button onClick={cambiarPass} disabled={guardando} className="btn-primario h-12 w-full">{guardando ? 'Actualizando…' : 'Actualizar contraseña'}</button>}
        >
          <CampoPass id="pass-actual" label="Contraseña actual" valor={pass.actual} onCambio={(v) => setPass({ ...pass, actual: v })} />
          <CampoPass id="pass-nueva" label="Nueva contraseña (mín. 8)" valor={pass.nueva} onCambio={(v) => setPass({ ...pass, nueva: v })} />
          <CampoPass id="pass-conf" label="Confirmar nueva" valor={pass.confirmar} onCambio={(v) => setPass({ ...pass, confirmar: v })} />
          {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
        </Hoja>
      )}

      {salir && (
        <Confirmacion peligro titulo="¿Cerrar sesión?" mensaje="Tu carrito se vaciará en este dispositivo." textoConfirmar="Cerrar sesión" textoCancelar="Quedarme" cargando={guardando} onConfirmar={cerrarSesion} onCancelar={() => setSalir(false)} />
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 top-20 z-[70] mx-auto flex max-w-sm animate-aparecer items-center gap-2 rounded-2xl bg-tinta px-4 py-3 text-sm font-medium text-white shadow-elevada">
          <CheckCircle2 size={18} className="text-exito" /> {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
