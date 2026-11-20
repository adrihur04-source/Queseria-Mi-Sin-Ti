// BitacoraSistema.jsx — Bitácora del sistema (solo lectura)
// Agrupada por día; filtros por acción, módulo y persona; exporta CSV.
import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { Download, Plus, Pencil, Trash2, LogIn, LogOut, Circle, FileClock, Lock } from 'lucide-react'
import { db } from '../../firebase/config'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import BuscadorEncabezado from '../../components/staff/BuscadorEncabezado'
import { descargarCSV } from '../../utils/csv'

const MAX_EVENTOS = 1000
const POR_PAGINA = 60

const ACCIONES = {
  Crear: { icono: Plus, clase: 'bg-exito/10 text-exito' },
  Editar: { icono: Pencil, clase: 'bg-oliva/10 text-oliva' },
  Eliminar: { icono: Trash2, clase: 'bg-error/10 text-error' },
  Login: { icono: LogIn, clase: 'bg-pergamino text-cacao' },
  Logout: { icono: LogOut, clase: 'bg-pergamino text-cacao' },
}

function etiquetaDia(d) {
  const hoy = new Date()
  const ayer = new Date(Date.now() - 86400000)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined })
}

export default function BitacoraSistema() {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [accion, setAccion] = useState('Todas')
  const [modulo, setModulo] = useState('Todos')
  const [persona, setPersona] = useState('Todas')
  const [limiteVista, setLimiteVista] = useState(POR_PAGINA)

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'bitacora'), orderBy('creado', 'desc'), limit(MAX_EVENTOS)),
        (s) => {
          setEventos(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => e.creado?.toDate))
          setCargando(false)
        },
        () => setCargando(false),
      ),
    [],
  )

  const opciones = useMemo(
    () => ({
      acciones: ['Todas', ...new Set(eventos.map((e) => e.accion).filter(Boolean))],
      modulos: ['Todos', ...new Set(eventos.map((e) => e.modulo).filter(Boolean))].sort((a, b) => (a === 'Todos' ? -1 : a.localeCompare(b))),
      personas: ['Todas', ...new Set(eventos.map((e) => e.usuario).filter(Boolean))].sort((a, b) => (a === 'Todas' ? -1 : a.localeCompare(b))),
    }),
    [eventos],
  )

  const filtrados = useMemo(() => {
    const t = busqueda.toLowerCase()
    return eventos.filter(
      (e) =>
        (accion === 'Todas' || e.accion === accion) &&
        (modulo === 'Todos' || e.modulo === modulo) &&
        (persona === 'Todas' || e.usuario === persona) &&
        (!t || [e.descripcion, e.usuario, e.modulo].some((v) => (v || '').toLowerCase().includes(t))),
    )
  }, [eventos, accion, modulo, persona, busqueda])

  const grupos = useMemo(() => {
    const out = []
    for (const e of filtrados.slice(0, limiteVista)) {
      const d = e.creado.toDate()
      const k = d.toDateString()
      if (!out.length || out[out.length - 1].clave !== k) out.push({ clave: k, etiqueta: etiquetaDia(d), items: [] })
      out[out.length - 1].items.push(e)
    }
    return out
  }, [filtrados, limiteVista])

  const exportar = () =>
    descargarCSV(
      'bitacora',
      ['Fecha', 'Hora', 'Módulo', 'Acción', 'Descripción', 'Usuario'],
      filtrados.map((e) => {
        const d = e.creado.toDate()
        return [d.toLocaleDateString('es-MX'), d.toLocaleTimeString('es-MX'), e.modulo, e.accion, e.descripcion, e.usuario]
      }),
    )

  const selector = (valor, set, lista, etiqueta) => (
    <select value={valor} onChange={(e) => { set(e.target.value); setLimiteVista(POR_PAGINA) }} aria-label={etiqueta} className="campo h-11 w-auto max-w-[12rem] py-0">
      {lista.map((x) => <option key={x}>{x}</option>)}
    </select>
  )

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff
        titulo="Bitácora"
        subtitulo="Registro de actividad · solo lectura"
        acciones={
          <button onClick={exportar} disabled={!filtrados.length} className="btn h-11 border border-white/20 px-3 text-marfil hover:bg-white/10 disabled:opacity-40">
            <Download size={18} /> <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        }
      >
        <BuscadorEncabezado valor={busqueda} onCambio={setBusqueda} placeholder="Buscar en descripción, persona o módulo…" />
      </EncabezadoStaff>

      <div className="mx-auto max-w-4xl space-y-5 px-4 pt-5 md:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {selector(accion, setAccion, opciones.acciones, 'Acción')}
          {selector(modulo, setModulo, opciones.modulos, 'Módulo')}
          {selector(persona, setPersona, opciones.personas, 'Persona')}
          <span className="ml-auto text-xs text-textoSecundario">{filtrados.length} evento{filtrados.length === 1 ? '' : 's'}</span>
        </div>

        {cargando ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="tarjeta h-14 animate-pulse" />)}</div>
        ) : grupos.length === 0 ? (
          <div className="tarjeta flex flex-col items-center gap-3 py-14 text-center">
            <FileClock size={32} className="text-cacao/40" />
            <p className="font-display text-lg text-cacao">Sin eventos con estos filtros</p>
          </div>
        ) : (
          grupos.map((g) => (
            <section key={g.clave}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-textoSecundario backdrop-blur first-letter:uppercase">
                {g.etiqueta}
              </h2>
              <ol className="tarjeta divide-y divide-borde/60 overflow-hidden">
                {g.items.map((e) => {
                  const a = ACCIONES[e.accion] || { icono: Circle, clase: 'bg-pergamino text-textoSecundario' }
                  const Icono = a.icono
                  return (
                    <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.clase}`} title={e.accion}>
                        <Icono size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-cacao">{e.descripcion}</p>
                        <p className="mt-0.5 text-xs text-textoSecundario">
                          <span className="font-medium text-oliva">{e.modulo}</span> · {e.usuario}
                        </p>
                      </div>
                      <time className="shrink-0 text-xs text-textoSecundario">
                        {e.creado.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))
        )}

        {filtrados.length > limiteVista && (
          <button onClick={() => setLimiteVista((l) => l + POR_PAGINA)} className="btn-secundario h-11 w-full">
            Mostrar más ({filtrados.length - limiteVista} restantes)
          </button>
        )}

        <p className="flex items-center justify-center gap-2 pb-4 text-xs text-textoSecundario">
          <Lock size={13} /> Los eventos no se pueden editar ni borrar. Se muestran los últimos {MAX_EVENTOS}.
        </p>
      </div>

      <BottomNavAdmin />
    </div>
  )
}
