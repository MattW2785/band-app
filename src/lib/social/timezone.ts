export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Rome";

// Il server gira in UTC (es. su Vercel): senza specificare timeZone, toLocaleString
// userebbe il fuso del server invece di quello dell'utente.
export function formatInAppTimezone(date: Date, timeZone: string = APP_TIMEZONE): string {
  return date.toLocaleString("it-IT", { timeZone });
}

// Converte un valore da <input type="datetime-local"> (senza timezone, nel fuso APP_TIMEZONE)
// in un Date UTC corretto, calcolando l'offset del fuso in quello specifico istante (gestisce l'ora legale).
export function localInputToUtcDate(localDateTime: string, timeZone: string = APP_TIMEZONE): Date {
  const naiveUtc = new Date(`${localDateTime}:00.000Z`);
  const offsetMs = getTimeZoneOffsetMs(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offsetMs);
}

// Restringe un Date (UTC) al formato per <input type="datetime-local"> nel fuso indicato.
export function utcDateToLocalInput(date: Date, timeZone: string = APP_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Chiave "YYYY-MM-DD" nel fuso indicato, usata per raggruppare i post per giorno di calendario.
export function localDateKey(date: Date, timeZone: string = APP_TIMEZONE): string {
  return utcDateToLocalInput(date, timeZone).slice(0, 10);
}

// Solo l'orario "HH:mm" nel fuso indicato.
export function formatTimeInAppTimezone(date: Date, timeZone: string = APP_TIMEZONE): string {
  return utcDateToLocalInput(date, timeZone).slice(11, 16);
}

// Offset (in ms) tra UTC e il fuso indicato, calcolato all'istante `date`.
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - date.getTime();
}
