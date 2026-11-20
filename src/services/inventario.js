// inventario.js — Movimientos de inventario y lotes
// Toda entrada/salida pasa por aquí: stock del producto, lote e historial
// se escriben en UNA transacción, así nunca quedan desincronizados.
//
// Modelo de lotes: productos/{productoId}/lotes/{loteId}
//   { numero, cantInicial, cantActual, caducidad: 'YYYY-MM-DD' | null,
//     observaciones, registradoPor, creado }

import {
  collection, doc, runTransaction, serverTimestamp, addDoc, onSnapshot, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { registrarEvento } from '../utils/bitacora'

export const MOTIVOS_SALIDA = ['Venta en mostrador', 'Merma / caducidad', 'Producto dañado', 'Degustación', 'Ajuste de inventario']

export function escucharLotes(productoId, onDatos, onError) {
  if (!productoId) return () => {}
  const q = query(collection(db, 'productos', productoId, 'lotes'), orderBy('creado', 'desc'))
  return onSnapshot(
    q,
    (snap) => onDatos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.error('Error cargando lotes:', err)
      onError?.(err)
    },
  )
}

export function siguienteNumeroLote(lotes) {
  const max = lotes.reduce((m, l) => {
    const n = parseInt(String(l.numero || '').replace(/\D/g, ''), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `Lote #${String(max + 1).padStart(3, '0')}`
}

/**
 * @param {object} p
 * @param {'entrada'|'salida'} p.tipo
 * @param {string} p.productoId
 * @param {string} p.productoNombre
 * @param {number} p.cantidad
 * @param {number} [p.precio]        nuevo precio (se conserva el actual si no es válido)
 * @param {string} [p.motivo]
 * @param {string} [p.observaciones]
 * @param {{ modo: 'nuevo', numero: string, caducidad?: string } | { modo: 'existente', id: string } | null} [p.lote]
 * @param {string} p.responsable
 */
export async function registrarMovimiento({
  tipo, productoId, productoNombre, cantidad, precio, motivo, observaciones = '', lote = null, responsable,
}) {
  if (!productoId) throw new Error('Selecciona un producto.')
  if (!cantidad || cantidad < 1) throw new Error('La cantidad debe ser mayor a cero.')

  const productoRef = doc(db, 'productos', productoId)
  const lotesCol = collection(db, 'productos', productoId, 'lotes')
  const loteRef =
    lote?.modo === 'existente' ? doc(lotesCol, lote.id) : lote?.modo === 'nuevo' ? doc(lotesCol) : null
  const movRef = doc(collection(db, 'historialInventario'))

  const resultado = await runTransaction(db, async (tx) => {
    // ── Lecturas (todas antes de escribir) ──
    const snap = await tx.get(productoRef)
    if (!snap.exists()) throw new Error('El producto seleccionado ya no existe.')
    const loteSnap = lote?.modo === 'existente' ? await tx.get(loteRef) : null
    if (lote?.modo === 'existente' && !loteSnap.exists()) throw new Error('El lote seleccionado ya no existe.')

    const stockAntes = Number(snap.data().stock) || 0
    const precioAntes = Number(snap.data().precio) || 0
    const precioDespues = Number.isFinite(Number(precio)) && Number(precio) >= 0 && precio !== '' ? Number(precio) : precioAntes

    if (tipo === 'salida' && stockAntes < cantidad) {
      throw new Error(`Solo hay ${stockAntes} pza(s) disponibles.`)
    }
    if (tipo === 'salida' && loteSnap) {
      const enLote = Number(loteSnap.data().cantActual) || 0
      if (enLote < cantidad) throw new Error(`El lote solo tiene ${enLote} pza(s).`)
    }

    const stockDespues = tipo === 'entrada' ? stockAntes + cantidad : stockAntes - cantidad

    // ── Escrituras ──
    const cambiosProducto = { stock: stockDespues, precio: precioDespues }
    if (stockDespues === 0) cambiosProducto.agotadoEn = serverTimestamp()
    tx.update(productoRef, cambiosProducto)

    let loteNumero = ''
    if (lote?.modo === 'nuevo') {
      loteNumero = lote.numero
      tx.set(loteRef, {
        numero: lote.numero,
        cantInicial: cantidad,
        cantActual: cantidad,
        caducidad: lote.caducidad || null,
        observaciones,
        registradoPor: responsable,
        creado: serverTimestamp(),
      })
    } else if (loteSnap) {
      loteNumero = loteSnap.data().numero || ''
      const actual = Number(loteSnap.data().cantActual) || 0
      tx.update(loteRef, { cantActual: tipo === 'entrada' ? actual + cantidad : actual - cantidad })
    }

    const motivoTexto = tipo === 'salida' ? motivo || 'Salida de inventario' : motivo || 'Reabastecimiento de mercancía'
    tx.set(movRef, {
      tipo,
      productoId,
      producto: productoNombre,
      detalle: `${tipo === 'entrada' ? 'Entrada' : 'Salida'} · ${motivoTexto}`,
      cantidad,
      lote: loteNumero,
      loteId: loteRef?.id || '',
      responsable,
      stockAntes,
      stockDespues,
      precioAntes,
      precioDespues,
      observaciones,
      creado: serverTimestamp(),
    })

    return { stockAntes, stockDespues, precioAntes, precioDespues, loteNumero }
  })

  await registrarEvento({
    modulo: 'Inventario',
    accion: 'Crear',
    descripcion: `${tipo === 'entrada' ? 'Entrada' : 'Salida'} de ${cantidad} pzas · ${productoNombre}${resultado.loteNumero ? ` · ${resultado.loteNumero}` : ''}`,
    usuarioNombre: responsable,
  })

  if (tipo === 'salida' && resultado.stockDespues === 0) {
    await addDoc(collection(db, 'notificaciones'), {
      tipo: 'sin_stock',
      productoId,
      productoNombre,
      mensaje: `${productoNombre} ya no tiene piezas disponibles`,
      leida: false,
      creado: serverTimestamp(),
    }).catch(() => {})
  }

  return resultado
}
