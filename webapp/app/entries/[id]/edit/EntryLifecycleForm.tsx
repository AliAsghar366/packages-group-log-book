"use client";

import { updateEquipmentEntry } from "@/app/lib/actions";
import { Button, Field, inputClass, PhotoInput } from "@/app/components/ui";
import { STATUSES, STATUS_LABELS } from "@/app/lib/constants";

function nowLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EntryLifecycleForm({
  id,
  status,
  tempFixedTime,
  resolvedTime,
  immediateAction,
  rootCause,
  correctiveAction,
  resultsSummary,
}: {
  id: string;
  status: string;
  tempFixedTime: Date | null;
  resolvedTime: Date | null;
  immediateAction: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  resultsSummary: string | null;
}) {
  return (
    <form action={updateEquipmentEntry} className="max-w-lg space-y-4">
      <input type="hidden" name="id" value={id} />

      <Field label="Status">
        <select name="status" defaultValue={status} className={inputClass}>
          {STATUSES.map((s) => (
            <option key={s} value={s} style={{ color: "#000", backgroundColor: "#fff" }}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
        Set the status directly — you can move it forward, back, or fix a
        mistake at any time. Fill in whichever fields below apply; nothing
        here is required.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Temporary fix time">
          <input
            type="datetime-local"
            name="tempFixedTime"
            defaultValue={toLocalInput(tempFixedTime) || nowLocal()}
            className={inputClass}
          />
        </Field>
        <Field label="Resolved time">
          <input
            type="datetime-local"
            name="resolvedTime"
            defaultValue={toLocalInput(resolvedTime) || nowLocal()}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Immediate / workaround action taken">
        <textarea
          name="immediateAction"
          rows={2}
          defaultValue={immediateAction ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Root cause">
        <textarea
          name="rootCause"
          rows={2}
          defaultValue={rootCause ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Permanent corrective action">
        <textarea
          name="correctiveAction"
          rows={2}
          defaultValue={correctiveAction ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Results / impact">
        <textarea
          name="resultsSummary"
          rows={2}
          defaultValue={resultsSummary ?? ""}
          className={inputClass}
        />
      </Field>
      <PhotoInput label="Add more photos (optional)" />

      <Button type="submit" variant="primary">
        Save update
      </Button>
    </form>
  );
}