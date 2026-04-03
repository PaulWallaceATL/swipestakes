import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import * as db from "../db";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

let _admin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!_admin && ENV.supabaseUrl && ENV.supabaseServiceRoleKey) {
    _admin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

function bearerToken(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const t = h.slice(7).trim();
  return t.length > 0 ? t : null;
}

function loginMethodFromUser(user: { app_metadata?: Record<string, unknown> }): string {
  const p = user.app_metadata?.provider;
  return typeof p === "string" && p.length > 0 ? p : "email";
}

function displayNameFromUser(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): string | null {
  const meta = user.user_metadata ?? {};
  const full =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.display_name === "string" && meta.display_name);
  if (full) return full;
  if (user.email?.includes("@")) return user.email.split("@")[0] ?? null;
  return null;
}

/**
 * Resolves the app user from a Supabase access token (Authorization: Bearer).
 * Returns null when unauthenticated — public tRPC procedures still work.
 */
export async function authenticateRequest(req: Request): Promise<User | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  const signedInAt = new Date();
  const emailConfirmed = Boolean(user.email_confirmed_at);
  await db.upsertUser({
    openId: user.id,
    email: user.email ?? null,
    name: displayNameFromUser(user),
    loginMethod: loginMethodFromUser(user),
    emailConfirmed,
    lastSignedIn: signedInAt,
  });

  const row = await db.getUserByOpenId(user.id);
  return row ?? null;
}
