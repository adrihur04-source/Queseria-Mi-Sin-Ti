// TarjetaProducto.jsx — Tarjeta de producto para catálogo, promociones y favoritos
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Check, Star } from 'lucide-react'
import { useCarrito } from '../../context/CarritoContext'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero } from '../../utils/formato'
import { precioUnitario, tienePromo } from '../../utils/precio'
import { stockDe, minDe } from '../../utils/stock'
import { volarAlCarrito } from '../../utils/efectos'
import { useResenas } from '../../hooks/useResenas'

export default function TarjetaProducto({ producto: p, accionExtra, puedeComprar = true }) {
  const navigate = useNavigate()
  const resena = useResenas().porProducto[p.id]
  const { agregarAlCarrito } = useCarrito()
  const [agregado, setAgregado] = useState(false)
  const [rota, setRota] = useState(false)
  const imgRef = useRef(null)
  const tarjetaRef = useRef(null)

  const img = obtenerImagen(p)
  const promo = tienePromo(p)
  const stock = stockDe(p)
  const agotado = stock === 0
  const pocas = !agotado && stock <= minDe(p)

  const agregar = (e) => {
    e.stopPropagation()
    agregarAlCarrito(p, 1)
    volarAlCarrito(imgRef.current)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1400)
  }

  // Inclinación 3D sutil siguiendo el cursor (solo con mouse)
  const inclinar = (e) => {
    if (e.pointerType !== 'mouse' || !tarjetaRef.current) return
    const r = tarjetaRef.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    tarjetaRef.current.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateY(-4px)`
    tarjetaRef.current.style.setProperty('--brillo-x', `${(x + 0.5) * 100}%`)
    tarjetaRef.current.style.setProperty('--brillo-y', `${(y + 0.5) * 100}%`)
  }
  const soltar = () => {
    if (tarjetaRef.current) tarjetaRef.current.style.transform = ''
  }

  return (
    <article
      ref={tarjetaRef}
      onClick={() => navigate(`/catalogo/${p.id}`)}
      onPointerMove={inclinar}
      onPointerLeave={soltar}
      className="tarjeta group relative flex cursor-pointer flex-col overflow-hidden transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:shadow-elevada"
    >
      <span className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 [background:radial-gradient(circle_at_var(--brillo-x,50%)_var(--brillo-y,50%),rgb(255_255_255/0.18),transparent_55%)] group-hover:opacity-100" />
      <div className="relative aspect-square overflow-hidden bg-pergamino">
        {img && !rota ? (
          <img ref={imgRef} src={img} alt={p.nombre} loading="lazy" onError={() => setRota(true)} className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${agotado ? 'opacity-60 grayscale' : ''}`} />
        ) : (
          <span className="flex h-full items-center justify-center font-display text-4xl text-cacao/25">{p.nombre?.[0]}</span>
        )}
        {promo && <span className="absolute left-2.5 top-2.5 rounded-full bg-vino px-2.5 py-1 text-xs font-semibold text-white">-{p.descuentoPorcentaje}%</span>}
        {agotado && <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-tinta/85 py-1 text-center text-xs font-semibold text-white">Agotado</span>}
        {pocas && <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-superficie/90 py-1 text-center text-xs font-semibold text-miel">¡Quedan {stock}!</span>}
        {accionExtra && <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>{accionExtra}</div>}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {p.categoria && <p className="mb-0.5 truncate text-[11px] font-semibold uppercase tracking-wider text-oliva">{p.categoria}</p>}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-cacao sm:text-base">{p.nombre}</h3>
        {resena && <p className="mt-0.5 flex items-center gap-1 text-xs text-textoSecundario"><Star size={12} className="text-miel" fill="currentColor" strokeWidth={0} /> <b className="text-cacao">{resena.promedio.toFixed(1)}</b> ({resena.n})</p>}
        {p.marca && <p className="truncate text-xs text-textoSecundario">{p.marca}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="font-semibold text-vino">{dinero(precioUnitario(p))}</p>
            {promo && <p className="text-xs text-textoSecundario line-through">{dinero(p.precio)}</p>}
          </div>
          {puedeComprar && !agotado && (
            <button
              onClick={agregar}
              aria-label={`Agregar ${p.nombre} al carrito`}
              className={`relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-90 ${agregado ? 'animate-latido bg-exito text-white' : 'bg-vino text-white hover:scale-110 hover:bg-vino-oscuro'}`}
            >
              {agregado ? <Check size={18} /> : <Plus size={18} />}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
