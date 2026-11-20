// formato.js — Formateadores compartidos (dinero, fechas, folios)

export const dinero = (n) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })

export const folio = (id) => (id ? `#${id.slice(-5).toUpperCase()}` : '#-----')

// "Hoy, 3:45 p.m." · "Ayer, 3:45 p.m." · "27 jul, 3:45 p.m."
export function fechaRelativa(timestamp) {
  if (!timestamp?.toDate) return ''
  const fecha = timestamp.toDate()
  const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const hoy = new Date()
  const ayer = new Date(Date.now() - 86400000)
  if (fecha.toDateString() === hoy.toDateString()) return `Hoy, ${hora}`
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`
  return `${fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}, ${hora}`
}

// "hace 5 min" — útil para saber cuánto lleva esperando un pedido
export function haceCuanto(timestamp) {
  if (!timestamp?.toDate) return ''
  const min = Math.floor((Date.now() - timestamp.toDate().getTime()) / 60000)
  if (min < 1) return 'justo ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} día${d === 1 ? '' : 's'}`
}

export const esDeHoy = (timestamp) =>
  !!timestamp?.toDate && timestamp.toDate().toDateString() === new Date().toDateString()
