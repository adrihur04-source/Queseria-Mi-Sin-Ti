// sonido.js — Avisos sonoros generados con Web Audio (sin archivos de audio)
let ctx = null

function contexto() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = ctx || new AC()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function nota(c, frecuencia, inicio, duracion, volumen = 0.18) {
  const osc = c.createOscillator()
  const gan = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = frecuencia
  gan.gain.setValueAtTime(0, c.currentTime + inicio)
  gan.gain.linearRampToValueAtTime(volumen, c.currentTime + inicio + 0.02)
  gan.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + inicio + duracion)
  osc.connect(gan).connect(c.destination)
  osc.start(c.currentTime + inicio)
  osc.stop(c.currentTime + inicio + duracion + 0.05)
}

// Campanita suave (cliente: cambio de estatus)
export function sonarAviso() {
  const c = contexto()
  if (!c) return
  nota(c, 880, 0, 0.35)
  nota(c, 1318.5, 0.12, 0.5)
}

// Timbre más insistente (cajero: pedido nuevo)
export function sonarPedidoNuevo() {
  const c = contexto()
  if (!c) return
  ;[0, 0.16, 0.32].forEach((t, i) => nota(c, [784, 988, 1175][i], t, 0.3, 0.22))
  ;[0.9, 1.06, 1.22].forEach((t, i) => nota(c, [784, 988, 1175][i], t, 0.3, 0.22))
}

// Notificación del sistema (si el usuario dio permiso)
export function notificarSistema(titulo, cuerpo) {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification(titulo, { body: cuerpo, icon: '/favicon.svg' })
    }
  } catch {
    /* algunos navegadores no permiten Notification fuera de un service worker */
  }
}

export function pedirPermisoNotificaciones() {
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
}
