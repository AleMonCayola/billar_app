const TZ = "America/La_Paz";
const HORA_CORTE = 4;

function partesLocal(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  });
  const partes = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    year: parseInt(partes.year, 10),
    month: parseInt(partes.month, 10),
    day: parseInt(partes.day, 10),
    hour: parseInt(partes.hour, 10) % 24,
  };
}

export function fechaNegocioActual(referencia: Date = new Date()): string {
  const { year, month, day, hour } = partesLocal(referencia);
  const base = new Date(Date.UTC(year, month - 1, day));
  if (hour < HORA_CORTE) {
    base.setUTCDate(base.getUTCDate() - 1);
  }

  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
