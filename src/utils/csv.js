// csv.js — Exporta filas a CSV (compatible con Excel en español: BOM UTF-8)
export function descargarCSV(nombreArchivo, encabezados, filas) {
  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombreArchivo}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
