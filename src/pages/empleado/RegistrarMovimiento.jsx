// RegistrarMovimiento.jsx — Entrada o salida de inventario (con lotes reales)
// Acepta en location.state: { productoId, tipo: 'entrada'|'salida', loteId, nuevoLote: true, motivo }
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import {
  ArrowDownToLine, ArrowUpFromLine, Search, X, Minus, Plus, CheckCircle2, AlertTriangle, ArrowRight, Layers,
} from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero } from '../../utils/formato'
import { stockDe, minDe, diasPara, fechaCorta } from '../../utils/stock'
import { registrarMovimiento, escucharLotes, siguienteNumeroLote, MOTIVOS_SALIDA } from '../../services/inventario'

const RAPIDAS = [1, 5, 10, 12, 24]

export default function RegistrarMovimiento() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { usuario } = useAuth()
  const esAdmin = usuario?.role === 'admin'
  const rutaInventario = esAdmin ? '/admin/inventario' : '/empleado/inventario'

  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [tipo, setTipo] = useState(state?.tipo === 'salida' ? 'salida' : 'entrada')
  const [productoId, setProductoId] = useState(state?.productoId || '')
  const [cantidad, setCantidad] = useState(1)
  const [precioEditado, setPrecioEditado] = useState(null) // null = usar el precio actual del producto
  const [motivo, setMotivo] = useState(state?.motivo || '')
  const [observaciones, setObservaciones] = useState('')

  // Lotes — se guardan junto con el producto al que pertenecen para no mezclar
  const [lotesEstado, setLotesEstado] = useState({ productoId: '', items: [] })
  const [modoElegido, setModoElegido] = useState(state?.nuevoLote ? 'nuevo' : state?.loteId ? 'existente' : 'auto')
  const [loteElegido, setLoteElegido] = useState(state?.loteId || '')
  const [numeroEditado, setNumeroEditado] = useState(null)
  const [caducidad, setCaducidad] = useState('')

  const [buscando, setBuscando] = useState(!state?.productoId)
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const buscadorRef = useRef(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'productos'),
      (snap) => {
        setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
        setCargando(false)
      },
      () => {
        setError('No se pudieron cargar los productos.')
        setCargando(false)
      },
    )
  }, [])

  useEffect(
    () =>
      escucharLotes(
        productoId,
        (items) => setLotesEstado({ productoId, items }),
        () => setLotesEstado({ productoId, items: [] }),
      ),
    [productoId],
  )

  const producto = productos.find((p) => p.id === productoId) || null
  const precio = precioEditado ?? String(producto?.precio ?? '')
  const lotes = useMemo(() => (lotesEstado.productoId === productoId ? lotesEstado.items : []), [lotesEstado, productoId])
  const numeroLote = numeroEditado ?? siguienteNumeroLote(lotes)

  // Lotes con existencia, el que caduca primero arriba (PEPS)
  const lotesConStock = useMemo(
    () =>
      lotes
        .filter((l) => (Number(l.cantActual) || 0) > 0)
        .sort((a, b) => (a.caducidad || '9999').localeCompare(b.caducidad || '9999')),
    [lotes],
  )

  // Modo de lote efectivo: en salida se sugiere el lote que caduca primero
  const listaLote = tipo === 'entrada' ? lotes : lotesConStock
  let modoLote = modoElegido
  if (tipo === 'salida' && (modoLote === 'nuevo' || modoLote === 'auto')) modoLote = lotesConStock.length ? 'existente' : 'ninguno'
  if (modoLote === 'auto') modoLote = 'ninguno'
  if (modoLote === 'existente' && !listaLote.length) modoLote = 'ninguno'
  const loteId = listaLote.some((l) => l.id === loteElegido) ? loteElegido : listaLote[0]?.id || ''

  const filtrados = productos.filter((p) => (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()))
  const loteSel = lotes.find((l) => l.id === loteId)
  const stock = stockDe(producto)
  const despues = tipo === 'entrada' ? stock + cantidad : stock - cantidad
  const excede = tipo === 'salida' && (cantidad > stock || (modoLote === 'existente' && loteSel && cantidad > (Number(loteSel.cantActual) || 0)))
  const bajoMin = producto && despues <= minDe(producto)
  const puedeGuardar = producto && cantidad > 0 && !excede && !guardando && (modoLote !== 'existente' || loteId) && (modoLote !== 'nuevo' || numeroLote.trim())

  const elegir = (p) => {
    setProductoId(p.id)
    setBuscando(false)
    setBusqueda('')
    setLoteElegido('')
    setNumeroEditado(null)
    setPrecioEditado(null)
    setModoElegido('auto')
    setError('')
  }

  const guardar = async () => {
    setError('')
    setGuardando(true)
    try {
      const lote =
        modoLote === 'nuevo'
          ? { modo: 'nuevo', numero: numeroLote.trim(), caducidad: caducidad || null }
          : modoLote === 'existente' && loteId
          ? { modo: 'existente', id: loteId }
          : null
      const r = await registrarMovimiento({
        tipo,
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad,
        precio,
        motivo,
        observaciones,
        lote,
        responsable: usuario?.nombre || 'Empleado/a',
      })
      setResultado({ ...r, tipo, cantidad, nombre: producto.nombre })
    } catch (err) {
      console.error(err)
      setError(err.code === 'permission-denied' ? 'No tienes permiso para esta operación.' : err.message || 'No se pudo registrar el movimiento.')
    } finally {
      setGuardando(false)
    }
  }

  const reiniciar = () => {
    setResultado(null)
    setCantidad(1)
    setObservaciones('')
    setMotivo('')
    setNumeroEditado(null)
    setCaducidad('')
    setLoteElegido('')
    setModoElegido('auto')
  }

  // ── Éxito ──
  if (resultado) {
    const entrada = resultado.tipo === 'entrada'
    return (
      <div className="min-h-screen bg-crema pb-28">
        <EncabezadoStaff titulo="Movimiento registrado" atras={rutaInventario} />
        <div className="mx-auto max-w-lg px-4 pt-10 text-center">
          <span className="mx-auto flex h-20 w-20 animate-aparecer items-center justify-center rounded-full bg-exito/10 text-exito">
            <CheckCircle2 size={40} />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold text-cacao">{entrada ? 'Entrada registrada' : 'Salida registrada'}</h2>
          <p className="mt-1 text-sm text-textoSecundario">{resultado.nombre}{resultado.loteNumero && ` · ${resultado.loteNumero}`}</p>

          <div className="tarjeta mt-8 p-6">
            <div className="flex items-center justify-center gap-4 font-display">
              <span className="text-3xl text-textoSecundario">{resultado.stockAntes}</span>
              <ArrowRight className="text-textoSecundario" />
              <span className="text-5xl font-semibold text-cacao">{resultado.stockDespues}</span>
            </div>
            <p className={`mt-2 text-sm font-semibold ${entrada ? 'text-exito' : 'text-error'}`}>
              {entrada ? '+' : '−'}{resultado.cantidad} pzas
            </p>
            {resultado.precioAntes !== resultado.precioDespues && (
              <p className="mt-3 text-sm text-textoSecundario">
                Precio: {dinero(resultado.precioAntes)} → <b className="text-cacao">{dinero(resultado.precioDespues)}</b>
              </p>
            )}
          </div>

          <div className="mt-6 grid gap-3">
            <button onClick={reiniciar} className="btn-primario h-14 text-base">Registrar otro</button>
            <button onClick={() => navigate(rutaInventario)} className="btn-secundario h-12">Volver al inventario</button>
          </div>
        </div>
        <BottomNavEmpleado />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema pb-48">
      <EncabezadoStaff titulo="Registrar movimiento" subtitulo="Entrada o salida de mercancía" atras={rutaInventario} />

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-pergamino p-1.5" role="tablist">
          {[
            { id: 'entrada', label: 'Entrada', icono: ArrowDownToLine, on: 'bg-exito text-white' },
            { id: 'salida', label: 'Salida', icono: ArrowUpFromLine, on: 'bg-error text-white' },
          ].map(({ id, label, icono: Icono, on }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tipo === id}
              onClick={() => { setTipo(id); setError('') }}
              className={`flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${tipo === id ? `${on} shadow-tarjeta` : 'text-textoSecundario hover:text-cacao'}`}
            >
              <Icono size={18} /> {label}
            </button>
          ))}
        </div>

        {/* Producto */}
        <section>
          <p className="etiqueta">Producto</p>
          {producto && !buscando ? (
            <div className="tarjeta flex items-center gap-3 p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-pergamino">
                {obtenerImagen(producto) && <img src={obtenerImagen(producto)} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-cacao">{producto.nombre}</p>
                <p className="text-xs text-textoSecundario">
                  Stock: <b className={stock === 0 ? 'text-error' : 'text-cacao'}>{stock} pzas</b> · mín {minDe(producto)}
                </p>
              </div>
              <button onClick={() => setBuscando(true)} className="btn-fantasma h-10 px-3 text-vino">Cambiar</button>
            </div>
          ) : (
            <div ref={buscadorRef} className="tarjeta overflow-hidden">
              <div className="relative border-b border-borde/60">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario" />
                <input
                  autoFocus
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto…"
                  className="h-12 w-full bg-transparent pl-11 pr-11 text-sm outline-none"
                />
                {producto && (
                  <button onClick={() => setBuscando(false)} aria-label="Cerrar búsqueda" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
                    <X size={18} />
                  </button>
                )}
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {cargando ? (
                  <li className="p-4 text-sm text-textoSecundario">Cargando productos…</li>
                ) : filtrados.length === 0 ? (
                  <li className="p-4 text-sm text-textoSecundario">Sin coincidencias.</li>
                ) : (
                  filtrados.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => elegir(p)} className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-crema">
                        <span className="truncate text-cacao">{p.nombre}</span>
                        <span className={`shrink-0 text-xs ${stockDe(p) === 0 ? 'text-error' : 'text-textoSecundario'}`}>{stockDe(p)} pzas</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </section>

        {producto && (
          <>
            {/* Cantidad */}
            <section>
              <p className="etiqueta">{tipo === 'entrada' ? 'Cantidad que entra' : 'Cantidad que sale'}</p>
              <div className="tarjeta p-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Restar uno" className="flex h-14 w-14 items-center justify-center rounded-xl bg-pergamino text-cacao hover:bg-borde">
                    <Minus size={20} />
                  </button>
                  <input
                    inputMode="numeric"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value.replace(/\D/g, '') || '0', 10)))}
                    onBlur={() => cantidad < 1 && setCantidad(1)}
                    aria-label="Cantidad"
                    className="h-14 min-w-0 flex-1 rounded-xl text-center font-display text-3xl font-semibold text-cacao outline-none focus:bg-crema"
                  />
                  <button onClick={() => setCantidad((c) => c + 1)} aria-label="Sumar uno" className="flex h-14 w-14 items-center justify-center rounded-xl bg-pergamino text-cacao hover:bg-borde">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  {RAPIDAS.map((n) => (
                    <button key={n} onClick={() => setCantidad(n)} className={`h-9 flex-1 rounded-lg text-xs font-semibold transition ${cantidad === n ? 'bg-tinta text-white' : 'bg-crema text-textoSecundario hover:bg-pergamino'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Lote */}
            <section>
              <p className="etiqueta flex items-center gap-1.5"><Layers size={15} className="text-oliva" /> Lote <span className="font-normal text-textoSecundario">(opcional)</span></p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ninguno', label: 'Sin lote', ver: true },
                  { id: 'nuevo', label: 'Lote nuevo', ver: tipo === 'entrada' },
                  { id: 'existente', label: tipo === 'entrada' ? 'Agregar a lote' : 'Sacar de lote', ver: (tipo === 'entrada' ? lotes : lotesConStock).length > 0 },
                ]
                  .filter((o) => o.ver)
                  .map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setModoElegido(o.id)
                        if (o.id === 'existente') setLoteElegido(loteId)
                      }}
                      className={`${modoLote === o.id ? 'chip-activo' : 'chip-inactivo'} h-10`}
                    >
                      {o.label}
                    </button>
                  ))}
              </div>

              {modoLote === 'nuevo' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-textoSecundario" htmlFor="numero-lote">Número</label>
                    <input id="numero-lote" value={numeroLote} onChange={(e) => setNumeroEditado(e.target.value)} className="campo h-12" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-textoSecundario" htmlFor="caducidad">Caducidad</label>
                    <input id="caducidad" type="date" value={caducidad} onChange={(e) => setCaducidad(e.target.value)} className="campo h-12" />
                  </div>
                </div>
              )}

              {modoLote === 'existente' && (
                <ul className="tarjeta mt-3 divide-y divide-borde/60 overflow-hidden">
                  {(tipo === 'entrada' ? lotes : lotesConStock).map((l) => {
                    const d = diasPara(l.caducidad)
                    return (
                      <li key={l.id}>
                        <label className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-2 hover:bg-crema">
                          <input type="radio" name="lote" checked={loteId === l.id} onChange={() => setLoteElegido(l.id)} className="h-4 w-4 accent-vino" />
                          <span className="flex-1 text-sm">
                            <b className="text-cacao">{l.numero}</b>
                            <span className="block text-xs text-textoSecundario">
                              {Number(l.cantActual) || 0} pzas{l.caducidad && ` · caduca ${fechaCorta(l.caducidad)}`}
                            </span>
                          </span>
                          {d !== null && d <= 7 && (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${d < 0 ? 'bg-error/10 text-error' : 'bg-miel/10 text-miel'}`}>
                              {d < 0 ? 'Vencido' : 'Pronto'}
                            </span>
                          )}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* Motivo (salida) */}
            {tipo === 'salida' && (
              <section>
                <p className="etiqueta">Motivo</p>
                <div className="flex flex-wrap gap-2">
                  {MOTIVOS_SALIDA.map((m) => (
                    <button key={m} onClick={() => setMotivo(m)} className={`${motivo === m ? 'chip-activo' : 'chip-inactivo'} h-10`}>{m}</button>
                  ))}
                </div>
              </section>
            )}

            {/* Precio */}
            <section>
              <label className="etiqueta" htmlFor="precio">Precio de venta</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-textoSecundario">$</span>
                <input
                  id="precio"
                  inputMode="decimal"
                  value={precio}
                  onChange={(e) => setPrecioEditado(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="campo h-12 pl-8"
                />
              </div>
              <p className="mt-1 text-xs text-textoSecundario">Actual: {dinero(producto.precio)} · cámbialo solo si subió o bajó</p>
            </section>

            {/* Observaciones */}
            <section>
              <label className="etiqueta" htmlFor="obs">Observaciones <span className="font-normal text-textoSecundario">(opcional)</span></label>
              <textarea id="obs" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder={tipo === 'entrada' ? 'Proveedor, factura…' : 'Detalle de la salida…'} className="campo resize-none" />
            </section>

            {error && (
              <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>
            )}
          </>
        )}
      </div>

      {/* Barra inferior con vista previa */}
      {producto && (
        <div className="fijo-inferior fixed inset-x-0 bottom-16 z-30 border-t border-borde bg-superficie/95 backdrop-blur">
          <div className="mx-auto max-w-lg px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-textoSecundario">Stock resultante</span>
              <span className={`flex items-center gap-1.5 font-semibold ${excede ? 'text-error' : bajoMin ? 'text-miel' : 'text-cacao'}`}>
                {(excede || bajoMin) && <AlertTriangle size={14} />}
                {stock} → {excede ? 'insuficiente' : `${despues} pzas`}
                {!excede && bajoMin && <span className="font-normal">· bajo mínimo</span>}
              </span>
            </div>
            <button onClick={guardar} disabled={!puedeGuardar} className={`btn h-14 w-full text-base text-white ${tipo === 'entrada' ? 'bg-exito hover:bg-exito/90' : 'bg-error hover:bg-error/90'}`}>
              {guardando ? 'Guardando…' : `Guardar ${tipo} (${tipo === 'entrada' ? '+' : '−'}${cantidad})`}
            </button>
          </div>
        </div>
      )}

      <BottomNavEmpleado />
    </div>
  )
}
