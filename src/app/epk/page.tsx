import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

export default async function PublicEpkPage() {
  const supabase = await createClient();
  const [{ data: pressKit }, { data: stagePlotItems }, { data: techRider }, { data: techRiderChannels }] =
    await Promise.all([
      supabase.from("press_kit").select("*").maybeSingle(),
      supabase.from("stage_plot_items").select("*").order("created_at"),
      supabase.from("tech_rider").select("*").maybeSingle(),
      supabase.from("tech_rider_channels").select("*").order("channel_number", { nullsFirst: false }),
    ]);

  if (!pressKit || (!pressKit.band_name && !pressKit.bio_short && !pressKit.bio_long)) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center p-8 text-center text-zinc-500 dark:text-zinc-400">
        <p>Press kit non ancora configurato.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 print:px-0 print:py-6">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <span className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Electronic Press Kit</span>
        <PrintButton />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{pressKit.band_name ?? "BandSpace"}</h1>
      {pressKit.bio_short && <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{pressKit.bio_short}</p>}

      {pressKit.bio_long && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Bio</h2>
          <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">{pressKit.bio_long}</p>
        </section>
      )}

      {pressKit.photo_urls.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Foto</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.photo_urls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-indigo-600 dark:text-indigo-400 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stagePlotItems && stagePlotItems.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Stage plot</h2>
          <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {stagePlotItems.map((item) => (
              <li key={item.id}>
                {item.instrument} — {item.position}
                {item.notes && <span className="text-zinc-500 dark:text-zinc-400"> ({item.notes})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(techRider?.pa_requirements ||
        techRider?.monitor_requirements ||
        techRider?.power_requirements ||
        techRider?.notes ||
        (techRiderChannels && techRiderChannels.length > 0)) && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Rider tecnico</h2>
          <dl className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            {techRider?.pa_requirements && (
              <div>
                <dt className="font-medium text-zinc-900 dark:text-zinc-100">Impianto audio</dt>
                <dd className="whitespace-pre-line">{techRider.pa_requirements}</dd>
              </div>
            )}
            {techRider?.monitor_requirements && (
              <div>
                <dt className="font-medium text-zinc-900 dark:text-zinc-100">Monitor</dt>
                <dd className="whitespace-pre-line">{techRider.monitor_requirements}</dd>
              </div>
            )}
            {techRider?.power_requirements && (
              <div>
                <dt className="font-medium text-zinc-900 dark:text-zinc-100">Alimentazione</dt>
                <dd className="whitespace-pre-line">{techRider.power_requirements}</dd>
              </div>
            )}
            {techRider?.notes && (
              <div>
                <dt className="font-medium text-zinc-900 dark:text-zinc-100">Note</dt>
                <dd className="whitespace-pre-line">{techRider.notes}</dd>
              </div>
            )}
          </dl>

          {techRiderChannels && techRiderChannels.length > 0 && (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400">
                  <th className="py-1 pr-2 font-normal">Ch.</th>
                  <th className="py-1 pr-2 font-normal">Sorgente</th>
                  <th className="py-1 pr-2 font-normal">Mic/DI</th>
                  <th className="py-1 pr-2 font-normal">Asta</th>
                  <th className="py-1 font-normal">Note</th>
                </tr>
              </thead>
              <tbody>
                {techRiderChannels.map((c) => (
                  <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1 pr-2 text-zinc-700 dark:text-zinc-300">{c.channel_number ?? "—"}</td>
                    <td className="py-1 pr-2 text-zinc-700 dark:text-zinc-300">{c.source}</td>
                    <td className="py-1 pr-2 text-zinc-600 dark:text-zinc-400">{c.mic_or_di ?? "—"}</td>
                    <td className="py-1 pr-2 text-zinc-600 dark:text-zinc-400">{c.stand ?? "—"}</td>
                    <td className="py-1 text-zinc-600 dark:text-zinc-400">{c.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {pressKit.audio_links.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Audio</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.audio_links.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-indigo-600 dark:text-indigo-400 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pressKit.video_links.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Video</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.video_links.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-indigo-600 dark:text-indigo-400 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pressKit.contact_email && (
        <section className="mt-10 border-t border-zinc-200 dark:border-zinc-800 pt-6 text-sm text-zinc-600 dark:text-zinc-400">
          Contatti:{" "}
          <a href={`mailto:${pressKit.contact_email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {pressKit.contact_email}
          </a>
        </section>
      )}
    </div>
  );
}
