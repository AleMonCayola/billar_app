import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import type { Mesa } from "@/types";

export const dynamic = "force-dynamic";

const COLOR_BOLA: Record<number, string> = {
  1: "#D4A24C",
  2: "#2653C7",
  3: "#C7302B",
  4: "#5B2A86",
  5: "#D4671E",
  6: "#1F7248",
};

export default async function HistorialPage() {
  const supabase = createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .order("historico_total", { ascending: false });

  const lista = (mesas as Mesa[] | null) ?? [];
  const totalGeneral = lista.reduce((acc, m) => acc + m.historico_total, 0);
  const maxTotal = Math.max(...lista.map((m) => m.historico_total), 1);

 return (
  <AppShell title="Historial mesa">
    <div className="mb-6 p-5 rounded-xl bg-cloth/10 border border-cloth/40 flex justify-between items-center">
      <span className="font-semibold text-ink">TOTAL GENERAL HISTÓRICO</span>
      <span className="font-display text-2xl text-cloth-light">
        {totalGeneral.toFixed(2)} Bs
      </span>
    </div>

    <div className="space-y-3">
      {lista.map((mesa, i) => (
        <div
          key={mesa.id}
          className="bg-panel rounded-xl p-4 border border-rail/40"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="font-display text-ink-faint w-6">
                #{i + 1}
              </span>
              <span className="font-semibold text-ink">{mesa.nombre}</span>
            </div>
            <span className="font-display text-xl text-chalk">
              {mesa.historico_total.toFixed(2)} Bs
            </span>
          </div>
          <div className="h-2 rounded-full bg-felt-darker overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(mesa.historico_total / maxTotal) * 100}%`,
                backgroundColor: COLOR_BOLA[mesa.id] ?? "#2F9E63",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  </AppShell>
);
}
