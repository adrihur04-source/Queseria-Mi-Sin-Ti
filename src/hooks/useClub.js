// useClub.js — Estado del "Club Quesero" del cliente: puntos, nivel, amigos invitados y código
import { useEffect, useMemo, useState } from 'react'
import { collection, doc, onSnapshot, query, setDoc, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth'
import { usePedidosCliente } from './usePedidosCliente'
import { calcularPuntos, codigoReferido } from '../utils/puntos'

export function useClub() {
  const { usuario } = useAuth()
  const { pedidos, cargando } = usePedidosCliente()
  const [amigos, setAmigos] = useState({ uid: null, lista: [] })
  const uid = usuario?.uid
  const codigo = uid ? codigoReferido(uid) : null

  // Amigos que usaron mi código
  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      query(collection(db, 'referidos'), where('referidorId', '==', uid)),
      (s) => setAmigos({ uid, lista: s.docs.map((d) => ({ id: d.id, ...d.data() })) }),
      () => setAmigos({ uid, lista: [] }),
    )
  }, [uid])

  // Registra mi código para que otros puedan canjearlo (codigos/{CODIGO} → uid)
  useEffect(() => {
    if (!uid || usuario?.role && usuario.role !== 'cliente') return
    setDoc(doc(db, 'codigos', codigo), { uid, nombre: usuario?.nombre || '', creado: serverTimestamp() }, { merge: true }).catch(() => {})
  }, [uid, codigo, usuario?.role, usuario?.nombre])

  const lista = amigos.uid === uid ? amigos.lista : []
  const puntos = useMemo(() => calcularPuntos(pedidos, lista.length, usuario?.puntosCanjeados), [pedidos, lista.length, usuario?.puntosCanjeados])

  return { ...puntos, amigos: lista, codigo, pedidos, cargando, primeraCompra: !cargando && pedidos.filter((p) => p.status !== 'cancelado').length === 0 }
}
