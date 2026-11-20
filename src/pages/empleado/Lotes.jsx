// Lotes.jsx — Lotes de un producto (datos reales: productos/{id}/lotes)
// Crear lote = entrada con lote nuevo; sacar de un lote = salida con ese lote.
// Ambas acciones pasan por RegistrarMovimiento para que stock e historial cuadren.
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { Plus, Layers, CalendarClock, AlertOctagon, ArrowUpFromLine, Info } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import { escucharLotes } from '../../services/inventario'
import { stockDe, diasPara, textoCaducidad, fechaCorta, DIAS_POR_CADUCAR } from '../../utils/stock'
import { fechaRelativa } from '../../utils/formato'
import { obtenerImagen } from '../../utils/imagenes'

function estadoLote(l) {
  const actual = Number(l.cantActual) || 0
  const d = diasPara(l.caducidad)
  if (d !== null && d < 0 && actual > 0) return { id: 'vencido', label: 'Vencido', clase: 'bg-error text-white' }
  if (actual === 0) return { id: 'agotado', label: 'Agotado', clase: 'bg-pergamino text-textoSecundario' }
  if (d !== null && d <= DIAS_POR_CADUCAR) return { id: 'pronto', label: 'Vence pronto', clase: 'bg-miel/10 text-miel' }
  if (actual < (Number(l.cantInicial) || actual)) return { id: 'parcial', label: 'Parcial', clase: 'bg-oliva/10 text-oliva' }
  return { id: 'activo', label: 'Completo', clase: 'bg-exito/10 text-exito' }
}

export default function Lotes() {
  const navigate = useNavigate()
  const { productoId } = useParams()
  const { usuario } = useAuth()
  const rutaMovimiento = usuario?.role === 'admin' ? '/admin/movimiento' : '/empleado/movimiento'
  const rutaInventario = usuario?.role === 'admin' ? '/admin/inventario' : '/empleado/inventario'

  const [producto, setProducto] = useState(null)
  const [lotes, setLotes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinPermiso, setSinPermiso] = useState(false)
  const [filtro, setFiltro] = useState('activos')

  useEffect(() => {
    return onSnapshot(doc(db, 'productos', productoId), (snap) => {
      setProducto(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setCargando(false)
    })
  }, [productoId])

  useEffect(
    () =>
      escucharLotes(productoId, setLotes, (err) => {
        if (err?.code === 'permission-denied') setSinPermiso(true)
      }),
    [productoId],
  )

  const conEstado = useMemo(() => lotes.map((l) => ({ ...l, estado: estadoLote(l) })), [lotes])
  const enLotes = lotes.reduce((s, l) => s + (Number(l.cantActual) || 0), 0)
  const stock = stockDe(producto)

  const filtros = [
    { id: 'activos', label: 'Con existencia', fn: (l) => ['activo', 'parcial', 'pronto', 'vencido'].includes(l.estado.id) },
    { id: 'pronto', label: 'Por vencer', fn: (l) => ['pronto', 'vencido'].includes(l.estado.id) },
    { id: 'agotados', label: 'Agotados', fn: (l) => l.estado.id === 'agotado' },
    { id: 'todos', label: 'Todos', fn: () => true },
  ]
  const visibles = conEstado
    .filter(filtros.find((f) => f.id === filtro).fn)
    .sort((a, b) => (a.caducidad || '9999').localeCompare(b.caducidad || '9999'))

  const nuevoLote = () => navigate(rutaMovimiento, { state: { productoId, tipo: 'entrada', nuevoLote: true } })

  if (!cargando && !producto) {
    return (
      <div className="min-h-screen bg-crema">
        <EncabezadoStaff titulo="Lotes" atras={rutaInventario} />
        <p className="p-10 text-center text-textoSecundario">Este producto ya no existe.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema pb-28">
      <EncabezadoStaff
        titulo="Lotes"
        subtitulo={producto?.nombre}
        atras={rutaInventario}
        acciones={
          <button onClick={nuevoLote} className="btn h-11 bg-crema px-4 text-cacao hover:bg-superficie">
            <Plus size={18} /> <span className="hidden sm:inline">Nuevo lote</span>
          </button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-5 px-4 pt-5">
        {/* Resumen del producto */}
        {producto && (
          <div className="tarjeta flex items-center gap-4 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-pergamino">
              {obtenerImagen(producto) && <img src={obtenerImagen(producto)} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="grid flex-1 grid-cols-3 gap-2 text-center">
              <Dato valor={stock} etiqueta="Stock total" />
              <Dato valor={enLotes} etiqueta="En lotes" />
              <Dato valor={conEstado.filter((l) => (Number(l.cantActual) || 0) > 0).length} etiqueta="Lotes activos" />
            </div>
          </div>
        )}

        {stock !== enLotes && lotes.length > 0 && (
          <p className="flex gap-2 rounded-xl bg-pergamino px-4 py-3 text-xs leading-5 text-textoSecundario">
            <Info size={16} className="mt-0.5 shrink-0 text-oliva" />
            {stock - enLotes > 0
              ? `${stock - enLotes} pza(s) están en inventario sin lote asignado (entradas o pedidos registrados sin lote).`
              : 'Hay más piezas en lotes que en el stock: algunas ventas no descontaron de un lote específico.'}
          </p>
        )}

        {sinPermiso ? (
          <div className="tarjeta p-6 text-center text-sm text-textoSecundario">
            No hay permiso para leer lotes. Revisa las reglas de Firestore para <code>productos/&#123;id&#125;/lotes</code>.
          </div>
        ) : lotes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-oliva">
              <Layers size={30} />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-cacao">Sin lotes registrados</h2>
              <p className="mt-1 max-w-sm text-sm text-textoSecundario">
                Registra cada entrega como lote para saber cuánto queda de cada una y cuándo caduca.
              </p>
            </div>
            <button onClick={nuevoLote} className="btn-primario h-12 px-6"><Plus size={18} /> Registrar primer lote</button>
          </div>
        ) : (
          <>
            <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
              {filtros.map((f) => (
                <button key={f.id} onClick={() => setFiltro(f.id)} className={`${filtro === f.id ? 'chip-activo' : 'chip-inactivo'} h-10`}>
                  {f.label} <span className="opacity-70">{conEstado.filter(f.fn).length}</span>
                </button>
              ))}
            </div>

            {visibles.length === 0 ? (
              <p className="py-10 text-center text-sm text-textoSecundario">Nada en esta sección.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {visibles.map((l) => {
                  const actual = Number(l.cantActual) || 0
                  const inicial = Number(l.cantInicial) || actual || 1
                  const pct = Math.round((actual / inicial) * 100)
                  const d = diasPara(l.caducidad)
                  const vencido = l.estado.id === 'vencido'
                  return (
                    <li key={l.id} className={`tarjeta overflow-hidden ${vencido ? 'border-error/50' : ''}`}>
                      {vencido && (
                        <div className="flex gap-2 bg-error px-4 py-2.5 text-xs text-white">
                          <AlertOctagon size={16} className="shrink-0" />
                          <span><b>No se puede vender.</b> Registra la salida por merma.</span>
                        </div>
                      )}
                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-semibold text-cacao">{l.numero}</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${l.estado.clase}`}>{l.estado.label}</span>
                        </div>

                        <div>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-textoSecundario">{actual} de {inicial} pzas</span>
                            <span className="font-semibold text-cacao">{pct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-pergamino">
                            <div className={`h-full rounded-full ${vencido ? 'bg-error' : pct > 50 ? 'bg-exito' : pct > 0 ? 'bg-miel' : 'bg-transparent'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <dt className="text-textoSecundario">Caducidad</dt>
                            <dd className={`flex items-center gap-1 font-medium ${d !== null && d < 0 ? 'text-error' : d !== null && d <= DIAS_POR_CADUCAR ? 'text-miel' : 'text-cacao'}`}>
                              {l.caducidad ? <><CalendarClock size={12} /> {fechaCorta(l.caducidad)}</> : 'No caduca'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-textoSecundario">Registrado</dt>
                            <dd className="font-medium text-cacao">{fechaRelativa(l.creado) || '—'}</dd>
                          </div>
                        </dl>
                        {d !== null && actual > 0 && <p className="text-xs text-textoSecundario">{textoCaducidad(d)}{l.registradoPor && ` · por ${l.registradoPor}`}</p>}

                        {actual > 0 && (
                          <button
                            onClick={() =>
                              navigate(rutaMovimiento, {
                                state: { productoId, tipo: 'salida', loteId: l.id, motivo: vencido ? 'Merma / caducidad' : '' },
                              })
                            }
                            className={`btn h-11 w-full ${vencido ? 'bg-error text-white hover:bg-error/90' : 'border border-borde text-cacao hover:border-vino/40 hover:text-vino'}`}
                          >
                            <ArrowUpFromLine size={16} /> {vencido ? 'Registrar merma' : 'Registrar salida'}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <BottomNavEmpleado />
    </div>
  )
}

function Dato({ valor, etiqueta }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-cacao">{valor}</p>
      <p className="text-[11px] text-textoSecundario">{etiqueta}</p>
    </div>
  )
}
