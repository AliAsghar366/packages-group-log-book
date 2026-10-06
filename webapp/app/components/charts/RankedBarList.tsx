import { sequentialShade, INK } from "@/app/lib/palette";

export type RankedBarDatum = { name: string; value: number; secondaryText?: string };

export default function RankedBarList({
  data,
  formatValue,
}: {
  data: RankedBarDatum[];
  formatValue: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const pct = Math.max((d.value / max) * 100, 3);
        return (
          <div key={d.name} className="flex items-center gap-3">
            <div
              className="w-36 shrink-0 text-sm leading-tight"
              style={{ color: INK.secondary }}
            >
              {d.name}
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-black/5 dark:bg-white/10">
              <div
                className="flex h-full items-center justify-end rounded-md pr-2 transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: sequentialShade(i, data.length),
                }}
              >
                <span className="text-xs font-medium whitespace-nowrap text-white drop-shadow-sm">
                  {formatValue(d.value)}
                </span>
              </div>
            </div>
            {d.secondaryText && (
              <div className="w-20 shrink-0 text-right text-xs" style={{ color: INK.muted }}>
                {d.secondaryText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}