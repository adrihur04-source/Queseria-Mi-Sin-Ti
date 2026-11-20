// GestionRoles.jsx — Roles del sistema
// Los 3 roles y sus permisos son fijos (los aplican las rutas de la app).
// Conteo de usuarios real; la descripción se guarda en la colección 'roles'.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore'
import { Check, Minus, Pencil, ShieldCheck, Store, UserRound, Users } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import Hoja from '../../components/staff/Hoja'
import { registrarEvento } from '../../utils/bitacora'

const ROLES = [
  { id: 'admin', nombre: 'Administración', icono: ShieldCheck, color: 'bg-vino text-white', descripcion: 'Acceso total: productos, usuarios, pedidos, inventario, proveedores y bitácora.' },
  { id: 'empleado', nombre: 'Equipo de tienda', icono: Store, color: 'bg-oliva text-white', descripcion: 'Atiende pedidos, registra entradas y salidas de inventario y consulta alertas de stock.' },
  { id: 'cliente', nombre: 'Cliente', icono: UserRound, color: 'bg-miel text-white', descripcion: 'Explora el catálogo, aparta pedidos y consulta su historial. Sin acceso administrativo.' },
]

// Permisos reales según las rutas protegidas de la app
const PERMISOS = [
  { grupo: 'Tienda', items: [
    ['Ver catálogo y promociones', ['admin', 'empleado', 'cliente']],
    ['Carrito, apartar pedidos y favoritos', ['cliente']],
    ['Historial de compras propio', ['cliente']],
  ] },
  { grupo: 'Operación', items: [
    ['Ver y atender pedidos', ['admin', 'empleado']],
    ['Cancelar pedidos (devuelve stock)', ['admin', 'empleado']],
    ['Ver inventario, lotes y alertas', ['admin', 'empleado']],
    ['Registrar entradas y salidas', ['admin', 'empleado']],
  ] },
  { grupo: 'Administración', items: [
    ['Crear, editar y eliminar productos', ['admin']],
    ['Categorías y proveedores', ['admin']],
    ['Usuarios y roles', ['admin']],
    ['Historial de ventas y bitácora', ['admin']],
  ] },
]

export default function GestionRoles() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [personalizados, setPersonalizados] = useState({})
  const [editando, setEditando] = useState(null)
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'usuarios'), (s) => setUsuarios(s.docs.map((d) => d.data())), () => {})
    const u2 = onSnapshot(
      collection(db, 'roles'),
      (s) => setPersonalizados(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))),
      () => {},
    )
    return () => {
      u1()
      u2()
    }
  }, [])

  const conteo = useMemo(() => {
    const c = { admin: 0, empleado: 0, cliente: 0 }
    for (const u of usuarios) c[u.role in c ? u.role : 'cliente']++
    return c
  }, [usuarios])

  const descripcion = (r) => personalizados[r.id]?.descripcion || r.descripcion

  const guardar = async () => {
    setGuardando(true)
    setError('')
    try {
      await setDoc(doc(db, 'roles', editando.id), { descripcion: texto.trim() }, { merge: true })
      await registrarEvento({ modulo: 'Usuarios', accion: 'Editar', descripcion: `Descripción del rol "${editando.nombre}" actualizada`, usuarioNombre: usuario?.nombre || 'Administración' })
      setEditando(null)
    } catch (err) {
      console.error(err)
      setError(err.code === 'permission-denied' ? 'Las reglas de Firestore no permiten escribir en la colección "roles".' : 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff titulo="Roles" subtitulo="Quién puede hacer qué en la app" />

      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-5 md:px-8">
        <ul className="grid gap-3 md:grid-cols-3">
          {ROLES.map((r) => {
            const Icono = r.icono
            return (
              <li key={r.id} className="tarjeta flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${r.color}`}><Icono size={20} /></span>
                  <button onClick={() => navigate('/admin/usuarios')} className="flex items-center gap-1.5 rounded-full bg-pergamino px-3 py-1 text-xs font-semibold text-cacao hover:bg-borde">
                    <Users size={13} /> {conteo[r.id]} usuario{conteo[r.id] === 1 ? '' : 's'}
                  </button>
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-cacao">{r.nombre}</p>
                <p className="mt-1 flex-1 text-sm leading-6 text-textoSecundario">{descripcion(r)}</p>
                <button
                  onClick={() => {
                    setError('')
                    setTexto(descripcion(r))
                    setEditando(r)
                  }}
                  className="btn-fantasma mt-3 h-10 justify-start px-0 text-vino hover:bg-transparent hover:underline"
                >
                  <Pencil size={14} /> Editar descripción
                </button>
              </li>
            )
          })}
        </ul>

        <section className="tarjeta overflow-hidden">
          <div className="border-b border-borde/60 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-cacao">Permisos por rol</h2>
            <p className="text-sm text-textoSecundario">Son fijos: los aplica la app en cada pantalla. Para cambiar el acceso de alguien, cambia su rol en Usuarios.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-pergamino/40 text-xs uppercase tracking-wider text-textoSecundario">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Permiso</th>
                  {ROLES.map((r) => <th key={r.id} className="w-28 px-3 py-3 text-center font-semibold">{r.nombre.split(' ')[0]}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERMISOS.map((g) => (
                  <FilaGrupo key={g.grupo} grupo={g} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editando && (
        <Hoja
          titulo={`Rol: ${editando.nombre}`}
          subtitulo="La descripción ayuda al equipo a entender el rol"
          onCerrar={() => setEditando(null)}
          bloqueado={guardando}
          pie={
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="btn-secundario h-12 flex-1">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !texto.trim()} className="btn-primario h-12 flex-1">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          }
        >
          <label htmlFor="rol-desc" className="etiqueta">Descripción</label>
          <textarea id="rol-desc" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} className="campo resize-none" />
          {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
        </Hoja>
      )}

      <BottomNavAdmin />
    </div>
  )
}

function FilaGrupo({ grupo }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="bg-crema px-5 py-2 text-xs font-semibold uppercase tracking-wider text-oliva">{grupo.grupo}</td>
      </tr>
      {grupo.items.map(([nombre, roles]) => (
        <tr key={nombre} className="border-t border-borde/40">
          <td className="px-5 py-3 text-cacao">{nombre}</td>
          {ROLES.map((r) => (
            <td key={r.id} className="px-3 py-3 text-center">
              {roles.includes(r.id) ? (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-exito/10 text-exito" aria-label="Sí"><Check size={15} /></span>
              ) : (
                <span className="inline-flex h-7 w-7 items-center justify-center text-borde" aria-label="No"><Minus size={15} /></span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
