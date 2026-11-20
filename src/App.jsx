import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleRoute from "./router/RoleRoute";
import AdminShell from "./components/admin/AdminShell";
import AsistenteGlobal from "./components/cliente/AsistenteGlobal";
import AvisosEnVivo from "./components/AvisosEnVivo";
import Recompensas from "./pages/cliente/Recompensas";
import AjustesTienda from "./pages/admin/AjustesTienda";

// 🏠 Portada pública
import Inicio from "./pages/publico/Inicio";

// 🚪 Autenticación y Cliente
import Login from "./pages/cliente/Login";
import Registro from "./pages/cliente/Registro";
import Catalogo from "./pages/cliente/Catalogo";
import DetalleProducto from "./pages/cliente/DetalleProducto";
import Carrito from "./pages/cliente/Carrito";
import HistorialCliente from "./pages/cliente/HistorialCliente";
import Perfil from "./pages/cliente/Perfil";
import Promociones from "./pages/cliente/Promociones";
import Favoritos from "./pages/cliente/Favoritos";
import MisCompras from "./pages/cliente/MisCompras";

// 📋 Personal (cajero/empleado) — el admin reutiliza estas pantallas
import DashboardEmpleado from "./pages/empleado/DashboardEmpleado";
import PedidosPendientes from "./pages/empleado/PedidosPendientes";
import PedidosEntregados from "./pages/empleado/PedidosEntregados";
import DetallePedido from "./pages/empleado/DetallePedido";
import Inventario from "./pages/empleado/Inventario";
import AlertasStock from "./pages/empleado/AlertasStock";
import RegistrarMovimiento from "./pages/empleado/RegistrarMovimiento";
import Lotes from "./pages/empleado/Lotes";
import HistorialMovimientos from "./pages/empleado/HistorialMovimientos";
import PerfilEmpleado from "./pages/empleado/PerfilEmpleado";

// 👑 Administración
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import GestionProductos from "./pages/admin/GestionProductos";
import FormularioProducto from "./pages/admin/FormularioProducto";
import Categorias from "./pages/admin/Categorias";
import GestionProveedores from "./pages/admin/GestionProveedores";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import GestionRoles from "./pages/admin/GestionRoles";
import HistorialComprasAdmin from "./pages/admin/HistorialComprasAdmin";
import BitacoraSistema from "./pages/admin/BitacoraSistema";


const CLIENTE = ["cliente"];
const TODOS = ["cliente", "admin", "empleado"];
const PERSONAL = ["empleado", "admin"];

// Atajo para no repetir <RoleRoute> en cada ruta
const solo = (roles, elemento) => <RoleRoute allowedRoles={roles}>{elemento}</RoleRoute>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔑 Públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* 🛒 Cliente */}
        <Route path="/catalogo" element={solo(TODOS, <Catalogo />)} />
        <Route path="/catalogo/:id" element={solo(TODOS, <DetalleProducto />)} />
        <Route path="/promociones" element={solo(TODOS, <Promociones />)} />
        <Route path="/perfil" element={solo(TODOS, <Perfil />)} />
        <Route path="/carrito" element={solo(CLIENTE, <Carrito />)} />
        <Route path="/historial" element={solo(CLIENTE, <HistorialCliente />)} />
        <Route path="/favoritos" element={solo(CLIENTE, <Favoritos />)} />
        <Route path="/compras" element={solo(CLIENTE, <MisCompras />)} />
        <Route path="/recompensas" element={solo(CLIENTE, <Recompensas />)} />

        {/* 📋 Personal */}
        <Route path="/empleado/dashboard" element={solo(PERSONAL, <DashboardEmpleado />)} />
        <Route path="/empleado/pedidos" element={solo(PERSONAL, <PedidosPendientes />)} />
        <Route path="/empleado/pedidos/entregados" element={solo(PERSONAL, <PedidosEntregados />)} />
        <Route path="/empleado/pedidos/:id" element={solo(PERSONAL, <DetallePedido />)} />
        <Route path="/empleado/inventario" element={solo(PERSONAL, <Inventario />)} />
        <Route path="/empleado/alertas" element={solo(PERSONAL, <AlertasStock />)} />
        <Route path="/empleado/movimiento" element={solo(PERSONAL, <RegistrarMovimiento />)} />
        <Route path="/empleado/lotes/:productoId" element={solo(PERSONAL, <Lotes />)} />
        <Route path="/empleado/historial" element={solo(PERSONAL, <HistorialMovimientos />)} />
        <Route path="/empleado/perfil" element={solo(PERSONAL, <PerfilEmpleado />)} />

        {/* 👑 Administración — todas dentro de AdminShell (barra lateral en escritorio) */}
        <Route element={solo(["admin"], <AdminShell />)}>
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/pedidos" element={<PedidosPendientes />} />
          <Route path="/admin/pedidos/entregados" element={<PedidosEntregados />} />
          <Route path="/admin/pedidos/:id" element={<DetallePedido />} />
          <Route path="/admin/inventario" element={<Inventario />} />
          <Route path="/admin/alertas" element={<AlertasStock />} />
          <Route path="/admin/movimiento" element={<RegistrarMovimiento />} />
          <Route path="/admin/lotes/:productoId" element={<Lotes />} />
          <Route path="/admin/historial-inventario" element={<HistorialMovimientos />} />
          <Route path="/admin/productos" element={<GestionProductos />} />
          <Route path="/admin/producto/:id" element={<FormularioProducto />} />
          <Route path="/admin/categorias" element={<Categorias />} />
          <Route path="/admin/proveedores" element={<GestionProveedores />} />
          <Route path="/admin/usuarios" element={<GestionUsuarios />} />
          <Route path="/admin/empleados" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/admin/roles" element={<GestionRoles />} />
          <Route path="/admin/historial" element={<HistorialComprasAdmin />} />
          <Route path="/admin/bitacora" element={<BitacoraSistema />} />
          <Route path="/admin/perfil" element={<PerfilEmpleado />} />
          <Route path="/admin/ajustes" element={<AjustesTienda />} />
        </Route>

        {/* Cualquier otra URL → portada */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AsistenteGlobal />
      <AvisosEnVivo />
    </BrowserRouter>
  );
}

export default App;
