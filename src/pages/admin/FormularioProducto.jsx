// FormularioProducto.jsx — Alta y edición de producto (administración)
// El stock inicial se registra como movimiento de entrada (queda en el historial).
// Después de creado, el stock solo cambia con movimientos de inventario.
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, addDoc, updateDoc, getDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore'
import { ImageOff, ArrowLeftRight, Layers, Eye, EyeOff, Percent } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import EncabezadoStaff from '../../components/staff/EncabezadoStaff'
import Interruptor from '../../components/staff/Interruptor'
import { registrarEvento } from '../../utils/bitacora'
import { registrarMovimiento } from '../../services/inventario'
import { obtenerImagen } from '../../utils/imagenes'
import { dinero } from '../../utils/formato'
import { MIN_POR_DEFECTO } from '../../utils/stock'

const VACIO = {
  nombre: '',
  marca: '',
  categoria: '',
  presentacion: '',
  descripcion: '',
  precio: '',
  enPromocion: false,
  descuentoPorcentaje: '',
  stockMin: String(MIN_POR_DEFECTO),
  caducidad: '',
  imagenUrl: '',
  visibleCatalogo: true,
  proveedorId: '',
}

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="tarjeta p-5 md:p-6">
      <h2 className="font-display text-lg font-semibold text-cacao">{titulo}</h2>
      {descripcion && <p className="mb-4 mt-0.5 text-sm text-textoSecundario">{descripcion}</p>}
      <div className={`space-y-4 ${descripcion ? '' : 'mt-4'}`}>{children}</div>
    </section>
  )
}


export default function FormularioProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esNuevo = id === 'nuevo'

  const [form, setForm] = useState(VACIO)
  const [original, setOriginal] = useState(null) // datos completos del producto al editar
  const [stockInicial, setStockInicial] = useState('0')
  const [categorias, setCategorias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [cargando, setCargando] = useState(!esNuevo)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [imgRota, setImgRota] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e?.target ? e.target.value : e }))

  // Categorías: colección 'categorias' + las que ya usan los productos
  useEffect(() => {
    getDocs(collection(db, 'proveedores'))
      .then((s) => setProveedores(s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.activo !== false).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))))
      .catch(() => {})
    Promise.all([getDocs(collection(db, 'categorias')), getDocs(collection(db, 'productos'))])
      .then(([cats, prods]) => {
        const nombres = new Set([
          ...cats.docs.filter((d) => d.data().activo !== false).map((d) => d.data().nombre).filter(Boolean),
          ...prods.docs.map((d) => d.data().categoria).filter(Boolean),
        ])
        setCategorias([...nombres].sort((a, b) => a.localeCompare(b)))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (esNuevo) return
    getDoc(doc(db, 'productos', id))
      .then((snap) => {
        if (!snap.exists()) return setError('Este producto no existe.')
        const d = snap.data()
        setOriginal({ id: snap.id, ...d })
        setForm({
          nombre: d.nombre || '',
          marca: d.marca || '',
          categoria: d.categoria || '',
          presentacion: d.presentacion || '',
          descripcion: d.descripcion || '',
          precio: d.precio ?? '',
          enPromocion: !!d.enPromocion,
          descuentoPorcentaje: d.descuentoPorcentaje ?? '',
          stockMin: String(d.stockMin ?? MIN_POR_DEFECTO),
          caducidad: d.caducidad || '',
          imagenUrl: d.imagenUrl || '',
          visibleCatalogo: d.visibleCatalogo ?? true,
          proveedorId: d.proveedorId || '',
        })
      })
      .catch(() => setError('No se pudo cargar el producto.'))
      .finally(() => setCargando(false))
  }, [id, esNuevo])

  const vistaPrevia = obtenerImagen({ imagenUrl: form.imagenUrl, imagen: original?.imagen })
  const precioNum = Number(form.precio) || 0
  const desc = Math.min(90, Math.max(0, Number(form.descuentoPorcentaje) || 0))
  const precioFinal = form.enPromocion && desc > 0 ? precioNum * (1 - desc / 100) : precioNum

  const errores = useMemo(() => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Escribe el nombre.'
    if (form.precio === '' || precioNum < 0) e.precio = 'Indica un precio válido.'
    if (form.enPromocion && (desc <= 0 || desc > 90)) e.descuento = 'Entre 1% y 90%.'
    if (form.imagenUrl && !/^https?:\/\//i.test(form.imagenUrl.trim())) e.imagenUrl = 'Debe empezar con http:// o https://'
    return e
  }, [form, precioNum, desc])

  const guardar = async (ev) => {
    ev.preventDefault()
    setError('')
    if (Object.keys(errores).length) return setError('Revisa los campos marcados.')
    setGuardando(true)
    try {
      const datos = {
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        categoria: form.categoria.trim(),
        presentacion: form.presentacion.trim(),
        descripcion: form.descripcion.trim(),
        precio: precioNum,
        enPromocion: form.enPromocion && desc > 0,
        descuentoPorcentaje: form.enPromocion ? desc : 0,
        stockMin: Math.max(0, parseInt(form.stockMin, 10) || 0),
        caducidad: form.caducidad || null,
        imagenUrl: form.imagenUrl.trim() || null,
        visibleCatalogo: form.visibleCatalogo,
        proveedorId: form.proveedorId || null,
        proveedor: proveedores.find((p) => p.id === form.proveedorId)?.nombre || null,
      }
      const responsable = usuario?.nombre || 'Administración'

      if (esNuevo) {
        const ref = await addDoc(collection(db, 'productos'), { ...datos, stock: 0, creado: serverTimestamp() })
        const inicial = parseInt(stockInicial, 10) || 0
        if (inicial > 0) {
          await registrarMovimiento({ tipo: 'entrada', productoId: ref.id, productoNombre: datos.nombre, cantidad: inicial, motivo: 'Inventario inicial', responsable })
        }
        await registrarEvento({ modulo: 'Productos', accion: 'Crear', descripcion: `Producto creado · ${datos.nombre}`, usuarioNombre: responsable })
      } else {
        await updateDoc(doc(db, 'productos', id), datos)
        await registrarEvento({ modulo: 'Productos', accion: 'Editar', descripcion: `Producto editado · ${datos.nombre}`, usuarioNombre: responsable })
      }
      navigate('/admin/productos')
    } catch (err) {
      console.error(err)
      setError(err.code === 'permission-denied' ? 'No tienes permiso para guardar productos.' : 'No se pudo guardar el producto. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  const err = (campo) => errores[campo] && error && <p className="mt-1 text-xs font-medium text-error">{errores[campo]}</p>

  return (
    <div className="min-h-screen bg-crema pb-32">
      <EncabezadoStaff titulo={esNuevo ? 'Nuevo producto' : 'Editar producto'} subtitulo={!esNuevo ? form.nombre : undefined} atras="/admin/productos" />

      {cargando ? (
        <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">{[0, 1, 2].map((i) => <div key={i} className="tarjeta h-48 animate-pulse" />)}</div>
      ) : (
        <form id="form-producto" onSubmit={guardar} noValidate className="mx-auto grid max-w-5xl gap-5 p-4 md:grid-cols-[1fr_320px] md:p-8">
          <div className="space-y-5">
            <Seccion titulo="Información básica">
              <div>
                <label htmlFor="nombre" className="etiqueta">Nombre *</label>
                <input id="nombre" value={form.nombre} onChange={set('nombre')} placeholder="Ej. Queso de cabra con hierbas" className={`campo h-12 ${errores.nombre && error ? 'border-error' : ''}`} />
                {err('nombre')}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="marca" className="etiqueta">Marca / productor</label>
                  <input id="marca" value={form.marca} onChange={set('marca')} placeholder="Ej. Cervecería Mozencahua" className="campo h-12" />
                </div>
                <div>
                  <label htmlFor="categoria" className="etiqueta">Categoría</label>
                  <input id="categoria" list="lista-categorias" value={form.categoria} onChange={set('categoria')} placeholder="Elige o escribe una nueva" className="campo h-12" />
                  <datalist id="lista-categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="presentacion" className="etiqueta">Presentación</label>
                  <input id="presentacion" value={form.presentacion} onChange={set('presentacion')} placeholder="Ej. 355 ml, 250 g, caja con 6" className="campo h-12" />
                </div>
                <div>
                  <label htmlFor="proveedor" className="etiqueta">Proveedor</label>
                  <select id="proveedor" value={form.proveedorId} onChange={set('proveedorId')} className="campo h-12">
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="descripcion" className="etiqueta">Descripción</label>
                <textarea id="descripcion" rows={3} value={form.descripcion} onChange={set('descripcion')} placeholder="Sabor, origen, maridaje sugerido…" className="campo resize-none" />
                <p className="mt-1 text-xs text-textoSecundario">Se muestra en la portada y en el detalle del producto.</p>
              </div>
            </Seccion>

            <Seccion titulo="Precio y promoción">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="precio" className="etiqueta">Precio de venta *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-textoSecundario">$</span>
                    <input id="precio" inputMode="decimal" value={form.precio} onChange={(e) => set('precio')(e.target.value.replace(/[^0-9.]/g, ''))} className={`campo h-12 pl-8 ${errores.precio && error ? 'border-error' : ''}`} />
                  </div>
                  {err('precio')}
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-xs text-textoSecundario">Precio que verá el cliente</p>
                  <p className="font-display text-2xl font-semibold text-vino">
                    {dinero(precioFinal)} {form.enPromocion && desc > 0 && <span className="text-sm font-normal text-textoSecundario line-through">{dinero(precioNum)}</span>}
                  </p>
                </div>
              </div>
              <Interruptor activo={form.enPromocion} onCambio={set('enPromocion')} etiqueta="En promoción" sub="Aparece con descuento en la tienda y en Promociones" icono={Percent} />
              {form.enPromocion && (
                <div>
                  <label htmlFor="descuento" className="etiqueta">Descuento</label>
                  <div className="relative w-40">
                    <input id="descuento" inputMode="numeric" value={form.descuentoPorcentaje} onChange={(e) => set('descuentoPorcentaje')(e.target.value.replace(/\D/g, ''))} className={`campo h-12 pr-10 ${errores.descuento && error ? 'border-error' : ''}`} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-textoSecundario">%</span>
                  </div>
                  {err('descuento')}
                </div>
              )}
            </Seccion>

            <Seccion titulo="Inventario" descripcion={esNuevo ? 'El stock inicial queda registrado como entrada en el historial.' : 'El stock solo cambia con movimientos, para que el historial cuadre.'}>
              <div className="grid gap-4 sm:grid-cols-2">
                {esNuevo ? (
                  <div>
                    <label htmlFor="stock-inicial" className="etiqueta">Stock inicial</label>
                    <input id="stock-inicial" inputMode="numeric" value={stockInicial} onChange={(e) => setStockInicial(e.target.value.replace(/\D/g, ''))} className="campo h-12" />
                  </div>
                ) : (
                  <div>
                    <p className="etiqueta">Stock actual</p>
                    <p className="flex h-12 items-center font-display text-2xl font-semibold text-cacao">{Number(original?.stock) || 0} pzas</p>
                  </div>
                )}
                <div>
                  <label htmlFor="stock-min" className="etiqueta">Stock mínimo</label>
                  <input id="stock-min" inputMode="numeric" value={form.stockMin} onChange={(e) => set('stockMin')(e.target.value.replace(/\D/g, ''))} className="campo h-12" />
                  <p className="mt-1 text-xs text-textoSecundario">Avisa cuando quede esta cantidad o menos.</p>
                </div>
              </div>
              <div>
                <label htmlFor="caducidad" className="etiqueta">Caducidad <span className="font-normal text-textoSecundario">(opcional)</span></label>
                <input id="caducidad" type="date" value={form.caducidad} onChange={set('caducidad')} className="campo h-12 sm:w-60" />
                <p className="mt-1 text-xs text-textoSecundario">Vacío si no caduca (destilados, licores). Un producto caducado se oculta del catálogo.</p>
              </div>
              {!esNuevo && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigate('/admin/movimiento', { state: { productoId: id } })} className="btn-secundario h-11"><ArrowLeftRight size={16} /> Registrar movimiento</button>
                  <button type="button" onClick={() => navigate(`/admin/lotes/${id}`)} className="btn-secundario h-11"><Layers size={16} /> Ver lotes</button>
                </div>
              )}
            </Seccion>
          </div>

          {/* Columna lateral: foto y visibilidad */}
          <div className="space-y-5 md:sticky md:top-24 md:self-start">
            <Seccion titulo="Foto">
              <div className="aspect-square overflow-hidden rounded-2xl bg-pergamino">
                {vistaPrevia && !imgRota ? (
                  <img src={vistaPrevia} alt="Vista previa" onError={() => setImgRota(true)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-textoSecundario">
                    <ImageOff size={28} />
                    <span className="text-xs">{imgRota ? 'No se pudo cargar la imagen' : 'Sin foto'}</span>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="imagen" className="etiqueta">Enlace de la imagen</label>
                <input id="imagen" type="url" value={form.imagenUrl} onChange={(e) => { setImgRota(false); set('imagenUrl')(e) }} placeholder="https://…" className={`campo h-11 ${errores.imagenUrl && error ? 'border-error' : ''}`} />
                {err('imagenUrl')}
                <p className="mt-1 text-xs text-textoSecundario">
                  Sube la foto a <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="font-medium text-vino underline">imgbb.com</a> y pega el enlace directo.
                </p>
              </div>
            </Seccion>

            <Seccion titulo="Visibilidad">
              <Interruptor
                activo={form.visibleCatalogo}
                onCambio={set('visibleCatalogo')}
                etiqueta={form.visibleCatalogo ? 'Visible en la tienda' : 'Oculto de la tienda'}
                sub="Ocúltalo para dejar de venderlo sin borrarlo"
                icono={form.visibleCatalogo ? Eye : EyeOff}
              />
            </Seccion>
          </div>
        </form>
      )}

      {/* Barra de guardado */}
      {!cargando && (
        <div className="fijo-inferior fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 p-4 md:px-8">
            {error && <p role="alert" className="hidden flex-1 text-sm font-medium text-error sm:block">{error}</p>}
            <button type="button" onClick={() => navigate('/admin/productos')} className="btn-secundario h-12 sm:ml-auto">Cancelar</button>
            <button type="submit" form="form-producto" disabled={guardando} className="btn-primario h-12 flex-1 sm:flex-none sm:px-8">
              {guardando ? 'Guardando…' : esNuevo ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </div>
          {error && <p role="alert" className="px-4 pb-3 text-sm font-medium text-error sm:hidden">{error}</p>}
        </div>
      )}
    </div>
  )
}
