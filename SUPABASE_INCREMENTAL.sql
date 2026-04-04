-- ============================================================
-- SWIPESTAKES — Run this on an EXISTING Supabase database only
-- (Do not use full SUPABASE_SCHEMA.sql if types/tables already exist.)
--
-- Safe to run more than once: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- Paste into Supabase → SQL Editor → Run.
-- ============================================================

-- From drizzle/migrations/0001_add_email_confirmed.sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailConfirmed" boolean DEFAULT false NOT NULL;

-- From drizzle/migrations/0002_pick5_unique_indexes.sql
-- PICK5: one row per (user, game day, market) and distinct pick slots 1–5;
-- one settled result row per user per game day.
CREATE UNIQUE INDEX IF NOT EXISTS "daily_picks_user_date_market_uid" ON "daily_picks" ("userId", "pickDate", "marketId");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_picks_user_date_order_uid" ON "daily_picks" ("userId", "pickDate", "pickOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_results_user_date_uid" ON "daily_results" ("userId", "pickDate");

-- ============================================================
-- AUTH → public.users (fixes empty users table in Table Editor)
-- ============================================================
-- If you only created tables via Drizzle, auth signups do NOT copy into
-- public.users unless EITHER:
--   (1) Vercel DATABASE_URL points at this same Supabase DB (API upserts on each request), OR
--   (2) These triggers exist on auth.users (instant sync on signup / email confirm).
--
-- Verify in SQL Editor (not Table Editor — RLS may hide rows there):
--   SELECT count(*) FROM auth.users;
--   SELECT count(*) FROM public.users;
-- If auth.users > 0 but public.users = 0, run the block below.
-- ============================================================

CREATE OR REPLACE FUNCTION public.display_name_from_auth_meta(meta JSONB, email TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    NULLIF(trim(meta->>'full_name'), ''),
    NULLIF(trim(meta->>'name'), ''),
    NULLIF(trim(meta->>'display_name'), ''),
    CASE WHEN email IS NOT NULL AND position('@' IN email) > 0
      THEN split_part(email, '@', 1) END
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_confirmed BOOLEAN;
  v_name TEXT;
  v_provider TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_confirmed := NEW.email_confirmed_at IS NOT NULL;
    v_name := public.display_name_from_auth_meta(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb), NEW.email);
    v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
    INSERT INTO public.users ("openId", name, email, "loginMethod", "emailConfirmed")
    VALUES (NEW.id::text, v_name, NEW.email, v_provider, v_confirmed)
    ON CONFLICT ("openId") DO UPDATE SET
      email = COALESCE(EXCLUDED.email, public.users.email),
      name = COALESCE(EXCLUDED.name, public.users.name),
      "loginMethod" = COALESCE(EXCLUDED."loginMethod", public.users."loginMethod"),
      "emailConfirmed" = EXCLUDED."emailConfirmed",
      "updatedAt" = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.raw_user_meta_data IS DISTINCT FROM OLD.raw_user_meta_data THEN
      v_confirmed := NEW.email_confirmed_at IS NOT NULL;
      v_name := public.display_name_from_auth_meta(COALESCE(NEW.raw_user_meta_data, '{}'::jsonb), NEW.email);
      v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
      UPDATE public.users SET
        email = NEW.email,
        name = COALESCE(v_name, public.users.name),
        "loginMethod" = COALESCE(v_provider, public.users."loginMethod"),
        "emailConfirmed" = v_confirmed,
        "updatedAt" = NOW()
      WHERE "openId" = NEW.id::text;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_from_auth();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_public_user_from_auth();

-- Backfill: copy everyone already in auth.users into public.users (one-time repair)
INSERT INTO public.users ("openId", name, email, "loginMethod", "emailConfirmed")
SELECT
  au.id::text,
  public.display_name_from_auth_meta(COALESCE(au.raw_user_meta_data, '{}'::jsonb), au.email),
  au.email,
  COALESCE(au.raw_app_meta_data->>'provider', 'email'),
  (au.email_confirmed_at IS NOT NULL)
FROM auth.users au
ON CONFLICT ("openId") DO UPDATE SET
  email = COALESCE(EXCLUDED.email, public.users.email),
  name = COALESCE(EXCLUDED.name, public.users.name),
  "loginMethod" = COALESCE(EXCLUDED."loginMethod", public.users."loginMethod"),
  "emailConfirmed" = EXCLUDED."emailConfirmed",
  "updatedAt" = NOW();
