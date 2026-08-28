import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo del salón (fieltro oscuro bajo luz de lámpara de billar)
        felt: {
          DEFAULT: "#123526",
          dark: "#0a2118",
          darker: "#071710",
        },
        // Panel / tarjetas
        panel: {
          DEFAULT: "#173B2C",
          light: "#1E4735",
        },
        // Riel de la mesa (borde de madera oscura)
        rail: "#2A1E14",
        // Acento principal: paño verde brillante (acción/activo)
        cloth: {
          DEFAULT: "#2F9E63",
          light: "#3FBE79",
          dark: "#1F7248",
        },
        // Acento secundario: tiza / latón (destacados, números, marca)
        chalk: {
          DEFAULT: "#D4A24C",
          light: "#E6BE73",
          dark: "#A87B2E",
        },
        // Alerta (bola roja / tiempo terminado)
        alarm: {
          DEFAULT: "#E0473C",
          dark: "#B23227",
        },
        ink: {
          DEFAULT: "#F3EFE4",
          muted: "#9FB3AA",
          faint: "#6C8078",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        felt: "0 8px 24px -8px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
