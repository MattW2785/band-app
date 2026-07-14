import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";

export default async function PublicEpkPage() {
  const supabase = await createClient();
  const { data: pressKit } = await supabase.from("press_kit").select("*").maybeSingle();

  if (!pressKit || (!pressKit.band_name && !pressKit.bio_short && !pressKit.bio_long)) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center p-8 text-center text-zinc-500">
        <p>Press kit non ancora configurato.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 print:px-0 print:py-6">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <span className="text-xs uppercase tracking-wide text-zinc-400">Electronic Press Kit</span>
        <PrintButton />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{pressKit.band_name ?? "BandSpace"}</h1>
      {pressKit.bio_short && <p className="mt-2 text-lg text-zinc-600">{pressKit.bio_short}</p>}

      {pressKit.bio_long && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Bio</h2>
          <p className="whitespace-pre-line text-zinc-700">{pressKit.bio_long}</p>
        </section>
      )}

      {pressKit.photo_urls.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Foto</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.photo_urls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-indigo-600 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(pressKit.stage_plot_url || pressKit.tech_rider_url) && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Rider</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.stage_plot_url && (
              <li>
                <a
                  href={pressKit.stage_plot_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-indigo-600 hover:underline"
                >
                  Stage plot
                </a>
              </li>
            )}
            {pressKit.tech_rider_url && (
              <li>
                <a
                  href={pressKit.tech_rider_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-indigo-600 hover:underline"
                >
                  Rider tecnico
                </a>
              </li>
            )}
          </ul>
        </section>
      )}

      {pressKit.audio_links.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Audio</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.audio_links.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-indigo-600 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pressKit.video_links.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Video</h2>
          <ul className="space-y-1 text-sm">
            {pressKit.video_links.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="break-all text-indigo-600 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pressKit.contact_email && (
        <section className="mt-10 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
          Contatti:{" "}
          <a href={`mailto:${pressKit.contact_email}`} className="text-indigo-600 hover:underline">
            {pressKit.contact_email}
          </a>
        </section>
      )}
    </div>
  );
}
