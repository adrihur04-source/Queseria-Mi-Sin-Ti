// CarritoContext.jsx — Carrito del cliente
// Una fila por producto (agregar de nuevo suma cantidad) y se guarda en el navegador
// para que no se pierda al recargar.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const CarritoContext = createContext()
const CLAVE = 'queseria-carrito-v2'

const cargarInicial = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    return Array.isArray(guardado) ? guardado : []
  } catch {
    return []
  }
}

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState(cargarInicial)
  const [abierto, setAbierto] = useState(false) // panel lateral (MiniCarrito)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(carrito))
    } catch {
      /* almacenamiento lleno o bloqueado: el carrito sigue en memoria */
    }
  }, [carrito])

  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id)
      const max = Number(producto.stock) || Infinity
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, ...producto, cantidad: Math.min(max, p.cantidad + cantidad) } : p,
        )
      }
      return [...prev, { ...producto, cantidad: Math.min(max, cantidad), cartItemId: producto.id }]
    })
  }

  const cambiarCantidad = (id, cantidad) =>
    setCarrito((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: Math.max(1, cantidad) } : p)))

  const quitarDelCarrito = (id) => setCarrito((prev) => prev.filter((p) => p.id !== id))

  const limpiarCarrito = () => setCarrito([])

  const abrirCarrito = useCallback(() => setAbierto(true), [])
  const cerrarCarrito = useCallback(() => setAbierto(false), [])

  const piezas = carrito.reduce((s, p) => s + (Number(p.cantidad) || 0), 0)

  return (
    <CarritoContext.Provider value={{ carrito, setCarrito, agregarAlCarrito, cambiarCantidad, quitarDelCarrito, limpiarCarrito, piezas, abierto, abrirCarrito, cerrarCarrito }}>
      {children}
    </CarritoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCarrito() {
  return useContext(CarritoContext)
}
