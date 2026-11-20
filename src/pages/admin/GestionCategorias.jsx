// GestionCategorias.jsx — Gestión de categorías del administrador
// Estados: lista, modal agregar/editar, categoría con productos asociados

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, EyeOff } from 'lucide-react'
import BottomNavAdmin from '../../components/layout/BottomNavAdmin'

const categoriasMock = [
  { id: 1, nombre: 'Adheresos', productos: 5, activa: true },
  { id: 2, nombre: 'Agua miel', productos: 1, activa: true },
  { id: 3, nombre: 'Alegria', productos: 4, activa: true },
  { id: 4, nombre: 'Ate', productos: 5, activa: true },
  { id: 5, nombre: 'Banderillas', productos: 5, activa: true },
  { id: 6, nombre: 'Café', productos: 1, activa: true },
  { id: 7, nombre: 'Cerveza Ayotochtinci', productos: 9, activa: true },
  { id: 8, nombre: 'Cerveza Mozencahua', productos: 11, activa: true },
  { id: 9, nombre: 'Cocadas', productos: 5, activa: true },
  { id: 10, nombre: 'Conservas', productos: 8, activa: true },
  { id: 11, nombre: 'Crema Artesanal', productos: 3, activa: true },
  { id: 12, nombre: 'Destilado de Agave Oaxaca', productos: 1, activa: true },
  { id: 13, nombre: 'Dulces típicos', productos: 2, activa: true },
  { id: 14, nombre: 'El Tlaxcalteca', productos: 2, activa: true },
  { id: 15, nombre: 'Enmaizador', productos: 5, activa: true },
  { id: 16, nombre: 'Galleta la abejita', productos: 1, activa: true },
  { id: 17, nombre: 'Garapiñado', productos: 1, activa: true },
  { id: 18, nombre: 'Granola Abejita', productos: 3, activa: true },
  { id: 19, nombre: 'Jamoncillo', productos: 6, activa: true },
  { id: 20, nombre: 'Jugos', productos: 5, activa: true },
  { id: 21, nombre: 'Laminillas', productos: 2, activa: true },
  { id: 22, nombre: 'Licores', productos: 5, activa: true },
  { id: 23, nombre: 'Mana', productos: 4, activa: true },
  { id: 24, nombre: 'Matungo', productos: 2, activa: true },
  { id: 25, nombre: 'Miel Oscar', productos: 12, activa: true },
  { id: 26, nombre: 'Miel Tlazcallan', productos: 6, activa: true },
  { id: 27, nombre: 'Mole', productos: 1, activa: true },
  { id: 28, nombre: 'Palanqueta', productos: 4, activa: true },
  { id: 29, nombre: 'Papas', productos: 2, activa: true },
  { id: 30, nombre: 'Pay', productos: 3, activa: true },
  { id: 31, nombre: 'Pinole', productos: 1, activa: true },
  { id: 32, nombre: 'Productos Tlacuache', productos: 10, activa: true },
  { id: 33, nombre: 'Pulque', productos: 3, activa: true },
  { id: 34, nombre: 'Refresco', productos: 1, activa: true },
  { id: 35, nombre: 'Refrescos Zacatlan', productos: 4, activa: true },
  { id: 36, nombre: 'Salsa Macha', productos: 4, activa: true },
  { id: 37, nombre: 'Sidras', productos: 6, activa: true },
  { id: 38, nombre: 'Tortilla', productos: 4, activa: true },
  { id: 39, nombre: 'Vainilla', productos: 1, activa: true },
  { id: 40, nombre: 'Vasos Mangos', productos: 3, activa: true },
  { id: 41, nombre: 'Vinos', productos: 5, activa: true },
  { id: 42, nombre: 'Xolentongo', productos: 1, activa: true },
]

export default function GestionCategorias() {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState(categoriasMock)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [errorDesactivar, setErrorDesactivar] = useState(null)

  // Form
  const [nombreForm, setNombreForm] = useState('')
  const [descripcionForm, setDescripcionForm] = useState('')
  const [activaForm, setActivaForm] = useState(true)

  const total = categorias.length
  const activas = categorias.filter(c => c.activa).length
  const inactivas = categorias.filter(c => !c.activa).length

  const categoriasFiltradas = categorias.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirModal = (categoria = null) => {
    setCategoriaEditando(categoria)
    setNombreForm(categoria?.nombre || '')
    setDescripcionForm('')
    setActivaForm(categoria?.activa ?? true)
    setMostrarModal(true)
  }

  const guardarCategoria = () => {
    if (categoriaEditando) {
      setCategorias(categorias.map(c =>
        c.id === categoriaEditando.id
          ? { ...c, nombre: nombreForm, activa: activaForm }
          : c
      ))
    } else {
      setCategorias([...categorias, {
        id: Date.now(), nombre: nombreForm,
        productos: 0, activa: activaForm
      }])
    }
    setMostrarModal(false)
  }

  const intentarDesactivar = (categoria) => {
    if (categoria.productos > 0) {
      setErrorDesactivar(categoria.id)
      setTimeout(() => setErrorDesactivar(null), 4000)
      return
    }
    setCategorias(categorias.map(c =>
      c.id === categoria.id ? { ...c, activa: !c.activa } : c
    ))
  }

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-botonSecundario' : 'bg-gray-300'}`}
    >
      <div className={`w-5 h-5 bg-superficie rounded-full absolute top-0.5 transition-all ${value ? 'left-6' : 'left-0.5'}`} />
    </button>
  )

  return (
    <div className="min-h-screen bg-fondoPrincipal pb-20">

      {/* Modal agregar/editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-superficie w-full rounded-t-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏷️</span>
              <h2 className="text-textoPrincipal font-bold text-lg">
                {categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-textoPrincipal text-xs font-semibold uppercase tracking-wide">
                  Nombre de la categoría
                </label>
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={nombreForm}
                  onChange={(e) => setNombreForm(e.target.value)}
                  className="border border-borde rounded-lg px-4 py-3 text-sm bg-fondoPrincipal focus:outline-none focus:border-botonPrincipal"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-textoPrincipal text-xs font-semibold uppercase tracking-wide">
                  🏷️ Productos Tlacuache
                </label>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-textoPrincipal text-xs font-semibold uppercase tracking-wide">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Destilados y mezcales artesanales..."
                  value={descripcionForm}
                  onChange={(e) => setDescripcionForm(e.target.value)}
                  className="border border-borde rounded-lg px-4 py-3 text-sm bg-superficie focus:outline-none focus:border-botonPrincipal"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-textoPrincipal text-sm font-semibold">Categoría activa</span>
                <Toggle value={activaForm} onChange={setActivaForm} />
              </div>

              <button
                onClick={guardarCategoria}
                className="w-full bg-botonSecundario text-white rounded-xl py-3 text-sm font-semibold"
              >
                Guardar categoría
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="w-full border border-borde text-textoSecundario rounded-xl py-3 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-botonPrincipal px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin/dashboard')} className="text-white">←</button>
          <span className="text-white font-bold text-lg">Categorías</span>
        </div>
        <button
          onClick={() => abrirModal()}
          className="bg-botonSecundario text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold"
        >+</button>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total', valor: total, color: 'text-textoPrincipal' },
          { label: 'Activas', valor: activas, color: 'text-green-600' },
          { label: 'Inactivas', valor: inactivas, color: 'text-error' },
        ].map((s, i) => (
          <div key={i} className="bg-superficie border border-borde rounded-xl p-2 text-center">
            <p className={`font-bold text-lg ${s.color}`}>{s.valor}</p>
            <p className="text-textoSecundario text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="px-4 mb-3">
        <input
          type="text"
          placeholder="Buscar por categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-borde rounded-full px-4 py-2.5 text-sm bg-superficie focus:outline-none"
        />
      </div>

      {/* Lista categorías */}
      <div className="px-4 flex flex-col gap-2 mb-4">
        {categoriasFiltradas.map((c) => (
          <div key={c.id}>
            <div className={`bg-superficie border rounded-xl px-3 py-3 flex items-center gap-3 ${errorDesactivar === c.id ? 'border-error' : 'border-borde'}`}>
              <div className="w-10 h-10 bg-fondoSecundario rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🏷️</span>
              </div>
              <div className="flex-1">
                <p className="text-textoPrincipal text-sm font-semibold">{c.nombre}</p>
                <p className="text-textoSecundario text-xs">
                  {c.productos} productos
                  {errorDesactivar === c.id && (
                    <span className="text-error"> — no se puede desactivar</span>
                  )}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-textoSecundario'}`}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </span>
              <button
                onClick={() => abrirModal(c)}
                className="text-textoSecundario ml-1"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => intentarDesactivar(c)}
                className="text-textoSecundario"
              >
                <EyeOff size={16} />
              </button>
            </div>

            {/* Error no eliminar */}
            {errorDesactivar === c.id && (
              <div className="bg-red-50 border border-error rounded-xl px-4 py-2 mt-1">
                <p className="text-error text-xs">
                  No puedes desactivar una categoría que tiene productos activos. Primero mueve o desactiva los {c.productos} productos de esta categoría.
                </p>
              </div>
            )}
          </div>
        ))}

        {categoriasFiltradas.length > 5 && (
          <button className="text-botonSecundario text-xs text-center py-2">
            {categoriasFiltradas.length - 5} productos más →
          </button>
        )}
      </div>

      {/* Nueva categoría */}
      <div className="px-4">
        <button
          onClick={() => abrirModal()}
          className="w-full border border-borde text-textoSecundario rounded-xl py-3 text-sm"
        >
          Nueva categoría
        </button>
      </div>

      <BottomNavAdmin />
    </div>
  )
}