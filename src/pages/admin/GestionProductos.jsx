// GestionProductos.jsx — Catálogo de productos (administración)
// Tabla en escritorio, tarjetas en móvil. Filtros por categoría y estado.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { Plus, Search, X, Trash2, Pencil, EyeOff, Tag, Package } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import Confirmacion from '../../components/staff/Confirmacion'
import { registrarEvento } from '../../utils/bitacora'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero } from '../../utils/formato'
import { stockDe, minDe, esAgotado, esBajo } from '../../utils/stock'

const ESTADOS = [
  { id: 'todos', label: 'Todos' },
  { id: 'visibles', label: 'Visibles' },
  { id: 'ocultos', label: 'Ocultos' },
  { id: 'promo', label: 'En promoción' },
  { id: 'agotados', label: 'Agotados' },
]

export default function GestionProductos() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todas')
  const [estado, setEstado] = useState('todos')
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'productos'),
        (snap) => {
          setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
          setCargando(false)
        },
        () => setCargando(false),
      ),
    [],
  )

  const categorias = useMemo(() => ['Todas', ...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => (a === 'Todas' ? -1 : a.localeCompare(b))), [productos])

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase()
    return productos.filter((p) => {
      if (categoria !== 'Todas' && p.categoria !== categoria) return false
      if (estado === 'visibles' && p.visibleCatalogo === false) return false
      if (estado === 'ocultos' && p.visibleCatalogo !== false) return false
      if (estado === 'promo' && !(p.enPromocion && Number(p.descuentoPorcentaje) > 0)) return false
      if (estado === 'agotados' && !esAgotado(p)) return false
      return !t || [p.nombre, p.marca, p.categoria].some((v) => (v || '').toLowerCase().includes(t))
    })
  }, [productos, busqueda, categoria, estado])

  const eliminar = async () => {
    setEliminando(true)
    setError('')
    try {
      await deleteDoc(doc(db, 'productos', aEliminar.id))
      await registrarEvento({ modulo: 'Productos', accion: 'Eliminar', descripcion: `Producto eliminado · ${aEliminar.nombre}`, usuarioNombre: usuario?.nombre || 'Administración' })
      setAEliminar(null)
    } catch (err) {
      console.error(err)
      setError('No se pudo eliminar el producto.')
      setAEliminar(null)
    } finally {
      setEliminando(false)
    }
  }

  const badgeStock = (p) =>
    esAgotado(p) ? (
      <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">Agotado</span>
    ) : (
      <span className={`text-sm font-medium ${esBajo(p) ? 'text-miel' : 'text-cacao'}`}>
        {stockDe(p)} <span className="text-xs font-normal text-textoSecundario">/ mín {minDe(p)}</span>
      </span>
    )

  const Miniatura = ({ p, tam = 'h-12 w-12' }) => {
    const img = obtenerImagen(p)
    return (
      <div className={`${tam} shrink-0 overflow-hidden rounded-xl bg-pergamino`}>
        {img ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-display text-lg text-cacao/30">{p.nombre?.[0]}</span>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff
        titulo="Productos"
        subtitulo={`${productos.length} en catálogo`}
        acciones={
          <button onClick={() => navigate('/admin/producto/nuevo')} className="btn h-11 bg-crema px-4 text-cacao hover:bg-superficie">
            <Plus size={18} /> Nuevo
          </button>
        }
      >
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-marfil/50" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, marca o categoría…"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-11 pr-11 text-sm text-white outline-none placeholder:text-marfil/50 focus:border-white/30 focus:bg-white/15"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-marfil/70 hover:bg-white/10">
              <X size={18} />
            </button>
          )}
        </div>
      </EncabezadoStaff>

      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-4 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="scrollbar-hide -mx-4 flex flex-1 gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {ESTADOS.map((e) => (
              <button key={e.id} onClick={() => setEstado(e.id)} className={`${estado === e.id ? 'chip-activo' : 'chip-inactivo'} h-10`}>{e.label}</button>
            ))}
          </div>
          <label className="relative">
            <span className="sr-only">Categoría</span>
            <Tag size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-oliva" />
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo h-10 w-auto py-0 pl-9 pr-8">
              {categorias.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>

        {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}

        {cargando ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="tarjeta h-16 animate-pulse" />)}</div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-cacao/50"><Package size={30} /></span>
            <p className="font-display text-lg text-cacao">{productos.length ? 'Sin coincidencias' : 'Aún no hay productos'}</p>
            {!productos.length && <button onClick={() => navigate('/admin/producto/nuevo')} className="btn-primario"><Plus size={18} /> Agregar el primero</button>}
          </div>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="tarjeta hidden overflow-hidden md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-borde bg-pergamino/40 text-xs uppercase tracking-wider text-textoSecundario">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Categoría</th>
                    <th className="px-4 py-3 text-right font-semibold">Precio</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borde/60">
                  {visibles.map((p) => (
                    <tr key={p.id} onClick={() => navigate(`/admin/producto/${p.id}`)} className="cursor-pointer hover:bg-crema">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Miniatura p={p} tam="h-10 w-10" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-cacao">{p.nombre}</p>
                            {p.marca && <p className="truncate text-xs text-textoSecundario">{p.marca}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-oliva">{p.categoria || <span className="text-textoSecundario">—</span>}</td>
                      <td className="px-4 py-3 text-right font-medium text-cacao">
                        {dinero(p.precio)}
                        {p.enPromocion && Number(p.descuentoPorcentaje) > 0 && <span className="ml-2 rounded-full bg-vino/10 px-1.5 py-0.5 text-[11px] font-semibold text-vino">-{p.descuentoPorcentaje}%</span>}
                      </td>
                      <td className="px-4 py-3">{badgeStock(p)}</td>
                      <td className="px-4 py-3">
                        {p.visibleCatalogo === false ? (
                          <span className="inline-flex items-center gap-1 text-xs text-textoSecundario"><EyeOff size={13} /> Oculto</span>
                        ) : (
                          <span className="text-xs font-medium text-exito">Visible</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => navigate(`/admin/producto/${p.id}`)} aria-label={`Editar ${p.nombre}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino hover:text-cacao"><Pencil size={16} /></button>
                          <button onClick={() => setAEliminar(p)} aria-label={`Eliminar ${p.nombre}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-textoSecundario hover:bg-error/10 hover:text-error"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <ul className="space-y-2 md:hidden">
              {visibles.map((p) => (
                <li key={p.id} className="tarjeta flex items-center gap-3 p-3">
                  <button onClick={() => navigate(`/admin/producto/${p.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Miniatura p={p} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-cacao">{p.nombre}</p>
                      <p className="truncate text-xs text-oliva">{p.categoria || 'Sin categoría'}{p.visibleCatalogo === false && <span className="text-textoSecundario"> · oculto</span>}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-sm font-semibold text-vino">{dinero(p.precio)}</span>
                        {badgeStock(p)}
                      </div>
                    </div>
                  </button>
                  <button onClick={() => setAEliminar(p)} aria-label={`Eliminar ${p.nombre}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-textoSecundario hover:bg-error/10 hover:text-error"><Trash2 size={18} /></button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {aEliminar && (
        <Confirmacion
          peligro
          titulo={`¿Eliminar "${aEliminar.nombre}"?`}
          mensaje="Desaparecerá del catálogo y del inventario. Los pedidos anteriores conservan su registro. Si solo quieres dejar de venderlo, mejor ocúltalo desde su ficha."
          textoConfirmar="Sí, eliminar"
          cargando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      <BottomNavAdmin />
    </div>
  )
}
