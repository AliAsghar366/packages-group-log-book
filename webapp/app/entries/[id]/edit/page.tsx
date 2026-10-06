import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { entryDowntimeMinutes, formatMinutes } from "@/app/lib/downtime";
import { Card, StatusBadge } from "@/app/components/ui";
import PhotoGallery from "@/app/components/PhotoGallery";
import EntryLifecycleForm from "./EntryLifecycleForm";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: { machine: true, vendor: true, photos: true },
  });

  if (!entry) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          {entry.machine?.name ?? "Entry"} breakdown
        </h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Started {entry.startTime?.toLocaleString() ?? entry.date.toLocaleDateString()}
        </p>
      </div>

      <Card className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-black/50 dark:text-white/50">Status</span>
          {entry.status && <StatusBadge status={entry.status} />}
        </div>
        <div className="flex justify-between">
          <span className="text-black/50 dark:text-white/50">Downtime so far</span>
          <span>{formatMinutes(entryDowntimeMinutes(entry))}</span>
        </div>
        {entry.description && (
          <div>
            <span className="text-black/50 dark:text-white/50">Description</span>
            <p className="mt-1">{entry.description}</p>
          </div>
        )}
        {entry.immediateAction && (
          <div>
            <span className="text-black/50 dark:text-white/50">Immediate action taken</span>
            <p className="mt-1">{entry.immediateAction}</p>
          </div>
        )}
        {entry.rootCause && (
          <div>
            <span className="text-black/50 dark:text-white/50">Root cause</span>
            <p className="mt-1">{entry.rootCause}</p>
          </div>
        )}
        {entry.correctiveAction && (
          <div>
            <span className="text-black/50 dark:text-white/50">Permanent corrective action</span>
            <p className="mt-1">{entry.correctiveAction}</p>
          </div>
        )}
        {entry.resultsSummary && (
          <div>
            <span className="text-black/50 dark:text-white/50">Results</span>
            <p className="mt-1">{entry.resultsSummary}</p>
          </div>
        )}
        {entry.photos.length > 0 && (
          <div>
            <span className="text-black/50 dark:text-white/50">Photos</span>
            <div className="mt-2">
              <PhotoGallery photos={entry.photos} />
            </div>
          </div>
        )}
      </Card>

      {entry.status && (
        <EntryLifecycleForm
          id={entry.id}
          status={entry.status}
          tempFixedTime={entry.tempFixedTime}
          resolvedTime={entry.resolvedTime}
          immediateAction={entry.immediateAction}
          rootCause={entry.rootCause}
          correctiveAction={entry.correctiveAction}
          resultsSummary={entry.resultsSummary}
        />
      )}
    </div>
  );
}