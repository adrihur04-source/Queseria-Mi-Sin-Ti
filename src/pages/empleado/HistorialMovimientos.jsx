// HistorialMovimientos.jsx — Historial detallado de movimientos de inventario (Firebase real)
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase/config'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'

export default function HistorialMovimientos() {
  const navigate = useNavigate()
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroActivo, setFiltroActivo] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'historialInventario'), orderBy('creado', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const datos = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.creado) // ignora el doc placeholder "temporal: inicio"
      setMovimientos(datos)
      setCargando(false)
    }, (err) => {
      console.error('Error cargando historial:', err)
      setCargando(false)
    })
    return () => unsub()
  }, [])

  const filtros = ['Todos', 'Entradas', 'Salidas', 'Hoy']

  const hoyStr = new Date().toDateString()
  const ayerDate = new Date()
  ayerDate.setDate(ayerDate.getDate() - 1)
  const ayerStr = ayerDate.toDateString()

  const formatearFecha = (fecha) => {
    const str = fecha.toDateString()
    if (str === hoyStr) return `Hoy — ${fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
    if (str === ayerStr) return `Ayer — ${fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const totalEntradas = movimientos.filter((m) => m.tipo === 'entrada').length
  const totalSalidas = movimientos.filter((m) => m.tipo === 'salida').length
  const totalMov = movimientos.length

  const movimientosFiltrados = movimientos.filter((m) => {
    const fecha = m.creado?.toDate ? m.creado.toDate() : null
    const coincideBusqueda = (m.producto || '').toLowerCase().includes(busqueda.toLowerCase())
    if (!coincideBusqueda) return false
    if (filtroActivo === 'Entradas') return m.tipo === 'entrada'
    if (filtroActivo === 'Salidas') return m.tipo === 'salida'
    if (filtroActivo === 'Hoy') return fecha && fecha.toDateString() === hoyStr
    return true
  })

  // Agrupar por día
  const grupos = {}
  movimientosFiltrados.forEach((m) => {
    const fecha = m.creado?.toDate ? m.creado.toDate() : new Date()
    const clave = formatearFecha(fecha)
    if (!grupos[clave]) grupos[clave] = []
    grupos[clave].push({
      ...m,
      hora: fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      fechaObj: fecha,
    })
  })
  const gruposFiltrados = Object.entries(grupos).map(([fecha, movs]) => ({ fecha, movimientos: movs }))

  const colorTipo = (tipo) => {
    if (tipo === 'entrada') return 'text-green-600'
    if (tipo === 'salida') return 'text-error'
    return 'text-botonSecundario'
  }

  const iconoTipo = (tipo) => {
    if (tipo === 'entrada') return '↑'
    if (tipo === 'salida') return '↓'
    return '⟳'
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-fondoPrincipal flex items-center justify-center">
        <p className="text-botonPrincipal font-bold animate-pulse text-lg">Cargando historial...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-20">

      {/* Header */}
      <div className="bg-botonPrincipal px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/empleado/inventario')} className="text-white">←</button>
          <span className="text-white font-bold">Historial del inventario</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Entradas', valor: totalEntradas, color: 'text-green-600' },
          { label: 'Salidas', valor: totalSalidas, color: 'text-error' },
          { label: 'Total mov.', valor: totalMov, color: 'text-textoPrincipal' },
        ].map((s, i) => (
          <div key={i} className="bg-superficie border border-borde rounded-xl p-2 text-center">
            <p className={`font-bold text-lg ${s.color}`}>{s.valor}</p>
            <p className="text-textoSecundario text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="px-4 mb-3">
        <div className="relative">
          <span className="absolute left-3 top-3 text-botonSecundario">🔍</span>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`w-full border rounded-full px-10 py-2.5 text-sm bg-superficie focus:outline-none ${busqueda ? 'border-botonSecundario bg-botonSecundario/5' : 'border-borde'}`}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3 top-2.5 text-textoSecundario">✕</button>
          )}
        </div>
        {busqueda && (
          <p className="text-botonSecundario text-xs mt-1 font-semibold">
            {movimientosFiltrados.length} movimientos de "{busqueda}"
          </p>
        )}
      </div>

      {/* Filtros */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button
              key={f}
              onClick={() => setFiltroActivo(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                ${filtroActivo === f
                  ? f === 'Entradas' ? 'bg-green-500 text-white'
                    : f === 'Salidas' ? 'bg-error text-white'
                    : 'bg-botonPrincipal text-white'
                  : 'bg-superficie border border-borde text-textoSecundario'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por día */}
      <div className="px-4 flex flex-col gap-4">
        {gruposFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-5xl">📭</span>
            <p className="text-textoSecundario text-sm">No hay movimientos con este filtro</p>
          </div>
        ) : (
          gruposFiltrados.map((grupo) => (
            <div key={grupo.fecha}>
              <p className="text-textoSecundario text-xs font-semibold mb-2">{grupo.fecha}</p>
              <div className="flex flex-col gap-2">
                {grupo.movimientos.map((m) => (
                  <div key={m.id} className="bg-superficie border border-borde rounded-xl overflow-hidden">

                    {/* Fila principal */}
                    <div className="px-3 py-3 flex items-center gap-3">
                      <span className={`text-2xl font-bold ${colorTipo(m.tipo)}`}>
                        {iconoTipo(m.tipo)}
                      </span>
                      <div className="flex-1">
                        <p className="text-textoPrincipal text-sm font-semibold">{m.producto}</p>
                        <p className="text-textoSecundario text-xs">{m.detalle}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${colorTipo(m.tipo)}`}>
                          {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad} pzas
                        </p>
                        <p className="text-textoSecundario text-xs">{m.hora}</p>
                      </div>
                      <button
                        onClick={() => setExpandido(expandido === m.id ? null : m.id)}
                        className="text-textoSecundario ml-1"
                      >
                        {expandido === m.id ? '▲' : '▼'}
                      </button>
                    </div>

                    {/* Detalle expandido */}
                    {expandido === m.id && (
                      <div className="border-t border-borde px-3 py-3 bg-fondoPrincipal">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-error'}`}>
                          {m.tipo === 'entrada' ? 'Entrada de stock' : 'Salida de stock'}
                        </div>
                        {[
                          { label: 'Tipo', valor: m.tipo === 'entrada' ? 'Entrada' : 'Salida' },
                          { label: 'Cantidad', valor: `${m.tipo === 'entrada' ? '+' : '-'}${m.cantidad} pzas` },
                          { label: 'Lote', valor: m.lote || 'N/A' },
                          { label: 'Responsable', valor: m.responsable },
                          { label: 'Stock antes', valor: `${m.stockAntes} pzas` },
                          { label: 'Stock después', valor: `${m.stockDespues} pzas` },
                          { label: 'Observaciones', valor: m.observaciones || 'Sin observaciones' },
                          { label: 'Fecha/hora', valor: `${grupo.fecha.split('—')[1]?.trim() || grupo.fecha} · ${m.hora}` },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between text-sm mb-1">
                            <span className="text-textoSecundario">{item.label}</span>
                            <span className="text-textoPrincipal font-semibold">{item.valor}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNavEmpleado />
    </div>
  )
}