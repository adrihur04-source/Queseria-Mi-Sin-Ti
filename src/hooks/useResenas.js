// useResenas.js — Reseñas de productos (colección "resenas"), una sola suscripción para toda la app
// Documento: resenas/{pedidoId}_{productoId} = { productoId, pedidoId, clienteId, nombre, foto, estrellas, comentario, creado }
import { useSyncExternalStore } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const VACIO = { lista: [], porProducto: {} }
let actual = VACIO
let cancelar = null
const oyentes = new Set()

function suscribir(cb) {
  oyentes.add(cb)
  if (!cancelar) {
    cancelar = onSnapshot(
      collection(db, 'resenas'),
      (snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.creado?.toMillis?.() || 0) - (a.creado?.toMillis?.() || 0))
        const porProducto = {}
        for (const r of lista) {
          const p = (porProducto[r.productoId] ||= { suma: 0, n: 0, dist: [0, 0, 0, 0, 0], resenas: [] })
          const e = Math.min(5, Math.max(1, Number(r.estrellas) || 0))
          p.suma += e
          p.n += 1
          p.dist[e - 1] += 1
          p.resenas.push(r)
        }
        for (const p of Object.values(porProducto)) p.promedio = p.suma / p.n
        actual = { lista, porProducto }
        oyentes.forEach((o) => o())
      },
      () => {},
    )
  }
  return () => {
    oyentes.delete(cb)
    if (!oyentes.size && cancelar) {
      cancelar()
      cancelar = null
    }
  }
}

export function useResenas() {
  return useSyncExternalStore(suscribir, () => actual)
}

export const idResena = (pedidoId, productoId) => `${pedidoId}_${productoId}`

export function guardarResena({ pedidoId, productoId, productoNombre, usuario, estrellas, comentario }) {
  return setDoc(doc(db, 'resenas', idResena(pedidoId, productoId)), {
    pedidoId,
    productoId,
    productoNombre,
    clienteId: usuario.uid,
    nombre: usuario.nombre || 'Cliente',
    foto: usuario.foto || null,
    estrellas,
    comentario: comentario.trim().slice(0, 400),
    creado: serverTimestamp(),
  })
}
