// AvisosEnVivo.jsx — Notificaciones en tiempo real (montado una vez en App)
// Cliente: cambia el estatus de su pedido · vuelve un producto que pidió "avísame".
// Personal (cajero/admin): llega un pedido nuevo → timbre + aviso.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { X, Bell, Truck, PackageCheck, ChefHat, Wallet, Sparkles, XCircle } from 'lucide-react'
import { db } from '../firebase/config'
import { useAuth } from '../hooks/useAuth'
import { ETIQUETAS_STATUS, esDomicilio } from '../services/pedidos'
import { folio, dinero } from '../utils/formato'
import { sonarAviso, sonarPedidoNuevo, notificarSistema, pedirPermisoNotificaciones } from '../utils/sonido'

const ICONOS = { preparando: ChefHat, pagado: Wallet, en_camino: Truck, entregado: PackageCheck, cancelado: XCircle }

const textoCliente = (p) =>
  ({
    preparando: 'Ya estamos preparando tu pedido 👨‍🍳',
    pagado: 'Pago registrado. ¡Tus productos te esperan!',
    en_camino: '¡Tu pedido va en camino! 🛵',
    entregado: esDomicilio(p) ? '¡Entregado! Que lo disfrutes 🧀' : '¡Gracias por tu compra! 🧀',
    cancelado: 'Tu pedido fue cancelado.',
  })[p.status] || `Nuevo estatus: ${ETIQUETAS_STATUS[p.status]}`

let idAviso = 0

export default function AvisosEnVivo() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [avisos, setAvisos] = useState([])
  const uid = usuario?.uid
  const rol = usuario?.role || 'cliente'
  const personal = rol === 'admin' || rol === 'empleado'

  // Estable (solo usa setAvisos): se puede llamar desde los listeners
  const mostrarRef = useRef((a) => {
    const id = ++idAviso
    setAvisos((prev) => [...prev.slice(-2), { id, ...a }])
    setTimeout(() => setAvisos((prev) => prev.filter((x) => x.id !== id)), 7000)
  })

  // Enlace de invitación (?ref=QS-XXXXXX): se guarda para precargar el código en el carrito
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && /^QS-[A-Z0-9]{4,10}$/i.test(ref)) localStorage.setItem('queseria-ref', ref.toUpperCase())
  }, [])

  // Permiso de notificaciones del sistema tras la primera interacción
  useEffect(() => {
    if (!uid) return
    const una = () => pedirPermisoNotificaciones()
    window.addEventListener('pointerdown', una, { once: true })
    return () => window.removeEventListener('pointerdown', una)
  }, [uid])

  // Cliente: cambios de estatus de mis pedidos
  useEffect(() => {
    if (!uid || personal) return
    const previos = new Map()
    let primera = true
    return onSnapshot(
      query(collection(db, 'pedidos'), where('clienteId', '==', uid)),
      (s) => {
        s.docs.forEach((d) => {
          const p = { id: d.id, ...d.data(), status: d.data().status || 'pendiente' }
          const antes = previos.get(p.id)
          if (!primera && antes && antes !== p.status) {
            mostrarRef.current({ tipo: p.status, titulo: `Pedido ${folio(p.id)}`, texto: textoCliente(p), ruta: ['entregado', 'cancelado'].includes(p.status) ? '/compras' : '/historial' })
            sonarAviso()
            notificarSistema(`Pedido ${folio(p.id)}`, textoCliente(p))
          }
          previos.set(p.id, p.status)
        })
        primera = false
      },
      () => {},
    )
  }, [uid, personal])

  // Cliente: productos que pidió "avísame cuando llegue"
  useEffect(() => {
    if (!uid || personal) return
    let productosVivos = {}
    let misAvisos = []
    const revisar = () => {
      for (const a of misAvisos) {
        const p = productosVivos[a.productoId]
        if (p && Number(p.stock) > 0) {
          mostrarRef.current({ tipo: 'stock', titulo: '¡Ya llegó!', texto: `${p.nombre} está disponible otra vez`, ruta: `/catalogo/${p.id}` })
          sonarAviso()
          notificarSistema('¡Ya llegó!', `${p.nombre} está disponible otra vez`)
          deleteDoc(doc(db, 'avisosStock', a.id)).catch(() => {})
          misAvisos = misAvisos.filter((x) => x.id !== a.id)
        }
      }
    }
    const u1 = onSnapshot(
      query(collection(db, 'avisosStock'), where('clienteId', '==', uid)),
      (s) => {
        misAvisos = s.docs.map((d) => ({ id: d.id, ...d.data() }))
        revisar()
      },
      () => {},
    )
    const u2 = onSnapshot(
      collection(db, 'productos'),
      (s) => {
        productosVivos = Object.fromEntries(s.docs.map((d) => [d.id, { id: d.id, ...d.data() }]))
        revisar()
      },
      () => {},
    )
    return () => {
      u1()
      u2()
    }
  }, [uid, personal])

  // Personal: pedidos nuevos
  useEffect(() => {
    if (!uid || !personal) return
    const vistos = new Set()
    let primera = true
    const base = rol === 'admin' ? '/admin' : '/empleado'
    return onSnapshot(
      query(collection(db, 'pedidos'), where('status', '==', 'pendiente')),
      (s) => {
        s.docs.forEach((d) => {
          if (!primera && !vistos.has(d.id)) {
            const p = { id: d.id, ...d.data() }
            const texto = `${p.clienteNombre || 'Cliente'} · ${dinero(p.total)}${esDomicilio(p) ? ' · a domicilio' : ''}`
            mostrarRef.current({ tipo: 'nuevo', titulo: `¡Pedido nuevo ${folio(p.id)}!`, texto, ruta: `${base}/pedidos/${p.id}` })
            sonarPedidoNuevo()
            notificarSistema(`Pedido nuevo ${folio(p.id)}`, texto)
          }
          vistos.add(d.id)
        })
        primera = false
      },
      () => {},
    )
  }, [uid, personal, rol])

  if (!avisos.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end">
      {avisos.map((a) => {
        const Icono = a.tipo === 'nuevo' ? Bell : a.tipo === 'stock' ? Sparkles : ICONOS[a.tipo] || Bell
        return (
          <div key={a.id} role="status" className="vidrio pointer-events-auto flex w-full max-w-sm animate-emerger items-center gap-3 rounded-2xl p-3 pr-2">
            <button onClick={() => { setAvisos((p) => p.filter((x) => x.id !== a.id)); navigate(a.ruta) }} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${a.tipo === 'cancelado' ? 'bg-error' : a.tipo === 'entregado' || a.tipo === 'stock' ? 'bg-exito' : 'bg-vino'}`}>
                <span className="absolute inset-0 animate-ping rounded-xl bg-inherit opacity-30 [animation-iteration-count:2]" />
                <Icono size={20} className="relative" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-cacao">{a.titulo}</span>
                <span className="block truncate text-xs text-textoSecundario">{a.texto}</span>
              </span>
            </button>
            <button onClick={() => setAvisos((p) => p.filter((x) => x.id !== a.id))} aria-label="Cerrar aviso" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-textoSecundario hover:bg-pergamino">
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
