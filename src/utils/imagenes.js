// imagenes.js — Resolución de imágenes de producto (compartido)
// Carga todas las imágenes de src/assets/productos y permite buscarlas por nombre de archivo.

const imagenes = import.meta.glob('../assets/productos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
})

export function obtenerImagen(producto) {
  if (producto?.imagenUrl) return producto.imagenUrl
  if (producto?.imagen) {
    const match = Object.entries(imagenes).find(([ruta]) => ruta.endsWith(producto.imagen))
    if (match) return match[1]
  }
  return null
}

// Vitrina de respaldo: se usa cuando aún no se pueden leer productos de Firestore
// (por ejemplo, si las reglas exigen sesión iniciada).
const DESTACADOS_LOCALES = [
  'destilado-de-agave-oaxaca.jpg',
  'cocada-natural.jpg',
  'monte-verde-larger-ambar.jpg',
  'galleta-abejita.jpg',
  'crema-piñon.jpg',
  'guayaba-jamon.jpg',
  'granola-grande.jpg',
  'alegria-natural.jpg',
]

const titulo = (archivo) =>
  archivo
    .replace(/\.[^.]+$/, '')
    .replace(/-/g, ' ')
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())

export function vitrinaLocal() {
  return DESTACADOS_LOCALES.map((archivo) => {
    const match = Object.entries(imagenes).find(([ruta]) => ruta.endsWith(archivo))
    return match && { id: archivo, nombre: titulo(archivo), imagenUrl: match[1], local: true }
  }).filter(Boolean)
}
