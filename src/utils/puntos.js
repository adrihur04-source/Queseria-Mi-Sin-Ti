// puntos.js — Programa de lealtad "Club Quesero"
// Ganas 1 punto por cada $10 de compras ENTREGADAS + puntos por amigos invitados.
// 100 puntos = $10 de descuento. Los niveles se basan en los puntos ganados en total.

export const PUNTOS_POR_PESO = 0.1 // 1 punto por cada $10
export const VALOR_PUNTO = 0.1 // 1 punto = $0.10  →  100 pts = $10
export const PUNTOS_POR_AMIGO = 150
export const MAX_CANJE_PORCENTAJE = 0.5 // puedes pagar hasta 50% del subtotal con puntos
export const MIN_CANJE = 50

export const DESCUENTO_REFERIDO = 0.1 // 10% en la primera compra del amigo
export const TOPE_REFERIDO = 100 // máximo $100

export const NIVELES = [
  { id: 'fresco', nombre: 'Queso Fresco', desde: 0, emoji: '🧀', color: 'from-oliva to-[#3F4936]', beneficios: ['1 punto por cada $10', 'Ofertas exclusivas por correo'] },
  { id: 'semicurado', nombre: 'Semicurado', desde: 300, emoji: '🥖', color: 'from-miel to-[#6B4A12]', beneficios: ['Todo lo anterior', 'Acceso anticipado a productos nuevos'] },
  { id: 'anejo', nombre: 'Añejo', desde: 800, emoji: '🍷', color: 'from-vino to-vino-oscuro', beneficios: ['Todo lo anterior', 'Envío a domicilio GRATIS siempre'] },
  { id: 'reserva', nombre: 'Gran Reserva', desde: 2000, emoji: '👑', color: 'from-[#2A1A12] to-[#120A06]', beneficios: ['Todo lo anterior', 'Degustación anual en tienda', 'Regalo de cumpleaños'] },
]

export const nivelDe = (ganados) => [...NIVELES].reverse().find((n) => ganados >= n.desde) || NIVELES[0]
export const siguienteNivel = (ganados) => NIVELES.find((n) => n.desde > ganados) || null
export const envioGratisPorNivel = (ganados) => ganados >= NIVELES[2].desde

// pedidos: todos los del cliente · amigos: número de referidos · canjeados: usuarios/{uid}.puntosCanjeados
export function calcularPuntos(pedidos, amigos = 0, canjeados = 0) {
  const porCompras = pedidos
    .filter((p) => p.status === 'entregado')
    .reduce((s, p) => s + Math.floor((Number(p.total) || 0) * PUNTOS_POR_PESO), 0)
  const porAmigos = amigos * PUNTOS_POR_AMIGO
  // Puntos apartados en pedidos aún activos o ya usados (los cancelados se devuelven al cancelar)
  const ganados = porCompras + porAmigos
  const disponibles = Math.max(0, ganados - (Number(canjeados) || 0))
  return { porCompras, porAmigos, ganados, disponibles, nivel: nivelDe(ganados), siguiente: siguienteNivel(ganados) }
}

export const codigoReferido = (uid = '') => `QS-${uid.slice(0, 6).toUpperCase()}`
