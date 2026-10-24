"use client";

import { useRef, useState } from "react";

export interface Series {
  name: string;
  color: string;
  values: (number | null)[]; // aligned with xLabels
}

interface Props {
  series: Series[];
  xLabels: string[];
  markers?: { at: number; label: string }[];
  format: (v: number) => string;
  height?: number;
}

const W = 720;
const PAD = { top: 16, right: 64, bottom: 28, left: 52 };

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0)!;
  const ticks = [];
  const top = Math.ceil(max / step) * step;
  for (let t = Math.floor(min / step) * step; t <= top + 1e-9; t += step) ticks.push(t);
  return ticks;
}

export default function LineChart({ series, xLabels, markers = [], format, height = 260 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = xLabels.length;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const ticks = niceTicks(Math.min(...all), Math.max(...all));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const x = (i: number) => PAD.left + (i / Math.max(1, n - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (height - PAD.top - PAD.bottom);

  const path = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
      .reduce<string[]>((acc, p, i) => {
        if (p) acc.push(`${acc.length === 0 || vals[i - 1] === null ? "M" : "L"}${p}`);
        return acc;
      }, [])
      .join(" ");

  function onMove(e: React.PointerEvent) {
    const rect = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (n - 1));
    setHover(i >= 0 && i < n && series.some((s) => s.values[i] !== null) ? i : null);
  }

  const lastIdx = (vals: (number | null)[]) => vals.reduce<number>((a, v, i) => (v === null ? a : i), -1);
  const xTickEvery = Math.max(1, Math.ceil(n / 8));

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${height}`}
        className="w-full h-auto touch-none select-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={series.map((s) => s.name).join(" vs ")}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e7e6e2" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-gray-500 text-[11px]">
              {format(t)}
            </text>
          </g>
        ))}
        {xLabels.map((l, i) =>
          i % xTickEvery === 0 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-gray-500 text-[11px]">
              {l}
            </text>
          ) : null,
        )}
        {markers.map((m, i) => (
          <g key={m.at}>
            <line x1={x(m.at)} x2={x(m.at)} y1={PAD.top} y2={height - PAD.bottom} stroke="#c3c2b7" strokeWidth={1} />
            <text x={x(m.at) + 4} y={PAD.top + 10 + (i % 2) * 13} className="fill-gray-500 text-[10px]">
              {m.label}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <path key={s.name} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) => {
          const li = lastIdx(s.values);
          if (li < 0) return null;
          return (
            <g key={s.name}>
              <circle cx={x(li)} cy={y(s.values[li]!)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
              <text x={x(li) + 8} y={y(s.values[li]!)} dominantBaseline="middle" className="fill-gray-700 text-[11px] font-medium">
                {format(s.values[li]!)}
              </text>
            </g>
          );
        })}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={height - PAD.bottom} stroke="#52514e" strokeWidth={1} />
            {series.map((s) =>
              s.values[hover] === null ? null : (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover]!)} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
              ),
            )}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="absolute top-0 pointer-events-none bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-xs"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: x(hover) > W / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
          }}
        >
          <p className="font-semibold text-gray-900 mb-1">{xLabels[hover]}</p>
          {series.map((s) =>
            s.values[hover] === null ? null : (
              <p key={s.name} className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
                <span className="inline-block w-2.5 h-0.5" style={{ background: s.color }} />
                {s.name}: <span className="text-gray-900 font-medium">{format(s.values[hover]!)}</span>
              </p>
            ),
          )}
        </div>
      )}
      {series.length > 1 && (
        <div className="flex gap-4 mt-2 text-xs text-gray-600">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
