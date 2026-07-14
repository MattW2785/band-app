import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { describeActivity, isRestorable } from "@/lib/activity-log";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RestoreButton } from "./restore-button";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  await requireAdmin();
  const { member } = await searchParams;
  const supabase = await createClient();

  const [{ data: entries }, { data: members }] = await Promise.all([
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("profiles").select("id,full_name").order("full_name"),
  ]);

  const nameById = new Map((members ?? []).map((m) => [m.id, m.full_name]));
  const filtered = member ? (entries ?? []).filter((e) => e.user_id === member) : (entries ?? []);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Registro attività" description="Tutte le azioni compiute dai membri della band" />

      <Card className="mb-4">
        <form className="flex items-center gap-2 text-sm">
          <label className="text-zinc-600">Filtra per membro:</label>
          <select name="member" defaultValue={member ?? ""} className="rounded-lg border border-zinc-200 px-2 py-1">
            <option value="">Tutti</option>
            {members?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-zinc-200 px-3 py-1 hover:bg-zinc-50">
            Filtra
          </button>
        </form>
      </Card>

      <Card>
        <ul className="divide-y divide-zinc-100">
          {filtered.map((entry) => {
            const name = entry.user_id ? nameById.get(entry.user_id) : null;
            return (
              <li key={entry.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div className="flex items-start gap-3">
                  <Avatar name={name ?? "?"} className="mt-0.5 h-7 w-7 shrink-0" />
                  <div>
                    <p className="text-zinc-800">
                      <span className="font-medium">{name ?? "Qualcuno"}</span> {describeActivity(entry)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {format(parseISO(entry.created_at), "d MMM yyyy 'alle' HH:mm", { locale: it })}
                      {entry.restored_at && (
                        <Badge variant="success" className="ml-2 align-middle">
                          ripristinato
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                {isRestorable(entry) && <RestoreButton logId={entry.id} />}
              </li>
            );
          })}

          {filtered.length === 0 && <p className="py-2 text-sm text-zinc-500">Nessuna attività registrata ancora.</p>}
        </ul>
      </Card>
    </div>
  );
}
