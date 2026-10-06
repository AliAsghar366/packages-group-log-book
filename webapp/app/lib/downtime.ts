import type { LogEntry } from "@/app/generated/prisma/client";

/**
 * Equipment/process entries don't store minutes directly -- they're derived
 * from the lifecycle timestamps so the number always matches the recorded
 * start/temp-fixed/resolved times instead of being typed in separately.
 */
export function equipmentDowntimeMinutes(
  entry: Pick<LogEntry, "startTime" | "tempFixedTime" | "resolvedTime">
): number | null {
  if (!entry.startTime) return null;
  const end = entry.resolvedTime ?? entry.tempFixedTime;
  if (!end) return null;
  const minutes = (end.getTime() - entry.startTime.getTime()) / 60000;
  return minutes >= 0 ? minutes : null;
}

export function entryDowntimeMinutes(
  entry: Pick<
    LogEntry,
    "category" | "downtimeMinutes" | "startTime" | "tempFixedTime" | "resolvedTime"
  >
): number | null {
  if (entry.category === "PAPER_QUALITY") return entry.downtimeMinutes ?? null;
  // Live-logged breakdowns derive minutes from timestamps; historical
  // monthly-rollup imports only have a total figure and no clock times,
  // so fall back to the stored value when timestamps aren't present.
  return equipmentDowntimeMinutes(entry) ?? entry.downtimeMinutes ?? null;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}