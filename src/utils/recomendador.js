// recomendador.js — Motor del asistente "Quesi" (100% local, sin IA ni llaves de API)
// Clasifica los productos reales por palabras clave (nombre, categoría, descripción)
// y arma combinaciones según ocasión, número de personas, presupuesto y bebida.
import { precioUnitario } from './precio'
import { familiaDe } from './descripciones'

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const textoDe = (p) => sinAcentos(`${p.nombre} ${p.categoria} ${p.descripcion} ${p.marca} ${p.presentacion}`)

const PATRONES = {
  queso: /queso|manchego|oaxaca|panela|cotija|gouda|brie|camembert|parmesan|chihuahua|asadero|roquefort|azul|cabra|ricotta|mozzarella|edam|cheddar|emmental|gruyere|requeson|adobera|bola|crema/,
  embutido: /jamon|salami|chorizo|pepperoni|serrano|prosciutto|salchich|carnes? fria|longaniza|lomo|pastrami|tocino|cecina|embutido/,
  bebida: /vino|tinto|blanco|rosado|cerveza|mezcal|tequila|sidra|bebida|licor|refresco|jugo|cafe/,
  acompanante: /mermelada|miel|aceituna|nuez|almendra|galleta|pan\b|pan |uva|ate\b|cracker|fruto|chocolate|cajeta|botana|tostada|pistache|higo|chile|salsa|aderezo|dulce/,
}
const FUERTE = /anejo|madur|curado|azul|roquefort|parmesan|cotija|reserva|intenso|fuerte|ahumad|gruyere/
const SUAVE = /fresco|panela|oaxaca|crema|ricotta|mozzarella|requeson|suave|cremoso|tierno|asadero|joven|brie|bola/

// Tipo para armar combos, a partir de la familia del producto (utils/descripciones)
const TIPO_POR_FAMILIA = {
  queso: 'queso', cerveza: 'bebida', destilado: 'bebida', licor: 'bebida', vino: 'bebida', jugo: 'bebida',
  aderezo: 'acompanante', ate: 'acompanante', miel: 'acompanante', dulce: 'acompanante', cafe: 'acompanante', granola: 'acompanante',
}
export function tipoDe(p) {
  const fam = familiaDe(p)
  if (TIPO_POR_FAMILIA[fam]) return TIPO_POR_FAMILIA[fam]
  return PATRONES.embutido.test(textoDe(p)) ? 'embutido' : 'otro'
}
// Bebida elegida → familia de producto que la representa en la tienda
export const FAMILIA_BEBIDA = { tinto: 'vino', blanco: 'vino', cerveza: 'cerveza', mezcal: 'destilado', cafe: 'cafe' }
export const intensidadDe = (p) => {
  const t = textoDe(p)
  return FUERTE.test(t) ? 'fuerte' : SUAVE.test(t) ? 'suave' : 'media'
}

// Bebida → qué buscar para acompañarla
export const MARIDAJES = {
  tinto: {
    nombre: 'Vino tinto',
    emoji: '🍷',
    intensidad: ['fuerte', 'media'],
    extra: /nuez|\bate\b|higo|chocolate|membrillo|guayaba|semicurado|salami|serrano/,
    consejo: 'El tinto pide quesos con carácter: añejos y curados equilibran sus taninos. Suma algo dulce como ate o higos.',
  },
  blanco: {
    nombre: 'Vino blanco',
    emoji: '🥂',
    intensidad: ['suave', 'media'],
    extra: /uva|miel|cabra|almendra|galleta|pera|manzana|higo/,
    consejo: 'El blanco brilla con quesos frescos y cremosos. Un toque de miel o fruta fresca lo hace perfecto.',
  },
  cerveza: {
    nombre: 'Cerveza',
    emoji: '🍺',
    intensidad: ['media', 'suave'],
    extra: /aderezo|chipotle|habanero|jalapeno|chile|cacahuate|garapi|botana/,
    consejo: 'Con cerveza van quesos que se derriten y botanas saladas: Oaxaca, Chihuahua, asadero y algo con chile.',
  },
  mezcal: {
    nombre: 'Mezcal',
    emoji: '🥃',
    intensidad: ['fuerte'],
    extra: /chocolate|cacao|naranja|\bate\b|membrillo|tamarindo|chile|semicurado/,
    consejo: 'El mezcal ahumado pide sabores intensos: queso añejo o cotija, chocolate amargo y un toque de chile.',
  },
  cafe: {
    nombre: 'Café',
    emoji: '☕',
    intensidad: ['suave'],
    extra: /cocada|jamoncillo|mazapan|galleta|granola|miel|alegria|dulce/,
    consejo: 'Para el cafecito: queso fresco o panela con algo dulce como cajeta, mermelada o pan.',
  },
}

export const OCASIONES = {
  reunion: { nombre: 'Reunión con amigos', emoji: '🎉', piezasPorPersona: 0.4, conBebida: true },
  romantica: { nombre: 'Cena romántica', emoji: '🕯️', piezasPorPersona: 0.6, conBebida: true, prefiere: 'fuerte' },
  botana: { nombre: 'Botana rápida', emoji: '🍿', piezasPorPersona: 0.3, conBebida: false, prefiere: 'suave' },
  regalo: { nombre: 'Para regalar', emoji: '🎁', piezasPorPersona: 0.5, conBebida: true, premium: true },
}

const disponibles = (productos) => productos.filter((p) => Number(p.stock) > 0)
const mezclar = (arr, semilla = Date.now()) => {
  // Barajado estable por semilla para que "otra opción" cambie la propuesta
  let s = semilla % 2147483647
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  return arr.map((x) => [r(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x)
}

// Arma una tabla/combinación: { lineas: [{producto, cantidad}], total, notas }
export function armarCombo(productos, { ocasion = 'reunion', personas = 4, presupuesto = Infinity, bebida = null, semilla } = {}) {
  const lista = mezclar(disponibles(productos), semilla)
  const occ = OCASIONES[ocasion] || OCASIONES.reunion
  const mar = bebida ? MARIDAJES[bebida] : null
  const porTipo = (t) => lista.filter((p) => tipoDe(p) === t)

  // Puntaje: se prefiere la intensidad del maridaje/ocasión y lo premium para regalo
  const puntuar = (p) => {
    let s = 0
    const int = intensidadDe(p)
    if (mar?.intensidad.includes(int)) s += 3
    if (occ.prefiere === int) s += 2
    if (mar?.extra.test(textoDe(p))) s += 3
    if (occ.premium) s += Math.min(3, precioUnitario(p) / 100)
    return s
  }
  const mejores = (arr) => [...arr].sort((a, b) => puntuar(b) - puntuar(a))

  const quesos = mejores(porTipo('queso'))
  const elegidos = []
  // Variedad: hasta 3 quesos de intensidades distintas
  const vistas = new Set()
  for (const q of quesos) {
    const i = intensidadDe(q)
    if (!vistas.has(i) || elegidos.length < 2) {
      elegidos.push(q)
      vistas.add(i)
    }
    if (elegidos.length >= (personas >= 6 ? 3 : 2)) break
  }
  const emb = mejores(porTipo('embutido'))[0]
  if (emb) elegidos.push(emb)
  const acomp = mejores(porTipo('acompanante')).slice(0, personas >= 6 ? 2 : 1)
  elegidos.push(...acomp)
  if (occ.conBebida || mar) {
    const beb = lista.filter((p) => tipoDe(p) === 'bebida' || (bebida === 'cafe' && familiaDe(p) === 'cafe'))
    const preferida = mar ? beb.find((b) => familiaDe(b) === FAMILIA_BEBIDA[bebida]) : null
    if (preferida || beb[0]) elegidos.push(preferida || mejores(beb)[0])
  }
  // Si la tienda no tiene esas categorías, completa con lo mejor valorado
  if (elegidos.length < 3) {
    for (const p of mejores(lista)) {
      if (!elegidos.includes(p)) elegidos.push(p)
      if (elegidos.length >= 4) break
    }
  }

  const cant = (p) => {
    if (tipoDe(p) === 'bebida' || tipoDe(p) === 'acompanante') return 1
    return Math.max(1, Math.min(Number(p.stock) || 1, Math.round(personas * occ.piezasPorPersona)))
  }
  const precio = (p) => precioUnitario(p)
  const PRIORIDAD = { queso: 0, embutido: 1, acompanante: 2, otro: 3, bebida: 4 }
  const candidatos = [...elegidos].sort((a, b) => PRIORIDAD[tipoDe(a)] - PRIORIDAD[tipoDe(b)])

  // Llena el presupuesto en orden de importancia; si algo no cabe, busca un sustituto más barato del mismo tipo
  const lineas = []
  let total = 0
  const usado = (x) => elegidos.includes(x) || lineas.some((l) => l.producto === x)
  for (const p of candidatos) {
    let q = cant(p)
    while (q > 0 && total + precio(p) * q > presupuesto) q--
    if (q > 0) {
      lineas.push({ producto: p, cantidad: q })
      total += precio(p) * q
      continue
    }
    const alt = lista
      .filter((x) => tipoDe(x) === tipoDe(p) && !usado(x))
      .sort((a, b) => precio(a) - precio(b))
      .find((x) => total + precio(x) <= presupuesto)
    if (alt) {
      lineas.push({ producto: alt, cantidad: 1 })
      total += precio(alt)
    }
  }
  // Presupuesto muy bajo: al menos lo más barato que tengamos
  if (!lineas.length && lista.length) {
    const barato = [...lista].sort((a, b) => precio(a) - precio(b))[0]
    lineas.push({ producto: barato, cantidad: 1 })
    total = precio(barato)
  }

  return { lineas, total, consejo: mar?.consejo || null, excede: total > presupuesto }
}

// Productos que acompañan bien a una bebida
export function paraBebida(productos, bebida, n = 4) {
  const mar = MARIDAJES[bebida]
  if (!mar) return []
  return disponibles(productos)
    .filter((p) => tipoDe(p) !== 'bebida')
    .map((p) => {
      let s = 0
      if (tipoDe(p) === 'queso' && mar.intensidad.includes(intensidadDe(p))) s += 3
      if (mar.extra.test(textoDe(p))) s += 3
      if (tipoDe(p) === 'queso') s += 1
      return [s, p]
    })
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, n)
    .map(([, p]) => p)
}

// Búsqueda libre por texto
export function buscar(productos, texto, n = 4) {
  const palabras = sinAcentos(texto).split(/\W+/).filter((w) => w.length > 2)
  if (!palabras.length) return []
  return disponibles(productos)
    .map((p) => {
      const t = textoDe(p)
      const nombre = sinAcentos(p.nombre)
      const s = palabras.reduce((acc, w) => acc + (nombre.includes(w) ? 3 : t.includes(w) ? 1 : 0), 0)
      return [s, p]
    })
    .filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0])
    .slice(0, n)
    .map(([, p]) => p)
}

// Detecta la intención de un mensaje escrito
export function intencion(texto) {
  const t = sinAcentos(texto)
  if (/hola|buenas|que tal|hey/.test(t) && t.length < 20) return { tipo: 'saludo' }
  if (/tabla|charcuter|armar|combo|kit|reunion|fiesta|cena|regalo|botana/.test(t)) return { tipo: 'tabla' }
  for (const [k, m] of Object.entries(MARIDAJES)) {
    if (t.includes(k) || t.includes(sinAcentos(m.nombre))) return { tipo: 'maridaje', bebida: k }
  }
  if (/vino/.test(t)) return { tipo: 'maridaje', bebida: 'tinto' }
  if (/promo|oferta|descuento|barato|rebaja/.test(t)) return { tipo: 'promos' }
  if (/envio|domicilio|entrega|llevan|mandan/.test(t)) return { tipo: 'envio' }
  if (/horario|abren|cierran|direccion|donde|ubicacion|tienda/.test(t)) return { tipo: 'tienda' }
  if (/recomien|sugier|que compro|no se|popular|mejor/.test(t)) return { tipo: 'recomendar' }
  if (/fuerte|intenso|anejo/.test(t)) return { tipo: 'intensidad', valor: 'fuerte' }
  if (/suave|fresco|cremoso|ligero/.test(t)) return { tipo: 'intensidad', valor: 'suave' }
  if (/gracias|perfecto|genial|excelente/.test(t)) return { tipo: 'gracias' }
  return { tipo: 'buscar' }
}

export const porIntensidad = (productos, valor, n = 4) =>
  disponibles(productos).filter((p) => tipoDe(p) === 'queso' && intensidadDe(p) === valor).slice(0, n)
