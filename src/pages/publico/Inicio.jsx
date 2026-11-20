// Inicio.jsx — Portada pública (vitrina)
// Primera pantalla que ve cualquier visitante: muestra lo que se vende SIN pedir login.
// Comprar (carrito / apartar) sí requiere sesión; se invita a entrar desde la vista rápida.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { ArrowRight, X, ShoppingBag, Store, Wallet, Search, MapPin, Clock, Truck, Phone } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { estaCaducado } from '../../utils/caducidad'
import { obtenerImagen, vitrinaLocal } from '../../utils/imagenes'
import logo from '../../assets/logoficial.png'
import BotonTema from '../../components/BotonTema'
import Contador from '../../components/Contador'
import { useAparecer } from '../../hooks/useAparecer'
import { useConfigTienda } from '../../hooks/useConfigTienda'
import { QuienesSomos, SabiasQue, InvitaAmigo } from '../../components/publico/SeccionesPortada'

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61592518595144&locale=es_LA'
const INSTAGRAM_URL = 'https://www.instagram.com/queseriademisinti15/'
const MAX_VITRINA = 8

const dinero = (n) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })

const precioFinal = (p) =>
  p.enPromocion && p.descuentoPorcentaje > 0 ? p.precio * (1 - p.descuentoPorcentaje / 100) : p.precio

function rutaPanel(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'empleado') return '/empleado/dashboard'
  return '/catalogo'
}

export default function Inicio() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const config = useConfigTienda()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinAcceso, setSinAcceso] = useState(false)
  const [categoria, setCategoria] = useState('Todos')
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'productos'),
      (snap) => {
        const data = snap.docs
          .map((d) => {
            const p = { id: d.id, ...d.data() }
            return {
              ...p,
              precio: Number(p.precio) || 0,
              stock: Number(p.stock) || 0,
              descuentoPorcentaje: Number(p.descuentoPorcentaje) || 0,
            }
          })
          .filter((p) => p.nombre && p.activo !== false && p.visibleCatalogo !== false && !estaCaducado(p))
        setProductos(data)
        setSinAcceso(false)
        setCargando(false)
      },
      () => {
        // Reglas de Firestore no permiten lectura pública → vitrina con fotos locales
        setProductos(vitrinaLocal())
        setSinAcceso(true)
        setCargando(false)
      },
    )
    return () => unsub()
  }, [])

  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.categoria).filter(Boolean))
    return ['Todos', ...set]
  }, [productos])

  const vitrina = useMemo(() => {
    const lista = productos
      .filter((p) => categoria === 'Todos' || p.categoria === categoria)
      // Primero promociones, luego los que tienen foto, luego disponibles
      .sort(
        (a, b) =>
          Number(!!b.enPromocion) - Number(!!a.enPromocion) ||
          Number(!!obtenerImagen(b)) - Number(!!obtenerImagen(a)) ||
          Number(b.stock > 0) - Number(a.stock > 0),
      )
    return lista.slice(0, MAX_VITRINA)
  }, [productos, categoria])

  const enPromo = productos.filter((p) => p.enPromocion && p.descuentoPorcentaje > 0).length
  const conFoto = productos.filter((p) => obtenerImagen(p))
  const fotosHero = conFoto.map(obtenerImagen).slice(0, 4)
  const franja = conFoto.slice(0, 14)

  // Una foto representativa por categoría (la primera con imagen)
  const mosaico = useMemo(() => {
    const m = {}
    for (const p of productos) {
      if (!p.categoria) continue
      m[p.categoria] = m[p.categoria] || { nombre: p.categoria, imagen: null, total: 0 }
      m[p.categoria].total++
      if (!m[p.categoria].imagen) m[p.categoria].imagen = obtenerImagen(p)
    }
    return Object.values(m).filter((c) => c.imagen).sort((a, b) => b.total - a.total).slice(0, 7)
  }, [productos])

  const refCategorias = useAparecer()
  const refVitrina = useAparecer()
  const refPasos = useAparecer()
  const refVisita = useAparecer()

  return (
    <div className="min-h-screen bg-crema text-textoPrincipal">
      {/* ── Encabezado ───────────────────────────── */}
      <header className="sticky top-0 z-40 px-3 pt-3 md:px-5">
        <div className="vidrio mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5">
          <a href="#inicio" className="flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-xl bg-[#F7F1E6] object-cover ring-1 ring-borde" />
            <span className="font-display text-lg font-semibold leading-tight text-cacao">
              Quesería <span className="hidden sm:inline">de mi sin ti</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-textoSecundario md:flex">
            <a href="#productos" className="hover:text-vino">Productos</a>
            <a href="#nosotros" className="hover:text-vino">Nosotros</a>
            <a href="#como-funciona" className="hover:text-vino">Cómo comprar</a>
            <a href="#visitanos" className="hover:text-vino">Visítanos</a>
          </nav>

          <div className="flex items-center gap-1">
          <BotonTema />
          {usuario ? (
            <button onClick={() => navigate(rutaPanel(usuario.role))} className="btn-primario py-2.5">
              Mi cuenta <ArrowRight size={16} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/login')} className="btn-fantasma py-2.5">Entrar</button>
              <button onClick={() => navigate('/registro')} className="btn-primario hidden py-2.5 sm:inline-flex">
                Crear cuenta
              </button>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section id="inicio" className="relative -mt-[76px] overflow-hidden bg-vino-oscuro text-marfil">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_90%_at_20%_0%,#8E3550_0%,#4C1028_50%,#2A0915_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-10 h-96 w-96 animate-brillo rounded-full bg-miel/30 blur-[110px]" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 animate-brillo rounded-full bg-vino-claro/40 blur-[100px] [animation-delay:-4s]" />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full border border-miel-claro/20" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#F7F1E6_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-32 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-40">
          <div className="animate-aparecer">
            <span className="vidrio-vino inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-miel-claro">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-miel-claro" /> Quesería & productos artesanales
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Sabores honestos,{' '}
              <span className="bg-gradient-to-r from-miel-claro via-[#F3D9A4] to-miel-claro bg-clip-text italic text-transparent">de nuestra mesa</span>{' '}
              a la tuya.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-marfil/75">
              Quesos, destilados, cervezas, licores y dulces hechos por manos locales. Aparta en línea y paga al recoger.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#productos" className="btn group bg-marfil px-7 py-4 text-base text-[#4C1028] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] hover:bg-white">
                Ver productos <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </a>
              {!usuario && (
                <button onClick={() => navigate('/registro')} className="btn vidrio-vino px-7 py-4 text-base text-marfil hover:bg-white/15">
                  Crear mi cuenta
                </button>
              )}
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-3">
              {[
                ['Productos', sinAcceso || cargando ? '+100' : productos.length],
                ['Categorías', sinAcceso || cargando ? '+10' : categorias.length - 1],
                ['En promoción', sinAcceso || cargando ? '—' : enPromo],
              ].map(([k, v]) => (
                <div key={k} className="vidrio-vino rounded-2xl px-4 py-3 transition duration-300 hover:-translate-y-1">
                  <dt className="text-xs text-marfil/70">{k}</dt>
                  <dd className="font-display text-3xl font-semibold text-white"><Contador valor={v} /></dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Collage flotante */}
          <div className="relative mx-auto h-[22rem] w-full max-w-md animate-aparecer [animation-delay:150ms] sm:h-[28rem]">
            {/* Logo cuadrado en marco de cristal (liquid glass) */}
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <span aria-hidden className="absolute -inset-12 animate-brillo rounded-full bg-miel-claro/25 blur-3xl" />
              <div className="vidrio-vino reflejo relative overflow-hidden rounded-[2.5rem] p-3.5 transition duration-500 hover:scale-[1.03]">
                <img src={logo} alt="Quesería de mi sin ti" className="relative h-52 w-52 rounded-[1.9rem] bg-[#F7F1E6] object-cover shadow-[0_20px_40px_-16px_rgba(0,0,0,0.6)] sm:h-60 sm:w-60" />
              </div>
            </div>
            {fotosHero.map((src, i) => (
              <div
                key={src}
                className={`absolute animate-flotar ${
                  [
                    'left-0 top-2 h-28 w-28 [--giro:-8deg] sm:h-36 sm:w-36',
                    'right-0 top-8 h-24 w-24 [--giro:7deg] [animation-delay:-2s] sm:h-32 sm:w-32',
                    'bottom-4 left-4 h-24 w-24 [--giro:5deg] [animation-delay:-4s] sm:h-28 sm:w-28',
                    'bottom-0 right-6 h-28 w-28 [--giro:-6deg] [animation-delay:-1s] sm:h-36 sm:w-36',
                  ][i]
                }`}
              >
                <div className="vidrio-vino h-full w-full rounded-[1.75rem] p-2">
                  <img src={src} alt="" className="h-full w-full rounded-[1.25rem] object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Onda inferior */}
        <svg className="absolute -bottom-px left-0 w-full text-crema" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0 60V30C240 0 480 0 720 22s480 38 720 8v30H0Z" />
        </svg>
      </section>

      {/* ── Franja de productos en movimiento ───── */}
      {franja.length > 3 && (
        <section aria-label="Algunos de nuestros productos" className="relative overflow-hidden py-8 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex w-max animate-desplazar gap-4 hover:[animation-play-state:paused]">
            {[...franja, ...franja].map((p, i) => (
              <button
                key={`${p.id}-${i}`}
                onClick={() => setSeleccionado(p)}
                tabIndex={i < franja.length ? 0 : -1}
                className="flex shrink-0 items-center gap-3 rounded-full border border-borde/70 bg-superficie py-2 pl-2 pr-5 shadow-tarjeta transition hover:-translate-y-0.5 hover:border-vino/40"
              >
                <img src={obtenerImagen(p)} alt="" className="h-11 w-11 rounded-full object-cover" />
                <span className="text-sm font-medium text-cacao">{p.nombre}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Categorías en mosaico ───────────────── */}
      {mosaico.length >= 3 && (
        <section ref={refCategorias} className="revelar mx-auto max-w-6xl px-5 pb-6 pt-4">
          <p className="sobretitulo mb-2">Explora</p>
          <h2 className="titulo-seccion mb-6">Por categoría</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mosaico.map(({ nombre, imagen, total }, i) => (
              <button
                key={nombre}
                onClick={() => {
                  setCategoria(nombre)
                  document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`escalonado group relative overflow-hidden rounded-3xl text-left ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:col-span-1 lg:col-span-2' : 'aspect-[4/3]'}`}
              >
                <img src={imagen} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className={`block font-display font-semibold text-white ${i === 0 ? 'text-3xl' : 'text-xl'}`}>{nombre}</span>
                  <span className="text-xs text-white/80">{total} producto{total === 1 ? '' : 's'} →</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      {/* ── Vitrina de productos ─────────────────── */}
      <section id="productos" ref={refVitrina} className="revelar py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="sobretitulo mb-2">Vitrina</p>
              <h2 className="titulo-seccion">Lo que encontrarás hoy</h2>
            </div>
            <button
              onClick={() => navigate(usuario ? '/catalogo' : '/login')}
              className="btn-secundario"
            >
              <Search size={16} /> Ver catálogo completo
            </button>
          </div>

          {categorias.length > 1 && (
            <div className="scrollbar-hide -mx-5 mb-8 flex gap-2 overflow-x-auto px-5">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={categoria === c ? 'chip-activo' : 'chip-inactivo'}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {cargando ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="tarjeta animate-pulse overflow-hidden">
                  <div className="aspect-square bg-pergamino" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-3/4 rounded bg-pergamino" />
                    <div className="h-3 w-1/3 rounded bg-pergamino" />
                  </div>
                </div>
              ))}
            </div>
          ) : vitrina.length === 0 ? (
            <p className="py-12 text-center text-textoSecundario">Pronto tendremos productos aquí.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {vitrina.map((p) => (
                <TarjetaProducto key={p.id} producto={p} onAbrir={() => setSeleccionado(p)} />
              ))}
            </div>
          )}

          {sinAcceso && (
            <p className="mt-8 text-center text-sm text-textoSecundario">
              Inicia sesión para ver precios y disponibilidad en tiempo real.
            </p>
          )}
        </div>
      </section>

      {/* ── Quiénes somos + ¿Sabías que? ───────── */}
      <QuienesSomos fotos={conFoto.map(obtenerImagen).slice(4, 7)} totalProductos={productos.length} />
      <SabiasQue />

      {/* ── Cómo comprar ─────────────────────────── */}
      <section id="como-funciona" ref={refPasos} className="revelar py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="sobretitulo mb-2">Así de fácil</p>
          <h2 className="titulo-seccion mb-10">Cómo comprar</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {[
              { icono: ShoppingBag, titulo: 'Elige tus productos', texto: 'Explora el catálogo, revisa promociones y agrega lo que se te antoje al carrito.' },
              { icono: Store, titulo: 'Aparta tu pedido', texto: 'Confirma tu pedido desde la app. Te avisamos cuando esté listo para recoger.' },
              { icono: Wallet, titulo: 'Paga al recoger', texto: 'Pasa a la tienda, paga en caja y llévate tus productos. Sin pagos en línea.' },
            ].map(({ icono: Icono, titulo, texto }, i) => (
              <li key={titulo} className="escalonado tarjeta p-6 transition hover:-translate-y-1 hover:shadow-elevada">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-vino/10 text-vino">
                    <Icono size={22} />
                  </span>
                  <span className="font-display text-4xl font-semibold text-pergamino">0{i + 1}</span>
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-cacao">{titulo}</h3>
                <p className="text-sm leading-6 text-textoSecundario">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Invita a un amigo ───────────────────── */}
      <InvitaAmigo usuario={usuario} />

      {/* ── Visítanos / CTA ──────────────────────── */}
      <section id="visitanos" ref={refVisita} className="revelar px-5 pb-16">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-vino-oscuro px-8 py-14 text-marfil md:px-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-miel-claro/30" />
          <div className="pointer-events-none absolute -bottom-32 right-40 h-96 w-96 rounded-full border border-miel-claro/20" />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-miel-claro">Visítanos</p>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">Te esperamos en la tienda</h2>
              <p className="mt-4 max-w-md leading-7 text-marfil/75">
                Prueba, pregunta y descubre maridajes. Síguenos para enterarte de productos nuevos y promociones.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn border border-marfil/30 text-marfil hover:bg-marfil/10">
                  Instagram
                </a>
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="btn border border-marfil/30 text-marfil hover:bg-marfil/10">
                  Facebook
                </a>
              </div>
            </div>
            <ul className="space-y-4 text-sm">
              {/* Datos editables desde Admin → Ajustes */}
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-miel-claro" /> {config.direccion}</li>
              <li className="flex gap-3"><Clock size={18} className="mt-0.5 shrink-0 text-miel-claro" /> {config.horario}</li>
              {config.telefono && <li className="flex gap-3"><Phone size={18} className="mt-0.5 shrink-0 text-miel-claro" /> <a href={`tel:${config.telefono}`} className="hover:underline">{config.telefono}</a></li>}
              {config.envioActivo && (
                <li className="flex gap-3">
                  <Truck size={18} className="mt-0.5 shrink-0 text-miel-claro" />
                  <span>Envío a domicilio{Number(config.envioGratisDesde) > 0 ? <> · <b className="text-miel-claro">gratis desde {dinero(config.envioGratisDesde)}</b></> : ''}</span>
                </li>
              )}
              {!usuario && (
                <li className="pt-4">
                  <button onClick={() => navigate('/registro')} className="btn bg-marfil text-[#4C1028] hover:bg-white">
                    Crear cuenta gratis <ArrowRight size={16} />
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-borde/60 py-8 text-center text-xs text-textoSecundario">
        © {new Date().getFullYear()} Quesería de mi sin ti · Productos artesanales
      </footer>

      {seleccionado && (
        <VistaRapida
          producto={seleccionado}
          usuario={usuario}
          onCerrar={() => setSeleccionado(null)}
          onComprar={() =>
            navigate(usuario ? (seleccionado.local ? '/catalogo' : `/catalogo/${seleccionado.id}`) : '/login')
          }
        />
      )}
    </div>
  )
}

function TarjetaProducto({ producto: p, onAbrir }) {
  const img = obtenerImagen(p)
  const promo = p.enPromocion && p.descuentoPorcentaje > 0
  const [rota, setRota] = useState(false)
  if (rota && p.local) return null // foto de respaldo vacía/dañada

  return (
    <button onClick={onAbrir} className="tarjeta group overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-elevada">
      <div className="relative aspect-square overflow-hidden bg-pergamino">
        {img && !rota ? (
          <img
            src={img}
            alt={p.nombre}
            loading="lazy"
            onError={() => setRota(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-cacao/25">
            {p.nombre?.[0]}
          </div>
        )}
        {promo && (
          <span className="absolute left-3 top-3 rounded-full bg-vino px-2.5 py-1 text-xs font-semibold text-white">
            -{p.descuentoPorcentaje}%
          </span>
        )}
        {!p.local && p.stock === 0 && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-tinta/80 py-1 text-center text-xs font-semibold text-white">
            Agotado
          </span>
        )}
      </div>
      <div className="p-4">
        {p.categoria && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-oliva">{p.categoria}</p>}
        <p className="line-clamp-2 font-medium leading-snug text-cacao">{p.nombre}</p>
        {!p.local && (
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-semibold text-vino">{dinero(precioFinal(p))}</span>
            {promo && <span className="text-xs text-textoSecundario line-through">{dinero(p.precio)}</span>}
          </div>
        )}
      </div>
    </button>
  )
}

function VistaRapida({ producto: p, usuario, onCerrar, onComprar }) {
  const img = obtenerImagen(p)
  const promo = p.enPromocion && p.descuentoPorcentaje > 0

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={p.nombre}
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-3xl animate-aparecer overflow-hidden rounded-t-3xl bg-superficie sm:grid-cols-2 sm:rounded-3xl"
      >
        <button onClick={onCerrar} aria-label="Cerrar" className="absolute right-3 top-3 z-10 rounded-full bg-superficie/90 p-2 text-cacao shadow">
          <X size={18} />
        </button>
        <div className="aspect-square bg-pergamino sm:aspect-auto">
          {img && <img src={img} alt={p.nombre} className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          {p.categoria && <p className="sobretitulo mb-2 text-oliva">{p.categoria}</p>}
          <h3 className="font-display text-2xl font-semibold text-cacao">{p.nombre}</h3>
          {p.marca && <p className="mt-1 text-sm text-textoSecundario">{p.marca}</p>}
          {p.descripcion && <p className="mt-4 text-sm leading-6 text-textoSecundario">{p.descripcion}</p>}
          {p.presentacion && <p className="mt-3 text-sm text-textoSecundario">Presentación: {p.presentacion}</p>}

          {!p.local && (
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl font-semibold text-vino">{dinero(precioFinal(p))}</span>
              {promo && <span className="text-sm text-textoSecundario line-through">{dinero(p.precio)}</span>}
            </div>
          )}

          <div className="mt-auto pt-8">
            <button onClick={onComprar} className="btn-primario w-full py-3.5">
              {usuario ? 'Ver y agregar al carrito' : 'Inicia sesión para apartar'} <ArrowRight size={16} />
            </button>
            {!usuario && (
              <p className="mt-3 text-center text-xs text-textoSecundario">Pagas en tienda al recoger tu pedido.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
