import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import MesaCard from "@/components/MesaCard";
import type { Mesa } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: mesas } = await supabase
    .from("mesas")
    .select("*")
    .order("id");

  return (
    <div className="min-h-screen bg-slate-900">
      <Nav />
      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mesas</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(mesas as Mesa[] | null)?.map((mesa) => (
            <MesaCard key={mesa.id} mesa={mesa} />
          ))}
        </div>
      </main>
    </div>
  );
}
