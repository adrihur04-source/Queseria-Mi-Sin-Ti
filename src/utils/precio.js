// precio.js — Precio de venta real de un producto (fuente única para tienda y carrito)
export const tienePromo = (p) => !!p?.enPromocion && Number(p?.descuentoPorcentaje) > 0

// Precio unitario que paga el cliente (con descuento de promoción si aplica)
export const precioUnitario = (p) => {
  const base = Number(p?.precio) || 0
  return tienePromo(p) ? Math.round(base * (1 - Number(p.descuentoPorcentaje) / 100) * 100) / 100 : base
}
