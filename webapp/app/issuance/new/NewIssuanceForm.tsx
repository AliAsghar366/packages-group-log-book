"use client";

import { createIssuance } from "@/app/lib/actions";
import { COMMON_PAPER_TYPES } from "@/app/lib/constants";
import { Button, Field, inputClass } from "@/app/components/ui";

function todayLocal(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewIssuanceForm({
  vendorNames,
  defaultVendorName,
}: {
  vendorNames: string[];
  defaultVendorName?: string;
}) {
  return (
    <form action={createIssuance} className="max-w-lg space-y-4">
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
          className={inputClass}
        />
        <datalist id="vendor-list">
          {vendorNames.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </Field>
      <Field label="Description">
        <input
          name="description"
          placeholder="e.g. KRAFT BROWN LOCAL 110 - 2184"
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Deckle">
          <input type="number" name="deckle" className={inputClass} />
        </Field>
        <Field label="Paper type">
          <input name="paperType" list="paper-type-list" className={inputClass} />
          <datalist id="paper-type-list">
            {COMMON_PAPER_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field label="Net quantity">
        <input type="number" step="0.01" name="netQty" required className={inputClass} />
      </Field>
      <Button type="submit">Save receipt</Button>
    </form>
  );
}