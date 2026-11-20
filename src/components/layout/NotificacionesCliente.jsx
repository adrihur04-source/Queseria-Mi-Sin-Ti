// NotificacionesCliente.jsx — Campanita con los pedidos del cliente que siguen sin finalizar
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'

// Un pedido deja de mostrarse en la campanita cuando llega a uno de estos estatus
const ESTATUS_FINALIZADOS = ['entregado', 'cancelado']

const capitalizar = (texto) => {
  if (!texto) return 'Pendiente'
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export default function NotificacionesCliente() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (!usuario?.uid) return

    const q = query(collection(db, 'pedidos'), where('clienteId', '==', usuario.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p) => !ESTATUS_FINALIZADOS.includes((p.status || '').toLowerCase()))
        setPedidos(lista)
      },
      (err) => console.error('Error cargando pedidos:', err)
    )
    return () => unsub()
  }, [usuario?.uid])

  const irAHistorial = () => {
    setAbierto(false)
    navigate('/historial')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((prev) => !prev)}
        className="relative text-textoPrincipal text-xl"
        aria-label="Mis pedidos pendientes"
      >
        <FontAwesomeIcon icon={faBell} />
        {pedidos.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-error text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {pedidos.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 bg-superficie border border-borde rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="px-4 py-2 border-b border-borde sticky top-0 bg-superficie">
            <span className="text-textoPrincipal font-bold text-sm">Mis pedidos</span>
          </div>

          {pedidos.length === 0 ? (
            <p className="text-textoSecundario text-sm text-center py-6">No tienes pedidos en proceso</p>
          ) : (
            pedidos.map((p) => (
              <button
                key={p.id}
                onClick={irAHistorial}
                className="w-full text-left px-4 py-3 border-b border-borde last:border-0 hover:bg-fondoPrincipal"
              >
                <p className="text-textoPrincipal text-sm font-semibold">
                  Pedido #{p.id.slice(-5).toUpperCase()}
                </p>
                <p className="text-textoSecundario text-xs">
                  {capitalizar(p.status)} · ${p.total}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
