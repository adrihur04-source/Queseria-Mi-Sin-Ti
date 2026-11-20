// Estrellas.jsx — Calificación de 1 a 5 (solo lectura o seleccionable)
import { useState } from 'react'
import { Star } from 'lucide-react'

export default function Estrellas({ valor = 0, tam = 16, onCambiar, className = '' }) {
  const [hover, setHover] = useState(0)
  const mostrado = hover || valor

  if (!onCambiar) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${valor.toFixed(1)} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const lleno = Math.min(1, Math.max(0, valor - (i - 1)))
          return (
            <span key={i} className="relative inline-block" style={{ width: tam, height: tam }}>
              <Star size={tam} className="absolute inset-0 text-borde" fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${lleno * 100}%` }}>
                <Star size={tam} className="text-miel" fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <span role="radiogroup" aria-label="Calificación" className={`inline-flex gap-1 ${className}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valor === i}
          aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onCambiar(i)}
          className="transition-transform hover:scale-125 active:scale-95"
        >
          <Star size={tam} className={i <= mostrado ? 'text-miel' : 'text-borde'} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </span>
  )
}
