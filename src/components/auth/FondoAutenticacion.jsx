// FondoAutenticacion.jsx — Fondo de Login y Registro
// Vino a pantalla completa con destellos, anillos dorados y fotos de producto flotando (escritorio).
// La tarjeta del formulario va encima, centrada.
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { vitrinaLocal } from '../../utils/imagenes'
import logo from '../../assets/logoficial.png'
import BotonTema from '../BotonTema'

// Posición, tamaño, giro y desfase de cada foto flotante
const POSICIONES = [
  'left-[6%] top-[12%] h-28 w-28 [--giro:-8deg]',
  'left-[14%] bottom-[14%] h-36 w-36 [--giro:6deg] [animation-delay:-2s]',
  'right-[8%] top-[10%] h-32 w-32 [--giro:7deg] [animation-delay:-4s]',
  'right-[15%] bottom-[12%] h-28 w-28 [--giro:-5deg] [animation-delay:-1s]',
  'left-[3%] top-[48%] h-20 w-20 [--giro:10deg] [animation-delay:-3s]',
  'right-[4%] top-[50%] h-24 w-24 [--giro:-10deg] [animation-delay:-5s]',
]

export default function FondoAutenticacion({ children, ancho = 'max-w-md' }) {
  const fotos = vitrinaLocal().slice(0, POSICIONES.length)

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-vino-oscuro px-4 py-10 sm:px-6">
      {/* Degradado y destellos */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#6B1F35_0%,#4C1028_45%,#2A0915_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] animate-brillo rounded-full bg-miel/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[24rem] w-[24rem] animate-brillo rounded-full bg-vino-claro/40 blur-[110px] [animation-delay:-4s]" />

      {/* Anillos */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full border border-miel-claro/20" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-[20rem] w-[20rem] rounded-full border border-miel-claro/10" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[36rem] w-[36rem] rounded-full border border-miel-claro/15" />

      {/* Textura de puntos */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#F7F1E6_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* Fotos flotantes (solo escritorio) */}
      {fotos.map((f, i) => (
        <div key={f.id} className={`pointer-events-none absolute hidden animate-flotar lg:block ${POSICIONES[i]}`}>
          <img src={f.imagenUrl} alt="" className="h-full w-full rounded-3xl border-4 border-white/10 object-cover opacity-80 shadow-2xl" />
        </div>
      ))}

      {/* Volver */}
      <Link to="/" className="absolute left-4 top-4 z-20 inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-marfil/80 transition hover:bg-white/10 hover:text-white sm:left-6 sm:top-6">
        <ArrowLeft size={18} /> Volver a la tienda
      </Link>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"><BotonTema sobreOscuro /></div>

      {/* Tarjeta */}
      <div className={`relative z-10 w-full ${ancho} animate-aparecer`}>
        <div className="relative rounded-[2rem] bg-crema px-6 pb-8 pt-16 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/20 sm:px-10">
          <img
            src={logo}
            alt="Quesería de mi sin ti"
            className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[#F7F1E6] object-cover shadow-xl ring-4 ring-crema"
          />
          {children}
        </div>
        <p className="mt-6 text-center text-xs uppercase tracking-[0.24em] text-marfil/50">Quesería & productos artesanales</p>
      </div>
    </main>
  )
}
