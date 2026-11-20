// Contador.jsx — Número que sube animado desde 0 cuando entra en pantalla
import { useEffect, useRef, useState } from 'react'

export default function Contador({ valor, duracion = 1200, prefijo = '', sufijo = '' }) {
  const ref = useRef(null)
  const [mostrado, setMostrado] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof valor !== 'number') return
    let raf
    const animar = () => {
      const inicio = performance.now()
      const paso = (t) => {
        const p = Math.min(1, (t - inicio) / duracion)
        setMostrado(Math.round(valor * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(paso)
      }
      raf = requestAnimationFrame(paso)
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        animar()
        obs.disconnect()
      }
    })
    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [valor, duracion])

  return (
    <span ref={ref} className="tabular-nums">
      {typeof valor === 'number' ? `${prefijo}${mostrado}${sufijo}` : valor}
    </span>
  )
}
