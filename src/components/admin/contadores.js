// contadores.js — Contadores en vivo del admin (pedidos activos, alertas de stock)
import { createContext, useContext } from 'react'

export const ContadoresAdmin = createContext({ pedidos: 0, alertas: 0 })
export const useContadoresAdmin = () => useContext(ContadoresAdmin)
