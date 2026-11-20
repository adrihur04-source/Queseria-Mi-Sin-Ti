// PedidosEntregados.jsx — Historial de pedidos entregados (cajero/empleado)
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { Search, ChevronRight, PackageOpen } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavEmpleado from '../../components/layout/BottomNavEmpleado'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import EstadoPedido from '../../components/staff/EstadoPedido'
import { dinero, folio, fechaRelativa, esDeHoy } from '../../utils/formato'

export default function PedidosEntregados() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const base = usuario?.role === 'admin' ? '/admin' : '/empleado'
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'pedidos'), where('status', '==', 'entregado'), orderBy('creado', 'desc'))
    return onSnapshot(
      q,
      (snap) => {
        setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setCargando(false)
      },
      (err) => {
        console.error('Error cargando pedidos entregados:', err)
        setCargando(false)
      },
    )
  }, [])

  const hoy = useMemo(() => pedidos.filter((p) => esDeHoy(p.creado)), [pedidos])
  const totalHoy = hoy.reduce((s, p) => s + (Number(p.total) || 0), 0)

  const visibles = pedidos.filter((p) => {
    const t = busqueda.trim().toLowerCase().replace('#', '')
    return !t || folio(p.id).toLowerCase().includes(t) || (p.clienteNombre || '').toLowerCase().includes(t)
  })

  return (
    <div className="min-h-screen bg-crema pb-28">
      <EncabezadoStaff titulo="Entregados" subtitulo={`${pedidos.length} en total`} atras={`${base}/pedidos`} />

      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="tarjeta p-4">
            <p className="text-xs text-textoSecundario">Entregados hoy</p>
            <p className="font-display text-3xl font-semibold text-cacao">{hoy.length}</p>
          </div>
          <div className="tarjeta p-4">
            <p className="text-xs text-textoSecundario">Cobrado hoy</p>
            <p className="font-display text-3xl font-semibold text-exito">{dinero(totalHoy)}</p>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por folio o cliente…" className="campo h-12 pl-11" />
        </div>

        {cargando ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="tarjeta h-20 animate-pulse" />)}
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-cacao/50">
              <PackageOpen size={30} />
            </span>
            <p className="font-display text-lg text-cacao">{busqueda ? 'Sin coincidencias' : 'Aún no hay pedidos entregados'}</p>
          </div>
        ) : (
          <ul className="tarjeta divide-y divide-borde/60 overflow-hidden">
            {visibles.map((p) => (
              <li key={p.id}>
                <button onClick={() => navigate(`${base}/pedidos/${p.id}`)} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-crema">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-cacao">
                      {folio(p.id)} <span className="font-normal text-textoSecundario">· {p.clienteNombre || 'Cliente general'}</span>
                    </p>
                    <p className="text-xs text-textoSecundario">{fechaRelativa(p.creado)}</p>
                  </div>
                  <span className="hidden sm:block"><EstadoPedido status="entregado" /></span>
                  <span className="text-sm font-semibold text-cacao">{dinero(p.total)}</span>
                  <ChevronRight size={18} className="text-textoSecundario" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNavEmpleado />
    </div>
  )
}
