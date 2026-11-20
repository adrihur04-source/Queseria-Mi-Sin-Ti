// AlertasStock.jsx — Productos que necesitan reabastecerse (empleado y admin)
// Agotados agrupados por antigüedad (cuánto llevan sin stock) y luego los de stock bajo.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { PackageX, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import { stockDe, minDe, necesitaReabasto } from '../../utils/stock'
import { fechaRelativa } from '../../utils/formato'
import { obtenerImagen } from '../../utils/imagenes'

// Días por calendario desde que se agotó
function diasDesde(ts) {
  if (!ts?.toDate) return null
  const f = ts.toDate()
  f.setHours(0, 0, 0, 0)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((hoy - f) / 86400000)
}

const GRUPOS = [
  { id: 'recientes', label: 'Agotados en las últimas 2 semanas', max: 14 },
  { id: 'antiguas', label: 'Agotados hace 2 a 4 semanas', max: 28 },
  { id: 'muy-antiguas', label: 'Agotados hace más de un mes', max: Infinity },
  { id: 'sin-fecha', label: 'Agotados sin fecha registrada' },
  { id: 'bajo', label: 'Stock bajo' },
]

export default function AlertasStock() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esAdmin = usuario?.role === 'admin'
  const base = esAdmin ? '/admin' : '/empleado'

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas')

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'productos'),
        (snap) => {
          setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
          setCargando(false)
        },
        () => setCargando(false),
      ),
    [],
  )

  const alertas = useMemo(
    () =>
      productos.filter(necesitaReabasto).map((p) => {
        const agotado = stockDe(p) === 0
        const dias = diasDesde(p.agotadoEn)
        const grupo = !agotado
          ? 'bajo'
          : dias === null
          ? 'sin-fecha'
          : GRUPOS.find((g) => g.max !== undefined && dias <= g.max).id
        return { ...p, agotado, dias, grupo, ms: p.agotadoEn?.toMillis?.() ?? null }
      }),
    [productos],
  )

  const totalAgotados = alertas.filter((a) => a.agotado).length
  const totalBajos = alertas.length - totalAgotados

  const visibles = alertas.filter((a) => (filtro === 'agotado' ? a.agotado : filtro === 'bajo' ? !a.agotado : true))

  const agrupadas = GRUPOS.map((g) => ({
    ...g,
    items: visibles
      .filter((a) => a.grupo === g.id)
      .sort((a, b) => (g.id === 'bajo' ? stockDe(a) - stockDe(b) : (b.ms ?? 0) - (a.ms ?? 0))),
  })).filter((g) => g.items.length)

  const registrar = (id) => navigate(`${base}/movimiento`, { state: { productoId: id, tipo: 'entrada' } })

  return (
    <div className="min-h-screen bg-crema pb-28">
      <EncabezadoStaff titulo="Alertas de stock" subtitulo={`${alertas.length} producto${alertas.length === 1 ? '' : 's'} por reabastecer`} atras />

      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'todas', label: 'Todas', n: alertas.length, icono: AlertTriangle, on: 'bg-tinta text-white', color: 'text-cacao' },
            { id: 'agotado', label: 'Agotados', n: totalAgotados, icono: PackageX, on: 'bg-error text-white', color: 'text-error' },
            { id: 'bajo', label: 'Stock bajo', n: totalBajos, icono: AlertTriangle, on: 'bg-miel text-white', color: 'text-miel' },
          ].map(({ id, label, n, icono: Icono, on, color }) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              aria-pressed={filtro === id}
              className={`flex min-h-[72px] flex-col justify-center rounded-2xl px-4 py-3 text-left transition ${filtro === id ? `${on} shadow-tarjeta` : 'tarjeta'}`}
            >
              <span className={`flex items-center gap-1.5 text-xs ${filtro === id ? 'text-white/80' : 'text-textoSecundario'}`}>
                <Icono size={14} className={filtro === id ? '' : color} /> {label}
              </span>
              <span className={`font-display text-2xl font-semibold ${filtro === id ? 'text-white' : 'text-cacao'}`}>{n}</span>
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="tarjeta h-20 animate-pulse" />)}</div>
        ) : agrupadas.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle2 size={40} className="text-exito" />
            <p className="font-display text-xl text-cacao">Todo en orden</p>
            <p className="text-sm text-textoSecundario">No hay productos que necesiten reabastecerse.</p>
          </div>
        ) : (
          agrupadas.map((g) => (
            <section key={g.id}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-textoSecundario">
                {g.label} · {g.items.length}
              </h2>
              <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
                {g.items.map((a) => {
                  const img = obtenerImagen(a)
                  return (
                    <li key={a.id} className="flex min-h-[72px] items-center gap-3 px-4 py-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-pergamino">
                        {img && <img src={img} alt="" loading="lazy" className={`h-full w-full object-cover ${a.agotado ? 'grayscale' : ''}`} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-cacao">{a.nombre}</p>
                        <p className={`text-xs font-medium ${a.agotado ? 'text-error' : 'text-miel'}`}>
                          {a.agotado ? 'Agotado' : `Quedan ${stockDe(a)} pzas`} <span className="font-normal text-textoSecundario">· mín {minDe(a)}</span>
                        </p>
                        {a.agotado && a.agotadoEn && <p className="text-[11px] text-textoSecundario">Desde {fechaRelativa(a.agotadoEn)}</p>}
                      </div>
                      <button onClick={() => registrar(a.id)} className="btn h-11 shrink-0 border border-borde px-3 text-vino hover:bg-vino hover:text-white">
                        <Plus size={16} /> Entrada
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {esAdmin ? <BottomNavAdmin /> : <BottomNavEmpleado />}
    </div>
  )
}
