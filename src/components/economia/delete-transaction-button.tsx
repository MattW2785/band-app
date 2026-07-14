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
      <button type="submit" className="text-xs text-zinc-400 hover:text-red-500">
        Elimina
      </button>
    </form>
  );
}
