// foto.js — Prepara una foto de perfil en el navegador
// Recorta al centro en cuadrado, la reduce a 320×320 y la comprime a JPEG (~20–50 KB).
// Se guarda como data URL en usuarios/{uid}.foto: no requiere Firebase Storage (plan de pago).
const LADO = 320
const MAX_BYTES = 700 * 1024 // Firestore admite hasta 1 MB por documento

export async function prepararFotoPerfil(archivo) {
  if (!archivo?.type?.startsWith('image/')) throw new Error('Elige un archivo de imagen (JPG, PNG o WEBP).')
  if (archivo.size > 15 * 1024 * 1024) throw new Error('La imagen pesa demasiado (máximo 15 MB).')

  const url = URL.createObjectURL(archivo)
  try {
    const img = await new Promise((ok, mal) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => mal(new Error('No se pudo leer la imagen.'))
      i.src = url
    })
    const lado = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - lado) / 2
    const sy = (img.naturalHeight - lado) / 2
    const canvas = document.createElement('canvas')
    canvas.width = LADO
    canvas.height = LADO
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, LADO, LADO)

    for (const calidad of [0.85, 0.7, 0.55]) {
      const data = canvas.toDataURL('image/jpeg', calidad)
      if (data.length * 0.75 < MAX_BYTES) return data
    }
    throw new Error('No se pudo comprimir la imagen. Prueba con otra.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
