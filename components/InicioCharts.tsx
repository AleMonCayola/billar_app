"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import type { StatsNegocio } from "@/lib/analytics";

const gridColor = "#2A4D3D";
const textColor = "#9FB3AA";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#173B2C",
      border: "1px solid #2A4D3D",
      borderRadius: 8,
      color: "#F3EFE4",
      fontSize: 13,
    },
    labelStyle: { color: "#D4A24C" },
    cursor: { fill: "rgba(212,162,76,0.08)" },
  };
}

export function GraficoHoras({ data, horaPico }: { data: StatsNegocio["porHora"]; horaPico: string | null }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis dataKey="hora" tick={{ fill: textColor, fontSize: 11 }} interval={2} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} cobros`, ""]} />
        <Bar dataKey="cobros" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.hora === horaPico ? "#D4A24C" : "#2F9E63"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoDiasSemana({ data, diaPico }: { data: StatsNegocio["porDiaSemana"]; diaPico: string | null }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis dataKey="dia" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} Bs`, ""]} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={diaPico?.slice(0, 3) === d.dia ? "#D4A24C" : "#2F9E63"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoTendencia({ data }: { data: StatsNegocio["ultimosDias"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={gridColor} />
        <XAxis dataKey="fecha" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} Bs`, ""]} />
        <Bar dataKey="total" fill="#3FBE79" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
