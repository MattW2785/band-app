import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-300 disabled:shadow-none",
  secondary:
    "bg-white text-zinc-700 border border-zinc-200 shadow-sm hover:bg-zinc-50 hover:border-zinc-300",
  danger:
    "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50",
  ghost: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
