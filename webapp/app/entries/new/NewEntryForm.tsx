"use client";

import { useState } from "react";
import { createPaperQualityEntry, createEquipmentEntry } from "@/app/lib/actions";
import { COMMON_ISSUE_TYPES, STATUSES, STATUS_LABELS } from "@/app/lib/constants";
import type { Category } from "@/app/lib/constants";
import { Button, Field, inputClass, PhotoInput } from "@/app/components/ui";

function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function NewEntryForm({
  vendorNames,
  machineNames,
  defaultCategory,
  defaultMachineName,
  defaultVendorName,
}: {
  vendorNames: string[];
  machineNames: string[];
  defaultCategory?: Category;
  defaultMachineName?: string;
  defaultVendorName?: string;
}) {
  const [category, setCategory] = useState<Category>(defaultCategory ?? "PAPER_QUALITY");

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["PAPER_QUALITY", "EQUIPMENT_PROCESS"] as Category[]).map((c) => (
          <Button
            key={c}
            type="button"
            variant={category === c ? "primary" : "glass"}
            onClick={() => setCategory(c)}
          >
            {c === "PAPER_QUALITY" ? "Paper Quality Downtime" : "Equipment Breakdown"}
          </Button>
        ))}
      </div>

      {category === "PAPER_QUALITY" ? (
        <form action={createPaperQualityEntry} className="max-w-lg space-y-4">
          <Field label="Date">
            <input
              type="date"
              name="date"
              defaultValue={todayLocal()}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Vendor">
            <input
              name="vendorName"
              list="vendor-list"
              required
              defaultValue={defaultVendorName}
              placeholder="e.g. Model Supreme Paper Mills"
              className={inputClass}
            />
            <datalist id="vendor-list">
              {vendorNames.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
          <Field label="Issue type">
            <input
              name="issueType"
              list="issue-type-list"
              placeholder="e.g. Side Cuts"
              className={inputClass}
            />
            <datalist id="issue-type-list">
              {COMMON_ISSUE_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Downtime (minutes)">
              <input
                type="number"
                step="0.1"
                name="downtimeMinutes"
                className={inputClass}
              />
            </Field>
            <Field label="Number of stops">
              <input type="number" name="stopsCount" className={inputClass} />
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea name="description" rows={2} className={inputClass} />
          </Field>
          <Field label="Prepared by">
            <input name="preparedBy" className={inputClass} />
          </Field>
          <PhotoInput />
          <Button type="submit">Save entry</Button>
        </form>
      ) : (
        <form action={createEquipmentEntry} className="max-w-lg space-y-4">
          <Field label="Machine">
            <input
              name="machineName"
              list="machine-list"
              required
              defaultValue={defaultMachineName}
              placeholder="e.g. HQM"
              className={inputClass}
            />
            <datalist id="machine-list">
              {machineNames.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
          <Field label="Breakdown start time">
            <input
              type="datetime-local"
              name="startTime"
              defaultValue={nowLocal()}
              required
              className={inputClass}
            />
          </Field>
          <Field label="What happened">
            <textarea name="description" rows={3} className={inputClass} />
          </Field>

          <Field label="Status">
            <select name="status" defaultValue="OPEN" className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s} style={{ color: "#000", backgroundColor: "#fff" }}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Logging this after the fact and it's already fixed? Set the status
            and fill in whatever below you already know — nothing here is
            required, and you can always come back and add more later.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Temporary fix time (if applicable)">
              <input type="datetime-local" name="tempFixedTime" className={inputClass} />
            </Field>
            <Field label="Resolved time (if applicable)">
              <input type="datetime-local" name="resolvedTime" className={inputClass} />
            </Field>
          </div>
          <Field label="Immediate / workaround action taken">
            <textarea name="immediateAction" rows={2} className={inputClass} />
          </Field>
          <Field label="Root cause">
            <textarea name="rootCause" rows={2} className={inputClass} />
          </Field>
          <Field label="Permanent corrective action">
            <textarea name="correctiveAction" rows={2} className={inputClass} />
          </Field>
          <Field label="Results / impact">
            <textarea name="resultsSummary" rows={2} className={inputClass} />
          </Field>

          <Field label="Prepared by">
            <input name="preparedBy" className={inputClass} />
          </Field>
          <PhotoInput />
          <Button type="submit">Save entry</Button>
        </form>
      )}
    </div>
  );
}