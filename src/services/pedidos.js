// pedidos.js — Flujo de estatus de pedidos (compartido por lista y detalle)
// El stock se descuenta UNA vez, cuando el cliente crea el pedido (Carrito.jsx).
// Avanzar de estatus no toca inventario; cancelar lo restaura.
//
// Dos flujos según cómo se entrega:
//   Recoger en tienda: pendiente → preparando → pagado → entregado
//   A domicilio:       pendiente → preparando → en_camino → entregado (se cobra al entregar)

import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../firebase/config'
import { registrarEvento } from '../utils/bitacora'
import { folio } from '../utils/formato'

export const FLUJO_TIENDA = ['pendiente', 'preparando', 'pagado', 'entregado']
export const FLUJO_DOMICILIO = ['pendiente', 'preparando', 'en_camino', 'entregado']
export const FLUJO_STATUS = FLUJO_TIENDA // compatibilidad
export const ESTADOS_ACTIVOS = ['pendiente', 'preparando', 'pagado', 'en_camino']

export const esDomicilio = (pedido) => pedido?.entrega === 'domicilio'
export const flujoDe = (pedido) => (esDomicilio(pedido) ? FLUJO_DOMICILIO : FLUJO_TIENDA)

export const ETIQUETAS_STATUS = {
  pendiente: 'Pendiente',
  preparando: 'En preparación',
  pagado: 'Pagado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// Texto del botón para pasar al siguiente estatus (orientado a la acción del cajero)
export const ACCION_SIGUIENTE = {
  pendiente: 'Empezar a preparar',
  preparando: 'Marcar como pagado',
  pagado: 'Entregar al cliente',
}
const ACCION_DOMICILIO = {
  pendiente: 'Empezar a preparar',
  preparando: 'Enviar a domicilio',
  en_camino: 'Entregado y cobrado',
}
export const accionSiguiente = (pedido) =>
  (esDomicilio(pedido) ? ACCION_DOMICILIO : ACCION_SIGUIENTE)[pedido?.status || 'pendiente']

// Acepta el pedido completo (recomendado) o solo el estatus (flujo de tienda)
export const siguienteStatus = (pedidoOStatus) => {
  const pedido = typeof pedidoOStatus === 'string' ? { status: pedidoOStatus } : pedidoOStatus
  const flujo = flujoDe(pedido)
  const i = flujo.indexOf(pedido?.status || 'pendiente')
  return i === -1 || i === flujo.length - 1 ? null : flujo[i + 1]
}

// Solo se puede cancelar lo que aún no se entregó
export const puedeCancelar = (status) => ESTADOS_ACTIVOS.includes(status)

export async function avanzarPedido(pedido, usuarioNombre) {
  const nuevo = siguienteStatus(pedido)
  if (!nuevo) return null
  await updateDoc(doc(db, 'pedidos', pedido.id), { status: nuevo })
  await registrarEvento({
    modulo: 'Pedidos',
    accion: 'Editar',
    descripcion: `Pedido ${folio(pedido.id)} → estatus cambiado a "${ETIQUETAS_STATUS[nuevo]}"`,
    usuarioNombre: usuarioNombre || 'Empleado/a',
  })
  return nuevo
}

export async function cancelarPedido(pedido, usuarioNombre) {
  if (!puedeCancelar(pedido.status)) {
    throw new Error('Este pedido ya no se puede cancelar.')
  }

  for (const item of pedido.productos || []) {
    if (!item.productoId) continue
    const ref = doc(db, 'productos', item.productoId)
    const snap = await getDoc(ref)
    if (!snap.exists()) continue
    const cantidad = Number(item.cantidad) || 0
    await updateDoc(ref, { stock: increment(cantidad) })
    await registrarEvento({
      modulo: 'Inventario',
      accion: 'Editar',
      descripcion: `Entrada +${cantidad} pza${cantidad !== 1 ? 's' : ''} · ${item.nombre} · Devolución por cancelación de Pedido ${folio(pedido.id)}`,
      usuarioNombre: 'Sistema automático',
    })
  }

  await updateDoc(doc(db, 'pedidos', pedido.id), { status: 'cancelado' })
  await registrarEvento({
    modulo: 'Pedidos',
    accion: 'Eliminar',
    descripcion: `Pedido ${folio(pedido.id)} cancelado · stock restaurado`,
    usuarioNombre: usuarioNombre || 'Empleado/a',
  })
}
