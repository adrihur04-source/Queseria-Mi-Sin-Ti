// useTema.js — Modo claro / oscuro
// Guarda la elección en localStorage; si no hay elección, sigue la preferencia del sistema.
// index.html aplica la clase antes de que cargue React para evitar parpadeo.
import { useCallback, useEffect, useSyncExternalStore } from 'react'

const CLAVE = 'queseria-tema'
const oyentes = new Set()

const temaGuardado = () => {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}
const sistemaOscuro = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches
const temaActual = () => temaGuardado() || (sistemaOscuro() ? 'oscuro' : 'claro')

function aplicar(tema) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'oscuro' ? '#17110E' : '#6B1F35')
}

function suscribir(cb) {
  oyentes.add(cb)
  return () => oyentes.delete(cb)
}

export function useTema() {
  const tema = useSyncExternalStore(suscribir, temaActual, () => 'claro')

  // Si el usuario no eligió, seguir los cambios del sistema
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const cambio = () => {
      if (!temaGuardado()) {
        aplicar(temaActual())
        oyentes.forEach((f) => f())
      }
    }
    mq?.addEventListener('change', cambio)
    return () => mq?.removeEventListener('change', cambio)
  }, [])

  const alternar = useCallback(() => {
    const nuevo = temaActual() === 'oscuro' ? 'claro' : 'oscuro'
    try {
      localStorage.setItem(CLAVE, nuevo)
    } catch {
      /* sin almacenamiento: solo aplica en esta sesión */
    }
    // Transición suave si el navegador lo permite
    if (document.startViewTransition) document.startViewTransition(() => aplicar(nuevo))
    else aplicar(nuevo)
    oyentes.forEach((f) => f())
  }, [])

  return { tema, oscuro: tema === 'oscuro', alternar }
}
