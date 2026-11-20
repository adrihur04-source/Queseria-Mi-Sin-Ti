// Estadisticas.jsx — Fila de cifras resumidas (KPI) para encabezar listados
export default function Estadisticas({ items }) {
  return (
    <div className={`grid gap-3 ${items.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
      {items.map(({ etiqueta, valor, acento = 'text-cacao', sub }) => (
        <div key={etiqueta} className="tarjeta p-4">
          <p className="text-xs text-textoSecundario">{etiqueta}</p>
          <p className={`mt-0.5 truncate font-display text-2xl font-semibold ${acento}`}>{valor}</p>
          {sub && <p className="truncate text-xs text-textoSecundario">{sub}</p>}
        </div>
      ))}
    </div>
  )
}
