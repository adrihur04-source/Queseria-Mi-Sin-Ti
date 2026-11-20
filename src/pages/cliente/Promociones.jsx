// Promociones.jsx — Productos con descuento
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import TarjetaProducto from '../../components/cliente/TarjetaProducto'
import BottomNav from '../../components/layout/BottomNav'
import { tienePromo } from '../../utils/precio'

export default function Promociones() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esCliente = usuario?.role === 'cliente' || !usuario?.role
  const { productos, cargando } = useProductosTienda()

  const promos = useMemo(
    () => productos.filter(tienePromo).sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || b.descuentoPorcentaje - a.descuentoPorcentaje),
    [productos],
  )
  const maximo = promos.reduce((m, p) => Math.max(m, p.descuentoPorcentaje), 0)

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda />

      <section className="relative overflow-hidden bg-vino-oscuro text-marfil">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-miel-claro/30" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-72 w-72 rounded-full border border-miel-claro/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-miel-claro">Por tiempo limitado</p>
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">Promociones</h1>
          <p className="mt-2 max-w-md text-marfil/75">
            {promos.length ? `${promos.length} producto${promos.length === 1 ? '' : 's'} con hasta ${maximo}% de descuento.` : 'Descuentos especiales en productos seleccionados.'}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        {cargando ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="tarjeta aspect-[3/4] animate-pulse" />)}
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-vino/60"><Tag size={30} /></span>
            <p className="font-display text-xl text-cacao">Por ahora no hay promociones</p>
            <p className="text-sm text-textoSecundario">Vuelve pronto o síguenos en redes para enterarte primero.</p>
            <button onClick={() => navigate('/catalogo')} className="btn-secundario mt-1">Ver catálogo</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {promos.map((p) => <TarjetaProducto key={p.id} producto={p} puedeComprar={esCliente} />)}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
