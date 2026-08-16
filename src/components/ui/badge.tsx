import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

const variants = {
  neutral: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  indigo: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  accent: "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-200 dark:ring-violet-500/20",
  success: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
};

const dotColors = {
  neutral: "bg-zinc-400 dark:bg-zinc-500",
  indigo: "bg-indigo-500",
  accent: "bg-violet-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  dot?: boolean;
  children?: ReactNode;
}

export function Badge({ variant = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}
