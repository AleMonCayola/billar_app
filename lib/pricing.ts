// =========================================================
// Reglas de precio del negocio
// =========================================================

// Bloques predeterminados: minutos -> precio en Bs
export const BLOQUES = [
  { minutos: 30, precio: 8, etiqueta: "30 min" },
  { minutos: 60, precio: 15, etiqueta: "1 hora" },
  { minutos: 120, precio: 30, etiqueta: "2 horas" },
] as const;

// Tarifa por minuto para el modo libre (basada en la tarifa de 1 hora)
export const TARIFA_POR_MINUTO = 15 / 60; // 0.25 Bs/min

/**
 * Calcula el precio del modo libre en base a los minutos transcurridos,
 * redondeando siempre hacia el número entero mayor.
 */
export function calcularPrecioLibre(minutosTranscurridos: number): number {
  if (minutosTranscurridos <= 0) return 0;
  return Math.ceil(minutosTranscurridos * TARIFA_POR_MINUTO);
}

/**
 * Formatea segundos a mm:ss para mostrar en pantalla.
 */
export function formatearTiempo(segundosTotales: number): string {
  const s = Math.max(0, Math.round(segundosTotales));
  const horas = Math.floor(s / 3600);
  const minutos = Math.floor((s % 3600) / 60);
  const segundos = s % 60;
  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, "0")}:${String(
      segundos
    ).padStart(2, "0")}`;
  }
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(
    2,
    "0"
  )}`;
}
