// GestionPedidos.jsx — Lista de pedidos pendientes (vista de administrador)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../firebase/config'
import { collection, onSnapshot, query } from 'firebase/firestore'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'

const colorEstatus = (status) => {
  if (status === 'pendiente') return 'bg-yellow-100 text-yellow-700'
  if (status === 'preparando') return 'bg-blue-100 text-blue-700'
  if (status === 'pagado') return 'bg-purple-100 text-purple-700'
  return 'bg-fondoSecundario text-textoSecundario'
}

const etiquetaEstatus = (status) => {
  if (status === 'pendiente') return 'Pendiente'
  if (status === 'preparando') return 'En proceso'
  if (status === 'pagado') return 'Pagado'
  return status
}

export default function GestionPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'pedidos'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPedidos(lista)
    }, (err) => {
      console.error("Error cargando pedidos: ", err)
    })
    return () => unsubscribe()
  }, [])

  // Un pedido sigue "activo" (visible aquí) mientras no llegue a un estado final
  const filtrados = pedidos.filter(p =>
    p.status === 'pendiente' || p.status === 'preparando' || p.status === 'pagado'
  )

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-20 font-sans">
      <div className="bg-botonPrincipal px-4 pt-6 pb-5 flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/dashboard')} className="text-xl font-bold">←</button>
          <h1 className="text-lg font-bold tracking-wide">Pedidos Pendientes</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-botonSecundario px-2 py-1 rounded font-semibold text-white">
            {filtrados.length} Activos
          </span>
          <button
            onClick={() => navigate('/admin/pedidos/entregados')}
            className="text-xs bg-green-600 px-2 py-1 rounded font-semibold text-white"
          >
            Entregados
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <span className="text-5xl">📭</span>
            <p className="text-textoSecundario text-sm">No hay pedidos pendientes</p>
          </div>
        ) : (
          filtrados.map((itemPedido) => (
            <div
              key={itemPedido.id}
              onClick={() => navigate(`/admin/pedidos/${itemPedido.id}`)}
              className="bg-superficie border border-borde rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow"
            >
              <div>
                <p className="text-textoPrincipal text-sm font-semibold">
                  Pedido #{itemPedido.id ? itemPedido.id.slice(-5).toUpperCase() : '---'}
                </p>
                <p className="text-textoSecundario text-xs">
                  {itemPedido.clienteNombre || 'Cliente General'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${colorEstatus(itemPedido.status)}`}>
                  {etiquetaEstatus(itemPedido.status)}
                </span>
                <span className="text-textoSecundario">›</span>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNavAdmin />
    </div>
  )
}