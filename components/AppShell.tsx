"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-felt-darker border-b border-rail/50">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="p-2 -ml-2 rounded-lg text-ink hover:bg-panel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="font-display text-lg tracking-wide text-chalk">{title}</span>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto">
          <h1 className="hidden lg:block font-display text-3xl tracking-wide text-ink mb-6">
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}
