// Favoritos.jsx — Productos guardados por el cliente (precio y stock en vivo)
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import { Heart } from 'lucide-react'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useProductosTienda } from '../../hooks/useProductosTienda'
import EncabezadoTienda from '../../components/cliente/EncabezadoTienda'
import TarjetaProducto from '../../components/cliente/TarjetaProducto'
import BottomNav from '../../components/layout/BottomNav'

export default function Favoritos() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { productos, cargando: cargandoProductos } = useProductosTienda()
  const [favs, setFavs] = useState({ uid: null, items: [] })

  useEffect(() => {
    if (!usuario?.uid) return
    const uid = usuario.uid
    return onSnapshot(
      collection(db, 'usuarios', uid, 'favoritos'),
      (s) => setFavs({ uid, items: s.docs.map((d) => ({ id: d.id, ...d.data() })) }),
      () => setFavs({ uid, items: [] }),
    )
  }, [usuario?.uid])

  const cargando = favs.uid !== usuario?.uid || cargandoProductos

  const lista = useMemo(() => {
    const orden = (f) => f.guardadoEn?.toMillis?.() || 0
    return favs.items
      .slice()
      .sort((a, b) => orden(b) - orden(a))
      .map((f) => ({ fav: f, producto: productos.find((p) => p.id === (f.productoId || f.id)) }))
  }, [favs, productos])

  const quitar = (favId) => deleteDoc(doc(db, 'usuarios', usuario.uid, 'favoritos', favId)).catch(() => {})

  const disponibles = lista.filter((x) => x.producto)
  const noDisponibles = lista.filter((x) => !x.producto)

  return (
    <div className="min-h-screen bg-crema pb-24 md:pb-12">
      <EncabezadoTienda titulo="Favoritos" />
      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <h1 className="titulo-seccion mb-5">Mis favoritos</h1>

        {cargando ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="tarjeta aspect-[3/4] animate-pulse" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pergamino text-vino/60"><Heart size={30} /></span>
            <p className="font-display text-xl text-cacao">Aún no tienes favoritos</p>
            <p className="max-w-sm text-sm text-textoSecundario">Toca el corazón en cualquier producto para guardarlo aquí.</p>
            <button onClick={() => navigate('/catalogo')} className="btn-primario mt-1">Explorar catálogo</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {disponibles.map(({ fav, producto }) => (
                <TarjetaProducto
                  key={fav.id}
                  producto={producto}
                  accionExtra={
                    <button onClick={() => quitar(fav.id)} aria-label={`Quitar ${producto.nombre} de favoritos`} className="flex h-10 w-10 items-center justify-center rounded-full bg-superficie/90 shadow-tarjeta">
                      <Heart size={18} className="fill-vino text-vino" />
                    </button>
                  }
                />
              ))}
            </div>
            {noDisponibles.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-textoSecundario">Ya no disponibles</h2>
                <ul className="tarjeta divide-y divide-borde/60">
                  {noDisponibles.map(({ fav }) => (
                    <li key={fav.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span className="text-textoSecundario">{fav.nombre || 'Producto'}</span>
                      <button onClick={() => quitar(fav.id)} className="font-medium text-vino hover:underline">Quitar</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
