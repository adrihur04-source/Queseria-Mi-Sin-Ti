// MiniCarrito.jsx — Carrito lateral: se abre sin salir de la página
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Store } from 'lucide-react'
import { useCarrito } from '../../context/CarritoContext'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero } from '../../utils/formato'
import { precioUnitario } from '../../utils/precio'

export default function MiniCarrito() {
  const navigate = useNavigate()
  const { carrito, cambiarCantidad, quitarDelCarrito, abierto, cerrarCarrito } = useCarrito()
  const { productos } = useProductosTienda()

  useEffect(() => {
    if (!abierto) return
    const esc = (e) => e.key === 'Escape' && cerrarCarrito()
    window.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = prev
    }
  }, [abierto, cerrarCarrito])

  if (!abierto) return null

  // Datos vivos (precio con promoción y stock actual)
  const lineas = carrito.map((item) => {
    const vivo = productos.find((p) => p.id === item.id)
    const p = vivo || item
    return { ...p, cantidad: item.cantidad, stock: vivo ? vivo.stock : 0, disponible: !!vivo && vivo.stock > 0, unitario: precioUnitario(p) }
  })
  const total = lineas.filter((l) => l.disponible).reduce((s, l) => s + l.unitario * l.cantidad, 0)
  const piezas = lineas.reduce((s, l) => s + l.cantidad, 0)

  const ir = (ruta) => {
    cerrarCarrito()
    navigate(ruta)
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Tu carrito">
      <div className="absolute inset-0 animate-desvanecer bg-tinta/50 backdrop-blur-sm" onClick={cerrarCarrito} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-deslizar-derecha flex-col bg-crema shadow-2xl sm:rounded-l-3xl">
        <header className="flex items-center gap-3 border-b border-borde/60 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vino/10 text-vino"><ShoppingBag size={20} /></span>
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold text-cacao">Tu carrito</h2>
            <p className="text-xs text-textoSecundario">{piezas} pieza{piezas === 1 ? '' : 's'}</p>
          </div>
          <button onClick={cerrarCarrito} aria-label="Cerrar carrito" className="flex h-10 w-10 items-center justify-center rounded-xl text-textoSecundario hover:bg-pergamino"><X size={20} /></button>
        </header>

        {lineas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-pergamino text-cacao/40"><ShoppingBag size={34} /></span>
            <p className="font-display text-xl text-cacao">Tu carrito está vacío</p>
            <button onClick={() => ir('/catalogo')} className="btn-primario mt-2">Explorar catálogo</button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-borde/60 overflow-y-auto px-5">
              {lineas.map((l) => {
                const img = obtenerImagen(l)
                return (
                  <li key={l.id} className="flex gap-3 py-4">
                    <button onClick={() => ir(`/catalogo/${l.id}`)} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pergamino">
                      {img && <img src={img} alt="" className={`h-full w-full object-cover ${!l.disponible ? 'grayscale' : ''}`} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium text-cacao">{l.nombre}</p>
                        <button onClick={() => quitarDelCarrito(l.id)} aria-label={`Quitar ${l.nombre}`} className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-textoSecundario hover:bg-error/10 hover:text-error"><Trash2 size={15} /></button>
                      </div>
                      {l.disponible ? (
                        <div className="mt-1.5 flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-borde bg-superficie">
                            <button onClick={() => cambiarCantidad(l.id, l.cantidad - 1)} disabled={l.cantidad <= 1} aria-label="Restar" className="flex h-8 w-8 items-center justify-center text-cacao disabled:opacity-30"><Minus size={14} /></button>
                            <span className="w-7 text-center text-sm font-semibold text-cacao">{l.cantidad}</span>
                            <button onClick={() => cambiarCantidad(l.id, l.cantidad + 1)} disabled={l.cantidad >= l.stock} aria-label="Sumar" className="flex h-8 w-8 items-center justify-center text-cacao disabled:opacity-30"><Plus size={14} /></button>
                          </div>
                          <span className="text-sm font-semibold text-vino">{dinero(l.unitario * l.cantidad)}</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs font-medium text-error">No disponible</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <footer className="space-y-3 border-t border-borde/60 bg-superficie px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-textoSecundario">Total estimado</span>
                <span className="font-display text-2xl font-semibold text-vino">{dinero(total)}</span>
              </div>
              <p className="flex items-center gap-2 text-xs text-textoSecundario"><Store size={14} className="text-oliva" /> Pagas al recoger en tienda.</p>
              <button onClick={() => ir('/carrito')} className="btn-primario group h-12 w-full text-base">
                Revisar y apartar <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </button>
              <button onClick={cerrarCarrito} className="btn-fantasma h-10 w-full">Seguir comprando</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
