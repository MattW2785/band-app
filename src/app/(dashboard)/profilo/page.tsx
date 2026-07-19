import { requireSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./form";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export default async function ProfiloPage() {
  const { profile, email, userId } = await requireSessionProfile();
  const supabase = await createClient();

  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    <div className="max-w-md">
      <PageHeader title="Il mio profilo" />

      <Card className="mb-6">
        <div className="mb-6 flex items-center gap-3">
          <Avatar name={profile.full_name ?? "?"} className="h-12 w-12 text-base" />
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{profile.full_name}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
          </div>
          <Badge variant={profile.role === "admin" ? "indigo" : "neutral"} dot className="ml-auto">
            {profile.role}
          </Badge>
        </div>
        <ProfileForm fullName={profile.full_name ?? ""} />
      </Card>

      <Card>
        <h2 className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">Preferenze notifiche</h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          I promemoria su disponibilità e scadenze pagamenti non sono ancora attivi (richiedono un job schedulato);
          le altre notifiche sono già operative.
        </p>
        <NotificationPreferencesForm preferences={preferences} />
      </Card>
    </div>
  );
}
