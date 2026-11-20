// MisCompras.jsx — Historial de compras del cliente (pedidos entregados y cancelados)
// Resumen (gastado, ahorrado, compras), "lo que más compras", filtros, búsqueda,
// agrupado por mes, ticket detallado y "volver a pedir".
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, RotateCcw, Receipt, Search, X, Plus, Store, Truck, PiggyBank, ShoppingBag, CalendarHeart, ClipboardList } from 'lucide-react'
import { usePedidosCliente, volverAPedir } from '../../hooks/usePedidosCliente'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import { useCarrito } from '../../context/CarritoContext'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import BottomNav from '../../components/layout/BottomNav'
import EstadoPedido from '../../components/staff/EstadoPedido'
import Contador from '../../components/Contador'
import { ESTADOS_ACTIVOS, esDomicilio } from '../../services/pedidos'
import { dinero, folio, fechaRelativa } from '../../utils/formato'
import { obtenerImagen } from '../../utils/imagenes'
import { precioUnitario } from '../../utils/precio'
import { useAuth } from '../../hooks/useAuth'
import { useResenas, guardarResena, idResena } from '../../hooks/useResenas'
import Estrellas from '../../components/Estrellas'
import Hoja from '../../components/staff/Hoja'
import { confeti } from '../../utils/efectos'

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'entregado', label: 'Entregadas' },
  { id: 'cancelado', label: 'Canceladas' },
]

const ahorroDe = (p) =>
  (Number(p.descuento) || 0) +
  (p.productos || []).reduce((s, x) => s + Math.max(0, (Number(x.precioOriginal) || 0) - (Number(x.precio) || 0)) * (Number(x.cantidad) || 1), 0)

export default function MisCompras() {
  const navigate = useNavigate()
  const { pedidos, cargando } = usePedidosCliente()
  const { productos } = useProductosTienda()
  const { agregarAlCarrito, abrirCarrito } = useCarrito()
  const [filtro, setFiltro] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(null)
  const [aviso, setAviso] = useState('')
  const { usuario } = useAuth()
  const { lista: todasResenas } = useResenas()
  const [calificando, setCalificando] = useState(null) // { pedido, item }
  const misResenas = useMemo(() => Object.fromEntries(todasResenas.filter((r) => r.clienteId === usuario?.uid).map((r) => [r.id, r])), [todasResenas, usuario?.uid])

  const compras = useMemo(() => pedidos.filter((p) => !ESTADOS_ACTIVOS.includes(p.status)), [pedidos])
  const entregadas = useMemo(() => compras.filter((p) => p.status === 'entregado'), [compras])
  const porCalificar = useMemo(() => entregadas.flatMap((p) => (p.productos || []).filter((x) => x.productoId && !misResenas[idResena(p.id, x.productoId)]).map((x) => ({ pedido: p, item: x }))), [entregadas, misResenas])

  const resumen = useMemo(() => {
    const conteo = {}
    for (const p of entregadas) {
      for (const x of p.productos || []) {
        const k = x.productoId || x.nombre
        conteo[k] = conteo[k] || { id: x.productoId, nombre: x.nombre, piezas: 0 }
        conteo[k].piezas += Number(x.cantidad) || 1
      }
    }
    const masComprados = Object.values(conteo)
      .sort((a, b) => b.piezas - a.piezas)
      .slice(0, 4)
      .map((c) => ({ ...c, vivo: productos.find((p) => p.id === c.id) }))
    const primera = entregadas[entregadas.length - 1]?.creado?.toDate?.()
    return {
      gastado: entregadas.reduce((s, p) => s + (Number(p.total) || 0), 0),
      ahorrado: entregadas.reduce((s, p) => s + ahorroDe(p), 0),
      piezas: Object.values(conteo).reduce((s, c) => s + c.piezas, 0),
      desde: primera ? primera.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : null,
      masComprados,
    }
  }, [entregadas, productos])

  // Filtra y agrupa por mes
  const grupos = useMemo(() => {
    const t = busqueda.trim().toLowerCase().replace('#', '')
    const lista = compras
      .filter((p) => filtro === 'todas' || p.status === filtro)
      .filter((p) => !t || folio(p.id).toLowerCase().includes(t) || (p.productos || []).some((x) => (x.nombre || '').toLowerCase().includes(t)))
    const mapa = new Map()
    for (const p of lista) {
      const d = p.creado?.toDate?.()
      const clave = d ? d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : 'Sin fecha'
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push(p)
    }
    return [...mapa.entries()]
  }, [compras, filtro, busqueda])

  const avisar = (m) => {
    setAviso(m)
    setTimeout(() => setAviso(''), 3200)
  }
  const repetir = (p) => {
    const n = volverAPedir(p, productos, agregarAlCarrito)
    avisar(n ? `${n} producto(s) agregados a tu carrito` : 'Esos productos ya no están disponibles')
    if (n) window.dispatchEvent(new Event('carrito:latido'))
  }
  const agregarUno = (p) => {
    agregarAlCarrito(p, 1)
    window.dispatchEvent(new Event('carrito:latido'))
    avisar(`${p.nombre} agregado a tu carrito`)
  }

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda titulo="Mis compras" />
      <main className="mx-auto max-w-4xl space-y-7 px-4 pt-6 md:px-6">
        {/* Resumen */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-vino via-vino-oscuro to-[#2A0D18] p-6 text-marfil shadow-elevada md:p-8">
          <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 animate-deriva rounded-full bg-miel/30 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 animate-deriva rounded-full bg-vino-claro/40 blur-3xl [animation-delay:-10s]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-miel-claro">Mis compras</p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-white sm:text-4xl">Tu historia quesera</h1>
              {resumen.desde && <p className="mt-1 flex items-center gap-1.5 text-sm text-marfil/70"><CalendarHeart size={15} /> Cliente desde {resumen.desde}</p>}
            </div>
            <button onClick={() => navigate('/historial')} className="btn h-10 border border-white/20 bg-white/10 px-4 text-sm text-white backdrop-blur hover:bg-white/20">
              <ClipboardList size={16} /> Pedidos en curso
            </button>
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-3">
            <Dato etiqueta="Has comprado" valor={<>$<Contador valor={Math.round(resumen.gastado)} /></>} icono={ShoppingBag} />
            <Dato etiqueta="Has ahorrado" valor={<>$<Contador valor={Math.round(resumen.ahorrado)} /></>} icono={PiggyBank} />
            <Dato etiqueta="Compras" valor={<Contador valor={entregadas.length} />} sub={`${resumen.piezas} piezas`} icono={Receipt} />
          </div>
        </section>

        {/* Pendientes de calificar */}
        {porCalificar.length > 0 && (
          <section className="tarjeta flex flex-wrap items-center gap-4 p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-miel/15 text-2xl">⭐</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-cacao">¿Qué tal estuvo {porCalificar[0].item.nombre}?</p>
              <p className="text-sm text-textoSecundario">Tienes {porCalificar.length} producto{porCalificar.length === 1 ? '' : 's'} por calificar. Tu opinión ayuda a otros clientes.</p>
            </div>
            <button onClick={() => setCalificando(porCalificar[0])} className="btn-primario h-11">Calificar</button>
          </section>
        )}

        {/* Lo que más compras */}
        {resumen.masComprados.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-textoSecundario">Lo que más compras</h2>
            <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
              {resumen.masComprados.map((c) => {
                const img = c.vivo && obtenerImagen(c.vivo)
                const disponible = c.vivo && c.vivo.stock > 0
                return (
                  <div key={c.id || c.nombre} className="tarjeta group w-40 shrink-0 overflow-hidden sm:w-auto">
                    <button onClick={() => c.vivo && navigate(`/catalogo/${c.id}`)} className="block h-28 w-full overflow-hidden bg-pergamino">
                      {img ? <img src={img} alt={c.nombre} className={`h-full w-full object-cover transition duration-500 group-hover:scale-110 ${disponible ? '' : 'grayscale'}`} /> : <span className="flex h-full items-center justify-center font-display text-3xl text-cacao/30">{c.nombre?.[0]}</span>}
                    </button>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium text-cacao">{c.nombre}</p>
                      <p className="text-xs text-textoSecundario">{c.piezas} pza{c.piezas === 1 ? '' : 's'} compradas</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-vino">{c.vivo ? dinero(precioUnitario(c.vivo)) : '—'}</span>
                        <button onClick={() => agregarUno(c.vivo)} disabled={!disponible} aria-label={`Agregar ${c.nombre}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-vino/10 text-vino transition hover:bg-vino hover:text-white disabled:opacity-30">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Filtros + búsqueda */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {FILTROS.map((f) => {
                const n = f.id === 'todas' ? compras.length : compras.filter((p) => p.status === f.id).length
                return (
                  <button key={f.id} onClick={() => setFiltro(f.id)} className={`${filtro === f.id ? 'chip-activo' : 'chip-inactivo'} h-10`}>
                    {f.label} <span className={`ml-1 rounded-full px-1.5 text-xs ${filtro === f.id ? 'bg-white/20' : 'bg-pergamino'}`}>{n}</span>
                  </button>
                )
              })}
            </div>
            <div className="relative sm:w-72">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textoSecundario" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar folio o producto…" className="campo h-11 pl-10 pr-10" />
              {busqueda && <button onClick={() => setBusqueda('')} aria-label="Limpiar" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino"><X size={16} /></button>}
            </div>
          </div>

          {cargando ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="tarjeta h-20 animate-pulse" />)}</div>
          ) : compras.length === 0 ? (
            <div className="tarjeta flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-cacao/40"><Receipt size={30} /></span>
              <p className="font-display text-xl text-cacao">Aún no tienes compras</p>
              <p className="max-w-sm text-sm text-textoSecundario">Cuando recibas tu primer pedido aparecerá aquí con su ticket.</p>
              <button onClick={() => navigate('/catalogo')} className="btn-primario mt-1">Ir al catálogo</button>
            </div>
          ) : grupos.length === 0 ? (
            <p className="py-10 text-center text-sm text-textoSecundario">Sin resultados para tu búsqueda.</p>
          ) : (
            grupos.map(([mes, lista]) => (
              <div key={mes}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h3 className="font-display text-lg font-semibold capitalize text-cacao">{mes}</h3>
                  <span className="text-xs text-textoSecundario">{dinero(lista.filter((p) => p.status === 'entregado').reduce((s, p) => s + (Number(p.total) || 0), 0))}</span>
                </div>
                <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
                  {lista.map((p) => {
                    const abiertoAqui = abierto === p.id
                    const prods = p.productos || []
                    const fotos = prods.slice(0, 3).map((x) => productos.find((v) => v.id === x.productoId)).filter(Boolean)
                    return (
                      <li key={p.id}>
                        <button onClick={() => setAbierto(abiertoAqui ? null : p.id)} aria-expanded={abiertoAqui} className="flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-crema/70">
                          <span className="flex -space-x-3">
                            {fotos.length ? fotos.map((v) => <img key={v.id} src={obtenerImagen(v)} alt="" className={`h-10 w-10 rounded-full object-cover ring-2 ring-superficie ${p.status === 'cancelado' ? 'grayscale' : ''}`} />) : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pergamino text-cacao/50"><Receipt size={16} /></span>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-cacao">Pedido {folio(p.id)}</p>
                            <p className="truncate text-xs text-textoSecundario">{fechaRelativa(p.creado)} · {prods.map((x) => x.nombre).join(', ')}</p>
                          </div>
                          <div className="hidden text-right sm:block">
                            <p className={`text-sm font-semibold ${p.status === 'cancelado' ? 'text-textoSecundario line-through' : 'text-cacao'}`}>{dinero(p.total)}</p>
                          </div>
                          <EstadoPedido status={p.status} />
                          <ChevronDown size={16} className={`shrink-0 text-textoSecundario transition ${abiertoAqui ? 'rotate-180' : ''}`} />
                        </button>
                        {abiertoAqui && <Ticket p={p} onRepetir={() => repetir(p)} resenas={misResenas} onCalificar={(item) => setCalificando({ pedido: p, item })} />}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      </main>

      {aviso && (
        <div role="status" className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm animate-emerger items-center justify-between gap-3 rounded-2xl bg-tinta px-4 py-3 text-sm font-medium text-white shadow-elevada md:bottom-6">
          {aviso}
          <button onClick={abrirCarrito} className="shrink-0 font-semibold text-miel-claro underline">Ver carrito</button>
        </div>
      )}
      {calificando && (
        <Calificar
          {...calificando}
          previa={misResenas[idResena(calificando.pedido.id, calificando.item.productoId)]}
          onCerrar={() => setCalificando(null)}
          onGuardar={async (estrellas, comentario) => {
            await guardarResena({ pedidoId: calificando.pedido.id, productoId: calificando.item.productoId, productoNombre: calificando.item.nombre, usuario, estrellas, comentario })
            setCalificando(null)
            if (estrellas === 5) confeti({ cantidad: 80 })
            avisar('¡Gracias por tu reseña!')
          }}
        />
      )}
      <BottomNav />
    </div>
  )
}

function Calificar({ item, previa, onCerrar, onGuardar }) {
  const [estrellas, setEstrellas] = useState(previa?.estrellas || 0)
  const [comentario, setComentario] = useState(previa?.comentario || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const TEXTOS = ['', 'No me gustó', 'Regular', 'Bueno', 'Muy bueno', '¡Me encantó!']
  const guardar = async () => {
    if (!estrellas) return setError('Elige de 1 a 5 estrellas.')
    setGuardando(true)
    try {
      await onGuardar(estrellas, comentario)
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'Firestore no permite guardar reseñas todavía (revisa las reglas).' : 'No se pudo guardar tu reseña.')
      setGuardando(false)
    }
  }
  return (
    <Hoja titulo="Califica tu compra" subtitulo={item.nombre} onCerrar={onCerrar} bloqueado={guardando} pie={<button onClick={guardar} disabled={guardando} className="btn-primario h-12 w-full">{guardando ? 'Guardando…' : previa ? 'Actualizar reseña' : 'Publicar reseña'}</button>}>
      <div className="flex flex-col items-center gap-2 py-2">
        <Estrellas valor={estrellas} onCambiar={setEstrellas} tam={40} />
        <p className="h-6 font-display text-lg text-vino">{TEXTOS[estrellas]}</p>
      </div>
      <div>
        <label htmlFor="comentario" className="etiqueta">Cuéntanos más <span className="font-normal text-textoSecundario">(opcional)</span></label>
        <textarea id="comentario" rows={4} maxLength={400} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¿Qué te gustó? ¿Con qué lo acompañaste?" className="campo resize-none" />
        <p className="mt-1 text-right text-xs text-textoSecundario">{comentario.length}/400</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
    </Hoja>
  )
}

function Dato({ etiqueta, valor, sub, icono: Icono }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:p-4">
      <Icono size={18} className="text-miel-claro" />
      <p className="mt-2 font-display text-xl font-semibold text-white sm:text-3xl">{valor}</p>
      <p className="text-[11px] text-marfil/70 sm:text-xs">{etiqueta}{sub && <span className="hidden sm:inline"> · {sub}</span>}</p>
    </div>
  )
}

// Ticket estilo recibo
function Ticket({ p, onRepetir, resenas = {}, onCalificar }) {
  const domicilio = esDomicilio(p)
  const subtotal = Number(p.subtotal) || (p.productos || []).reduce((s, x) => s + (Number(x.precio) || 0) * (Number(x.cantidad) || 1), 0)
  const ahorro = ahorroDe(p)
  return (
    <div className="animate-aparecer border-t border-borde/60 bg-crema/60 px-4 py-5">
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-borde bg-superficie p-5 shadow-tarjeta">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-cacao">Quesería de mi sin ti</p>
          <p className="text-xs text-textoSecundario">Folio {folio(p.id)} · {fechaRelativa(p.creado)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-textoSecundario">
            {domicilio ? <><Truck size={12} /> Entrega a domicilio</> : <><Store size={12} /> Recogido en tienda</>}
          </p>
        </div>
        <ul className="mt-4 space-y-1.5 border-t border-dashed border-borde pt-3 text-sm">
          {(p.productos || []).map((x, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-x-3">
              <span className="text-textoSecundario"><b className="text-cacao">{x.cantidad}×</b> {x.nombre}</span>
              <span className="tabular-nums text-cacao">{dinero((Number(x.precio) || 0) * (Number(x.cantidad) || 1))}</span>
              {p.status === 'entregado' && x.productoId && (
                <span className="w-full">
                  {resenas[idResena(p.id, x.productoId)] ? (
                    <button onClick={() => onCalificar(x)} className="flex items-center gap-1 text-xs text-textoSecundario hover:text-vino"><Estrellas valor={resenas[idResena(p.id, x.productoId)].estrellas} tam={12} /> Editar</button>
                  ) : (
                    <button onClick={() => onCalificar(x)} className="text-xs font-semibold text-vino hover:underline">⭐ Calificar</button>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-dashed border-borde pt-3 text-sm">
          <p className="flex justify-between text-textoSecundario"><span>Subtotal</span><span className="tabular-nums">{dinero(subtotal)}</span></p>
          {Number(p.descuento) > 0 && <p className="flex justify-between text-exito"><span>Descuento</span><span className="tabular-nums">-{dinero(p.descuento)}</span></p>}
          {domicilio && <p className="flex justify-between text-textoSecundario"><span>Envío</span><span>{Number(p.envio) ? dinero(p.envio) : 'Gratis'}</span></p>}
          <p className="flex justify-between pt-1 font-display text-lg font-semibold text-cacao"><span>Total</span><span className="tabular-nums text-vino">{dinero(p.total)}</span></p>
          {ahorro > 0 && p.status === 'entregado' && <p className="text-right text-xs font-medium text-exito">Ahorraste {dinero(ahorro)}</p>}
        </div>
        {p.status === 'cancelado' && <p className="mt-3 rounded-xl bg-error/10 px-3 py-2 text-center text-xs font-medium text-error">Pedido cancelado · no se cobró</p>}
      </div>
      <button onClick={onRepetir} className="btn-primario mx-auto mt-4 flex h-11 w-full max-w-md"><RotateCcw size={16} /> Volver a pedir</button>
    </div>
  )
}
