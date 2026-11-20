// Interruptor.jsx — Switch accesible con etiqueta y descripción
export default function Interruptor({ activo, onCambio, etiqueta, sub, icono: Icono, deshabilitado = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={deshabilitado}
      onClick={() => onCambio(!activo)}
      className="flex w-full items-center gap-3 rounded-xl border border-borde bg-superficie p-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      {Icono && <Icono size={18} className={activo ? 'text-vino' : 'text-textoSecundario'} />}
      <span className="flex-1">
        <span className="block text-sm font-medium text-cacao">{etiqueta}</span>
        {sub && <span className="text-xs text-textoSecundario">{sub}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${activo ? 'bg-vino' : 'bg-borde'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-superficie shadow transition-all ${activo ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
