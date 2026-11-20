// DetallePedido.jsx — Detalle de un pedido (cajero/empleado)
// Barra de acción fija abajo (al alcance del pulgar), progreso del pedido
// y cancelación con confirmación. Un pedido entregado ya no se puede cancelar.
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { Phone, Store, Check, UserRound, AlertCircle, Truck, MapPin, Navigation } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import EstadoPedido from '../../components/staff/EstadoPedido'
import Confirmacion from '../../components/staff/Confirmacion'
import {
  flujoDe,
  esDomicilio,
  ETIQUETAS_STATUS,
  accionSiguiente,
  siguienteStatus,
  puedeCancelar,
  avanzarPedido,
  cancelarPedido,
} from '../../services/pedidos'
import { dinero, folio, fechaRelativa } from '../../utils/formato'

export default function DetallePedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const base = usuario?.role === 'admin' ? '/admin' : '/empleado'
  const [pedido, setPedido] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [error, setError] = useState('')

  // En tiempo real: si otro cajero lo actualiza, se refleja aquí
  useEffect(() => {
    if (!id) return
    return onSnapshot(
      doc(db, 'pedidos', id),
      (snap) => {
        setPedido(snap.exists() ? { id: snap.id, ...snap.data(), status: snap.data().status || 'pendiente' } : null)
        setCargando(false)
      },
      (err) => {
        console.error('Error al obtener el pedido:', err)
        setCargando(false)
      },
    )
  }, [id])

  useEffect(() => {
    if (!pedido?.clienteId) return
    getDoc(doc(db, 'usuarios', pedido.clienteId))
      .then((snap) => snap.exists() && setCliente(snap.data()))
      .catch(() => {})
  }, [pedido?.clienteId])

  const avanzar = async () => {
    setActualizando(true)
    setError('')
    try {
      await avanzarPedido(pedido, usuario?.nombre)
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar el pedido. Intenta de nuevo.')
    } finally {
      setActualizando(false)
    }
  }

  const cancelar = async () => {
    setActualizando(true)
    setError('')
    try {
      await cancelarPedido(pedido, usuario?.nombre)
      setConfirmarCancelar(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'No se pudo cancelar el pedido.')
      setConfirmarCancelar(false)
    } finally {
      setActualizando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-crema">
        <EncabezadoStaff titulo="Pedido" atras />
        <div className="mx-auto max-w-3xl space-y-4 p-4">
          <div className="tarjeta h-40 animate-pulse" />
          <div className="tarjeta h-56 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-crema">
        <EncabezadoStaff titulo="Pedido no encontrado" atras={`${base}/pedidos`} />
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <AlertCircle size={36} className="text-error" />
          <p className="font-display text-lg text-cacao">No encontramos el pedido {folio(id)}</p>
          <p className="text-sm text-textoSecundario">Puede que se haya eliminado o que el enlace sea incorrecto.</p>
          <button onClick={() => navigate(`${base}/pedidos`)} className="btn-primario mt-2">Volver a pedidos</button>
        </div>
      </div>
    )
  }

  const status = pedido.status
  const esCancelado = status === 'cancelado'
  const flujo = flujoDe(pedido)
  const domicilio = esDomicilio(pedido)
  const dirEnt = pedido.direccionEntrega || {}
  const indiceActual = flujo.indexOf(status)
  const siguiente = siguienteStatus(pedido)
  const cancelable = puedeCancelar(status)
  const productos = pedido.productos || []
  const nombreCliente = cliente?.nombre || pedido.clienteNombre || 'Cliente general'
  const telefono = (domicilio && dirEnt.telefono) || cliente?.telefono || pedido.clienteTelefono

  return (
    <div className={`min-h-screen bg-crema ${siguiente || cancelable ? 'pb-40' : 'pb-10'}`}>
      <EncabezadoStaff titulo={`Pedido ${folio(pedido.id)}`} subtitulo={fechaRelativa(pedido.creado)} atras />

      <div className="mx-auto grid max-w-3xl gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
        {/* Estado y progreso */}
        <section className="tarjeta p-5 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <EstadoPedido status={status} grande />
            {siguiente && <p className="text-xs text-textoSecundario">Siguiente: {ETIQUETAS_STATUS[siguiente]}</p>}
          </div>

          {!esCancelado && (
            <ol className="mt-5 grid grid-cols-4 gap-2">
              {flujo.map((s, i) => {
                const hecho = i <= indiceActual
                return (
                  <li key={s} className="flex flex-col items-center gap-2 text-center">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                        hecho ? 'bg-vino text-white' : 'bg-pergamino text-textoSecundario'
                      } ${i === indiceActual ? 'ring-4 ring-vino/15' : ''}`}
                    >
                      {i < indiceActual ? <Check size={16} /> : i + 1}
                    </span>
                    <span className={`text-[11px] leading-tight ${hecho ? 'font-semibold text-cacao' : 'text-textoSecundario'}`}>
                      {ETIQUETAS_STATUS[s]}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
          {esCancelado && (
            <p className="mt-4 rounded-xl bg-error/5 px-4 py-3 text-sm text-error">
              Este pedido fue cancelado y el stock se devolvió al inventario.
            </p>
          )}
        </section>

        {/* Productos */}
        <section className="tarjeta p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-textoSecundario">
            Productos ({productos.length})
          </h2>
          <ul className="divide-y divide-borde/60">
            {productos.map((x, i) => {
              const cant = Number(x.cantidad) || 1
              const precio = Number(x.precio) || 0
              return (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pergamino font-display text-base font-semibold text-cacao">
                    {cant}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-cacao">{x.nombre || 'Producto'}</p>
                    <p className="text-xs text-textoSecundario">{dinero(precio)} c/u</p>
                  </div>
                  <span className="text-sm font-semibold text-cacao">{dinero(precio * cant)}</span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t-2 border-dashed border-borde pt-4">
            <span className="text-sm font-semibold text-cacao">
              Total a cobrar
              {Number(pedido.envio) > 0 && <span className="block text-xs font-normal text-textoSecundario">Incluye envío {dinero(pedido.envio)}</span>}
              {pedido.cupon && <span className="block text-xs font-normal text-exito">Código de amigo {pedido.cupon.codigo} · -{dinero(pedido.cupon.descuento)}</span>}
              {Number(pedido.descuentoPuntos) > 0 && <span className="block text-xs font-normal text-exito">{pedido.puntosUsados} puntos · -{dinero(pedido.descuentoPuntos)}</span>}
            </span>
            <span className="font-display text-3xl font-semibold text-vino">{dinero(pedido.total)}</span>
          </div>
        </section>

        {/* Cliente */}
        <section className="tarjeta h-fit space-y-4 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-textoSecundario">Cliente</h2>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-oliva/10 text-oliva">
              <UserRound size={20} />
            </span>
            <p className="font-medium text-cacao">{nombreCliente}</p>
          </div>
          {domicilio ? (
            <div className="space-y-2 rounded-xl bg-pergamino/60 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold text-cacao"><Truck size={18} className="text-vino" /> Envío a domicilio · cobrar al entregar</p>
              <p className="flex gap-2 text-textoSecundario"><MapPin size={16} className="mt-0.5 shrink-0 text-oliva" /> <span>{dirEnt.calle}, {dirEnt.colonia}{dirEnt.referencias && <span className="block text-xs">Ref: {dirEnt.referencias}</span>}</span></p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${dirEnt.calle}, ${dirEnt.colonia}`)}`} target="_blank" rel="noreferrer" className="btn-secundario h-10 w-full"><Navigation size={15} /> Abrir en mapas</a>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-textoSecundario">
              <Store size={18} className="text-oliva" /> Recoge y paga en tienda
            </div>
          )}
          {telefono ? (
            <a href={`tel:${telefono}`} className="btn-secundario w-full">
              <Phone size={16} /> Llamar · {telefono}
            </a>
          ) : (
            <p className="text-sm text-textoSecundario">Sin teléfono registrado</p>
          )}
        </section>
      </div>

      {error && (
        <div role="alert" className="mx-auto mb-4 max-w-3xl px-4">
          <p className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>
        </div>
      )}

      {/* Barra de acciones fija */}
      {(siguiente || cancelable) && (
        <div className="fijo-inferior fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-3 p-4">
            {cancelable && (
              <button
                onClick={() => setConfirmarCancelar(true)}
                disabled={actualizando}
                className="btn h-14 border border-error/30 px-5 text-error hover:bg-error/5"
              >
                Cancelar
              </button>
            )}
            {siguiente && (
              <button onClick={avanzar} disabled={actualizando} className="btn-primario h-14 flex-1 text-base">
                {actualizando ? 'Actualizando…' : accionSiguiente(pedido)}
              </button>
            )}
          </div>
        </div>
      )}

      {confirmarCancelar && (
        <Confirmacion
          peligro
          titulo={`¿Cancelar el pedido ${folio(pedido.id)}?`}
          mensaje={`Se devolverán ${productos.reduce((s, x) => s + (Number(x.cantidad) || 0), 0)} pieza(s) al inventario y el cliente verá su pedido como cancelado. Esta acción no se puede deshacer.`}
          textoConfirmar="Sí, cancelar"
          textoCancelar="No, volver"
          cargando={actualizando}
          onConfirmar={cancelar}
          onCancelar={() => setConfirmarCancelar(false)}
        />
      )}
    </div>
  )
}
