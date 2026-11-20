// BuscadorEncabezado.jsx — Campo de búsqueda para usar dentro de <EncabezadoStaff> (fondo oscuro)
import { Search, X } from 'lucide-react'

export default function BuscadorEncabezado({ valor, onCambio, placeholder = 'Buscar…' }) {
  return (
    <div className="relative">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-marfil/50" />
      <input
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-11 pr-11 text-sm text-white outline-none placeholder:text-marfil/50 focus:border-white/30 focus:bg-white/15"
      />
      {valor && (
        <button onClick={() => onCambio('')} aria-label="Limpiar búsqueda" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-marfil/70 hover:bg-white/10">
          <X size={18} />
        </button>
      )}
    </div>
  )
}
