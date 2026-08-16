import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const fieldClass =
  // text-base (16px) below sm prevents iOS Safari from auto-zooming the page on focus;
  // it only needs to drop to text-sm once the layout has room to spare.
  "w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-base sm:text-sm text-zinc-900 dark:text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300", className)} {...props} />;
}
