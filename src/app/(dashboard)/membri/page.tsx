import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { InviteMemberForm } from "./form";
import { DeleteMemberButton } from "./delete-member-button";
import { HiddenCheckbox } from "./hidden-checkbox";
import { SuspendCheckbox } from "./suspend-checkbox";

function memberStatus(m: { hidden: boolean; suspended: boolean }) {
  if (m.suspended) return { label: "Bloccato", variant: "danger" as const };
  if (m.hidden) return { label: "Invisibile", variant: "warning" as const };
  return { label: "Attivo", variant: "success" as const };
}

export default async function MembriPage() {
  const { userId } = await requireAdmin();

  const supabase = await createClient();
  const { data: members } = await supabase.from("profiles").select("*").order("created_at");

  return (
    <div className="max-w-2xl">
      <PageHeader title="Membri" description="Gestisci l'accesso della band" />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Invita un nuovo membro</h2>
        <InviteMemberForm />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Membri della band</h2>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {members?.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center gap-2.5">
                <Avatar name={m.full_name ?? "?"} />
                <span className="text-zinc-800 dark:text-zinc-200">{m.full_name ?? "(invito in attesa)"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.role === "admin" ? "indigo" : "neutral"} dot>
                  {m.role}
                </Badge>
                <Badge variant={memberStatus(m).variant} dot>
                  Status: {memberStatus(m).label}
                </Badge>
                {m.id !== userId && (
                  <SuspendCheckbox key={`suspended-${m.suspended}`} memberId={m.id} suspended={m.suspended} />
                )}
                {m.id !== userId && <HiddenCheckbox key={`hidden-${m.hidden}`} memberId={m.id} hidden={m.hidden} />}
                {m.id !== userId && (
                  <DeleteMemberButton memberId={m.id} memberName={m.full_name ?? "questo membro"} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
