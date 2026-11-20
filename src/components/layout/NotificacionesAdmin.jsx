// NotificacionesAdmin.jsx — Campanita de notificaciones en tiempo real
import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'

const imagenes = import.meta.glob('../../assets/productos/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

function obtenerImagen(n) {
  if (n.imagenUrl) return n.imagenUrl;
  if (n.imagen) {
    const match = Object.entries(imagenes).find(([ruta]) => ruta.endsWith(n.imagen));
    if (match) return match[1];
  }
  return null;
}

function formatearFechaHora(timestamp) {
  if (!timestamp?.toDate) return ''
  const fecha = timestamp.toDate()
  const hoy = new Date()
  const esHoy = fecha.toDateString() === hoy.toDateString()
  const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (esHoy) return `Hoy, ${hora}`
  const diaFecha = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  return `${diaFecha}, ${hora}`
}

export default function NotificacionesAdmin() {
  const [notificaciones, setNotificaciones] = useState([])
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'notificaciones'),
      where('leida', '==', false),
      orderBy('creado', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setNotificaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.error('Error cargando notificaciones:', err)
    })
    return () => unsub()
  }, [])

  const marcarLeida = async (id) => {
    try {
      await updateDoc(doc(db, 'notificaciones', id), { leida: true })
    } catch (err) {
      console.error('Error marcando notificación como leída:', err)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((prev) => !prev)}
        className="relative text-white text-xl"
        aria-label="Notificaciones"
      >
        <FontAwesomeIcon icon={faBell} />
        {notificaciones.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-error text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {notificaciones.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-72 bg-superficie border border-borde rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {notificaciones.length === 0 ? (
            <p className="text-textoSecundario text-sm text-center py-6">Sin notificaciones nuevas</p>
          ) : (
            notificaciones.map((n) => (
              <div key={n.id} className="border-b border-borde last:border-0 px-4 py-3 flex gap-3">
                <div className="w-12 h-12 bg-fondoSecundario rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {obtenerImagen(n) ? (
                    <img src={obtenerImagen(n)} alt={n.producto} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🧀</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-textoPrincipal text-sm font-semibold">{n.mensaje}</p>
                  <p className="text-textoSecundario text-[11px]">{formatearFechaHora(n.creado)}</p>
                  <button
                    onClick={() => marcarLeida(n.id)}
                    className="text-botonSecundario text-xs font-semibold mt-1"
                  >
                    Marcar como leída
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}