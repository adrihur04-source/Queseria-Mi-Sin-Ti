// Campanita.jsx — Icono de notificaciones reutilizable para Admin y Empleado
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'

export default function Campanita() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const [abierta, setAbierta] = useState(false)
  const contenedorRef = useRef(null)

  // Igual que en BottomNavEmpleado: decide a dónde mandar según el rol
  const base = usuario?.role === 'admin' ? '/admin' : '/empleado'

  useEffect(() => {
    const q = query(collection(db, 'notificaciones'), orderBy('creado', 'desc'), limit(20))
    const unsub = onSnapshot(q, (snap) => {
      setNotificaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // Cierra el dropdown si haces clic afuera
  useEffect(() => {
    const manejarClickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierta(false)
      }
    }
    document.addEventListener('mousedown', manejarClickAfuera)
    return () => document.removeEventListener('mousedown', manejarClickAfuera)
  }, [])

  const noLeidas = notificaciones.filter((n) => !n.leida)

  const marcarComoLeida = async (id) => {
    try {
      await updateDoc(doc(db, 'notificaciones', id), { leida: true })
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err)
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const batch = writeBatch(db)
      noLeidas.forEach((n) => batch.update(doc(db, 'notificaciones', n.id), { leida: true }))
      await batch.commit()
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err)
    }
  }

  // 🔔 Al hacer clic en una notificación: se marca como leída, se cierra el
  // dropdown y se manda al panel de Alertas de Stock
  const irAAlertas = (notif) => {
    marcarComoLeida(notif.id)
    setAbierta(false)
    navigate(`${base}/alertas`)
  }

  const formatearFechaHora = (timestamp) => {
    if (!timestamp?.toDate) return ''
    const fecha = timestamp.toDate()
    const hoy = new Date()
    const esHoy = fecha.toDateString() === hoy.toDateString()
    const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    if (esHoy) return `Hoy, ${hora}`
    const diaFecha = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    return `${diaFecha}, ${hora}`
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        onClick={() => setAbierta(!abierta)}
        className="relative text-white text-xl"
        aria-label="Notificaciones"
      >
        <FontAwesomeIcon icon={faBell} />
        {noLeidas.length > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-error text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {noLeidas.length > 9 ? '9+' : noLeidas.length}
          </span>
        )}
      </button>

      {abierta && (
        <div className="absolute right-0 top-8 bg-superficie border border-borde rounded-xl shadow-lg z-50 w-72 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-borde sticky top-0 bg-superficie">
            <span className="text-textoPrincipal font-bold text-sm">Notificaciones</span>
            {noLeidas.length > 0 && (
              <button onClick={marcarTodasComoLeidas} className="text-botonPrincipal text-xs font-semibold">
                Marcar todas leídas
              </button>
            )}
          </div>

          {notificaciones.length === 0 ? (
            <p className="text-textoSecundario text-xs text-center py-6">Sin notificaciones</p>
          ) : (
            notificaciones.map((n) => (
              <button
                key={n.id}
                onClick={() => irAAlertas(n)}
                className={`w-full text-left px-4 py-3 border-b border-borde last:border-0 ${
                  n.leida ? 'bg-superficie' : 'bg-red-50'
                }`}
              >
                <p className="text-textoPrincipal text-xs font-semibold">
    🔔 {n.mensaje}
</p>

<p className="text-textoSecundario text-[11px]">
    Producto: {n.producto}
</p>

<p className="text-textoSecundario text-[11px]">
    {formatearFechaHora(n.creado)}
</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}