// EstadoPedido.jsx — Insignia de estatus: color + icono + texto (nunca solo color)
import { Clock, ChefHat, Wallet, PackageCheck, XCircle, Truck } from 'lucide-react'
import { ETIQUETAS_STATUS } from '../../services/pedidos'

const ESTILO_ESTADO = {
  pendiente: { icono: Clock, clase: 'bg-miel/10 text-miel ring-miel/25' },
  preparando: { icono: ChefHat, clase: 'bg-oliva/10 text-oliva ring-oliva/25' },
  pagado: { icono: Wallet, clase: 'bg-vino/10 text-vino ring-vino/25' },
  en_camino: { icono: Truck, clase: 'bg-cacao/10 text-cacao ring-cacao/25' },
  entregado: { icono: PackageCheck, clase: 'bg-exito/10 text-exito ring-exito/25' },
  cancelado: { icono: XCircle, clase: 'bg-error/10 text-error ring-error/25' },
}

export default function EstadoPedido({ status, grande = false }) {
  const estilo = ESTILO_ESTADO[status] || ESTILO_ESTADO.pendiente
  const Icono = estilo.icono
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset ${estilo.clase} ${
        grande ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Icono size={grande ? 16 : 13} />
      {ETIQUETAS_STATUS[status] || status}
    </span>
  )
}
