/** @type {import('tailwindcss').Config} */
// Sistema de diseño — Quesería de mi sin ti
// Paleta derivada del logotipo: cacao + crema + oliva, con vino como color de acción.
// Los colores son variables CSS (src/index.css) para soportar modo claro y oscuro.
// - Tokens que CAMBIAN con el tema: crema, pergamino, superficie, cacao (texto), borde, textos, vino, oliva, miel, exito, error.
// - Tokens FIJOS: tinta (fondo oscuro de encabezados), marfil (texto claro sobre fondo oscuro), vino-oscuro.
const v = (nombre) => `rgb(var(--${nombre}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Marca ──
        crema: v('crema'),
        pergamino: v('pergamino'),
        superficie: v('superficie'),
        cacao: { DEFAULT: v('cacao'), claro: v('cacao-claro') },
        vino: { DEFAULT: v('vino'), oscuro: v('vino-oscuro'), claro: v('vino-claro') },
        oliva: { DEFAULT: v('oliva'), claro: v('oliva-claro') },
        miel: { DEFAULT: v('miel'), claro: v('miel-claro') },
        exito: v('exito'),
        tinta: v('tinta'),
        marfil: v('marfil'),

        // ── Tokens legacy (mapeados a la marca) ──
        fondoPrincipal: v('crema'),
        fondoSecundario: v('pergamino'),
        botonPrincipal: v('vino'),
        botonSecundario: v('miel'),
        borde: v('borde'),
        textoPrincipal: v('texto'),
        textoSecundario: v('texto-sec'),
        error: v('error'),
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        tarjeta: "0 1px 2px rgb(var(--sombra) / 0.06), 0 8px 24px -12px rgb(var(--sombra) / 0.18)",
        elevada: "0 24px 48px -20px rgb(var(--sombra) / 0.35)",
      },
      keyframes: {
        aparecer: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flotar: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--giro, 0deg))" },
          "50%": { transform: "translateY(-14px) rotate(var(--giro, 0deg))" },
        },
        brillo: {
          "0%, 100%": { opacity: ".55", transform: "scale(1)" },
          "50%": { opacity: ".85", transform: "scale(1.08)" },
        },
        sacudir: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        latido: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.35)" },
          "60%": { transform: "scale(.9)" },
          "100%": { transform: "scale(1)" },
        },
        deslizarDerecha: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        desvanecer: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        desplazar: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        emerger: {
          "0%": { opacity: "0", transform: "translateY(16px) scale(.92)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        saludo: {
          "0%, 60%, 100%": { transform: "rotate(0deg)" },
          "10%, 30%": { transform: "rotate(14deg)" },
          "20%": { transform: "rotate(-8deg)" },
          "40%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(10deg)" },
        },
        brilloTarjeta: {
          "0%, 100%": { backgroundPosition: "150% 0" },
          "50%": { backgroundPosition: "-50% 0" },
        },
        deriva: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(6%, -8%) scale(1.12)" },
          "66%": { transform: "translate(-6%, 6%) scale(.92)" },
        },
      },
      animation: {
        aparecer: "aparecer .6s cubic-bezier(.2,.7,.2,1) both",
        flotar: "flotar 7s ease-in-out infinite",
        brillo: "brillo 9s ease-in-out infinite",
        sacudir: "sacudir .4s ease-in-out",
        latido: "latido .5s ease-out",
        "deslizar-derecha": "deslizarDerecha .35s cubic-bezier(.2,.8,.2,1) both",
        desvanecer: "desvanecer .25s ease-out both",
        desplazar: "desplazar 40s linear infinite",
        emerger: "emerger .45s cubic-bezier(.2,.9,.25,1.15) both",
        deriva: "deriva 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
