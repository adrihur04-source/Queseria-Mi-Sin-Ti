// Carrito.jsx — Carrito y confirmación de pedido
// Precios y stock se toman EN VIVO del catálogo (no del momento en que se agregó).
// El precio cobrado incluye el descuento de promoción del producto.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, serverTimestamp, doc, runTransaction, updateDoc, getDoc, increment, arrayUnion } from 'firebase/firestore'
import { Minus, Plus, Trash2, ShoppingBag, Store, Tag, CheckCircle2, AlertTriangle, ArrowRight, Truck, MapPin, Clock, Ticket, X, Coins, Crown, Home } from 'lucide-react'
import { useClub } from '../../hooks/useClub'
import { VALOR_PUNTO, MAX_CANJE_PORCENTAJE, MIN_CANJE, DESCUENTO_REFERIDO, TOPE_REFERIDO, PUNTOS_POR_PESO, envioGratisPorNivel } from '../../utils/puntos'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../context/CarritoContext'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import BottomNav from '../../components/layout/BottomNav'
import Confirmacion from '../../components/staff/Confirmacion'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero, folio } from '../../utils/formato'
import { precioUnitario, tienePromo } from '../../utils/precio'
import { confeti } from '../../utils/efectos'
import { useConfigTienda, calcularEnvio } from '../../hooks/useConfigTienda'

export default function Carrito() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { carrito, cambiarCantidad, quitarDelCarrito, limpiarCarrito } = useCarrito()
  const { productos, cargando } = useProductosTienda()

  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [pedido, setPedido] = useState(null) // pedido confirmado
  const config = useConfigTienda()
  const [entrega, setEntrega] = useState('tienda') // 'tienda' | 'domicilio'
  // Direcciones guardadas (usuarios/{uid}.direcciones) + la antigua direccionEntrega como respaldo
  const direcciones = useMemo(() => {
    if (Array.isArray(usuario?.direcciones) && usuario.direcciones.length) return usuario.direcciones
    return usuario?.direccionEntrega?.calle ? [{ id: 'principal', alias: 'Casa', ...usuario.direccionEntrega }] : []
  }, [usuario])
  const [seleccion, setSeleccion] = useState(null) // id de dirección guardada | 'nueva'
  const [dirNueva, setDirNueva] = useState({ alias: '', calle: '', colonia: '', referencias: '', telefono: usuario?.telefono || '' })
  const idSel = seleccion ?? (direcciones[0]?.id || 'nueva')
  const dir = idSel === 'nueva' ? dirNueva : direcciones.find((d) => d.id === idSel) || dirNueva
  const [guardarDir, setGuardarDir] = useState(true)
  const [errorDir, setErrorDir] = useState('')

  // Club Quesero: cupón de amigo y puntos
  const club = useClub()
  const [cuponTexto, setCuponTexto] = useState(() => localStorage.getItem('queseria-ref') || '')
  const [cupon, setCupon] = useState(null) // { codigo, referidorId, nombre }
  const [cuponError, setCuponError] = useState('')
  const [validando, setValidando] = useState(false)
  const [usarPuntos, setUsarPuntos] = useState(false)

  // Combina cada línea del carrito con los datos vivos del producto
  const lineas = useMemo(
    () =>
      carrito.map((item) => {
        const vivo = productos.find((p) => p.id === item.id)
        const p = vivo || item
        const stock = vivo ? vivo.stock : 0
        const cantidad = Number(item.cantidad) || 1
        const unitario = precioUnitario(p)
        // Promo por volumen (opcional): promoCantidadMinima + promoDescuento
        const minVol = Number(p.promoCantidadMinima) || 0
        const descVol = Number(p.promoDescuento) || 0
        const aplicaVolumen = minVol > 0 && descVol > 0 && cantidad >= minVol
        const bruto = unitario * cantidad
        const descuentoVolumen = aplicaVolumen ? bruto * (descVol / 100) : 0
        return {
          ...p,
          cantidad,
          stock,
          disponible: !!vivo && stock > 0,
          excede: !!vivo && cantidad > stock,
          unitario,
          bruto,
          descuentoVolumen,
          aplicaVolumen,
          minVol,
          descVol,
          ahorroPromo: tienePromo(p) ? (Number(p.precio) - unitario) * cantidad : 0,
        }
      }),
    [carrito, productos],
  )

  const validas = lineas.filter((l) => l.disponible)
  const hayProblemas = lineas.some((l) => !l.disponible || l.excede)
  const piezas = validas.reduce((s, l) => s + l.cantidad, 0)
  const subtotal = validas.reduce((s, l) => s + l.bruto, 0)
  const descuento = validas.reduce((s, l) => s + l.descuentoVolumen, 0)
  const ahorroPromo = validas.reduce((s, l) => s + l.ahorroPromo, 0)
  const domicilio = entrega === 'domicilio' && config.envioActivo
  const base = subtotal - descuento
  const envioVip = envioGratisPorNivel(club.ganados)
  const envio = domicilio && !envioVip ? calcularEnvio(config, base) : 0
  const faltaGratis = domicilio && !envioVip && Number(config.envioGratisDesde) > 0 ? Math.max(0, Number(config.envioGratisDesde) - base) : 0
  const descCupon = cupon ? Math.min(TOPE_REFERIDO, Math.round(base * DESCUENTO_REFERIDO * 100) / 100) : 0
  const puedeCanjear = club.disponibles >= MIN_CANJE
  const puntosUsados = usarPuntos && puedeCanjear ? Math.floor(Math.min(club.disponibles * VALOR_PUNTO, (base - descCupon) * MAX_CANJE_PORCENTAJE) / VALOR_PUNTO) : 0
  const descPuntos = Math.round(puntosUsados * VALOR_PUNTO * 100) / 100
  const total = Math.max(0, Math.round((base - descCupon - descPuntos + envio) * 100) / 100)

  const aplicarCupon = async () => {
    const codigo = cuponTexto.trim().toUpperCase()
    setCuponError('')
    if (!codigo) return
    if (codigo === club.codigo) return setCuponError('Ese es tu propio código: compártelo con tus amigos 😉')
    if (!club.primeraCompra) return setCuponError('Los códigos de amigo son solo para la primera compra.')
    setValidando(true)
    try {
      const snap = await getDoc(doc(db, 'codigos', codigo))
      if (!snap.exists() || snap.data().uid === usuario?.uid) setCuponError('Código no válido. Revisa que esté bien escrito.')
      else {
        setCupon({ codigo, referidorId: snap.data().uid, nombre: snap.data().nombre || '' })
        confeti({ cantidad: 50 })
      }
    } catch {
      setCuponError('No se pudo validar el código. Intenta de nuevo.')
    } finally {
      setValidando(false)
    }
  }
  const quitarCupon = () => {
    setCupon(null)
    setCuponTexto('')
    localStorage.removeItem('queseria-ref')
  }

  // Antes de abrir la confirmación, valida la dirección si es a domicilio
  const pedirConfirmacion = () => {
    setErrorDir('')
    if (domicilio) {
      if (dir.calle.trim().length < 5) return setErrorDir('Escribe calle y número para poder llevar tu pedido.')
      if (!dir.colonia.trim()) return setErrorDir('Indica tu colonia.')
      if (!/^[\d\s+()-]{8,}$/.test(dir.telefono)) return setErrorDir('Necesitamos un teléfono para avisarte cuando llegue (mínimo 8 dígitos).')
    }
    setConfirmando(true)
  }

  const confirmar = async () => {
    if (!usuario?.uid) return navigate('/login')
    setGuardando(true)
    setError('')
    try {
      const pedidoRef = doc(collection(db, 'pedidos'))
      const refReferido = doc(db, 'referidos', usuario.uid)
      await runTransaction(db, async (tx) => {
        const refs = validas.map((l) => doc(db, 'productos', l.id))
        const snaps = await Promise.all(refs.map((r) => tx.get(r)))
        if (cupon && (await tx.get(refReferido)).exists()) throw new Error('Ya usaste un código de amigo antes.')
        snaps.forEach((s, i) => {
          const disponible = Number(s.data()?.stock) || 0
          if (!s.exists() || validas[i].cantidad > disponible) throw new Error(`Ya no hay suficientes piezas de "${validas[i].nombre}". Ajusta la cantidad.`)
        })
        snaps.forEach((s, i) => {
          const nuevo = (Number(s.data().stock) || 0) - validas[i].cantidad
          tx.update(refs[i], nuevo === 0 ? { stock: 0, agotadoEn: serverTimestamp() } : { stock: nuevo })
          if (nuevo === 0) {
            tx.set(doc(collection(db, 'notificaciones')), {
              tipo: 'sin_stock',
              productoId: validas[i].id,
              producto: validas[i].nombre,
              mensaje: `${validas[i].nombre} se agotó`,
              leida: false,
              creado: serverTimestamp(),
              imagen: validas[i].imagen || null,
              imagenUrl: validas[i].imagenUrl || null,
            })
          }
        })
        tx.set(pedidoRef, {
          clienteId: usuario.uid,
          clienteNombre: usuario.nombre || usuario.email || 'Cliente',
          clienteTelefono: usuario.telefono || '',
          productos: validas.map((l) => ({
            productoId: l.id,
            nombre: l.nombre,
            cantidad: l.cantidad,
            precio: l.unitario,
            precioOriginal: Number(l.precio) || 0,
          })),
          subtotal,
          descuento,
          envio,
          ...(cupon && { cupon: { codigo: cupon.codigo, referidorId: cupon.referidorId, descuento: descCupon } }),
          ...(puntosUsados > 0 && { puntosUsados, descuentoPuntos: descPuntos }),
          total,
          entrega: domicilio ? 'domicilio' : 'tienda',
          ...(domicilio && {
            direccionEntrega: { calle: dir.calle.trim(), colonia: dir.colonia.trim(), referencias: dir.referencias.trim(), telefono: dir.telefono.trim() },
          }),
          status: 'pendiente',
          creado: serverTimestamp(),
        })
        if (puntosUsados > 0) tx.set(doc(db, 'usuarios', usuario.uid), { puntosCanjeados: increment(puntosUsados) }, { merge: true })
        if (cupon) {
          tx.set(refReferido, { referidorId: cupon.referidorId, amigoId: usuario.uid, amigoNombre: usuario.nombre || 'Amigo', codigo: cupon.codigo, pedidoId: pedidoRef.id, creado: serverTimestamp() })
        }
      })
      if (domicilio && idSel === 'nueva' && guardarDir) {
        const limpia = { id: `d${direcciones.length + 1}-${dir.calle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12)}`, alias: dir.alias?.trim() || (direcciones.length ? 'Otra' : 'Casa'), calle: dir.calle.trim(), colonia: dir.colonia.trim(), referencias: dir.referencias.trim(), telefono: dir.telefono.trim() }
        const actuales = Array.isArray(usuario?.direcciones) ? [] : direcciones // migra la dirección antigua
        updateDoc(doc(db, 'usuarios', usuario.uid), { direcciones: arrayUnion(...actuales, limpia), direccionEntrega: limpia }).catch(() => {})
      }
      if (cupon) localStorage.removeItem('queseria-ref')
      setPedido({ id: pedidoRef.id, lineas: validas, total, envio, domicilio, ahorro: ahorroPromo + descuento + descCupon + descPuntos, puntos: Math.floor(total * PUNTOS_POR_PESO) })
      limpiarCarrito()
      setConfirmando(false)
      confeti()
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo registrar tu pedido. Intenta de nuevo.')
      setConfirmando(false)
    } finally {
      setGuardando(false)
    }
  }

  // ── Pedido confirmado ──
  if (pedido) {
    return (
      <div className="min-h-screen bg-crema pb-24">
        <EncabezadoTienda />
        <main className="mx-auto max-w-lg px-4 pt-10 text-center">
          <span className="mx-auto flex h-20 w-20 animate-aparecer items-center justify-center rounded-full bg-exito/10 text-exito"><CheckCircle2 size={40} /></span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-cacao">¡Pedido apartado!</h1>
          <p className="mt-2 text-textoSecundario">Folio <b className="text-cacao">{folio(pedido.id)}</b>. {pedido.domicilio ? 'Te avisaremos cuando vaya en camino.' : 'Te avisaremos cuando esté listo para recoger.'}</p>

          <div className="tarjeta mt-8 p-5 text-left">
            <ul className="space-y-2 text-sm">
              {pedido.lineas.map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span className="text-textoSecundario"><b className="text-cacao">{l.cantidad}×</b> {l.nombre}</span>
                  <span className="text-cacao">{dinero(l.bruto - l.descuentoVolumen)}</span>
                </li>
              ))}
              {pedido.domicilio && (
                <li className="flex justify-between gap-3"><span className="text-textoSecundario">Envío a domicilio</span><span className="text-cacao">{pedido.envio ? dinero(pedido.envio) : 'Gratis'}</span></li>
              )}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-borde pt-4">
              <span className="font-semibold text-cacao">{pedido.domicilio ? 'Total a pagar al recibir' : 'Total a pagar en tienda'}</span>
              <span className="font-display text-2xl font-semibold text-vino">{dinero(pedido.total)}</span>
            </div>
            {pedido.ahorro > 0 && <p className="mt-1 text-right text-xs font-medium text-exito">Ahorraste {dinero(pedido.ahorro)}</p>}
          </div>

          {pedido.puntos > 0 && (
            <button onClick={() => navigate('/recompensas')} className="mt-4 flex w-full animate-emerger items-center gap-3 rounded-2xl bg-gradient-to-r from-miel/20 to-vino/10 px-4 py-3 text-left">
              <Coins size={22} className="text-miel" />
              <span className="flex-1 text-sm text-cacao">Ganarás <b>{pedido.puntos} puntos</b> del Club Quesero cuando recibas tu pedido</span>
              <ArrowRight size={16} className="text-vino" />
            </button>
          )}

          <p className="mt-6 flex items-center gap-2 rounded-xl bg-pergamino px-4 py-3 text-left text-sm text-textoSecundario">
            {pedido.domicilio ? <Truck size={18} className="shrink-0 text-oliva" /> : <Store size={18} className="shrink-0 text-oliva" />}
            {pedido.domicilio ? `Lo llevamos a tu puerta en ${config.envioTiempo}. Pagas en efectivo o tarjeta al recibir.` : 'Pasa a la tienda con tu folio, paga en caja y llévate tus productos.'}
          </p>

          <div className="mt-6 grid gap-3">
            <button onClick={() => navigate('/historial')} className="btn-primario h-12">Seguir mi pedido</button>
            <button onClick={() => navigate('/catalogo')} className="btn-secundario h-12">Seguir comprando</button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  // ── Carrito vacío ──
  if (carrito.length === 0) {
    return (
      <div className="min-h-screen bg-crema pb-24">
        <EncabezadoTienda titulo="Carrito" />
        <main className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-pergamino text-cacao/40"><ShoppingBag size={36} /></span>
          <h1 className="font-display text-2xl font-semibold text-cacao">Tu carrito está vacío</h1>
          <p className="max-w-sm text-sm text-textoSecundario">Agrega productos desde el catálogo para apartar tu pedido.</p>
          <button onClick={() => navigate('/catalogo')} className="btn-primario mt-2 h-12 px-6">Ir al catálogo <ArrowRight size={16} /></button>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema pb-48 md:pb-12">
      <EncabezadoTienda titulo="Carrito" />

      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <h1 className="titulo-seccion mb-5 hidden md:block">Tu carrito</h1>

        <div className="grid gap-6 md:grid-cols-[1fr_340px]">
          <section className="space-y-3">
            {hayProblemas && !cargando && (
              <p className="flex items-center gap-2 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
                <AlertTriangle size={16} /> Algunos productos cambiaron de disponibilidad. Revísalos antes de continuar.
              </p>
            )}
            <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
              {lineas.map((l) => {
                const img = obtenerImagen(l)
                return (
                  <li key={l.id} className={`flex gap-3 p-4 ${!l.disponible ? 'bg-pergamino/40' : ''}`}>
                    <button onClick={() => navigate(`/catalogo/${l.id}`)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-pergamino">
                      {img && <img src={img} alt="" className={`h-full w-full object-cover ${!l.disponible ? 'grayscale' : ''}`} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-cacao">{l.nombre}</p>
                          <p className="text-sm text-textoSecundario">
                            {dinero(l.unitario)} c/u{tienePromo(l) && <span className="ml-1.5 text-xs text-textoSecundario line-through">{dinero(l.precio)}</span>}
                          </p>
                        </div>
                        <button onClick={() => quitarDelCarrito(l.id)} aria-label={`Quitar ${l.nombre}`} className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-textoSecundario hover:bg-error/10 hover:text-error">
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {!l.disponible ? (
                        <p className="mt-2 text-sm font-medium text-error">Ya no está disponible — quítalo para continuar</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center rounded-xl border border-borde bg-superficie">
                            <button onClick={() => cambiarCantidad(l.id, l.cantidad - 1)} disabled={l.cantidad <= 1} aria-label="Restar" className="flex h-10 w-10 items-center justify-center text-cacao disabled:opacity-30"><Minus size={16} /></button>
                            <span className="w-8 text-center font-semibold text-cacao">{l.cantidad}</span>
                            <button onClick={() => cambiarCantidad(l.id, l.cantidad + 1)} disabled={l.cantidad >= l.stock} aria-label="Sumar" className="flex h-10 w-10 items-center justify-center text-cacao disabled:opacity-30"><Plus size={16} /></button>
                          </div>
                          <span className="font-semibold text-cacao">{dinero(l.bruto - l.descuentoVolumen)}</span>
                          {l.excede && <p className="w-full text-xs font-medium text-error">Solo hay {l.stock} disponibles</p>}
                          {l.aplicaVolumen && <p className="w-full text-xs font-medium text-exito">-{l.descVol}% por llevar {l.minVol} o más</p>}
                          {!l.aplicaVolumen && l.minVol > 0 && l.descVol > 0 && <p className="w-full text-xs text-textoSecundario">Lleva {l.minVol} y obtén {l.descVol}% de descuento</p>}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            {config.envioActivo && (
              <EleccionEntrega
                entrega={entrega}
                setEntrega={setEntrega}
                config={config}
                dir={dir}
                setDir={setDirNueva}
                direcciones={direcciones}
                idSel={idSel}
                setSeleccion={setSeleccion}
                envioVip={envioVip}
                guardarDir={guardarDir}
                setGuardarDir={setGuardarDir}
                error={errorDir}
              />
            )}
            {lineas.some((l) => !l.disponible) && (
              <button onClick={() => lineas.filter((l) => !l.disponible).forEach((l) => quitarDelCarrito(l.id))} className="btn-secundario h-11 w-full text-error">
                Quitar productos no disponibles
              </button>
            )}
          </section>

          {/* Resumen */}
          <aside className="md:sticky md:top-24 md:self-start">
            <div className="tarjeta space-y-3 p-5">
              <h2 className="font-display text-lg font-semibold text-cacao">Resumen</h2>
              <div className="flex justify-between text-sm"><span className="text-textoSecundario">Subtotal ({piezas} pzas)</span><span className="text-cacao">{dinero(subtotal)}</span></div>
              {descuento > 0 && <div className="flex justify-between text-sm"><span className="flex items-center gap-1 text-exito"><Tag size={14} /> Descuento por volumen</span><span className="text-exito">-{dinero(descuento)}</span></div>}
              {descCupon > 0 && <div className="flex justify-between text-sm"><span className="flex items-center gap-1 text-exito"><Ticket size={14} /> Código de amigo</span><span className="text-exito">-{dinero(descCupon)}</span></div>}
              {descPuntos > 0 && <div className="flex justify-between text-sm"><span className="flex items-center gap-1 text-exito"><Coins size={14} /> {puntosUsados} puntos</span><span className="text-exito">-{dinero(descPuntos)}</span></div>}
              {domicilio && (
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-textoSecundario"><Truck size={14} /> Envío</span>
                  <span className={envio ? 'text-cacao' : 'flex items-center gap-1 font-semibold text-exito'}>{envio ? dinero(envio) : <>{envioVip && <Crown size={13} />} Gratis</>}</span>
                </div>
              )}
              {faltaGratis > 0 && (
                <div className="rounded-xl bg-miel/10 px-3 py-2.5 text-xs text-cacao">
                  Te faltan <b>{dinero(faltaGratis)}</b> para el envío gratis
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-pergamino">
                    <div className="h-full rounded-full bg-miel transition-all duration-500" style={{ width: `${Math.min(100, ((subtotal - descuento) / Number(config.envioGratisDesde)) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-borde/60 pt-3">
                <span className="font-semibold text-cacao">Total</span>
                <span className="font-display text-2xl font-semibold text-vino">{dinero(total)}</span>
              </div>
              {ahorroPromo + descuento + descCupon + descPuntos > 0 && <p className="text-right text-xs font-medium text-exito">Estás ahorrando {dinero(ahorroPromo + descuento + descCupon + descPuntos)}</p>}

              {/* Club Quesero: código de amigo + puntos */}
              <div className="space-y-2.5 border-t border-borde/60 pt-3">
                {cupon ? (
                  <div className="flex animate-emerger items-center gap-2 rounded-xl border border-exito/30 bg-exito/10 px-3 py-2.5 text-sm">
                    <Ticket size={16} className="text-exito" />
                    <span className="flex-1 text-cacao"><b>{cupon.codigo}</b> · {DESCUENTO_REFERIDO * 100}% de regalo{cupon.nombre && ` de ${cupon.nombre.split(' ')[0]}`}</span>
                    <button onClick={quitarCupon} aria-label="Quitar código" className="flex h-7 w-7 items-center justify-center rounded-lg text-textoSecundario hover:bg-superficie"><X size={14} /></button>
                  </div>
                ) : club.primeraCompra ? (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textoSecundario" />
                        <input value={cuponTexto} onChange={(e) => setCuponTexto(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && aplicarCupon()} placeholder="Código de amigo" className="campo h-10 pl-9 text-sm uppercase" />
                      </div>
                      <button onClick={aplicarCupon} disabled={validando || !cuponTexto.trim()} className="btn-secundario h-10 px-3 text-sm">{validando ? '…' : 'Aplicar'}</button>
                    </div>
                    {cuponError && <p className="mt-1.5 text-xs font-medium text-error">{cuponError}</p>}
                  </div>
                ) : null}
                {club.disponibles > 0 && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={usarPuntos}
                    disabled={!puedeCanjear}
                    onClick={() => setUsarPuntos((v) => !v)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${usarPuntos ? 'border-miel/50 bg-miel/10' : 'border-borde'} disabled:opacity-60`}
                  >
                    <Coins size={18} className="text-miel" />
                    <span className="flex-1 text-sm">
                      <b className="block text-cacao">Usar mis puntos</b>
                      <span className="text-xs text-textoSecundario">{puedeCanjear ? `Tienes ${club.disponibles} pts = ${dinero(club.disponibles * VALOR_PUNTO)}` : `Necesitas ${MIN_CANJE} pts (tienes ${club.disponibles})`}</span>
                    </span>
                    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${usarPuntos ? 'bg-miel' : 'bg-borde'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-superficie shadow transition-all ${usarPuntos ? 'left-[22px]' : 'left-0.5'}`} />
                    </span>
                  </button>
                )}
                <p className="text-center text-xs text-textoSecundario">Ganarás <b className="text-miel">{Math.floor(total * PUNTOS_POR_PESO)} puntos</b> al recibir este pedido · <button onClick={() => navigate('/recompensas')} className="font-semibold text-vino hover:underline">Club Quesero</button></p>
              </div>
              <p className="flex gap-2 rounded-xl bg-pergamino px-3 py-2.5 text-xs text-textoSecundario">{domicilio ? <Truck size={16} className="shrink-0 text-oliva" /> : <Store size={16} className="shrink-0 text-oliva" />} {domicilio ? 'Pagas al recibir, en efectivo o tarjeta.' : 'Pagas en la tienda al recoger.'} No se cobra nada en línea.</p>
              {error && <p role="alert" className="rounded-xl bg-error/10 px-3 py-2.5 text-sm font-medium text-error">{error}</p>}
              <button onClick={pedirConfirmacion} disabled={hayProblemas || !validas.length || cargando} className="btn-primario hidden h-12 w-full md:flex">
                Apartar pedido
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Barra móvil */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-borde bg-superficie/95 px-4 py-3 backdrop-blur md:hidden">
        <button onClick={pedirConfirmacion} disabled={hayProblemas || !validas.length || cargando} className="btn-primario h-14 w-full text-base">
          Apartar pedido · {dinero(total)}
        </button>
      </div>

      {confirmando && (
        <Confirmacion
          titulo="¿Apartar tu pedido?"
          mensaje={
            domicilio
              ? `${piezas} pieza(s) por ${dinero(total)} con envío. Lo llevamos a ${dir.calle.trim()}, ${dir.colonia.trim()} y pagas al recibir. Después de confirmar ya no se puede modificar.`
              : `${piezas} pieza(s) por ${dinero(total)}. Lo apartamos para ti y pagas al recogerlo en tienda. Después de confirmar ya no se puede modificar.`
          }
          textoConfirmar="Sí, apartar"
          textoCancelar="Revisar"
          cargando={guardando}
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}

// Elegir entre recoger en tienda o envío a domicilio (+ formulario de dirección)
function EleccionEntrega({ entrega, setEntrega, config, dir, setDir, direcciones = [], idSel, setSeleccion, envioVip, guardarDir, setGuardarDir, error }) {
  const opciones = [
    { id: 'tienda', icono: Store, titulo: 'Recoger en tienda', sub: 'Gratis · listo en minutos' },
    {
      id: 'domicilio',
      icono: Truck,
      titulo: 'A domicilio',
      sub: envioVip ? '👑 Gratis por tu nivel' : `${Number(config.envioCosto) ? `$${config.envioCosto}` : 'Gratis'}${Number(config.envioGratisDesde) ? ` · gratis desde $${config.envioGratisDesde}` : ''}`,
    },
  ]
  const campo = (k, v) => setDir((d) => ({ ...d, [k]: v }))

  return (
    <div className="tarjeta space-y-4 p-4">
      <h2 className="font-display text-lg font-semibold text-cacao">¿Cómo lo quieres recibir?</h2>
      <div role="radiogroup" aria-label="Forma de entrega" className="grid grid-cols-2 gap-3">
        {opciones.map(({ id, icono: Icono, titulo, sub }) => {
          const on = entrega === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setEntrega(id)}
              className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-3.5 text-left transition-all duration-300 ${
                on ? 'border-vino bg-vino/5 shadow-[0_8px_24px_-12px_rgb(var(--vino)/0.5)]' : 'border-borde hover:border-vino/40'
              }`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${on ? 'bg-vino text-white' : 'bg-pergamino text-cacao'}`}>
                <Icono size={20} className={on && id === 'domicilio' ? 'animate-[aparecer_.4s_ease-out]' : ''} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-cacao">{titulo}</span>
                <span className="block text-xs text-textoSecundario">{sub}</span>
              </span>
              <span className={`absolute right-3 top-3 h-5 w-5 rounded-full border-2 transition ${on ? 'border-vino bg-vino shadow-[inset_0_0_0_3px_rgb(var(--superficie))]' : 'border-borde'}`} />
            </button>
          )
        })}
      </div>

      {entrega === 'domicilio' && (
        <div className="animate-aparecer space-y-3 border-t border-borde/60 pt-4">
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textoSecundario">
            <span className="flex items-center gap-1"><MapPin size={13} className="text-oliva" /> {config.envioZona}</span>
            <span className="flex items-center gap-1"><Clock size={13} className="text-oliva" /> Llega en {config.envioTiempo}</span>
          </p>
          {direcciones.length > 0 && (
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {direcciones.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSeleccion(d.id)}
                  className={`flex min-w-[150px] shrink-0 flex-col items-start rounded-xl border-2 px-3 py-2 text-left text-xs transition ${idSel === d.id ? 'border-vino bg-vino/5' : 'border-borde hover:border-vino/40'}`}
                >
                  <span className="flex items-center gap-1 text-sm font-semibold text-cacao"><Home size={13} /> {d.alias || 'Dirección'}</span>
                  <span className="line-clamp-1 text-textoSecundario">{d.calle}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSeleccion('nueva')}
                className={`flex shrink-0 items-center gap-1 rounded-xl border-2 border-dashed px-4 text-sm font-medium transition ${idSel === 'nueva' ? 'border-vino text-vino' : 'border-borde text-textoSecundario hover:border-vino/40'}`}
              >
                <Plus size={15} /> Nueva
              </button>
            </div>
          )}
          {idSel !== 'nueva' ? (
            <div className="rounded-xl bg-pergamino/60 px-4 py-3 text-sm">
              <p className="font-medium text-cacao">{dir.calle}, {dir.colonia}</p>
              {dir.referencias && <p className="text-xs text-textoSecundario">Ref: {dir.referencias}</p>}
              <p className="text-xs text-textoSecundario">Tel. {dir.telefono}</p>
            </div>
          ) : (
          <>
          {direcciones.length > 0 && (
            <div>
              <label htmlFor="dir-alias" className="etiqueta">Nombre de la dirección</label>
              <input id="dir-alias" value={dir.alias || ''} onChange={(e) => campo('alias', e.target.value)} className="campo h-12" placeholder="Ej. Trabajo, Casa de mamá" />
            </div>
          )}
          <div>
            <label htmlFor="dir-calle" className="etiqueta">Calle y número</label>
            <input id="dir-calle" value={dir.calle} onChange={(e) => campo('calle', e.target.value)} className="campo h-12" autoComplete="street-address" placeholder="Ej. Av. Juárez 245, int. 3" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dir-colonia" className="etiqueta">Colonia</label>
              <input id="dir-colonia" value={dir.colonia} onChange={(e) => campo('colonia', e.target.value)} className="campo h-12" placeholder="Ej. Centro" />
            </div>
            <div>
              <label htmlFor="dir-tel" className="etiqueta">Teléfono</label>
              <input id="dir-tel" type="tel" value={dir.telefono} onChange={(e) => campo('telefono', e.target.value)} className="campo h-12" autoComplete="tel" placeholder="Para avisarte al llegar" />
            </div>
          </div>
          <div>
            <label htmlFor="dir-ref" className="etiqueta">Referencias <span className="font-normal text-textoSecundario">(opcional)</span></label>
            <input id="dir-ref" value={dir.referencias} onChange={(e) => campo('referencias', e.target.value)} className="campo h-12" placeholder="Portón café, entre calles…" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-textoSecundario">
            <input type="checkbox" checked={guardarDir} onChange={(e) => setGuardarDir(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--vino))]" />
            Guardar esta dirección para la próxima
          </label>
          </>
          )}
          {error && <p role="alert" className="rounded-xl bg-error/10 px-3 py-2.5 text-sm font-medium text-error">{error}</p>}
        </div>
      )}
    </div>
  )
}