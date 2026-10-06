"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { saveUploadedPhotos } from "@/app/lib/upload";
import { STATUSES, type Status } from "@/app/lib/constants";

async function findOrCreateVendor(name: string) {
  const trimmed = name.trim();
  const existing = await prisma.vendor.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) return existing;
  return prisma.vendor.create({ data: { name: trimmed } });
}

async function findOrCreateMachine(name: string) {
  const trimmed = name.trim();
  const existing = await prisma.machine.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) return existing;
  return prisma.machine.create({ data: { name: trimmed } });
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  return v === null ? null : Number(v);
}

function photoFiles(formData: FormData): File[] {
  return formData.getAll("photos").filter((f): f is File => f instanceof File);
}

// Prisma 7.10's runtime validator rejects a nested `photos: { create }` write
// mixed into the same create() call as a relation connect (a client-version
// quirk, not a schema issue) -- so photos are attached in a separate call.
async function attachPhotos(logEntryId: string, urls: string[]) {
  if (urls.length === 0) return;
  await prisma.photo.createMany({
    data: urls.map((url) => ({ logEntryId, url })),
  });
}

export async function createPaperQualityEntry(formData: FormData) {
  const vendorName = str(formData, "vendorName");
  if (!vendorName) throw new Error("Vendor is required");
  const vendor = await findOrCreateVendor(vendorName);
  const photoUrls = await saveUploadedPhotos(photoFiles(formData));

  const entry = await prisma.logEntry.create({
    data: {
      category: "PAPER_QUALITY",
      date: new Date(str(formData, "date") ?? Date.now()),
      vendor: { connect: { id: vendor.id } },
      issueType: str(formData, "issueType"),
      downtimeMinutes: num(formData, "downtimeMinutes"),
      stopsCount: num(formData, "stopsCount"),
      description: str(formData, "description"),
      preparedBy: str(formData, "preparedBy"),
    },
  });
  await attachPhotos(entry.id, photoUrls);

  revalidatePath("/entries");
  revalidatePath("/vendors");
  revalidatePath("/");
  redirect("/entries");
}

export async function createEquipmentEntry(formData: FormData) {
  const machineName = str(formData, "machineName");
  if (!machineName) throw new Error("Machine is required");
  const machine = await findOrCreateMachine(machineName);

  const startTimeRaw = str(formData, "startTime");
  if (!startTimeRaw) throw new Error("Start time is required");
  const photoUrls = await saveUploadedPhotos(photoFiles(formData));

  const statusRaw = str(formData, "status");
  const status: Status = STATUSES.includes(statusRaw as Status)
    ? (statusRaw as Status)
    : "OPEN";
  const tempFixedTimeRaw = str(formData, "tempFixedTime");
  const resolvedTimeRaw = str(formData, "resolvedTime");

  const entry = await prisma.logEntry.create({
    data: {
      category: "EQUIPMENT_PROCESS",
      date: new Date(startTimeRaw),
      machine: { connect: { id: machine.id } },
      status,
      startTime: new Date(startTimeRaw),
      tempFixedTime: tempFixedTimeRaw ? new Date(tempFixedTimeRaw) : null,
      resolvedTime: resolvedTimeRaw ? new Date(resolvedTimeRaw) : null,
      description: str(formData, "description"),
      immediateAction: str(formData, "immediateAction"),
      rootCause: str(formData, "rootCause"),
      correctiveAction: str(formData, "correctiveAction"),
      resultsSummary: str(formData, "resultsSummary"),
      preparedBy: str(formData, "preparedBy"),
    },
  });
  await attachPhotos(entry.id, photoUrls);

  revalidatePath("/entries");
  revalidatePath("/machines");
  revalidatePath("/");
  redirect("/entries");
}

/**
 * Single flexible status update: set the status to any value, fill in
 * whichever narrative fields apply, optionally attach more photos. Replaces
 * the old forced Open -> Temp Fixed -> Resolved one-way forms.
 */
export async function updateEquipmentEntry(formData: FormData) {
  const id = str(formData, "id");
  if (!id) throw new Error("Missing entry id");

  const statusRaw = str(formData, "status");
  const status: Status | undefined = STATUSES.includes(statusRaw as Status)
    ? (statusRaw as Status)
    : undefined;
  const photoUrls = await saveUploadedPhotos(photoFiles(formData));

  await prisma.logEntry.update({
    where: { id },
    data: {
      status,
      tempFixedTime: str(formData, "tempFixedTime")
        ? new Date(str(formData, "tempFixedTime")!)
        : undefined,
      resolvedTime: str(formData, "resolvedTime")
        ? new Date(str(formData, "resolvedTime")!)
        : undefined,
      immediateAction: str(formData, "immediateAction"),
      rootCause: str(formData, "rootCause"),
      correctiveAction: str(formData, "correctiveAction"),
      resultsSummary: str(formData, "resultsSummary"),
    },
  });
  await attachPhotos(id, photoUrls);

  revalidatePath("/entries");
  revalidatePath("/machines");
  revalidatePath("/");
  redirect(`/entries/${id}/edit`);
}

/**
 * Fast one-click toggle between Resolved and Unresolved (Open), for when you
 * don't need to fill in any of the narrative fields -- just flip the status.
 * Use the full update form (updateEquipmentEntry) for anything more detailed.
 */
export async function toggleEntryResolved(formData: FormData) {
  const id = str(formData, "id");
  if (!id) throw new Error("Missing entry id");
  const currentStatus = str(formData, "currentStatus");
  const redirectTo = str(formData, "redirectTo") ?? "/entries";

  const nextStatus: Status = currentStatus === "RESOLVED" ? "OPEN" : "RESOLVED";

  await prisma.logEntry.update({
    where: { id },
    data: {
      status: nextStatus,
      resolvedTime: nextStatus === "RESOLVED" ? new Date() : null,
    },
  });

  revalidatePath("/entries");
  revalidatePath("/machines");
  revalidatePath(redirectTo);
  revalidatePath("/");
  redirect(redirectTo);
}

export async function createVendor(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("Vendor name is required");
  const existing = await prisma.vendor.findFirst({ where: { name: { equals: name } } });
  if (existing) throw new Error(`Vendor "${name}" already exists`);
  await prisma.vendor.create({ data: { name } });

  revalidatePath("/vendors");
  redirect("/vendors");
}

export async function createMachine(formData: FormData) {
  const name = str(formData, "name");
  if (!name) throw new Error("Machine name is required");
  const existing = await prisma.machine.findFirst({ where: { name: { equals: name } } });
  if (existing) throw new Error(`Machine "${name}" already exists`);
  await prisma.machine.create({ data: { name } });

  revalidatePath("/machines");
  redirect("/machines");
}

export async function createIssuance(formData: FormData) {
  const vendorName = str(formData, "vendorName");
  if (!vendorName) throw new Error("Vendor is required");
  const vendor = await findOrCreateVendor(vendorName);

  const netQty = num(formData, "netQty");
  if (netQty === null) throw new Error("Quantity is required");

  await prisma.issuanceRecord.create({
    data: {
      date: new Date(str(formData, "date") ?? Date.now()),
      vendorId: vendor.id,
      description: str(formData, "description"),
      netQty,
      deckle: num(formData, "deckle"),
      paperType: str(formData, "paperType"),
    },
  });

  revalidatePath("/issuance");
  revalidatePath("/vendors");
  redirect("/issuance");
}