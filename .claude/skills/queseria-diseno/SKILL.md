---
name: queseria-diseno
description: Sistema de diseño de "Quesería de mi sin ti" (React + Tailwind + Firebase). Úsalo SIEMPRE antes de crear o modificar cualquier pantalla, componente o estilo de la app — cliente, cajero/empleado, admin, login, registro o portada pública — y cuando pidan "mejorar diseño", "rediseñar", "que se vea mejor", "hacer responsive" o "unificar estilos".
---

# Sistema de diseño — Quesería de mi sin ti

La marca es artesanal, cálida y mexicana: madera, queso, vino, miel. El logo es cacao sobre crema con fondo oliva.
El diseño debe sentirse como una tienda gourmet de barrio, no como un panel genérico.

## 1. Tokens (definidos en `tailwind.config.js`)

| Uso | Token | Hex |
|---|---|---|
| Fondo de página | `bg-crema` / `bg-fondoPrincipal` | #F7F1E6 |
| Fondo alterno, placeholders de imagen | `bg-pergamino` / `bg-fondoSecundario` | #EFE4CF |
| Acción principal (botones, activo) | `vino` / `botonPrincipal` | #6B1F35 |
| Hover de acción / fondos oscuros | `vino-oscuro` | #4C1028 |
| Títulos, texto fuerte | `cacao` / `textoPrincipal` | #3B2418 / #2B1D16 |
| Texto secundario | `textoSecundario` | #6B5A4E |
| Etiquetas de categoría, acento natural | `oliva` | #5F6B52 |
| Acento cálido, advertencia suave | `miel` / `botonSecundario`, `miel-claro` | #9A6B1E / #D9B26A |
| Éxito | `exito` | #2F6B3A |
| Error / agotado | `error` | #B42318 |
| Bordes | `borde` | #E2D3B5 |

**Modo oscuro** (`darkMode: 'class'`, variables en `src/index.css`, hook `useTema`, botón `components/BotonTema`)
- Superficies de tarjetas/barras: `bg-superficie` (NUNCA `bg-white`; `bg-white/10` solo como velo sobre fondos oscuros).
- Fondos oscuros fijos (encabezados de personal, toasts, overlays): `bg-tinta`. Texto claro sobre ellos: `text-marfil` (NUNCA `text-crema`, que se oscurece en modo oscuro).
- Botón claro sobre fondo oscuro fijo: `bg-marfil` + texto con hex fijo (`text-[#4C1028]`).
- Prueba cada pantalla en ambos modos.

**Movimiento**
- Efectos en `utils/efectos.js` (`volarAlCarrito`, `confeti`) y `hooks/useAparecer` + clases `.revelar` / `.escalonado`.
- La raíz de cada página (`.min-h-screen`) se anima solo con opacidad: NO pongas `transform`/`filter`/`backdrop-blur` en un contenedor que tenga hijos `position: fixed` (barras, paneles, modales): los rompe.
- Todo respeta `prefers-reduced-motion`.

**Liquid glass (admin)**
- `.vidrio` (claro) y `.vidrio-oscuro` (sobre tinta) en `index.css`: usan `backdrop-filter` → solo en elementos SIN hijos `position: fixed`.
- En `/admin/*` (body `.con-sidebar`) las páginas quedan transparentes sobre el fondo animado de `AdminShell`, y `.tarjeta` sin clase `bg-*` se vuelve cristal automáticamente. `EncabezadoStaff` se vuelve cápsula flotante.
- Fotos de perfil: `components/Avatar` (foto o iniciales; `editable` + `utils/foto.prepararFotoPerfil` → data URL en `usuarios/{uid}.foto`, sin Storage).
- Ajustes de tienda (envío, dirección, horario, teléfono): `hooks/useConfigTienda` (doc `configuracion/tienda`). Nunca escribas esos datos a mano en una pantalla.
- Pedidos: flujo según `entrega` (`tienda` | `domicilio`) → usa `flujoDe`, `siguienteStatus(pedido)`, `accionSiguiente(pedido)` de `services/pedidos.js`.
- Asistente "Quesi": `components/cliente/Asistente` + motor local `utils/recomendador.js`; se monta global con `AsistenteGlobal`.
- Tras cambiar `tailwind.config.js`, reinicia `npm run dev` (Vite no recarga keyframes nuevos).

**Cliente — piezas compartidas**
- Ficha de producto: `utils/descripciones.js` (`familiaDe`, `fichaDe`, `combinaCon`). La tienda vende productos artesanales mexicanos (cervezas, destilados, licores, dulces típicos, aderezos, ates, miel, café, quesos).
- Reseñas: `hooks/useResenas` (una suscripción) + `components/Estrellas`.
- Club Quesero (puntos, niveles, referidos): `utils/puntos.js` + `hooks/useClub`. Pedidos de cliente: `hooks/usePedidosCliente`.
- Avisos en vivo (cliente y cajero, con sonido): `components/AvisosEnVivo` + `utils/sonido.js`, montado en App.
- Reglas de Firestore: `firestore.rules` en la raíz; actualízalas si agregas colecciones.

**Reglas duras**
- PROHIBIDO usar hex sueltos (`bg-[#1F3E44]`) o la paleta genérica de Tailwind (`gray-*`, `blue-*`, `yellow-*`, `green-*`, `red-*`). Si falta un color, agrégalo como token.
- `error` (rojo) y `vino` (marca) NO son intercambiables: vino = acción, error = problema.
- Texto blanco solo sobre `vino`, `vino-oscuro`, `cacao`, `oliva`, `miel` o `exito` (contraste ≥ 4.5:1).

## 2. Tipografía
- `font-display` (Fraunces, serif): títulos de página/sección, precios grandes, números de KPI.
- `font-sans` (Inter): todo lo demás. Es la fuente por defecto del `body`.
- Escala: título de página `text-2xl sm:text-3xl`, sección `titulo-seccion`, cuerpo `text-sm`/`text-base`, metadatos `text-xs`.
- Sobretítulos: clase `sobretitulo` (mayúsculas, tracking amplio, vino).

## 3. Componentes base (en `src/index.css`)
Usa estas clases en vez de repetir cadenas largas:
`btn-primario`, `btn-secundario`, `btn-fantasma`, `tarjeta`, `campo`, `etiqueta`, `chip-activo`, `chip-inactivo`, `sobretitulo`, `titulo-seccion`.

- Radios: tarjetas `rounded-2xl`, botones/campos `rounded-xl`, chips `rounded-full`, hero/modales `rounded-3xl`.
- Sombras: `shadow-tarjeta` (reposo), `shadow-elevada` (hover/modales).
- Iconos: usa **lucide-react** en código nuevo (el proyecto mezcla FontAwesome; no agregues más FontAwesome).
- Imágenes de producto: `obtenerImagen()` de `src/utils/imagenes.js`; placeholder = `bg-pergamino` + inicial en `font-display`.
- Dinero: `toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })`. Nunca `${p.precio}` crudo.

## 4. Patrones por rol

**Visitante / Cliente** (`/`, `/catalogo`, `/carrito`…) — vitrina cálida, mobile-first.
- Foto grande, nombre, precio en vino, badge `-X%` en vino, "Agotado" sobre `cacao/80`.
- La portada `/` es pública; solo carrito/pedidos piden sesión. Nunca mandes a un visitante directo al login.
- Recordar el modelo: *apartas en la app, pagas y recoges en tienda*.
- Todas las pantallas del cliente usan `components/cliente/EncabezadoTienda` (nav en escritorio) + `BottomNav` (solo móvil).
- Productos: `components/cliente/TarjetaProducto` y el hook `useProductosTienda` (ya excluye ocultos y caducados).
- Precio: SIEMPRE `precioUnitario()` de `utils/precio.js` (incluye la promoción). Nunca `p.precio` directo para cobrar o mostrar.
- Carrito: `useCarrito()` — una fila por producto, persistido en localStorage; en el carrito los precios/stock se leen en vivo.
- Formularios y paneles: `components/staff/Hoja` (hoja inferior en móvil, panel lateral en escritorio).

**Cajero / Empleado** (`/empleado/*`) — herramienta de mostrador: velocidad > decoración.
- Encabezado: `components/staff/EncabezadoStaff` (fondo `cacao`, distingue la zona de trabajo de la tienda en vino).
- Estatus: `components/staff/EstadoPedido`; confirmaciones: `components/staff/Confirmacion`.
- Lógica de pedidos SOLO vía `services/pedidos.js` (avanzar/cancelar); formatos vía `utils/formato.js`.
- Objetivos táctiles ≥ 44px, texto ≥ 14px, contraste alto, acciones primarias abajo al alcance del pulgar.
- Estados de pedido con color + texto + icono (nunca solo color): pendiente = miel, en proceso = oliva, entregado = exito, cancelado = error.
- Búsqueda siempre visible arriba; confirmaciones con modal propio, no `alert()`.

**Administración** (`/admin/*`) — densidad de información, pensado también para escritorio.
- Todas las rutas `/admin/*` viven dentro de `components/admin/AdminShell` (barra lateral `md:`); módulos en `components/admin/modulos.js` (fuente única).
- En móvil cada pantalla renderiza `<BottomNavAdmin />` (4 accesos + hoja "Más"); en `md:` se oculta solo.
- Barras fijas inferiores llevan la clase `fijo-inferior` para no tapar la barra lateral.
- El admin reutiliza las pantallas de personal (pedidos, inventario, lotes, movimientos): no dupliques pantallas, usa `base = role==='admin' ? '/admin' : '/empleado'`.
- Tablas en desktop, tarjetas en móvil.
- Inventario: movimientos SOLO vía `services/inventario.js` (stock + lote + historial en una transacción). Reglas de stock en `utils/stock.js`.
- KPIs con `font-display`, siempre calculados desde Firestore — **nunca números escritos a mano**.
- Formularios en 2 columnas desde `md:`; acciones destructivas en `error` con confirmación.

## 5. Estados obligatorios en cada pantalla
Cargando (skeleton `animate-pulse bg-pergamino`, no texto "Cargando..."), vacío (mensaje + acción), error (qué pasó + reintentar), sin conexión.

## 6. Accesibilidad y responsive
- Cada pantalla debe verse bien en 360px y en 1280px. Contenedor: `mx-auto max-w-6xl px-5`.
- Botones con icono solo → `aria-label`. Modales → `role="dialog" aria-modal`, cierre con Escape y clic fuera.
- `alt` descriptivo en fotos de producto; `alt=""` en decorativas.

## 7. Textos
Español de México, tuteo, cálido y breve. Lenguaje neutro de género para roles ("Administración", "Equipo", no "Administradora"/"Empleada").
Nada de `console.log` con datos de usuario o contraseñas.

## Checklist antes de terminar
- [ ] Solo tokens de la tabla (busca `\[#` y `(gray|blue|yellow|green|red)-\d` en lo que tocaste)
- [ ] Usa clases base (`btn-*`, `tarjeta`, `campo`)
- [ ] 4 estados (cargando/vacío/error/offline)
- [ ] Probado en 360px y 1280px
- [ ] Sin datos falsos ni `console.log` sensibles
