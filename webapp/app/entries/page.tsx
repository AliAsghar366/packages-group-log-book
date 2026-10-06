import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { entryDowntimeMinutes, formatMinutes } from "@/app/lib/downtime";
import {
  Card,
  CategoryBadge,
  EmptyState,
  LinkButton,
  ResolveToggleButton,
  StatusBadge,
} from "@/app/components/ui";

export const dynamic = "force-dynamic";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const entries = await prisma.logEntry.findMany({
    where: category ? { category } : undefined,
    include: { vendor: true, machine: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Entries</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            Every logged downtime and breakdown event.
          </p>
        </div>
        <LinkButton href="/entries/new">+ Log new entry</LinkButton>
      </div>

      <div className="flex gap-2 text-sm">
        {[
          { label: "All", value: undefined },
          { label: "Paper Quality", value: "PAPER_QUALITY" },
          { label: "Equipment/Process", value: "EQUIPMENT_PROCESS" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/entries?category=${f.value}` : "/entries"}
            className={`rounded-full px-3 py-1 backdrop-blur-xl transition-colors ${
              category === f.value
                ? "bg-black/80 text-white dark:bg-white/80 dark:text-black"
                : "border border-white/30 bg-white/30 text-black/70 hover:bg-white/50 dark:border-white/15 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState message="No entries logged yet." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 bg-white/20 text-left dark:border-white/10 dark:bg-white/[0.03]">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Vendor / Machine</th>
                <th className="px-3 py-2 font-medium">Issue</th>
                <th className="px-3 py-2 font-medium">Downtime</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {e.date.toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <CategoryBadge category={e.category} />
                  </td>
                  <td className="px-3 py-2">
                    {e.vendor?.name ?? e.machine?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2">{e.issueType ?? e.description ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatMinutes(entryDowntimeMinutes(e))}
                  </td>
                  <td className="px-3 py-2">
                    {e.status ? <StatusBadge status={e.status} /> : "—"}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {e.category === "EQUIPMENT_PROCESS" && e.status ? (
                      <div className="flex items-center justify-end gap-2">
                        <ResolveToggleButton
                          id={e.id}
                          status={e.status}
                          redirectTo={category ? `/entries?category=${category}` : "/entries"}
                        />
                        <Link
                          href={`/entries/${e.id}/edit`}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Details →
                        </Link>
                      </div>
                    ) : null}
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