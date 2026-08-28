"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import ConfirmModal from "@/components/ConfirmModal";
import type { Sesion, Mesa, CierreCaja } from "@/types";

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CajaPage() {
  const supabase = createClient();
  const [sesiones, setSesiones] = useState<(Sesion & { mesas: Mesa })[]>([]);
  const [cierre, setCierre] = useState<CierreCaja | null>(null);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const fecha = hoyISO();

    const { data: sesionesData } = await supabase
      .from("sesiones")
      .select("*, mesas(*)")
      .eq("fecha", fecha)
      .eq("estado", "cobrada")
      .order("fin", { ascending: false });

    const { data: cierreData } = await supabase
      .from("cierres_caja")
      .select("*")
      .eq("fecha", fecha)
      .maybeSingle();

    setSesiones((sesionesData as any) ?? []);
    setCierre(cierreData as CierreCaja | null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const total = sesiones.reduce((acc, s) => acc + (s.monto ?? 0), 0);

  function cerrarCaja() {
    setConfirmandoCierre(true);
  }

  async function confirmarCierreCaja() {
    setConfirmandoCierre(false);
    setCerrando(true);
    const fecha = hoyISO();

    if (cierre) {
      await supabase
        .from("cierres_caja")
        .update({
          total,
          cantidad_cobros: sesiones.length,
          closed_at: new Date().toISOString(),
        })
        .eq("id", cierre.id);
    } else {
      await supabase.from("cierres_caja").insert({
        fecha,
        total,
        cantidad_cobros: sesiones.length,
      });
    }

    setCerrando(false);
    cargar();
  }

  return (
    <AppShell title="Caja diaria">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={cerrarCaja}
          disabled={cerrando || sesiones.length === 0}
          className="px-4 py-2.5 rounded-lg bg-alarm hover:bg-alarm-dark text-white font-bold transition disabled:opacity-40"
        >
          {cierre ? "Actualizar cierre" : "Cerrar caja"}
        </button>
      </div>

      {cierre && (
        <div className="mb-4 p-3 rounded-lg bg-chalk/10 border border-chalk/40 text-chalk text-sm">
          Caja ya cerrada hoy a las{" "}
          {new Date(cierre.closed_at).toLocaleTimeString()} — Total:{" "}
          {cierre.total} Bs ({cierre.cantidad_cobros} cobros)
        </div>
      )}

      <div className="bg-panel rounded-2xl p-6 border border-rail/40 mb-5 shadow-felt">
        <p className="text-ink-faint text-xs uppercase tracking-wider">
          Total del día
        </p>
        <p className="font-display text-5xl text-cloth-light mt-1">
          {total} <span className="text-2xl">Bs</span>
        </p>
        <p className="text-ink-muted text-sm mt-1">
          {sesiones.length} cobro{sesiones.length !== 1 && "s"}
        </p>
      </div>

      {loading ? (
        <p className="text-ink-muted">Cargando...</p>
      ) : sesiones.length === 0 ? (
        <p className="text-ink-muted">Aún no hay cobros registrados hoy.</p>
      ) : (
        <div className="space-y-2">
          {sesiones.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between bg-panel rounded-xl p-4 border border-rail/40"
            >
              <div>
                <p className="font-semibold text-ink">{s.mesas?.nombre}</p>
                <p className="text-xs text-ink-faint">
                  {new Date(s.inicio).toLocaleTimeString()} —{" "}
                  {s.fin ? new Date(s.fin).toLocaleTimeString() : "-"} (
                  {s.minutos} min) ·{" "}
                  {s.modo === "bloque" ? "Bloque" : "Libre"}
                </p>
              </div>
              <p className="font-display text-xl text-chalk">{s.monto} Bs</p>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmandoCierre}
        title={cierre ? "Actualizar cierre de caja" : "Cerrar caja del día"}
        message={`El total registrado es de ${total} Bs con ${sesiones.length} cobro${sesiones.length !== 1 ? "s" : ""}. Esto ${cierre ? "actualizará" : "archivará"} el cierre de hoy.`}
        confirmLabel={cierre ? "Actualizar" : "Cerrar caja"}
        cancelLabel="Volver"
        onConfirm={confirmarCierreCaja}
        onCancel={() => setConfirmandoCierre(false)}
      />
    </AppShell>
  );
}
