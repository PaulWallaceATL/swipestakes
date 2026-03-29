CREATE TYPE "public"."clip_source" AS ENUM('youtube', 'espn', 'manual');--> statement-breakpoint
CREATE TYPE "public"."credit_tx_type" AS ENUM('daily_reward', 'signup_bonus', 'redeem', 'admin_grant', 'referral');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('sports', 'politics', 'geopolitical', 'finance', 'tech', 'culture', 'entertainment', 'science', 'daily');--> statement-breakpoint
CREATE TYPE "public"."event_source" AS ENUM('kalshi', 'polymarket', 'swipestakes', 'manual');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'scheduled', 'live', 'closed', 'resolved', 'voided');--> statement-breakpoint
CREATE TYPE "public"."loyalty_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "public"."market_state" AS ENUM('open', 'suspended', 'closed', 'awaiting_resolution', 'resolved', 'disputed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."market_type" AS ENUM('binary', 'multi_outcome', 'spread', 'total', 'player_prop');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('market_move', 'bet_settled', 'market_open', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_side" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('open', 'partial', 'filled', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."order_type_enum" AS ENUM('limit', 'market');--> statement-breakpoint
CREATE TYPE "public"."pick_choice" AS ENUM('yes', 'no', 'over', 'under', 'skip');--> statement-breakpoint
CREATE TYPE "public"."pick_market_type" AS ENUM('binary', 'total', 'player_prop');--> statement-breakpoint
CREATE TYPE "public"."pick_result" AS ENUM('correct', 'incorrect', 'skipped', 'pending');--> statement-breakpoint
CREATE TYPE "public"."pick_style" AS ENUM('high_confidence', 'balanced', 'contrarian');--> statement-breakpoint
CREATE TYPE "public"."position_status" AS ENUM('active', 'won', 'lost', 'cashed_out', 'voided');--> statement-breakpoint
CREATE TYPE "public"."redeem_status" AS ENUM('pending', 'processing', 'fulfilled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."resolution_dispute_status" AS ENUM('open', 'upheld', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."resolution_proposal_status" AS ENUM('pending', 'challenged', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."resolution_source" AS ENUM('official_box_score', 'manual_admin', 'oracle', 'third_party_feed', 'kalshi', 'polymarket');--> statement-breakpoint
CREATE TYPE "public"."risk_style" AS ENUM('safe', 'moderate', 'aggressive');--> statement-breakpoint
CREATE TYPE "public"."score_tier" AS ENUM('perfect', 'great', 'good', 'miss');--> statement-breakpoint
CREATE TYPE "public"."settlement_type" AS ENUM('cash', 'credits');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('dark', 'light', 'system');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_status" AS ENUM('pending', 'completed', 'failed', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_type" AS ENUM('deposit', 'withdrawal', 'bet_buy', 'bet_sell', 'payout', 'refund', 'promo', 'fee');--> statement-breakpoint
CREATE TABLE "app_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "notification_type" DEFAULT 'system' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"marketId" integer,
	"positionId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clips" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(255) NOT NULL,
	"source" "clip_source" DEFAULT 'youtube' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"videoUrl" text NOT NULL,
	"thumbnailUrl" text,
	"channelName" varchar(255),
	"sport" varchar(64),
	"duration" integer,
	"viewCount" integer DEFAULT 0,
	"likeCount" integer DEFAULT 0,
	"linkedMarketId" integer,
	"tags" json DEFAULT '[]'::json,
	"publishedAt" timestamp,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clips_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" integer NOT NULL,
	"balanceBefore" integer NOT NULL,
	"balanceAfter" integer NOT NULL,
	"type" "credit_tx_type" NOT NULL,
	"description" text,
	"referenceId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"balance" integer DEFAULT 10 NOT NULL,
	"lifetimeEarned" integer DEFAULT 0 NOT NULL,
	"lifetimeRedeemed" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credits_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "daily_picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"marketId" integer NOT NULL,
	"pickDate" varchar(10) NOT NULL,
	"pickOrder" integer NOT NULL,
	"choice" "pick_choice" NOT NULL,
	"questionSnapshot" text,
	"marketType" "pick_market_type" DEFAULT 'binary' NOT NULL,
	"result" "pick_result" DEFAULT 'pending' NOT NULL,
	"creditsAwarded" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"pickDate" varchar(10) NOT NULL,
	"totalPicks" integer DEFAULT 0 NOT NULL,
	"correctPicks" integer DEFAULT 0 NOT NULL,
	"skippedPicks" integer DEFAULT 0 NOT NULL,
	"creditsEarned" integer DEFAULT 0 NOT NULL,
	"scoreTier" "score_tier" DEFAULT 'miss' NOT NULL,
	"settledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(255),
	"source" "event_source" DEFAULT 'swipestakes' NOT NULL,
	"category" "event_category" NOT NULL,
	"leagueOrTopic" varchar(128),
	"title" text NOT NULL,
	"description" text,
	"startTime" timestamp,
	"endTime" timestamp,
	"status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"sourceRefs" json DEFAULT '[]'::json,
	"tags" json DEFAULT '[]'::json,
	"imageUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "loyalty_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"milestoneId" varchar(64) NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" text,
	"pointsAwarded" integer DEFAULT 0 NOT NULL,
	"creditsAwarded" integer DEFAULT 0 NOT NULL,
	"earnedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"currentStreak" integer DEFAULT 0 NOT NULL,
	"longestStreak" integer DEFAULT 0 NOT NULL,
	"lastPlayedDate" varchar(10),
	"totalPicksPlaced" integer DEFAULT 0 NOT NULL,
	"totalDaysPlayed" integer DEFAULT 0 NOT NULL,
	"loyaltyPoints" integer DEFAULT 0 NOT NULL,
	"lifetimeLoyaltyPoints" integer DEFAULT 0 NOT NULL,
	"tier" "loyalty_tier" DEFAULT 'bronze' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_stats_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "market_price_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketId" integer NOT NULL,
	"outcomeId" integer NOT NULL,
	"bestBid" numeric(6, 4),
	"bestAsk" numeric(6, 4),
	"midpoint" numeric(6, 4),
	"lastTradePrice" numeric(6, 4),
	"volume" numeric(14, 2) DEFAULT '0.00',
	"openInterest" numeric(14, 2) DEFAULT '0.00',
	"capturedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventId" integer NOT NULL,
	"externalId" varchar(255),
	"source" "event_source" DEFAULT 'swipestakes' NOT NULL,
	"sourceUrl" text,
	"question" text NOT NULL,
	"marketType" "market_type" DEFAULT 'binary' NOT NULL,
	"rulesText" text,
	"resolutionSourceType" "resolution_source" DEFAULT 'manual_admin' NOT NULL,
	"resolutionDeadline" timestamp,
	"tradingOpenAt" timestamp,
	"tradingCloseAt" timestamp,
	"settlementType" "settlement_type" DEFAULT 'cash' NOT NULL,
	"state" "market_state" DEFAULT 'open' NOT NULL,
	"yesPrice" numeric(6, 4) DEFAULT '0.5000',
	"noPrice" numeric(6, 4) DEFAULT '0.5000',
	"volume24h" numeric(14, 2) DEFAULT '0.00',
	"openInterest" numeric(14, 2) DEFAULT '0.00',
	"spreadLine" numeric(6, 2),
	"totalLine" numeric(6, 2),
	"homeOdds" varchar(16),
	"awayOdds" varchar(16),
	"overOdds" varchar(16),
	"underOdds" varchar(16),
	"aiConfidence" integer DEFAULT 60,
	"aiReasoning" text,
	"rawData" json,
	"fetchedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "markets_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"marketId" integer NOT NULL,
	"outcomeId" integer NOT NULL,
	"side" "order_side" NOT NULL,
	"price" numeric(6, 4) NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"filledQuantity" numeric(12, 4) DEFAULT '0.0000' NOT NULL,
	"orderType" "order_type_enum" DEFAULT 'market' NOT NULL,
	"status" "order_status" DEFAULT 'open' NOT NULL,
	"signedPayload" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketId" integer NOT NULL,
	"label" varchar(64) NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"currentPrice" numeric(6, 4) DEFAULT '0.5000',
	"impliedProbability" numeric(6, 4) DEFAULT '0.5000',
	"isWinner" boolean,
	"settlementValue" numeric(6, 4),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"marketId" integer NOT NULL,
	"outcomeId" integer NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"avgCost" numeric(6, 4) NOT NULL,
	"totalStaked" numeric(12, 2) NOT NULL,
	"potentialPayout" numeric(12, 2) NOT NULL,
	"realizedPnl" numeric(12, 2) DEFAULT '0.00',
	"unrealizedPnl" numeric(12, 2) DEFAULT '0.00',
	"redeemedAmount" numeric(12, 2) DEFAULT '0.00',
	"status" "position_status" DEFAULT 'active' NOT NULL,
	"marketQuestion" text,
	"outcomeLabel" varchar(64),
	"eventTitle" text,
	"eventCategory" varchar(64),
	"oddsAtPlacement" varchar(16),
	"placedAt" timestamp DEFAULT now() NOT NULL,
	"settledAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "redeem_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"giftCardType" varchar(64) NOT NULL,
	"giftCardLabel" varchar(128) NOT NULL,
	"creditCost" integer NOT NULL,
	"status" "redeem_status" DEFAULT 'pending' NOT NULL,
	"deliveryEmail" varchar(320),
	"fulfilledAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resolution_disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposalId" integer NOT NULL,
	"challengedBy" integer NOT NULL,
	"reason" text NOT NULL,
	"evidenceBlob" json,
	"status" "resolution_dispute_status" DEFAULT 'open' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "resolution_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketId" integer NOT NULL,
	"proposedOutcomeId" integer NOT NULL,
	"proposedBy" varchar(64) NOT NULL,
	"proposedAt" timestamp DEFAULT now() NOT NULL,
	"evidenceBlob" json,
	"sourceSnapshot" text,
	"challengeWindowEndsAt" timestamp,
	"status" "resolution_proposal_status" DEFAULT 'pending' NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "saved_markets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"marketId" integer NOT NULL,
	"savedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"marketId" integer NOT NULL,
	"outcomeId" integer NOT NULL,
	"buyOrderId" integer NOT NULL,
	"sellOrderId" integer,
	"userId" integer NOT NULL,
	"price" numeric(6, 4) NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"totalCost" numeric(12, 2) NOT NULL,
	"feeAmount" numeric(8, 4) DEFAULT '0.0000',
	"feeCurrency" varchar(8) DEFAULT 'USD',
	"executedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"displayName" varchar(128),
	"avatarUrl" text,
	"notificationsEnabled" boolean DEFAULT true NOT NULL,
	"emailNotifications" boolean DEFAULT false NOT NULL,
	"defaultBetAmount" numeric(8, 2) DEFAULT '10.00',
	"preferredCategories" json DEFAULT '[]'::json,
	"interests" json DEFAULT '[]'::json,
	"shoppingPreferences" json DEFAULT '[]'::json,
	"pickStyle" "pick_style" DEFAULT 'balanced' NOT NULL,
	"riskStyle" "risk_style" DEFAULT 'moderate' NOT NULL,
	"notificationPrefs" json DEFAULT '[]'::json,
	"theme" "theme" DEFAULT 'dark' NOT NULL,
	"onboardingCompletedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"walletId" integer NOT NULL,
	"userId" integer NOT NULL,
	"type" "wallet_tx_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balanceBefore" numeric(12, 2) NOT NULL,
	"balanceAfter" numeric(12, 2) NOT NULL,
	"status" "wallet_tx_status" DEFAULT 'completed' NOT NULL,
	"referenceId" varchar(255),
	"referenceType" varchar(64),
	"description" text,
	"stripePaymentIntentId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"cashBalance" numeric(12, 2) DEFAULT '1000.00' NOT NULL,
	"promoCredits" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"withdrawableBalance" numeric(12, 2) DEFAULT '1000.00' NOT NULL,
	"lockedBalance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(8) DEFAULT 'USD' NOT NULL,
	"stripeCustomerId" varchar(255),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_userId_unique" UNIQUE("userId")
);
