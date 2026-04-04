/**
 * /api/healthcheck — verifies the critical env vars and DB connectivity
 * that PICK5 + user sync depend on. Hit this after every deploy.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  const checks: Record<string, boolean | string> = {};

  checks.DATABASE_URL = Boolean(process.env.DATABASE_URL);
  checks.SUPABASE_URL = Boolean(process.env.SUPABASE_URL);
  checks.SUPABASE_SERVICE_ROLE_KEY = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  checks.VITE_SUPABASE_URL = Boolean(process.env.VITE_SUPABASE_URL);
  checks.VITE_SUPABASE_ANON_KEY = Boolean(process.env.VITE_SUPABASE_ANON_KEY);

  let dbOk = false;
  let dbError = "";
  if (process.env.DATABASE_URL) {
    try {
      const postgres = (await import("postgres")).default;
      const url = process.env.DATABASE_URL;
      const sql = postgres(url, {
        max: 1,
        idle_timeout: 5,
        connect_timeout: 5,
        ssl: url.includes("supabase") ? "require" : undefined,
        prepare: url.includes("pooler.supabase.com") ? false : true,
      });
      const rows = await sql`SELECT count(*) AS n FROM public.users`;
      dbOk = true;
      checks.users_count = String(rows[0]?.n ?? 0);
      await sql.end();
    } catch (e: any) {
      dbError = e?.message ?? String(e);
    }
  } else {
    dbError = "DATABASE_URL not set";
  }
  checks.db_connected = dbOk;
  if (dbError) checks.db_error = dbError;

  const allGood =
    checks.DATABASE_URL === true &&
    checks.SUPABASE_URL === true &&
    checks.SUPABASE_SERVICE_ROLE_KEY === true &&
    dbOk;

  res.statusCode = allGood ? 200 : 503;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ ok: allGood, checks }, null, 2));
}
