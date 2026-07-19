"use client";

import { deleteTransaction } from "@/app/(dashboard)/economia/actions";

export function DeleteTransactionButton({ transactionId }: { transactionId: string }) {
  return (
    <form
      action={deleteTransaction}
      onSubmit={(e) => {
        if (!confirm("Eliminare questo movimento?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={transactionId} />
      <button type="submit" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
        Elimina
      </button>
    </form>
  );
}
