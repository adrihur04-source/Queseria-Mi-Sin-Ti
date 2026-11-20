// PedidosEntregados.jsx — Historial de pedidos ya entregados (vista de administrador)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../firebase/config'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'

const formatearFechaHora = (creado) => {
  if (!creado?.toDate) return { fecha: '—', hora: '—' }
  const d = creado.toDate()
  return {
    fecha: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
  }
}

export default function PedidosEntregados() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'pedidos'),
      where('status', '==', 'entregado'),
      orderBy('creado', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPedidos(lista)
    }, (err) => {
      console.error("Error cargando pedidos entregados: ", err)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-20 font-sans">
      <div className="bg-botonPrincipal px-4 pt-6 pb-5 flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/pedidos')} className="text-xl font-bold">←</button>
          <h1 className="text-lg font-bold tracking-wide">Pedidos Entregados</h1>
        </div>
        <span className="text-xs bg-green-600 px-2 py-1 rounded font-semibold text-white">
          {pedidos.length} Entregados
        </span>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <span className="text-5xl">📭</span>
            <p className="text-textoSecundario text-sm">Aún no hay pedidos entregados</p>
          </div>
        ) : (
          pedidos.map((p) => {
            const { fecha, hora } = formatearFechaHora(p.creado)
            return (
              <div
                key={p.id}
                onClick={() => navigate(`/admin/pedidos/${p.id}`)}
                className="bg-superficie border border-borde rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow"
              >
                <div>
                  <p className="text-textoPrincipal text-sm font-semibold">
                    Pedido #{p.id ? p.id.slice(-5).toUpperCase() : '---'}
                  </p>
                  <p className="text-textoSecundario text-xs">
                    {p.clienteNombre || 'Cliente General'}
                  </p>
                  <p className="text-textoSecundario text-xs mt-0.5">
                    {fecha} · {hora}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Entregado
                  </span>
                  <span className="text-textoSecundario">›</span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <BottomNavAdmin />
    </div>
  )
}