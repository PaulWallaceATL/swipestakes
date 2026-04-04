import { ENV } from "./env";

/**
 * Calendar date string (YYYY-MM-DD) for the configured game day in GAME_DAY_TIMEZONE.
 * All clients (web, iOS, Android) share this via the API — do not derive "today" only on device.
 */
export function getGamePickDate(now: Date = new Date()): string {
  const tz = ENV.gameDayTimezone;
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch (e) {
    console.warn("[gameDay] Invalid GAME_DAY_TIMEZONE, falling back to UTC date:", tz, e);
  }
  return now.toISOString().slice(0, 10);
}

export function getGameDayTimezone(): string {
  return ENV.gameDayTimezone;
}
