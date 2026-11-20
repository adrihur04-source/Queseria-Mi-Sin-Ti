// Inventario.jsx — Inventario general (cajero/empleado y admin)
// Búsqueda, filtros con contador en una sola fila y barra de nivel de stock por producto.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { Search, X, Plus, PackageX, AlertTriangle, CalendarClock, Boxes, CheckCircle2, Ban, Layers, History } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import { obtenerImagen } from '../../utils/imagenes'
import { stockDe, minDe, esAgotado, esBajo, diasPara, textoCaducidad, DIAS_POR_CADUCAR } from '../../utils/stock'

const UMBRAL_PROXIMO_A_CADUCAR = DIAS_POR_CADUCAR
const diasParaCaducar = diasPara

const porCaducar = (p) => {
  const d = diasParaCaducar(p.caducidad)
  return d !== null && d <= UMBRAL_PROXIMO_A_CADUCAR
}

export default function Inventario() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esAdmin = usuario?.role === 'admin'
  const rutaMovimiento = esAdmin ? '/admin/movimiento' : '/empleado/movimiento'
  const rutaDashboard = esAdmin ? '/admin/dashboard' : '/empleado/dashboard'

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    return onSnapshot(
      collection(db, 'productos'),
      (snap) => {
        setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
      },
      () => setCargando(false),
    )
  }, [])

  const filtros = useMemo(
    () => [
      { id: 'todos', label: 'Todos', icono: Boxes, n: productos.length, activo: 'bg-tinta text-white', texto: 'text-cacao' },
      { id: 'agotados', label: 'Agotados', icono: PackageX, n: productos.filter(esAgotado).length, activo: 'bg-error text-white', texto: 'text-error' },
      { id: 'bajo', label: 'Stock bajo', icono: AlertTriangle, n: productos.filter(esBajo).length, activo: 'bg-miel text-white', texto: 'text-miel' },
      { id: 'caducar', label: 'Por caducar', icono: CalendarClock, n: productos.filter(porCaducar).length, activo: 'bg-vino text-white', texto: 'text-vino' },
    ],
    [productos],
  )

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase()
    return productos
      .filter((p) => {
        if (filtro === 'agotados') return esAgotado(p)
        if (filtro === 'bajo') return esBajo(p)
        if (filtro === 'caducar') return porCaducar(p)
        return true
      })
      .filter((p) => !t || (p.nombre || '').toLowerCase().includes(t) || (p.categoria || '').toLowerCase().includes(t))
      // Lo más urgente primero: agotados, luego bajo stock, luego por nombre
      .sort(
        (a, b) =>
          Number(esAgotado(b)) - Number(esAgotado(a)) ||
          Number(esBajo(b)) - Number(esBajo(a)) ||
          (a.nombre || '').localeCompare(b.nombre || ''),
      )
  }, [productos, filtro, busqueda])

  return (
    <div className="min-h-screen bg-crema pb-28">
      <EncabezadoStaff
        titulo="Inventario"
        subtitulo={`${productos.length} productos`}
        atras={rutaDashboard}
        acciones={
          <>
            <button onClick={() => navigate(esAdmin ? '/admin/historial-inventario' : '/empleado/historial')} aria-label="Historial de movimientos" className="btn h-11 border border-white/20 px-3 text-marfil hover:bg-white/10">
              <History size={18} /> <span className="hidden sm:inline">Historial</span>
            </button>
            <button onClick={() => navigate(rutaMovimiento)} className="btn h-11 bg-crema px-4 text-cacao hover:bg-superficie">
              <Plus size={18} /> <span className="hidden sm:inline">Movimiento</span>
            </button>
          </>
        }
      >
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-marfil/50" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto o categoría…"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-11 pr-11 text-sm text-white outline-none placeholder:text-marfil/50 focus:border-white/30 focus:bg-white/15"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-marfil/70 hover:bg-white/10">
              <X size={18} />
            </button>
          )}
        </div>
      </EncabezadoStaff>

      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-4">
          {filtros.map(({ id, label, icono: Icono, n, activo, texto }) => {
            const on = filtro === id
            return (
              <button
                key={id}
                onClick={() => setFiltro(id)}
                aria-pressed={on}
                className={`flex min-h-[64px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  on ? `${activo} shadow-tarjeta` : 'tarjeta hover:border-cacao/20'
                }`}
              >
                <Icono size={20} className={on ? 'text-white' : texto} />
                <span>
                  <span className={`block font-display text-xl font-semibold leading-none ${on ? 'text-white' : 'text-cacao'}`}>{n}</span>
                  <span className={`text-xs ${on ? 'text-white/80' : 'text-textoSecundario'}`}>{label}</span>
                </span>
              </button>
            )
          })}
        </div>

        {cargando ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="tarjeta h-28 animate-pulse" />)}
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle2 size={36} className="text-exito" />
            <p className="font-display text-lg text-cacao">{busqueda ? 'Sin coincidencias' : 'Nada en esta sección'}</p>
            <p className="text-sm text-textoSecundario">{busqueda ? 'Prueba con otro nombre.' : 'Todo en orden por aquí.'}</p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {visibles.map((p) => {
              const stock = stockDe(p)
              const min = minDe(p)
              const agotado = esAgotado(p)
              const bajo = esBajo(p)
              const dias = diasParaCaducar(p.caducidad)
              const caducado = dias !== null && dias < 0
              const proximo = dias !== null && dias >= 0 && dias <= UMBRAL_PROXIMO_A_CADUCAR
              // Barra relativa a 3× el mínimo (lleno = holgado)
              const nivel = Math.min(100, Math.round((stock / (min * 3)) * 100))
              const img = obtenerImagen(p)

              return (
                <li key={p.id} className={`tarjeta flex gap-4 p-4 ${caducado ? 'border-error/50' : proximo ? 'border-vino/30' : ''}`}>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pergamino">
                    {img ? (
                      <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-display text-xl text-cacao/30">{p.nombre?.[0]}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-cacao">{p.nombre}</p>
                        <p className="text-xs text-oliva">{p.categoria || 'Sin categoría'}</p>
                      </div>
                      <button
                        onClick={() => navigate(rutaMovimiento, { state: { productoId: p.id } })}
                        aria-label={`Registrar movimiento de ${p.nombre}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-borde text-vino transition hover:bg-vino hover:text-white"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-pergamino">
                        <div
                          className={`h-full rounded-full ${agotado ? 'bg-error' : bajo ? 'bg-miel' : 'bg-exito'}`}
                          style={{ width: `${agotado ? 100 : Math.max(nivel, 6)}%`, opacity: agotado ? 0.25 : 1 }}
                        />
                      </div>
                      <span className={`whitespace-nowrap text-xs font-semibold ${agotado ? 'text-error' : bajo ? 'text-miel' : 'text-cacao'}`}>
                        {agotado ? 'Agotado' : `${stock} pzas`}
                        <span className="font-normal text-textoSecundario"> · mín {min}</span>
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      {dias !== null ? (
                        <p className={`flex items-center gap-1 text-xs font-medium ${caducado ? 'text-error' : proximo ? 'text-vino' : 'text-textoSecundario'}`}>
                          {caducado ? <Ban size={13} /> : <CalendarClock size={13} />} {textoCaducidad(dias)}
                        </p>
                      ) : <span />}
                      <button onClick={() => navigate(`${esAdmin ? '/admin' : '/empleado'}/lotes/${p.id}`)} className="flex items-center gap-1 text-xs font-semibold text-oliva hover:text-cacao hover:underline">
                        <Layers size={13} /> Lotes
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {esAdmin ? <BottomNavAdmin /> : <BottomNavEmpleado />}
    </div>
  )
}
