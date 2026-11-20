// Asistente.jsx — "Quesi", asistente quesero (chat local, sin IA externa)
// Recomienda combinaciones y maridajes con los productos REALES de la tienda,
// arma tablas por ocasión/personas/presupuesto y agrega todo al carrito.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, Plus, Check, ShoppingBag, Sparkles, RotateCcw } from 'lucide-react'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import { useConfigTienda } from '../../hooks/useConfigTienda'
import { useCarrito } from '../../context/CarritoContext'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero } from '../../utils/formato'
import { precioUnitario, tienePromo } from '../../utils/precio'
import { armarCombo, paraBebida, buscar, intencion, porIntensidad, MARIDAJES, OCASIONES } from '../../utils/recomendador'
import logo from '../../assets/logoficial.png'

const MENU = [
  { label: '🧀 Armar una tabla', valor: 'tabla' },
  { label: '🍷 ¿Qué va con mi bebida?', valor: 'maridaje' },
  { label: '✨ Recomiéndame algo', valor: 'recomendar' },
  { label: '🏷️ Promociones', valor: 'promos' },
  { label: '🛵 Envío a domicilio', valor: 'envio' },
]
const PERSONAS = [
  { label: '2 personas', valor: 2 },
  { label: '4 personas', valor: 4 },
  { label: '6–8 personas', valor: 7 },
  { label: '10 o más', valor: 12 },
]
const PRESUPUESTOS = [
  { label: 'Hasta $300', valor: 300 },
  { label: 'Hasta $600', valor: 600 },
  { label: 'Hasta $1,000', valor: 1000 },
  { label: 'Sin límite', valor: Infinity },
]
const BEBIDAS = Object.entries(MARIDAJES).map(([k, m]) => ({ label: `${m.emoji} ${m.nombre}`, valor: k }))

let siguienteId = 1
const nuevoId = () => siguienteId++

export default function Asistente({ abajo = 'bottom-[5.5rem] md:bottom-6' }) {
  const navigate = useNavigate()
  const { productos } = useProductosTienda()
  const config = useConfigTienda()
  const { agregarAlCarrito, abrirCarrito } = useCarrito()

  const [abierto, setAbierto] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [escribiendo, setEscribiendo] = useState(false)
  const [texto, setTexto] = useState('')
  const [agregados, setAgregados] = useState({}) // ids agregados desde el chat
  const flujo = useRef({ paso: null, datos: {} })
  const cola = useRef(Promise.resolve())
  const semilla = useRef(1)
  const finRef = useRef(null)
  const inputRef = useRef(null)

  // Burbuja de invitación (una vez por visitante)
  useEffect(() => {
    if (localStorage.getItem('quesi-visto')) return
    const t = setTimeout(() => setTeaser(true), 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, escribiendo])

  useEffect(() => {
    if (!abierto) return
    const esc = (e) => e.key === 'Escape' && setAbierto(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [abierto])

  // El bot "escribe" un momento antes de cada mensaje
  const decir = (...mensajes) => {
    cola.current = cola.current.then(async () => {
      for (const m of mensajes) {
        setEscribiendo(true)
        await new Promise((r) => setTimeout(r, Math.min(1100, 420 + (m.texto?.length || 0) * 6)))
        setEscribiendo(false)
        setMsgs((prev) => [...prev, { id: nuevoId(), de: 'bot', ...m }])
      }
    })
  }

  const abrir = () => {
    setAbierto(true)
    setTeaser(false)
    localStorage.setItem('quesi-visto', '1')
    if (!msgs.length) {
      decir(
        { texto: '¡Hola! Soy Quesi 🧀, tu asistente quesero.' },
        { texto: 'Te ayudo a armar una tabla, elegir qué va con tu bebida o encontrar algo rico. ¿Por dónde empezamos?', opciones: MENU },
      )
    }
    setTimeout(() => inputRef.current?.focus(), 350)
  }

  const yo = (t) => setMsgs((prev) => [...prev, { id: nuevoId(), de: 'yo', texto: t }])

  const proponerCombo = (semilla) => {
    const d = flujo.current.datos
    const combo = armarCombo(productos, { ...d, semilla })
    flujo.current = { paso: 'combo', datos: d }
    if (!combo.lineas.length) {
      return decir({ texto: 'Ups, ahorita no tengo suficientes productos disponibles para armar una tabla. ¿Vemos el catálogo?', opciones: [{ label: 'Ir al catálogo', valor: 'ir-catalogo' }, ...MENU.slice(1, 3)] })
    }
    const occ = OCASIONES[d.ocasion]
    decir(
      { texto: `Listo, esta es mi propuesta para ${occ ? occ.nombre.toLowerCase() : 'tu tabla'} de ${d.personas >= 12 ? '10+' : d.personas} personas ${occ?.emoji || ''}` },
      {
        combo,
        texto: combo.consejo || (combo.excede ? 'Es lo más cercano a tu presupuesto que puedo armar.' : 'Variedad de intensidades para que todos encuentren su favorito.'),
        opciones: [
          { label: '🔄 Otra opción', valor: 'otra' },
          { label: '🍷 Cambiar bebida', valor: 'cambiar-bebida' },
          { label: '↩︎ Menú', valor: 'menu' },
        ],
      },
    )
  }

  const responder = (valor, etiqueta) => {
    if (etiqueta) yo(etiqueta)
    const { paso, datos } = flujo.current

    // ── Pasos del armado de tabla ──
    if (paso === 'ocasion' && OCASIONES[valor]) {
      flujo.current = { paso: 'personas', datos: { ...datos, ocasion: valor } }
      return decir({ texto: '¡Qué buen plan! ¿Para cuántas personas?', opciones: PERSONAS })
    }
    if (paso === 'personas' && typeof valor === 'number') {
      flujo.current = { paso: 'presupuesto', datos: { ...datos, personas: valor } }
      return decir({ texto: '¿Cuánto quieres gastar más o menos?', opciones: PRESUPUESTOS })
    }
    if (paso === 'presupuesto' && typeof valor === 'number') {
      flujo.current = { paso: 'bebida-tabla', datos: { ...datos, presupuesto: valor } }
      return decir({ texto: 'Última: ¿con qué lo van a acompañar?', opciones: [...BEBIDAS, { label: '🚫 Sin bebida', valor: 'sin' }] })
    }
    if (paso === 'bebida-tabla' && (MARIDAJES[valor] || valor === 'sin')) {
      flujo.current.datos = { ...datos, bebida: valor === 'sin' ? null : valor }
      return proponerCombo()
    }
    if (paso === 'bebida-sola' && MARIDAJES[valor]) {
      flujo.current = { paso: null, datos: {} }
      const m = MARIDAJES[valor]
      const lista = paraBebida(productos, valor)
      return decir(
        { texto: `${m.emoji} ${m.consejo}` },
        lista.length
          ? { texto: 'De lo que tenemos hoy, te recomiendo:', productos: lista, opciones: [{ label: '🧀 Armar tabla completa', valor: 'tabla' }, { label: '↩︎ Menú', valor: 'menu' }] }
          : { texto: 'Hoy no tengo opciones ideales para esa bebida, pero mira el catálogo completo.', opciones: [{ label: 'Ir al catálogo', valor: 'ir-catalogo' }, { label: '↩︎ Menú', valor: 'menu' }] },
      )
    }

    // ── Acciones ──
    switch (valor) {
      case 'menu':
        flujo.current = { paso: null, datos: {} }
        return decir({ texto: '¿En qué más te ayudo?', opciones: MENU })
      case 'tabla':
        flujo.current = { paso: 'ocasion', datos: {} }
        return decir({ texto: '¡Me encanta armar tablas! ¿Para qué ocasión es?', opciones: Object.entries(OCASIONES).map(([k, o]) => ({ label: `${o.emoji} ${o.nombre}`, valor: k })) })
      case 'maridaje':
        flujo.current = { paso: 'bebida-sola', datos: {} }
        return decir({ texto: '¿Qué vas a tomar?', opciones: BEBIDAS })
      case 'otra':
        semilla.current += 7919
        return proponerCombo(semilla.current)
      case 'cambiar-bebida':
        flujo.current = { paso: 'bebida-tabla', datos: flujo.current.datos }
        return decir({ texto: '¿Con qué bebida entonces?', opciones: [...BEBIDAS, { label: '🚫 Sin bebida', valor: 'sin' }] })
      case 'recomendar': {
        const promos = productos.filter((p) => p.stock > 0 && tienePromo(p))
        const resto = productos.filter((p) => p.stock > 0 && !tienePromo(p)).sort(() => Math.random() - 0.5)
        const lista = [...promos.slice(0, 2), ...resto].slice(0, 4)
        return decir({ texto: lista.length ? 'Estos son mis favoritos de hoy 😋' : 'Ahorita estamos reabasteciendo, vuelve pronto.', productos: lista, opciones: [{ label: '🧀 Armar una tabla', valor: 'tabla' }, { label: '↩︎ Menú', valor: 'menu' }] })
      }
      case 'promos': {
        const lista = productos.filter((p) => p.stock > 0 && tienePromo(p)).slice(0, 6)
        return decir(
          lista.length
            ? { texto: `Hay ${lista.length} producto${lista.length === 1 ? '' : 's'} con descuento ahora mismo 🏷️`, productos: lista, opciones: [{ label: 'Ver todas', valor: 'ir-promos' }, { label: '↩︎ Menú', valor: 'menu' }] }
            : { texto: 'Hoy no hay promociones activas, pero te recomiendo algo rico.', opciones: [{ label: '✨ Recomiéndame algo', valor: 'recomendar' }] },
        )
      }
      case 'envio':
        return decir(
          config.envioActivo
            ? {
                texto: `¡Sí llevamos a domicilio! 🛵 ${config.envioZona}. El envío cuesta ${Number(config.envioCosto) ? dinero(config.envioCosto) : 'nada'}${Number(config.envioGratisDesde) ? ` y es GRATIS desde ${dinero(config.envioGratisDesde)}` : ''}. Llega en ${config.envioTiempo} y pagas al recibir. Elige "A domicilio" en tu carrito.`,
                opciones: [{ label: '🧀 Armar una tabla', valor: 'tabla' }, { label: '↩︎ Menú', valor: 'menu' }],
              }
            : { texto: 'Por ahora solo entregamos en tienda: apartas aquí y recoges con tu folio.', opciones: [{ label: '↩︎ Menú', valor: 'menu' }] },
        )
      case 'tienda':
        return decir({ texto: `📍 ${config.direccion}\n🕘 ${config.horario}${config.telefono ? `\n📞 ${config.telefono}` : ''}`, opciones: [{ label: '↩︎ Menú', valor: 'menu' }] })
      case 'ir-catalogo':
        setAbierto(false)
        return navigate('/catalogo')
      case 'ir-promos':
        setAbierto(false)
        return navigate('/promociones')
      case 'ver-carrito':
        setAbierto(false)
        return abrirCarrito()
      default:
    }
  }

  // Texto libre → intención
  const enviar = (e) => {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setTexto('')
    yo(t)
    const { paso } = flujo.current
    // Si está en medio de un paso numérico y escribe un número, úsalo
    const num = Number(t.replace(/[^\d]/g, ''))
    if (paso === 'personas' && num) return responder(num)
    if (paso === 'presupuesto' && num) return responder(num)

    const it = intencion(t)
    switch (it.tipo) {
      case 'saludo':
        return decir({ texto: '¡Hola! 👋 ¿Qué se te antoja hoy?', opciones: MENU })
      case 'gracias':
        return decir({ texto: '¡Con gusto! Que lo disfrutes 🧀', opciones: [{ label: '↩︎ Menú', valor: 'menu' }] })
      case 'maridaje':
        flujo.current = { paso: 'bebida-sola', datos: {} }
        return responder(it.bebida)
      case 'intensidad': {
        const lista = porIntensidad(productos, it.valor)
        return decir({ texto: it.valor === 'fuerte' ? 'Para paladares intensos 💪' : 'Suaves y cremosos 🤍', productos: lista.length ? lista : buscar(productos, t), opciones: [{ label: '↩︎ Menú', valor: 'menu' }] })
      }
      case 'buscar': {
        const lista = buscar(productos, t)
        return decir(
          lista.length
            ? { texto: 'Encontré esto para ti:', productos: lista, opciones: [{ label: '↩︎ Menú', valor: 'menu' }] }
            : { texto: 'Mmm, no encontré eso 🤔. Prueba con el nombre de un queso o elige una opción:', opciones: MENU },
        )
      }
      default:
        return responder(it.tipo)
    }
  }

  const agregar = (p, cantidad = 1) => {
    agregarAlCarrito(p, cantidad)
    setAgregados((a) => ({ ...a, [p.id]: true }))
    window.dispatchEvent(new Event('carrito:latido'))
  }

  const agregarCombo = (combo) => {
    combo.lineas.forEach((l) => agregar(l.producto, l.cantidad))
    yo('Agregar todo al carrito')
    decir({ texto: `¡Listo! Agregué ${combo.lineas.length} productos a tu carrito 🛒`, opciones: [{ label: '🛒 Ver carrito', valor: 'ver-carrito' }, { label: '↩︎ Menú', valor: 'menu' }] })
  }

  const reiniciar = () => {
    flujo.current = { paso: null, datos: {} }
    setMsgs([])
    decir({ texto: 'Empecemos de nuevo 🧀 ¿Qué necesitas?', opciones: MENU })
  }

  const ultimo = msgs[msgs.length - 1]

  return (
    <>
      {/* Botón flotante */}
      <div className={`fixed right-4 z-50 flex items-end gap-2 md:right-6 ${abajo} ${abierto ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity`}>
        {teaser && (
          <button onClick={abrir} className="mb-2 max-w-[200px] animate-emerger rounded-2xl rounded-br-md bg-superficie px-4 py-2.5 text-left text-sm text-cacao shadow-elevada ring-1 ring-borde">
            <b className="block text-vino">¿No sabes qué elegir?</b> Te armo una tabla en segundos ✨
          </button>
        )}
        <button
          onClick={abrir}
          aria-label="Abrir asistente quesero"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-vino to-vino-oscuro text-white shadow-[0_12px_32px_-8px_rgb(var(--vino)/0.7)] transition hover:scale-110 active:scale-95"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-vino/40 [animation-duration:2.5s]" />
          <Sparkles size={24} className="relative transition group-hover:rotate-12" />
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-exito ring-2 ring-superficie" />
        </button>
      </div>

      {/* Panel de chat */}
      {abierto && (
        <section
          role="dialog"
          aria-label="Quesi, asistente quesero"
          className="fixed inset-x-2 bottom-2 top-16 z-[65] flex origin-bottom-right animate-emerger flex-col overflow-hidden rounded-3xl border border-white/20 bg-superficie/90 shadow-[0_30px_80px_-20px_rgb(var(--sombra)/0.55)] backdrop-blur-2xl sm:inset-x-auto sm:right-6 sm:top-auto sm:h-[600px] sm:max-h-[calc(100vh-3rem)] sm:w-[400px] md:bottom-6"
        >
          {/* Encabezado */}
          <header className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-br from-vino to-vino-oscuro px-4 py-3.5 text-white">
            <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-miel-claro/30 blur-2xl" />
            <span className="relative">
              <img src={logo} alt="" className="h-11 w-11 rounded-2xl bg-[#F7F1E6] object-cover ring-2 ring-white/40" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-exito ring-2 ring-vino" />
            </span>
            <div className="relative flex-1 leading-tight">
              <p className="font-display text-lg font-semibold">Quesi</p>
              <p className="text-xs text-white/70">Asistente quesero · en línea</p>
            </div>
            <button onClick={reiniciar} aria-label="Reiniciar conversación" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/10"><RotateCcw size={17} /></button>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar asistente" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/10"><X size={20} /></button>
          </header>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`flex animate-aparecer flex-col ${m.de === 'yo' ? 'items-end' : 'items-start'}`}>
                {m.texto && (
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.de === 'yo' ? 'rounded-br-md bg-vino text-white' : 'rounded-bl-md bg-pergamino text-cacao'
                    }`}
                  >
                    {m.texto}
                  </p>
                )}
                {m.productos?.length > 0 && (
                  <div className="scrollbar-hide -mx-4 mt-2 flex w-[calc(100%+2rem)] gap-2.5 overflow-x-auto px-4 pb-1">
                    {m.productos.map((p) => (
                      <MiniProducto key={p.id} p={p} agregado={agregados[p.id]} onAgregar={() => agregar(p)} onVer={() => { setAbierto(false); navigate(`/catalogo/${p.id}`) }} />
                    ))}
                  </div>
                )}
                {m.combo && <TarjetaCombo combo={m.combo} onAgregar={() => agregarCombo(m.combo)} />}
                {m.opciones && m === ultimo && !escribiendo && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.opciones.map((o) => (
                      <button
                        key={o.label}
                        onClick={() => responder(o.valor, o.label)}
                        className="animate-aparecer rounded-full border border-vino/30 bg-superficie px-3.5 py-2 text-sm font-medium text-vino transition hover:-translate-y-0.5 hover:bg-vino hover:text-white"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {escribiendo && (
              <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-pergamino px-4 py-3" aria-label="Quesi está escribiendo">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-cacao/50" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
            <div ref={finRef} />
          </div>

          {/* Entrada */}
          <form onSubmit={enviar} className="flex items-center gap-2 border-t border-borde/60 bg-superficie/80 p-3">
            <input
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe: “algo para vino tinto”…"
              aria-label="Escribe tu mensaje"
              className="h-11 flex-1 rounded-full border border-borde bg-crema px-4 text-sm text-cacao outline-none placeholder:text-textoSecundario/60 focus:border-vino focus:ring-4 focus:ring-vino/10"
            />
            <button type="submit" disabled={!texto.trim()} aria-label="Enviar" className="flex h-11 w-11 items-center justify-center rounded-full bg-vino text-white transition hover:scale-105 disabled:opacity-40">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  )
}

function MiniProducto({ p, agregado, onAgregar, onVer }) {
  const img = obtenerImagen(p)
  return (
    <div className="w-36 shrink-0 overflow-hidden rounded-2xl border border-borde/70 bg-superficie shadow-tarjeta">
      <button onClick={onVer} className="block h-24 w-full overflow-hidden bg-pergamino">
        {img ? <img src={img} alt={p.nombre} className="h-full w-full object-cover transition duration-500 hover:scale-110" /> : <span className="flex h-full items-center justify-center font-display text-2xl text-cacao/40">{p.nombre[0]}</span>}
      </button>
      <div className="p-2.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium text-cacao">{p.nombre}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-vino">{dinero(precioUnitario(p))}</span>
          <button onClick={onAgregar} aria-label={`Agregar ${p.nombre}`} className={`flex h-8 w-8 items-center justify-center rounded-full transition ${agregado ? 'bg-exito text-white' : 'bg-vino/10 text-vino hover:bg-vino hover:text-white'}`}>
            {agregado ? <Check size={15} /> : <Plus size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function TarjetaCombo({ combo, onAgregar }) {
  return (
    <div className="mt-2 w-full overflow-hidden rounded-2xl border border-vino/20 bg-superficie shadow-tarjeta">
      <div className="flex items-center gap-2 bg-gradient-to-r from-vino/10 to-miel/10 px-4 py-2.5">
        <Sparkles size={15} className="text-vino" />
        <p className="text-xs font-semibold uppercase tracking-wider text-vino">Tu tabla sugerida</p>
      </div>
      <ul className="divide-y divide-borde/60 px-3">
        {combo.lineas.map(({ producto: p, cantidad }) => {
          const img = obtenerImagen(p)
          return (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-pergamino">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-cacao">{p.nombre}</span>
                <span className="text-xs text-textoSecundario">{cantidad} × {dinero(precioUnitario(p))}</span>
              </span>
              <span className="text-sm font-semibold text-cacao">{dinero(precioUnitario(p) * cantidad)}</span>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-borde px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-textoSecundario">Total</p>
          <p className="font-display text-xl font-semibold text-vino">{dinero(combo.total)}</p>
        </div>
        <button onClick={onAgregar} className="btn-primario h-11 px-4"><ShoppingBag size={16} /> Agregar todo</button>
      </div>
    </div>
  )
}
