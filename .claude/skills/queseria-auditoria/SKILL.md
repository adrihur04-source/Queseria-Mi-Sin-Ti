---
name: queseria-auditoria
description: Auditoría de diseño, UX y calidad de la app "Quesería de mi sin ti". Úsalo cuando pidan "audita", "revisa la app", "qué le falta", "qué está mal" o antes de una entrega/presentación del proyecto.
---

# Auditoría — Quesería de mi sin ti

Antes de opinar, mide. Luego reporta por severidad y propone arreglos concretos con archivo:línea.
Aplica las reglas de la skill `queseria-diseno`.

## 1. Métricas rápidas (PowerShell, desde la raíz de la app)

```powershell
$src = Get-ChildItem src -Recurse -Include *.jsx,*.js; $all = $src | Get-Content -Raw
"hex sueltos:      " + ($all | Select-String '\[#[0-9A-Fa-f]{6}\]' -AllMatches).Matches.Count
"paleta genérica:  " + ($all | Select-String '\b(gray|blue|yellow|green|red)-\d{2,3}' -AllMatches).Matches.Count
"console.log:      " + ($all | Select-String 'console\.log' -AllMatches).Matches.Count
"alert():          " + ($all | Select-String '\balert\(' -AllMatches).Matches.Count
"responsive md/lg: " + ($all | Select-String '\b(md|lg|xl):' -AllMatches).Matches.Count
"FontAwesome:      " + ($src | Select-String 'fortawesome' -List).Count + " archivos"
```

Además busca:
- Números de negocio escritos a mano (`stats = {`, `sub: "186 activos"`, `badge: 7`).
- Páginas placeholder (`return <h1>…</h1>` solamente).
- Rutas: `src/App.jsx` es el router real; `src/router/AppRouter.jsx` no se usa.
- Imágenes de 0 bytes o > 500 KB en `src/assets/productos` y `public/`.
- `firebase/config.js`: las reglas de Firestore deben permitir lectura pública de `productos` (portada) y nada más sin sesión.

## 2. Recorrido por rol
Revisa cada flujo con 360px y 1280px de ancho:
1. **Visitante**: `/` → vitrina → vista rápida → crear cuenta.
2. **Cliente**: login → catálogo → detalle → carrito → confirmar → historial → perfil.
3. **Cajero/Empleado**: dashboard → pedidos pendientes → detalle → marcar entregado → inventario → movimiento.
4. **Admin**: dashboard → productos (alta/edición) → usuarios/roles → proveedores → bitácora.

En cada pantalla anota: jerarquía visual, consistencia con tokens, estados (cargando/vacío/error/offline), objetivos táctiles, textos.

## 3. Formato del reporte
Agrupa en: 🔴 Crítico (rompe flujo, seguridad, datos falsos) · 🟠 Alto (inconsistencia visible, UX confusa) · 🟡 Medio · 🟢 Pulido.
Cada hallazgo: qué, dónde (`archivo:línea`), por qué importa, arreglo propuesto. Cierra con el top 5 de próximos pasos.
