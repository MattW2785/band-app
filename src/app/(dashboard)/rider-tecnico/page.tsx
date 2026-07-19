import { createClient } from "@/lib/supabase/server";
import { requireSessionProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TechRiderForm } from "@/components/rider-tecnico/tech-rider-form";
import { AddChannelForm } from "@/components/rider-tecnico/add-channel-form";
import { DeleteChannelButton } from "@/components/rider-tecnico/delete-channel-button";
import { getHiddenUserIds } from "@/lib/visibility";

export default async function RiderTecnicoPage() {
  const { userId, profile } = await requireSessionProfile();
  const supabase = await createClient();

  const [hiddenIds, { data: techRider }, { data: rawChannels }] = await Promise.all([
    getHiddenUserIds(supabase, userId, profile.role === "admin"),
    supabase.from("tech_rider").select("*").maybeSingle(),
    supabase.from("tech_rider_channels").select("*").order("channel_number", { nullsFirst: false }),
  ]);

  const channels = (rawChannels ?? []).filter((c) => !c.created_by || !hiddenIds.has(c.created_by));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Rider tecnico" description="Requisiti tecnici da comunicare a locali e fonici" />

      <Card className="mb-6 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400">
        Il rider tecnico elenca ciò che il locale deve garantire per il concerto: impianto audio, monitor,
        alimentazione, e l&apos;elenco dei canali (channel list) con microfoni/DI da preparare.
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Requisiti generali</h2>
        <TechRiderForm initial={techRider} />
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Aggiungi un canale</h2>
        <AddChannelForm />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-100">Channel list</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400">
                <th className="py-1 pr-2 font-normal">Ch.</th>
                <th className="py-1 pr-2 font-normal">Sorgente</th>
                <th className="py-1 pr-2 font-normal">Mic/DI</th>
                <th className="py-1 pr-2 font-normal">Asta</th>
                <th className="py-1 pr-2 font-normal">Note</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1.5 pr-2 text-zinc-800 dark:text-zinc-200">{c.channel_number ?? "—"}</td>
                  <td className="py-1.5 pr-2 text-zinc-800 dark:text-zinc-200">{c.source}</td>
                  <td className="py-1.5 pr-2 text-zinc-600 dark:text-zinc-400">{c.mic_or_di ?? "—"}</td>
                  <td className="py-1.5 pr-2 text-zinc-600 dark:text-zinc-400">{c.stand ?? "—"}</td>
                  <td className="py-1.5 pr-2 text-zinc-600 dark:text-zinc-400">{c.notes ?? "—"}</td>
                  <td className="py-1.5">
                    <DeleteChannelButton id={c.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {channels.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Nessun canale aggiunto ancora.</p>}
      </Card>
    </div>
  );
}
