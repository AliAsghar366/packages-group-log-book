"use client";

import { useState } from "react";
import { sequentialShade, INK } from "@/app/lib/palette";

export type HeatmapData = {
  vendors: string[];
  months: string[];
  // minutes[vendorIndex][monthIndex]
  minutes: number[][];
};

export default function VendorHeatmap({ data }: { data: HeatmapData }) {
  const [hover, setHover] = useState<{ v: number; m: number } | null>(null);
  const { vendors, months, minutes } = data;

  const flat = minutes.flat().filter((v) => v > 0);
  const max = Math.max(...flat, 1);
  // Rank cells into 5 buckets for the sequential ramp (equal-width bands over sqrt to spread low values)
  const bandOf = (v: number) => {
    if (v <= 0) return -1;
    const t = Math.sqrt(v / max);
    return Math.min(4, Math.floor(t * 5));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate" style={{ borderSpacing: 4 }}>
        <thead>
          <tr>
            <th className="w-32" />
            {months.map((m) => (
              <th
                key={m}
                className="pb-1 text-center text-xs font-normal"
                style={{ color: INK.muted }}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, vi) => (
            <tr key={vendor}>
              <td
                className="pr-2 text-right text-xs"
                style={{ color: INK.secondary }}
              >
                {vendor}
              </td>
              {months.map((_, mi) => {
                const val = minutes[vi][mi] ?? 0;
                const band = bandOf(val);
                const isHover = hover?.v === vi && hover?.m === mi;
                return (
                  <td key={mi} className="p-0">
                    <div
                      role="img"
                      aria-label={`${vendor}, ${months[mi]}: ${Math.round(val)} minutes`}
                      onMouseEnter={() => setHover({ v: vi, m: mi })}
                      onMouseLeave={() => setHover(null)}
                      className="relative flex h-8 w-14 items-center justify-center rounded-md text-[11px] font-medium transition-transform"
                      style={{
                        backgroundColor:
                          band === -1 ? "rgba(0,0,0,0.04)" : sequentialShade(4 - band, 5),
                        color: band >= 2 ? "#fff" : INK.primary,
                        transform: isHover ? "scale(1.08)" : undefined,
                        boxShadow: isHover ? "0 0 0 2px rgba(11,11,11,0.25)" : undefined,
                      }}
                    >
                      {val > 0 ? Math.round(val) : ""}
                      {isHover && val > 0 && (
                        <div
                          className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-lg"
                          style={{ backgroundColor: INK.primary, color: "#fff" }}
                        >
                          {vendor} · {months[mi]}: {Math.round(val)}m
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}