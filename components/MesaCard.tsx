"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BLOQUES, calcularPrecioLibre, formatearTiempo } from "@/lib/pricing";
import type { Mesa, Sesion } from "@/types";
import ConfirmModal from "./ConfirmModal";

// Colores clásicos de bolas de billar 1-6, para el badge numerado de cada mesa
const COLOR_BOLA: Record<number, string> = {
  1: "#D4A24C", // amarillo/latón
  2: "#2653C7", // azul
  3: "#C7302B", // rojo
  4: "#5B2A86", // morado
  5: "#D4671E", // naranja
  6: "#1F7248", // verde
};

export default function MesaCard({ mesa }: { mesa: Mesa }) {
  const supabase = createClient();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [, setTick] = useState(0); // fuerza re-render cada segundo
  const [loading, setLoading] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [sobreVolada, setSobreVolada] = useState(false);
  const [moviendo, setMoviendo] = useState(false);
  const [guantes, setGuantes] = useState(mesa.contador_guantes ?? 0);
  const alarmPlayed = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cargarSesionActiva = useCallback(async () => {
    const { data } = await supabase
      .from("sesiones")
      .select("*")
      .eq("mesa_id", mesa.id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setSesion(data as Sesion | null);
    alarmPlayed.current = false;
  }, [mesa.id, supabase]);

  const cargarGuantes = useCallback(async () => {
    const { data } = await supabase
      .from("mesas")
      .select("contador_guantes")
      .eq("id", mesa.id)
      .single();
    if (data) setGuantes(data.contador_guantes);
  }, [mesa.id, supabase]);

  useEffect(() => {
    cargarSesionActiva();
    cargarGuantes();

    const channel = supabase
      .channel(`mesa-${mesa.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sesiones",
          // Sin filtro: cualquier cambio en sesiones (de cualquier mesa) nos
          // hace re-consultar la nuestra. Esto es necesario para el
          // arrastrar-y-soltar: si ESTA mesa pierde su sesión porque se movió
          // a otra mesa, Supabase solo notifica según el mesa_id NUEVO de la
          // fila, así que filtrar por nuestro propio id nos dejaría "ciegos"
          // ante ese cambio. Con 6 mesas, volver a consultar en cada cambio
          // es insignificante en costo.
        },
        () => cargarSesionActiva()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mesas",
          filter: `id=eq.${mesa.id}`,
        },
        () => cargarGuantes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mesa.id, cargarSesionActiva, cargarGuantes, supabase]);

  // Respaldo por sondeo: independientemente de si el realtime llega o no,
  // cada mesa se vuelve a consultar a sí misma sola cada 4s. Con 6 mesas
  // esto es una carga insignificante, y garantiza que un cambio de mesa_id
  // (mover/intercambiar) se refleje aunque el realtime falle o tarde.
  useEffect(() => {
    const poll = setInterval(() => {
      cargarSesionActiva();
      cargarGuantes();
    }, 4000);
    return () => clearInterval(poll);
  }, [cargarSesionActiva, cargarGuantes]);

  useEffect(() => {
    if (!sesion) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sesion]);

  useEffect(() => {
    audioRef.current = new Audio("/alarm.mp3");
    audioRef.current.loop = true;
  }, []);

  const detenerAlarma = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (!sesion) {
      detenerAlarma();
      alarmPlayed.current = false;
    }
  }, [sesion, detenerAlarma]);

  const inicioMs = sesion ? new Date(sesion.inicio).getTime() : 0;
  const elapsedSec = sesion ? Math.floor((Date.now() - inicioMs) / 1000) : 0;

  let restanteSec = 0;
  let precioActual = 0;
  let vencida = false;

  if (sesion?.modo === "bloque") {
    const totalSec = (sesion.minutos_asignados ?? 0) * 60;
    restanteSec = totalSec - elapsedSec;
    vencida = restanteSec <= 0;
    precioActual = sesion.monto ?? 0;

    if (vencida && !alarmPlayed.current) {
      alarmPlayed.current = true;
      audioRef.current?.play().catch(() => {});
    }
  } else if (sesion?.modo === "libre") {
    precioActual = calcularPrecioLibre(elapsedSec / 60);
  }

  async function iniciarBloque(minutos: number, precio: number) {
    setLoading(true);
    await supabase.from("sesiones").insert({
      mesa_id: mesa.id,
      modo: "bloque",
      minutos_asignados: minutos,
      monto: precio,
      estado: "activa",
    });
    setLoading(false);
    cargarSesionActiva();
  }

  async function iniciarLibre() {
    setLoading(true);
    await supabase.from("sesiones").insert({
      mesa_id: mesa.id,
      modo: "libre",
      estado: "activa",
    });
    setLoading(false);
    cargarSesionActiva();
  }

  async function agregarBloque(minutosExtra: number, precioExtra: number) {
    if (!sesion) return;
    setLoading(true);
    await supabase
      .from("sesiones")
      .update({
        minutos_asignados: (sesion.minutos_asignados ?? 0) + minutosExtra,
        monto: (sesion.monto ?? 0) + precioExtra,
      })
      .eq("id", sesion.id);
    setLoading(false);
    cargarSesionActiva();
  }

  async function cobrar() {
    if (!sesion) return;
    setLoading(true);

    const minutosFinales =
      sesion.modo === "bloque"
        ? sesion.minutos_asignados ?? 0
        : Math.ceil(elapsedSec / 60);

    const montoFinal =
      sesion.modo === "bloque" ? sesion.monto ?? 0 : precioActual;

    await supabase
      .from("sesiones")
      .update({
        estado: "cobrada",
        fin: new Date().toISOString(),
        minutos: minutosFinales,
        monto: montoFinal,
      })
      .eq("id", sesion.id);

    detenerAlarma();
    setLoading(false);
    setSesion(null);
  }

  function cancelar() {
    if (!sesion) return;
    setConfirmandoCancelar(true);
  }

  async function confirmarCancelar() {
    if (!sesion) return;
    setConfirmandoCancelar(false);
    setLoading(true);
    await supabase
      .from("sesiones")
      .update({ estado: "cancelada", fin: new Date().toISOString() })
      .eq("id", sesion.id);
    detenerAlarma();
    setLoading(false);
    setSesion(null);
  }

  async function moverOintercambiar(mesaOrigenId: number) {
    if (mesaOrigenId === mesa.id) return;
    setMoviendo(true);

    // Toda la lógica (mover o intercambiar) ahora vive en una función de
    // base de datos (RPC) que corre en una sola transacción atómica —
    // ver fix_swap_and_realtime.sql. Esto evita estados a medias si algo
    // se interrumpe entre pasos.
    const { error } = await supabase.rpc("intercambiar_mesas", {
      origen_id: mesaOrigenId,
      destino_id: mesa.id,
    });

    if (error) {
      console.error("Error al mover/intercambiar mesa:", error.message);
    }

    setMoviendo(false);
    cargarSesionActiva();
  }

  function handleDragStart(e: React.DragEvent) {
    if (!sesion) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", String(mesa.id));
    e.dataTransfer.effectAllowed = "move";
    setArrastrando(true);
  }

  function handleDragEnd() {
    setArrastrando(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setSobreVolada(true);
  }

  function handleDragLeave() {
    setSobreVolada(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setSobreVolada(false);
    const origenId = Number(e.dataTransfer.getData("text/plain"));
    if (!origenId || Number.isNaN(origenId)) return;
    moverOintercambiar(origenId);
  }

  async function incrementarGuantes() {
    const nuevo = guantes + 1;
    setGuantes(nuevo); // optimista
    await supabase
      .from("mesas")
      .update({ contador_guantes: nuevo })
      .eq("id", mesa.id);
  }

  async function decrementarGuantes() {
    const nuevo = Math.max(0, guantes - 1);
    setGuantes(nuevo); // optimista
    await supabase
      .from("mesas")
      .update({ contador_guantes: nuevo })
      .eq("id", mesa.id);
  }

  const colorBola = COLOR_BOLA[mesa.id] ?? "#2F9E63";
  const numero = mesa.nombre.replace(/\D/g, "") || String(mesa.id);

  return (
    <>
    <div
      draggable={Boolean(sesion) && !moviendo}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-2xl p-5 pt-6 border shadow-felt transition ${
        sesion ? "cursor-grab active:cursor-grabbing" : ""
      } ${arrastrando ? "opacity-40" : ""} ${
        sobreVolada
          ? "border-chalk ring-2 ring-chalk/60 scale-[1.02]"
          : vencida
          ? "bg-alarm-dark/20 border-alarm animate-pulse"
          : sesion
          ? "bg-panel-light border-cloth/50"
          : "bg-panel border-rail/40"
      }`}
    >
      {moviendo && (
        <div className="absolute inset-0 rounded-2xl bg-felt-darker/60 flex items-center justify-center z-10">
          <span className="text-ink-muted text-sm">Moviendo...</span>
        </div>
      )}

      {/* Badge de bola numerada */}
      <div
        className="absolute -top-4 left-5 w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm shadow-lg ring-2 ring-felt-darker"
        style={{
          background:
            numero === "8"
              ? "#1a1a1a"
              : `radial-gradient(circle at 35% 30%, #fff 0%, #fff 22%, ${colorBola} 23%, ${colorBola} 100%)`,
          color: "#fff",
        }}
      >
        <span className="bg-white text-felt-darker rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {numero}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3 pl-1">
        <h2 className="font-display text-lg tracking-wide">
          {mesa.nombre.toUpperCase()}
        </h2>
        {sesion && !moviendo && (
          <span className="flex items-center gap-1 text-ink-faint text-[10px] uppercase tracking-wider select-none">
            <GripIcon className="w-3.5 h-3.5" />
            arrastra para mover
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <span className="flex items-center gap-1.5 text-ink-muted text-xs uppercase tracking-wider">
          <GloveIcon className="w-4 h-4" />
          Guantes
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={decrementarGuantes}
            disabled={guantes === 0}
            aria-label="Bajar guantes"
            className="w-7 h-7 rounded-lg bg-felt-darker border border-rail/50 text-ink-muted hover:text-ink hover:border-chalk/50 flex items-center justify-center transition disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="font-mono font-bold text-lg text-chalk w-6 text-center tabular-nums">
            {guantes}
          </span>
          <button
            onClick={incrementarGuantes}
            aria-label="Subir guantes"
            className="w-7 h-7 rounded-lg bg-felt-darker border border-rail/50 text-ink-muted hover:text-ink hover:border-chalk/50 flex items-center justify-center transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {!sesion && (
        <div className="space-y-2">
          <p className="text-ink-faint text-xs uppercase tracking-wider mb-2">
            Iniciar tiempo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BLOQUES.map((b) => (
              <button
                key={b.minutos}
                disabled={loading}
                onClick={() => iniciarBloque(b.minutos, b.precio)}
                className="py-2 rounded-lg bg-cloth-dark hover:bg-cloth text-ink text-sm font-semibold transition disabled:opacity-50"
              >
                {b.etiqueta}
                <br />
                <span className="text-xs font-normal opacity-90">{b.precio} Bs</span>
              </button>
            ))}
          </div>
          <button
            disabled={loading}
            onClick={iniciarLibre}
            className="w-full py-2 rounded-lg border border-chalk/50 text-chalk hover:bg-chalk hover:text-felt-darker text-sm font-semibold transition disabled:opacity-50"
          >
            ▶ Tiempo libre
          </button>
        </div>
      )}

      {sesion?.modo === "bloque" && (
        <div>
          <div className="text-center mb-3">
            <p
              className={`font-mono text-4xl font-bold tabular-nums ${
                vencida ? "text-alarm" : "text-ink"
              }`}
            >
              {formatearTiempo(Math.max(restanteSec, 0))}
            </p>
            <p className="text-xs uppercase tracking-wider text-ink-faint">
              {vencida ? "⏰ Tiempo terminado" : "restante"}
            </p>
            <p className="text-chalk font-display text-xl mt-1">
              {precioActual} Bs
            </p>
          </div>

          {!vencida && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {BLOQUES.map((b) => (
                <button
                  key={b.minutos}
                  disabled={loading}
                  onClick={() => agregarBloque(b.minutos, b.precio)}
                  className="py-1.5 rounded-lg bg-felt-dark hover:bg-cloth-dark text-ink-muted hover:text-ink text-xs transition disabled:opacity-50"
                >
                  +{b.etiqueta}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={cobrar}
              className="flex-1 py-2 rounded-lg bg-cloth hover:bg-cloth-light text-felt-darker font-bold transition disabled:opacity-50"
            >
              Cobrar {precioActual} Bs
            </button>
            <button
              disabled={loading}
              onClick={cancelar}
              className="px-3 py-2 rounded-lg border border-rail text-ink-muted hover:border-alarm hover:text-alarm text-sm transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {sesion?.modo === "libre" && (
        <div>
          <div className="text-center mb-3">
            <p className="font-mono text-4xl font-bold tabular-nums text-ink">
              {formatearTiempo(elapsedSec)}
            </p>
            <p className="text-xs uppercase tracking-wider text-ink-faint">
              tiempo libre
            </p>
            <p className="text-chalk font-display text-xl mt-1">
              {precioActual} Bs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={cobrar}
              className="flex-1 py-2 rounded-lg bg-cloth hover:bg-cloth-light text-felt-darker font-bold transition disabled:opacity-50"
            >
              Cortar y cobrar {precioActual} Bs
            </button>
            <button
              disabled={loading}
              onClick={cancelar}
              className="px-3 py-2 rounded-lg border border-rail text-ink-muted hover:border-alarm hover:text-alarm text-sm transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>

      <ConfirmModal
        open={confirmandoCancelar}
        title="Cancelar mesa"
        message={`¿Seguro que quieres cancelar ${mesa.nombre} sin cobrar? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={confirmarCancelar}
        onCancel={() => setConfirmandoCancelar(false)}
      />
    </>
  );
}

function GripIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="8" cy="6" r="1.6" />
      <circle cx="8" cy="12" r="1.6" />
      <circle cx="8" cy="18" r="1.6" />
      <circle cx="16" cy="6" r="1.6" />
      <circle cx="16" cy="12" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </svg>
  );
}

function GloveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V5a1.5 1.5 0 0 1 3 0v5M13 10V6a1.5 1.5 0 0 1 3 0v5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 9.5a1.5 1.5 0 0 1 3 0V14a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-2.5a1.5 1.5 0 0 1 3-.3" />
    </svg>
  );
}
