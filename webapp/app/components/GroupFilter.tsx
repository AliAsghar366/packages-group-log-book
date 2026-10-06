"use client";

import { useRouter } from "next/navigation";
import { inputClass } from "@/app/components/ui";

export default function GroupFilter({
  groups,
  selected,
  basePath,
}: {
  groups: string[];
  selected?: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      className={`${inputClass} max-w-xs`}
      value={selected ?? ""}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value ? `${basePath}?group=${encodeURIComponent(value)}` : basePath);
      }}
    >
      <option value="" style={{ color: "#000", backgroundColor: "#fff" }}>
        All groups
      </option>
      {groups.map((g) => (
        <option key={g} value={g} style={{ color: "#000", backgroundColor: "#fff" }}>
          {g}
        </option>
      ))}
    </select>
  );
}