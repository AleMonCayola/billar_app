import type { Sesion, Mesa } from "@/types";

const TZ = "America/La_Paz";
const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function horaLocal(iso: string): number {
  // Usamos Intl para no depender de la zona horaria del servidor (Vercel corre en UTC)
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    hour12: false,
  }).format(new Date(iso));
  return parseInt(s, 10) % 24;
}

function diaSemanaLocal(iso: string): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date(iso));
  const mapa: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return mapa[s] ?? 0;
}

export interface StatsNegocio {
  totalHistorico: number;
  diasConVentas: number;
  promedioDiario: number;
  mejorMes: { label: string; total: number } | null;
  mesaEstrella: { nombre: string; total: number } | null;
  porHora: { hora: string; cobros: number }[];
  horaPico: string | null;
  porDiaSemana: { dia: string; total: number }[];
  diaPico: string | null;
  ultimosDias: { fecha: string; total: number }[];
}

export function calcularStats(
  sesiones: Pick<Sesion, "fecha" | "inicio" | "monto">[],
  mesas: Mesa[]
): StatsNegocio {
  const totalHistorico = mesas.reduce((a, m) => a + m.historico_total, 0);

  const porFecha = new Map<string, number>();
  const porMesEtiqueta = new Map<string, number>();
  const cobrosPorHora = new Array(24).fill(0);
  const totalPorDiaSemana = new Array(7).fill(0);

  for (const s of sesiones) {
    const monto = s.monto ?? 0;
    porFecha.set(s.fecha, (porFecha.get(s.fecha) ?? 0) + monto);

    const [anio, mesNum] = s.fecha.split("-");
    const etiquetaMes = `${MESES[parseInt(mesNum, 10) - 1]} ${anio}`;
    porMesEtiqueta.set(etiquetaMes, (porMesEtiqueta.get(etiquetaMes) ?? 0) + monto);

    if (s.inicio) {
      cobrosPorHora[horaLocal(s.inicio)] += 1;
      totalPorDiaSemana[diaSemanaLocal(s.inicio)] += monto;
    }
  }

  const diasConVentas = porFecha.size;
  const promedioDiario = diasConVentas > 0 ? totalHistorico / diasConVentas : 0;

  let mejorMes: { label: string; total: number } | null = null;
  for (const [label, total] of porMesEtiqueta) {
    if (!mejorMes || total > mejorMes.total) mejorMes = { label, total };
  }

  let mesaEstrella: { nombre: string; total: number } | null = null;
  for (const m of mesas) {
    if (!mesaEstrella || m.historico_total > mesaEstrella.total) {
      mesaEstrella = { nombre: m.nombre, total: m.historico_total };
    }
  }

  const porHora = cobrosPorHora.map((cobros, h) => ({
    hora: `${String(h).padStart(2, "0")}:00`,
    cobros,
  }));
  const horaMax = cobrosPorHora.reduce(
    (best, v, i) => (v > cobrosPorHora[best] ? i : best),
    0
  );
  const horaPico = cobrosPorHora.some((v) => v > 0)
    ? `${String(horaMax).padStart(2, "0")}:00`
    : null;

  const porDiaSemana = totalPorDiaSemana.map((total, i) => ({
    dia: DIAS_SEMANA[i].slice(0, 3),
    total: Math.round(total * 100) / 100,
  }));
  const diaMax = totalPorDiaSemana.reduce(
    (best, v, i) => (v > totalPorDiaSemana[best] ? i : best),
    0
  );
  const diaPico = totalPorDiaSemana.some((v) => v > 0)
    ? DIAS_SEMANA[diaMax]
    : null;

  const fechasOrdenadas = [...porFecha.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : 1
  );
  const ultimosDias = fechasOrdenadas.slice(-14).map(([fecha, total]) => ({
    fecha: fecha.slice(5).replace("-", "/"), // MM/DD
    total: Math.round(total * 100) / 100,
  }));

  return {
    totalHistorico,
    diasConVentas,
    promedioDiario,
    mejorMes,
    mesaEstrella,
    porHora,
    horaPico,
    porDiaSemana,
    diaPico,
    ultimosDias,
  };
}
