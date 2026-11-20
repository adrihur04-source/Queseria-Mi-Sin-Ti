// AuthProvider.jsx
// Escucha el documento usuarios/{uid} en tiempo real: si cambias tu foto o nombre,
// se actualiza al instante en toda la app (barra lateral, encabezados, perfil).
import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebase/config"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let dejarDeEscuchar = null

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      dejarDeEscuchar?.()
      dejarDeEscuchar = null

      if (!firebaseUser) {
        setUsuario(null)
        setLoading(false)
        return
      }

      // Espera a tener el rol ANTES de dejar de mostrar "loading"
      dejarDeEscuchar = onSnapshot(
        doc(db, "usuarios", firebaseUser.uid),
        (snap) => {
          setUsuario({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...(snap.exists() ? snap.data() : {}), // incluye role, nombre, foto, etc.
          })
          setLoading(false)
        },
        () => {
          setUsuario({ uid: firebaseUser.uid, email: firebaseUser.email })
          setLoading(false)
        },
      )
    })

    return () => {
      dejarDeEscuchar?.()
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
