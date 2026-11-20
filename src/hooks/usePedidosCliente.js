// usePedidosCliente.js — Pedidos del cliente en sesión, en tiempo real (más recientes primero)
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth'

export function usePedidosCliente() {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState({ uid: null, pedidos: [], error: false })

  useEffect(() => {
    if (!usuario?.uid) return
    const uid = usuario.uid
    return onSnapshot(
      query(collection(db, 'pedidos'), where('clienteId', '==', uid)),
      (s) =>
        setEstado({
          uid,
          error: false,
          pedidos: s.docs
            .map((d) => ({ id: d.id, ...d.data(), status: d.data().status || 'pendiente' }))
            .sort((a, b) => (b.creado?.toMillis?.() || 0) - (a.creado?.toMillis?.() || 0)),
        }),
      () => setEstado({ uid, pedidos: [], error: true }),
    )
  }, [usuario?.uid])

  return { pedidos: estado.pedidos, cargando: estado.uid !== usuario?.uid, error: estado.error }
}

// Vuelve a agregar al carrito lo que siga disponible; regresa cuántos productos se agregaron
export function volverAPedir(pedido, productos, agregarAlCarrito) {
  let agregados = 0
  for (const item of pedido.productos || []) {
    const vivo = productos.find((x) => x.id === item.productoId)
    if (vivo && vivo.stock > 0) {
      agregarAlCarrito(vivo, Math.min(Number(item.cantidad) || 1, vivo.stock))
      agregados++
    }
  }
  return agregados
}
