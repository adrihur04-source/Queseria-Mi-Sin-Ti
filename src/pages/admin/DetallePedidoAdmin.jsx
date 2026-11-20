// DetallePedidoAdmin.jsx — Detalle de un pedido (vista de administrador)
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../firebase/config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '../../hooks/useAuth'
import { registrarEvento } from '../../utils/bitacora'

// Flujo de estados en orden. "cancelado" se maneja aparte, no es parte de la secuencia.
const FLUJO_STATUS = ['pendiente', 'preparando', 'pagado', 'entregado']

const ETIQUETAS_STATUS = {
  pendiente: 'Pendiente',
  preparando: 'En proceso',
  pagado: 'Pagado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export default function DetallePedidoAdmin() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState(false)

  useEffect(() => {
    async function obtenerPedido() {
      try {
        const docRef = doc(db, 'pedidos', id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setPedido({ id: docSnap.id, ...docSnap.data() })
        } else {
          console.log("ALERTA: Documento no existe en la colección 'pedidos'")
        }
      } catch (error) {
        console.error("Error crítico al obtener el pedido:", error)
      } finally {
        setCargando(false)
      }
    }

    if (id) {
      obtenerPedido()
    }
  }, [id])

  // 🔑 Devuelve el stock de cada producto del pedido. El stock ya se descontó
  // desde que el CLIENTE creó el pedido (ver Carrito.jsx → confirmarPedido),
  // así que al cancelar SIEMPRE hay que restaurarlo, sin importar el status.
  const restaurarInventario = async () => {
    if (!pedido.productos || pedido.productos.length === 0) return

    for (const item of pedido.productos) {
      if (!item.productoId) {
        console.warn(`Producto "${item.nombre}" no tiene productoId, se omite la devolución de stock.`)
        continue
      }
      const productoRef = doc(db, 'productos', item.productoId)
      const productoSnap = await getDoc(productoRef)
      if (!productoSnap.exists()) {
        console.warn(`Producto con id ${item.productoId} ya no existe en inventario.`)
        continue
      }
      const stockActual = productoSnap.data().stock || 0
      const nuevoStock = stockActual + item.cantidad
      await updateDoc(productoRef, { stock: nuevoStock })

      await registrarEvento({
        modulo: 'Inventario',
        accion: 'Editar',
        descripcion: `Entrada +${item.cantidad} pza${item.cantidad !== 1 ? 's' : ''} · ${item.nombre} · Devolución por cancelación de Pedido #${id.slice(-5).toUpperCase()}`,
        usuarioNombre: 'Sistema automático',
      })
    }
  }

  const avanzarEstado = async () => {
    const indiceActual = FLUJO_STATUS.indexOf(pedido.status)
    // Si el status actual no está en el flujo (ej. viene vacío o es "cancelado"), no hacemos nada
    if (indiceActual === -1 || indiceActual === FLUJO_STATUS.length - 1) return

    const nuevoStatus = FLUJO_STATUS[indiceActual + 1]
    setActualizando(true)
    try {
      const docRef = doc(db, 'pedidos', id)
      await updateDoc(docRef, { status: nuevoStatus })

      await registrarEvento({
        modulo: 'Pedidos',
        accion: 'Editar',
        descripcion: `Pedido #${id.slice(-5).toUpperCase()} → estatus cambiado a "${ETIQUETAS_STATUS[nuevoStatus]}"`,
        usuarioNombre: usuario?.nombre || 'Administrador/a',
      })

      // 🔑 Ya NO se descuenta stock aquí: el stock se descuenta una sola vez,
      // al momento en que el cliente crea el pedido (Carrito.jsx). Avanzar de
      // estado solo cambia el status, no vuelve a tocar el inventario.

      setPedido((prev) => ({ ...prev, status: nuevoStatus }))
    } catch (error) {
      console.error("Error al actualizar el pedido:", error)
    } finally {
      setActualizando(false)
    }
  }

  const cancelarPedido = async () => {
    setActualizando(true)
    try {
      // El stock siempre se descontó desde que se creó el pedido,
      // así que al cancelar siempre se debe restaurar.
      await restaurarInventario()

      const docRef = doc(db, 'pedidos', id)
      await updateDoc(docRef, { status: 'cancelado' })

      await registrarEvento({
        modulo: 'Pedidos',
        accion: 'Eliminar',
        descripcion: `Pedido #${id.slice(-5).toUpperCase()} cancelado · stock restaurado`,
        usuarioNombre: usuario?.nombre || 'Administrador/a',
      })

      setPedido((prev) => ({ ...prev, status: 'cancelado' }))
    } catch (error) {
      console.error("Error al cancelar el pedido:", error)
    } finally {
      setActualizando(false)
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-fondoPrincipal flex items-center justify-center">
        <p className="text-botonPrincipal font-bold animate-pulse text-lg">Cargando detalles...</p>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-fondoPrincipal p-8 text-center">
        <div className="bg-superficie p-6 rounded-xl border border-error inline-block">
          <p className="text-error font-bold mb-4">El pedido #{id} no se pudo cargar.</p>
          <button onClick={() => navigate('/admin/pedidos')} className="text-botonPrincipal font-black underline">
            ← Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  const indiceActual = FLUJO_STATUS.indexOf(pedido.status)
  const esCancelado = pedido.status === 'cancelado'
  const puedeAvanzar = indiceActual !== -1 && indiceActual < FLUJO_STATUS.length - 1 && !esCancelado
  // Un pedido entregado ya no se cancela (evita devolver stock que ya salió de tienda)
  const puedeCancelar = !esCancelado && pedido.status !== 'entregado'
  const siguienteEtiqueta = puedeAvanzar ? ETIQUETAS_STATUS[FLUJO_STATUS[indiceActual + 1]] : null

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-12 font-sans">
      <div className="bg-botonPrincipal px-4 py-5 flex items-center gap-3 text-white shadow-sm">
        <button onClick={() => navigate('/admin/pedidos')} className="text-xl font-bold">←</button>
        <h1 className="text-lg font-bold tracking-wide">Detalle del Pedido</h1>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-superficie border border-borde rounded-xl p-4 shadow-xs">
          <div className="border-b border-gray-100 pb-3 mb-3">
            <span className="text-[10px] bg-botonSecundario text-white px-2 py-0.5 rounded font-bold uppercase">
              {ETIQUETAS_STATUS[pedido.status] || pedido.status}
            </span>
            <h2 className="text-botonPrincipal font-black text-base mt-1">
              Pedido #{pedido.id ? pedido.id.slice(-5).toUpperCase() : '---'}
            </h2>
            <p className="text-textoPrincipal text-sm font-semibold mt-2">
              Cliente: <span className="font-normal text-textoSecundario">{pedido.clienteNombre || 'Cliente General'}</span>
            </p>
          </div>

          {!esCancelado && (
            <div className="flex items-center gap-1 mb-3">
              {FLUJO_STATUS.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full ${i <= indiceActual ? 'bg-botonPrincipal' : 'bg-gray-200'}`} />
                  <span className={`text-[10px] ${i <= indiceActual ? 'text-botonPrincipal font-semibold' : 'text-textoSecundario'}`}>
                    {ETIQUETAS_STATUS[s]}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-textoSecundario uppercase tracking-wider mb-1">Productos</p>
            {pedido.productos?.map((prod, idx) => (
              <div key={idx} className="flex justify-between text-sm text-textoPrincipal border-b border-gray-50 pb-1">
                <span>{prod.nombre} <b className="text-botonPrincipal">x{prod.cantidad}</b></span>
                <span className="font-semibold">${Number(prod.precio) * Number(prod.cantidad)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 mt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-botonPrincipal">Total a Cobrar:</span>
            <span className="text-lg font-black text-botonPrincipal">${pedido.total || 0}</span>
          </div>
        </div>

        <div className="bg-superficie border border-borde rounded-xl p-4 shadow-xs text-sm text-textoSecundario">
          <p className="font-bold text-botonPrincipal mb-2">Información de Entrega</p>
          <p><span className="font-semibold text-textoPrincipal">Tipo:</span> Entrega en tienda </p>
          <p><span className="font-semibold text-textoPrincipal">Teléfono:</span> 555-123-4567</p>
        </div>

        {(puedeAvanzar || puedeCancelar) && (
          <div className="mt-2 flex flex-col gap-3">
            {puedeAvanzar && (
              <button
                onClick={avanzarEstado}
                disabled={actualizando}
                className="w-full bg-botonPrincipal text-white font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-colors duration-200 disabled:opacity-50"
              >
                {actualizando ? 'Actualizando...' : `Avanzar a: ${siguienteEtiqueta}`}
              </button>
            )}
            {puedeCancelar && (
              <button
                onClick={cancelarPedido}
                disabled={actualizando}
                className="w-full border border-error text-error font-bold py-3 rounded-xl disabled:opacity-50"
              >
                Cancelar pedido
              </button>
            )}
          </div>
        )}

        {esCancelado && (
          <p className="text-center text-textoSecundario text-sm py-2">
            Este pedido fue cancelado y no se puede modificar.
          </p>
        )}
      </div>
    </div>
  )
}