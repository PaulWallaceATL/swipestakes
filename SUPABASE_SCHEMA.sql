-- ============================================================
-- SWIPESTAKES — Supabase PostgreSQL Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE event_source AS ENUM ('kalshi', 'polymarket', 'swipestakes', 'manual');
CREATE TYPE event_category AS ENUM (
  'sports', 'politics', 'geopolitical',
  'finance', 'tech', 'culture',
  'entertainment', 'science', 'daily'
);
CREATE TYPE event_status AS ENUM ('draft', 'scheduled', 'live', 'closed', 'resolved', 'voided');
CREATE TYPE market_type AS ENUM ('binary', 'multi_outcome', 'spread', 'total', 'player_prop');
CREATE TYPE market_state AS ENUM (
  'open', 'suspended', 'closed',
  'awaiting_resolution', 'resolved', 'disputed', 'voided'
);
CREATE TYPE resolution_source AS ENUM (
  'official_box_score', 'manual_admin',
  'oracle', 'third_party_feed', 'kalshi', 'polymarket'
);
CREATE TYPE settlement_type AS ENUM ('cash', 'credits');
CREATE TYPE position_status AS ENUM ('active', 'won', 'lost', 'cashed_out', 'voided');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_type_enum AS ENUM ('limit', 'market');
CREATE TYPE order_status AS ENUM ('open', 'partial', 'filled', 'cancelled', 'expired');
CREATE TYPE wallet_tx_type AS ENUM (
  'deposit', 'withdrawal', 'bet_buy', 'bet_sell',
  'payout', 'refund', 'promo', 'fee'
);
CREATE TYPE wallet_tx_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE clip_source AS ENUM ('youtube', 'espn', 'manual');
CREATE TYPE resolution_proposal_status AS ENUM ('pending', 'challenged', 'accepted', 'rejected');
CREATE TYPE resolution_dispute_status AS ENUM ('open', 'upheld', 'dismissed');
CREATE TYPE pick_choice AS ENUM ('yes', 'no', 'over', 'under', 'skip');
CREATE TYPE pick_result AS ENUM ('correct', 'incorrect', 'skipped', 'pending');
CREATE TYPE pick_market_type AS ENUM ('binary', 'total', 'player_prop');
CREATE TYPE score_tier AS ENUM ('perfect', 'great', 'good', 'miss');
CREATE TYPE credit_tx_type AS ENUM (
  'daily_reward', 'signup_bonus', 'redeem', 'admin_grant', 'referral'
);
CREATE TYPE redeem_status AS ENUM ('pending', 'processing', 'fulfilled', 'failed');
CREATE TYPE notification_type AS ENUM ('market_move', 'bet_settled', 'market_open', 'system');
CREATE TYPE pick_style AS ENUM ('high_confidence', 'balanced', 'contrarian');
CREATE TYPE risk_style AS ENUM ('safe', 'moderate', 'aggressive');
CREATE TYPE theme AS ENUM ('dark', 'light', 'system');
CREATE TYPE loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- ─── USERS ───────────────────────────────────────────────────
-- NOTE: openId maps to Supabase auth.users.id (UUID as text)
-- When using Supabase Auth, set openId = auth.uid()::text on insert

CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  "openId"    VARCHAR(64)  NOT NULL UNIQUE,  -- Supabase auth.users.id
  name        TEXT,
  email       VARCHAR(320),
  "loginMethod" VARCHAR(64),
  "emailConfirmed" BOOLEAN   NOT NULL DEFAULT false,  -- true once auth.users.email_confirmed_at is set
  role        user_role    NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── WALLET ──────────────────────────────────────────────────

CREATE TABLE wallets (
  id                   SERIAL PRIMARY KEY,
  "userId"             INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "cashBalance"        DECIMAL(12,2) NOT NULL DEFAULT 1000.00,
  "promoCredits"       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  "withdrawableBalance" DECIMAL(12,2) NOT NULL DEFAULT 1000.00,
  "lockedBalance"      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency             VARCHAR(8)   NOT NULL DEFAULT 'USD',
  "stripeCustomerId"   VARCHAR(255),
  "updatedAt"          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── WALLET TRANSACTIONS ─────────────────────────────────────

CREATE TABLE wallet_transactions (
  id                      SERIAL PRIMARY KEY,
  "walletId"              INTEGER          NOT NULL REFERENCES wallets(id),
  "userId"                INTEGER          NOT NULL REFERENCES users(id),
  type                    wallet_tx_type   NOT NULL,
  amount                  DECIMAL(12,2)    NOT NULL,
  "balanceBefore"         DECIMAL(12,2)    NOT NULL,
  "balanceAfter"          DECIMAL(12,2)    NOT NULL,
  status                  wallet_tx_status NOT NULL DEFAULT 'completed',
  "referenceId"           VARCHAR(255),
  "referenceType"         VARCHAR(64),
  description             TEXT,
  "stripePaymentIntentId" VARCHAR(255),
  "createdAt"             TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ─── EVENTS ──────────────────────────────────────────────────

CREATE TABLE events (
  id             SERIAL PRIMARY KEY,
  "externalId"   VARCHAR(255)     UNIQUE,
  source         event_source     NOT NULL DEFAULT 'swipestakes',
  category       event_category   NOT NULL,
  "leagueOrTopic" VARCHAR(128),
  title          TEXT             NOT NULL,
  description    TEXT,
  "startTime"    TIMESTAMP,
  "endTime"      TIMESTAMP,
  status         event_status     NOT NULL DEFAULT 'scheduled',
  "sourceRefs"   JSONB            NOT NULL DEFAULT '[]',
  tags           JSONB            NOT NULL DEFAULT '[]',
  "imageUrl"     TEXT,
  "createdAt"    TIMESTAMP        NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ─── MARKETS ─────────────────────────────────────────────────

CREATE TABLE markets (
  id                     SERIAL PRIMARY KEY,
  "eventId"              INTEGER           NOT NULL REFERENCES events(id),
  "externalId"           VARCHAR(255)      UNIQUE,
  source                 event_source      NOT NULL DEFAULT 'swipestakes',
  "sourceUrl"            TEXT,
  question               TEXT              NOT NULL,
  "marketType"           market_type       NOT NULL DEFAULT 'binary',
  "rulesText"            TEXT,
  "resolutionSourceType" resolution_source NOT NULL DEFAULT 'manual_admin',
  "resolutionDeadline"   TIMESTAMP,
  "tradingOpenAt"        TIMESTAMP,
  "tradingCloseAt"       TIMESTAMP,
  "settlementType"       settlement_type   NOT NULL DEFAULT 'cash',
  state                  market_state      NOT NULL DEFAULT 'open',
  "yesPrice"             DECIMAL(6,4)      DEFAULT 0.5000,
  "noPrice"              DECIMAL(6,4)      DEFAULT 0.5000,
  "volume24h"            DECIMAL(14,2)     DEFAULT 0.00,
  "openInterest"         DECIMAL(14,2)     DEFAULT 0.00,
  "spreadLine"           DECIMAL(6,2),
  "totalLine"            DECIMAL(6,2),
  "homeOdds"             VARCHAR(16),
  "awayOdds"             VARCHAR(16),
  "overOdds"             VARCHAR(16),
  "underOdds"            VARCHAR(16),
  "aiConfidence"         INTEGER           DEFAULT 60,
  "aiReasoning"          TEXT,
  "rawData"              JSONB,
  "fetchedAt"            TIMESTAMP         NOT NULL DEFAULT NOW(),
  "createdAt"            TIMESTAMP         NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMP         NOT NULL DEFAULT NOW()
);

-- ─── OUTCOMES ────────────────────────────────────────────────

CREATE TABLE outcomes (
  id                   SERIAL PRIMARY KEY,
  "marketId"           INTEGER      NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  label                VARCHAR(64)  NOT NULL,
  "sortOrder"          INTEGER      NOT NULL DEFAULT 0,
  "currentPrice"       DECIMAL(6,4) DEFAULT 0.5000,
  "impliedProbability" DECIMAL(6,4) DEFAULT 0.5000,
  "isWinner"           BOOLEAN,
  "settlementValue"    DECIMAL(6,4),
  "createdAt"          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── POSITIONS ───────────────────────────────────────────────

CREATE TABLE positions (
  id                SERIAL PRIMARY KEY,
  "userId"          INTEGER         NOT NULL REFERENCES users(id),
  "marketId"        INTEGER         NOT NULL REFERENCES markets(id),
  "outcomeId"       INTEGER         NOT NULL REFERENCES outcomes(id),
  quantity          DECIMAL(12,4)   NOT NULL,
  "avgCost"         DECIMAL(6,4)    NOT NULL,
  "totalStaked"     DECIMAL(12,2)   NOT NULL,
  "potentialPayout" DECIMAL(12,2)   NOT NULL,
  "realizedPnl"     DECIMAL(12,2)   DEFAULT 0.00,
  "unrealizedPnl"   DECIMAL(12,2)   DEFAULT 0.00,
  "redeemedAmount"  DECIMAL(12,2)   DEFAULT 0.00,
  status            position_status NOT NULL DEFAULT 'active',
  "marketQuestion"  TEXT,
  "outcomeLabel"    VARCHAR(64),
  "eventTitle"      TEXT,
  "eventCategory"   VARCHAR(64),
  "oddsAtPlacement" VARCHAR(16),
  "placedAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  "settledAt"       TIMESTAMP
);

-- ─── MARKET PRICE SNAPSHOTS ──────────────────────────────────

CREATE TABLE market_price_snapshots (
  id               SERIAL PRIMARY KEY,
  "marketId"       INTEGER      NOT NULL REFERENCES markets(id),
  "outcomeId"      INTEGER      NOT NULL REFERENCES outcomes(id),
  "bestBid"        DECIMAL(6,4),
  "bestAsk"        DECIMAL(6,4),
  midpoint         DECIMAL(6,4),
  "lastTradePrice" DECIMAL(6,4),
  volume           DECIMAL(14,2) DEFAULT 0.00,
  "openInterest"   DECIMAL(14,2) DEFAULT 0.00,
  "capturedAt"     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── RESOLUTION PROPOSALS ────────────────────────────────────

CREATE TABLE resolution_proposals (
  id                      SERIAL PRIMARY KEY,
  "marketId"              INTEGER                     NOT NULL REFERENCES markets(id),
  "proposedOutcomeId"     INTEGER                     NOT NULL REFERENCES outcomes(id),
  "proposedBy"            VARCHAR(64)                 NOT NULL,
  "proposedAt"            TIMESTAMP                   NOT NULL DEFAULT NOW(),
  "evidenceBlob"          JSONB,
  "sourceSnapshot"        TEXT,
  "challengeWindowEndsAt" TIMESTAMP,
  status                  resolution_proposal_status  NOT NULL DEFAULT 'pending',
  "resolvedAt"            TIMESTAMP
);

-- ─── RESOLUTION DISPUTES ─────────────────────────────────────

CREATE TABLE resolution_disputes (
  id            SERIAL PRIMARY KEY,
  "proposalId"  INTEGER                    NOT NULL REFERENCES resolution_proposals(id),
  "challengedBy" INTEGER                   NOT NULL REFERENCES users(id),
  reason        TEXT                       NOT NULL,
  "evidenceBlob" JSONB,
  status        resolution_dispute_status  NOT NULL DEFAULT 'open',
  "createdAt"   TIMESTAMP                  NOT NULL DEFAULT NOW(),
  "resolvedAt"  TIMESTAMP
);

-- ─── CLIPS ───────────────────────────────────────────────────

CREATE TABLE clips (
  id               SERIAL PRIMARY KEY,
  "externalId"     VARCHAR(255) NOT NULL UNIQUE,
  source           clip_source  NOT NULL DEFAULT 'youtube',
  title            TEXT         NOT NULL,
  description      TEXT,
  "videoUrl"       TEXT         NOT NULL,
  "thumbnailUrl"   TEXT,
  "channelName"    VARCHAR(255),
  sport            VARCHAR(64),
  duration         INTEGER,
  "viewCount"      INTEGER      DEFAULT 0,
  "likeCount"      INTEGER      DEFAULT 0,
  "linkedMarketId" INTEGER      REFERENCES markets(id),
  tags             JSONB        NOT NULL DEFAULT '[]',
  "publishedAt"    TIMESTAMP,
  "fetchedAt"      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── SAVED MARKETS ───────────────────────────────────────────

CREATE TABLE saved_markets (
  id        SERIAL PRIMARY KEY,
  "userId"  INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "marketId" INTEGER  NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  "savedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "marketId")
);

-- ─── ORDERS ──────────────────────────────────────────────────

CREATE TABLE orders (
  id               SERIAL PRIMARY KEY,
  "userId"         INTEGER         NOT NULL REFERENCES users(id),
  "marketId"       INTEGER         NOT NULL REFERENCES markets(id),
  "outcomeId"      INTEGER         NOT NULL REFERENCES outcomes(id),
  side             order_side      NOT NULL,
  price            DECIMAL(6,4)    NOT NULL,
  quantity         DECIMAL(12,4)   NOT NULL,
  "filledQuantity" DECIMAL(12,4)   NOT NULL DEFAULT 0.0000,
  "orderType"      order_type_enum NOT NULL DEFAULT 'market',
  status           order_status    NOT NULL DEFAULT 'open',
  "signedPayload"  TEXT,
  "expiresAt"      TIMESTAMP,
  "createdAt"      TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── TRADES ──────────────────────────────────────────────────

CREATE TABLE trades (
  id            SERIAL PRIMARY KEY,
  "marketId"    INTEGER      NOT NULL REFERENCES markets(id),
  "outcomeId"   INTEGER      NOT NULL REFERENCES outcomes(id),
  "buyOrderId"  INTEGER      NOT NULL REFERENCES orders(id),
  "sellOrderId" INTEGER      REFERENCES orders(id),
  "userId"      INTEGER      NOT NULL REFERENCES users(id),
  price         DECIMAL(6,4) NOT NULL,
  quantity      DECIMAL(12,4) NOT NULL,
  "totalCost"   DECIMAL(12,2) NOT NULL,
  "feeAmount"   DECIMAL(8,4)  DEFAULT 0.0000,
  "feeCurrency" VARCHAR(8)    DEFAULT 'USD',
  "executedAt"  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── USER SETTINGS ───────────────────────────────────────────

CREATE TABLE user_settings (
  id                      SERIAL PRIMARY KEY,
  "userId"                INTEGER     NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "displayName"           VARCHAR(128),
  "avatarUrl"             TEXT,
  "notificationsEnabled"  BOOLEAN     NOT NULL DEFAULT TRUE,
  "emailNotifications"    BOOLEAN     NOT NULL DEFAULT FALSE,
  "defaultBetAmount"      DECIMAL(8,2) DEFAULT 10.00,
  "preferredCategories"   JSONB       NOT NULL DEFAULT '[]',
  interests               JSONB       NOT NULL DEFAULT '[]',
  "shoppingPreferences"   JSONB       NOT NULL DEFAULT '[]',
  "pickStyle"             pick_style  NOT NULL DEFAULT 'balanced',
  "riskStyle"             risk_style  NOT NULL DEFAULT 'moderate',
  "notificationPrefs"     JSONB       NOT NULL DEFAULT '[]',
  theme                   theme       NOT NULL DEFAULT 'dark',
  "onboardingCompletedAt" TIMESTAMP,
  "createdAt"             TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── LOYALTY STATS ───────────────────────────────────────────

CREATE TABLE loyalty_stats (
  id                      SERIAL PRIMARY KEY,
  "userId"                INTEGER      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "currentStreak"         INTEGER      NOT NULL DEFAULT 0,
  "longestStreak"         INTEGER      NOT NULL DEFAULT 0,
  "lastPlayedDate"        VARCHAR(10),
  "totalPicksPlaced"      INTEGER      NOT NULL DEFAULT 0,
  "totalDaysPlayed"       INTEGER      NOT NULL DEFAULT 0,
  "loyaltyPoints"         INTEGER      NOT NULL DEFAULT 0,
  "lifetimeLoyaltyPoints" INTEGER      NOT NULL DEFAULT 0,
  tier                    loyalty_tier NOT NULL DEFAULT 'bronze',
  "createdAt"             TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── LOYALTY MILESTONES ──────────────────────────────────────

CREATE TABLE loyalty_milestones (
  id               SERIAL PRIMARY KEY,
  "userId"         INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "milestoneId"    VARCHAR(64)  NOT NULL,
  title            VARCHAR(128) NOT NULL,
  description      TEXT,
  "pointsAwarded"  INTEGER      NOT NULL DEFAULT 0,
  "creditsAwarded" INTEGER      NOT NULL DEFAULT 0,
  "earnedAt"       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── APP NOTIFICATIONS ───────────────────────────────────────

CREATE TABLE app_notifications (
  id           SERIAL PRIMARY KEY,
  "userId"     INTEGER           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         notification_type NOT NULL DEFAULT 'system',
  title        VARCHAR(255)      NOT NULL,
  body         TEXT              NOT NULL,
  read         BOOLEAN           NOT NULL DEFAULT FALSE,
  "marketId"   INTEGER           REFERENCES markets(id),
  "positionId" INTEGER           REFERENCES positions(id),
  "createdAt"  TIMESTAMP         NOT NULL DEFAULT NOW()
);

-- ─── CREDITS ─────────────────────────────────────────────────

CREATE TABLE credits (
  id                 SERIAL PRIMARY KEY,
  "userId"           INTEGER   NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance            INTEGER   NOT NULL DEFAULT 10,
  "lifetimeEarned"   INTEGER   NOT NULL DEFAULT 0,
  "lifetimeRedeemed" INTEGER   NOT NULL DEFAULT 0,
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── DAILY PICKS ─────────────────────────────────────────────

CREATE TABLE daily_picks (
  id                 SERIAL PRIMARY KEY,
  "userId"           INTEGER          NOT NULL REFERENCES users(id),
  "marketId"         INTEGER          NOT NULL REFERENCES markets(id),
  "pickDate"         VARCHAR(10)      NOT NULL,  -- 'YYYY-MM-DD' UTC
  "pickOrder"        INTEGER          NOT NULL,  -- 1-5
  choice             pick_choice      NOT NULL,
  "questionSnapshot" TEXT,
  "marketType"       pick_market_type NOT NULL DEFAULT 'binary',
  result             pick_result      NOT NULL DEFAULT 'pending',
  "creditsAwarded"   INTEGER          NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ─── DAILY RESULTS ───────────────────────────────────────────

CREATE TABLE daily_results (
  id              SERIAL PRIMARY KEY,
  "userId"        INTEGER    NOT NULL REFERENCES users(id),
  "pickDate"      VARCHAR(10) NOT NULL,
  "totalPicks"    INTEGER    NOT NULL DEFAULT 0,
  "correctPicks"  INTEGER    NOT NULL DEFAULT 0,
  "skippedPicks"  INTEGER    NOT NULL DEFAULT 0,
  "creditsEarned" INTEGER    NOT NULL DEFAULT 0,
  "scoreTier"     score_tier NOT NULL DEFAULT 'miss',
  "settledAt"     TIMESTAMP,
  "createdAt"     TIMESTAMP  NOT NULL DEFAULT NOW(),
  UNIQUE ("userId", "pickDate")
);

-- ─── CREDIT TRANSACTIONS ─────────────────────────────────────

CREATE TABLE credit_transactions (
  id              SERIAL PRIMARY KEY,
  "userId"        INTEGER         NOT NULL REFERENCES users(id),
  amount          INTEGER         NOT NULL,
  "balanceBefore" INTEGER         NOT NULL,
  "balanceAfter"  INTEGER         NOT NULL,
  type            credit_tx_type  NOT NULL,
  description     TEXT,
  "referenceId"   VARCHAR(255),
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── REDEEM REQUESTS ─────────────────────────────────────────

CREATE TABLE redeem_requests (
  id               SERIAL PRIMARY KEY,
  "userId"         INTEGER       NOT NULL REFERENCES users(id),
  "giftCardType"   VARCHAR(64)   NOT NULL,
  "giftCardLabel"  VARCHAR(128)  NOT NULL,
  "creditCost"     INTEGER       NOT NULL,
  status           redeem_status NOT NULL DEFAULT 'pending',
  "deliveryEmail"  VARCHAR(320),
  "fulfilledAt"    TIMESTAMP,
  "createdAt"      TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_markets_event_id       ON markets("eventId");
CREATE INDEX idx_markets_state          ON markets(state);
CREATE INDEX idx_markets_trading_close  ON markets("tradingCloseAt");
CREATE INDEX idx_positions_user_id      ON positions("userId");
CREATE INDEX idx_positions_market_id    ON positions("marketId");
CREATE INDEX idx_daily_picks_user_date  ON daily_picks("userId", "pickDate");
CREATE INDEX idx_daily_picks_market_id  ON daily_picks("marketId");
CREATE INDEX idx_daily_results_user     ON daily_results("userId");
CREATE INDEX idx_credit_tx_user         ON credit_transactions("userId");
CREATE INDEX idx_app_notif_user         ON app_notifications("userId");
CREATE INDEX idx_market_snapshots       ON market_price_snapshots("marketId", "capturedAt");
CREATE INDEX idx_clips_sport            ON clips(sport);
CREATE INDEX idx_clips_market           ON clips("linkedMarketId");

-- ─── ROW LEVEL SECURITY (RLS) ────────────────────────────────
-- Enable RLS on all user-facing tables.
-- Users can only read/write their own rows.
-- Admin role bypasses all policies via service_role key.

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_picks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_stats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_milestones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE redeem_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_markets       ENABLE ROW LEVEL SECURITY;

-- Users table: each user sees only their own row
CREATE POLICY "users_own_row" ON users
  FOR ALL USING (auth.uid()::text = "openId");

-- Wallets: own row only
CREATE POLICY "wallets_own_row" ON wallets
  FOR ALL USING (
    "userId" = (SELECT id FROM users WHERE "openId" = auth.uid()::text)
  );

-- Daily picks: own rows only
CREATE POLICY "daily_picks_own_rows" ON daily_picks
  FOR ALL USING (
    "userId" = (SELECT id FROM users WHERE "openId" = auth.uid()::text)
  );

-- Daily results: own rows only
CREATE POLICY "daily_results_own_rows" ON daily_results
  FOR ALL USING (
    "userId" = (SELECT id FROM users WHERE "openId" = auth.uid()::text)
  );

-- Credits: own row only
CREATE POLICY "credits_own_row" ON credits
  FOR ALL USING (
    "userId" = (SELECT id FROM users WHERE "openId" = auth.uid()::text)
  );

-- Markets and events are public-read (no auth needed to browse picks)
ALTER TABLE events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read"  ON events  FOR SELECT USING (true);
CREATE POLICY "markets_public_read" ON markets FOR SELECT USING (true);
CREATE POLICY "outcomes_public_read" ON outcomes FOR SELECT USING (true);
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

-- ─── HELPER FUNCTION: auto-create wallet + credits on signup ─

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Create wallet with 1000 starting cash
  INSERT INTO wallets ("userId") VALUES (NEW.id)
  ON CONFLICT ("userId") DO NOTHING;

  -- Create credits with 10 free starting credits
  INSERT INTO credits ("userId") VALUES (NEW.id)
  ON CONFLICT ("userId") DO NOTHING;

  -- Create loyalty stats
  INSERT INTO loyalty_stats ("userId") VALUES (NEW.id)
  ON CONFLICT ("userId") DO NOTHING;

  -- Create user settings
  INSERT INTO user_settings ("userId") VALUES (NEW.id)
  ON CONFLICT ("userId") DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: fires after a new row is inserted into users
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── AUTH → PUBLIC.USERS SYNC (signup + email confirmation) ─
-- Inserts a public.users row as soon as auth.users is created (before or after email confirm).
-- Sets "emailConfirmed" from auth.users.email_confirmed_at; updates on confirmation.

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

-- ─── DONE ────────────────────────────────────────────────────
-- All 18 tables, enums, indexes, RLS policies, and triggers created.
-- Next: run the migration guide steps in MIGRATION_GUIDE.md
