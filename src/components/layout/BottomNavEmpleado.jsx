// BottomNavEmpleado.jsx — Navegación del personal (cajero/empleado)
// Objetivos táctiles grandes, indicador de sección activa y contador de pedidos activos.
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { LayoutDashboard, ClipboardList, Warehouse, UserRound } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { ESTADOS_ACTIVOS } from '../../services/pedidos'
import BottomNavAdmin from './BottomNavAdmin'

export default function BottomNavEmpleado() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const [activos, setActivos] = useState(0)

  const base = usuario?.role === 'admin' ? '/admin' : '/empleado'

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), where('status', 'in', ESTADOS_ACTIVOS))
    return onSnapshot(q, (snap) => setActivos(snap.size), () => setActivos(0))
  }, [])

  const items = [
    { icono: LayoutDashboard, nombre: 'Inicio', ruta: `${base}/dashboard` },
    { icono: ClipboardList, nombre: 'Pedidos', ruta: `${base}/pedidos`, badge: activos },
    { icono: Warehouse, nombre: 'Inventario', ruta: `${base}/inventario` },
    { icono: UserRound, nombre: 'Perfil', ruta: `${base}/perfil` },
  ]

  // Activo también en sub-rutas (p. ej. /empleado/pedidos/abc123)
  const activa = (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)

  // El admin usa su propia navegación (barra lateral en escritorio, "Más" en móvil)
  if (usuario?.role === 'admin') return <BottomNavAdmin />

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl">
        {items.map(({ icono: Icono, nombre, ruta, badge }) => {
          const on = activa(ruta)
          return (
            <button
              key={ruta}
              onClick={() => navigate(ruta)}
              aria-current={on ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                on ? 'text-vino' : 'text-textoSecundario hover:text-cacao'
              }`}
            >
              <span className={`absolute top-0 h-1 w-10 rounded-b-full transition ${on ? 'bg-vino' : 'bg-transparent'}`} />
              <span className="relative">
                <Icono size={22} strokeWidth={on ? 2.4 : 2} />
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-vino px-1 text-[10px] font-bold text-white ring-2 ring-superficie">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              {nombre}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
