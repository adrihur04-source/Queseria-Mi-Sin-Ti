// GestionProveedores.jsx — Directorio de proveedores (datos reales: colección 'proveedores')
// Los productos se vinculan con los campos proveedorId + proveedor (nombre) en cada producto.
import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { Plus, Pencil, Trash2, Truck, Phone, Mail, MapPin, Download, Search, Check } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import BuscadorEncabezado from '../../components/staff/BuscadorEncabezado'
import Estadisticas from '../../components/staff/Estadisticas'
import Hoja from '../../components/staff/Hoja'
import Interruptor from '../../components/staff/Interruptor'
import Confirmacion from '../../components/staff/Confirmacion'
import { registrarEvento } from '../../utils/bitacora'

// Directorio que venía de ejemplo en la versión anterior; se puede importar una vez.
const PROVEEDORES_EJEMPLO = [
  { nombre: 'Mozencahua', tipo: 'Cerveza artesanal', telefono: '246 123 0001', correo: 'info@mozencahua.mx', direccion: 'Tlaxco, Tlaxcala' },
  { nombre: 'Ayotochtinci', tipo: 'Cerveza artesanal', telefono: '246 248 5031', correo: 'info@ayotochtinci.mx', direccion: 'Tlaxcala' },
  { nombre: 'Oscar (Mieles)', tipo: 'Mieles artesanales', telefono: '246 100 2233', correo: 'oscar@mieles.mx', direccion: 'Tlaxcala' },
  { nombre: 'Tlazcallan (Mieles)', tipo: 'Mieles', telefono: '246 300 4455', correo: 'tlazcallan@mieles.mx', direccion: 'Tlaxcala' },
  { nombre: 'Tlacuache (Destilados)', tipo: 'Destilados / mezcales', telefono: '246 500 6677', correo: 'tlacuache@destilados.mx', direccion: 'Oaxaca' },
  { nombre: 'Sidras Maipú', tipo: 'Sidras', telefono: '246 700 8899', correo: 'sidras@maipu.mx', direccion: 'Tlaxcala' },
  { nombre: 'Vinos Artesanales', tipo: 'Vinos', telefono: '246 900 1122', correo: 'vinos@artesanales.mx', direccion: 'Tlaxcala' },
  { nombre: 'Salsa Macha Xnaxti', tipo: 'Salsas', telefono: '246 111 2233', correo: 'salsas@xnaxti.mx', direccion: 'Tlaxcala', activo: false },
]

const VACIO = { nombre: '', tipo: '', contacto: '', telefono: '', correo: '', direccion: '', notas: '', activo: true }

export default function GestionProveedores() {
  const { usuario } = useAuth()
  const responsable = usuario?.nombre || 'Administración'

  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('activos')
  const [editando, setEditando] = useState(null) // null | 'nuevo' | proveedor
  const [form, setForm] = useState(VACIO)
  const [vinculados, setVinculados] = useState(new Set())
  const [buscarProd, setBuscarProd] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aEliminar, setAEliminar] = useState(null)
  const [importando, setImportando] = useState(false)

  useEffect(() => {
    const u1 = onSnapshot(
      collection(db, 'proveedores'),
      (s) => {
        setProveedores(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
        setCargando(false)
      },
      () => setCargando(false),
    )
    const u2 = onSnapshot(
      collection(db, 'productos'),
      (s) => setProductos(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))),
      () => {},
    )
    return () => {
      u1()
      u2()
    }
  }, [])

  const productosDe = useMemo(() => {
    const m = {}
    for (const p of productos) if (p.proveedorId) (m[p.proveedorId] = m[p.proveedorId] || []).push(p)
    return m
  }, [productos])

  const visibles = proveedores.filter((p) => {
    if (filtro === 'activos' && p.activo === false) return false
    if (filtro === 'inactivos' && p.activo !== false) return false
    const t = busqueda.toLowerCase()
    return !t || [p.nombre, p.tipo, p.contacto].some((v) => (v || '').toLowerCase().includes(t))
  })

  const abrir = (p) => {
    setError('')
    setBuscarProd('')
    setEditando(p)
    if (p === 'nuevo') {
      setForm(VACIO)
      setVinculados(new Set())
    } else {
      setForm({ ...VACIO, ...p, activo: p.activo !== false })
      setVinculados(new Set((productosDe[p.id] || []).map((x) => x.id)))
    }
  }

  const alternarProducto = (id) =>
    setVinculados((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const guardar = async () => {
    const nombre = form.nombre.trim()
    if (!nombre) return setError('Escribe el nombre del proveedor.')
    if (form.correo && !/^\S+@\S+\.\S+$/.test(form.correo)) return setError('Revisa el correo.')
    setGuardando(true)
    setError('')
    try {
      const datos = {
        nombre,
        tipo: form.tipo.trim(),
        contacto: form.contacto.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        direccion: form.direccion.trim(),
        notas: form.notas.trim(),
        activo: form.activo,
      }
      let id = editando?.id
      if (editando === 'nuevo') {
        const ref = await addDoc(collection(db, 'proveedores'), { ...datos, creado: serverTimestamp() })
        id = ref.id
      } else {
        await updateDoc(doc(db, 'proveedores', id), datos)
      }

      // Sincronizar productos vinculados
      const antes = new Set((productosDe[id] || []).map((x) => x.id))
      const lote = writeBatch(db)
      let cambios = 0
      for (const pid of vinculados) {
        const p = productos.find((x) => x.id === pid)
        if (!antes.has(pid) || p?.proveedor !== nombre) {
          lote.update(doc(db, 'productos', pid), { proveedorId: id, proveedor: nombre })
          cambios++
        }
      }
      for (const pid of antes) {
        if (!vinculados.has(pid)) {
          lote.update(doc(db, 'productos', pid), { proveedorId: null, proveedor: null })
          cambios++
        }
      }
      if (cambios) await lote.commit()

      await registrarEvento({
        modulo: 'Proveedores',
        accion: editando === 'nuevo' ? 'Crear' : 'Editar',
        descripcion: `Proveedor ${editando === 'nuevo' ? 'creado' : 'editado'} · ${nombre} · ${vinculados.size} producto(s)`,
        usuarioNombre: responsable,
      })
      setEditando(null)
    } catch (err) {
      console.error(err)
      setError(err.code === 'permission-denied' ? 'No tienes permiso para esta acción.' : 'No se pudo guardar el proveedor.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    setGuardando(true)
    try {
      const lote = writeBatch(db)
      ;(productosDe[aEliminar.id] || []).forEach((p) => lote.update(doc(db, 'productos', p.id), { proveedorId: null, proveedor: null }))
      lote.delete(doc(db, 'proveedores', aEliminar.id))
      await lote.commit()
      await registrarEvento({ modulo: 'Proveedores', accion: 'Eliminar', descripcion: `Proveedor eliminado · ${aEliminar.nombre}`, usuarioNombre: responsable })
      setAEliminar(null)
    } catch (err) {
      console.error(err)
      setAEliminar(null)
    } finally {
      setGuardando(false)
    }
  }

  const importarEjemplo = async () => {
    setImportando(true)
    try {
      const lote = writeBatch(db)
      PROVEEDORES_EJEMPLO.forEach((p) => lote.set(doc(collection(db, 'proveedores')), { ...VACIO, ...p, creado: serverTimestamp() }))
      await lote.commit()
      await registrarEvento({ modulo: 'Proveedores', accion: 'Crear', descripcion: `Importación de ${PROVEEDORES_EJEMPLO.length} proveedores`, usuarioNombre: responsable })
    } catch (err) {
      console.error(err)
    } finally {
      setImportando(false)
    }
  }

  const prodsFiltrados = productos.filter((p) => (p.nombre || '').toLowerCase().includes(buscarProd.toLowerCase()))
  const campo = (k, label, props = {}) => (
    <div>
      <label htmlFor={`prov-${k}`} className="etiqueta">{label}</label>
      <input id={`prov-${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="campo h-12" {...props} />
    </div>
  )

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff
        titulo="Proveedores"
        subtitulo="Directorio y productos que surten"
        acciones={<button onClick={() => abrir('nuevo')} className="btn h-11 bg-crema px-4 text-cacao hover:bg-superficie"><Plus size={18} /> Nuevo</button>}
      >
        <BuscadorEncabezado valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por nombre, giro o contacto…" />
      </EncabezadoStaff>

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-5 md:px-8">
        <Estadisticas
          items={[
            { etiqueta: 'Proveedores', valor: proveedores.length },
            { etiqueta: 'Activos', valor: proveedores.filter((p) => p.activo !== false).length, acento: 'text-exito' },
            { etiqueta: 'Productos sin proveedor', valor: productos.filter((p) => !p.proveedorId).length, acento: 'text-miel' },
          ]}
        />

        <div className="flex gap-2">
          {[['activos', 'Activos'], ['inactivos', 'Inactivos'], ['todos', 'Todos']].map(([id, label]) => (
            <button key={id} onClick={() => setFiltro(id)} className={`${filtro === id ? 'chip-activo' : 'chip-inactivo'} h-10`}>{label}</button>
          ))}
        </div>

        {cargando ? (
          <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="tarjeta h-40 animate-pulse" />)}</div>
        ) : proveedores.length === 0 ? (
          <div className="tarjeta flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-oliva"><Truck size={30} /></span>
            <div>
              <p className="font-display text-xl font-semibold text-cacao">Aún no hay proveedores</p>
              <p className="mt-1 max-w-md text-sm text-textoSecundario">
                La versión anterior tenía {PROVEEDORES_EJEMPLO.length} proveedores de ejemplo que nunca se guardaban. Puedes importarlos y luego editarlos.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={importarEjemplo} disabled={importando} className="btn-secundario h-12"><Download size={18} /> {importando ? 'Importando…' : `Importar ${PROVEEDORES_EJEMPLO.length} proveedores`}</button>
              <button onClick={() => abrir('nuevo')} className="btn-primario h-12"><Plus size={18} /> Crear uno nuevo</button>
            </div>
          </div>
        ) : visibles.length === 0 ? (
          <p className="py-12 text-center text-sm text-textoSecundario">Sin coincidencias.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => {
              const prods = productosDe[p.id] || []
              return (
                <li key={p.id} className={`tarjeta flex flex-col p-5 ${p.activo === false ? 'opacity-70' : ''}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-oliva/10 font-display text-lg font-semibold text-oliva">{p.nombre?.[0]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-semibold text-cacao">{p.nombre}</p>
                      <p className="truncate text-xs text-textoSecundario">{p.tipo || 'Sin giro'}{p.contacto && ` · ${p.contacto}`}</p>
                    </div>
                    {p.activo === false && <span className="rounded-full bg-pergamino px-2 py-0.5 text-xs text-textoSecundario">Inactivo</span>}
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {p.telefono && <li><a href={`tel:${p.telefono}`} className="flex items-center gap-2 text-cacao hover:text-vino"><Phone size={14} className="text-oliva" /> {p.telefono}</a></li>}
                    {p.correo && <li><a href={`mailto:${p.correo}`} className="flex items-center gap-2 truncate text-cacao hover:text-vino"><Mail size={14} className="shrink-0 text-oliva" /> {p.correo}</a></li>}
                    {p.direccion && <li className="flex items-center gap-2 text-textoSecundario"><MapPin size={14} className="text-oliva" /> {p.direccion}</li>}
                  </ul>
                  <div className="mt-4 border-t border-borde/60 pt-3">
                    <p className="mb-2 text-xs font-semibold text-textoSecundario">{prods.length} producto{prods.length === 1 ? '' : 's'}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prods.slice(0, 4).map((x) => <span key={x.id} className="rounded-full bg-pergamino px-2 py-0.5 text-xs text-cacao">{x.nombre}</span>)}
                      {prods.length > 4 && <span className="rounded-full bg-pergamino px-2 py-0.5 text-xs text-textoSecundario">+{prods.length - 4}</span>}
                    </div>
                  </div>
                  <div className="mt-auto flex gap-2 pt-4">
                    <button onClick={() => abrir(p)} className="btn-secundario h-10 flex-1"><Pencil size={15} /> Editar</button>
                    <button onClick={() => setAEliminar(p)} aria-label={`Eliminar ${p.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-borde text-textoSecundario hover:border-error/30 hover:bg-error/5 hover:text-error"><Trash2 size={16} /></button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editando && (
        <Hoja
          titulo={editando === 'nuevo' ? 'Nuevo proveedor' : 'Editar proveedor'}
          subtitulo={editando !== 'nuevo' ? editando.nombre : undefined}
          onCerrar={() => setEditando(null)}
          bloqueado={guardando}
          pie={
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="btn-secundario h-12 flex-1">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="btn-primario h-12 flex-1">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          }
        >
          {campo('nombre', 'Nombre *', { autoFocus: true, placeholder: 'Ej. Mozencahua' })}
          <div className="grid gap-4 sm:grid-cols-2">
            {campo('tipo', 'Giro', { placeholder: 'Cerveza artesanal' })}
            {campo('contacto', 'Persona de contacto')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo('telefono', 'Teléfono', { type: 'tel' })}
            {campo('correo', 'Correo', { type: 'email' })}
          </div>
          {campo('direccion', 'Dirección / ciudad')}
          <div>
            <label htmlFor="prov-notas" className="etiqueta">Notas</label>
            <textarea id="prov-notas" rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Días de entrega, condiciones de pago…" className="campo resize-none" />
          </div>
          <Interruptor activo={form.activo} onCambio={(v) => setForm({ ...form, activo: v })} etiqueta="Proveedor activo" />

          <div>
            <p className="etiqueta">Productos que surte <span className="font-normal text-textoSecundario">({vinculados.size})</span></p>
            <div className="tarjeta overflow-hidden">
              <div className="relative border-b border-borde/60">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textoSecundario" />
                <input value={buscarProd} onChange={(e) => setBuscarProd(e.target.value)} placeholder="Buscar producto…" className="h-11 w-full bg-transparent pl-9 pr-3 text-sm outline-none" />
              </div>
              <ul className="max-h-60 overflow-y-auto">
                {prodsFiltrados.map((p) => {
                  const on = vinculados.has(p.id)
                  const deOtro = p.proveedorId && p.proveedorId !== editando?.id && !on
                  return (
                    <li key={p.id}>
                      <button type="button" onClick={() => alternarProducto(p.id)} className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-crema">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-vino bg-vino text-white' : 'border-borde'}`}>{on && <Check size={13} />}</span>
                        <span className="flex-1 truncate text-cacao">{p.nombre}</span>
                        {deOtro && <span className="truncate text-[11px] text-textoSecundario">de {p.proveedor}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
        </Hoja>
      )}

      {aEliminar && (
        <Confirmacion
          peligro
          titulo={`¿Eliminar a ${aEliminar.nombre}?`}
          mensaje={`${(productosDe[aEliminar.id] || []).length} producto(s) quedarán sin proveedor. Si solo dejaste de trabajar con él, mejor desactívalo.`}
          textoConfirmar="Sí, eliminar"
          cargando={guardando}
          onConfirmar={eliminar}
          onCancelar={() => setAEliminar(null)}
        />
      )}

      <BottomNavAdmin />
    </div>
  )
}
