import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        colorFor(name),
        className
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
