// modulos.js — Módulos del admin (fuente única para barra lateral, barra inferior, buscador ⌘K y dashboard)
import {
  LayoutDashboard, ClipboardList, Package, Warehouse, Tags, Truck, Users, ShieldCheck, Receipt, FileClock, UserRound,
  Settings2, History, Plus, ArrowLeftRight,
} from 'lucide-react'

export const MODULOS_ADMIN = [
  {
    grupo: 'Operación',
    items: [
      { ruta: '/admin/dashboard', nombre: 'Inicio', icono: LayoutDashboard, desc: 'Resumen del día y ventas' },
      { ruta: '/admin/pedidos', nombre: 'Pedidos', icono: ClipboardList, contador: 'pedidos', desc: 'Pedidos por atender y envíos' },
      { ruta: '/admin/inventario', nombre: 'Inventario', icono: Warehouse, contador: 'alertas', desc: 'Stock, lotes y alertas' },
    ],
  },
  {
    grupo: 'Catálogo',
    items: [
      { ruta: '/admin/productos', nombre: 'Productos', icono: Package, desc: 'Alta, precios y promociones' },
      { ruta: '/admin/categorias', nombre: 'Categorías', icono: Tags, desc: 'Organiza el catálogo' },
      { ruta: '/admin/proveedores', nombre: 'Proveedores', icono: Truck, desc: 'Contactos de compra' },
    ],
  },
  {
    grupo: 'Reportes',
    items: [
      { ruta: '/admin/historial', nombre: 'Ventas', icono: Receipt, desc: 'Historial de pedidos y CSV' },
      { ruta: '/admin/historial-inventario', nombre: 'Movimientos', icono: History, desc: 'Entradas y salidas de inventario' },
      { ruta: '/admin/bitacora', nombre: 'Bitácora', icono: FileClock, desc: 'Quién hizo qué y cuándo' },
    ],
  },
  {
    grupo: 'Equipo y tienda',
    items: [
      { ruta: '/admin/usuarios', nombre: 'Usuarios', icono: Users, desc: 'Cuentas, roles y accesos' },
      { ruta: '/admin/roles', nombre: 'Roles', icono: ShieldCheck, desc: 'Permisos por rol' },
      { ruta: '/admin/ajustes', nombre: 'Ajustes', icono: Settings2, desc: 'Envío, horario y contacto' },
      { ruta: '/admin/perfil', nombre: 'Mi perfil', icono: UserRound, desc: 'Foto, datos y contraseña' },
    ],
  },
]

export const TODOS_LOS_MODULOS = MODULOS_ADMIN.flatMap((g) => g.items)

// Acciones rápidas para el buscador ⌘K
export const ACCIONES_RAPIDAS = [
  { ruta: '/admin/producto/nuevo', nombre: 'Nuevo producto', icono: Plus, desc: 'Agregar al catálogo' },
  { ruta: '/admin/movimiento', nombre: 'Registrar movimiento', icono: ArrowLeftRight, desc: 'Entrada o salida de stock' },
]
