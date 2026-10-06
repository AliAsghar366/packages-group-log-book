import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { entryDowntimeMinutes, formatMinutes } from "@/app/lib/downtime";
import { Card, EmptyState, LinkButton, ResolveToggleButton, StatCard, StatusBadge } from "@/app/components/ui";
import PhotoGallery from "@/app/components/PhotoGallery";
import { INK } from "@/app/lib/palette";

export const dynamic = "force-dynamic";

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      logEntries: {
        where: { category: "EQUIPMENT_PROCESS" },
        include: { photos: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!machine) notFound();

  const totalDowntime = machine.logEntries.reduce(
    (s, e) => s + (entryDowntimeMinutes(e) ?? 0),
    0
  );
  const currentStatus = machine.logEntries[0]?.status ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{machine.name}</h1>
          <p className="text-sm" style={{ color: INK.muted }}>
            Complete breakdown history for this machine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentStatus && <StatusBadge status={currentStatus} />}
          <LinkButton href={`/entries/new?machine=${encodeURIComponent(machine.name)}`}>
            + Log downtime
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Breakdowns" value={machine.logEntries.length} />
        <StatCard label="Total Downtime" value={formatMinutes(totalDowntime)} />
        <StatCard
          label="Avg. per breakdown"
          value={
            machine.logEntries.length
              ? formatMinutes(totalDowntime / machine.logEntries.length)
              : "—"
          }
        />
      </div>

      <Card>
        <div className="mb-3 text-sm font-medium">Breakdown history</div>
        {machine.logEntries.length === 0 ? (
          <EmptyState message="No breakdowns logged for this machine yet." />
        ) : (
          <div className="space-y-3">
            {machine.logEntries.map((e) => (
              <div
                key={e.id}
                className="border-b border-black/5 pb-3 last:border-0 dark:border-white/5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{e.date.toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    {e.status && <StatusBadge status={e.status} />}
                    {e.status && (
                      <ResolveToggleButton
                        id={e.id}
                        status={e.status}
                        redirectTo={`/machines/${machine.id}`}
                      />
                    )}
                    <Link
                      href={`/entries/${e.id}/edit`}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
                <div className="mt-0.5 text-sm" style={{ color: INK.secondary }}>
                  {formatMinutes(entryDowntimeMinutes(e))}
                  {e.description ? ` · ${e.description}` : ""}
                  {e.issueType && !e.description?.includes(e.issueType)
                    ? ` · ${e.issueType}`
                    : ""}
                </div>
                {e.rootCause && (
                  <div className="mt-1 text-xs" style={{ color: INK.muted }}>
                    Root cause: {e.rootCause}
                  </div>
                )}
                {e.photos.length > 0 && (
                  <div className="mt-2 max-w-md">
                    <PhotoGallery photos={e.photos} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}