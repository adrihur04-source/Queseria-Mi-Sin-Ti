// DashboardAdmin.jsx — Panel principal de administración (datos reales de Firestore)
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { Plus, ArrowLeftRight, ArrowRight, PackageX, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Wallet, ClipboardList, Receipt, Truck } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import NotificacionesAdmin from '../../components/layout/NotificacionesAdmin'
import EstadoPedido from '../../components/staff/EstadoPedido'
import { ESTADOS_ACTIVOS } from '../../services/pedidos'
import { dinero, folio, haceCuanto } from '../../utils/formato'
import Avatar from '../../components/Avatar'
import { necesitaReabasto, stockDe } from '../../utils/stock'

function obtenerSaludo() {
  const h = new Date().getHours()
  if (h >= 6 && h < 13) return 'Buenos días'
  if (h >= 13 && h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const inicioDelDia = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export default function DashboardAdmin() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'productos'), (s) => setProductos(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
    const u2 = onSnapshot(
      collection(db, 'pedidos'),
      (s) => {
        setPedidos(s.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
      },
      () => setCargando(false),
    )
    return () => {
      u1()
      u2()
    }
  }, [])

  const datos = useMemo(() => {
    const entregados = pedidos.filter((p) => p.status === 'entregado' && p.creado?.toDate)
    const hoy = inicioDelDia(new Date())

    // Ventas por día, últimos 7 días (hoy incluido)
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy)
      d.setDate(d.getDate() - (6 - i))
      return { fecha: d, total: 0, pedidos: 0 }
    })
    for (const p of entregados) {
      const dia = inicioDelDia(p.creado.toDate()).getTime()
      const slot = dias.find((x) => x.fecha.getTime() === dia)
      if (slot) {
        slot.total += Number(p.total) || 0
        slot.pedidos += 1
      }
    }
    const ventasHoy = dias[6].total
    const ventasAyer = dias[5].total
    const total7 = dias.reduce((s, d) => s + d.total, 0)
    const pedidos7 = dias.reduce((s, d) => s + d.pedidos, 0)

    // Más vendidos (7 días, por piezas)
    const desde = dias[0].fecha.getTime()
    const conteo = {}
    for (const p of entregados) {
      if (p.creado.toDate().getTime() < desde) continue
      for (const x of p.productos || []) {
        const k = x.productoId || x.nombre
        conteo[k] = conteo[k] || { nombre: x.nombre, piezas: 0, monto: 0 }
        conteo[k].piezas += Number(x.cantidad) || 1
        conteo[k].monto += (Number(x.precio) || 0) * (Number(x.cantidad) || 1)
      }
    }
    const masVendidos = Object.values(conteo).sort((a, b) => b.piezas - a.piezas).slice(0, 5)

    const activos = pedidos
      .filter((p) => ESTADOS_ACTIVOS.includes(p.status || 'pendiente'))
      .sort((a, b) => (a.creado?.toMillis?.() || 0) - (b.creado?.toMillis?.() || 0))
    const alertas = productos.filter(necesitaReabasto).sort((a, b) => stockDe(a) - stockDe(b))

    return {
      dias,
      ventasHoy,
      variacion: ventasAyer > 0 ? Math.round(((ventasHoy - ventasAyer) / ventasAyer) * 100) : null,
      total7,
      ticket: pedidos7 ? total7 / pedidos7 : 0,
      pedidos7,
      masVendidos,
      activos,
      envios: activos.filter((p) => p.entrega === 'domicilio').length,
      alertas,
      agotados: alertas.filter((p) => stockDe(p) === 0).length,
      productosActivos: productos.filter((p) => p.activo !== false && p.visibleCatalogo !== false).length,
    }
  }, [productos, pedidos])

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      {/* Encabezado: tarjeta de cristal oscuro con saludo, foto y accesos */}
      <header className="px-3 pt-3 md:px-6 md:pt-4">
        <div className="vidrio-oscuro relative mx-auto max-w-6xl rounded-[28px] px-5 pb-20 pt-6 text-marfil md:px-8 md:pt-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute -left-16 -top-24 h-72 w-72 animate-deriva rounded-full bg-vino/60 blur-3xl" />
            <span className="absolute -right-10 -top-10 h-56 w-56 animate-deriva rounded-full bg-miel/40 blur-3xl [animation-delay:-9s]" />
            <span className="absolute bottom-0 left-1/3 h-40 w-80 animate-deriva rounded-full bg-oliva/30 blur-3xl [animation-delay:-15s]" />
          </div>
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/admin/perfil')} aria-label="Mi perfil" className="hidden sm:block">
                <Avatar usuario={usuario} tam="h-16 w-16" texto="text-xl" className="ring-2 ring-white/25 transition hover:ring-white/50" />
              </button>
              <div>
                <p className="text-sm text-marfil/70">{obtenerSaludo()},</p>
                <h1 className="font-display text-2xl font-semibold text-white sm:text-4xl">{usuario?.nombre?.split(' ')[0] || 'Administración'} <span className="inline-block origin-[70%_70%] animate-[saludo_2.4s_ease-in-out_1]">👋</span></h1>
                <p className="mt-1 text-xs capitalize text-marfil/60">
                  {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/admin/movimiento')} className="btn hidden h-11 border border-white/15 bg-white/10 px-4 text-white backdrop-blur hover:bg-white/20 lg:inline-flex">
                <ArrowLeftRight size={18} /> Movimiento
              </button>
              <button onClick={() => navigate('/admin/producto/nuevo')} className="btn hidden h-11 bg-marfil px-4 text-[#3B2418] shadow-lg hover:bg-white sm:inline-flex">
                <Plus size={18} /> Producto
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
                <NotificacionesAdmin />
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="relative mx-auto -mt-14 max-w-6xl space-y-6 px-5 md:px-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icono={Wallet} etiqueta="Ventas hoy" valor={dinero(datos.ventasHoy)} cargando={cargando} onClick={() => navigate('/admin/historial')}>
            {datos.variacion === null ? (
              <span className="text-textoSecundario">sin ventas ayer</span>
            ) : (
              <span className={`flex items-center gap-1 font-semibold ${datos.variacion >= 0 ? 'text-exito' : 'text-error'}`}>
                {datos.variacion >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {datos.variacion >= 0 ? '+' : ''}{datos.variacion}% vs ayer
              </span>
            )}
          </Kpi>
          <Kpi icono={ClipboardList} etiqueta="Por atender" valor={datos.activos.length} cargando={cargando} acento="text-vino" onClick={() => navigate('/admin/pedidos')}>
            <span className="flex items-center gap-1 text-textoSecundario">pedidos activos{datos.envios > 0 && <> · <Truck size={12} /> {datos.envios} a domicilio</>}</span>
          </Kpi>
          <Kpi icono={Receipt} etiqueta="Ticket promedio" valor={dinero(datos.ticket)} cargando={cargando} onClick={() => navigate('/admin/historial')}>
            <span className="text-textoSecundario">{datos.pedidos7} pedidos en 7 días</span>
          </Kpi>
          <Kpi icono={AlertTriangle} etiqueta="Alertas de stock" valor={datos.alertas.length} cargando={cargando} acento={datos.alertas.length ? 'text-error' : 'text-cacao'} onClick={() => navigate('/admin/alertas')}>
            <span className="text-textoSecundario">{datos.agotados} agotados · {datos.productosActivos} activos</span>
          </Kpi>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Ventas 7 días */}
          <section className="tarjeta p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-cacao">Ventas de los últimos 7 días</h2>
                <p className="text-xs text-textoSecundario">Pedidos entregados, en pesos</p>
              </div>
              <p className="font-display text-2xl font-semibold text-cacao">{dinero(datos.total7)}</p>
            </div>
            <BarrasVentas dias={datos.dias} />
          </section>

          {/* Más vendidos */}
          <section className="tarjeta p-5">
            <h2 className="mb-1 text-sm font-semibold text-cacao">Más vendidos</h2>
            <p className="mb-4 text-xs text-textoSecundario">Piezas entregadas · 7 días</p>
            {datos.masVendidos.length === 0 ? (
              <p className="py-8 text-center text-sm text-textoSecundario">Aún no hay ventas esta semana.</p>
            ) : (
              <ol className="space-y-3">
                {datos.masVendidos.map((p, i) => (
                  <li key={p.nombre + i} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pergamino font-display text-sm font-semibold text-cacao">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-cacao">{p.nombre}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-pergamino">
                        <div className="h-full rounded-full bg-oliva" style={{ width: `${(p.piezas / datos.masVendidos[0].piezas) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-right text-xs text-textoSecundario">
                      <b className="block text-sm text-cacao">{p.piezas} pzas</b>{dinero(p.monto)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pedidos por atender */}
          <section>
            <Titulo texto="Pedidos por atender" accion="Ver todos" onAccion={() => navigate('/admin/pedidos')} />
            {datos.activos.length === 0 ? (
              <Vacio texto="No hay pedidos pendientes" />
            ) : (
              <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
                {datos.activos.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => navigate(`/admin/pedidos/${p.id}`)} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-cacao">{folio(p.id)} <span className="font-normal text-textoSecundario">· {p.clienteNombre || 'Cliente general'}</span></p>
                        <p className="text-xs text-textoSecundario">{haceCuanto(p.creado)} · {dinero(p.total)}</p>
                      </div>
                      <EstadoPedido status={p.status || 'pendiente'} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Reabastecer */}
          <section>
            <Titulo texto="Reabastecer" accion={datos.alertas.length ? `Ver ${datos.alertas.length}` : null} onAccion={() => navigate('/admin/alertas')} />
            {datos.alertas.length === 0 ? (
              <Vacio texto="Inventario en orden" />
            ) : (
              <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
                {datos.alertas.slice(0, 5).map((p) => {
                  const agotado = stockDe(p) === 0
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => navigate('/admin/movimiento', { state: { productoId: p.id, tipo: 'entrada' } })}
                        className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${agotado ? 'bg-error/10 text-error' : 'bg-miel/10 text-miel'}`}>
                          {agotado ? <PackageX size={18} /> : <AlertTriangle size={18} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-cacao">{p.nombre}</p>
                          <p className={`text-xs ${agotado ? 'text-error' : 'text-miel'}`}>{agotado ? 'Agotado' : `Quedan ${stockDe(p)} pzas`}</p>
                        </div>
                        <span className="text-xs font-semibold text-vino">+ Entrada</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Acciones rápidas (móvil) */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <button onClick={() => navigate('/admin/producto/nuevo')} className="btn-primario h-12"><Plus size={18} /> Producto</button>
          <button onClick={() => navigate('/admin/movimiento')} className="btn-secundario h-12"><ArrowLeftRight size={18} /> Movimiento</button>
        </div>
      </div>

      <BottomNavAdmin />
    </div>
  )
}

function Kpi({ icono: Icono, etiqueta, valor, acento = 'text-cacao', cargando, onClick, children }) {
  return (
    <button onClick={onClick} className="tarjeta group p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-elevada">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-textoSecundario">{etiqueta}</p>
        {Icono && <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-vino/10 text-vino transition group-hover:scale-110 group-hover:bg-vino group-hover:text-white"><Icono size={16} /></span>}
      </div>
      {cargando ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-pergamino" />
      ) : (
        <p className={`mt-1 truncate font-display text-2xl font-semibold sm:text-3xl ${acento}`}>{valor}</p>
      )}
      <div className="mt-1 text-xs">{children}</div>
    </button>
  )
}

// Barras de una sola serie: sin leyenda (el título la nombra), etiqueta directa
// solo en hoy y en el máximo, tooltip por barra y tabla accesible.
function BarrasVentas({ dias }) {
  const [activo, setActivo] = useState(null)
  const max = Math.max(...dias.map((d) => d.total), 1)
  const iMax = dias.reduce((im, d, i) => (d.total > dias[im].total ? i : im), 0)
  const corto = (n) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : dinero(n).replace('.00', ''))

  return (
    <div>
      <div className="relative flex h-44 items-end gap-2 border-b border-borde" onMouseLeave={() => setActivo(null)}>
        {dias.map((d, i) => {
          const h = (d.total / max) * 100
          const etiquetar = (i === 6 || i === iMax) && d.total > 0
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              aria-label={`${d.fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric' })}: ${dinero(d.total)}, ${d.pedidos} pedidos`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {etiquetar && activo === null && (
                <span className="mb-1 text-[11px] font-semibold text-cacao">{corto(d.total)}</span>
              )}
              <span
                className={`w-full max-w-[44px] rounded-t transition-opacity ${activo !== null && activo !== i ? 'opacity-40' : ''}`}
                style={{ height: `${Math.max(h, d.total > 0 ? 3 : 0)}%`, backgroundColor: '#8E3550' }}
              />
              {activo === i && (
                <span className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg bg-tinta px-2.5 py-1.5 text-left text-xs text-white shadow-elevada">
                  <b className="block">{dinero(d.total)}</b>
                  <span className="text-white/70">{d.pedidos} pedido{d.pedidos === 1 ? '' : 's'}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {dias.map((d, i) => (
          <span key={i} className={`flex-1 text-center text-[11px] capitalize ${i === 6 ? 'font-semibold text-cacao' : 'text-textoSecundario'}`}>
            {i === 6 ? 'Hoy' : d.fecha.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Ventas por día, últimos 7 días</caption>
        <thead><tr><th>Día</th><th>Ventas</th><th>Pedidos</th></tr></thead>
        <tbody>
          {dias.map((d, i) => (
            <tr key={i}><td>{d.fecha.toLocaleDateString('es-MX')}</td><td>{dinero(d.total)}</td><td>{d.pedidos}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Titulo({ texto, accion, onAccion }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-textoSecundario">{texto}</h2>
      {accion && <button onClick={onAccion} className="flex items-center gap-1 text-xs font-semibold text-vino hover:underline">{accion} <ArrowRight size={12} /></button>}
    </div>
  )
}

function Vacio({ texto }) {
  return (
    <div className="tarjeta flex items-center gap-3 p-5 text-sm text-textoSecundario">
      <CheckCircle2 size={22} className="text-exito" /> {texto}
    </div>
  )
}
