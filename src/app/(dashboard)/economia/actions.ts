"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-log";

const TransactionSchema = z.object({
  type: z.enum(["entrata", "uscita"]),
  amount: z.coerce.number().positive({ message: "Inserisci un importo valido." }),
  description: z.string().trim().optional(),
  category: z.enum(["cachet", "attrezzatura", "trasporto", "sala_prove", "promozione", "commissione_booking", "altro"]),
  related_event_id: z.string().optional(),
  date: z.string().min(1, { message: "Inserisci una data." }),
  paid_by: z.string().optional(),
});

export type TransactionFormState = { error?: string } | undefined;

export async function addTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const { userId } = await requireSessionProfile();

  const parsed = TransactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    category: formData.get("category"),
    related_event_id: formData.get("related_event_id") || undefined,
    date: formData.get("date"),
    paid_by: formData.get("paid_by") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    type: parsed.data.type,
    amount: parsed.data.amount,
    description: parsed.data.description || null,
    category: parsed.data.category,
    related_event_id: parsed.data.related_event_id || null,
    date: parsed.data.date,
    paid_by: parsed.data.paid_by || null,
    created_by: userId,
    updated_by: userId,
  });

  if (error) {
    return { error: "Impossibile salvare il movimento. Riprova." };
  }

  const sign = parsed.data.type === "entrata" ? "+" : "-";
  await logActivity(
    supabase,
    userId,
    "created",
    "transaction",
    parsed.data.description || parsed.data.category,
    `${sign}${parsed.data.amount}€`
  );

  revalidatePath("/economia");
  return undefined;
}

export async function deleteTransaction(formData: FormData) {
  const { userId } = await requireSessionProfile();
  const id = String(formData.get("id"));

  const supabase = await createClient();
  const { data: transaction } = await supabase.from("transactions").select("*").eq("id", id).single();
  await supabase.from("transactions").delete().eq("id", id);
  await logActivity(
    supabase,
    userId,
    "deleted",
    "transaction",
    transaction?.description || transaction?.category,
    transaction ? `${transaction.amount}€` : undefined,
    transaction ? { row: transaction } : null
  );

  revalidatePath("/economia");
}
