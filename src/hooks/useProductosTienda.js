// useProductosTienda.js — Productos visibles para el cliente, en tiempo real
// Excluye ocultos (visibleCatalogo === false), inactivos y caducados.
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { estaCaducado } from '../utils/caducidad'

export function useProductosTienda() {
  const [estado, setEstado] = useState({ productos: [], cargando: true, error: false })

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'productos'),
        (snap) => {
          const productos = snap.docs
            .map((d) => {
              const p = { id: d.id, ...d.data() }
              return { ...p, precio: Number(p.precio) || 0, stock: Number(p.stock) || 0, descuentoPorcentaje: Number(p.descuentoPorcentaje) || 0 }
            })
            .filter((p) => p.nombre && p.visibleCatalogo !== false && p.activo !== false && !estaCaducado(p))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
          setEstado({ productos, cargando: false, error: false })
        },
        () => setEstado({ productos: [], cargando: false, error: true }),
      ),
    [],
  )

  return estado
}
