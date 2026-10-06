import { prisma } from "@/app/lib/prisma";
import { Card, EmptyState, LinkButton } from "@/app/components/ui";

export const dynamic = "force-dynamic";

export default async function IssuancePage() {
  const records = await prisma.issuanceRecord.findMany({
    include: { vendor: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Paper Issuance</h1>
          <p className="text-sm text-black/50 dark:text-white/50">
            Paper rolls received from vendors (most recent 200 shown).
          </p>
        </div>
        <LinkButton href="/issuance/new">+ Log receipt</LinkButton>
      </div>

      {records.length === 0 ? (
        <EmptyState message="No issuance records yet." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20 bg-white/20 text-left dark:border-white/10 dark:bg-white/[0.03]">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Deckle</th>
                <th className="px-3 py-2 font-medium">Paper Type</th>
                <th className="px-3 py-2 font-medium">Net Qty</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.date.toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{r.vendor.name}</td>
                  <td className="px-3 py-2">{r.description ?? "—"}</td>
                  <td className="px-3 py-2">{r.deckle ?? "—"}</td>
                  <td className="px-3 py-2">{r.paperType ?? "—"}</td>
                  <td className="px-3 py-2">{r.netQty.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}