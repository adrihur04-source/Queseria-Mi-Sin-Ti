// EncabezadoTienda.jsx — Encabezado de todas las pantallas del cliente
// Escritorio: navegación completa. Móvil: logo + campana + carrito (la navegación va en BottomNav).
import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { ShoppingBag, Bell, Heart, UserRound, ArrowLeft } from 'lucide-react'
import Avatar from '../Avatar'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../context/CarritoContext'
import { ETIQUETAS_STATUS, ESTADOS_ACTIVOS } from '../../services/pedidos'
import { folio, dinero } from '../../utils/formato'
import logo from '../../assets/logoficial.png'
import BotonTema from '../BotonTema'
import MiniCarrito from './MiniCarrito'

const ENLACES = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/promociones', label: 'Promociones' },
  { to: '/historial', label: 'Mis pedidos' },
  { to: '/compras', label: 'Mis compras' },
  { to: '/recompensas', label: 'Club' },
]

export default function EncabezadoTienda({ titulo, atras }) {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { piezas, abrirCarrito } = useCarrito()
  const [latiendo, setLatiendo] = useState(false)
  const [activos, setActivos] = useState([])
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  const esCliente = usuario?.role === 'cliente' || !usuario?.role

  // Pedidos en curso del cliente (campana)
  useEffect(() => {
    if (!usuario?.uid || !esCliente) return
    return onSnapshot(
      query(collection(db, 'pedidos'), where('clienteId', '==', usuario.uid)),
      (s) => setActivos(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => ESTADOS_ACTIVOS.includes(p.status || 'pendiente'))),
      () => {},
    )
  }, [usuario?.uid, esCliente])

  useEffect(() => {
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  // El carrito late cuando le llega un producto (ver utils/efectos.js)
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

  const icono = 'relative flex h-11 w-11 items-center justify-center rounded-xl text-cacao transition hover:bg-pergamino'

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-borde/60 bg-crema/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        {atras ? (
          <button onClick={() => (typeof atras === 'string' ? navigate(atras) : navigate(-1))} aria-label="Regresar" className={`${icono} -ml-2`}>
            <ArrowLeft size={22} />
          </button>
        ) : (
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Inicio">
            <img src={logo} alt="" className="h-10 w-10 rounded-xl bg-[#F7F1E6] object-cover ring-1 ring-borde" />
            <span className="hidden font-display text-lg font-semibold text-cacao lg:inline">Quesería</span>
          </NavLink>
        )}

        {titulo && <h1 className="truncate font-display text-lg font-semibold text-cacao md:hidden">{titulo}</h1>}

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {ENLACES.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-pergamino text-vino' : 'text-textoSecundario hover:text-cacao'}`}
            >
              {e.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <BotonTema />
          {esCliente && (
            <div className="relative" ref={ref}>
              <button onClick={() => setAbierto((v) => !v)} aria-label={`Pedidos en curso (${activos.length})`} className={icono}>
                <Bell size={20} />
                {activos.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-vino ring-2 ring-crema" />}
              </button>
              {abierto && (
                <div className="absolute right-0 top-12 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-borde bg-superficie shadow-elevada">
                  <p className="border-b border-borde px-4 py-3 text-sm font-semibold text-cacao">Pedidos en curso</p>
                  {activos.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-textoSecundario">No tienes pedidos en curso.</p>
                  ) : (
                    activos.map((p) => (
                      <button key={p.id} onClick={() => { setAbierto(false); navigate('/historial') }} className="flex w-full items-center justify-between gap-3 border-b border-borde/60 px-4 py-3 text-left last:border-0 hover:bg-crema">
                        <span>
                          <span className="block text-sm font-semibold text-cacao">Pedido {folio(p.id)}</span>
                          <span className="text-xs text-textoSecundario">{ETIQUETAS_STATUS[p.status || 'pendiente']}</span>
                        </span>
                        <span className="text-sm font-medium text-vino">{dinero(p.total)}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {esCliente && (
            <NavLink to="/favoritos" aria-label="Favoritos" className={`${icono} hidden md:flex`}>
              <Heart size={20} />
            </NavLink>
          )}
          {esCliente && (
            <button onClick={abrirCarrito} data-destino-carrito aria-label={`Abrir carrito (${piezas})`} className={`${icono} ${latiendo ? 'animate-latido' : ''}`}>
              <ShoppingBag size={20} />
              {piezas > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-vino px-1 text-[10px] font-bold text-white ring-2 ring-crema">
                  {piezas > 99 ? '99+' : piezas}
                </span>
              )}
            </button>
          )}
          <NavLink to="/perfil" aria-label="Mi perfil" className={`${icono} hidden md:flex`}>
            {usuario?.foto ? <Avatar usuario={usuario} tam="h-8 w-8" className="ring-2 ring-vino/20" /> : <UserRound size={20} />}
          </NavLink>
        </div>
      </div>
    </header>
    <MiniCarrito />
    </>
  )
}
