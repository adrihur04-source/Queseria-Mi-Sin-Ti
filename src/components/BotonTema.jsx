// BotonTema.jsx — Alterna modo claro / oscuro con animación de sol ↔ luna
import { Sun, Moon } from 'lucide-react'
import { useTema } from '../hooks/useTema'

export default function BotonTema({ className = '', sobreOscuro = false, conTexto = false }) {
  const { oscuro, alternar } = useTema()
  const base = sobreOscuro ? 'text-marfil/80 hover:bg-white/10 hover:text-white' : 'text-cacao hover:bg-pergamino'

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
      className={`relative flex h-11 items-center gap-3 rounded-xl transition ${conTexto ? 'w-full px-3 text-sm' : 'w-11 justify-center'} ${base} ${className}`}
    >
      <span className="relative h-5 w-5">
        <Sun size={20} className={`absolute inset-0 transition-all duration-500 ${oscuro ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
        <Moon size={20} className={`absolute inset-0 transition-all duration-500 ${oscuro ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
      </span>
      {conTexto && <span>{oscuro ? 'Modo claro' : 'Modo oscuro'}</span>}
    </button>
  )
}
