import Link from "next/link";
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  type Status,
  type Category,
} from "@/app/lib/constants";
import { CATEGORY_COLOR, STATUS_COLOR, INK } from "@/app/lib/palette";
import Sparkline from "@/app/components/charts/Sparkline";
import { toggleEntryResolved } from "@/app/lib/actions";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/40 bg-white/20 p-4 shadow-xl shadow-black/10 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/40 before:via-white/5 before:to-transparent dark:border-white/15 dark:bg-white/[0.06] dark:shadow-black/40 dark:before:from-white/10 dark:before:via-transparent ${className}`}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** Recent-period values, oldest first, for an inline sparkline. */
  trend?: number[];
  /** Signed % change vs. the prior period; color follows direction (up = attention for downtime metrics). */
  delta?: number;
}) {
  const hasTrend = trend && trend.length >= 2;
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wide" style={{ color: INK.muted }}>
          {label}
        </div>
        {hasTrend && (
          <Sparkline values={trend} color={INK.muted} accentColor={CATEGORY_COLOR.PAPER_QUALITY} />
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: INK.muted }}>
        {typeof delta === "number" && Number.isFinite(delta) && (
          <span
            className="font-medium"
            style={{ color: delta > 0 ? STATUS_COLOR.critical : STATUS_COLOR.good }}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"} {Math.abs(delta).toFixed(0)}%
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </Card>
  );
}

export function ResolveToggleButton({
  id,
  status,
  redirectTo,
}: {
  id: string;
  status: string;
  redirectTo: string;
}) {
  const isResolved = status === "RESOLVED";
  return (
    <form action={toggleEntryResolved} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="currentStatus" value={status} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
        style={
          isResolved
            ? { backgroundColor: "rgba(208,59,59,0.12)", color: STATUS_COLOR.critical }
            : { backgroundColor: "rgba(12,163,12,0.12)", color: STATUS_COLOR.good }
        }
      >
        {isResolved ? "Mark Unresolved" : "Mark Resolved"}
      </button>
    </form>
  );
}

// Status identity is a dot beside neutral-ink text, never colored text --
// keeps low-contrast hues (warning/serious) legible on the light surface.
const STATUS_DOT: Record<Status, string> = {
  OPEN: STATUS_COLOR.critical,
  TEMP_FIXED: STATUS_COLOR.warning,
  RESOLVED: STATUS_COLOR.good,
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as Status;
  const dot = STATUS_DOT[s] ?? INK.muted;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium backdrop-blur dark:bg-white/10">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      <span style={{ color: INK.secondary }}>{STATUS_LABELS[s] ?? status}</span>
    </span>
  );
}

const CATEGORY_DOT: Record<Category, string> = {
  PAPER_QUALITY: CATEGORY_COLOR.PAPER_QUALITY,
  EQUIPMENT_PROCESS: CATEGORY_COLOR.EQUIPMENT_PROCESS,
};

export function CategoryBadge({ category }: { category: string }) {
  const c = category as Category;
  const dot = CATEGORY_DOT[c] ?? INK.muted;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium backdrop-blur dark:bg-white/10">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      <span style={{ color: INK.secondary }}>{CATEGORY_LABELS[c] ?? category}</span>
    </span>
  );
}

export function Meter({
  label,
  value,
  max,
  formatValue,
}: {
  label: string;
  value: number;
  max: number;
  formatValue?: (v: number) => string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const severity =
    pct >= 75 ? STATUS_COLOR.good : pct >= 40 ? STATUS_COLOR.warning : STATUS_COLOR.critical;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs" style={{ color: INK.secondary }}>
        <span>{label}</span>
        <span className="font-medium">{formatValue ? formatValue(value) : `${value}/${max}`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(42,120,214,0.15)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: severity }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/30 bg-white/20 p-8 text-center text-sm text-black/50 backdrop-blur-xl dark:border-white/15 dark:bg-white/5 dark:text-white/50">
      {message}
    </div>
  );
}

const BUTTON_VARIANTS = {
  primary:
    "bg-blue-600/90 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-600 backdrop-blur",
  success:
    "bg-green-600/90 text-white shadow-lg shadow-green-600/20 hover:bg-green-600 backdrop-blur",
  warning:
    "bg-amber-600/90 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-600 backdrop-blur",
  glass:
    "border border-white/30 bg-white/30 text-black/80 backdrop-blur-xl hover:bg-white/50 dark:border-white/15 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15",
} as const;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
}) {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof BUTTON_VARIANTS;
}) {
  return (
    <Link
      href={href}
      className={`inline-block rounded-xl px-4 py-2 text-sm font-medium transition-colors ${BUTTON_VARIANTS[variant]}`}
    >
      {children}
    </Link>
  );
}

export const inputClass =
  "w-full rounded-xl border border-white/30 bg-white/30 px-3 py-2 text-sm text-black outline-none backdrop-blur-xl transition-colors placeholder:text-black/40 focus:border-blue-500/60 focus:bg-white/50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:bg-white/10";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function PhotoInput({ label = "Photos (optional)" }: { label?: string }) {
  return (
    <Field label={label}>
      <input
        type="file"
        name="photos"
        multiple
        accept="image/*"
        className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-black/10 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:bg-white/10`}
      />
    </Field>
  );
}