// Recompensas.jsx — "Club Quesero": puntos, niveles e invita a un amigo
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Share2, MessageCircle, Gift, ShoppingBag, Users, Trophy, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useClub } from '../../hooks/useClub'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import BottomNav from '../../components/layout/BottomNav'
import Contador from '../../components/Contador'
import Avatar from '../../components/Avatar'
import { NIVELES, VALOR_PUNTO, PUNTOS_POR_AMIGO, DESCUENTO_REFERIDO, TOPE_REFERIDO } from '../../utils/puntos'
import { dinero, fechaRelativa } from '../../utils/formato'
import { confeti } from '../../utils/efectos'

export default function Recompensas() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const club = useClub()
  const [copiado, setCopiado] = useState(false)

  const enlace = `${window.location.origin}/registro?ref=${club.codigo}`
  const mensaje = `¡Te regalo ${DESCUENTO_REFERIDO * 100}% de descuento en Quesería de mi sin ti! 🧀🍷 Usa mi código ${club.codigo} en tu primera compra: ${enlace}`
  const progreso = club.siguiente ? ((club.ganados - club.nivel.desde) / (club.siguiente.desde - club.nivel.desde)) * 100 : 100

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(club.codigo)
      setCopiado(true)
      confeti({ cantidad: 40 })
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sin permiso de portapapeles */
    }
  }
  const compartir = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Quesería de mi sin ti', text: mensaje, url: enlace })
      } catch {
        /* cancelado */
      }
    } else copiar()
  }

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda titulo="Club Quesero" />
      <main className="mx-auto max-w-4xl space-y-6 px-4 pt-6 md:px-6">
        {/* Tarjeta de membresía */}
        <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${club.nivel.color} p-6 text-white shadow-elevada md:p-8`}>
          <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 animate-deriva rounded-full bg-white/15 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-72 animate-deriva rounded-full bg-miel-claro/25 blur-3xl [animation-delay:-8s]" />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgb(255_255_255/0.12)_50%,transparent_60%)] bg-[length:250%_100%] animate-[brilloTarjeta_6s_ease-in-out_infinite]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar usuario={usuario} tam="h-12 w-12" className="ring-2 ring-white/30" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">Club Quesero</p>
                <p className="font-display text-xl font-semibold">{usuario?.nombre || 'Miembro'}</p>
              </div>
            </div>
            <span className="text-5xl drop-shadow-lg">{club.nivel.emoji}</span>
          </div>
          <div className="relative mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-white/70">Puntos disponibles</p>
              <p className="font-display text-5xl font-semibold sm:text-6xl"><Contador valor={club.disponibles} /></p>
              <p className="text-sm text-white/80">= {dinero(club.disponibles * VALOR_PUNTO)} para tu próxima compra</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Nivel</p>
              <p className="font-display text-2xl font-semibold">{club.nivel.nombre}</p>
            </div>
          </div>
          <div className="relative mt-5">
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-miel-claro to-white transition-all duration-1000" style={{ width: `${Math.max(4, progreso)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/80">
              {club.siguiente ? <>Te faltan <b>{club.siguiente.desde - club.ganados} puntos</b> para ser <b>{club.siguiente.nombre} {club.siguiente.emoji}</b></> : '¡Llegaste al nivel más alto! 👑'}
            </p>
          </div>
        </section>

        {/* Cómo ganar */}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            [ShoppingBag, 'Compra', '1 punto por cada $10 en pedidos entregados', `${club.porCompras} pts ganados`],
            [Users, 'Invita amigos', `${PUNTOS_POR_AMIGO} puntos por cada amigo que compre con tu código`, `${club.porAmigos} pts ganados`],
            [Gift, 'Canjea', '100 puntos = $10 de descuento. Úsalos en tu carrito', `${club.disponibles} pts disponibles`],
          ].map(([Icono, t, d, extra]) => (
            <div key={t} className="tarjeta group p-5 transition hover:-translate-y-1 hover:shadow-elevada">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-vino/10 text-vino transition group-hover:rotate-6 group-hover:bg-vino group-hover:text-white"><Icono size={20} /></span>
              <p className="mt-3 font-display text-lg font-semibold text-cacao">{t}</p>
              <p className="text-sm text-textoSecundario">{d}</p>
              <p className="mt-2 text-xs font-semibold text-vino">{extra}</p>
            </div>
          ))}
        </section>

        {/* Invita a un amigo */}
        <section id="invitar" className="relative overflow-hidden rounded-[2rem] border border-miel/30 bg-gradient-to-br from-miel/15 via-superficie to-vino/10 p-6 md:p-8">
          <span className="pointer-events-none absolute -right-6 -top-6 text-[120px] opacity-10">🎁</span>
          <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <p className="sobretitulo">Invita a un amigo</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-cacao">Tú ganas {PUNTOS_POR_AMIGO} puntos, tu amigo {DESCUENTO_REFERIDO * 100}% de descuento</h2>
              <p className="mt-2 text-sm text-textoSecundario">Comparte tu código. Tu amigo lo escribe en su carrito en su primera compra (hasta {dinero(TOPE_REFERIDO)} de descuento) y tú recibes tus puntos al instante.</p>
            </div>
            <div className="space-y-3">
              <button onClick={copiar} className="group flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-vino/40 bg-superficie px-5 py-4 transition hover:border-vino">
                <span className="font-display text-2xl font-semibold tracking-[0.15em] text-vino">{club.codigo}</span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${copiado ? 'text-exito' : 'text-textoSecundario group-hover:text-vino'}`}>{copiado ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar</>}</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className="btn h-12 bg-[#1F8F4E] text-white hover:brightness-110"><MessageCircle size={18} /> WhatsApp</a>
                <button onClick={compartir} className="btn-secundario h-12"><Share2 size={18} /> Compartir</button>
              </div>
            </div>
          </div>
          {club.amigos.length > 0 && (
            <div className="relative mt-6 border-t border-borde/60 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-textoSecundario">Amigos que se unieron ({club.amigos.length})</p>
              <ul className="flex flex-wrap gap-2">
                {club.amigos.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-full bg-superficie py-1 pl-1 pr-3 text-sm shadow-tarjeta">
                    <Avatar usuario={{ nombre: a.amigoNombre }} tam="h-7 w-7" texto="text-[10px]" />
                    <span className="text-cacao">{a.amigoNombre?.split(' ')[0] || 'Amigo'}</span>
                    <span className="text-xs text-exito">+{PUNTOS_POR_AMIGO}</span>
                    <span className="hidden text-xs text-textoSecundario sm:inline">· {fechaRelativa(a.creado)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Niveles */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-2xl font-semibold text-cacao"><Trophy size={22} className="text-miel" /> Niveles y beneficios</h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NIVELES.map((n) => {
              const logrado = club.ganados >= n.desde
              const actual = n.id === club.nivel.id
              return (
                <li key={n.id} className={`relative overflow-hidden rounded-2xl p-4 transition ${actual ? `bg-gradient-to-br ${n.color} text-white shadow-elevada ring-4 ring-miel/30` : 'tarjeta'} ${!logrado ? 'opacity-70' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{n.emoji}</span>
                    {!logrado && <Lock size={16} className="text-textoSecundario" />}
                    {actual && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">Tu nivel</span>}
                  </div>
                  <p className={`mt-2 font-display text-lg font-semibold ${actual ? '' : 'text-cacao'}`}>{n.nombre}</p>
                  <p className={`text-xs ${actual ? 'text-white/70' : 'text-textoSecundario'}`}>Desde {n.desde} pts</p>
                  <ul className={`mt-3 space-y-1 text-xs ${actual ? 'text-white/90' : 'text-textoSecundario'}`}>
                    {n.beneficios.map((b) => <li key={b} className="flex gap-1.5"><Check size={13} className="mt-0.5 shrink-0" /> {b}</li>)}
                  </ul>
                </li>
              )
            })}
          </ol>
        </section>

        <button onClick={() => navigate('/catalogo')} className="btn-primario h-12 w-full sm:w-auto">Ganar puntos comprando <ArrowRight size={16} /></button>
      </main>
      <BottomNav />
    </div>
  )
}
