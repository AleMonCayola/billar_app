import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import MesaCard from "@/components/MesaCard";
import type { Mesa } from "@/types";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  const supabase = createClient();
  const { data: mesasData } = await supabase
    .from("mesas")
    .select("*")
    .order("id");

  const mesas = (mesasData as Mesa[] | null) ?? [];

  // Orden solicitado: fila 1 = mesas 1,3,5 — fila 2 = mesas 2,4,6
  const porId = new Map(mesas.map((m) => [m.id, m]));
  const orden = [1, 3, 5, 2, 4, 6];
  const mesasOrdenadas = orden
    .map((id) => porId.get(id))
    .filter((m): m is Mesa => Boolean(m));

  return (
    <AppShell title="Mesas">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mesasOrdenadas.map((mesa) => (
          <MesaCard key={mesa.id} mesa={mesa} />
        ))}
      </div>
    </AppShell>
  );
}
