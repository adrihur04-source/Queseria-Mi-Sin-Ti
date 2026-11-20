// BottomNav.jsx — Navegación inferior del cliente (solo móvil; en escritorio está en EncabezadoTienda)
// "Carrito" abre el carrito lateral (MiniCarrito) y late cuando se agrega un producto.
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Store, Tag, ShoppingBag, ClipboardList, UserRound } from 'lucide-react'
import { useCarrito } from '../../context/CarritoContext'

const ITEMS = [
  { ruta: '/catalogo', icono: Store, label: 'Catálogo' },
  { ruta: '/promociones', icono: Tag, label: 'Promos' },
  { ruta: '/carrito', icono: ShoppingBag, label: 'Carrito', carrito: true },
  { ruta: '/historial', icono: ClipboardList, label: 'Pedidos' },
  { ruta: '/perfil', icono: UserRound, label: 'Perfil' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { piezas, abrirCarrito } = useCarrito()
  const [latiendo, setLatiendo] = useState(false)
  const activa = (r) => pathname === r || pathname.startsWith(`${r}/`)

  useEffect(() => {
    let t
    const latir = () => {
      setLatiendo(false)
      requestAnimationFrame(() => setLatiendo(true))
      clearTimeout(t)
      t = setTimeout(() => setLatiendo(false), 550)
    }
    window.addEventListener('carrito:latido', latir)
    return () => {
      window.removeEventListener('carrito:latido', latir)
      clearTimeout(t)
    }
  }, [])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="flex h-16">
        {ITEMS.map(({ ruta, icono: Icono, label, carrito }) => {
          const on = activa(ruta)
          return (
            <button
              key={ruta}
              onClick={() => (carrito && !on ? abrirCarrito() : navigate(ruta))}
              aria-current={on ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${on ? 'text-vino' : 'text-textoSecundario'}`}
            >
              <span className={`absolute top-0 h-1 rounded-b-full bg-vino transition-all duration-300 ${on ? 'w-10 opacity-100' : 'w-0 opacity-0'}`} />
              <span className={`relative transition-transform ${carrito && latiendo ? 'animate-latido' : ''}`} {...(carrito ? { 'data-destino-carrito': '' } : {})}>
                <Icono size={22} strokeWidth={on ? 2.4 : 2} />
                {carrito && piezas > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-vino px-1 text-[10px] font-bold text-white ring-2 ring-superficie">
                    {piezas > 99 ? '99+' : piezas}
                  </span>
                )}
              </span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
