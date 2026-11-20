// caducidad.js — Utilidad compartida para saber si un producto ya caducó
// El campo `caducidad` se guarda como texto 'YYYY-MM-DD' (o null si el producto no caduca).
// Al ser ese formato, se puede comparar directamente como texto sin convertir a Date.

export function estaCaducado(producto) {
  if (!producto?.caducidad) return false
  const hoy = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD' de hoy
  return producto.caducidad < hoy
}
