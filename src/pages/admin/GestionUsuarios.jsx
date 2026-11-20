// GestionUsuarios.jsx — Usuarios y equipo (administración)
// Crear usa una app de Firebase SECUNDARIA para no cerrar la sesión del admin.
// Un usuario inactivo no puede iniciar sesión (lo validan Login y RoleRoute).
import { useState, useEffect, useMemo } from 'react'
import { createUserWithEmailAndPassword, getAuth, signOut as signOutSecundaria } from 'firebase/auth'
import { initializeApp, deleteApp } from 'firebase/app'
import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { Plus, Pencil, Trash2, Users, Copy, RefreshCw, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { auth, db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import BuscadorEncabezado from '../../components/staff/BuscadorEncabezado'
import Estadisticas from '../../components/staff/Estadisticas'
import Hoja from '../../components/staff/Hoja'
import Interruptor from '../../components/staff/Interruptor'
import Confirmacion from '../../components/staff/Confirmacion'
import { registrarEvento } from '../../utils/bitacora'

const ROLES = [
  { id: 'admin', label: 'Administración', clase: 'bg-vino text-white' },
  { id: 'empleado', label: 'Equipo de tienda', clase: 'bg-oliva/15 text-oliva' },
  { id: 'cliente', label: 'Cliente', clase: 'bg-pergamino text-textoSecundario' },
]
const rolDe = (id) => ROLES.find((r) => r.id === id) || ROLES[2]
const iniciales = (n) => (n || '?').split(' ').filter(Boolean).map((x) => x[0]).join('').toUpperCase().slice(0, 2)

function generarContrasena() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(10)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => chars[n % chars.length]).join('') + '!'
}

const VACIO = { nombre: '', correo: '', telefono: '', role: 'empleado', activo: true, password: '' }

export default function GestionUsuarios() {
  const { usuario: sesion } = useAuth()
  const responsable = sesion?.nombre || 'Administración'

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('equipo')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null) // null | 'nuevo' | usuario
  const [form, setForm] = useState(VACIO)
  const [verPass, setVerPass] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [creado, setCreado] = useState(null) // { correo, password } tras crear
  const [aEliminar, setAEliminar] = useState(null)

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'usuarios'),
        (s) => {
          setUsuarios(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
          setCargando(false)
        },
        () => setCargando(false),
      ),
    [],
  )

  const conteo = useMemo(
    () => ({
      equipo: usuarios.filter((u) => u.role === 'admin' || u.role === 'empleado').length,
      cliente: usuarios.filter((u) => u.role === 'cliente' || !u.role).length,
      inactivos: usuarios.filter((u) => u.activo === false).length,
    }),
    [usuarios],
  )

  const visibles = usuarios.filter((u) => {
    if (filtro === 'equipo' && !(u.role === 'admin' || u.role === 'empleado')) return false
    if (filtro === 'cliente' && !(u.role === 'cliente' || !u.role)) return false
    if (filtro === 'inactivos' && u.activo !== false) return false
    const t = busqueda.toLowerCase()
    return !t || [u.nombre, u.correo, u.telefono].some((v) => (v || '').toLowerCase().includes(t))
  })

  const esYo = (u) => u?.id === sesion?.uid

  const abrir = (u) => {
    setError('')
    setVerPass(false)
    setCreado(null)
    setEditando(u)
    setForm(u === 'nuevo' ? { ...VACIO, password: generarContrasena() } : { ...VACIO, ...u, role: u.role || 'cliente', activo: u.activo !== false, password: '' })
  }

  const guardar = async () => {
    setError('')
    const nombre = form.nombre.trim()
    if (!nombre) return setError('Escribe el nombre.')
    setGuardando(true)
    try {
      if (editando === 'nuevo') {
        const correo = form.correo.trim().toLowerCase()
        if (!/^\S+@\S+\.\S+$/.test(correo)) throw new Error('Revisa el correo.')
        if (form.password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')

        const appSec = initializeApp(auth.app.options, `secundaria-${Date.now()}`)
        const authSec = getAuth(appSec)
        try {
          const cred = await createUserWithEmailAndPassword(authSec, correo, form.password)
          await setDoc(doc(db, 'usuarios', cred.user.uid), {
            uid: cred.user.uid,
            nombre,
            correo,
            telefono: form.telefono.trim(),
            role: form.role,
            activo: form.activo,
            creado: serverTimestamp(),
          })
        } finally {
          await signOutSecundaria(authSec).catch(() => {})
          await deleteApp(appSec).catch(() => {})
        }
        await registrarEvento({ modulo: 'Usuarios', accion: 'Crear', descripcion: `Usuario creado · ${nombre} (${rolDe(form.role).label})`, usuarioNombre: responsable })
        setCreado({ correo, password: form.password })
      } else {
        const cambios = { nombre, telefono: form.telefono.trim() }
        // Nadie puede quitarse a sí mismo el rol de admin ni desactivarse
        if (!esYo(editando)) {
          cambios.role = form.role
          cambios.activo = form.activo
        }
        await updateDoc(doc(db, 'usuarios', editando.id), cambios)
        await registrarEvento({ modulo: 'Usuarios', accion: 'Editar', descripcion: `Usuario editado · ${nombre} (${rolDe(cambios.role || editando.role).label}${cambios.activo === false ? ', inactivo' : ''})`, usuarioNombre: responsable })
        setEditando(null)
      }
    } catch (err) {
      console.error(err)
      const mensajes = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/invalid-email': 'El correo no es válido.',
        'auth/weak-password': 'La contraseña es muy débil.',
        'permission-denied': 'No tienes permiso para esta acción.',
      }
      setError(mensajes[err.code] || err.message || 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    setGuardando(true)
    try {
      await deleteDoc(doc(db, 'usuarios', aEliminar.id))
      await registrarEvento({ modulo: 'Usuarios', accion: 'Eliminar', descripcion: `Perfil eliminado · ${aEliminar.nombre}`, usuarioNombre: responsable })
      setAEliminar(null)
    } catch (err) {
      console.error(err)
      setAEliminar(null)
    } finally {
      setGuardando(false)
    }
  }

  const copiar = (t) => navigator.clipboard?.writeText(t).catch(() => {})

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff
        titulo="Usuarios"
        subtitulo="Equipo, administración y clientes"
        acciones={<button onClick={() => abrir('nuevo')} className="btn h-11 bg-crema px-4 text-cacao hover:bg-superficie"><Plus size={18} /> Nuevo</button>}
      >
        <BuscadorEncabezado valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por nombre, correo o teléfono…" />
      </EncabezadoStaff>

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 md:px-8">
        <Estadisticas
          items={[
            { etiqueta: 'Equipo', valor: conteo.equipo },
            { etiqueta: 'Clientes', valor: conteo.cliente },
            { etiqueta: 'Inactivos', valor: conteo.inactivos, acento: conteo.inactivos ? 'text-miel' : 'text-cacao' },
          ]}
        />

        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
          {[['equipo', 'Equipo'], ['cliente', 'Clientes'], ['inactivos', 'Inactivos'], ['todos', 'Todos']].map(([id, label]) => (
            <button key={id} onClick={() => setFiltro(id)} className={`${filtro === id ? 'chip-activo' : 'chip-inactivo'} h-10`}>{label}</button>
          ))}
        </div>

        {cargando ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="tarjeta h-16 animate-pulse" />)}</div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-cacao/50"><Users size={30} /></span>
            <p className="font-display text-lg text-cacao">Sin usuarios en esta vista</p>
          </div>
        ) : (
          <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
            {visibles.map((u) => {
              const rol = rolDe(u.role)
              return (
                <li key={u.id} className={`flex min-h-[72px] items-center gap-3 px-4 py-3 ${u.activo === false ? 'bg-pergamino/30' : ''}`}>
                  {u.foto ? (
                    <img src={u.foto} alt="" className={`h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-superficie ${u.activo === false ? 'grayscale' : ''}`} />
                  ) : (
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${u.activo === false ? 'bg-borde text-textoSecundario' : 'bg-vino/10 text-vino'}`}>
                      {iniciales(u.nombre)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-cacao">
                      {u.nombre || 'Sin nombre'} {esYo(u) && <span className="font-normal text-textoSecundario">(tú)</span>}
                    </p>
                    <p className="truncate text-xs text-textoSecundario">{u.correo}{u.telefono && ` · ${u.telefono}`}</p>
                  </div>
                  <span className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline ${rol.clase}`}>{rol.label}</span>
                  {u.activo === false && <span className="rounded-full bg-miel/10 px-2 py-0.5 text-xs font-semibold text-miel">Inactivo</span>}
                  <button onClick={() => abrir(u)} aria-label={`Editar ${u.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-textoSecundario hover:bg-pergamino hover:text-cacao"><Pencil size={16} /></button>
                  {!esYo(u) && (
                    <button onClick={() => setAEliminar(u)} aria-label={`Eliminar ${u.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-textoSecundario hover:bg-error/10 hover:text-error"><Trash2 size={16} /></button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editando && (
        <Hoja
          titulo={creado ? 'Usuario creado' : editando === 'nuevo' ? 'Nuevo usuario' : 'Editar usuario'}
          subtitulo={editando !== 'nuevo' ? editando.correo : undefined}
          onCerrar={() => setEditando(null)}
          bloqueado={guardando}
          pie={
            creado ? (
              <button onClick={() => setEditando(null)} className="btn-primario h-12 w-full">Listo</button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditando(null)} className="btn-secundario h-12 flex-1">Cancelar</button>
                <button onClick={guardar} disabled={guardando} className="btn-primario h-12 flex-1">{guardando ? 'Guardando…' : editando === 'nuevo' ? 'Crear usuario' : 'Guardar'}</button>
              </div>
            )
          }
        >
          {creado ? (
            <div className="space-y-4">
              <p className="text-sm text-textoSecundario">Comparte estos datos con la persona por un medio seguro. Puede cambiar su contraseña desde su perfil.</p>
              {[['Correo', creado.correo], ['Contraseña', creado.password]].map(([k, v]) => (
                <div key={k} className="tarjeta flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-textoSecundario">{k}</p>
                    <p className="truncate font-mono text-sm text-cacao">{v}</p>
                  </div>
                  <button onClick={() => copiar(v)} aria-label={`Copiar ${k}`} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-pergamino"><Copy size={16} /></button>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="u-nombre" className="etiqueta">Nombre completo</label>
                <input id="u-nombre" autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="campo h-12" />
              </div>
              <div>
                <label htmlFor="u-correo" className="etiqueta">Correo</label>
                <input
                  id="u-correo"
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  disabled={editando !== 'nuevo'}
                  className="campo h-12 disabled:bg-pergamino/50 disabled:text-textoSecundario"
                />
                {editando !== 'nuevo' && <p className="mt-1 text-xs text-textoSecundario">El correo de acceso no se puede cambiar desde aquí.</p>}
              </div>
              <div>
                <label htmlFor="u-tel" className="etiqueta">Teléfono</label>
                <input id="u-tel" type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="campo h-12" />
              </div>
              {editando === 'nuevo' && (
                <div>
                  <label htmlFor="u-pass" className="etiqueta">Contraseña inicial</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input id="u-pass" type={verPass ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="campo h-12 pr-11 font-mono" />
                      <button type="button" onClick={() => setVerPass(!verPass)} aria-label={verPass ? 'Ocultar' : 'Mostrar'} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
                        {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button type="button" onClick={() => setForm({ ...form, password: generarContrasena() })} aria-label="Generar otra" className="flex h-12 w-12 items-center justify-center rounded-xl border border-borde bg-superficie text-cacao hover:bg-pergamino"><RefreshCw size={16} /></button>
                  </div>
                  <p className="mt-1 text-xs text-textoSecundario">Generada automáticamente. La verás al terminar para compartirla.</p>
                </div>
              )}
              <div>
                <p className="etiqueta">Rol</p>
                <div className="grid gap-2">
                  {ROLES.map((r) => (
                    <label key={r.id} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 ${form.role === r.id ? 'border-vino bg-vino/5' : 'border-borde bg-superficie'} ${esYo(editando) ? 'cursor-not-allowed opacity-60' : ''}`}>
                      <input type="radio" name="rol" checked={form.role === r.id} disabled={esYo(editando)} onChange={() => setForm({ ...form, role: r.id })} className="h-4 w-4 accent-vino" />
                      <span className="text-sm font-medium text-cacao">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Interruptor
                activo={form.activo}
                onCambio={(v) => setForm({ ...form, activo: v })}
                deshabilitado={esYo(editando)}
                etiqueta="Cuenta activa"
                sub="Si la desactivas, no podrá iniciar sesión"
              />
              {esYo(editando) && (
                <p className="flex gap-2 rounded-xl bg-pergamino px-4 py-3 text-xs text-textoSecundario">
                  <ShieldAlert size={16} className="shrink-0 text-oliva" /> No puedes cambiar tu propio rol ni desactivarte, para no quedarte sin acceso.
                </p>
              )}
              {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
            </>
          )}
        </Hoja>
      )}

      {aEliminar && (
        <Confirmacion
          peligro
          titulo={`¿Eliminar a ${aEliminar.nombre || aEliminar.correo}?`}
          mensaje="Se borra su perfil, pero su cuenta de acceso sigue existiendo en Firebase Authentication: si vuelve a entrar, lo hará como cliente. Para bloquearlo de verdad, mejor desactívalo; para borrarlo por completo, elimínalo también en la consola de Firebase."
          textoConfirmar="Sí, eliminar"
          cargando={guardando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      <BottomNavAdmin />
    </div>
  )
}
