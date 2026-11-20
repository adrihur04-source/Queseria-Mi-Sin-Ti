// DashboardEmpleado.jsx — Inicio del cajero/empleado
// Prioridad: qué pedido atender ahora y qué producto reabastecer.
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import {
  Bell, ClipboardList, Warehouse, AlertTriangle, PackageX, ArrowRight, CheckCircle2, WifiOff, ArrowLeftRight, Plus,
} from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import EstadoPedido from '../../components/staff/EstadoPedido'
import BotonTema from '../../components/BotonTema'
import { ESTADOS_ACTIVOS } from '../../services/pedidos'
import { dinero, folio, haceCuanto, esDeHoy } from '../../utils/formato'

const MIN_POR_DEFECTO = 2

function obtenerSaludo() {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 13) return 'Buenos días'
  if (hora >= 13 && hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function DashboardEmpleado() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarNotif, setMostrarNotif] = useState(false)
  const [sinConexion, setSinConexion] = useState(!navigator.onLine)
  const notifRef = useRef(null)

  useEffect(() => {
    const unsubProductos = onSnapshot(
      collection(db, 'productos'),
      (snap) => {
        setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
      },
      () => setCargando(false),
    )
    const unsubPedidos = onSnapshot(collection(db, 'pedidos'), (snap) =>
      setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    )
    return () => {
      unsubProductos()
      unsubPedidos()
    }
  }, [])

  useEffect(() => {
    const on = () => setSinConexion(false)
    const off = () => setSinConexion(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    const fuera = (e) => notifRef.current && !notifRef.current.contains(e.target) && setMostrarNotif(false)
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [])

  const alertas = useMemo(
    () =>
      productos
        .filter((p) => (Number(p.stock) || 0) <= (Number(p.stockMin) || MIN_POR_DEFECTO))
        .map((p) => {
          const stock = Number(p.stock) || 0
          return { id: p.id, nombre: p.nombre, agotado: stock === 0, estado: stock === 0 ? 'Agotado' : `Quedan ${stock} pzas` }
        })
        .sort((a, b) => Number(b.agotado) - Number(a.agotado)),
    [productos],
  )

  // Estatus reales del flujo: pendiente → preparando → pagado → entregado
  const activos = useMemo(
    () =>
      pedidos
        .filter((p) => ESTADOS_ACTIVOS.includes(p.status || 'pendiente'))
        .sort((a, b) => (a.creado?.toMillis?.() || 0) - (b.creado?.toMillis?.() || 0)),
    [pedidos],
  )
  const pedidosHoy = pedidos.filter((p) => esDeHoy(p.creado))
  const entregadosHoy = pedidosHoy.filter((p) => p.status === 'entregado')
  const cobradoHoy = entregadosHoy.reduce((s, p) => s + (Number(p.total) || 0), 0)
  const siguiente = activos[0]

  if (cargando) {
    return (
      <div className="min-h-screen bg-crema">
        <div className="h-44 bg-tinta" />
        <div className="mx-auto -mt-10 grid max-w-5xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="tarjeta h-24 animate-pulse" />)}
        </div>
        <BottomNavEmpleado />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema pb-28">
      {/* Encabezado con saludo */}
      <header className="bg-tinta pb-16 text-marfil">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4 px-4 pt-6">
          <div>
            <p className="text-sm text-marfil/60">{obtenerSaludo()},</p>
            <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">{usuario?.nombre || 'Equipo'}</h1>
            <p className="mt-1 text-xs text-marfil/60">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
          <BotonTema sobreOscuro className="bg-white/10" />
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setMostrarNotif((v) => !v)}
              aria-label={`Notificaciones (${alertas.length})`}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
            >
              <Bell size={20} />
              {alertas.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white ring-2 ring-tinta">
                  {alertas.length > 9 ? '9+' : alertas.length}
                </span>
              )}
            </button>

            {mostrarNotif && (
              <div className="absolute right-0 top-14 z-50 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-borde bg-superficie text-textoPrincipal shadow-elevada">
                <div className="flex items-center justify-between border-b border-borde px-4 py-3">
                  <span className="text-sm font-semibold text-cacao">Notificaciones</span>
                  {alertas.length > 0 && <span className="text-xs font-semibold text-error">{alertas.length} alertas</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {alertas.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                      <CheckCircle2 size={24} className="text-exito" />
                      <p className="text-sm text-textoSecundario">Todo en orden</p>
                    </div>
                  ) : (
                    alertas.slice(0, 5).map((a) => (
                      <FilaAlerta key={a.id} alerta={a} onClick={() => navigate('/empleado/movimiento', { state: { productoId: a.id } })} />
                    ))
                  )}
                </div>
                {alertas.length > 0 && (
                  <button onClick={() => navigate('/empleado/alertas')} className="w-full border-t border-borde py-3 text-xs font-semibold text-vino hover:bg-crema">
                    Ver todas las alertas →
                  </button>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-12 max-w-5xl space-y-6 px-4">
        {sinConexion && (
          <div className="tarjeta flex items-center gap-3 border-error/30 p-4 text-sm text-error">
            <WifiOff size={18} className="shrink-0" />
            Sin conexión — los datos pueden estar desactualizados.
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi etiqueta="Por atender" valor={activos.length} acento="text-vino" onClick={() => navigate('/empleado/pedidos')} />
          <Kpi etiqueta="Entregados hoy" valor={entregadosHoy.length} onClick={() => navigate('/empleado/pedidos/entregados')} />
          <Kpi etiqueta="Cobrado hoy" valor={dinero(cobradoHoy)} acento="text-exito" onClick={() => navigate('/empleado/pedidos/entregados')} />
          <Kpi etiqueta="Alertas de stock" valor={alertas.length} acento={alertas.length ? 'text-error' : 'text-cacao'} onClick={() => navigate('/empleado/alertas')} />
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          {/* Siguiente pedido + cola */}
          <section>
            <Titulo texto="Siguiente en la fila" accion="Ver todos" onAccion={() => navigate('/empleado/pedidos')} />
            {siguiente ? (
              <button
                onClick={() => navigate(`/empleado/pedidos/${siguiente.id}`)}
                className="w-full overflow-hidden rounded-3xl bg-vino text-left text-white shadow-elevada transition hover:bg-vino-oscuro"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-semibold">{folio(siguiente.id)}</p>
                      <p className="text-sm text-white/80">{siguiente.clienteNombre || 'Cliente general'}</p>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">{haceCuanto(siguiente.creado)}</span>
                  </div>
                  <p className="mt-4 text-sm text-white/70">
                    {(siguiente.productos || []).slice(0, 3).map((x) => `${Number(x.cantidad) || 1}× ${x.nombre}`).join(' · ')}
                    {(siguiente.productos || []).length > 3 && ' …'}
                  </p>
                </div>
                <div className="flex items-center justify-between bg-black/15 px-5 py-4">
                  <span className="font-display text-2xl font-semibold">{dinero(siguiente.total)}</span>
                  <span className="flex items-center gap-1 text-sm font-semibold">Atender <ArrowRight size={16} /></span>
                </div>
              </button>
            ) : (
              <div className="tarjeta flex items-center gap-3 p-5 text-sm text-textoSecundario">
                <CheckCircle2 size={22} className="text-exito" /> No hay pedidos por atender. ¡Buen trabajo!
              </div>
            )}

            {activos.length > 1 && (
              <ul className="tarjeta mt-3 divide-y divide-borde/60 overflow-hidden">
                {activos.slice(1, 5).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => navigate(`/empleado/pedidos/${p.id}`)} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-cacao">{folio(p.id)} <span className="font-normal text-textoSecundario">· {p.clienteNombre || 'Cliente general'}</span></p>
                        <p className="text-xs text-textoSecundario">{haceCuanto(p.creado)}</p>
                      </div>
                      <EstadoPedido status={p.status || 'pendiente'} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Alertas + accesos */}
          <section className="space-y-6">
            <div>
              <Titulo texto="Reabastecer" accion={alertas.length > 3 ? `Ver ${alertas.length}` : null} onAccion={() => navigate('/empleado/alertas')} />
              {alertas.length === 0 ? (
                <div className="tarjeta flex items-center gap-3 p-5 text-sm text-textoSecundario">
                  <CheckCircle2 size={22} className="text-exito" /> Inventario en orden
                </div>
              ) : (
                <div className="tarjeta overflow-hidden">
                  {alertas.slice(0, 3).map((a) => (
                    <FilaAlerta key={a.id} alerta={a} accion onClick={() => navigate('/empleado/movimiento', { state: { productoId: a.id } })} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <Titulo texto="Accesos rápidos" />
              <div className="grid grid-cols-3 gap-3">
                <Acceso icono={ClipboardList} texto="Pedidos" onClick={() => navigate('/empleado/pedidos')} />
                <Acceso icono={Warehouse} texto="Inventario" onClick={() => navigate('/empleado/inventario')} />
                <Acceso icono={ArrowLeftRight} texto="Movimiento" onClick={() => navigate('/empleado/movimiento')} />
              </div>
            </div>
          </section>
        </div>
      </div>

      <BottomNavEmpleado />
    </div>
  )
}

function Kpi({ etiqueta, valor, acento = 'text-cacao', onClick }) {
  return (
    <button onClick={onClick} className="tarjeta p-4 text-left transition hover:-translate-y-0.5 hover:shadow-elevada">
      <p className="text-xs text-textoSecundario">{etiqueta}</p>
      <p className={`mt-1 truncate font-display text-2xl font-semibold sm:text-3xl ${acento}`}>{valor}</p>
    </button>
  )
}

function Titulo({ texto, accion, onAccion }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-textoSecundario">{texto}</h2>
      {accion && (
        <button onClick={onAccion} className="text-xs font-semibold text-vino hover:underline">
          {accion} →
        </button>
      )}
    </div>
  )
}

function FilaAlerta({ alerta: a, onClick, accion }) {
  const Icono = a.agotado ? PackageX : AlertTriangle
  return (
    <button onClick={onClick} className="flex min-h-[60px] w-full items-center gap-3 border-b border-borde/60 px-4 py-3 text-left last:border-b-0 hover:bg-crema">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.agotado ? 'bg-error/10 text-error' : 'bg-miel/10 text-miel'}`}>
        <Icono size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-cacao">{a.nombre}</p>
        <p className={`text-xs ${a.agotado ? 'text-error' : 'text-miel'}`}>{a.estado}</p>
      </div>
      {accion && (
        <span className="flex h-9 items-center gap-1 rounded-lg border border-borde px-2.5 text-xs font-semibold text-vino">
          <Plus size={14} /> Entrada
        </span>
      )}
    </button>
  )
}

function Acceso({ icono: Icono, texto, onClick }) {
  return (
    <button onClick={onClick} className="tarjeta flex flex-col items-center gap-2 px-2 py-4 text-sm font-medium text-cacao transition hover:border-vino/30 hover:text-vino">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-vino/10 text-vino">
        <Icono size={20} />
      </span>
      {texto}
    </button>
  )
}
