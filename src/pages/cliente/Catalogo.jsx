// Catalogo.jsx — Catálogo de la tienda
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, SlidersHorizontal, Tag, ArrowRight, SearchX } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import TarjetaProducto from '../../components/cliente/TarjetaProducto'
import BottomNav from '../../components/layout/BottomNav'
import { precioUnitario, tienePromo } from '../../utils/precio'

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61592518595144&locale=es_LA'
const INSTAGRAM_URL = 'https://www.instagram.com/queseriademisinti15/'

const ORDENES = [
  { id: 'relevancia', label: 'Destacados' },
  { id: 'nombre', label: 'Nombre (A–Z)' },
  { id: 'precio-asc', label: 'Precio: menor a mayor' },
  { id: 'precio-desc', label: 'Precio: mayor a menor' },
]

export default function Catalogo() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esCliente = usuario?.role === 'cliente' || !usuario?.role
  const { productos, cargando, error } = useProductosTienda()

  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [orden, setOrden] = useState('relevancia')
  const [soloDisponibles, setSoloDisponibles] = useState(false)

  const categorias = useMemo(() => {
    const conteo = {}
    for (const p of productos) if (p.categoria) conteo[p.categoria] = (conteo[p.categoria] || 0) + 1
    return [['Todos', productos.length], ...Object.entries(conteo).sort((a, b) => a[0].localeCompare(b[0]))]
  }, [productos])

  const enPromo = productos.filter(tienePromo).length

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase()
    const lista = productos.filter(
      (p) =>
        (categoria === 'Todos' || p.categoria === categoria) &&
        (!soloDisponibles || p.stock > 0) &&
        (!t || [p.nombre, p.marca, p.categoria, p.descripcion].some((v) => (v || '').toLowerCase().includes(t))),
    )
    const orden_ = {
      relevancia: (a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(tienePromo(b)) - Number(tienePromo(a)) || a.nombre.localeCompare(b.nombre),
      nombre: (a, b) => a.nombre.localeCompare(b.nombre),
      'precio-asc': (a, b) => precioUnitario(a) - precioUnitario(b),
      'precio-desc': (a, b) => precioUnitario(b) - precioUnitario(a),
    }[orden]
    return lista.sort(orden_)
  }, [productos, busqueda, categoria, orden, soloDisponibles])

  const limpiar = () => {
    setBusqueda('')
    setCategoria('Todos')
    setSoloDisponibles(false)
  }

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda />

      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="sobretitulo mb-1">Nuestra tienda</p>
            <h1 className="titulo-seccion">Catálogo</h1>
          </div>
          <div className="flex gap-2 text-sm">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-fantasma h-10 px-3">Instagram</a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="btn-fantasma h-10 px-3">Facebook</a>
          </div>
        </div>

        {enPromo > 0 && (
          <button onClick={() => navigate('/promociones')} className="mb-5 flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-vino-oscuro px-5 py-4 text-left text-marfil transition hover:bg-vino">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10"><Tag size={20} /></span>
            <span className="flex-1">
              <span className="block font-display text-lg font-semibold text-white">{enPromo} producto{enPromo === 1 ? '' : 's'} en promoción</span>
              <span className="text-sm text-marfil/70">Descuentos por tiempo limitado</span>
            </span>
            <ArrowRight size={20} />
          </button>
        )}

        {/* Búsqueda y orden */}
        <div className="sticky top-16 z-30 -mx-4 space-y-3 bg-crema/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar quesos, cervezas, dulces…" aria-label="Buscar productos" className="campo h-12 pl-11 pr-11" />
              {busqueda && (
                <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
                  <X size={18} />
                </button>
              )}
            </div>
            <label className="relative">
              <span className="sr-only">Ordenar</span>
              <SlidersHorizontal size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textoSecundario" />
              <select value={orden} onChange={(e) => setOrden(e.target.value)} className="campo h-12 w-12 appearance-none pl-9 text-transparent sm:w-auto sm:pr-4 sm:text-textoPrincipal">
                {ORDENES.map((o) => <option key={o.id} value={o.id} className="text-textoPrincipal">{o.label}</option>)}
              </select>
            </label>
          </div>
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {categorias.map(([c, n]) => (
              <button key={c} onClick={() => setCategoria(c)} className={`${categoria === c ? 'chip-activo' : 'chip-inactivo'} h-10`}>
                {c} <span className="text-xs opacity-60">{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 mt-2 flex items-center justify-between text-sm text-textoSecundario">
          <span>{cargando ? 'Cargando…' : `${visibles.length} producto${visibles.length === 1 ? '' : 's'}`}</span>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={soloDisponibles} onChange={(e) => setSoloDisponibles(e.target.checked)} className="h-4 w-4 accent-vino" />
            Solo disponibles
          </label>
        </div>

        {error ? (
          <p className="tarjeta p-6 text-center text-sm text-error">No se pudo cargar el catálogo. Revisa tu conexión.</p>
        ) : cargando ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="tarjeta animate-pulse overflow-hidden"><div className="aspect-square bg-pergamino" /><div className="h-20" /></div>
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-cacao/50"><SearchX size={30} /></span>
            <p className="font-display text-xl text-cacao">{busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos aquí'}</p>
            <p className="text-sm text-textoSecundario">Prueba con otra palabra o revisa otra categoría.</p>
            <button onClick={limpiar} className="btn-secundario mt-1">Ver todo el catálogo</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visibles.map((p) => <TarjetaProducto key={p.id} producto={p} puedeComprar={esCliente} />)}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
