import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { entryDowntimeMinutes, formatMinutes } from "@/app/lib/downtime";
import { monthKey, monthLabel, sameMonth } from "@/app/lib/aggregate";
import { Card, Meter, ResolveToggleButton, StatCard, StatusBadge } from "@/app/components/ui";
import { INK } from "@/app/lib/palette";
import DowntimeTrendChart, {
  type TrendPoint,
} from "@/app/components/charts/DowntimeTrendChart";
import DefectTypeChart, {
  type DefectPoint,
} from "@/app/components/charts/DefectTypeChart";
import RankedBarList from "@/app/components/charts/RankedBarList";
import VendorHeatmap from "@/app/components/charts/VendorHeatmap";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const entries = await prisma.logEntry.findMany({
    include: { vendor: true, machine: true },
    orderBy: { date: "asc" },
  });

  const now = new Date();
  const totalMinutesAllTime = entries.reduce(
    (sum, e) => sum + (entryDowntimeMinutes(e) ?? 0),
    0
  );
  const totalMinutesThisMonth = entries
    .filter((e) => sameMonth(e.date, now))
    .reduce((sum, e) => sum + (entryDowntimeMinutes(e) ?? 0), 0);

  // Monthly trend, split by category
  const trendMap = new Map<string, TrendPoint>();
  for (const e of entries) {
    const key = monthKey(e.date);
    const point =
      trendMap.get(key) ??
      ({ month: monthLabel(key), paperQuality: 0, equipmentProcess: 0 } as TrendPoint);
    const minutes = entryDowntimeMinutes(e) ?? 0;
    if (e.category === "PAPER_QUALITY") point.paperQuality += minutes;
    else point.equipmentProcess += minutes;
    trendMap.set(key, point);
  }
  const trendKeysSorted = [...trendMap.keys()].sort();
  const trend = trendKeysSorted.map((k) => trendMap.get(k)!);
  const monthlyTotals = trendKeysSorted.map(
    (k) => trendMap.get(k)!.paperQuality + trendMap.get(k)!.equipmentProcess
  );
  const lastTwo = monthlyTotals.slice(-2);
  const momDelta =
    lastTwo.length === 2 && lastTwo[0] > 0
      ? ((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100
      : undefined;

  // Defect type breakdown (paper quality only)
  const defectMap = new Map<string, number>();
  for (const e of entries) {
    if (e.category !== "PAPER_QUALITY" || !e.issueType) continue;
    defectMap.set(
      e.issueType,
      (defectMap.get(e.issueType) ?? 0) + (e.downtimeMinutes ?? 0)
    );
  }
  const defectData: DefectPoint[] = [...defectMap.entries()]
    .map(([issueType, minutes]) => ({ issueType, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);
  const topCause = defectData[0];

  // Vendor ranking + vendor x month matrix (for the heatmap)
  const vendorMap = new Map<string, { name: string; minutes: number; stops: number }>();
  const vendorMonthMap = new Map<string, Map<string, number>>();
  for (const e of entries) {
    if (e.category !== "PAPER_QUALITY" || !e.vendor) continue;
    const cur = vendorMap.get(e.vendor.id) ?? {
      name: e.vendor.name,
      minutes: 0,
      stops: 0,
    };
    cur.minutes += e.downtimeMinutes ?? 0;
    cur.stops += e.stopsCount ?? 0;
    vendorMap.set(e.vendor.id, cur);

    const monthMap = vendorMonthMap.get(e.vendor.id) ?? new Map<string, number>();
    const key = monthKey(e.date);
    monthMap.set(key, (monthMap.get(key) ?? 0) + (e.downtimeMinutes ?? 0));
    vendorMonthMap.set(e.vendor.id, monthMap);
  }
  const vendorRanking = [...vendorMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.minutes - a.minutes);
  const topVendor = vendorRanking[0];

  const heatmapVendors = vendorRanking.slice(0, 8);
  const heatmapMonths = trendKeysSorted;
  const heatmapData = {
    vendors: heatmapVendors.map((v) => v.name),
    months: heatmapMonths.map((k) => monthLabel(k)),
    minutes: heatmapVendors.map((v) =>
      heatmapMonths.map((m) => vendorMonthMap.get(v.id)?.get(m) ?? 0)
    ),
  };

  // Machine status (latest entry per machine determines current status)
  const machineEntries = entries.filter((e) => e.category === "EQUIPMENT_PROCESS" && e.machine);
  const machineStatus = new Map<
    string,
    { id: string; name: string; status: string; date: Date }
  >();
  for (const e of machineEntries) {
    if (!e.machine || !e.status) continue;
    const cur = machineStatus.get(e.machine.id);
    if (!cur || e.date > cur.date) {
      machineStatus.set(e.machine.id, {
        id: e.id,
        name: e.machine.name,
        status: e.status,
        date: e.date,
      });
    }
  }
  const allMachineStatuses = [...machineStatus.values()];
  const machinesNeedingAttention = allMachineStatuses.filter((m) => m.status !== "RESOLVED");
  const resolvedCount = allMachineStatuses.length - machinesNeedingAttention.length;

  // Average downtime per breakdown, per machine
  const machineAggMap = new Map<string, { name: string; totalMinutes: number; count: number }>();
  for (const e of machineEntries) {
    if (!e.machine) continue;
    const cur = machineAggMap.get(e.machine.id) ?? {
      name: e.machine.name,
      totalMinutes: 0,
      count: 0,
    };
    cur.totalMinutes += entryDowntimeMinutes(e) ?? 0;
    cur.count += 1;
    machineAggMap.set(e.machine.id, cur);
  }
  const machineAverages = [...machineAggMap.values()]
    .map((m) => ({
      name: m.name,
      avgMinutes: m.count > 0 ? m.totalMinutes / m.count : 0,
      count: m.count,
    }))
    .sort((a, b) => b.avgMinutes - a.avgMinutes);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Live totals across paper-quality downtime, equipment breakdowns, and
          issuance history.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="This Month's Downtime"
          value={formatMinutes(totalMinutesThisMonth)}
          delta={momDelta}
          hint={momDelta !== undefined ? "vs last month" : undefined}
        />
        <StatCard
          label="All-Time Downtime"
          value={formatMinutes(totalMinutesAllTime)}
          hint={`${entries.length} logged entries`}
          trend={monthlyTotals}
        />
        <StatCard
          label="Top Cause"
          value={topCause ? topCause.issueType : "—"}
          hint={topCause ? formatMinutes(topCause.minutes) : undefined}
        />
        <StatCard
          label="Top Vendor by Downtime"
          value={topVendor ? topVendor.name : "—"}
          hint={topVendor ? formatMinutes(topVendor.minutes) : undefined}
        />
      </div>

      {allMachineStatuses.length > 0 && (
        <Card>
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <Meter
              label="Machines fully resolved"
              value={resolvedCount}
              max={allMachineStatuses.length}
              formatValue={(v) => `${v} / ${allMachineStatuses.length}`}
            />
            {machinesNeedingAttention.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {machinesNeedingAttention.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-2 rounded-md bg-black/5 px-3 py-1.5 text-sm dark:bg-white/10"
                  >
                    <span className="font-medium">{m.name}</span>
                    <StatusBadge status={m.status} />
                    <ResolveToggleButton id={m.id} status={m.status} redirectTo="/" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center text-sm" style={{ color: INK.secondary }}>
                All machines currently resolved — nothing open or on a temporary fix.
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm font-medium">Downtime by month</div>
          {trend.length > 0 ? (
            <DowntimeTrendChart data={trend} />
          ) : (
            <p className="py-10 text-center text-sm text-black/50">No data yet.</p>
          )}
        </Card>
        <Card>
          <div className="mb-2 text-sm font-medium">
            Top defect types (paper quality)
          </div>
          {defectData.length > 0 ? (
            <DefectTypeChart data={defectData} />
          ) : (
            <p className="py-10 text-center text-sm text-black/50">No data yet.</p>
          )}
        </Card>
      </div>

      {heatmapVendors.length > 0 && (
        <Card>
          <div className="mb-3 text-sm font-medium">
            Vendor downtime by month (minutes)
          </div>
          <VendorHeatmap data={heatmapData} />
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Vendor ranking (total downtime)</div>
            <Link href="/vendors" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </div>
          {vendorRanking.length > 0 ? (
            <RankedBarList
              data={vendorRanking
                .slice(0, 8)
                .map((v) => ({ name: v.name, value: v.minutes, secondaryText: `${v.stops} stops` }))}
              formatValue={formatMinutes}
            />
          ) : (
            <p className="py-6 text-center text-sm" style={{ color: INK.muted }}>
              No data yet.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Machine average downtime per breakdown</div>
            <Link href="/machines" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </div>
          {machineAverages.length > 0 ? (
            <RankedBarList
              data={machineAverages
                .slice(0, 8)
                .map((m) => ({
                  name: m.name,
                  value: m.avgMinutes,
                  secondaryText: `${m.count} breakdown${m.count === 1 ? "" : "s"}`,
                }))}
              formatValue={formatMinutes}
            />
          ) : (
            <p className="py-6 text-center text-sm" style={{ color: INK.muted }}>
              No data yet.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}