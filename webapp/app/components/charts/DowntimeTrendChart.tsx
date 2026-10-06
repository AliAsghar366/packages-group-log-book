"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_COLOR, GRID_LINE, INK } from "@/app/lib/palette";
import { formatMinutes } from "@/app/lib/downtime";

export type TrendPoint = {
  month: string;
  paperQuality: number;
  equipmentProcess: number;
};

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur-xl"
      style={{ backgroundColor: "var(--background)", borderColor: "rgba(128,128,128,0.25)" }}
    >
      <div className="mb-1 font-medium" style={{ color: INK.primary }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2" style={{ color: INK.secondary }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: {formatMinutes(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function DowntimeTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={GRID_LINE} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: INK.muted }}
          axisLine={{ stroke: GRID_LINE }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: INK.muted }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(11,11,11,0.04)" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: INK.secondary }}
        />
        <Bar
          dataKey="paperQuality"
          name="Paper Quality"
          fill={CATEGORY_COLOR.PAPER_QUALITY}
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="equipmentProcess"
          name="Equipment/Process"
          fill={CATEGORY_COLOR.EQUIPMENT_PROCESS}
          maxBarSize={24}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}