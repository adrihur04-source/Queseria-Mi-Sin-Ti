// bitacora.js — Función centralizada para registrar eventos del sistema
import { db } from '../firebase/config'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function registrarEvento({ modulo, accion, descripcion, usuarioNombre }) {
  try {
    await addDoc(collection(db, 'bitacora'), {
      modulo,
      accion,
      descripcion,
      usuario: usuarioNombre || 'Sistema automático',
      creado: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error registrando evento en bitácora:', error)
  }
}