// HistorialCliente.jsx — Mis pedidos (cliente): SOLO pedidos en curso, con seguimiento en vivo.
// El historial de compras terminadas vive en /compras (MisCompras.jsx).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Check, Store, Truck, MapPin, Phone, ShoppingBag, ArrowRight, Receipt, PackageCheck, QrCode, XCircle } from 'lucide-react'
import { doc, updateDoc, deleteDoc, increment } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import Confirmacion from '../../components/staff/Confirmacion'
import QrPedido from '../../components/cliente/QrPedido'
import { usePedidosCliente } from '../../hooks/usePedidosCliente'
import { useConfigTienda } from '../../hooks/useConfigTienda'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import BottomNav from '../../components/layout/BottomNav'
import { flujoDe, esDomicilio, ESTADOS_ACTIVOS, cancelarPedido } from '../../services/pedidos'
import { dinero, folio, fechaRelativa, haceCuanto } from '../../utils/formato'

const TITULOS = { pendiente: 'Recibido', preparando: 'Preparando', pagado: 'Pagado', en_camino: 'En camino', entregado: 'Entregado' }

// Qué está pasando, explicado al cliente según cómo recibe su pedido
function mensaje(p) {
  if (esDomicilio(p)) {
    return {
      pendiente: 'Recibimos tu pedido. En breve empezamos a prepararlo.',
      preparando: 'Estamos alistando tus productos para enviarlos.',
      en_camino: `¡Va en camino a ${p.direccionEntrega?.calle || 'tu domicilio'}! Ten listo tu pago.`,
    }[p.status]
  }
  return {
    pendiente: 'La tienda recibió tu pedido. Te avisamos cuando empiece a prepararse.',
    preparando: 'Estamos alistando tus productos. Puedes pasar a la tienda con tu folio.',
    pagado: 'Pago recibido. Recoge tus productos en mostrador.',
  }[p.status]
}

function Seguimiento({ pedido }) {
  const flujo = flujoDe(pedido)
  const actual = flujo.indexOf(pedido.status)
  return (
    <ol className="grid grid-cols-4 gap-1">
      {flujo.map((s, i) => {
        const hecho = i <= actual
        return (
          <li key={s} className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : hecho ? 'bg-vino' : 'bg-borde'}`} />
              <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${hecho ? 'bg-vino text-white' : 'bg-pergamino text-textoSecundario'}`}>
                {i === actual && <span className="absolute inset-0 animate-ping rounded-full bg-vino/30 [animation-duration:2s]" />}
                {i < actual ? <Check size={14} /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === flujo.length - 1 ? 'opacity-0' : i < actual ? 'bg-vino' : 'bg-borde'}`} />
            </div>
            <span className={`text-[11px] leading-tight ${hecho ? 'font-semibold text-cacao' : 'text-textoSecundario'}`}>{TITULOS[s]}</span>
          </li>
        )
      })}
    </ol>
  )
}

export default function HistorialCliente() {
  const navigate = useNavigate()
  const config = useConfigTienda()
  const { pedidos, cargando } = usePedidosCliente()
  const [abierto, setAbierto] = useState(null)
  const { usuario } = useAuth()
  const [qr, setQr] = useState(null)
  const [cancelando, setCancelando] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [errorCancelar, setErrorCancelar] = useState('')

  // El cliente puede cancelar mientras la tienda no haya empezado a prepararlo
  const cancelar = async () => {
    setProcesando(true)
    setErrorCancelar('')
    try {
      await cancelarPedido(cancelando, usuario?.nombre || 'Cliente')
      // Devuelve los puntos usados y libera el código de amigo
      if (cancelando.puntosUsados) await updateDoc(doc(db, 'usuarios', usuario.uid), { puntosCanjeados: increment(-cancelando.puntosUsados) }).catch(() => {})
      if (cancelando.cupon) await deleteDoc(doc(db, 'referidos', usuario.uid)).catch(() => {})
      setCancelando(null)
    } catch (err) {
      console.error(err)
      setErrorCancelar('No se pudo cancelar. Llama a la tienda para ayudarte.')
    } finally {
      setProcesando(false)
    }
  }

  const enCurso = useMemo(() => pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.status)), [pedidos])
  const terminados = pedidos.length - enCurso.length

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda titulo="Mis pedidos" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titulo-seccion">Mis pedidos</h1>
            <p className="mt-1 text-sm text-textoSecundario">Sigue en vivo lo que apartaste.</p>
          </div>
          <button onClick={() => navigate('/compras')} className="btn-secundario h-11">
            <Receipt size={16} /> Mis compras{terminados > 0 && <span className="rounded-full bg-pergamino px-2 text-xs">{terminados}</span>}
          </button>
        </div>

        {cargando ? (
          <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="tarjeta h-56 animate-pulse" />)}</div>
        ) : enCurso.length === 0 ? (
          <div className="tarjeta flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-exito/10 text-exito"><PackageCheck size={30} /></span>
            <p className="font-display text-xl text-cacao">No tienes pedidos en curso</p>
            <p className="max-w-sm text-sm text-textoSecundario">Cuando apartes algo desde tu carrito, aquí verás cada paso hasta que lo tengas en tus manos.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button onClick={() => navigate('/catalogo')} className="btn-primario"><ShoppingBag size={16} /> Ir al catálogo</button>
              {terminados > 0 && <button onClick={() => navigate('/compras')} className="btn-secundario">Ver mis compras <ArrowRight size={16} /></button>}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {enCurso.map((p) => {
              const domicilio = esDomicilio(p)
              return (
                <li key={p.id} className="tarjeta animate-aparecer overflow-hidden">
                  <div className="space-y-5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-textoSecundario">Folio</p>
                        <p className="font-display text-3xl font-semibold tracking-wide text-cacao">{folio(p.id)}</p>
                        <p className="text-xs text-textoSecundario" title={fechaRelativa(p.creado)}>Apartado {haceCuanto(p.creado)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${domicilio ? 'bg-vino/10 text-vino' : 'bg-oliva/10 text-oliva'}`}>
                          {domicilio ? <><Truck size={12} /> A domicilio</> : <><Store size={12} /> En tienda</>}
                        </span>
                        <p className="mt-2 font-display text-2xl font-semibold text-vino">{dinero(p.total)}</p>
                      </div>
                    </div>

                    <Seguimiento pedido={p} />

                    <p className="flex items-start gap-2.5 rounded-xl bg-pergamino px-3.5 py-3 text-sm text-cacao">
                      {domicilio ? <Truck size={18} className={`mt-0.5 shrink-0 text-vino ${p.status === 'en_camino' ? 'animate-bounce' : ''}`} /> : <Store size={18} className="mt-0.5 shrink-0 text-oliva" />}
                      <span>
                        {mensaje(p)}
                        <span className="block text-xs text-textoSecundario">
                          {domicilio ? `Pagas al recibir · ${config.envioTiempo}` : `Muestra tu folio en caja · ${config.horario}`}
                        </span>
                      </span>
                    </p>

                    {domicilio && p.direccionEntrega && (
                      <p className="flex items-start gap-2 text-sm text-textoSecundario">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-oliva" />
                        {p.direccionEntrega.calle}, {p.direccionEntrega.colonia}
                      </p>
                    )}
                  </div>

                  <div className="flex border-t border-borde/60">
                    {!domicilio && (
                      <button onClick={() => setQr(p)} className="flex h-12 items-center gap-1.5 border-r border-borde/60 px-4 text-sm font-semibold text-vino hover:bg-crema">
                        <QrCode size={16} /> QR
                      </button>
                    )}
                    <button onClick={() => setAbierto(abierto === p.id ? null : p.id)} aria-expanded={abierto === p.id} className="flex h-12 flex-1 items-center justify-center gap-1 text-sm font-medium text-vino hover:bg-crema">
                      {abierto === p.id ? 'Ocultar' : 'Ver'} productos ({(p.productos || []).length}) <ChevronDown size={16} className={`transition ${abierto === p.id ? 'rotate-180' : ''}`} />
                    </button>
                    {config.telefono && (
                      <a href={`tel:${config.telefono}`} className="flex h-12 items-center gap-1.5 border-l border-borde/60 px-4 text-sm font-medium text-textoSecundario hover:bg-crema hover:text-vino">
                        <Phone size={15} /> Ayuda
                      </a>
                    )}
                    {p.status === 'pendiente' && (
                      <button onClick={() => { setErrorCancelar(''); setCancelando(p) }} className="flex h-12 items-center gap-1.5 border-l border-borde/60 px-4 text-sm font-medium text-textoSecundario hover:bg-error/5 hover:text-error">
                        <XCircle size={15} /> <span className="hidden sm:inline">Cancelar</span>
                      </button>
                    )}
                  </div>
                  {abierto === p.id && (
                    <div className="animate-aparecer border-t border-borde/60 bg-crema/60 px-5 py-4">
                      <ul className="space-y-1.5 text-sm">
                        {(p.productos || []).map((x, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span className="text-textoSecundario"><b className="text-cacao">{x.cantidad}×</b> {x.nombre}</span>
                            <span className="text-cacao">{dinero((Number(x.precio) || 0) * (Number(x.cantidad) || 1))}</span>
                          </li>
                        ))}
                        {Number(p.descuento) > 0 && <li className="flex justify-between text-exito"><span>Descuento</span><span>-{dinero(p.descuento)}</span></li>}
                        {domicilio && <li className="flex justify-between text-textoSecundario"><span>Envío</span><span>{Number(p.envio) ? dinero(p.envio) : 'Gratis'}</span></li>}
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {errorCancelar && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{errorCancelar}</p>}
      </main>
      {qr && <QrPedido pedido={qr} onCerrar={() => setQr(null)} />}
      {cancelando && (
        <Confirmacion
          peligro
          titulo={`¿Cancelar el pedido ${folio(cancelando.id)}?`}
          mensaje={`Liberaremos tus productos${cancelando.puntosUsados ? ` y te devolveremos ${cancelando.puntosUsados} puntos` : ''}. Esta acción no se puede deshacer.`}
          textoConfirmar="Sí, cancelar"
          textoCancelar="No, conservarlo"
          cargando={procesando}
          onConfirmar={cancelar}
          onCancelar={() => setCancelando(null)}
        />
      )}
      <BottomNav />
    </div>
  )
}
