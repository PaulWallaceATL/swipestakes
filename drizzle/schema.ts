import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ─── ENUMS ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const eventSourceEnum = pgEnum("event_source", ["kalshi", "polymarket", "swipestakes", "manual"]);
export const eventCategoryEnum = pgEnum("event_category", [
  "sports", "politics", "geopolitical",
  "finance", "tech", "culture",
  "entertainment", "science", "daily",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft", "scheduled", "live",
  "closed", "resolved", "voided",
]);
export const marketTypeEnum = pgEnum("market_type", [
  "binary", "multi_outcome", "spread", "total", "player_prop",
]);
export const marketStateEnum = pgEnum("market_state", [
  "open", "suspended", "closed",
  "awaiting_resolution", "resolved",
  "disputed", "voided",
]);
export const resolutionSourceEnum = pgEnum("resolution_source", [
  "official_box_score", "manual_admin",
  "oracle", "third_party_feed", "kalshi", "polymarket",
]);
export const settlementTypeEnum = pgEnum("settlement_type", ["cash", "credits"]);
export const positionStatusEnum = pgEnum("position_status", ["active", "won", "lost", "cashed_out", "voided"]);
export const orderSideEnum = pgEnum("order_side", ["buy", "sell"]);
export const orderTypeEnum = pgEnum("order_type_enum", ["limit", "market"]);
export const orderStatusEnum = pgEnum("order_status", ["open", "partial", "filled", "cancelled", "expired"]);
export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "deposit", "withdrawal",
  "bet_buy", "bet_sell",
  "payout", "refund", "promo", "fee",
]);
export const walletTxStatusEnum = pgEnum("wallet_tx_status", ["pending", "completed", "failed", "reversed"]);
export const clipSourceEnum = pgEnum("clip_source", ["youtube", "espn", "manual"]);
export const resolutionProposalStatusEnum = pgEnum("resolution_proposal_status", [
  "pending", "challenged", "accepted", "rejected",
]);
export const resolutionDisputeStatusEnum = pgEnum("resolution_dispute_status", ["open", "upheld", "dismissed"]);
export const pickChoiceEnum = pgEnum("pick_choice", ["yes", "no", "over", "under", "skip"]);
export const pickResultEnum = pgEnum("pick_result", ["correct", "incorrect", "skipped", "pending"]);
export const pickMarketTypeEnum = pgEnum("pick_market_type", ["binary", "total", "player_prop"]);
export const scoreTierEnum = pgEnum("score_tier", ["perfect", "great", "good", "miss"]);
export const creditTxTypeEnum = pgEnum("credit_tx_type", [
  "daily_reward", "signup_bonus", "redeem", "admin_grant", "referral",
]);
export const redeemStatusEnum = pgEnum("redeem_status", ["pending", "processing", "fulfilled", "failed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["market_move", "bet_settled", "market_open", "system"]);
export const pickStyleEnum = pgEnum("pick_style", ["high_confidence", "balanced", "contrarian"]);
export const riskStyleEnum = pgEnum("risk_style", ["safe", "moderate", "aggressive"]);
export const themeEnum = pgEnum("theme", ["dark", "light", "system"]);
export const loyaltyTierEnum = pgEnum("loyalty_tier", ["bronze", "silver", "gold", "platinum"]);

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  emailConfirmed: boolean("emailConfirmed").default(false).notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── WALLET ───────────────────────────────────────────────────────────────────
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  cashBalance: decimal("cashBalance", { precision: 12, scale: 2 }).default("1000.00").notNull(),
  promoCredits: decimal("promoCredits", { precision: 12, scale: 2 }).default("0.00").notNull(),
  withdrawableBalance: decimal("withdrawableBalance", { precision: 12, scale: 2 }).default("1000.00").notNull(),
  lockedBalance: decimal("lockedBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

// ─── WALLET TRANSACTIONS ──────────────────────────────────────────────────────
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("walletId").notNull(),
  userId: integer("userId").notNull(),
  type: walletTxTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceBefore: decimal("balanceBefore", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  status: walletTxStatusEnum("status").default("completed").notNull(),
  referenceId: varchar("referenceId", { length: 255 }),
  referenceType: varchar("referenceType", { length: 64 }),
  description: text("description"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;

// ─── EVENTS ───────────────────────────────────────────────────────────────────
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  externalId: varchar("externalId", { length: 255 }).unique(),
  source: eventSourceEnum("source").default("swipestakes").notNull(),
  category: eventCategoryEnum("category").notNull(),
  leagueOrTopic: varchar("leagueOrTopic", { length: 128 }),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  status: eventStatusEnum("status").default("scheduled").notNull(),
  sourceRefs: json("sourceRefs").$type<string[]>().default([]),
  tags: json("tags").$type<string[]>().default([]),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ─── MARKETS ──────────────────────────────────────────────────────────────────
export const markets = pgTable("markets", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  externalId: varchar("externalId", { length: 255 }).unique(),
  source: eventSourceEnum("source").default("swipestakes").notNull(),
  sourceUrl: text("sourceUrl"),
  question: text("question").notNull(),
  marketType: marketTypeEnum("marketType").default("binary").notNull(),
  rulesText: text("rulesText"),
  resolutionSourceType: resolutionSourceEnum("resolutionSourceType").default("manual_admin").notNull(),
  resolutionDeadline: timestamp("resolutionDeadline"),
  tradingOpenAt: timestamp("tradingOpenAt"),
  tradingCloseAt: timestamp("tradingCloseAt"),
  settlementType: settlementTypeEnum("settlementType").default("cash").notNull(),
  state: marketStateEnum("state").default("open").notNull(),
  yesPrice: decimal("yesPrice", { precision: 6, scale: 4 }).default("0.5000"),
  noPrice: decimal("noPrice", { precision: 6, scale: 4 }).default("0.5000"),
  volume24h: decimal("volume24h", { precision: 14, scale: 2 }).default("0.00"),
  openInterest: decimal("openInterest", { precision: 14, scale: 2 }).default("0.00"),
  spreadLine: decimal("spreadLine", { precision: 6, scale: 2 }),
  totalLine: decimal("totalLine", { precision: 6, scale: 2 }),
  homeOdds: varchar("homeOdds", { length: 16 }),
  awayOdds: varchar("awayOdds", { length: 16 }),
  overOdds: varchar("overOdds", { length: 16 }),
  underOdds: varchar("underOdds", { length: 16 }),
  aiConfidence: integer("aiConfidence").default(60),
  aiReasoning: text("aiReasoning"),
  rawData: json("rawData"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

// ─── OUTCOMES ─────────────────────────────────────────────────────────────────
export const outcomes = pgTable("outcomes", {
  id: serial("id").primaryKey(),
  marketId: integer("marketId").notNull(),
  label: varchar("label", { length: 64 }).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  currentPrice: decimal("currentPrice", { precision: 6, scale: 4 }).default("0.5000"),
  impliedProbability: decimal("impliedProbability", { precision: 6, scale: 4 }).default("0.5000"),
  isWinner: boolean("isWinner"),
  settlementValue: decimal("settlementValue", { precision: 6, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Outcome = typeof outcomes.$inferSelect;
export type InsertOutcome = typeof outcomes.$inferInsert;

// ─── POSITIONS ────────────────────────────────────────────────────────────────
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  marketId: integer("marketId").notNull(),
  outcomeId: integer("outcomeId").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  avgCost: decimal("avgCost", { precision: 6, scale: 4 }).notNull(),
  totalStaked: decimal("totalStaked", { precision: 12, scale: 2 }).notNull(),
  potentialPayout: decimal("potentialPayout", { precision: 12, scale: 2 }).notNull(),
  realizedPnl: decimal("realizedPnl", { precision: 12, scale: 2 }).default("0.00"),
  unrealizedPnl: decimal("unrealizedPnl", { precision: 12, scale: 2 }).default("0.00"),
  redeemedAmount: decimal("redeemedAmount", { precision: 12, scale: 2 }).default("0.00"),
  status: positionStatusEnum("status").default("active").notNull(),
  marketQuestion: text("marketQuestion"),
  outcomeLabel: varchar("outcomeLabel", { length: 64 }),
  eventTitle: text("eventTitle"),
  eventCategory: varchar("eventCategory", { length: 64 }),
  oddsAtPlacement: varchar("oddsAtPlacement", { length: 16 }),
  placedAt: timestamp("placedAt").defaultNow().notNull(),
  settledAt: timestamp("settledAt"),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

// ─── MARKET PRICE SNAPSHOTS ───────────────────────────────────────────────────
export const marketPriceSnapshots = pgTable("market_price_snapshots", {
  id: serial("id").primaryKey(),
  marketId: integer("marketId").notNull(),
  outcomeId: integer("outcomeId").notNull(),
  bestBid: decimal("bestBid", { precision: 6, scale: 4 }),
  bestAsk: decimal("bestAsk", { precision: 6, scale: 4 }),
  midpoint: decimal("midpoint", { precision: 6, scale: 4 }),
  lastTradePrice: decimal("lastTradePrice", { precision: 6, scale: 4 }),
  volume: decimal("volume", { precision: 14, scale: 2 }).default("0.00"),
  openInterest: decimal("openInterest", { precision: 14, scale: 2 }).default("0.00"),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export type MarketPriceSnapshot = typeof marketPriceSnapshots.$inferSelect;
export type InsertMarketPriceSnapshot = typeof marketPriceSnapshots.$inferInsert;

// ─── RESOLUTION PROPOSALS ─────────────────────────────────────────────────────
export const resolutionProposals = pgTable("resolution_proposals", {
  id: serial("id").primaryKey(),
  marketId: integer("marketId").notNull(),
  proposedOutcomeId: integer("proposedOutcomeId").notNull(),
  proposedBy: varchar("proposedBy", { length: 64 }).notNull(),
  proposedAt: timestamp("proposedAt").defaultNow().notNull(),
  evidenceBlob: json("evidenceBlob"),
  sourceSnapshot: text("sourceSnapshot"),
  challengeWindowEndsAt: timestamp("challengeWindowEndsAt"),
  status: resolutionProposalStatusEnum("status").default("pending").notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type ResolutionProposal = typeof resolutionProposals.$inferSelect;
export type InsertResolutionProposal = typeof resolutionProposals.$inferInsert;

// ─── RESOLUTION DISPUTES ──────────────────────────────────────────────────────
export const resolutionDisputes = pgTable("resolution_disputes", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposalId").notNull(),
  challengedBy: integer("challengedBy").notNull(),
  reason: text("reason").notNull(),
  evidenceBlob: json("evidenceBlob"),
  status: resolutionDisputeStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type ResolutionDispute = typeof resolutionDisputes.$inferSelect;
export type InsertResolutionDispute = typeof resolutionDisputes.$inferInsert;

// ─── CLIPS ────────────────────────────────────────────────────────────────────
export const clips = pgTable("clips", {
  id: serial("id").primaryKey(),
  externalId: varchar("externalId", { length: 255 }).notNull().unique(),
  source: clipSourceEnum("source").default("youtube").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  channelName: varchar("channelName", { length: 255 }),
  sport: varchar("sport", { length: 64 }),
  duration: integer("duration"),
  viewCount: integer("viewCount").default(0),
  likeCount: integer("likeCount").default(0),
  linkedMarketId: integer("linkedMarketId"),
  tags: json("tags").$type<string[]>().default([]),
  publishedAt: timestamp("publishedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type Clip = typeof clips.$inferSelect;
export type InsertClip = typeof clips.$inferInsert;

// ─── SAVED MARKETS ────────────────────────────────────────────────────────────
export const savedMarkets = pgTable("saved_markets", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  marketId: integer("marketId").notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedMarket = typeof savedMarkets.$inferSelect;
export type InsertSavedMarket = typeof savedMarkets.$inferInsert;

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  marketId: integer("marketId").notNull(),
  outcomeId: integer("outcomeId").notNull(),
  side: orderSideEnum("side").notNull(),
  price: decimal("price", { precision: 6, scale: 4 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  filledQuantity: decimal("filledQuantity", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  orderType: orderTypeEnum("orderType").default("market").notNull(),
  status: orderStatusEnum("status").default("open").notNull(),
  signedPayload: text("signedPayload"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── TRADES ───────────────────────────────────────────────────────────────────
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  marketId: integer("marketId").notNull(),
  outcomeId: integer("outcomeId").notNull(),
  buyOrderId: integer("buyOrderId").notNull(),
  sellOrderId: integer("sellOrderId"),
  userId: integer("userId").notNull(),
  price: decimal("price", { precision: 6, scale: 4 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
  feeAmount: decimal("feeAmount", { precision: 8, scale: 4 }).default("0.0000"),
  feeCurrency: varchar("feeCurrency", { length: 8 }).default("USD"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

// ─── USER SETTINGS ────────────────────────────────────────────────────────────
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 128 }),
  avatarUrl: text("avatarUrl"),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  emailNotifications: boolean("emailNotifications").default(false).notNull(),
  defaultBetAmount: decimal("defaultBetAmount", { precision: 8, scale: 2 }).default("10.00"),
  preferredCategories: json("preferredCategories").$type<string[]>().default([]),
  interests: json("interests").$type<string[]>().default([]),
  shoppingPreferences: json("shoppingPreferences").$type<string[]>().default([]),
  pickStyle: pickStyleEnum("pickStyle").default("balanced").notNull(),
  riskStyle: riskStyleEnum("riskStyle").default("moderate").notNull(),
  notificationPrefs: json("notificationPrefs").$type<string[]>().default([]),
  theme: themeEnum("theme").default("dark").notNull(),
  onboardingCompletedAt: timestamp("onboardingCompletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// ─── LOYALTY STATS ────────────────────────────────────────────────────────────
export const loyaltyStats = pgTable("loyalty_stats", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  lastPlayedDate: varchar("lastPlayedDate", { length: 10 }),
  totalPicksPlaced: integer("totalPicksPlaced").default(0).notNull(),
  totalDaysPlayed: integer("totalDaysPlayed").default(0).notNull(),
  loyaltyPoints: integer("loyaltyPoints").default(0).notNull(),
  lifetimeLoyaltyPoints: integer("lifetimeLoyaltyPoints").default(0).notNull(),
  tier: loyaltyTierEnum("tier").default("bronze").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LoyaltyStats = typeof loyaltyStats.$inferSelect;
export type InsertLoyaltyStats = typeof loyaltyStats.$inferInsert;

// ─── LOYALTY MILESTONES ───────────────────────────────────────────────────────
export const loyaltyMilestones = pgTable("loyalty_milestones", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  milestoneId: varchar("milestoneId", { length: 64 }).notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  pointsAwarded: integer("pointsAwarded").default(0).notNull(),
  creditsAwarded: integer("creditsAwarded").default(0).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type LoyaltyMilestone = typeof loyaltyMilestones.$inferSelect;
export type InsertLoyaltyMilestone = typeof loyaltyMilestones.$inferInsert;

// ─── APP NOTIFICATIONS ────────────────────────────────────────────────────────
export const appNotifications = pgTable("app_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("type").default("system").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false).notNull(),
  marketId: integer("marketId"),
  positionId: integer("positionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppNotification = typeof appNotifications.$inferSelect;
export type InsertAppNotification = typeof appNotifications.$inferInsert;

// ─── LEGACY ALIASES ───────────────────────────────────────────────────────────
export const placedBets = positions;
export const savedBets = savedMarkets;

// ─── CREDITS ──────────────────────────────────────────────────────────────────
export const credits = pgTable("credits", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  balance: integer("balance").default(10).notNull(),
  lifetimeEarned: integer("lifetimeEarned").default(0).notNull(),
  lifetimeRedeemed: integer("lifetimeRedeemed").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Credits = typeof credits.$inferSelect;
export type InsertCredits = typeof credits.$inferInsert;

// ─── DAILY PICKS ──────────────────────────────────────────────────────────────
export const dailyPicks = pgTable("daily_picks", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  marketId: integer("marketId").notNull(),
  pickDate: varchar("pickDate", { length: 10 }).notNull(),
  pickOrder: integer("pickOrder").notNull(),
  choice: pickChoiceEnum("choice").notNull(),
  questionSnapshot: text("questionSnapshot"),
  marketType: pickMarketTypeEnum("marketType").default("binary").notNull(),
  result: pickResultEnum("result").default("pending").notNull(),
  creditsAwarded: integer("creditsAwarded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyPick = typeof dailyPicks.$inferSelect;
export type InsertDailyPick = typeof dailyPicks.$inferInsert;

// ─── DAILY RESULTS ────────────────────────────────────────────────────────────
export const dailyResults = pgTable("daily_results", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  pickDate: varchar("pickDate", { length: 10 }).notNull(),
  totalPicks: integer("totalPicks").default(0).notNull(),
  correctPicks: integer("correctPicks").default(0).notNull(),
  skippedPicks: integer("skippedPicks").default(0).notNull(),
  creditsEarned: integer("creditsEarned").default(0).notNull(),
  scoreTier: scoreTierEnum("scoreTier").default("miss").notNull(),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyResult = typeof dailyResults.$inferSelect;
export type InsertDailyResult = typeof dailyResults.$inferInsert;

// ─── CREDIT TRANSACTIONS ──────────────────────────────────────────────────────
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  amount: integer("amount").notNull(),
  balanceBefore: integer("balanceBefore").notNull(),
  balanceAfter: integer("balanceAfter").notNull(),
  type: creditTxTypeEnum("type").notNull(),
  description: text("description"),
  referenceId: varchar("referenceId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ─── REDEEM REQUESTS ──────────────────────────────────────────────────────────
export const redeemRequests = pgTable("redeem_requests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  giftCardType: varchar("giftCardType", { length: 64 }).notNull(),
  giftCardLabel: varchar("giftCardLabel", { length: 128 }).notNull(),
  creditCost: integer("creditCost").notNull(),
  status: redeemStatusEnum("status").default("pending").notNull(),
  deliveryEmail: varchar("deliveryEmail", { length: 320 }),
  fulfilledAt: timestamp("fulfilledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RedeemRequest = typeof redeemRequests.$inferSelect;
export type InsertRedeemRequest = typeof redeemRequests.$inferInsert;
