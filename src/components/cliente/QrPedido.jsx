// QrPedido.jsx — Código QR del pedido para mostrar en caja
// El QR abre directamente el detalle del pedido en la pantalla del cajero (/empleado/pedidos/:id):
// el cajero lo escanea con la cámara del celular y le aparece el pedido listo para atender.
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { X } from 'lucide-react'
import { folio } from '../../utils/formato'

export default function QrPedido({ pedido, onCerrar }) {
  const [src, setSrc] = useState(null)
  const url = `${window.location.origin}/empleado/pedidos/${pedido.id}`

  useEffect(() => {
    QRCode.toDataURL(url, { width: 520, margin: 1, color: { dark: '#3B2418', light: '#FFFFFF' }, errorCorrectionLevel: 'M' })
      .then(setSrc)
      .catch(() => setSrc(null))
  }, [url])

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-[70] flex animate-desvanecer items-center justify-center bg-tinta/60 p-5 backdrop-blur-sm" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label={`QR del pedido ${folio(pedido.id)}`} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm animate-emerger overflow-hidden rounded-[2rem] bg-superficie text-center shadow-elevada">
        <div className="bg-gradient-to-br from-vino to-vino-oscuro px-6 pb-14 pt-6 text-white">
          <button onClick={onCerrar} aria-label="Cerrar" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-white/80 hover:bg-white/10"><X size={20} /></button>
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">Muestra este código en caja</p>
          <p className="mt-1 font-display text-4xl font-semibold tracking-wider">{folio(pedido.id)}</p>
        </div>
        <div className="-mt-10 px-6 pb-6">
          <div className="mx-auto w-fit rounded-3xl bg-white p-4 shadow-elevada ring-1 ring-borde">
            {src ? <img src={src} alt={`Código QR del pedido ${folio(pedido.id)}`} className="h-56 w-56" /> : <div className="h-56 w-56 animate-pulse rounded-2xl bg-pergamino" />}
          </div>
          <p className="mt-4 text-sm text-textoSecundario">El cajero lo escanea y tu pedido aparece al instante. Sube el brillo de tu pantalla para que se lea mejor.</p>
        </div>
      </div>
    </div>
  )
}
