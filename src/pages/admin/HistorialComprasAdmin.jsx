// HistorialComprasAdmin.jsx — Historial de ventas (todos los pedidos)
// Filtros por periodo, estatus y cliente; resumen del periodo y mejores clientes; exporta CSV.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Download, ChevronRight, Receipt, X } from 'lucide-react'
import { db } from '../../firebase/config'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import BuscadorEncabezado from '../../components/staff/BuscadorEncabezado'
import Estadisticas from '../../components/staff/Estadisticas'
import EstadoPedido from '../../components/staff/EstadoPedido'
import { ETIQUETAS_STATUS } from '../../services/pedidos'
import { dinero, folio, fechaRelativa } from '../../utils/formato'
import { descargarCSV } from '../../utils/csv'

const PERIODOS = [
  { id: 'hoy', label: 'Hoy', dias: 0 },
  { id: '7', label: '7 días', dias: 7 },
  { id: '30', label: '30 días', dias: 30 },
  { id: 'todo', label: 'Todo', dias: null },
]
const ESTATUS = ['todos', 'entregado', 'pendiente', 'preparando', 'pagado', 'en_camino', 'cancelado']
const POR_PAGINA = 25

const claveCliente = (p) => p.clienteId || p.clienteNombre || 'general'

export default function HistorialComprasAdmin() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('30')
  const [estatus, setEstatus] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [cliente, setCliente] = useState(null) // { clave, nombre }
  const [limite, setLimite] = useState(POR_PAGINA)

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'pedidos'), orderBy('creado', 'desc')),
        (s) => {
          setPedidos(s.docs.map((d) => ({ id: d.id, ...d.data(), status: d.data().status || 'pendiente' })))
          setCargando(false)
        },
        () => setCargando(false),
      ),
    [],
  )

  const enPeriodo = useMemo(() => {
    const p = PERIODOS.find((x) => x.id === periodo)
    if (p.dias === null) return pedidos
    const desde = new Date()
    desde.setHours(0, 0, 0, 0)
    desde.setDate(desde.getDate() - p.dias)
    return pedidos.filter((x) => x.creado?.toDate && x.creado.toDate() >= desde)
  }, [pedidos, periodo])

  const filtrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase().replace('#', '')
    return enPeriodo.filter(
      (p) =>
        (estatus === 'todos' || p.status === estatus) &&
        (!cliente || claveCliente(p) === cliente.clave) &&
        (!t || folio(p.id).toLowerCase().includes(t) || (p.clienteNombre || '').toLowerCase().includes(t)),
    )
  }, [enPeriodo, estatus, cliente, busqueda])

  const resumen = useMemo(() => {
    const entregados = filtrados.filter((p) => p.status === 'entregado')
    const ventas = entregados.reduce((s, p) => s + (Number(p.total) || 0), 0)
    return {
      ventas,
      pedidos: filtrados.length,
      ticket: entregados.length ? ventas / entregados.length : 0,
      cancelados: filtrados.filter((p) => p.status === 'cancelado').length,
    }
  }, [filtrados])

  const mejoresClientes = useMemo(() => {
    const m = {}
    for (const p of enPeriodo) {
      if (p.status !== 'entregado') continue
      const k = claveCliente(p)
      m[k] = m[k] || { clave: k, nombre: p.clienteNombre || 'Cliente general', total: 0, pedidos: 0 }
      m[k].total += Number(p.total) || 0
      m[k].pedidos++
    }
    return Object.values(m).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [enPeriodo])

  const exportar = () =>
    descargarCSV(
      'historial-ventas',
      ['Folio', 'Fecha', 'Cliente', 'Piezas', 'Total', 'Estatus'],
      filtrados.map((p) => [
        folio(p.id),
        p.creado?.toDate ? p.creado.toDate().toLocaleString('es-MX') : '',
        p.clienteNombre || 'Cliente general',
        (p.productos || []).reduce((s, x) => s + (Number(x.cantidad) || 1), 0),
        Number(p.total) || 0,
        ETIQUETAS_STATUS[p.status] || p.status,
      ]),
    )

  const visibles = filtrados.slice(0, limite)

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff
        titulo="Historial de ventas"
        subtitulo="Todos los pedidos de la tienda"
        acciones={
          <button onClick={exportar} disabled={!filtrados.length} className="btn h-11 border border-white/20 px-3 text-marfil hover:bg-white/10 disabled:opacity-40">
            <Download size={18} /> <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        }
      >
        <BuscadorEncabezado valor={busqueda} onCambio={(v) => { setBusqueda(v); setLimite(POR_PAGINA) }} placeholder="Buscar por folio o cliente…" />
      </EncabezadoStaff>

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-pergamino p-1" role="tablist" aria-label="Periodo">
            {PERIODOS.map((p) => (
              <button key={p.id} role="tab" aria-selected={periodo === p.id} onClick={() => { setPeriodo(p.id); setLimite(POR_PAGINA) }} className={`h-9 rounded-lg px-4 text-sm font-medium transition ${periodo === p.id ? 'bg-superficie text-cacao shadow-tarjeta' : 'text-textoSecundario hover:text-cacao'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <select value={estatus} onChange={(e) => setEstatus(e.target.value)} aria-label="Estatus" className="campo h-11 w-auto py-0">
            {ESTATUS.map((s) => <option key={s} value={s}>{s === 'todos' ? 'Todos los estatus' : ETIQUETAS_STATUS[s]}</option>)}
          </select>
          {cliente && (
            <button onClick={() => setCliente(null)} className="chip-activo h-10">
              {cliente.nombre} <X size={14} />
            </button>
          )}
        </div>

        <Estadisticas
          items={[
            { etiqueta: 'Ventas (entregados)', valor: dinero(resumen.ventas), acento: 'text-exito' },
            { etiqueta: 'Pedidos', valor: resumen.pedidos },
            { etiqueta: 'Ticket promedio', valor: dinero(resumen.ticket) },
            { etiqueta: 'Cancelados', valor: resumen.cancelados, acento: resumen.cancelados ? 'text-error' : 'text-cacao' },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <section>
            {cargando ? (
              <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="tarjeta h-14 animate-pulse" />)}</div>
            ) : filtrados.length === 0 ? (
              <div className="tarjeta flex flex-col items-center gap-3 py-14 text-center">
                <Receipt size={32} className="text-cacao/40" />
                <p className="font-display text-lg text-cacao">Sin pedidos con estos filtros</p>
              </div>
            ) : (
              <>
                <div className="tarjeta overflow-hidden">
                  <table className="hidden w-full text-left text-sm md:table">
                    <thead className="border-b border-borde bg-pergamino/40 text-xs uppercase tracking-wider text-textoSecundario">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Folio</th>
                        <th className="px-4 py-3 font-semibold">Cliente</th>
                        <th className="px-4 py-3 font-semibold">Fecha</th>
                        <th className="px-4 py-3 text-right font-semibold">Total</th>
                        <th className="px-4 py-3 font-semibold">Estatus</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borde/60">
                      {visibles.map((p) => (
                        <tr key={p.id} onClick={() => navigate(`/admin/pedidos/${p.id}`)} className="cursor-pointer hover:bg-crema">
                          <td className="px-4 py-3 font-semibold text-cacao">{folio(p.id)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setCliente({ clave: claveCliente(p), nombre: p.clienteNombre || 'Cliente general' }) }}
                              className="text-cacao hover:text-vino hover:underline"
                            >
                              {p.clienteNombre || 'Cliente general'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-textoSecundario">{fechaRelativa(p.creado)}</td>
                          <td className="px-4 py-3 text-right font-medium text-cacao">{dinero(p.total)}</td>
                          <td className="px-4 py-3"><EstadoPedido status={p.status} /></td>
                          <td className="pr-3"><ChevronRight size={16} className="text-textoSecundario" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ul className="divide-y divide-borde/60 md:hidden">
                    {visibles.map((p) => (
                      <li key={p.id}>
                        <button onClick={() => navigate(`/admin/pedidos/${p.id}`)} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-cacao">{folio(p.id)} <span className="font-normal text-textoSecundario">· {p.clienteNombre || 'Cliente general'}</span></p>
                            <p className="text-xs text-textoSecundario">{fechaRelativa(p.creado)} · {dinero(p.total)}</p>
                          </div>
                          <EstadoPedido status={p.status} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {filtrados.length > limite && (
                  <button onClick={() => setLimite((l) => l + POR_PAGINA)} className="btn-secundario mt-3 h-11 w-full">
                    Mostrar más ({filtrados.length - limite} restantes)
                  </button>
                )}
              </>
            )}
          </section>

          <aside className="tarjeta h-fit p-5">
            <h2 className="text-sm font-semibold text-cacao">Mejores clientes</h2>
            <p className="mb-4 text-xs text-textoSecundario">Compras entregadas en el periodo</p>
            {mejoresClientes.length === 0 ? (
              <p className="py-6 text-center text-sm text-textoSecundario">Sin ventas en el periodo.</p>
            ) : (
              <ol className="space-y-3">
                {mejoresClientes.map((c, i) => (
                  <li key={c.clave}>
                    <button onClick={() => setCliente({ clave: c.clave, nombre: c.nombre })} className="flex w-full items-center gap-3 text-left hover:text-vino">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pergamino font-display text-sm font-semibold text-cacao">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-cacao">{c.nombre}</span>
                        <span className="text-xs text-textoSecundario">{c.pedidos} pedido{c.pedidos === 1 ? '' : 's'}</span>
                      </span>
                      <span className="text-sm font-semibold text-cacao">{dinero(c.total)}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      </div>

      <BottomNavAdmin />
    </div>
  )
}
