// DetalleProducto.jsx — Ficha de producto
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { Heart, Minus, Plus, ShoppingBag, Store, Check, AlertTriangle, Clock, BellRing, BellOff, Lightbulb, Quote, Sparkles, Wine, Snowflake, UtensilsCrossed } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../context/CarritoContext'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import TarjetaProducto from '../../components/cliente/TarjetaProducto'
import BottomNav from '../../components/layout/BottomNav'
import { estaCaducado } from '../../utils/caducidad'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero, fechaRelativa } from '../../utils/formato'
import { precioUnitario, tienePromo } from '../../utils/precio'
import { stockDe, minDe } from '../../utils/stock'
import { volarAlCarrito } from '../../utils/efectos'
import { fichaDe, combinaCon } from '../../utils/descripciones'
import { useResenas } from '../../hooks/useResenas'
import Estrellas from '../../components/Estrellas'
import Avatar from '../../components/Avatar'

export default function DetalleProducto() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { usuario } = useAuth()
  const { agregarAlCarrito, carrito } = useCarrito()
  const { productos } = useProductosTienda()
  const esCliente = usuario?.role === 'cliente' || !usuario?.role

  const [estado, setEstado] = useState({ id: null, producto: null })
  const [cantidad, setCantidad] = useState(1)
  const [favorito, setFavorito] = useState({ id: null, valor: false })
  const [guardandoFav, setGuardandoFav] = useState(false)
  const [agregado, setAgregado] = useState(false)
  const [aviso, setAviso] = useState({ id: null, valor: false })
  const { porProducto } = useResenas()
  const imgRef = useRef(null)

  useEffect(
    () =>
      onSnapshot(
        doc(db, 'productos', id),
        (snap) => setEstado({ id, producto: snap.exists() ? { id: snap.id, ...snap.data() } : null }),
        () => setEstado({ id, producto: null }),
      ),
    [id],
  )

  useEffect(() => {
    if (!usuario?.uid) return
    let vivo = true
    getDoc(doc(db, 'usuarios', usuario.uid, 'favoritos', id))
      .then((s) => vivo && setFavorito({ id, valor: s.exists() }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [usuario?.uid, id])

  // ¿Ya pidió aviso de reabasto?
  useEffect(() => {
    if (!usuario?.uid) return
    let vivo = true
    getDoc(doc(db, 'avisosStock', `${id}_${usuario.uid}`))
      .then((s) => vivo && setAviso({ id, valor: s.exists() }))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [usuario?.uid, id])

  const cargando = estado.id !== id
  const producto = cargando ? null : estado.producto
  const esFavorito = favorito.id === id && favorito.valor

  const relacionados = useMemo(
    () => (producto ? productos.filter((p) => p.id !== producto.id && p.categoria && p.categoria === producto.categoria).slice(0, 4) : []),
    [productos, producto],
  )

  const alternarAviso = async () => {
    if (!usuario?.uid) return navigate('/login')
    const ref = doc(db, 'avisosStock', `${producto.id}_${usuario.uid}`)
    const activo = aviso.id === id && aviso.valor
    try {
      if (activo) await deleteDoc(ref)
      else await setDoc(ref, { productoId: producto.id, productoNombre: producto.nombre, clienteId: usuario.uid, clienteNombre: usuario.nombre || '', creado: serverTimestamp() })
      setAviso({ id, valor: !activo })
    } catch (err) {
      console.error(err)
    }
  }

  const alternarFavorito = async () => {
    if (!usuario?.uid) return navigate('/login')
    if (!producto || guardandoFav) return
    setGuardandoFav(true)
    const ref = doc(db, 'usuarios', usuario.uid, 'favoritos', producto.id)
    try {
      if (esFavorito) await deleteDoc(ref)
      else await setDoc(ref, { productoId: producto.id, nombre: producto.nombre, guardadoEn: serverTimestamp() })
      setFavorito({ id, valor: !esFavorito })
    } catch (err) {
      console.error(err)
    } finally {
      setGuardandoFav(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-crema">
        <EncabezadoTienda atras />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 md:grid-cols-2 md:px-6">
          <div className="aspect-square animate-pulse rounded-3xl bg-pergamino" />
          <div className="space-y-4"><div className="h-8 w-2/3 animate-pulse rounded bg-pergamino" /><div className="h-6 w-1/3 animate-pulse rounded bg-pergamino" /></div>
        </div>
      </div>
    )
  }

  if (!producto || producto.visibleCatalogo === false) {
    return (
      <div className="min-h-screen bg-crema">
        <EncabezadoTienda atras="/catalogo" />
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <p className="font-display text-xl text-cacao">Este producto ya no está disponible</p>
          <button onClick={() => navigate('/catalogo')} className="btn-primario">Volver al catálogo</button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const stock = stockDe(producto)
  const caducado = estaCaducado(producto)
  const agotado = stock === 0 || caducado
  const pocas = !agotado && stock <= minDe(producto)
  const enCarrito = carrito.find((p) => p.id === producto.id)?.cantidad || 0
  const maxAgregable = Math.max(0, stock - enCarrito)
  const promo = tienePromo(producto)
  const img = obtenerImagen(producto)
  const ficha = fichaDe(producto)
  const combinan = combinaCon(producto, productos)
  const resenas = porProducto[producto.id]
  const avisoActivo = aviso.id === id && aviso.valor
  const pzas = (n) => `${n} pieza${n === 1 ? '' : 's'}`

  const agregar = () => {
    if (agotado || cantidad > maxAgregable) return
    agregarAlCarrito(producto, cantidad)
    volarAlCarrito(imgRef.current)
    setAgregado(true)
    setCantidad(1)
    setTimeout(() => setAgregado(false), 2500)
  }

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-12">
      <EncabezadoTienda atras />

      <main className="mx-auto max-w-6xl px-4 pt-4 md:px-6 md:pt-8">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          {/* Imagen */}
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-pergamino md:sticky md:top-24 md:self-start">
            {img ? (
              <img ref={imgRef} src={img} alt={producto.nombre} className={`h-full w-full object-cover ${agotado ? 'opacity-70 grayscale' : ''}`} />
            ) : (
              <span className="flex h-full items-center justify-center font-display text-8xl text-cacao/20">{producto.nombre?.[0]}</span>
            )}
            {promo && <span className="absolute left-4 top-4 rounded-full bg-vino px-3 py-1.5 text-sm font-semibold text-white">-{producto.descuentoPorcentaje}%</span>}
            {esCliente && (
              <button
                onClick={alternarFavorito}
                disabled={guardandoFav}
                aria-pressed={esFavorito}
                aria-label={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-superficie/90 shadow-tarjeta transition hover:scale-105"
              >
                <Heart size={22} className={esFavorito ? 'fill-vino text-vino' : 'text-cacao'} />
              </button>
            )}
          </div>

          {/* Información */}
          <div>
            {producto.categoria && <p className="sobretitulo mb-2 text-oliva">{producto.categoria}</p>}
            <h1 className="font-display text-3xl font-semibold leading-tight text-cacao sm:text-5xl">{producto.nombre}</h1>
            <p className="mt-2 font-display text-lg italic text-vino sm:text-xl">“{ficha.frase}”</p>
            {resenas ? (
              <a href="#resenas" className="mt-3 inline-flex items-center gap-2 text-sm text-textoSecundario hover:text-vino">
                <Estrellas valor={resenas.promedio} /> <b className="text-cacao">{resenas.promedio.toFixed(1)}</b> · {resenas.n} reseña{resenas.n === 1 ? '' : 's'}
              </a>
            ) : (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-oliva/10 px-3 py-1 text-xs font-semibold text-oliva"><Sparkles size={13} /> {ficha.etiqueta}</p>
            )}
            {(producto.marca || producto.presentacion) && (
              <p className="mt-2 text-textoSecundario">{[producto.marca, producto.presentacion].filter(Boolean).join(' · ')}</p>
            )}

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-vino">{dinero(precioUnitario(producto))}</span>
              {promo && <span className="text-lg text-textoSecundario line-through">{dinero(producto.precio)}</span>}
            </div>
            {promo && <p className="mt-1 text-sm font-medium text-vino">Ahorras {dinero(producto.precio - precioUnitario(producto))} por pieza</p>}

            <div className="mt-4">
              {caducado ? (
                <p className="flex items-center gap-2 text-sm font-medium text-error"><Clock size={16} /> Este producto ya no está disponible para venta.</p>
              ) : stock === 0 ? (
                <p className="flex items-center gap-2 text-sm font-medium text-error"><AlertTriangle size={16} /> Agotado por ahora. ¡Te avisamos en cuanto vuelva!</p>
              ) : pocas ? (
                <p className="flex items-center gap-2 text-sm font-medium text-miel"><AlertTriangle size={16} className="animate-pulse" /> {stock === 1 ? '¡Última pieza disponible!' : `¡Solo quedan ${stock} piezas!`}</p>
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium text-exito"><Check size={16} /> Disponible · {pzas(stock)}</p>
              )}
            </div>

            {esCliente && !agotado && (
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <div className="flex items-center rounded-xl border border-borde bg-superficie">
                    <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} disabled={cantidad <= 1} aria-label="Restar" className="flex h-14 w-12 items-center justify-center text-cacao disabled:opacity-30"><Minus size={18} /></button>
                    <span className="w-10 text-center font-display text-xl font-semibold text-cacao" aria-live="polite">{cantidad}</span>
                    <button onClick={() => setCantidad((c) => Math.min(maxAgregable, c + 1))} disabled={cantidad >= maxAgregable} aria-label="Sumar" className="flex h-14 w-12 items-center justify-center text-cacao disabled:opacity-30"><Plus size={18} /></button>
                  </div>
                  <button onClick={agregar} disabled={maxAgregable === 0} className={`btn h-14 flex-1 text-base text-white ${agregado ? 'bg-exito' : 'bg-vino hover:bg-vino-oscuro'}`}>
                    {agregado ? <><Check size={18} /> Agregado</> : <><ShoppingBag size={18} /> Agregar · {dinero(precioUnitario(producto) * cantidad)}</>}
                  </button>
                </div>
                {enCarrito > 0 && (
                  <button onClick={() => navigate('/carrito')} className="text-sm font-medium text-vino hover:underline">
                    Tienes {enCarrito} en tu carrito{maxAgregable === 0 && ' (todas las disponibles)'} · Ver carrito →
                  </button>
                )}
              </div>
            )}

            {esCliente && stock === 0 && !caducado && (
              <button
                onClick={alternarAviso}
                className={`mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition ${avisoActivo ? 'border-2 border-exito/40 bg-exito/10 text-exito' : 'bg-vino text-white hover:bg-vino-oscuro'}`}
              >
                {avisoActivo ? <><BellOff size={18} /> Te avisaremos · Cancelar aviso</> : <><BellRing size={18} className="animate-[latido_1.6s_ease-in-out_infinite]" /> Avísame cuando llegue</>}
              </button>
            )}

            <p className="mt-6 flex items-center gap-2 rounded-xl bg-pergamino px-4 py-3 text-sm text-textoSecundario">
              <Store size={18} className="shrink-0 text-oliva" /> Aparta en línea y recoge en tienda, o pídelo a domicilio.
            </p>

            {/* Ficha de antojo */}
            <section className="mt-8 space-y-4">
              <p className="leading-7 text-cacao">{ficha.historia}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {ficha.notas.map((n) => (
                  <div key={n.titulo} className="tarjeta group p-4 transition duration-300 hover:-translate-y-1 hover:shadow-elevada">
                    <span className="text-2xl transition group-hover:scale-125 inline-block">{n.icono}</span>
                    <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-vino">{n.titulo}</p>
                    <p className="mt-1 text-sm leading-6 text-textoSecundario">{n.texto}</p>
                  </div>
                ))}
              </div>
              {ficha.propia && (
                <blockquote className="relative rounded-2xl bg-pergamino/70 p-5 pl-12 text-sm leading-7 text-cacao">
                  <Quote size={22} className="absolute left-4 top-4 text-vino/40" />
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-textoSecundario">Palabras del productor</p>
                  <p className="whitespace-pre-line">{ficha.propia}</p>
                </blockquote>
              )}
              <div className="tarjeta divide-y divide-borde/60 overflow-hidden">
                {[
                  [UtensilsCrossed, 'Así se disfruta', ficha.disfrutar],
                  [Wine, 'Marídalo con', ficha.maridaje],
                  [Snowflake, 'Conservación', ficha.conservar],
                ].map(([Icono, titulo, texto], i) => (
                  <details key={titulo} open={i === 0} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-sm font-semibold text-cacao hover:bg-crema/60">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-vino/10 text-vino"><Icono size={16} /></span>
                      <span className="flex-1">{titulo}</span>
                      <Plus size={16} className="text-textoSecundario transition group-open:rotate-45" />
                    </summary>
                    <p className="px-4 pb-4 pl-[3.75rem] text-sm leading-6 text-textoSecundario">{texto}</p>
                  </details>
                ))}
              </div>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-miel/15 to-vino/10 p-5">
                <Lightbulb size={60} className="absolute -right-2 -top-2 text-miel/20" />
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-miel"><Lightbulb size={14} /> ¿Sabías que…?</p>
                <p className="relative mt-1.5 text-sm leading-6 text-cacao">{ficha.dato}</p>
              </div>
            </section>

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-borde bg-borde text-sm">
              {[
                ['Marca', producto.marca],
                ['Categoría', producto.categoria],
                ['Presentación', producto.presentacion && producto.presentacion.length <= 40 ? producto.presentacion : null],
                ['Productor', producto.proveedor],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="bg-superficie px-4 py-3">
                    <dt className="text-xs text-textoSecundario">{k}</dt>
                    <dd className="font-medium text-cacao">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {/* Combínalo con */}
        {combinan.length > 0 && (
          <section className="mt-14 overflow-hidden rounded-[2rem] bg-gradient-to-br from-vino to-vino-oscuro p-6 text-marfil md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-miel-claro">Combinación perfecta</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">Combínalo con…</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {combinan.map((p) => {
                const im = obtenerImagen(p)
                return (
                  <div key={p.id} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/15">
                    <button onClick={() => navigate(`/catalogo/${p.id}`)} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                      {im && <img src={im} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{p.nombre}</p>
                      <p className="text-sm text-miel-claro">{dinero(precioUnitario(p))}</p>
                    </div>
                    {esCliente && (
                      <button
                        onClick={() => {
                          agregarAlCarrito(p, 1)
                          window.dispatchEvent(new Event('carrito:latido'))
                        }}
                        aria-label={`Agregar ${p.nombre}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marfil text-[#4C1028] transition hover:scale-110"
                      >
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Reseñas */}
        <section id="resenas" className="mt-14 scroll-mt-24">
          <h2 className="mb-4 font-display text-2xl font-semibold text-cacao">Lo que dicen nuestros clientes</h2>
          {!resenas ? (
            <div className="tarjeta flex items-center gap-4 p-5">
              <Estrellas valor={0} tam={22} />
              <p className="text-sm text-textoSecundario">Aún no hay reseñas. Si ya lo compraste, califícalo desde <button onClick={() => navigate('/compras')} className="font-semibold text-vino hover:underline">Mis compras</button>.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
              <div className="tarjeta h-fit p-5 text-center">
                <p className="font-display text-5xl font-semibold text-cacao">{resenas.promedio.toFixed(1)}</p>
                <Estrellas valor={resenas.promedio} tam={20} className="mt-1" />
                <p className="mt-1 text-xs text-textoSecundario">{resenas.n} reseña{resenas.n === 1 ? '' : 's'}</p>
                <ul className="mt-4 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((e) => (
                    <li key={e} className="flex items-center gap-2 text-xs text-textoSecundario">
                      <span className="w-3">{e}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-pergamino">
                        <span className="block h-full rounded-full bg-miel transition-all duration-700" style={{ width: `${(resenas.dist[e - 1] / resenas.n) * 100}%` }} />
                      </span>
                      <span className="w-5 text-right">{resenas.dist[e - 1]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="space-y-3">
                {resenas.resenas.slice(0, 6).map((r) => (
                  <li key={r.id} className="tarjeta p-4">
                    <div className="flex items-center gap-3">
                      <Avatar usuario={{ nombre: r.nombre, foto: r.foto }} tam="h-10 w-10" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-cacao">{r.nombre?.split(' ')[0]}</p>
                        <p className="text-xs text-textoSecundario">{fechaRelativa(r.creado)} · Compra verificada</p>
                      </div>
                      <Estrellas valor={r.estrellas} />
                    </div>
                    {r.comentario && <p className="mt-3 text-sm leading-6 text-cacao">{r.comentario}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {relacionados.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 font-display text-2xl font-semibold text-cacao">También te puede gustar</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {relacionados.map((p) => <TarjetaProducto key={p.id} producto={p} puedeComprar={esCliente} />)}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
