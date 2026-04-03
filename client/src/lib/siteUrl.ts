/**
 * Public origin used in Supabase `emailRedirectTo` (confirmation / recovery links).
 * Set `VITE_SITE_URL` on Vercel to your live URL (e.g. https://your-app.vercel.app)
 * so emails never point at localhost. Must match entries in Supabase → Auth → URL config.
 */
export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
