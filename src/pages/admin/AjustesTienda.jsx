// AjustesTienda.jsx — Ajustes generales de la tienda (Firestore: configuracion/tienda)
// Envío a domicilio (costo, envío gratis, zona, tiempo) y datos de contacto que ve el cliente
// en la portada, el carrito y el asistente Quesi.
import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Truck, MapPin, Clock, Phone, Gift, Save, CheckCircle2, Store, Sparkles } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useConfigTienda } from '../../hooks/useConfigTienda'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import Interruptor from '../../components/staff/Interruptor'
import { registrarEvento } from '../../utils/bitacora'
import { dinero } from '../../utils/formato'

export default function AjustesTienda() {
  const { usuario } = useAuth()
  const config = useConfigTienda()
  const [cambios, setCambios] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const v = { ...config, ...cambios } // lo guardado + lo que estás editando
  const sucio = Object.keys(cambios).length > 0
  const set = (k, val) => setCambios((c) => ({ ...c, [k]: val }))

  const guardar = async () => {
    setError('')
    const costo = Number(v.envioCosto)
    const gratis = Number(v.envioGratisDesde)
    if (Number.isNaN(costo) || costo < 0) return setError('El costo de envío debe ser 0 o mayor.')
    if (Number.isNaN(gratis) || gratis < 0) return setError('El monto para envío gratis debe ser 0 o mayor (0 = nunca gratis).')
    if (!String(v.direccion).trim()) return setError('Escribe la dirección de la tienda.')
    setGuardando(true)
    try {
      await setDoc(
        doc(db, 'configuracion', 'tienda'),
        {
          envioActivo: !!v.envioActivo,
          envioCosto: costo,
          envioGratisDesde: gratis,
          envioZona: String(v.envioZona).trim(),
          envioTiempo: String(v.envioTiempo).trim(),
          direccion: String(v.direccion).trim(),
          horario: String(v.horario).trim(),
          telefono: String(v.telefono).trim(),
          actualizado: serverTimestamp(),
        },
        { merge: true },
      )
      await registrarEvento({ modulo: 'Configuración', accion: 'Editar', descripcion: `Ajustes de tienda actualizados · envío ${dinero(costo)}, gratis desde ${dinero(gratis)}`, usuarioNombre: usuario?.nombre || 'Administración' })
      setCambios({})
      setToast('Ajustes guardados')
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      console.error(err)
      setError(err.code === 'permission-denied' ? 'Firestore no permite escribir en "configuracion". Revisa las reglas de seguridad.' : 'No se pudieron guardar los ajustes.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema pb-36 md:pb-28">
      <EncabezadoStaff titulo="Ajustes de la tienda" subtitulo="Envío a domicilio y datos de contacto" />

      <div className="mx-auto grid max-w-5xl gap-5 px-4 pt-5 md:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {/* Envío */}
          <section className="tarjeta space-y-4 p-5">
            <Titulo icono={Truck} texto="Envío a domicilio" />
            <Interruptor activo={!!v.envioActivo} onCambio={(x) => set('envioActivo', x)} etiqueta="Ofrecer envío a domicilio" sub={v.envioActivo ? 'Los clientes pueden elegirlo en su carrito' : 'Solo recoger en tienda'} icono={Truck} />
            <div className={`grid gap-4 transition-opacity sm:grid-cols-2 ${v.envioActivo ? '' : 'pointer-events-none opacity-50'}`}>
              <Campo id="costo" etiqueta="Costo de envío" prefijo="$" tipo="number" valor={v.envioCosto} onCambio={(x) => set('envioCosto', x)} />
              <Campo id="gratis" etiqueta="Envío gratis desde" prefijo="$" tipo="number" valor={v.envioGratisDesde} onCambio={(x) => set('envioGratisDesde', x)} ayuda="0 = nunca es gratis" />
              <Campo id="zona" etiqueta="Zona de entrega" valor={v.envioZona} onCambio={(x) => set('envioZona', x)} ayuda="Ej. Solo dentro de la ciudad" />
              <Campo id="tiempo" etiqueta="Tiempo estimado" valor={v.envioTiempo} onCambio={(x) => set('envioTiempo', x)} ayuda="Ej. 45–90 min" />
            </div>
          </section>

          {/* Tienda */}
          <section className="tarjeta space-y-4 p-5">
            <Titulo icono={Store} texto="Datos de la tienda" />
            <Campo id="direccion" etiqueta="Dirección" icono={MapPin} valor={v.direccion} onCambio={(x) => set('direccion', x)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="horario" etiqueta="Horario" icono={Clock} valor={v.horario} onCambio={(x) => set('horario', x)} />
              <Campo id="telefono" etiqueta="Teléfono / WhatsApp" icono={Phone} tipo="tel" valor={v.telefono} onCambio={(x) => set('telefono', x)} />
            </div>
          </section>
        </div>

        {/* Vista previa */}
        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-textoSecundario"><Sparkles size={14} className="text-miel" /> Así lo ve el cliente</p>
          <div className="vidrio space-y-3 rounded-3xl p-5">
            <p className="font-display text-lg font-semibold text-cacao">¿Cómo lo quieres recibir?</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl border-2 border-borde p-3"><Store size={18} className="mb-1 text-cacao" /><b className="block text-cacao">Recoger</b><span className="text-textoSecundario">Gratis</span></div>
              <div className={`rounded-2xl border-2 p-3 ${v.envioActivo ? 'border-vino bg-vino/5' : 'border-dashed border-borde opacity-50'}`}>
                <Truck size={18} className="mb-1 text-vino" />
                <b className="block text-cacao">A domicilio</b>
                <span className="text-textoSecundario">{v.envioActivo ? (Number(v.envioCosto) ? dinero(Number(v.envioCosto)) : 'Gratis') : 'No disponible'}</span>
              </div>
            </div>
            {v.envioActivo && Number(v.envioGratisDesde) > 0 && (
              <p className="flex items-center gap-2 rounded-xl bg-miel/10 px-3 py-2 text-xs text-cacao"><Gift size={14} className="text-miel" /> Envío gratis en compras desde <b>{dinero(Number(v.envioGratisDesde))}</b></p>
            )}
            <ul className="space-y-1.5 border-t border-borde/60 pt-3 text-xs text-textoSecundario">
              <li className="flex items-center gap-2"><MapPin size={13} className="text-oliva" /> {v.direccion || '—'}</li>
              <li className="flex items-center gap-2"><Clock size={13} className="text-oliva" /> {v.horario || '—'}</li>
              {v.telefono && <li className="flex items-center gap-2"><Phone size={13} className="text-oliva" /> {v.telefono}</li>}
            </ul>
          </div>
        </aside>
      </div>

      {/* Barra de guardar */}
      <div className={`fijo-inferior fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 px-4 transition-all duration-300 md:bottom-6 ${sucio || error ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}>
        <div className="vidrio mx-auto flex max-w-3xl items-center gap-3 rounded-2xl p-3">
          <p className={`flex-1 text-sm ${error ? 'font-medium text-error' : 'text-textoSecundario'}`}>{error || 'Tienes cambios sin guardar'}</p>
          <button onClick={() => { setCambios({}); setError('') }} disabled={guardando} className="btn-fantasma h-11">Descartar</button>
          <button onClick={guardar} disabled={guardando || !sucio} className="btn-primario h-11"><Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>

      {toast && (
        <div role="status" className="fixed inset-x-4 top-6 z-[70] mx-auto flex max-w-sm animate-emerger items-center gap-2 rounded-2xl bg-tinta px-4 py-3 text-sm font-medium text-white shadow-elevada">
          <CheckCircle2 size={18} className="text-exito" /> {toast}
        </div>
      )}

      <BottomNavAdmin />
    </div>
  )
}

function Titulo({ icono: Icono, texto }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-cacao">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-vino/10 text-vino"><Icono size={18} /></span>
      {texto}
    </h2>
  )
}

function Campo({ id, etiqueta, valor, onCambio, tipo = 'text', prefijo, icono: Icono, ayuda }) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta">{etiqueta}</label>
      <div className="relative">
        {prefijo && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-textoSecundario">{prefijo}</span>}
        {Icono && <Icono size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-textoSecundario" />}
        <input
          id={id}
          type={tipo}
          min={tipo === 'number' ? 0 : undefined}
          value={valor ?? ''}
          onChange={(e) => onCambio(e.target.value)}
          className={`campo h-12 ${prefijo ? 'pl-8' : ''} ${Icono ? 'pl-10' : ''}`}
        />
      </div>
      {ayuda && <p className="mt-1 text-xs text-textoSecundario">{ayuda}</p>}
    </div>
  )
}
