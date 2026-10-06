export const CATEGORIES = ["PAPER_QUALITY", "EQUIPMENT_PROCESS"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  PAPER_QUALITY: "Paper Quality",
  EQUIPMENT_PROCESS: "Equipment / Process",
};

export const STATUSES = ["OPEN", "TEMP_FIXED", "RESOLVED"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  OPEN: "Open",
  TEMP_FIXED: "Temporarily Fixed",
  RESOLVED: "Resolved",
};

// Seen in the historical workbooks; new/custom values can still be typed in.
export const COMMON_ISSUE_TYPES = [
  "Side Cuts",
  "Joint Break/Improper Joint",
  "Open Joint",
];

export const COMMON_PAPER_TYPES = [
  "HPFL",
  "LKB",
  "HPK",
  "KLB",
  "C-B",
];

/**
 * Groups machines by shared name pattern (e.g. all "Lute" machines, all
 * "ASM" units together); anything with no shared pattern is its own group.
 */
export function machineFamily(name: string): string {
  if (/lute/i.test(name)) return "Lute Machines";
  if (/^ASM/i.test(name)) return "ASM (Auto Stacker)";
  return name;
}

/**
 * Groups vendors by shared company-name suffix (e.g. "...Paper & Board
 * Mills", "...Paper Mill(s)"); anything with no shared pattern is its own
 * group -- same approach as machineFamily, applied to vendor names.
 */
export function vendorFamily(name: string): string {
  if (/packaging$/i.test(name)) return "Packaging";
  if (/board mills$/i.test(name)) return "Paper & Board Mills";
  if (/paper mills?$/i.test(name)) return "Paper Mills";
  if (/paper boards$/i.test(name)) return "Paper Boards";
  return name;
}