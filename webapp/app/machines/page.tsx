import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { entryDowntimeMinutes, formatMinutes } from "@/app/lib/downtime";
import { Card, EmptyState, LinkButton, StatCard, StatusBadge } from "@/app/components/ui";
import { INK } from "@/app/lib/palette";
import { machineFamily } from "@/app/lib/constants";
import GroupFilter from "@/app/components/GroupFilter";
import AddEntityForm from "@/app/components/AddEntityForm";
import { createMachine } from "@/app/lib/actions";

export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;

  const machines = await prisma.machine.findMany({
    include: {
      logEntries: {
        where: { category: "EQUIPMENT_PROCESS" },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = machines
    .map((m) => {
      const downtimeMinutes = m.logEntries.reduce(
        (s, e) => s + (entryDowntimeMinutes(e) ?? 0),
        0
      );
      return {
        id: m.id,
        name: m.name,
        family: machineFamily(m.name),
        breakdownCount: m.logEntries.length,
        downtimeMinutes,
        currentStatus: m.logEntries[0]?.status ?? null,
      };
    })
    .sort((a, b) => b.downtimeMinutes - a.downtimeMinutes);

  const groups = [...new Set(rows.map((r) => r.family))].sort();
  const visibleRows = group ? rows.filter((r) => r.family === group) : rows;

  const groupTotals =
    group && visibleRows.length > 1
      ? {
          count: visibleRows.reduce((s, r) => s + r.breakdownCount, 0),
          minutes: visibleRows.reduce((s, r) => s + r.downtimeMinutes, 0),
        }
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Machine Scorecard</h1>
          <p className="text-sm" style={{ color: INK.muted }}>
            Click a machine for its complete breakdown history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddEntityForm
            action={createMachine}
            buttonLabel="+ Add Machine"
            placeholder="e.g. HQM"
          />
          <LinkButton href="/entries/new?category=EQUIPMENT_PROCESS">
            + Log downtime
          </LinkButton>
        </div>
      </div>

      {groups.length > 1 && (
        <GroupFilter groups={groups} selected={group} basePath="/machines" />
      )}

      {groupTotals && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label={`${group} — machines`} value={visibleRows.length} />
          <StatCard label="Combined breakdowns" value={groupTotals.count} />
          <StatCard label="Combined downtime" value={formatMinutes(groupTotals.minutes)} />
        </div>
      )}

      {visibleRows.length === 0 ? (
        <EmptyState message="No equipment breakdowns logged yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRows.map((m) => (
            <Link key={m.id} href={`/machines/${m.id}`}>
              <Card className="h-full transition-transform hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                  <div className="font-medium">{m.name}</div>
                  {m.currentStatus && <StatusBadge status={m.currentStatus} />}
                </div>
                <div className="mt-2 text-sm" style={{ color: INK.secondary }}>
                  {m.breakdownCount} breakdown{m.breakdownCount === 1 ? "" : "s"}
                </div>
                <div className="text-lg font-semibold">{formatMinutes(m.downtimeMinutes)}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}