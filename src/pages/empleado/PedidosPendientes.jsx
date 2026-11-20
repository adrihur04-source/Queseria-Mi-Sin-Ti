// PedidosPendientes.jsx — Cola de pedidos del cajero
// Diseñado para mostrador: filtro por estatus, búsqueda por folio/cliente
// y botón para avanzar el pedido sin entrar al detalle.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { Search, X, PackageCheck, ChevronRight, Inbox, WifiOff, Truck, Store } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import EstadoPedido from '../../components/staff/EstadoPedido'
import { ESTADOS_ACTIVOS, ETIQUETAS_STATUS, accionSiguiente, avanzarPedido, esDomicilio } from '../../services/pedidos'
import { dinero, folio, fechaRelativa, haceCuanto } from '../../utils/formato'

export default function PedidosPendientes() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const base = usuario?.role === 'admin' ? '/admin' : '/empleado'

  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [avanzandoId, setAvanzandoId] = useState(null)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), orderBy('creado', 'desc'))
    return onSnapshot(
      q,
      (snap) => {
        setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
        setError(false)
      },
      (err) => {
        console.error('Error cargando pedidos:', err)
        setCargando(false)
        setError(true)
      },
    )
  }, [])

  // Nombre/teléfono real del cliente desde 'usuarios' (con caché)
  useEffect(() => {
    const faltantes = [...new Set(pedidos.map((p) => p.clienteId).filter((id) => id && !clientes[id]))]
    if (faltantes.length === 0) return
    let cancelado = false
    ;(async () => {
      const nuevos = {}
      await Promise.all(
        faltantes.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'usuarios', uid))
            nuevos[uid] = snap.exists() ? snap.data() : {}
          } catch {
            nuevos[uid] = {}
          }
        }),
      )
      if (!cancelado) setClientes((prev) => ({ ...prev, ...nuevos }))
    })()
    return () => {
      cancelado = true
    }
  }, [pedidos]) // eslint-disable-line react-hooks/exhaustive-deps

  const activos = useMemo(() => pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.status || 'pendiente')), [pedidos])

  const conteo = useMemo(() => {
    const c = { todos: activos.length }
    ESTADOS_ACTIVOS.forEach((s) => (c[s] = activos.filter((p) => (p.status || 'pendiente') === s).length))
    return c
  }, [activos])

  const nombreCliente = (p) => clientes[p.clienteId]?.nombre || p.clienteNombre || 'Cliente general'

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return activos
      .filter((p) => filtro === 'todos' || (p.status || 'pendiente') === filtro)
      .filter(
        (p) =>
          !texto ||
          folio(p.id).toLowerCase().includes(texto.replace('#', '')) ||
          nombreCliente(p).toLowerCase().includes(texto),
      )
      // En mostrador se atiende primero lo más antiguo
      .slice()
      .reverse()
  }, [activos, filtro, busqueda, clientes]) // eslint-disable-line react-hooks/exhaustive-deps

  const avanzar = async (p) => {
    setAvanzandoId(p.id)
    try {
      const nuevo = await avanzarPedido({ ...p, status: p.status || 'pendiente' }, usuario?.nombre)
      setAviso(`Pedido ${folio(p.id)} → ${ETIQUETAS_STATUS[nuevo]}`)
      setTimeout(() => setAviso(null), 2500)
    } catch (err) {
      console.error(err)
      setAviso('No se pudo actualizar el pedido. Intenta de nuevo.')
      setTimeout(() => setAviso(null), 3500)
    } finally {
      setAvanzandoId(null)
    }
  }

  const filtros = [{ id: 'todos', label: 'Todos' }, ...ESTADOS_ACTIVOS.map((s) => ({ id: s, label: ETIQUETAS_STATUS[s] }))]

  return (
    <div className="min-h-screen bg-crema pb-28">
      <EncabezadoStaff
        titulo="Pedidos"
        subtitulo={`${conteo.todos} activo${conteo.todos === 1 ? '' : 's'} · se atiende primero el más antiguo`}
        atras={`${base}/dashboard`}
        acciones={
          <button
            onClick={() => navigate(`${base}/pedidos/entregados`)}
            className="btn h-11 border border-white/20 px-3 text-marfil hover:bg-white/10"
          >
            <PackageCheck size={18} /> <span className="hidden sm:inline">Entregados</span>
          </button>
        }
      >
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-marfil/50" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por folio o cliente…"
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
        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 py-4">
          {filtros.map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id)} className={`${filtro === f.id ? 'chip-activo' : 'chip-inactivo'} h-10`}>
              {f.label}
              <span className={`ml-1 rounded-full px-1.5 text-xs ${filtro === f.id ? 'bg-white/20' : 'bg-pergamino'}`}>{conteo[f.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="tarjeta mb-4 flex items-center gap-3 border-error/30 p-4 text-sm text-error">
            <WifiOff size={18} /> No se pudieron cargar los pedidos. Revisa tu conexión.
          </div>
        )}

        {cargando ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="tarjeta h-44 animate-pulse bg-superficie" />
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-cacao/50">
              <Inbox size={30} />
            </span>
            <p className="font-display text-lg text-cacao">
              {busqueda ? 'Sin coincidencias' : 'No hay pedidos por atender'}
            </p>
            <p className="text-sm text-textoSecundario">
              {busqueda ? 'Prueba con otro folio o nombre.' : 'Los pedidos nuevos aparecerán aquí al instante.'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {visibles.map((p) => {
              const status = p.status || 'pendiente'
              const productos = p.productos || []
              const piezas = productos.reduce((s, x) => s + (Number(x.cantidad) || 1), 0)
              return (
                <li key={p.id} className="tarjeta flex flex-col overflow-hidden">
                  <button onClick={() => navigate(`${base}/pedidos/${p.id}`)} className="flex flex-1 flex-col gap-3 p-4 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-cacao">{folio(p.id)}</p>
                        <p className="truncate text-sm font-medium text-textoPrincipal">{nombreCliente(p)}</p>
                        <p className="flex items-center gap-1.5 text-xs text-textoSecundario" title={fechaRelativa(p.creado)}>
                          {haceCuanto(p.creado)}
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${esDomicilio(p) ? 'bg-vino/10 text-vino' : 'bg-oliva/10 text-oliva'}`}>
                            {esDomicilio(p) ? <><Truck size={11} /> Domicilio</> : <><Store size={11} /> Tienda</>}
                          </span>
                        </p>
                      </div>
                      <EstadoPedido status={status} />
                    </div>

                    <ul className="space-y-1 border-t border-borde/60 pt-3 text-sm text-textoSecundario">
                      {productos.slice(0, 3).map((x, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="truncate">
                            <b className="font-semibold text-cacao">{Number(x.cantidad) || 1}×</b> {x.nombre || 'Producto'}
                          </span>
                        </li>
                      ))}
                      {productos.length > 3 && <li className="text-xs">+{productos.length - 3} producto(s) más</li>}
                    </ul>

                    <div className="mt-auto flex items-end justify-between pt-1">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-textoSecundario">Total a cobrar · {piezas} pza{piezas === 1 ? '' : 's'}</p>
                        <p className="font-display text-2xl font-semibold text-vino">{dinero(p.total)}</p>
                      </div>
                      <ChevronRight size={20} className="text-textoSecundario" />
                    </div>
                  </button>

                  <button
                    onClick={() => avanzar(p)}
                    disabled={avanzandoId === p.id}
                    className="flex h-12 items-center justify-center gap-2 border-t border-borde/60 bg-pergamino/50 text-sm font-semibold text-vino transition hover:bg-vino hover:text-white disabled:opacity-60"
                  >
                    {avanzandoId === p.id ? 'Actualizando…' : accionSiguiente({ ...p, status })}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {aviso && (
        <div role="status" className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm animate-aparecer rounded-2xl bg-tinta px-4 py-3 text-center text-sm font-medium text-white shadow-elevada">
          {aviso}
        </div>
      )}

      <BottomNavEmpleado />
    </div>
  )
}
