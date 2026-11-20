// efectos.js — Microinteracciones sin dependencias externas
const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Busca el ícono de carrito visible (encabezado en escritorio o barra inferior en móvil)
function destinoCarrito() {
  return [...document.querySelectorAll('[data-destino-carrito]')].find((el) => el.getClientRects().length && el.offsetParent !== null)
}

// Hace "volar" una copia de la imagen hasta el carrito y luego lo hace latir
export function volarAlCarrito(origen) {
  const destino = destinoCarrito()
  const latir = () => window.dispatchEvent(new CustomEvent('carrito:latido'))
  if (!origen || !destino || reducido()) return latir()

  const a = origen.getBoundingClientRect()
  const b = destino.getBoundingClientRect()
  const tam = Math.min(a.width, a.height, 120)
  const clon = document.createElement('img')
  clon.src = origen.currentSrc || origen.src
  Object.assign(clon.style, {
    position: 'fixed',
    left: `${a.left + a.width / 2 - tam / 2}px`,
    top: `${a.top + a.height / 2 - tam / 2}px`,
    width: `${tam}px`,
    height: `${tam}px`,
    objectFit: 'cover',
    borderRadius: '1rem',
    zIndex: 9999,
    pointerEvents: 'none',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,.35)',
  })
  document.body.appendChild(clon)

  const dx = b.left + b.width / 2 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  const anim = clon.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0.4 },
    ],
    { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' },
  )
  anim.onfinish = () => {
    clon.remove()
    latir()
  }
}

// Lluvia de confeti con los colores de la marca
export function confeti({ cantidad = 140, duracion = 2600 } = {}) {
  if (reducido()) return
  const canvas = document.createElement('canvas')
  Object.assign(canvas.style, { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const ajustar = () => {
    canvas.width = innerWidth * dpr
    canvas.height = innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  ajustar()

  const colores = ['#6B1F35', '#8E3550', '#D9B26A', '#9A6B1E', '#5F6B52', '#F7F1E6']
  const piezas = Array.from({ length: cantidad }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 6,
    giro: Math.random() * Math.PI,
    vg: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 8,
    h: 8 + Math.random() * 10,
    color: colores[(Math.random() * colores.length) | 0],
    circulo: Math.random() < 0.3,
  }))

  const inicio = performance.now()
  const cuadro = (t) => {
    const transcurrido = t - inicio
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, transcurrido - duracion * 0.6) / (duracion * 0.4))
    for (const p of piezas) {
      p.vy += 0.35
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.giro += p.vg
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.giro)
      ctx.fillStyle = p.color
      if (p.circulo) {
        ctx.beginPath()
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
        ctx.fill()
      } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.giro)))
      ctx.restore()
    }
    if (transcurrido < duracion) requestAnimationFrame(cuadro)
    else canvas.remove()
  }
  requestAnimationFrame(cuadro)
}
