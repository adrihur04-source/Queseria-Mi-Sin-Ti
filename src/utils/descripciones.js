// descripciones.js — Fichas "de antojo" para cada producto
// Detecta la familia del producto (cerveza, destilado, dulce típico, aderezo…) por nombre/categoría
// y arma una ficha atractiva: frase, notas de cata, cómo disfrutarlo, maridaje, conservación y un dato curioso.
// Si el admin escribió una descripción propia, se muestra como "Palabras del productor".

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const REGLAS = [
  ['aderezo', /aderezo|salsa|chipotle|habanero|jalapeno|chile|picante|macha/],
  ['cerveza', /cerveza|ipa|lager|ale\b|stout|porter|session|ambar/],
  ['destilado', /destilado|mezcal|agave|tequila|raicilla|sotol|pulque/],
  ['licor', /licor|crema de|anis|toronjil|yerbas|xocoyul|canela/],
  ['vino', /vino|sidra|tinto|rosado|espumoso/],
  ['jugo', /jugo|agua ?miel|concentrado|nectar|refresco/],
  ['cafe', /cafe|cacao|chocolate/],
  ['ate', /\bate\b|membrillo|conserva|mermelada|higo|tubo|guayaba/],
  ['miel', /\bmiel\b|polen|propoleo/],
  ['granola', /granola|avena|cereal|amaranto/],
  ['dulce', /cocada|alegria|jamoncillo|mazapan|garapi|laminilla|banderilla|manguito|camote|tamarindo|dulce|galleta|obleas|palanqueta|pepitoria|polvera/],
  ['queso', /queso|semicurado|oaxaca|panela|cotija|manchego|asadero|fresco|anejo/],
]

export function familiaDe(p) {
  const cat = norm(p?.categoria)
  const todo = norm(`${p?.nombre} ${p?.categoria}`)
  // La categoría manda cuando es clara (p. ej. "Dulces típicos" aunque el nombre diga "jamón")
  for (const [f, re] of REGLAS) if (re.test(cat)) return f
  for (const [f, re] of REGLAS) if (re.test(todo)) return f
  return 'otro'
}

// Elige siempre la misma variante para el mismo producto
const elegir = (arr, semilla) => {
  let h = 0
  for (const c of String(semilla)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return arr[h % arr.length]
}

const FICHAS = {
  aderezo: {
    frases: ['Una cucharada y cualquier platillo sube de nivel.', 'El toque que tu mesa estaba esperando.', 'Picor, sabor y carácter en cada gota.'],
    historia: (n) => `${n} se prepara en lotes pequeños, con chiles y frutas seleccionadas a mano y sin conservadores artificiales: así sabe a hecho en casa.`,
    notas: [['🔥', 'Sabor', 'Equilibrio entre dulzor, acidez y un picor que se queda contigo.'], ['🫙', 'Textura', 'Tersa y fácil de servir; se adhiere perfecto a la comida.'], ['🍽️', 'Ideal para', 'Tacos, carnes asadas, ensaladas, quesos frescos y botanas.']],
    disfrutar: 'Agítalo antes de servir. Pruébalo sobre queso fresco o panela con unas tostadas: es la botana más rápida y deliciosa.',
    maridaje: 'Con una cerveza clara o una IPA bien fría: la burbuja limpia el picor y resalta la fruta.',
    conservar: 'Una vez abierto, consérvalo en refrigeración y consúmelo en las siguientes 4 semanas.',
    dato: 'El picor del chile se mide en unidades Scoville: un jalapeño tiene entre 2,500 y 8,000; un habanero puede superar las 100,000.',
    combina: ['queso', 'cerveza', 'granola'],
  },
  cerveza: {
    frases: ['Hecha por cerveceros mexicanos, para brindar sin prisa.', 'Cada trago cuenta una historia de lúpulo y malta.', 'Artesanal de verdad: lotes pequeños, sabor enorme.'],
    historia: (n) => `${n} es una cerveza artesanal mexicana elaborada en lotes pequeños, sin aditivos, respetando los tiempos de fermentación para lograr un sabor redondo.`,
    notas: [['🍺', 'Sabor', 'Maltas tostadas, lúpulo aromático y un final refrescante.'], ['🌾', 'Aroma', 'Notas a cereal, cítricos o caramelo según el estilo.'], ['🎉', 'Ideal para', 'Carne asada, reuniones con amigos y tablas de botana.']],
    disfrutar: 'Sírvela entre 4 y 7 °C en vaso inclinado; endereza al final para formar dos dedos de espuma que liberan el aroma.',
    maridaje: 'Con quesos que se derriten (Oaxaca, asadero), chicharrón, cacahuates y aderezos con chile.',
    conservar: 'Guárdala de pie, en un lugar fresco y lejos de la luz; consúmela antes de su fecha para disfrutar todo el lúpulo.',
    dato: 'La cerveza es una de las bebidas fermentadas más antiguas del mundo: hay registros de su elaboración en Mesopotamia hace más de 5,000 años.',
    combina: ['aderezo', 'queso', 'dulce'],
  },
  destilado: {
    frases: ['El alma del agave, en una copa.', 'Para tomarse a besitos, como manda la tradición.', 'Tierra, fuego y paciencia: así nace este destilado.'],
    historia: (n) => `${n} se elabora de forma artesanal: el corazón de la planta se cuece, se muele, se fermenta y se destila con técnicas que han pasado de generación en generación.`,
    notas: [['🔥', 'Sabor', 'Intenso y complejo, con notas ahumadas, herbales y un dulzor natural.'], ['🌿', 'Aroma', 'Tierra húmeda, madera y frutas cocidas.'], ['🥂', 'Ideal para', 'Brindis especiales, sobremesas y regalos con historia.']],
    disfrutar: 'Sírvelo a temperatura ambiente en copa pequeña o jícara. Huélelo, dale un sorbo corto y déjalo recorrer la boca: "a besitos".',
    maridaje: 'Con naranja y sal de gusano, chocolate amargo, queso añejo o un ate de membrillo.',
    conservar: 'Mantén la botella de pie, bien cerrada y lejos del sol. Un destilado no caduca, pero conserva mejor su aroma si se guarda así.',
    dato: 'Los agaves pueden tardar de 7 a más de 20 años en madurar antes de poder cosecharse para hacer mezcal.',
    combina: ['cafe', 'ate', 'queso'],
  },
  licor: {
    frases: ['Dulce, aromático y con un toque de abuela.', 'La sobremesa perfecta cabe en una copita.', 'Hierbas, frutas y tradición destiladas con cariño.'],
    historia: (n) => `${n} se prepara macerando frutas, hierbas o especias en alcohol de calidad durante semanas, hasta que el aroma lo inunda todo.`,
    notas: [['🍯', 'Sabor', 'Dulce y aromático, con un final cálido.'], ['🌸', 'Aroma', 'Herbal, frutal o especiado según su receta.'], ['☕', 'Ideal para', 'Después de comer, con café o en coctelería casera.']],
    disfrutar: 'Sírvelo frío o con hielo en copita. También queda increíble en un café o sobre helado de vainilla.',
    maridaje: 'Con postres, chocolate, galletas de mantequilla o dulces típicos.',
    conservar: 'Bien tapado y a temperatura ambiente; si es de crema, mejor en refrigeración.',
    dato: 'Muchos licores de hierbas nacieron en conventos como remedios digestivos antes de convertirse en bebidas de sobremesa.',
    combina: ['dulce', 'cafe', 'granola'],
  },
  vino: {
    frases: ['Para brindar por los pequeños grandes momentos.', 'Una copa que convierte la cena en celebración.', 'Fruta, frescura y elegancia en cada sorbo.'],
    historia: (n) => `${n} viene de productores que cuidan la fruta desde el campo hasta la botella, para lograr un sabor honesto y fácil de disfrutar.`,
    notas: [['🍇', 'Sabor', 'Frutal y equilibrado, con acidez refrescante.'], ['🌺', 'Aroma', 'Frutas rojas o de huerto, flores y un toque de madera.'], ['🕯️', 'Ideal para', 'Cenas, regalos y tablas de quesos.']],
    disfrutar: 'Los tintos se sirven entre 16 y 18 °C; blancos, rosados y sidras, entre 6 y 10 °C. Deja respirar el tinto unos minutos en la copa.',
    maridaje: 'Tintos con quesos maduros y ate; blancos y sidras con quesos frescos, fruta y miel.',
    conservar: 'Acostado si tiene corcho, en lugar fresco y oscuro. Abierto, tápalo y refrigéralo: dura de 2 a 4 días.',
    dato: 'La bodega más antigua de América está en México: Casa Madero, fundada en 1597 en Parras, Coahuila.',
    combina: ['queso', 'ate', 'miel'],
  },
  jugo: {
    frases: ['Fruta de verdad, sin atajos.', 'Refrescante, natural y lleno de color.', 'Como recién exprimido en la huerta.'],
    historia: (n) => `${n} se elabora con fruta seleccionada y procesos sencillos para conservar su sabor y su color natural.`,
    notas: [['🍓', 'Sabor', 'Fruta intensa con un dulzor natural.'], ['💧', 'Textura', 'Ligera y refrescante.'], ['🌞', 'Ideal para', 'Desayunos, loncheras y como base de cocteles sin alcohol.']],
    disfrutar: 'Sírvelo bien frío. Si es concentrado, mézclalo con agua mineral y hielo para una bebida burbujeante.',
    maridaje: 'Con granola, pan dulce o una tabla de fruta y queso fresco.',
    conservar: 'Refrigera después de abrir y consúmelo en pocos días.',
    dato: 'El aguamiel es la savia del maguey; fermentada se convierte en pulque, una bebida que ya se tomaba en Mesoamérica.',
    combina: ['granola', 'dulce', 'miel'],
  },
  cafe: {
    frases: ['El aroma que despierta la casa entera.', 'Grano mexicano, tostado con paciencia.', 'Tu ritual favorito, en su mejor versión.'],
    historia: (n) => `${n} nace de productores mexicanos que cultivan con dedicación; se tuesta en pequeñas cantidades para cuidar cada matiz de sabor.`,
    notas: [['☕', 'Sabor', 'Notas a chocolate, frutos secos y un final dulce.'], ['🌰', 'Aroma', 'Tostado, cálido y envolvente.'], ['🌅', 'Ideal para', 'Mañanas tranquilas, sobremesas y regalar.']],
    disfrutar: 'Usa agua caliente sin hervir (90–96 °C) y unos 10 g por taza. Si es chocolate de mesa, bátelo con leche caliente hasta que haga espuma.',
    maridaje: 'Con pan dulce, cocadas, jamoncillos o un licor de sobremesa.',
    conservar: 'En frasco hermético, en un lugar fresco y oscuro. Evita el refrigerador: absorbe olores.',
    dato: 'El cacao es originario de Mesoamérica: los mexicas lo usaban incluso como moneda.',
    combina: ['dulce', 'licor', 'granola'],
  },
  ate: {
    frases: ['Fruta cocida a fuego lento, como en las cocinas de antes.', 'El compañero perfecto del queso.', 'Dulzor natural, receta de familia.'],
    historia: (n) => `${n} se elabora cociendo la fruta con azúcar a fuego lento, moviendo con pala de madera hasta lograr esa textura firme y brillante.`,
    notas: [['🍐', 'Sabor', 'Fruta concentrada, dulce y ligeramente ácida.'], ['🧈', 'Textura', 'Firme, tersa y fácil de rebanar.'], ['🧀', 'Ideal para', 'Tablas de quesos, postres y lunch.']],
    disfrutar: 'Córtalo en cubos y sírvelo con queso fresco, panela o semicurado: el contraste dulce-salado es irresistible.',
    maridaje: 'Con quesos de todo tipo, vino tinto o un destilado de agave.',
    conservar: 'En lugar fresco y seco, bien envuelto. Una vez abierto, refrigéralo.',
    dato: 'El ate de membrillo llegó con los españoles y en México se reinventó con guayaba, tejocote, mango y muchas frutas más.',
    combina: ['queso', 'vino', 'destilado'],
  },
  miel: {
    frases: ['Oro líquido, directo del panal.', 'Dulzura pura, hecha por abejas mexicanas.', 'Natural, sin mezclas, como debe ser.'],
    historia: (n) => `${n} se cosecha de apiarios locales y se envasa sin mezclas ni calentamientos agresivos, para conservar su aroma floral.`,
    notas: [['🍯', 'Sabor', 'Dulce y floral, con matices según la temporada.'], ['🌼', 'Aroma', 'Flores silvestres y un toque herbal.'], ['🥞', 'Ideal para', 'Desayunos, té, yogur y tablas de queso.']],
    disfrutar: 'Úsala sobre queso fresco o de cabra con nueces: un postre en segundos. En bebidas, agrégala cuando estén tibias, no hirviendo.',
    maridaje: 'Con quesos frescos o azules, granola, fruta y vino blanco.',
    conservar: 'A temperatura ambiente y bien cerrada. Si se cristaliza es señal de miel natural: entíbiala a baño María.',
    dato: 'La miel bien guardada prácticamente no se echa a perder: se han encontrado tarros comestibles en tumbas egipcias.',
    combina: ['queso', 'granola', 'cafe'],
  },
  granola: {
    frases: ['El desayuno crujiente que te pone de buenas.', 'Energía natural en cada cucharada.', 'Hecha en casa, horneada con calma.'],
    historia: (n) => `${n} se hornea en pequeñas tandas con cereales, semillas y un toque de miel, para que quede dorada y crujiente.`,
    notas: [['🌾', 'Sabor', 'Tostado, ligeramente dulce y con semillas.'], ['🥣', 'Textura', 'Crujiente de principio a fin.'], ['🏃', 'Ideal para', 'Desayunos, colaciones y antes de entrenar.']],
    disfrutar: 'Con yogur natural y fruta de temporada, o como topping sobre un licuado.',
    maridaje: 'Con miel, jugos naturales y café.',
    conservar: 'En frasco hermético para que se mantenga crujiente.',
    dato: 'El amaranto, base de las alegrías, era uno de los cultivos más importantes de Mesoamérica junto con el maíz y el frijol.',
    combina: ['miel', 'jugo', 'cafe'],
  },
  dulce: {
    frases: ['Un pedacito de infancia en cada mordida.', 'Dulce típico mexicano, hecho a mano.', 'La tradición que se antoja a cualquier hora.'],
    historia: (n) => `${n} se elabora a mano siguiendo recetas tradicionales mexicanas, con ingredientes sencillos y mucho cariño.`,
    notas: [['🍬', 'Sabor', 'Dulce, tradicional y lleno de recuerdos.'], ['✨', 'Textura', 'Suave, crujiente o chiclosa según la receta.'], ['🎁', 'Ideal para', 'Postre, regalo, mesa de dulces y antojo de media tarde.']],
    disfrutar: 'Acompáñalo con un café de olla o un chocolate caliente. Perfecto para compartir en la sobremesa.',
    maridaje: 'Con café, chocolate de mesa o un licor dulce.',
    conservar: 'En lugar fresco y seco, bien cerrado, lejos del sol.',
    dato: 'Muchos dulces mexicanos nacieron en los conventos virreinales, donde las monjas mezclaron ingredientes europeos con frutas y semillas locales.',
    combina: ['cafe', 'licor', 'jugo'],
  },
  queso: {
    frases: ['Hecho con leche fresca y la paciencia de siempre.', 'El protagonista de cualquier tabla.', 'Sabor de rancho, directo a tu mesa.'],
    historia: (n) => `${n} se elabora artesanalmente con leche fresca de la región; cada pieza se cuaja, se moldea y se cuida a mano.`,
    notas: [['🧀', 'Sabor', 'Lácteo y equilibrado, más intenso entre más tiempo de maduración.'], ['🫓', 'Textura', 'Firme y untuosa; se funde o se rebana según su tipo.'], ['🍷', 'Ideal para', 'Tablas, quesadillas, botanas y regalos.']],
    disfrutar: 'Sácalo del refrigerador de 30 a 60 minutos antes de servir: a temperatura ambiente despierta todo su sabor.',
    maridaje: 'Con ate, miel, vino o cerveza artesanal.',
    conservar: 'Refrigerado, envuelto en papel encerado o en un recipiente con algo de aire; evita el plástico directo.',
    dato: 'Para hacer un kilo de queso se necesitan, en promedio, unos 10 litros de leche.',
    combina: ['ate', 'vino', 'miel'],
  },
  otro: {
    frases: ['Artesanal, mexicano y hecho con cariño.', 'De productores locales a tu mesa.', 'Un antojo que vale la pena.'],
    historia: (n) => `${n} forma parte de nuestra selección de productos artesanales de productores locales.`,
    notas: [['✨', 'Calidad', 'Elaborado en pequeñas cantidades.'], ['🤝', 'Origen', 'Apoyas a productores de la región.'], ['🎁', 'Ideal para', 'Disfrutar en casa o regalar.']],
    disfrutar: 'Pregúntale a Quesi, nuestro asistente, con qué combinarlo.',
    maridaje: 'Combínalo con quesos y dulces de la casa.',
    conservar: 'En un lugar fresco y seco.',
    dato: 'Comprar a productores locales mantiene vivas recetas y oficios tradicionales.',
    combina: ['queso', 'dulce'],
  },
}

export const ETIQUETA_FAMILIA = {
  aderezo: 'Aderezo artesanal', cerveza: 'Cerveza artesanal', destilado: 'Destilado artesanal', licor: 'Licor de la casa', vino: 'Vino', jugo: 'Bebida natural',
  cafe: 'Café y cacao', ate: 'Ates y conservas', miel: 'Miel natural', granola: 'Granola y cereales', dulce: 'Dulce típico', queso: 'Queso artesanal', otro: 'Artesanal',
}

// Descripciones genéricas que no aportan (se reemplazan por la ficha)
const GENERICA = /elaborad[oa] artesanalmente|ingredientes seleccionados|sabor autentico/

export function fichaDe(p) {
  const familia = familiaDe(p)
  const f = FICHAS[familia]
  const nombre = p?.nombre || 'Este producto'
  const propia = p?.descripcion && !GENERICA.test(norm(p.descripcion)) ? p.descripcion : null
  return {
    familia,
    etiqueta: ETIQUETA_FAMILIA[familia],
    frase: elegir(f.frases, nombre),
    historia: f.historia(nombre),
    propia,
    notas: f.notas.map(([icono, titulo, texto]) => ({ icono, titulo, texto })),
    disfrutar: f.disfrutar,
    maridaje: f.maridaje,
    conservar: f.conservar,
    dato: f.dato,
    combina: f.combina,
  }
}

// Productos que combinan con este (por familia complementaria)
export function combinaCon(producto, productos, n = 3) {
  const { combina } = fichaDe(producto)
  const candidatos = productos.filter((p) => p.id !== producto.id && Number(p.stock) > 0)
  const out = []
  for (const fam of combina) {
    const p = candidatos.find((x) => familiaDe(x) === fam && !out.includes(x))
    if (p) out.push(p)
    if (out.length >= n) break
  }
  return out
}
