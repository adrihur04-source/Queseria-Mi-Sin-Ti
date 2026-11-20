// SeccionesPortada.jsx — Secciones de historia para la portada pública
// QuienesSomos (historia de la marca), SabiasQue (carrusel de datos curiosos) e InvitaAmigo (programa de referidos).
// ✏️ La historia es un texto de ejemplo: ajústala con los datos reales de la tienda.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, HeartHandshake, Leaf, Sparkles, Share2, Percent, Coins, ArrowRight } from 'lucide-react'
import { useAparecer } from '../../hooks/useAparecer'
import Contador from '../Contador'
import { PUNTOS_POR_AMIGO, DESCUENTO_REFERIDO } from '../../utils/puntos'

const ANIOS = new Date().getFullYear() - 2015

export function QuienesSomos({ fotos = [], totalProductos = 0 }) {
  const ref = useAparecer()
  return (
    <section id="nosotros" ref={ref} className="revelar overflow-hidden py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
        {/* Collage */}
        <div className="relative mx-auto h-[420px] w-full max-w-md">
          <div className="absolute left-0 top-0 h-64 w-52 -rotate-6 overflow-hidden rounded-[2rem] bg-pergamino shadow-elevada transition duration-500 hover:rotate-0 hover:scale-105">
            {fotos[0] && <img src={fotos[0]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="absolute right-0 top-10 h-56 w-48 rotate-6 overflow-hidden rounded-[2rem] bg-pergamino shadow-elevada transition duration-500 hover:rotate-0 hover:scale-105">
            {fotos[1] && <img src={fotos[1]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="absolute bottom-0 left-16 h-56 w-56 -rotate-2 overflow-hidden rounded-[2rem] bg-pergamino shadow-elevada ring-8 ring-crema transition duration-500 hover:rotate-0 hover:scale-105">
            {fotos[2] && <img src={fotos[2]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="absolute -right-2 bottom-10 animate-flotar rounded-2xl bg-vino px-5 py-4 text-white shadow-elevada [--giro:4deg]">
            <p className="font-display text-3xl font-semibold">Desde 2015</p>
            <p className="text-xs text-white/70">hecho con amor en México</p>
          </div>
        </div>

        {/* Historia */}
        <div>
          <p className="sobretitulo">Quiénes somos</p>
          <h2 className="titulo-seccion mt-2">Una tienda que nació en la mesa de la abuela</h2>
          <div className="mt-5 space-y-4 leading-7 text-textoSecundario">
            <p>
              Todo empezó en 2015 con la receta de queso de la abuela Carmen y una pregunta: <em className="text-cacao">¿por qué es tan difícil encontrar productos artesanales mexicanos en un solo lugar?</em>
            </p>
            <p>
              Así nació <b className="text-cacao">Quesería de mi sin ti</b>: un rincón donde reunimos a productores de la región —queseros, cerveceros, maestros mezcaleros, dulceras y apicultores— que hacen las cosas como se hacían antes, sin prisas y con ingredientes de verdad.
            </p>
            <p>Cada producto que ves aquí lo probamos, lo conocemos y sabemos quién lo hizo. Cuando compras con nosotros, una familia mexicana sigue haciendo lo que ama.</p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              [<Contador key="a" valor={ANIOS} sufijo="+" />, 'años de tradición'],
              [<Contador key="b" valor={30} sufijo="+" />, 'productores locales'],
              [<Contador key="c" valor={totalProductos || 90} sufijo="+" />, 'productos artesanales'],
            ].map(([n, t], i) => (
              <div key={i} className="tarjeta p-4 text-center">
                <p className="font-display text-3xl font-semibold text-vino">{n}</p>
                <p className="text-xs text-textoSecundario">{t}</p>
              </div>
            ))}
          </div>

          <ul className="mt-6 flex flex-wrap gap-2">
            {[
              [Leaf, '100% artesanal'],
              [HeartHandshake, 'Comercio justo con productores'],
              [Sparkles, 'Recetas tradicionales'],
            ].map(([Icono, t]) => (
              <li key={t} className="flex items-center gap-1.5 rounded-full bg-oliva/10 px-3 py-1.5 text-sm font-medium text-oliva"><Icono size={15} /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// Datos verificables sobre queso, vino, agave y productos mexicanos
const DATOS = [
  { emoji: '🍷', tema: 'Vino', texto: 'La bodega más antigua de América está en México: Casa Madero, fundada en 1597 en Parras, Coahuila.' },
  { emoji: '🧀', tema: 'Queso', texto: 'Para hacer un kilo de queso se necesitan, en promedio, unos 10 litros de leche.' },
  { emoji: '🌵', tema: 'Agave', texto: 'Un agave puede tardar de 7 a más de 20 años en madurar antes de convertirse en mezcal.' },
  { emoji: '🌡️', tema: 'Servir', texto: 'El vino tinto se disfruta mejor entre 16 y 18 °C; el blanco y el rosado, entre 6 y 10 °C.' },
  { emoji: '⏰', tema: 'Truco', texto: 'Saca el queso del refrigerador 30 a 60 minutos antes de servirlo: a temperatura ambiente despierta todo su sabor.' },
  { emoji: '🍫', tema: 'Cacao', texto: 'El cacao es originario de Mesoamérica: los mexicas incluso lo usaban como moneda.' },
  { emoji: '🍯', tema: 'Miel', texto: 'La miel bien guardada prácticamente no caduca: se han encontrado tarros comestibles en tumbas egipcias.' },
  { emoji: '🍇', tema: 'Maridaje', texto: 'La grasa del queso suaviza los taninos del vino tinto: por eso se llevan tan bien.' },
  { emoji: '🌶️', tema: 'Chile', texto: 'Un jalapeño tiene entre 2,500 y 8,000 unidades Scoville; un habanero puede superar las 100,000.' },
]

export function SabiasQue() {
  const ref = useAparecer()
  const [i, setI] = useState(0)
  const [pausa, setPausa] = useState(false)

  useEffect(() => {
    if (pausa) return
    const t = setInterval(() => setI((x) => (x + 1) % DATOS.length), 6000)
    return () => clearInterval(t)
  }, [pausa])

  const ir = (d) => setI((x) => (x + d + DATOS.length) % DATOS.length)
  const dato = DATOS[i]

  return (
    <section id="sabias-que" ref={ref} className="revelar px-5 py-12">
      <div
        className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2A1A12] via-tinta to-vino-oscuro px-6 py-12 text-marfil shadow-elevada md:px-14"
        onMouseEnter={() => setPausa(true)}
        onMouseLeave={() => setPausa(false)}
      >
        <span className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 animate-deriva rounded-full bg-miel/25 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 animate-deriva rounded-full bg-vino/50 blur-3xl [animation-delay:-11s]" />
        <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <div key={`e${i}`} className="mx-auto flex h-32 w-32 animate-emerger items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 text-7xl backdrop-blur-sm md:h-40 md:w-40">
            {dato.emoji}
          </div>
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-miel-claro">¿Sabías que…? · {dato.tema}</p>
            <p key={`t${i}`} className="mt-3 min-h-[6rem] animate-aparecer font-display text-2xl leading-snug text-white sm:text-3xl">{dato.texto}</p>
            <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
              <button onClick={() => ir(-1)} aria-label="Dato anterior" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"><ChevronLeft size={18} /></button>
              <div className="flex gap-1.5">
                {DATOS.map((_, k) => (
                  <button key={k} onClick={() => setI(k)} aria-label={`Dato ${k + 1}`} className={`h-2 rounded-full transition-all duration-300 ${k === i ? 'w-7 bg-miel-claro' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
                ))}
              </div>
              <button onClick={() => ir(1)} aria-label="Siguiente dato" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function InvitaAmigo({ usuario }) {
  const ref = useAparecer()
  const navigate = useNavigate()
  const esCliente = usuario && (!usuario.role || usuario.role === 'cliente')
  const pasos = [
    [Share2, 'Comparte tu código', 'Lo encuentras en tu Club Quesero y lo mandas por WhatsApp.'],
    [Percent, `Tu amigo ahorra ${DESCUENTO_REFERIDO * 100}%`, 'En su primera compra, solo con escribir tu código.'],
    [Coins, `Tú ganas ${PUNTOS_POR_AMIGO} puntos`, 'Que se convierten en descuento para tus antojos.'],
  ]
  return (
    <section id="invita" ref={ref} className="revelar px-5 py-12">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-miel/30 bg-gradient-to-br from-miel/20 via-crema to-vino/15 p-8 md:p-12">
        <span className="pointer-events-none absolute -right-8 -top-10 animate-flotar text-[150px] opacity-20 [--giro:12deg]">🎁</span>
        <span className="pointer-events-none absolute bottom-4 right-1/3 animate-flotar text-6xl opacity-20 [--giro:-10deg] [animation-delay:-3s]">🧀</span>
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <p className="sobretitulo">Invita a un amigo</p>
            <h2 className="titulo-seccion mt-2">Compartir queso es compartir cariño</h2>
            <p className="mt-3 text-textoSecundario">Recomienda la quesería a quien quieras: tu amigo estrena con descuento y tú sumas puntos del Club Quesero.</p>
            <button onClick={() => navigate(esCliente ? '/recompensas' : '/registro')} className="btn-primario group mt-6 h-12 px-6">
              {esCliente ? 'Obtener mi código' : 'Crear cuenta y unirme'} <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </button>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {pasos.map(([Icono, t, d], k) => (
              <li key={t} className="escalonado tarjeta relative p-5">
                <span className="absolute right-4 top-3 font-display text-4xl font-semibold text-vino/10">{k + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-vino to-vino-oscuro text-white shadow-[0_10px_24px_-10px_rgb(var(--vino))]"><Icono size={22} /></span>
                <p className="mt-4 font-display text-lg font-semibold text-cacao">{t}</p>
                <p className="mt-1 text-sm text-textoSecundario">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
