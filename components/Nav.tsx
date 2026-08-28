"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Mesas" },
  { href: "/caja", label: "Caja diaria" },
  { href: "/historial", label: "Historial mesa" },
  { href: "/mensual", label: "Vista mensual" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center gap-2">
      <span className="font-bold mr-4">🎱 Billar</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${
            pathname === l.href
              ? "bg-emerald-600 text-white"
              : "text-slate-300 hover:bg-slate-700"
          }`}
        >
          {l.label}
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="ml-auto px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
