// Reference palette (dataviz skill) -- validated categorical order, sequential
// blue ramp, and fixed status colors. Values are the light-mode steps; charts
// render as static SVG so we tune for the glass-card light surface.

export const CATEGORY_COLOR = {
  PAPER_QUALITY: "#2a78d6", // categorical slot 1 (blue)
  EQUIPMENT_PROCESS: "#eb6834", // categorical slot 2 (orange)
} as const;

// Sequential blue, light -> dark (steps 150/300/450/550/650 from the palette ramp)
export const SEQUENTIAL_BLUE = [
  "#b7d3f6",
  "#6da7ec",
  "#2a78d6",
  "#1c5cab",
  "#104281",
];

export const STATUS_COLOR = {
  good: "#0ca30c", // Resolved
  warning: "#fab219", // Temporarily Fixed
  critical: "#d03b3b", // Open
} as const;

// Theme-aware: these resolve against the CSS custom properties defined in
// globals.css (light/dark values), so text and chart ink stay legible in
// both themes instead of being pinned to the light-mode hex.
export const INK = {
  primary: "var(--ink-primary)",
  secondary: "var(--ink-secondary)",
  muted: "var(--ink-muted)",
};

export const GRID_LINE = "var(--grid-line)";
export const CHART_SURFACE = "#fcfcfb";

/** Pick a sequential shade by rank (0 = highest magnitude, darkest). */
export function sequentialShade(rank: number, total: number): string {
  if (total <= 1) return SEQUENTIAL_BLUE[SEQUENTIAL_BLUE.length - 1];
  const idx = Math.round(
    (rank / (total - 1)) * (SEQUENTIAL_BLUE.length - 1)
  );
  // highest rank (0) = darkest = last index
  return SEQUENTIAL_BLUE[SEQUENTIAL_BLUE.length - 1 - idx];
}