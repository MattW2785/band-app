import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 dark:backdrop-blur-sm p-4 shadow-sm dark:shadow-black/20 transition-all duration-200 sm:p-5",
        className
      )}
      {...props}
    />
  );
}
