// useAparecer.js — Revela elementos al entrar en pantalla (scroll)
// Uso: const ref = useAparecer(); <section ref={ref} className="revelar">…</section>
// Devuelve un "callback ref": funciona aunque el elemento aparezca después (p. ej. tras cargar datos).
import { useCallback, useRef } from 'react'

export function useAparecer() {
  const obsRef = useRef(null)

  return useCallback((el) => {
    obsRef.current?.disconnect()
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.classList.add('visible')
      return
    }
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.classList.add('visible')
          obs.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    obs.observe(el)
    obsRef.current = obs
  }, [])
}
