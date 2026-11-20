// Confirmacion.jsx — Modal de confirmación (reemplaza alert/confirm del navegador)
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Confirmacion({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Volver',
  peligro = false,
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && !cargando && onCancelar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [cargando, onCancelar])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-tinta/50 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={() => !cargando && onCancelar()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-aparecer rounded-t-3xl bg-superficie p-6 pb-8 sm:rounded-3xl sm:pb-6"
      >
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${peligro ? 'bg-error/10 text-error' : 'bg-vino/10 text-vino'}`}>
          <AlertTriangle size={22} />
        </div>
        <h2 id="confirmacion-titulo" className="font-display text-xl font-semibold text-cacao">{titulo}</h2>
        {mensaje && <p className="mt-2 text-sm leading-6 text-textoSecundario">{mensaje}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancelar} disabled={cargando} className="btn-secundario py-3.5">
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className={peligro ? 'btn bg-error py-3.5 text-white hover:bg-error/90' : 'btn-primario py-3.5'}
          >
            {cargando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
