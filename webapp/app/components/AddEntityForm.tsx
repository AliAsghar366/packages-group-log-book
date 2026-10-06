"use client";

import { useState } from "react";
import { Button, inputClass } from "@/app/components/ui";

export default function AddEntityForm({
  action,
  buttonLabel,
  placeholder,
}: {
  action: (formData: FormData) => void | Promise<void>;
  buttonLabel: string;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="glass" onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input
        name="name"
        required
        autoFocus
        placeholder={placeholder}
        className={`${inputClass} w-48`}
      />
      <Button type="submit">Save</Button>
      <Button type="button" variant="glass" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
