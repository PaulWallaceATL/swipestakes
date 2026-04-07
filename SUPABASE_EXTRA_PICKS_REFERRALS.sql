-- Run in Supabase SQL Editor after deploying the new code.
-- Safe to run multiple times (IF NOT EXISTS / ON CONFLICT).

-- Enums
DO $$ BEGIN CREATE TYPE extra_pick_source AS ENUM ('purchase', 'referral'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE referral_status AS ENUM ('pending', 'completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extra pick purchases (buy $5 packs or earn via referrals)
CREATE TABLE IF NOT EXISTS extra_pick_purchases (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "pickDate" VARCHAR(10) NOT NULL,
  source extra_pick_source NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_extra_picks_user_date ON extra_pick_purchases("userId", "pickDate");

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  "referrerId" INTEGER NOT NULL,
  "referredUserId" INTEGER,
  "referralCode" VARCHAR(32) NOT NULL,
  status referral_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals("referrerId");
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals("referralCode");

-- User referral codes (one per user)
CREATE TABLE IF NOT EXISTS user_referral_codes (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  code VARCHAR(32) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
