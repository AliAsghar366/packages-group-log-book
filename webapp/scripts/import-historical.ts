/**
 * One-off import of the 3 monthly Excel workbooks (April/July/August 2026)
 * and the 3 PDF equipment-breakdown incidents into the log book database.
 * Not a recurring job -- run once with `npm run import:historical`.
 *
 * Wipes and re-seeds LogEntry/IssuanceRecord/Vendor/Machine so it's safe
 * to re-run against the local dev database while iterating.
 */
import "dotenv/config";
import path from "node:path";
import * as XLSX from "xlsx";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const SOURCE_DIR = path.resolve(__dirname, "..", "..");

const WORKBOOKS = [
  { file: "APRL DOWNTIMES (1).xlsx", downtimeSheet: "APRIL DOWNTIMES" },
  { file: "July DOWNTIMES (1).xlsx", downtimeSheet: "JULY-26 DOWNTIMES" },
  { file: "AUG DOWNTIMES.xlsx", downtimeSheet: "AUG DOWNTIMES" },
];

const DEFECT_KEYWORDS = ["Joint Break/Improper Joint", "Side Cuts", "Open Joint"];

// Reason-column mill names (long form) -> canonical vendor name.
const VENDOR_PREFIX_MAP: Record<string, string> = {
  "Abbas Paper mill": "Abbas Paper Mill",
  "Al Hammad Board Mills": "Al Hammad Board Mills",
  "Al Madina Paper & Board Mills": "Al-Madina Paper & Board Mills",
  "Al Waris Paper Mill": "Al Waris Paper Mill",
  "Azan Paper Mill": "Azan Paper Mill",
  "Eagle Paper Mills": "Eagle Paper Mills",
  "Faisalabad Paper & Board Mills": "Faisalabad Paper & Board Mills",
  "HH Paper & Board Mills": "HH Paper & Board Mills",
  "Hira Paper & Board Mills": "Hira Paper & Board Mills",
  "Jahangir Paper Boards": "Jahangir Paper Boards",
  "Mian Lateef Paper & Board Mills": "Mian Lateef Paper & Board Mills",
  "Mirpur Paper & Board Mills": "Mirpur Paper & Board Mills",
  "Model Supreme Paper Mills": "Model Supreme Paper Mills",
  "Noshahi Paper Mill": "Noshahi Paper Mill",
  "Pure Gold Paper & Board Mills": "Pure Gold Paper & Board Mills",
  "Qadria Board Mills": "Qadria Board Mills",
  "Royal Board & Paper Mills": "Royal Board & Paper Mills",
};

// Short vendor codes used in the PAPER DOWNTIMES / issuance / Sheet1 tabs -> canonical name.
const VENDOR_CODE_MAP: Record<string, string> = {
  ABBAS: "Abbas Paper Mill",
  "AL-MADINA": "Al-Madina Paper & Board Mills",
  "AL WARIS": "Al Waris Paper Mill",
  EAGLE: "Eagle Paper Mills",
  FSD: "Faisalabad Paper & Board Mills",
  "H H": "HH Paper & Board Mills",
  HH: "HH Paper & Board Mills",
  HIRA: "Hira Paper & Board Mills",
  JAHANGIR: "Jahangir Paper Boards",
  "MIAN LATIF": "Mian Lateef Paper & Board Mills",
  MIRPUR: "Mirpur Paper & Board Mills",
  MODEL: "Model Supreme Paper Mills",
  NOSHAHI: "Noshahi Paper Mill",
  "PURE GOLD": "Pure Gold Paper & Board Mills",
  GOLD: "Pure Gold Paper & Board Mills",
  QADRIA: "Qadria Board Mills",
  ROYAL: "Royal Board & Paper Mills",
  "BULLEH SHAH": "Bulleh Shah Packaging",
  AHMAD: "Ahmad Paper Mill",
  AHMED: "Ahmad Paper Mill",
  MK: "MK",
  MPK: "MPK",
};

// Machine name derived from non-vendor "Reason" text -> canonical machine.
const MACHINE_KEYWORD_MAP: [RegExp, string][] = [
  [/HQM/i, "HQM"],
  [/SRV|Slitter/i, "SRV"],
  [/ASM1/i, "ASM1"],
  [/ASM2/i, "ASM2"],
  [/Bflute|BFlute/i, "BF Lute"],
  [/Eflute|EFlute/i, "E Lute"],
  [/Cflute|CFlute/i, "CF Lute"],
  [/DFacer|Dfacer/i, "Double Facer"],
  [/Conveyor|Chaintroll/i, "Conveyor"],
  [/Boiler/i, "Boiler"],
  [/RDS/i, "RDS"],
];

function normalizeVendorFromCode(rawCode: string): string {
  const key = rawCode.trim().toUpperCase();
  return VENDOR_CODE_MAP[key] ?? titleCase(rawCode.trim());
}

function normalizeVendorFromPrefix(prefix: string): string {
  return VENDOR_PREFIX_MAP[prefix] ?? titleCase(prefix);
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function machineFromReason(reason: string): string | null {
  for (const [pattern, machine] of MACHINE_KEYWORD_MAP) {
    if (pattern.test(reason)) return machine;
  }
  return null; // plant-wide / non-machine-specific (breaks, power failure, etc.)
}

function splitReason(reason: string): { vendorPrefix: string; issueType: string } | null {
  for (const kw of DEFECT_KEYWORDS) {
    if (reason.endsWith(kw)) {
      return { vendorPrefix: reason.slice(0, -kw.length).trim(), issueType: kw };
    }
  }
  return null;
}

async function getOrCreateVendor(cache: Map<string, string>, name: string) {
  if (cache.has(name)) return cache.get(name)!;
  const vendor = await prisma.vendor.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  cache.set(name, vendor.id);
  return vendor.id;
}

async function getOrCreateMachine(cache: Map<string, string>, name: string) {
  if (cache.has(name)) return cache.get(name)!;
  const machine = await prisma.machine.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  cache.set(name, machine.id);
  return machine.id;
}

async function main() {
  console.log("Wiping existing data...");
  await prisma.logEntry.deleteMany();
  await prisma.issuanceRecord.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.machine.deleteMany();

  const vendorCache = new Map<string, string>();
  const machineCache = new Map<string, string>();

  let paperQualityCount = 0;
  let processCount = 0;
  let issuanceCount = 0;
  const unmappedProcessReasons = new Set<string>();

  for (const { file, downtimeSheet } of WORKBOOKS) {
    const filePath = path.join(SOURCE_DIR, file);
    console.log(`\nReading ${file}...`);
    const wb = XLSX.readFile(filePath, { cellDates: true });

    // --- Downtime reasons (vendor-caused + machine/process-caused) ---
    const dSheet = wb.Sheets[downtimeSheet];
    const dRows: unknown[][] = XLSX.utils.sheet_to_json(dSheet, {
      header: 1,
    });
    // Determine a representative date for this month's aggregate rows:
    // first date found in the corresponding issuance sheet, else today.
    const issuanceSheetForDate = wb.Sheets["issuance"];
    const issuanceRowsForDate: Record<string, unknown>[] = issuanceSheetForDate
      ? XLSX.utils.sheet_to_json(issuanceSheetForDate)
      : [];
    const monthDate =
      (issuanceRowsForDate[0]?.["DATE"] as Date | undefined) ?? new Date();

    for (const row of dRows) {
      const srNo = row[0];
      const reason = row[1] as string | undefined;
      const downtimeMinutes = row[2] !== undefined ? Number(row[2]) : undefined;
      const stopsCount = row[3] !== undefined ? Number(row[3]) : undefined;
      if (typeof srNo !== "number" && !(typeof srNo === "string" && /^\d+$/.test(srNo))) {
        continue; // header/blank rows
      }
      if (!reason) continue;

      const split = splitReason(reason);
      if (split) {
        const canonicalVendor = normalizeVendorFromPrefix(split.vendorPrefix);
        const vendorId = await getOrCreateVendor(vendorCache, canonicalVendor);
        await prisma.logEntry.create({
          data: {
            category: "PAPER_QUALITY",
            date: monthDate,
            vendorId,
            issueType: split.issueType,
            downtimeMinutes: Number.isFinite(downtimeMinutes) ? downtimeMinutes : null,
            stopsCount: Number.isFinite(stopsCount) ? stopsCount : null,
            preparedBy: "Historical import",
          },
        });
        paperQualityCount++;
      } else {
        // Plant-wide/logistics reasons (power failure, prayer break, waiting
        // on paper from store, etc.) aren't tied to one machine -- still
        // imported in full, just bucketed under a shared machine so no row
        // from the sheet is ever dropped.
        const machineName = machineFromReason(reason) ?? "Plant-Wide / Other";
        if (machineName === "Plant-Wide / Other") unmappedProcessReasons.add(reason);
        const machineId = await getOrCreateMachine(machineCache, machineName);
        await prisma.logEntry.create({
          data: {
            category: "EQUIPMENT_PROCESS",
            date: monthDate,
            machineId,
            status: "RESOLVED",
            issueType: reason,
            downtimeMinutes: Number.isFinite(downtimeMinutes) ? downtimeMinutes : null,
            stopsCount: Number.isFinite(stopsCount) ? stopsCount : null,
            description: `Imported from monthly downtime log (aggregate, no exact timestamps): ${reason}`,
            preparedBy: "Historical import",
          },
        });
        processCount++;
      }
    }

    // --- Issuance (paper receiving) ---
    const iSheet = wb.Sheets["issuance"];
    if (iSheet) {
      const iRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(iSheet);
      for (const row of iRows) {
        const date = row["DATE"] as Date | undefined;
        const vendorRaw = row["VENDOR"] as string | undefined;
        const netQty = row["Sum of NET QTY"];
        if (!date || !vendorRaw || netQty === undefined) continue;

        const canonicalVendor = normalizeVendorFromCode(vendorRaw);
        const vendorId = await getOrCreateVendor(vendorCache, canonicalVendor);
        await prisma.issuanceRecord.create({
          data: {
            date,
            vendorId,
            description: (row["Description"] as string) ?? null,
            netQty: Number(netQty),
            deckle: row["DECKLE"] !== undefined ? Number(row["DECKLE"]) : null,
            paperType: (row["Paper Type"] as string) ?? null,
          },
        });
        issuanceCount++;
      }
    }
  }

  if (unmappedProcessReasons.size > 0) {
    console.log("\nReasons not tied to a specific machine (imported under 'Plant-Wide / Other'):");
    for (const r of unmappedProcessReasons) console.log(`  - ${r}`);
  }

  // --- The 3 PDF equipment-breakdown incidents (BHS-HH ISSUE LOG.pdf) ---
  console.log("\nAdding PDF incident reports...");
  const hqmMachineId = await getOrCreateMachine(machineCache, "HQM");
  await prisma.logEntry.create({
    data: {
      category: "EQUIPMENT_PROCESS",
      date: new Date("2026-07-27T23:40:00"),
      machineId: hqmMachineId,
      status: "RESOLVED",
      startTime: new Date("2026-07-27T23:40:00"),
      resolvedTime: new Date("2026-07-28T03:02:00"),
      description:
        "HQM Unit unexpectedly stopped while running and could not be restarted.",
      immediateAction:
        "Faulty limit switch temporarily bypassed to restore production immediately.",
      rootCause:
        "HQM Limit Switch was not transmitting the forward position signal to the control system; incorrect limit switch setting prevented the PLC from receiving the required confirmation signal. Secondary issue: sheet length variation traced to improper Infeed Roll alignment.",
      correctiveAction:
        "Limit switch inspected, position/mechanism adjusted and re-aligned, signal transmission verified. Infeed Roll settings adjusted and calibrated; trial run confirmed sheet length accuracy.",
      resultsSummary:
        "HQM restored to normal operation, temporary bypass removed, sheet length variation eliminated, stable production resumed.",
      preparedBy: "Historical import (BHS-HH ISSUE LOG.pdf)",
    },
  });

  const cfMachineId = await getOrCreateMachine(machineCache, "CF Glue Guide Drive");
  await prisma.logEntry.create({
    data: {
      category: "EQUIPMENT_PROCESS",
      date: new Date("2026-07-27T14:50:00"),
      machineId: cfMachineId,
      status: "RESOLVED",
      startTime: new Date("2026-07-27T14:50:00"),
      resolvedTime: new Date("2026-07-27T16:00:00"),
      description:
        "24VDC control breaker (13F2) on the CF unit repeatedly tripped; Glue Guide Drive unable to operate normally.",
      rootCause:
        "Glue Guide Drive encoder cable damaged near the motor connection box cable gland; +24VDC conductor broken and contacting the motor body, causing a direct short circuit.",
      correctiveAction:
        "Isolated 24VDC supply, identified and located the damaged cable section, repaired and reconnected the +24VDC wire, insulated/secured it, verified wiring and restored the system after functional testing. Full encoder calibration (to restore Automatic Mode) deferred to next planned shutdown.",
      resultsSummary:
        "Short circuit eliminated, 24VDC supply stabilized, breaker 13F2 normal, CF unit resumed operation (Glue Guide running in Manual Mode pending calibration).",
      preparedBy: "Umer Nazir",
    },
  });

  const dfMachineId = await getOrCreateMachine(machineCache, "Double Facer");
  await prisma.logEntry.create({
    data: {
      category: "EQUIPMENT_PROCESS",
      date: new Date("2026-07-01T00:00:00"),
      machineId: dfMachineId,
      status: "RESOLVED",
      startTime: new Date("2026-07-01T00:00:00"),
      resolvedTime: new Date("2026-07-01T00:00:00"),
      description:
        "Severe wear identified on the DF-HH Glue Roll bearing housing/seat and Drive Shaft bearing housing/seat.",
      rootCause:
        "Drive-side bearing housing/seat significantly worn, causing loose bearing fit and structural play.",
      correctiveAction:
        "Metal build-up welding on the drive-side bearing housing, ground and finished for a smooth uniform surface, fit checked repeatedly during grinding; 22212 spherical roller bearings replaced on both Operator and Drive sides.",
      resultsSummary: "Proper bearing fit restored on the DF-HH unit.",
      preparedBy: "Historical import (BHS-HH ISSUE LOG.pdf)",
    },
  });

  console.log(`\nDone.
  Paper quality entries: ${paperQualityCount}
  Equipment/process entries (from monthly rollups): ${processCount}
  Equipment/process entries (from PDF incidents): 3
  Issuance records: ${issuanceCount}
  Vendors: ${vendorCache.size}
  Machines: ${machineCache.size}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());