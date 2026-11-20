// Categorias.jsx — Categorías del catálogo (administración)
// Los productos guardan la categoría por NOMBRE; al renombrar se actualizan también los productos.
import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { Plus, Pencil, Trash2, Tags, AlertCircle } from 'lucide-react'
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

const VACIA = { nombre: '', descripcion: '', activo: true }

export default function Categorias() {
  const { usuario } = useAuth()
  const responsable = usuario?.nombre || 'Administración'

  const [categorias, setCategorias] = useState([])
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null) // null | 'nueva' | categoría
  const [form, setForm] = useState(VACIA)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [aEliminar, setAEliminar] = useState(null)

  useEffect(() => {
    const u1 = onSnapshot(
      collection(db, 'categorias'),
      (s) => {
        setCategorias(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
        setCargando(false)
      },
      () => setCargando(false),
    )
    const u2 = onSnapshot(collection(db, 'productos'), (s) => setProductos(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {})
    return () => {
      u1()
      u2()
    }
  }, [])

  const usoPorNombre = useMemo(() => {
    const m = {}
    for (const p of productos) if (p.categoria) m[p.categoria] = (m[p.categoria] || 0) + 1
    return m
  }, [productos])

  // Categorías que usan los productos pero no están registradas
  const sinRegistrar = useMemo(() => {
    const registradas = new Set(categorias.map((c) => c.nombre))
    return Object.keys(usoPorNombre).filter((n) => !registradas.has(n)).sort()
  }, [categorias, usoPorNombre])

  const visibles = categorias.filter((c) => (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()))
  const sinCategoria = productos.filter((p) => !p.categoria).length

  const abrir = (c) => {
    setError('')
    setEditando(c)
    setForm(c === 'nueva' ? VACIA : { nombre: c.nombre || '', descripcion: c.descripcion || '', activo: c.activo !== false })
  }

  const guardar = async () => {
    const nombre = form.nombre.trim()
    if (!nombre) return setError('Escribe un nombre.')
    const duplicada = categorias.some((c) => c.nombre?.toLowerCase() === nombre.toLowerCase() && c.id !== editando?.id)
    if (duplicada) return setError('Ya existe una categoría con ese nombre.')
    setGuardando(true)
    setError('')
    try {
      const datos = { nombre, descripcion: form.descripcion.trim(), activo: form.activo }
      if (editando === 'nueva') {
        await addDoc(collection(db, 'categorias'), { ...datos, creado: serverTimestamp() })
        await registrarEvento({ modulo: 'Productos', accion: 'Crear', descripcion: `Categoría creada · ${nombre}`, usuarioNombre: responsable })
      } else {
        const anterior = editando.nombre
        await updateDoc(doc(db, 'categorias', editando.id), datos)
        // Renombrar: actualizar los productos que usaban el nombre anterior
        if (anterior && anterior !== nombre) {
          const afectados = productos.filter((p) => p.categoria === anterior)
          for (let i = 0; i < afectados.length; i += 450) {
            const lote = writeBatch(db)
            afectados.slice(i, i + 450).forEach((p) => lote.update(doc(db, 'productos', p.id), { categoria: nombre }))
            await lote.commit()
          }
        }
        await registrarEvento({ modulo: 'Productos', accion: 'Editar', descripcion: `Categoría editada · ${anterior !== nombre ? `${anterior} → ` : ''}${nombre}`, usuarioNombre: responsable })
      }
      setEditando(null)
    } catch (err) {
      console.error(err)
      setError(err.code === 'permission-denied' ? 'No tienes permiso para esta acción.' : 'No se pudo guardar la categoría.')
    } finally {
      setGuardando(false)
    }
  }

  const registrar = async (nombre) => {
    try {
      await addDoc(collection(db, 'categorias'), { nombre, descripcion: '', activo: true, creado: serverTimestamp() })
    } catch (err) {
      console.error(err)
    }
  }

  const eliminar = async () => {
    setGuardando(true)
    try {
      await deleteDoc(doc(db, 'categorias', aEliminar.id))
      await registrarEvento({ modulo: 'Productos', accion: 'Eliminar', descripcion: `Categoría eliminada · ${aEliminar.nombre}`, usuarioNombre: responsable })
      setAEliminar(null)
    } catch (err) {
      console.error(err)
      setAEliminar(null)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema pb-28 md:pb-10">
      <EncabezadoStaff
        titulo="Categorías"
        subtitulo="Organizan el catálogo y los filtros de la tienda"
        acciones={
          <button onClick={() => abrir('nueva')} className="btn h-11 bg-crema px-4 text-cacao hover:bg-superficie">
            <Plus size={18} /> Nueva
          </button>
        }
      >
        <BuscadorEncabezado valor={busqueda} onCambio={setBusqueda} placeholder="Buscar categoría…" />
      </EncabezadoStaff>

      <div className="mx-auto max-w-5xl space-y-5 px-4 pt-5 md:px-8">
        <Estadisticas
          items={[
            { etiqueta: 'Categorías', valor: categorias.length },
            { etiqueta: 'Activas', valor: categorias.filter((c) => c.activo !== false).length, acento: 'text-exito' },
            { etiqueta: 'Productos sin categoría', valor: sinCategoria, acento: sinCategoria ? 'text-miel' : 'text-cacao' },
          ]}
        />

        {sinRegistrar.length > 0 && (
          <div className="tarjeta border-miel/30 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-cacao">
              <AlertCircle size={16} className="text-miel" /> Categorías usadas por productos que no están registradas
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sinRegistrar.map((n) => (
                <button key={n} onClick={() => registrar(n)} className="chip-inactivo h-9">
                  <Plus size={14} /> {n} <span className="text-xs opacity-60">{usoPorNombre[n]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {cargando ? (
          <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="tarjeta h-24 animate-pulse" />)}</div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-oliva"><Tags size={30} /></span>
            <p className="font-display text-lg text-cacao">{busqueda ? 'Sin coincidencias' : 'Aún no hay categorías'}</p>
            {!busqueda && <button onClick={() => abrir('nueva')} className="btn-primario"><Plus size={18} /> Crear la primera</button>}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((c) => {
              const uso = usoPorNombre[c.nombre] || 0
              return (
                <li key={c.id} className={`tarjeta flex flex-col p-4 ${c.activo === false ? 'opacity-70' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-cacao">{c.nombre}</p>
                      <p className="text-xs text-oliva">{uso} producto{uso === 1 ? '' : 's'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${c.activo === false ? 'bg-pergamino text-textoSecundario' : 'bg-exito/10 text-exito'}`}>
                      {c.activo === false ? 'Inactiva' : 'Activa'}
                    </span>
                  </div>
                  {c.descripcion && <p className="mt-2 line-clamp-2 text-sm text-textoSecundario">{c.descripcion}</p>}
                  <div className="mt-auto flex gap-2 pt-4">
                    <button onClick={() => abrir(c)} className="btn-secundario h-10 flex-1"><Pencil size={15} /> Editar</button>
                    <button onClick={() => setAEliminar(c)} aria-label={`Eliminar ${c.nombre}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-borde text-textoSecundario hover:border-error/30 hover:bg-error/5 hover:text-error">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editando && (
        <Hoja
          titulo={editando === 'nueva' ? 'Nueva categoría' : 'Editar categoría'}
          onCerrar={() => setEditando(null)}
          bloqueado={guardando}
          pie={
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="btn-secundario h-12 flex-1">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="btn-primario h-12 flex-1">{guardando ? 'Guardando…' : 'Guardar'}</button>
            </div>
          }
        >
          <div>
            <label htmlFor="cat-nombre" className="etiqueta">Nombre</label>
            <input id="cat-nombre" autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Quesos maduros" className="campo h-12" />
            {editando !== 'nueva' && editando.nombre !== form.nombre.trim() && usoPorNombre[editando.nombre] > 0 && (
              <p className="mt-1 text-xs text-miel">Se actualizarán {usoPorNombre[editando.nombre]} producto(s) con el nuevo nombre.</p>
            )}
          </div>
          <div>
            <label htmlFor="cat-desc" className="etiqueta">Descripción <span className="font-normal text-textoSecundario">(opcional)</span></label>
            <textarea id="cat-desc" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="campo resize-none" />
          </div>
          <Interruptor activo={form.activo} onCambio={(v) => setForm({ ...form, activo: v })} etiqueta="Categoría activa" sub="Las inactivas no se ofrecen al crear productos" />
          {error && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">{error}</p>}
        </Hoja>
      )}

      {aEliminar && (
        <Confirmacion
          peligro
          titulo={`¿Eliminar "${aEliminar.nombre}"?`}
          mensaje={
            usoPorNombre[aEliminar.nombre]
              ? `${usoPorNombre[aEliminar.nombre]} producto(s) la usan y conservarán el nombre, pero ya no aparecerá registrada. Considera desactivarla en su lugar.`
              : 'Ningún producto la usa. Esta acción no se puede deshacer.'
          }
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
