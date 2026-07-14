import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { AddTransactionForm } from "@/components/economia/add-transaction-form";
import { DeleteTransactionButton } from "@/components/economia/delete-transaction-button";

const CATEGORY_LABEL: Record<string, string> = {
  cachet: "Cachet",
  attrezzatura: "Attrezzatura",
  trasporto: "Trasporto",
  sala_prove: "Sala prove",
  promozione: "Promozione",
  commissione_booking: "Commissione booking",
  altro: "Altro",
};

export default async function EconomiaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; event?: string }>;
}) {
  await requireSessionProfile();
  const { category, event: eventFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: transactions }, { data: events }, { data: members }] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("events").select("id,title").order("date", { ascending: false }),
    supabase.from("profiles").select("id,full_name").order("full_name"),
  ]);

  const nameById = new Map((members ?? []).map((m) => [m.id, m.full_name]));
  const eventTitleById = new Map((events ?? []).map((e) => [e.id, e.title]));

  const all = transactions ?? [];
  const saldoTotale = all.reduce((sum, t) => sum + (t.type === "entrata" ? t.amount : -t.amount), 0);
  const quotaATesta = members && members.length > 0 ? saldoTotale / members.length : 0;

  const marginePerEvento = new Map<string, number>();
  for (const t of all) {
    if (!t.related_event_id) continue;
    const delta = t.type === "entrata" ? t.amount : -t.amount;
    marginePerEvento.set(t.related_event_id, (marginePerEvento.get(t.related_event_id) ?? 0) + delta);
  }

  const filtered = all.filter((t) => {
    if (category && t.category !== category) return false;
    if (eventFilter && t.related_event_id !== eventFilter) return false;
    return true;
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Economia" description="Entrate, uscite e margine della band" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-zinc-400">Saldo totale</p>
          <p className={`mt-1 text-xl font-semibold ${saldoTotale >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {saldoTotale.toFixed(2)}€
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-zinc-400">Quota a testa</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{quotaATesta.toFixed(2)}€</p>
          <p className="mt-0.5 text-xs text-zinc-500">su {members?.length ?? 0} membri</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-zinc-400">Movimenti registrati</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{all.length}</p>
        </Card>
      </div>

      {marginePerEvento.size > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-medium text-zinc-900">Margine per evento</h2>
          <ul className="space-y-1.5 text-sm">
            {Array.from(marginePerEvento.entries()).map(([eventId, margine]) => (
              <li key={eventId} className="flex items-center justify-between">
                <span className="text-zinc-700">{eventTitleById.get(eventId) ?? "Evento eliminato"}</span>
                <span className={margine >= 0 ? "text-emerald-600" : "text-red-600"}>{margine.toFixed(2)}€</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900">Nuovo movimento</h2>
        <AddTransactionForm events={events ?? []} members={members ?? []} />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium text-zinc-900">Storico movimenti</h2>
          <form className="flex gap-2 text-sm">
            <select name="category" defaultValue={category ?? ""} className="rounded-lg border border-zinc-200 px-2 py-1">
              <option value="">Tutte le categorie</option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select name="event" defaultValue={eventFilter ?? ""} className="rounded-lg border border-zinc-200 px-2 py-1">
              <option value="">Tutti gli eventi</option>
              {events?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg border border-zinc-200 px-3 py-1 hover:bg-zinc-50">
              Filtra
            </button>
          </form>
        </div>

        <ul className="divide-y divide-zinc-100 text-sm">
          {filtered.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-zinc-800">
                  {t.description || CATEGORY_LABEL[t.category]}
                  {t.related_event_id && (
                    <span className="text-zinc-400"> · {eventTitleById.get(t.related_event_id)}</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {format(parseISO(t.date), "d MMM yyyy", { locale: it })}
                  {" · "}
                  <Badge variant="neutral" className="align-middle">
                    {CATEGORY_LABEL[t.category]}
                  </Badge>
                  {t.paid_by && ` · ${nameById.get(t.paid_by) ?? ""}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={t.type === "entrata" ? "text-emerald-600" : "text-red-600"}>
                  {t.type === "entrata" ? "+" : "−"}
                  {t.amount.toFixed(2)}€
                </span>
                <DeleteTransactionButton transactionId={t.id} />
              </div>
            </li>
          ))}

          {filtered.length === 0 && <p className="py-2 text-sm text-zinc-500">Nessun movimento registrato.</p>}
        </ul>
      </Card>
    </div>
  );
}
