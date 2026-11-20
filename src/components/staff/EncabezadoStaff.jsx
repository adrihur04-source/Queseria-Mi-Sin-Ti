// EncabezadoStaff.jsx — Encabezado de las pantallas de personal (cajero/empleado)
// Fondo cacao para distinguir la zona de trabajo de la tienda del cliente (vino).
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function EncabezadoStaff({ titulo, subtitulo, atras, acciones, children }) {
  const navigate = useNavigate()

  return (
    <header className="encabezado-staff sticky top-0 z-30 bg-tinta text-marfil shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)]">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-4 pt-5">
        {atras && (
          <button
            onClick={() => (typeof atras === 'string' ? navigate(atras) : navigate(-1))}
            aria-label="Regresar"
            className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-marfil/80 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold leading-tight text-white">{titulo}</h1>
          {subtitulo && <p className="truncate text-xs text-marfil/60">{subtitulo}</p>}
        </div>
        {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
      </div>
      {children && <div className="mx-auto max-w-5xl px-4 pb-4">{children}</div>}
    </header>
  )
}
