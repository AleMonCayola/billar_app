"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-panel rounded-2xl p-8 shadow-felt border border-rail/40"
      >
        <div className="text-center mb-6">
          <p className="font-display text-3xl tracking-wide text-chalk leading-none">
            BILLAR
          </p>
          <p className="font-display text-sm tracking-[0.35em] text-ink-muted">
            ALEMANIA
          </p>
        </div>

        <label className="block text-sm mb-1 text-ink-muted">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg bg-felt-darker border border-rail/60 text-ink focus:outline-none focus:border-cloth"
          placeholder="tucorreo@ejemplo.com"
        />

        <label className="block text-sm mb-1 text-ink-muted">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg bg-felt-darker border border-rail/60 text-ink focus:outline-none focus:border-cloth"
          placeholder="••••••••"
        />

        {error && (
          <p className="text-alarm text-sm mb-4 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-cloth hover:bg-cloth-light text-felt-darker font-bold transition disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
