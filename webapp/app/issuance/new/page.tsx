import { prisma } from "@/app/lib/prisma";
import NewIssuanceForm from "./NewIssuanceForm";

export const dynamic = "force-dynamic";

export default async function NewIssuancePage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>;
}) {
  const { vendor } = await searchParams;
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Log a paper receipt</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Records incoming paper rolls per vendor.
        </p>
      </div>
      <NewIssuanceForm vendorNames={vendors.map((v) => v.name)} defaultVendorName={vendor} />
    </div>
  );
}