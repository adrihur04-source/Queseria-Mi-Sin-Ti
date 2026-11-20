// AlertasAdmin.jsx — Listado completo de alertas de stock (vista ADMIN)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import NotificacionesAdmin from '../../components/layout/NotificacionesAdmin'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faXmark, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"

export default function AlertasAdmin() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'productos'), (snap) => {
      setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCargando(false)
    }, (err) => {
      console.error('Error cargando productos:', err)
      setCargando(false)
    })
    return () => unsub()
  }, [])

  const formatearFechaHora = (timestamp) => {
    if (!timestamp?.toDate) return null
    const fecha = timestamp.toDate()
    const hoy = new Date()
    const esHoy = fecha.toDateString() === hoy.toDateString()
    const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    if (esHoy) return `Hoy, ${hora}`
    const diaFecha = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    return `${diaFecha}, ${hora}`
  }

  const alertas = productos
    .filter((p) => (p.stock ?? 0) <= (p.stockMin ?? 3))
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria || 'Sin categoría',
      stock: p.stock ?? 0,
      stockMin: p.stockMin ?? 3,
      estado: (p.stock ?? 0) === 0 ? 'Agotado' : `Stock bajo — ${p.stock} pzas`,
      tipo: (p.stock ?? 0) === 0 ? 'error' : 'warning',
      agotadoEn: p.agotadoEn ?? null,
    }))
    .sort((a, b) => {
      const fechaA = a.agotadoEn?.toMillis?.() ?? 0
      const fechaB = b.agotadoEn?.toMillis?.() ?? 0
      return fechaB - fechaA
    })

  const alertasFiltradas = alertas.filter((a) => {
    if (filtro === 'agotado') return a.tipo === 'error'
    if (filtro === 'bajo') return a.tipo === 'warning'
    return true
  })

  const totalAgotados = alertas.filter((a) => a.tipo === 'error').length
  const totalBajos = alertas.filter((a) => a.tipo === 'warning').length

  if (cargando) {
    return (
      <div className="min-h-screen bg-fondoPrincipal flex items-center justify-center">
        <p className="text-botonPrincipal font-bold animate-pulse text-lg">Cargando alertas...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-20">

      {/* Header */}
      <div className="bg-botonPrincipal px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/admin/dashboard')} className="text-white text-xl">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <span className="text-white font-bold text-lg flex-1">Alertas de Stock</span>
        <NotificacionesAdmin />
      </div>

      {/* Resumen */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3 mb-4">
        <div className="bg-error rounded-2xl p-4 text-white">
          <p className="text-sm opacity-90">Agotados</p>
          <h2 className="text-3xl font-bold mt-1">{totalAgotados}</h2>
        </div>
        <div className="bg-botonSecundario rounded-2xl p-4 text-white">
          <p className="text-sm opacity-90">Stock bajo</p>
          <h2 className="text-3xl font-bold mt-1">{totalBajos}</h2>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 flex gap-2 mb-4">
        {[
          { key: 'todas', label: `Todas (${alertas.length})` },
          { key: 'agotado', label: `Agotados (${totalAgotados})` },
          { key: 'bajo', label: `Stock bajo (${totalBajos})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              filtro === f.key
                ? 'bg-botonPrincipal text-white border-botonPrincipal'
                : 'bg-superficie text-textoSecundario border-borde'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Listado */}
      <div className="px-4 flex flex-col gap-2">
        {alertasFiltradas.length === 0 ? (
          <div className="bg-superficie border border-borde rounded-xl p-6 flex flex-col items-center gap-2 mt-4">
            <p className="text-textoPrincipal font-semibold text-sm">Sin alertas 🎉</p>
            <p className="text-textoSecundario text-xs text-center">
              No hay productos que necesiten reabastecimiento en esta categoría.
            </p>
          </div>
        ) : (
          alertasFiltradas.map((a) => (
            <div
              key={a.id}
              className="bg-superficie border border-borde rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <span className={`text-xl ${a.tipo === 'error' ? 'text-error' : 'text-botonSecundario'}`}>
                <FontAwesomeIcon icon={a.tipo === 'error' ? faXmark : faTriangleExclamation} />
              </span>
              <div className="flex-1">
                <p className="text-textoPrincipal text-sm font-semibold">{a.nombre}</p>
                <p className="text-textoSecundario text-xs">{a.categoria}</p>
                <p className={`text-xs font-semibold mt-0.5 ${a.tipo === 'error' ? 'text-error' : 'text-botonSecundario'}`}>
                  {a.estado} (mínimo: {a.stockMin})
                </p>
                {a.tipo === 'error' && a.agotadoEn && (
                  <p className="text-textoSecundario text-[11px] mt-0.5">
                    Se agotó: {formatearFechaHora(a.agotadoEn)}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate('/admin/inventario', { state: { productoId: a.id } })}
                className="bg-botonSecundario text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Registrar
              </button>
            </div>
          ))
        )}
      </div>

      <BottomNavAdmin />
    </div>
  )
}