// stock.js — Reglas compartidas de stock y caducidad
export const MIN_POR_DEFECTO = 2
export const DIAS_POR_CADUCAR = 7

export const stockDe = (p) => Number(p?.stock) || 0
export const minDe = (p) => Number(p?.stockMin) || MIN_POR_DEFECTO
export const esAgotado = (p) => stockDe(p) === 0
export const esBajo = (p) => stockDe(p) > 0 && stockDe(p) <= minDe(p)
export const necesitaReabasto = (p) => stockDe(p) <= minDe(p)

// Días hasta una fecha 'YYYY-MM-DD' (negativo = ya pasó). null si no hay fecha.
export function diasPara(fechaISO) {
  if (!fechaISO) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((new Date(fechaISO + 'T00:00:00') - hoy) / 86400000)
}

export function textoCaducidad(dias) {
  if (dias === null) return null
  if (dias < 0) return `Caducó hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
  if (dias === 0) return 'Caduca hoy'
  if (dias <= DIAS_POR_CADUCAR) return `Caduca en ${dias} día${dias === 1 ? '' : 's'}`
  const fecha = new Date(dias * 86400000 + Date.now())
  return `Caduca ${fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export const fechaCorta = (fechaISO) =>
  fechaISO
    ? new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
