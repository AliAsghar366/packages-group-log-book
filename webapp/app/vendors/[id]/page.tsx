import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { formatMinutes } from "@/app/lib/downtime";
import { Card, EmptyState, LinkButton, StatCard } from "@/app/components/ui";
import PhotoGallery from "@/app/components/PhotoGallery";
import { INK } from "@/app/lib/palette";

export const dynamic = "force-dynamic";

type TimelineItem =
  | { kind: "downtime"; date: Date; id: string; issueType: string | null; minutes: number | null; stops: number | null; description: string | null; photos: { id: string; url: string; caption: string | null }[] }
  | { kind: "issuance"; date: Date; id: string; description: string | null; netQty: number; paperType: string | null };

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      logEntries: { where: { category: "PAPER_QUALITY" }, include: { photos: true } },
      issuances: true,
    },
  });

  if (!vendor) notFound();

  const totalDowntime = vendor.logEntries.reduce((s, e) => s + (e.downtimeMinutes ?? 0), 0);
  const totalStops = vendor.logEntries.reduce((s, e) => s + (e.stopsCount ?? 0), 0);
  const totalQty = vendor.issuances.reduce((s, i) => s + i.netQty, 0);
  const perThousand = totalQty > 0 ? (totalDowntime / totalQty) * 1000 : null;

  const timeline: TimelineItem[] = [
    ...vendor.logEntries.map((e) => ({
      kind: "downtime" as const,
      date: e.date,
      id: e.id,
      issueType: e.issueType,
      minutes: e.downtimeMinutes,
      stops: e.stopsCount,
      description: e.description,
      photos: e.photos,
    })),
    ...vendor.issuances.map((i) => ({
      kind: "issuance" as const,
      date: i.date,
      id: i.id,
      description: i.description,
      netQty: i.netQty,
      paperType: i.paperType,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{vendor.name}</h1>
          <p className="text-sm" style={{ color: INK.muted }}>
            Complete downtime and receiving history for this vendor.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton
            href={`/entries/new?category=PAPER_QUALITY&vendor=${encodeURIComponent(vendor.name)}`}
            variant="glass"
          >
            + Log downtime
          </LinkButton>
          <LinkButton href={`/issuance/new?vendor=${encodeURIComponent(vendor.name)}`}>
            + Log receipt
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Downtime" value={formatMinutes(totalDowntime)} />
        <StatCard label="Total Stops" value={totalStops} />
        <StatCard label="Qty Received" value={totalQty ? totalQty.toLocaleString() : "—"} />
        <StatCard
          label="Downtime / 1000 units"
          value={perThousand ? perThousand.toFixed(1) : "—"}
        />
      </div>

      <Card>
        <div className="mb-3 text-sm font-medium">Timeline</div>
        {timeline.length === 0 ? (
          <EmptyState message="No history for this vendor yet." />
        ) : (
          <div className="space-y-3">
            {timeline.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="border-b border-black/5 pb-3 last:border-0 dark:border-white/5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {item.kind === "downtime" ? item.issueType ?? "Downtime" : "Paper received"}
                  </span>
                  <span style={{ color: INK.muted }}>{item.date.toLocaleDateString()}</span>
                </div>
                <div className="mt-0.5 text-sm" style={{ color: INK.secondary }}>
                  {item.kind === "downtime"
                    ? `${formatMinutes(item.minutes)}${item.stops ? ` · ${item.stops} stops` : ""}${item.description ? ` · ${item.description}` : ""}`
                    : `${item.netQty.toLocaleString()} units${item.paperType ? ` · ${item.paperType}` : ""}${item.description ? ` · ${item.description}` : ""}`}
                </div>
                {item.kind === "downtime" && item.photos.length > 0 && (
                  <div className="mt-2 max-w-md">
                    <PhotoGallery photos={item.photos} />
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