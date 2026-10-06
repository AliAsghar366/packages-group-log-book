import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { formatMinutes } from "@/app/lib/downtime";
import { Card, EmptyState, StatCard } from "@/app/components/ui";
import { vendorFamily } from "@/app/lib/constants";
import GroupFilter from "@/app/components/GroupFilter";
import AddEntityForm from "@/app/components/AddEntityForm";
import { createVendor } from "@/app/lib/actions";

export const dynamic = "force-dynamic";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;

  const vendors = await prisma.vendor.findMany({
    include: {
      logEntries: { where: { category: "PAPER_QUALITY" } },
      issuances: true,
    },
    orderBy: { name: "asc" },
  });

  const rows = vendors
    .map((v) => {
      const downtimeMinutes = v.logEntries.reduce(
        (s, e) => s + (e.downtimeMinutes ?? 0),
        0
      );
      const stops = v.logEntries.reduce((s, e) => s + (e.stopsCount ?? 0), 0);
      const qty = v.issuances.reduce((s, i) => s + i.netQty, 0);
      const perThousand = qty > 0 ? (downtimeMinutes / qty) * 1000 : null;
      return {
        id: v.id,
        name: v.name,
        family: vendorFamily(v.name),
        downtimeMinutes,
        stops,
        entryCount: v.logEntries.length,
        qty,
        perThousand,
      };
    })
    .sort((a, b) => b.downtimeMinutes - a.downtimeMinutes);

  const groups = [...new Set(rows.map((r) => r.family))].sort();
  const visibleRows = group ? rows.filter((r) => r.family === group) : rows;

  const groupTotals =
    group && visibleRows.length > 1
      ? {
          count: visibleRows.length,
          downtime: visibleRows.reduce((s, r) => s + r.downtimeMinutes, 0),
          qty: visibleRows.reduce((s, r) => s + r.qty, 0),
        }
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendor Scorecard</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            Cumulative downtime caused vs. quantity supplied, all-time. Click a
            vendor for its complete history.
          </p>
        </div>
        <AddEntityForm
          action={createVendor}
          buttonLabel="+ Add Vendor"
          placeholder="e.g. Model Supreme Paper Mills"
        />
      </div>

      {groups.length > 1 && (
        <GroupFilter groups={groups} selected={group} basePath="/vendors" />
      )}

      {groupTotals && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label={`${group} — vendors`} value={groupTotals.count} />
          <StatCard label="Combined downtime" value={formatMinutes(groupTotals.downtime)} />
          <StatCard label="Combined qty received" value={groupTotals.qty.toLocaleString()} />
        </div>
      )}

      {visibleRows.length === 0 ? (
        <EmptyState message="No vendor data yet." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 bg-white/20 text-left dark:border-white/10 dark:bg-white/[0.03]">
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Total Downtime</th>
                <th className="px-3 py-2 font-medium">Stops</th>
                <th className="px-3 py-2 font-medium">Entries</th>
                <th className="px-3 py-2 font-medium">Qty Received</th>
                <th className="px-3 py-2 font-medium">Min / 1000 units</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-black/5 last:border-0 hover:bg-black/5 dark:border-white/5 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-medium">
                    <Link href={`/vendors/${r.id}`} className="hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{formatMinutes(r.downtimeMinutes)}</td>
                  <td className="px-3 py-2">{r.stops}</td>
                  <td className="px-3 py-2">{r.entryCount}</td>
                  <td className="px-3 py-2">{r.qty ? r.qty.toLocaleString() : "—"}</td>
                  <td className="px-3 py-2">
                    {r.perThousand ? r.perThousand.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}