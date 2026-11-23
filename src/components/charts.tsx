"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";

const AXIS = { fontSize: 11, fill: "var(--muted)" };
const fmtT = (v: number | null | undefined) =>
  v == null ? "–" : `${v > 0 ? "+" : ""}${Math.round(v * 10) / 10}°`;

function TipBox({ title, rows }: { title: ReactNode; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-ink">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 text-ink-2">
          <span className="flex items-center gap-1.5">
            {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="tabular font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Harorat (maks/min) ----------------------------- */

export type TempPoint = {
  key: string;      // X o'qi kaliti (sana yoki oy)
  label: string;    // o'qdagi qisqa yozuv
  title: string;    // tooltip sarlavhasi
  max: number | null;
  min: number | null;
  rain?: number | null;
};

export function TempChart({
  data,
  todayKey,
  forecastFromKey,
  height = 260,
}: {
  data: TempPoint[];
  todayKey?: string;
  forecastFromKey?: string;
  height?: number;
}) {
  const last = data.length - 1;
  const endLabel = (name: string) =>
    function EndLabel(props: { x?: number | string; y?: number | string; index?: number }) {
      if (props.index !== last || props.x == null || props.y == null) return null;
      return (
        <text x={Number(props.x) + 6} y={Number(props.y)} dy={4} fontSize={11} fill="var(--ink-2)">
          {name}
        </text>
      );
    };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 40, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="key" tickFormatter={(k) => data.find((d) => d.key === k)?.label ?? k}
            tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={16} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} width={44} />
          {forecastFromKey && (
            <ReferenceArea x1={forecastFromKey} x2={data[last]?.key} fill="var(--surface-2)" fillOpacity={0.8}
              label={{ value: "Prognoz", position: "insideTopRight", fontSize: 11, fill: "var(--muted)" }} />
          )}
          {todayKey && (
            <ReferenceLine x={todayKey} stroke="var(--muted)" strokeDasharray="3 3"
              label={{ value: "Bugun", position: "insideTopLeft", fontSize: 11, fill: "var(--muted)" }} />
          )}
          <Tooltip
            cursor={{ stroke: "var(--muted)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload as TempPoint | undefined;
              if (!p) return null;
              const rows = [
                { label: "Maks", value: fmtT(p.max), color: "var(--s-max)" },
                { label: "Min", value: fmtT(p.min), color: "var(--s-min)" },
              ];
              if (p.rain != null) rows.push({ label: "Yog'in", value: `${p.rain.toFixed(1)} mm`, color: "var(--s-rain)" });
              return <TipBox title={p.title} rows={rows} />;
            }}
          />
          <Line isAnimationActive={false} type="monotone" dataKey="max" name="Maks" stroke="var(--s-max)" strokeWidth={2} dot={false}
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }} label={endLabel("Maks")} connectNulls />
          <Line isAnimationActive={false} type="monotone" dataKey="min" name="Min" stroke="var(--s-min)" strokeWidth={2} dot={false}
            activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }} label={endLabel("Min")} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* --------------------------------- Yog'in --------------------------------- */

export function RainChart({
  data,
  todayKey,
  height = 140,
}: {
  data: TempPoint[];
  todayKey?: string;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 40, bottom: 0, left: -12 }} barCategoryGap={2}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="key" tickFormatter={(k) => data.find((d) => d.key === k)?.label ?? k}
            tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={16} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${v}`} />
          {todayKey && <ReferenceLine x={todayKey} stroke="var(--muted)" strokeDasharray="3 3" />}
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload as TempPoint | undefined;
              if (!p) return null;
              return <TipBox title={p.title} rows={[{ label: "Yog'in", value: `${(p.rain ?? 0).toFixed(1)} mm`, color: "var(--s-rain)" }]} />;
            }}
          />
          <Bar isAnimationActive={false} dataKey="rain" fill="var(--s-rain)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ----------------------- Bitta seriyali gorizontal ustunlar ----------------------- */

export function CategoryBars({
  data,
  unit,
  color,
  valueLabel,
  digits = 1,
}: {
  data: { name: string; value: number }[];
  unit: string;
  color: string;
  valueLabel: string;
  digits?: number;
}) {
  const fmt = (v: number) => `${v.toFixed(digits)}${unit}`;
  return (
    <div style={{ height: Math.max(160, data.length * 26 + 24) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }} barCategoryGap={4}>
          <CartesianGrid stroke="var(--grid)" horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}${unit}`} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: "var(--ink-2)" }} tickLine={false}
            axisLine={{ stroke: "var(--line)" }} width={118} interval={0} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload as { name: string; value: number } | undefined;
              if (!p) return null;
              return <TipBox title={p.name} rows={[{ label: valueLabel, value: fmt(p.value), color }]} />;
            }}
          />
          <Bar isAnimationActive={false} dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={16}
            label={{ position: "right", fontSize: 11, fill: "var(--ink-2)", formatter: (v: unknown) => fmt(Number(v)) }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
