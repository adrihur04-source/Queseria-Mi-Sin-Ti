// useConfigTienda.js — Ajustes de la tienda en vivo (Firestore: configuracion/tienda)
// Envío a domicilio, dirección, horario y contacto. Si el documento no existe o no se puede
// leer, se usan los valores por defecto (la app nunca se queda sin datos).
import { useSyncExternalStore } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export const CONFIG_POR_DEFECTO = {
  envioActivo: true,
  envioCosto: 40,
  envioGratisDesde: 500,
  envioZona: 'Entregas dentro de la ciudad',
  envioTiempo: '45–90 min',
  direccion: 'Calle Principal #123, Centro',
  horario: 'Lun a Sáb · 9:00 a 20:00',
  telefono: '',
}

// Una sola suscripción compartida por toda la app
let actual = CONFIG_POR_DEFECTO
let cancelar = null
const oyentes = new Set()

function suscribir(cb) {
  oyentes.add(cb)
  if (!cancelar) {
    cancelar = onSnapshot(
      doc(db, 'configuracion', 'tienda'),
      (snap) => {
        actual = { ...CONFIG_POR_DEFECTO, ...(snap.exists() ? snap.data() : {}) }
        oyentes.forEach((o) => o())
      },
      () => {},
    )
  }
  return () => {
    oyentes.delete(cb)
    if (!oyentes.size && cancelar) {
      cancelar()
      cancelar = null
    }
  }
}

export function useConfigTienda() {
  return useSyncExternalStore(suscribir, () => actual)
}

// Costo de envío para un subtotal dado (0 si alcanza el envío gratis)
export function calcularEnvio(config, subtotal) {
  if (!config.envioActivo) return 0
  const gratis = Number(config.envioGratisDesde) || 0
  if (gratis > 0 && subtotal >= gratis) return 0
  return Number(config.envioCosto) || 0
}
