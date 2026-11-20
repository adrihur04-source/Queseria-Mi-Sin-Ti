import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RoleRoute from "./RoleRoute"

// 🟡 CLIENTE
import Login from '../pages/cliente/Login'
import Registro from '../pages/cliente/Registro'
import Catalogo from '../pages/cliente/Catalogo'
import DetalleProducto from '../pages/cliente/DetalleProducto'
import Carrito from '../pages/cliente/Carrito'
import ConfirmarPedido from '../pages/cliente/ConfirmarPedido'
import HistorialCliente from '../pages/cliente/HistorialCliente'
import Perfil from '../pages/cliente/Perfil'

// 🟢 EMPLEADO
import PerfilEmpleado from "../pages/empleado/PerfilEmpleado"
import DashboardEmpleado from '../pages/empleado/DashboardEmpleado'
import Inventario from '../pages/empleado/Inventario'
import RegistrarMovimiento from '../pages/empleado/RegistrarMovimiento'
import HistorialMovimientos from '../pages/empleado/HistorialMovimientos'
import Lotes from '../pages/empleado/Lotes'
import AlertasStock from '../pages/empleado/AlertasStock'
import PedidosPendientes from '../pages/empleado/PedidosPendientes'
import DetallePedido from '../pages/empleado/DetallePedido'

// 🔴 ADMIN
import DashboardAdmin from '../pages/admin/DashboardAdmin'
import GestionProductos from '../pages/admin/GestionProductos'
import FormularioProducto from '../pages/admin/FormularioProducto'
import Categorias from "../pages/admin/Categorias"
import GestionProveedores from '../pages/admin/GestionProveedores'
import GestionUsuarios from '../pages/admin/GestionUsuarios'
import GestionRoles from '../pages/admin/GestionRoles'
import GestionPromociones from '../pages/admin/GestionPromociones'
import GestionMaridajes from '../pages/admin/GestionMaridajes'
import HistorialComprasAdmin from '../pages/admin/HistorialComprasAdmin'
import BitacoraSistema from '../pages/admin/BitacoraSistema'
import Empleados from '../pages/admin/Empleados'
import AlertasAdmin from '../pages/admin/AlertasAdmin'

export default function AppRouter(){
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta por defecto → manda al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── CLIENTE ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        
        <Route path="/catalogo" element={
          <RoleRoute allowedRoles={["cliente", "admin", "empleado"]}><Catalogo /></RoleRoute>
        } />
        <Route path="/catalogo/:id" element={
          <RoleRoute allowedRoles={["cliente", "admin", "empleado"]}><DetalleProducto /></RoleRoute>
        } />
        <Route path="/carrito" element={
          <RoleRoute allowedRoles={["cliente"]}><Carrito /></RoleRoute>
        } />
        <Route path="/confirmar" element={
          <RoleRoute allowedRoles={["cliente"]}><ConfirmarPedido /></RoleRoute>
        } />
        <Route path="/historial" element={
          <RoleRoute allowedRoles={["cliente"]}><HistorialCliente /></RoleRoute>
        } />
        <Route path="/perfil" element={
          <RoleRoute allowedRoles={["cliente", "admin", "empleado"]}><Perfil /></RoleRoute>
        } />

        {/* ── EMPLEADO ── */}
        <Route path="/empleado/dashboard" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><DashboardEmpleado /></RoleRoute>
        } />
        <Route path="/empleado/perfil" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><PerfilEmpleado /></RoleRoute>
        } />
        <Route path="/empleado/inventario" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><Inventario /></RoleRoute>
        } />
        <Route path="/empleado/movimiento" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><RegistrarMovimiento /></RoleRoute>
        } />
        <Route path="/empleado/historial" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><HistorialMovimientos /></RoleRoute>
        } />
        {/* Copia esta estructura en tu archivo de rutas para asegurar el acceso: */}
<Route path="/empleado/productos" element={
  <RoleRoute allowedRoles={["empleado", "admin"]}><DashboardEmpleado /></RoleRoute>
} />

<Route path="/empleado/lotes/:productoId" element={
  <RoleRoute allowedRoles={["empleado", "admin"]}><Lotes /></RoleRoute>
} />
        <Route path="/empleado/alertas" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><AlertasStock /></RoleRoute>
        } />
        <Route path="/empleado/pedidos" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><PedidosPendientes /></RoleRoute>
        } />
        <Route path="/empleado/detalle/:id" element={
          <RoleRoute allowedRoles={["empleado", "admin"]}><DetallePedido /></RoleRoute>
        } />

        {/* ── ADMIN ── */}
        <Route path="/admin/dashboard" element={
          <RoleRoute allowedRoles={["admin"]}><DashboardAdmin /></RoleRoute>
        } />
        <Route path="/admin/empleados" element={
          <RoleRoute allowedRoles={["admin"]}><Empleados /></RoleRoute>
        } />
        <Route path="/admin/productos" element={
          <RoleRoute allowedRoles={["admin"]}><GestionProductos /></RoleRoute>
        } />
        <Route path="/admin/producto/:id" element={
          <RoleRoute allowedRoles={["admin"]}><FormularioProducto /></RoleRoute>
        } />
        <Route path="/admin/proveedores" element={
          <RoleRoute allowedRoles={["admin"]}><GestionProveedores /></RoleRoute>
        } />
        <Route path="/admin/usuarios" element={
          <RoleRoute allowedRoles={["admin"]}><GestionUsuarios /></RoleRoute>
        } />
        <Route path="/admin/roles" element={
          <RoleRoute allowedRoles={["admin"]}><GestionRoles /></RoleRoute>
        } />
        <Route path="/admin/promociones" element={
          <RoleRoute allowedRoles={["admin"]}><GestionPromociones /></RoleRoute>
        } />
        <Route path="/admin/maridajes" element={
          <RoleRoute allowedRoles={["admin"]}><GestionMaridajes /></RoleRoute>
        } />
        <Route path="/admin/historial" element={
          <RoleRoute allowedRoles={["admin"]}><HistorialComprasAdmin /></RoleRoute>
        } />
        <Route path="/admin/bitacora" element={
          <RoleRoute allowedRoles={["admin"]}><BitacoraSistema /></RoleRoute>
        } />
        <Route path="/admin/inventario" element={
          <RoleRoute allowedRoles={["admin"]}><Inventario /></RoleRoute>
        } />
        <Route path="/admin/pedidos" element={
          <RoleRoute allowedRoles={["admin"]}><PedidosPendientes /></RoleRoute>
        } />
        <Route path="/admin/categorias" element={
          <RoleRoute allowedRoles={["admin"]}><Categorias /></RoleRoute>
        } />
        {/* Añade esta línea dentro de la sección de ADMIN en tu AppRouter.jsx */}
        <Route path="/admin/perfil" element={
        <RoleRoute allowedRoles={["admin"]}><Perfil /></RoleRoute>
        } />
        <Route path="/admin/alertas" element={
  <RoleRoute allowedRoles={["admin"]}><AlertasAdmin /></RoleRoute>
} />

        {/* Redirección por si meten cualquier otra URL errónea */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
