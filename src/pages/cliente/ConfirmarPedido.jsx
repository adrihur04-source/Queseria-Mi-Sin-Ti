// ConfirmarPedido.jsx — Pantalla de confirmación de pedido
// Estados: revisión, validación, procesando, error red, éxito

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/layout/BottomNav'

// 🛒 Datos de prueba
const productosCarrito = [
  { id: 2, nombre: 'Malintizi', cantidad: 1, precio: 60 },
  { id: 14, nombre: 'Sidra Ambar', cantidad: 2, precio: 132 },
  { id: 9, nombre: 'Finca de Moras', cantidad: 1, precio: 220 },
]

export default function ConfirmarPedido() {
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('Jennifer Meza')
  const [telefono, setTelefono] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [metodoPago, setMetodoPago] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [errorRed, setErrorRed] = useState(false)
  const [pedidoExitoso, setPedidoExitoso] = useState(false)

  // Errores
  const [errorNombre, setErrorNombre] = useState('')
  const [errorTelefono, setErrorTelefono] = useState('')
  const [errorMetodo, setErrorMetodo] = useState('')

  const total = productosCarrito.reduce((acc, p) => acc + p.precio, 0)

  // Pasos del stepper
  const pasos = ['Carrito', 'Confirmar', 'Listo']

  const validar = () => {
    let valido = true
    setErrorNombre('')
    setErrorTelefono('')
    setErrorMetodo('')

    if (!nombre.trim()) { setErrorNombre('Completa todos los campos requeridos antes de continuar.'); valido = false }
    if (!telefono.trim()) { setErrorTelefono('Completa todos los campos requeridos antes de continuar.'); valido = false }
    if (!metodoPago) { setErrorMetodo('Selecciona un método de pago'); valido = false }
    return valido
  }

  const handleConfirmar = async () => {
    if (!validar()) return
    setProcesando(true)
    setErrorRed(false)

    // Simulación de error de red
    setTimeout(() => {
      setProcesando(false)
      // 🔥 Aquí el backend conectará con Firestore
      // Simular éxito:
      setPedidoExitoso(true)
      // Simular error: setErrorRed(true)
    }, 2000)
  }

  // Estado 5 — Pedido exitoso
  if (pedidoExitoso) {
    return (
      <div className="min-h-screen bg-fondoPrincipal flex flex-col px-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 pt-6 mb-4">
          <button onClick={() => navigate(-1)} className="text-textoPrincipal">←</button>
          <span className="text-textoPrincipal font-bold">Confirmar pedido</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {pasos.map((paso, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${i <= 2 ? 'bg-botonPrincipal text-white' : 'bg-fondoSecundario text-textoSecundario'}`}>
                {i < 2 ? '✓' : i + 1}
              </div>
              {i < pasos.length - 1 && <div className="w-8 h-0.5 bg-botonPrincipal" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-textoPrincipal text-xl font-bold">¡Pedido #00001 registrado!</h1>
          <p className="text-textoSecundario text-sm text-center">
            Tu pedido quedó en estatus Pendiente. El equipo de Quesería de Mi Sin Tí se pondrá en contacto contigo.
          </p>
        </div>

        {/* Resumen */}
        <div className="bg-superficie rounded-xl border border-borde p-4 mb-6">
          {productosCarrito.map((p) => (
            <div key={p.id} className="flex justify-between text-sm mb-1">
              <span className="text-textoSecundario">{p.nombre} ×{p.cantidad}</span>
              <span className="text-textoPrincipal">${p.precio}</span>
            </div>
          ))}
          <div className="border-t border-borde mt-2 pt-2 flex flex-col gap-1">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-textoPrincipal">Total</span>
              <span className="text-textoPrincipal">${total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textoSecundario">Estatus</span>
              <span className="text-botonSecundario font-semibold">Pendiente</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textoSecundario">Fecha</span>
              <span className="text-textoSecundario">07 Jun 2026 · 9:41</span>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/historial')} className="w-full bg-botonPrincipal text-white rounded-xl py-3 text-sm font-semibold mb-3">
          Ver en mi historial
        </button>
        <button onClick={() => navigate('/catalogo')} className="w-full border border-borde text-textoSecundario rounded-xl py-3 text-sm">
          Seguir comprando
        </button>
        <BottomNav />
      </div>
    )
  }

  // Estado 3 — Procesando
  if (procesando) {
    return (
      <div className="min-h-screen bg-fondoPrincipal flex flex-col items-center justify-center px-6 pb-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-botonPrincipal border-t-transparent rounded-full animate-spin" />
          <p className="text-textoPrincipal font-semibold">Registrando tu pedido...</p>
          <p className="text-textoSecundario text-sm text-center">
            Estamos guardando tu pedido en el sistema. Por favor espera un momento.
          </p>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-20">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-6 mb-4">
        <button onClick={() => navigate(-1)} className="text-textoPrincipal">←</button>
        <span className="text-textoPrincipal font-bold">Confirmar pedido</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {pasos.map((paso, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${i === 0 ? 'bg-botonPrincipal text-white' : i === 1 ? 'bg-botonPrincipal text-white' : 'bg-fondoSecundario text-textoSecundario'}`}>
              {i === 0 ? '✓' : i + 1}
            </div>
            {i < pasos.length - 1 && (
              <div className={`w-8 h-0.5 ${i === 0 ? 'bg-botonPrincipal' : 'bg-borde'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* Error de red */}
        {errorRed && (
          <div className="bg-red-50 border border-error rounded-xl px-4 py-3">
            <p className="text-error text-sm font-semibold mb-1">No se pudo registrar el pedido</p>
            <p className="text-error text-xs">
              Ocurrió un error al intentar conectar con el servidor. Intenta de nuevo — intenta de nuevo más tarde.
            </p>
            <p className="text-error text-xs mt-1">Tu carrito no se perdió. Verifica tu conexión e intenta nuevamente.</p>
          </div>
        )}

        {/* Resumen del pedido */}
        <div className="bg-superficie rounded-xl border border-borde p-4">
          <h2 className="text-textoPrincipal font-bold text-sm mb-3">RESUMEN DEL PEDIDO</h2>
          {productosCarrito.map((p) => (
            <div key={p.id} className="flex justify-between text-sm mb-1">
              <span className="text-textoSecundario">{p.nombre} ×{p.cantidad}</span>
              <span className="text-textoPrincipal">${p.precio}</span>
            </div>
          ))}
          <div className="border-t border-borde mt-2 pt-2 flex justify-between text-sm font-bold">
            <span className="text-textoPrincipal">Total</span>
            <span className="text-textoPrincipal">${total}</span>
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="bg-superficie rounded-xl border border-borde p-4 flex flex-col gap-3">
          <h2 className="text-textoPrincipal font-bold text-sm">DATOS DE CONTACTO</h2>

          {/* Nombre */}
          <div className="flex flex-col gap-1">
            <label className="text-textoPrincipal text-xs font-semibold uppercase tracking-wide">
              Nombre <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`border rounded-lg px-4 py-3 text-sm bg-fondoPrincipal text-textoPrincipal focus:outline-none ${errorNombre ? 'border-error' : 'border-borde focus:border-botonPrincipal'}`}
            />
            {errorNombre && <p className="text-error text-xs">{errorNombre}</p>}
          </div>

          {/* Teléfono */}
          <div className="flex flex-col gap-1">
            <label className="text-textoPrincipal text-xs font-semibold uppercase tracking-wide">
              Teléfono de contacto <span className="text-error">*</span>
            </label>
            <input
              type="tel"
              placeholder="246 221 7002"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={`border rounded-lg px-4 py-3 text-sm bg-superficie text-textoPrincipal placeholder-textoSecundario focus:outline-none ${errorTelefono ? 'border-error' : 'border-borde focus:border-botonPrincipal'}`}
            />
            {errorTelefono && <p className="text-error text-xs">{errorTelefono}</p>}
          </div>

          {/* Observaciones */}
          <div className="flex flex-col gap-1">
            <label className="text-textoPrincipal text-xs font-semibold uppercase tracking-wide">
              Observaciones (opcional)
            </label>
            <textarea
              placeholder="Agrega instrucciones especiales para el pedido..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="border border-borde rounded-lg px-4 py-3 text-sm bg-superficie text-textoPrincipal placeholder-textoSecundario focus:outline-none focus:border-botonPrincipal resize-none"
            />
          </div>
        </div>

        {/* Método de pago */}
        <div className="bg-superficie rounded-xl border border-borde p-4 flex flex-col gap-3">
          <h2 className="text-textoPrincipal font-bold text-sm">MÉTODO DE PAGO</h2>
          {errorMetodo && <p className="text-error text-xs">{errorMetodo}</p>}

          {[
            { value: 'efectivo', label: 'Efectivo/Directo' },
          ].map((op) => (
            <label key={op.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="metodoPago"
                value={op.value}
                checked={metodoPago === op.value}
                onChange={() => setMetodoPago(op.value)}
                className="accent-botonPrincipal w-4 h-4"
              />
              <span className="text-textoPrincipal text-sm">{op.label}</span>
            </label>
          ))}

          <p className="text-textoSecundario text-xs">
            Sin pago en línea en esta versión (B2B/Frappe)
          </p>
        </div>

        {/* Botones */}
        <button
          onClick={handleConfirmar}
          className="w-full bg-botonSecundario text-white rounded-xl py-3 text-sm font-semibold"
        >
          ✓ Confirmar pedido · ${total}
        </button>

        {errorRed && (
          <button
            onClick={handleConfirmar}
            className="w-full border border-botonPrincipal text-botonPrincipal rounded-xl py-3 text-sm font-semibold"
          >
            Reintentar
          </button>
        )}

        <button
          onClick={() => navigate('/carrito')}
          className="w-full border border-borde text-textoSecundario rounded-xl py-3 text-sm"
        >
          ← Volver al carrito
        </button>

      </div>

      <BottomNav />
    </div>
  )
}