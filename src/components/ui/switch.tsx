import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface SwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  activeClassName?: string;
}

export function Switch({ className, activeClassName = "peer-checked:bg-violet-600", ...props }: SwitchProps) {
  return (
    <label className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className={cn("absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors", activeClassName)} />
      <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
    </label>
  );
}
