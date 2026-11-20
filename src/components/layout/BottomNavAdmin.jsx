// BottomNavAdmin.jsx — Navegación del admin en móvil (en escritorio se usa la barra lateral de AdminShell)
// 4 accesos directos + "Más", que abre una hoja con todos los módulos.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Package, Warehouse, Menu, X, Store } from 'lucide-react'
import { useContadoresAdmin } from '../admin/contadores'
import { MODULOS_ADMIN } from '../admin/modulos'
import BotonTema from '../BotonTema'
import Avatar from '../Avatar'
import { useAuth } from '../../hooks/useAuth'

const PRINCIPALES = [
  { icono: LayoutDashboard, nombre: 'Inicio', ruta: '/admin/dashboard' },
  { icono: ClipboardList, nombre: 'Pedidos', ruta: '/admin/pedidos', contador: 'pedidos' },
  { icono: Package, nombre: 'Productos', ruta: '/admin/productos' },
  { icono: Warehouse, nombre: 'Inventario', ruta: '/admin/inventario', contador: 'alertas' },
]

export default function BottomNavAdmin() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const contadores = useContadoresAdmin()
  const { usuario } = useAuth()
  const [hojaAbierta, setHojaAbierta] = useState(false)

  const activa = (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  const enPrincipal = PRINCIPALES.some((i) => activa(i.ruta))

  const ir = (ruta) => {
    setHojaAbierta(false)
    navigate(ruta)
  }

  return (
    <>
      <nav className="vidrio fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-3xl md:hidden">
        <div className="flex h-16">
          {PRINCIPALES.map(({ icono: Icono, nombre, ruta, contador }) => {
            const on = activa(ruta)
            const n = contador ? contadores[contador] : 0
            return (
              <button
                key={ruta}
                onClick={() => ir(ruta)}
                aria-current={on ? 'page' : undefined}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${on ? 'text-vino' : 'text-textoSecundario'}`}
              >
                <span className={`absolute inset-x-2 inset-y-1.5 -z-10 rounded-2xl bg-vino/10 transition-all duration-300 ${on ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
                <span className="relative">
                  <Icono size={22} strokeWidth={on ? 2.4 : 2} />
                  {n > 0 && (
                    <span className={`absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-superficie ${contador === 'alertas' ? 'bg-error' : 'bg-vino'}`}>
                      {n > 99 ? '99+' : n}
                    </span>
                  )}
                </span>
                {nombre}
              </button>
            )
          })}
          <button
            onClick={() => setHojaAbierta(true)}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${!enPrincipal ? 'text-vino' : 'text-textoSecundario'}`}
          >
            <span className={`absolute inset-x-2 inset-y-1.5 -z-10 rounded-2xl bg-vino/10 transition-all duration-300 ${!enPrincipal ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`} />
            <Menu size={22} />
            Más
          </button>
        </div>
      </nav>

      {hojaAbierta && (
        <div className="fixed inset-0 z-50 bg-tinta/50 backdrop-blur-sm md:hidden" onClick={() => setHojaAbierta(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Todos los módulos"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-aparecer overflow-y-auto rounded-t-3xl bg-crema p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <button onClick={() => ir('/admin/perfil')} className="tarjeta mb-4 flex w-full items-center gap-3 p-3 text-left">
              <Avatar usuario={usuario} tam="h-12 w-12" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-semibold text-cacao">{usuario?.nombre || 'Administración'}</span>
                <span className="text-xs text-textoSecundario">Ver mi perfil</span>
              </span>
            </button>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-cacao">Módulos</h2>
              <BotonTema className="ml-auto mr-1" />
              <button onClick={() => setHojaAbierta(false)} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-pergamino">
                <X size={20} />
              </button>
            </div>
            {MODULOS_ADMIN.map((g) => (
              <div key={g.grupo} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-textoSecundario">{g.grupo}</p>
                <div className="grid grid-cols-3 gap-2">
                  {g.items.map(({ ruta, nombre, icono: Icono }) => (
                    <button
                      key={ruta}
                      onClick={() => ir(ruta)}
                      className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-xs font-medium ${activa(ruta) ? 'bg-vino text-white' : 'bg-superficie text-cacao shadow-tarjeta'}`}
                    >
                      <Icono size={20} />
                      {nombre}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => ir('/')} className="btn-secundario mt-2 w-full">
              <Store size={16} /> Ver tienda
            </button>
          </div>
        </div>
      )}
    </>
  )
}
