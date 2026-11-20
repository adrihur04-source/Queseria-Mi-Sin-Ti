import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

export default function ProtectedRoute({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <p>Cargando...</p>
  }

  if (!usuario) {
    return <Navigate to="/login" />
  }

  return children
}