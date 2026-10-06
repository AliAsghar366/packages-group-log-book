import { prisma } from "@/app/lib/prisma";
import NewEntryForm from "./NewEntryForm";

export const dynamic = "force-dynamic";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ machine?: string; vendor?: string; category?: string }>;
}) {
  const { machine, vendor, category } = await searchParams;
  const [vendors, machines] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.machine.findMany({ orderBy: { name: "asc" } }),
  ]);

  const defaultCategory =
    category === "EQUIPMENT_PROCESS" || machine
      ? "EQUIPMENT_PROCESS"
      : category === "PAPER_QUALITY" || vendor
        ? "PAPER_QUALITY"
        : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Log a new entry</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Pick the type of event, then fill in what you know right now.
        </p>
      </div>
      <NewEntryForm
        vendorNames={vendors.map((v) => v.name)}
        machineNames={machines.map((m) => m.name)}
        defaultCategory={defaultCategory}
        defaultMachineName={machine}
        defaultVendorName={vendor}
      />
    </div>
  );
}