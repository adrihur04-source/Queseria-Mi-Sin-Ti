// AsistenteGlobal.jsx — Muestra a "Quesi" solo en las pantallas de la tienda
// (no en personal/admin, login ni en el carrito, donde la barra de pago ocupa ese espacio).
import { useLocation } from 'react-router-dom'
import Asistente from './Asistente'

const EN_TIENDA = /^\/($|catalogo|promociones|favoritos|historial|compras|recompensas|perfil)/

export default function AsistenteGlobal() {
  const { pathname } = useLocation()
  if (!EN_TIENDA.test(pathname)) return null
  // La portada no tiene barra inferior en móvil
  return <Asistente abajo={pathname === '/' ? 'bottom-5 md:bottom-6' : 'bottom-[5.5rem] md:bottom-6'} />
}
