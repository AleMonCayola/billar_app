import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { calcularStats } from "@/lib/analytics";
import { GraficoHoras, GraficoDiasSemana, GraficoTendencia } from "@/components/InicioCharts";
import type { Mesa, Sesion } from "@/types";

export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  sub,
  accent = "cloth",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "cloth" | "chalk";
}) {
  return (
    <div className="bg-panel rounded-2xl p-5 border border-rail/40 shadow-felt">
      <p className="text-ink-faint text-xs uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`font-display text-3xl ${accent === "chalk" ? "text-chalk" : "text-cloth-light"}`}>
        {value}
      </p>
      {sub && <p className="text-ink-muted text-sm mt-1">{sub}</p>}
    </div>
  );
}

export default async function InicioPage() {
  const supabase = createClient();

  const { data: mesasData } = await supabase.from("mesas").select("*");
  const mesas = (mesasData as Mesa[] | null) ?? [];

  const { data: sesionesData } = await supabase
    .from("sesiones")
    .select("fecha, inicio, monto")
    .eq("estado", "cobrada");

  const sesiones = (sesionesData as Pick<Sesion, "fecha" | "inicio" | "monto">[] | null) ?? [];

  const stats = calcularStats(sesiones, mesas);

  return (
    <AppShell title="Inicio">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total histórico"
          value={`${stats.totalHistorico.toFixed(0)} Bs`}
        />
        <StatCard
          label="Promedio por día"
          value={`${stats.promedioDiario.toFixed(0)} Bs`}
          sub={`${stats.diasConVentas} días con ventas`}
        />
        <StatCard
          label="Mejor mes"
          value={stats.mejorMes ? `${stats.mejorMes.total.toFixed(0)} Bs` : "—"}
          sub={stats.mejorMes?.label}
          accent="chalk"
        />
        <StatCard
          label="Mesa estrella"
          value={stats.mesaEstrella ? stats.mesaEstrella.nombre.toUpperCase() : "—"}
          sub={stats.mesaEstrella ? `${stats.mesaEstrella.total.toFixed(0)} Bs históricos` : undefined}
          accent="chalk"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-panel rounded-2xl p-5 border border-rail/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg tracking-wide text-ink">Hora pico</h2>
            {stats.horaPico && (
              <span className="text-chalk font-semibold text-sm">{stats.horaPico}</span>
            )}
          </div>
          <p className="text-ink-faint text-xs mb-2">Cantidad de cobros por hora del día</p>
          <GraficoHoras data={stats.porHora} horaPico={stats.horaPico} />
        </div>

        <div className="bg-panel rounded-2xl p-5 border border-rail/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg tracking-wide text-ink">Día pico</h2>
            {stats.diaPico && (
              <span className="text-chalk font-semibold text-sm">{stats.diaPico}</span>
            )}
          </div>
          <p className="text-ink-faint text-xs mb-2">Bs cobrados por día de la semana</p>
          <GraficoDiasSemana data={stats.porDiaSemana} diaPico={stats.diaPico} />
        </div>
      </div>

      <div className="bg-panel rounded-2xl p-5 border border-rail/40">
        <h2 className="font-display text-lg tracking-wide text-ink mb-1">
          Tendencia
        </h2>
        <p className="text-ink-faint text-xs mb-2">Total cobrado por día</p>
        <GraficoTendencia data={stats.ultimosDias} />
      </div>
    </AppShell>
  );
}
