// Avatar.jsx — Foto de perfil o iniciales (fallback con degradado de marca)
// <Avatar usuario={u} tam="h-10 w-10" />  ·  editable: <Avatar usuario={u} editable onCambiar={fn} />
import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'

const inicialesDe = (nombre = '') =>
  nombre.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

export default function Avatar({ usuario, tam = 'h-10 w-10', texto = 'text-sm', className = '', editable = false, onCambiar }) {
  const input = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const nombre = usuario?.nombre || usuario?.email || ''

  const elegir = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo || !onCambiar) return
    setSubiendo(true)
    try {
      await onCambiar(archivo)
    } finally {
      setSubiendo(false)
    }
  }

  const contenido = usuario?.foto ? (
    <img src={usuario.foto} alt={`Foto de ${nombre}`} className="h-full w-full object-cover" />
  ) : (
    <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-vino-claro via-vino to-vino-oscuro font-display font-semibold text-white ${texto}`}>
      {inicialesDe(nombre)}
    </span>
  )

  if (!editable) {
    return <span className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${tam} ${className}`}>{contenido}</span>
  }

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      aria-label="Cambiar foto de perfil"
      className={`group relative inline-flex shrink-0 overflow-hidden rounded-full ${tam} ${className}`}
    >
      {contenido}
      <span className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-tinta/55 text-[11px] font-semibold text-white transition ${subiendo ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
        {subiendo ? <Loader2 size={22} className="animate-spin" /> : <><Camera size={20} /> Cambiar</>}
      </span>
      <input ref={input} type="file" accept="image/*" onChange={elegir} className="hidden" />
    </button>
  )
}
