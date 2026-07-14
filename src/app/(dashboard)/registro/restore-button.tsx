"use client";

import { useActionState } from "react";
import { restoreFromLog } from "./actions";
import { Button } from "@/components/ui/button";

export function RestoreButton({ logId }: { logId: string }) {
  const [state, formAction, pending] = useActionState(restoreFromLog, undefined);

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="log_id" value={logId} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Ripristino…" : "Ripristina"}
      </Button>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
