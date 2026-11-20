// Hoja.jsx — Panel para formularios: hoja inferior en móvil, panel lateral derecho en escritorio
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Hoja({ titulo, subtitulo, onCerrar, pie, children, bloqueado = false }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && !bloqueado && onCerrar()
    window.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
    }
  }, [onCerrar, bloqueado])

  return (
    <div className="fixed inset-0 z-[55] bg-tinta/50 backdrop-blur-sm" onClick={() => !bloqueado && onCerrar()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] animate-aparecer flex-col rounded-t-3xl bg-crema md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-3xl"
      >
        <header className="flex items-start gap-3 border-b border-borde/60 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-semibold text-cacao">{titulo}</h2>
            {subtitulo && <p className="truncate text-sm text-textoSecundario">{subtitulo}</p>}
          </div>
          <button onClick={onCerrar} disabled={bloqueado} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-textoSecundario hover:bg-pergamino">
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">{children}</div>
        {pie && <footer className="border-t border-borde/60 bg-superficie px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{pie}</footer>}
      </div>
    </div>
  )
}
