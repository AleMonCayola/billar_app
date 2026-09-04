"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import DayDetailModal from "@/components/DayDetailModal";
import { fechaNegocioActual } from "@/lib/businessDate";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function MensualPage() {
  const supabase = createClient();
  const router = useRouter();
  const hoy = new Date();
  const fechaHoyNegocio = fechaNegocioActual();

  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth()); // 0-indexado
  const [totalesPorDia, setTotalesPorDia] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const ultimoDiaAMostrar = esMesActual ? hoy.getDate() : diasEnMes;

  const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const DIAS_SEMANA_HEADER = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

  const cargar = useCallback(async () => {
    setLoading(true);
    const desde = `${anio}-${pad(mes + 1)}-01`;
    const hasta = `${anio}-${pad(mes + 1)}-${pad(diasEnMes)}`;

    const { data } = await supabase
      .from("sesiones")
      .select("fecha, monto")
      .eq("estado", "cobrada")
      .gte("fecha", desde)
      .lte("fecha", hasta);

    const acumulado: Record<number, number> = {};
    (data ?? []).forEach((row: any) => {
      const dia = parseInt(row.fecha.split("-")[2], 10);
      acumulado[dia] = (acumulado[dia] ?? 0) + (row.monto ?? 0);
    });

    setTotalesPorDia(acumulado);
    setLoading(false);
  }, [anio, mes, diasEnMes, supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalMes = useMemo(
    () => Object.values(totalesPorDia).reduce((a, b) => a + b, 0),
    [totalesPorDia]
  );
  const maxDia = Math.max(...Object.values(totalesPorDia), 1);

  const dias = Array.from({ length: ultimoDiaAMostrar }, (_, i) => i + 1);
  const anios = Array.from({ length: 6 }, (_, i) => hoy.getFullYear() - i);

  function irMesAnterior() {
    if (mes === 0) {
      setMes(11);
      setAnio((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  }

  function irMesSiguiente() {
    if (mes === 11) {
      setMes(0);
      setAnio((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  }

  const esMesFuturo =
    anio > hoy.getFullYear() ||
    (anio === hoy.getFullYear() && mes >= hoy.getMonth());

  function handleClickDia(dia: number, monto: number) {
    if (monto <= 0) return;

    const fechaDia = `${anio}-${pad(mes + 1)}-${pad(dia)}`;

    if (fechaDia === fechaHoyNegocio) {
      router.push("/caja");
      return;
    }

    setDiaSeleccionado(fechaDia);
  }

  return (
    <AppShell title="Vista mensual">
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={irMesAnterior}
          aria-label="Mes anterior"
          className="p-2.5 rounded-lg bg-panel border border-rail/40 text-ink hover:border-cloth transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex gap-2 flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="mes-select">Mes</label>
          <select
            id="mes-select"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="flex-1 bg-panel border border-rail/40 rounded-lg px-3 py-2.5 text-ink font-medium focus:outline-none focus:border-cloth"
          >
            {MESES.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>

          <label className="sr-only" htmlFor="anio-select">Año</label>
          <select
            id="anio-select"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="bg-panel border border-rail/40 rounded-lg px-3 py-2.5 text-ink font-medium focus:outline-none focus:border-cloth"
          >
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <button
          onClick={irMesSiguiente}
          disabled={esMesFuturo}
          aria-label="Mes siguiente"
          className="p-2.5 rounded-lg bg-panel border border-rail/40 text-ink hover:border-cloth transition disabled:opacity-30 disabled:hover:border-rail/40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-cloth/10 border border-cloth/40 flex justify-between items-center mb-5">
        <span className="font-semibold text-ink">
          Total de {MESES[mes]} {anio}
        </span>
        <span className="font-display text-3xl text-cloth-light">
          {totalMes.toFixed(2)} Bs
        </span>
      </div>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : (
        <>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DIAS_SEMANA_HEADER.map((d) => (
            <p
              key={d}
              className="text-ink-faint text-[11px] uppercase tracking-wider text-center font-medium"
            >
              {d}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: primerDiaSemana }, (_, i) => (
            <div key={`vacio-${i}`} aria-hidden="true" />
          ))}
          {dias.map((dia) => {
            const monto = totalesPorDia[dia] ?? 0;
            const intensidad = monto > 0 ? Math.max(monto / maxDia, 0.15) : 0;
            const clicable = monto > 0;
            return (
              <button
                key={dia}
                type="button"
                onClick={() => handleClickDia(dia, monto)}
                disabled={!clicable}
                className={`rounded-xl p-2 sm:p-3 border border-rail/30 text-center transition ${
                  clicable ? "hover:border-chalk/60 cursor-pointer" : "cursor-default"
                }`}
                style={{
                  backgroundColor:
                    monto > 0
                      ? `rgba(47, 158, 99, ${intensidad * 0.35})`
                      : "rgba(255,255,255,0.02)",
                }}
              >
                <p className="text-ink-faint text-xs mb-1">{dia}</p>
                <p
                  className={`font-display text-sm sm:text-lg ${
                    monto > 0 ? "text-cloth-light" : "text-ink-faint"
                  }`}
                >
                  {monto > 0 ? monto.toFixed(0) : "—"}
                </p>
              </button>
            );
          })}
        </div>
        </>
      )}

      {diaSeleccionado && (
        <DayDetailModal
          fecha={diaSeleccionado}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </AppShell>
  );
}
