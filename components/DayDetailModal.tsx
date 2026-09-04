"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Sesion, Mesa } from "@/types";

interface DayDetailModalProps {
  fecha: string; // YYYY-MM-DD
  onClose: () => void;
}

export default function DayDetailModal({ fecha, onClose }: DayDetailModalProps) {
  const supabase = createClient();
  const [sesiones, setSesiones] = useState<(Sesion & { mesas: Mesa })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);

    supabase
      .from("sesiones")
      .select("*, mesas(*)")
      .eq("fecha", fecha)
      .eq("estado", "cobrada")
      .order("inicio", { ascending: true })
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) console.error("[VISTA MENSUAL] Error cargando detalle del día:", error.message);
        setSesiones((data as any) ?? []);
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [fecha, supabase]);

  const total = sesiones.reduce((acc, s) => acc + (s.monto ?? 0), 0);

  // Formateo legible de la fecha (YYYY-MM-DD -> DD/MM/YYYY) sin líos de huso horario
  const [anio, mes, dia] = fecha.split("-");
  const fechaLegible = `${dia}/${mes}/${anio}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
    >
      <div
        className="absolute inset-0 bg-felt-darker/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-panel border border-rail/50 rounded-2xl shadow-felt p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <h2 id="day-detail-title" className="font-display text-xl tracking-wide text-ink">
            {fechaLegible}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-ink-faint hover:text-ink hover:bg-felt-darker transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="font-display text-2xl text-cloth-light mb-4">
          {total.toFixed(0)} <span className="text-base">Bs</span>
        </p>

        <div className="overflow-y-auto -mx-1 px-1 space-y-2">
          {loading ? (
            <p className="text-ink-muted text-sm">Cargando...</p>
          ) : sesiones.length === 0 ? (
            <p className="text-ink-muted text-sm">No hubo cobros registrados ese día.</p>
          ) : (
            sesiones.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-felt-darker rounded-xl p-3 border border-rail/30"
              >
                <div>
                  <p className="font-semibold text-ink text-sm">{s.mesas?.nombre}</p>
                  <p className="text-xs text-ink-faint">
                    {new Date(s.inicio).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" — "}
                    {s.fin
                      ? new Date(s.fin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "-"}{" "}
                    ({s.minutos} min) · {s.modo === "bloque" ? "Bloque" : "Libre"}
                  </p>
                </div>
                <p className="font-display text-lg text-chalk">{s.monto} Bs</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
