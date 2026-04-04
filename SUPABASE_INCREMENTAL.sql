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
