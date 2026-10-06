"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { sequentialShade, GRID_LINE, INK } from "@/app/lib/palette";
import { formatMinutes } from "@/app/lib/downtime";

export type DefectPoint = { issueType: string; minutes: number };

export default function DefectTypeChart({ data }: { data: DefectPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 56, left: 0, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="issueType"
          width={160}
          tick={{ fontSize: 12, fill: INK.secondary }}
          axisLine={{ stroke: GRID_LINE }}
          tickLine={false}
        />
        <Bar dataKey="minutes" maxBarSize={22} radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={d.issueType} fill={sequentialShade(i, data.length)} />
          ))}
          <LabelList
            dataKey="minutes"
            position="right"
            formatter={(v: unknown) => formatMinutes(typeof v === "number" ? v : null)}
            style={{ fill: INK.primary, fontSize: 12, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}