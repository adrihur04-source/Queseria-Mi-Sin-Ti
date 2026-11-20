import { Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function RoleRoute({ children, allowedRoles }) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-crema">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-vino/20 border-t-vino" />
        <p className="font-display text-lg text-cacao">Preparando tu espacio…</p>
      </div>
    )
  }

  // Sin sesión, o cuenta desactivada por administración
  if (!usuario || usuario.activo === false) {
    return <Navigate to="/login" replace />
  }

  // Si el rol aún no se ha mapeado en el AuthProvider, usamos un fallback por seguridad
  const role = usuario.role || "cliente"

  if (!allowedRoles.includes(role)) {
    // Ya tiene sesión pero no permiso: a la portada (no al login, que confunde)
    return <Navigate to="/" replace />
  }

  return children
}