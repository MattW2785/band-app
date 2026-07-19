import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export function LastEdited({
  name,
  at,
  className,
}: {
  name: string | null;
  at: string | null | undefined;
  className?: string;
}) {
  if (!at) return null;

  return (
    <p className={className ?? "text-xs text-zinc-400 dark:text-zinc-500"}>
      Ultima modifica di <span className="font-medium text-zinc-500 dark:text-zinc-400">{name ?? "qualcuno"}</span> ·{" "}
      {format(parseISO(at), "d MMM yyyy 'alle' HH:mm", { locale: it })}
    </p>
  );
}
