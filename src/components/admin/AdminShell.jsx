// AdminShell.jsx — Marco de todas las pantallas /admin/*
// - Fondo ambiental animado (manchas de color difuminadas) detrás de todo el admin.
// - Escritorio (md+): barra lateral flotante de cristal (liquid glass) con perfil, buscador y contadores en vivo.
// - Buscador de módulos con Ctrl/⌘ + K.
// - Móvil: cada pantalla muestra <BottomNavAdmin /> (barra inferior + hoja "Más").
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Store, LogOut, Search, CornerDownLeft } from 'lucide-react'
import { auth, db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { ESTADOS_ACTIVOS } from '../../services/pedidos'
import { necesitaReabasto } from '../../utils/stock'
import { ContadoresAdmin } from './contadores'
import { MODULOS_ADMIN, TODOS_LOS_MODULOS, ACCIONES_RAPIDAS } from './modulos'
import BotonTema from '../BotonTema'
import Avatar from '../Avatar'

export default function AdminShell() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [contadores, setContadores] = useState({ pedidos: 0, alertas: 0 })
  const [buscador, setBuscador] = useState(false)

  useEffect(() => {
    const unsubPed = onSnapshot(
      query(collection(db, 'pedidos'), where('status', 'in', ESTADOS_ACTIVOS)),
      (snap) => setContadores((c) => ({ ...c, pedidos: snap.size })),
      () => {},
    )
    const unsubProd = onSnapshot(
      collection(db, 'productos'),
      (snap) => setContadores((c) => ({ ...c, alertas: snap.docs.filter((d) => necesitaReabasto(d.data())).length })),
      () => {},
    )
    // Para que las barras fijas inferiores respeten la barra lateral y se active el estilo de cristal
    document.body.classList.add('con-sidebar')
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBuscador((v) => !v)
      }
    }
    window.addEventListener('keydown', atajo)
    return () => {
      unsubPed()
      unsubProd()
      window.removeEventListener('keydown', atajo)
      document.body.classList.remove('con-sidebar')
    }
  }, [])

  const salir = async () => {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  return (
    <ContadoresAdmin.Provider value={contadores}>
      <FondoAmbiental />

      <aside className="vidrio-oscuro fixed inset-y-3 left-3 z-40 hidden w-64 flex-col overflow-hidden rounded-[28px] text-marfil md:flex">
        {/* Perfil */}
        <NavLink to="/admin/perfil" className="group m-3 flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-white/5">
          <span className="relative">
            <Avatar usuario={usuario} tam="h-12 w-12" texto="text-base" className="ring-2 ring-white/20 transition group-hover:ring-white/40" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-exito ring-2 ring-tinta" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-base font-semibold text-white">{usuario?.nombre || 'Administración'}</span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-marfil/50">Administración</span>
          </span>
        </NavLink>

        {/* Buscador */}
        <button
          onClick={() => setBuscador(true)}
          className="mx-3 mb-3 flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-marfil/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Buscar…</span>
          <kbd className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] font-semibold">Ctrl K</kbd>
        </button>

        <nav className="scrollbar-hide flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {MODULOS_ADMIN.map((grupo) => (
            <div key={grupo.grupo}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-marfil/35">{grupo.grupo}</p>
              {grupo.items.map(({ ruta, nombre, icono: Icono, contador }) => {
                const n = contador ? contadores[contador] : 0
                return (
                  <NavLink
                    key={ruta}
                    to={ruta}
                    className={({ isActive }) =>
                      `group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-white/[0.16] to-white/[0.04] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]'
                          : 'text-marfil/65 hover:translate-x-0.5 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-miel-claro shadow-[0_0_12px_rgb(var(--miel-claro))] transition-all duration-300 ${isActive ? 'opacity-100' : 'h-0 opacity-0'}`} />
                        <Icono size={18} className={isActive ? 'text-miel-claro' : ''} />
                        <span className="flex-1">{nombre}</span>
                        {n > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${contador === 'alertas' ? 'bg-error text-white' : 'bg-marfil text-[#3B2418]'}`}>
                            {n}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <BotonTema sobreOscuro conTexto />
          <NavLink to="/" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-marfil/70 hover:bg-white/5 hover:text-white">
            <Store size={18} /> Ver tienda
          </NavLink>
          <button onClick={salir} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-marfil/70 hover:bg-error/20 hover:text-white">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="md:pl-[17.5rem]">
        <Outlet />
      </div>

      {buscador && <BuscadorModulos onCerrar={() => setBuscador(false)} contadores={contadores} />}
    </ContadoresAdmin.Provider>
  )
}

// Manchas de color que se mueven lento detrás del cristal
function FondoAmbiental() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-crema">
      <span className="absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] animate-deriva rounded-full bg-vino/20 blur-[90px] dark:bg-vino/25" />
      <span className="absolute -right-[15%] top-[10%] h-[45vmax] w-[45vmax] animate-deriva rounded-full bg-miel/20 blur-[90px] [animation-delay:-7s]" />
      <span className="absolute -bottom-[20%] left-[25%] h-[50vmax] w-[50vmax] animate-deriva rounded-full bg-oliva/20 blur-[100px] [animation-delay:-14s]" />
      <span className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgb(var(--cacao)/0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  )
}

// Paleta de comandos: escribe para ir a cualquier módulo o acción
function BuscadorModulos({ onCerrar, contadores }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const lista = useRef(null)

  const resultados = useMemo(() => {
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const t = norm(q.trim())
    const todo = [...ACCIONES_RAPIDAS.map((a) => ({ ...a, accion: true })), ...TODOS_LOS_MODULOS]
    return t ? todo.filter((m) => norm(`${m.nombre} ${m.desc}`).includes(t)) : todo
  }, [q])

  const ir = (m) => {
    onCerrar()
    navigate(m.ruta)
  }

  const tecla = (e) => {
    if (e.key === 'Escape') onCerrar()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setI((x) => Math.min(resultados.length - 1, x + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setI((x) => Math.max(0, x - 1))
    }
    if (e.key === 'Enter' && resultados[i]) ir(resultados[i])
  }

  useEffect(() => {
    lista.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [i])

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-tinta/40 p-4 pt-[12vh] backdrop-blur-sm animate-desvanecer" onClick={onCerrar}>
      <div role="dialog" aria-modal="true" aria-label="Buscar módulo" onClick={(e) => e.stopPropagation()} className="vidrio w-full max-w-lg animate-emerger overflow-hidden rounded-3xl">
        <div className="flex items-center gap-3 border-b border-borde/60 px-4">
          <Search size={18} className="text-textoSecundario" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setI(0)
            }}
            onKeyDown={tecla}
            placeholder="¿A dónde quieres ir?"
            className="h-14 flex-1 bg-transparent text-base text-cacao outline-none placeholder:text-textoSecundario/60"
          />
          <kbd className="rounded-md border border-borde px-1.5 py-0.5 text-[10px] font-semibold text-textoSecundario">Esc</kbd>
        </div>
        <ul ref={lista} className="max-h-[50vh] overflow-y-auto p-2">
          {resultados.length === 0 && <li className="px-4 py-8 text-center text-sm text-textoSecundario">Sin resultados para “{q}”</li>}
          {resultados.map((m, idx) => {
            const Icono = m.icono
            const n = m.contador ? contadores[m.contador] : 0
            return (
              <li key={m.ruta}>
                <button
                  data-activo={idx === i}
                  onMouseEnter={() => setI(idx)}
                  onClick={() => ir(m)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${idx === i ? 'bg-vino text-white' : 'text-cacao'}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${idx === i ? 'bg-white/15' : m.accion ? 'bg-miel/15 text-miel' : 'bg-vino/10 text-vino'}`}>
                    <Icono size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{m.nombre}</span>
                    <span className={`block truncate text-xs ${idx === i ? 'text-white/70' : 'text-textoSecundario'}`}>{m.desc}</span>
                  </span>
                  {n > 0 && <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${idx === i ? 'bg-white/20' : 'bg-pergamino'}`}>{n}</span>}
                  {idx === i && <CornerDownLeft size={15} className="text-white/70" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
