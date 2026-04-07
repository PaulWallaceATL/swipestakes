import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { ingestMarkets, getActiveMarkets, type MarketCard } from "./betIngestion";
import { stripeRouter } from "./stripeRouter";
import { creditsRouter } from "./creditsRouter";
import { loyaltyRouter } from "./loyaltyRouter";
import { referralRouter } from "./referralRouter";
import { ingestClips, getClips } from "./videoFeed";
import { getDb } from "./db";
import {
  positions, savedMarkets, wallets, walletTransactions, markets, events, outcomes,
  orders, trades, userSettings, appNotifications,
  type InsertPosition, type InsertSavedMarket, type InsertOrder, type InsertTrade,
} from "../drizzle/schema";
import { eq, sql, desc, and } from "drizzle-orm";

// ─── WALLET HELPERS ───────────────────────────────────────────────────────────

async function ensureWallet(userId: number) {
  const db = await getDb();
  if (!db) return null;
  let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) {
    await db.insert(wallets).values({ userId, cashBalance: "1000.00", withdrawableBalance: "1000.00" });
    [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  }
  return wallet;
}

async function ensureUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  let [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (!settings) {
    await db.insert(userSettings).values({ userId });
    [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  }
  return settings;
}

// ─── MARKETS ROUTER ───────────────────────────────────────────────────────────
const marketsRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional(), sport: z.string().optional(), limit: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { markets: [] as MarketCard[], source: "unavailable" };

      // Trigger background ingest if data is stale
      const recent = await db
        .select({ id: markets.id })
        .from(markets)
        .where(sql`markets.updatedAt > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`)
        .limit(1);

      if (recent.length === 0) {
        ingestMarkets().catch(console.error);
      }

      const rows = await getActiveMarkets(input.limit, input.category);
      return { markets: rows, source: "db" };
    }),

  ingest: publicProcedure.mutation(async () => {
    return await ingestMarkets();
  }),

  // Polymarket-style: place a market-order buy against the house at current price
  place: protectedProcedure
    .input(z.object({
      marketId: z.number(),
      outcomeLabel: z.string().default("YES"),
      stake: z.number().min(1).max(10000),
      question: z.string(),
      eventTitle: z.string().optional(),
      category: z.string().optional(),
      oddsAtPlacement: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const wallet = await ensureWallet(ctx.user.id);
      if (!wallet) throw new Error("Wallet unavailable");

      const balance = parseFloat(wallet.cashBalance);
      if (balance < input.stake) throw new Error("Insufficient balance");

      const [market] = await db.select().from(markets).where(eq(markets.id, input.marketId)).limit(1);
      if (!market) throw new Error("Market not found");
      if (market.state !== "open") throw new Error("Market is not open for trading");

      // Find or create the outcome
      let [outcome] = await db
        .select()
        .from(outcomes)
        .where(sql`marketId = ${input.marketId} AND label = ${input.outcomeLabel}`)
        .limit(1);

      // If no outcome row yet, use market's yesPrice for YES, noPrice for NO
      const price = outcome?.currentPrice
        ? parseFloat(String(outcome.currentPrice))
        : input.outcomeLabel === "YES"
          ? parseFloat(String(market.yesPrice ?? "0.5"))
          : parseFloat(String(market.noPrice ?? "0.5"));

      const outcomeId = outcome?.id ?? 0;
      // shares = stake / price  (e.g. $50 at 0.63 = 79.37 shares; each share pays $1 if wins)
      const quantity = input.stake / price;
      const potentialPayout = quantity; // each share redeems at $1.00

      // Implied probability display (Polymarket-style)
      const impliedProb = Math.round(price * 100);
      const americanOdds = input.oddsAtPlacement ?? (
        price >= 0.5
          ? `-${Math.round((price / (1 - price)) * 100)}`
          : `+${Math.round(((1 - price) / price) * 100)}`
      );

      // 1. Create the Order record
      const [orderInsert] = await db.insert(orders).values({
        userId: ctx.user.id,
        marketId: input.marketId,
        outcomeId,
        side: "buy",
        price: String(price.toFixed(4)),
        quantity: String(quantity.toFixed(4)),
        filledQuantity: String(quantity.toFixed(4)),
        orderType: "market",
        status: "filled",
      } satisfies InsertOrder);

      const orderId = (orderInsert as any).insertId ?? 0;

      // 2. Create the Trade record (execution)
      await db.insert(trades).values({
        marketId: input.marketId,
        outcomeId,
        buyOrderId: orderId,
        userId: ctx.user.id,
        price: String(price.toFixed(4)),
        quantity: String(quantity.toFixed(4)),
        totalCost: String(input.stake.toFixed(2)),
        feeAmount: "0.0000",
      } satisfies InsertTrade);

      // 3. Debit wallet
      await db
        .update(wallets)
        .set({
          cashBalance: sql`cashBalance - ${input.stake}`,
          lockedBalance: sql`lockedBalance + ${input.stake}`,
          withdrawableBalance: sql`withdrawableBalance - ${input.stake}`,
        })
        .where(eq(wallets.userId, ctx.user.id));

      // 4. Create wallet transaction record
      const balanceAfter = balance - input.stake;
      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        userId: ctx.user.id,
        type: "bet_buy",
        amount: String(input.stake.toFixed(2)),
        balanceBefore: String(balance.toFixed(2)),
        balanceAfter: String(balanceAfter.toFixed(2)),
        status: "completed",
        referenceType: "position",
        description: `Bet: ${input.question} — ${input.outcomeLabel}`,
      });

      // 5. Create Position (what user holds)
      await db.insert(positions).values({
        userId: ctx.user.id,
        marketId: input.marketId,
        outcomeId,
        quantity: String(quantity.toFixed(4)),
        avgCost: String(price.toFixed(4)),
        totalStaked: String(input.stake.toFixed(2)),
        potentialPayout: String(potentialPayout.toFixed(2)),
        status: "active",
        marketQuestion: input.question,
        outcomeLabel: input.outcomeLabel,
        eventTitle: input.eventTitle ?? null,
        eventCategory: input.category ?? null,
        oddsAtPlacement: americanOdds,
      } satisfies InsertPosition);

      // 6. Create in-app notification for the bet placement
      try {
        await db.insert(appNotifications).values({
          userId: ctx.user.id,
          type: "market_open",
          title: `Bet placed — ${input.outcomeLabel}`,
          body: `${input.question} · ${americanOdds} · Payout $${potentialPayout.toFixed(2)}`,
          marketId: input.marketId,
        });
      } catch { /* non-critical */ }

      return {
        success: true,
        potentialPayout: potentialPayout.toFixed(2),
        impliedProbability: impliedProb,
        sharesAcquired: quantity.toFixed(4),
      };
    }),

  save: protectedProcedure
    .input(z.object({ marketId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      // Upsert — ignore duplicate
      const existing = await db
        .select({ id: savedMarkets.id })
        .from(savedMarkets)
        .where(and(eq(savedMarkets.userId, ctx.user.id), eq(savedMarkets.marketId, input.marketId)))
        .limit(1);
      if (existing.length > 0) return { success: true, alreadySaved: true };
      await db.insert(savedMarkets).values({
        userId: ctx.user.id,
        marketId: input.marketId,
      } satisfies InsertSavedMarket);
      return { success: true, alreadySaved: false };
    }),

  unsave: protectedProcedure
    .input(z.object({ marketId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(savedMarkets)
        .where(and(eq(savedMarkets.userId, ctx.user.id), eq(savedMarkets.marketId, input.marketId)));
      return { success: true };
    }),

  myBets: protectedProcedure
    .input(z.object({ status: z.enum(["active", "won", "lost", "cashed_out", "voided", "all"]).default("all") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(positions)
        .where(
          input.status !== "all"
            ? sql`userId = ${ctx.user.id} AND status = ${input.status}`
            : sql`userId = ${ctx.user.id}`
        )
        .orderBy(desc(positions.placedAt))
        .limit(50);
    }),

  mySaved: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    // Return saved markets with full market details
    const saved = await db
      .select({
        savedAt: savedMarkets.savedAt,
        marketId: savedMarkets.marketId,
        question: markets.question,
        state: markets.state,
        yesPrice: markets.yesPrice,
        noPrice: markets.noPrice,
        volume24h: markets.volume24h,
        aiConfidence: markets.aiConfidence,
        eventTitle: events.title,
        eventCategory: events.category,
        leagueOrTopic: events.leagueOrTopic,
        resolutionDeadline: markets.resolutionDeadline,
      })
      .from(savedMarkets)
      .leftJoin(markets, eq(savedMarkets.marketId, markets.id))
      .leftJoin(events, eq(markets.eventId, events.id))
      .where(eq(savedMarkets.userId, ctx.user.id))
      .orderBy(desc(savedMarkets.savedAt))
      .limit(50);
    return saved;
  }),

  savedIds: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({ marketId: savedMarkets.marketId })
      .from(savedMarkets)
      .where(eq(savedMarkets.userId, ctx.user.id));
    return rows.map((r) => r.marketId);
  }),
});

// ─── CLIPS ROUTER ─────────────────────────────────────────────────────────────
const clipsRouter = router({
  list: publicProcedure
    .input(z.object({ sport: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const rows = await getClips(input.limit, input.sport);
      return { clips: rows, source: "db" };
    }),

  ingest: publicProcedure.mutation(async () => {
    return await ingestClips();
  }),
});

// ─── WALLET ROUTER ────────────────────────────────────────────────────────────
const walletRouter = router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await ensureWallet(ctx.user.id);
    if (!wallet) return { balance: 1000, locked: 0, withdrawable: 1000, promoCredits: 0 };
    return {
      balance: parseFloat(wallet.cashBalance),
      locked: parseFloat(wallet.lockedBalance),
      withdrawable: parseFloat(wallet.withdrawableBalance),
      promoCredits: parseFloat(wallet.promoCredits),
    };
  }),

  transactions: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const wallet = await ensureWallet(ctx.user.id);
      if (!wallet) return [];
      return db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(input.limit);
    }),

  deposit: protectedProcedure
    .input(z.object({ amount: z.number().min(1).max(100000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const wallet = await ensureWallet(ctx.user.id);
      if (!wallet) throw new Error("Wallet unavailable");
      const balanceBefore = parseFloat(wallet.cashBalance);
      await db
        .update(wallets)
        .set({
          cashBalance: sql`cashBalance + ${input.amount}`,
          withdrawableBalance: sql`withdrawableBalance + ${input.amount}`,
        })
        .where(eq(wallets.userId, ctx.user.id));
      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        userId: ctx.user.id,
        type: "deposit",
        amount: String(input.amount.toFixed(2)),
        balanceBefore: String(balanceBefore.toFixed(2)),
        balanceAfter: String((balanceBefore + input.amount).toFixed(2)),
        status: "completed",
        description: `Deposit $${input.amount}`,
      });
      return { success: true };
    }),

  withdraw: protectedProcedure
    .input(z.object({ amount: z.number().min(1).max(100000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const wallet = await ensureWallet(ctx.user.id);
      if (!wallet) throw new Error("Wallet unavailable");
      const balanceBefore = parseFloat(wallet.cashBalance);
      if (balanceBefore < input.amount) throw new Error("Insufficient balance");
      await db
        .update(wallets)
        .set({
          cashBalance: sql`GREATEST(0, cashBalance - ${input.amount})`,
          withdrawableBalance: sql`GREATEST(0, withdrawableBalance - ${input.amount})`,
        })
        .where(eq(wallets.userId, ctx.user.id));
      await db.insert(walletTransactions).values({
        walletId: wallet.id,
        userId: ctx.user.id,
        type: "withdrawal",
        amount: String(input.amount.toFixed(2)),
        balanceBefore: String(balanceBefore.toFixed(2)),
        balanceAfter: String(Math.max(0, balanceBefore - input.amount).toFixed(2)),
        status: "completed",
        description: `Withdrawal $${input.amount}`,
      });
      return { success: true };
    }),
});

// ─── USER SETTINGS ROUTER ─────────────────────────────────────────────────────
const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ensureUserSettings(ctx.user.id);
    return settings;
  }),

  update: protectedProcedure
    .input(z.object({
      displayName: z.string().max(128).optional().nullable(),
      avatarUrl: z.string().url().optional().nullable(),
      notificationsEnabled: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      defaultBetAmount: z.number().min(1).max(10000).optional(),
      preferredCategories: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      shoppingPreferences: z.array(z.string()).optional(),
      pickStyle: z.enum(["high_confidence", "balanced", "contrarian"]).optional(),
      riskStyle: z.enum(["safe", "moderate", "aggressive"]).optional(),
      notificationPrefs: z.array(z.string()).optional(),
      theme: z.enum(["dark", "light", "system"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await ensureUserSettings(ctx.user.id);
      const updates: Record<string, unknown> = {};
      if (input.displayName !== undefined) updates.displayName = input.displayName;
      if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
      if (input.notificationsEnabled !== undefined) updates.notificationsEnabled = input.notificationsEnabled;
      if (input.emailNotifications !== undefined) updates.emailNotifications = input.emailNotifications;
      if (input.defaultBetAmount !== undefined) updates.defaultBetAmount = String(input.defaultBetAmount.toFixed(2));
      if (input.preferredCategories !== undefined) updates.preferredCategories = input.preferredCategories;
      if (input.interests !== undefined) updates.interests = input.interests;
      if (input.shoppingPreferences !== undefined) updates.shoppingPreferences = input.shoppingPreferences;
      if (input.pickStyle !== undefined) updates.pickStyle = input.pickStyle;
      if (input.riskStyle !== undefined) updates.riskStyle = input.riskStyle;
      if (input.notificationPrefs !== undefined) updates.notificationPrefs = input.notificationPrefs;
      if (input.theme !== undefined) updates.theme = input.theme;
      if (Object.keys(updates).length > 0) {
        await db.update(userSettings).set(updates).where(eq(userSettings.userId, ctx.user.id));
      }
      return await ensureUserSettings(ctx.user.id);
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await ensureUserSettings(ctx.user.id);
    await db
      .update(userSettings)
      .set({ onboardingCompletedAt: new Date() } as any)
      .where(eq(userSettings.userId, ctx.user.id));
    return { success: true };
  }),
});

// ──// ─── NOTIFICATIONS ROUTER ───────────────────────────────────────────────────
const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(appNotifications)
        .where(eq(appNotifications.userId, ctx.user.id))
        .orderBy(desc(appNotifications.createdAt))
        .limit(input?.limit ?? 20);
      return rows;
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return 0;
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appNotifications)
      .where(and(eq(appNotifications.userId, ctx.user.id), eq(appNotifications.read, false)));
    return Number(row?.count ?? 0);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(appNotifications)
        .set({ read: true })
        .where(and(eq(appNotifications.id, input.id), eq(appNotifications.userId, ctx.user.id)));
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false };
    await db
      .update(appNotifications)
      .set({ read: true })
      .where(eq(appNotifications.userId, ctx.user.id));
    return { success: true };
  }),

  dismiss: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .delete(appNotifications)
        .where(and(eq(appNotifications.id, input.id), eq(appNotifications.userId, ctx.user.id)));
      return { success: true };
    }),
});

// ─── ROOT ROUTER ──────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async (opts) => {
      // Auto-provision wallet + settings on first login
      if (opts.ctx.user) {
        ensureWallet(opts.ctx.user.id).catch(console.error);
        ensureUserSettings(opts.ctx.user.id).catch(console.error);
      }
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  markets: marketsRouter,
  clips: clipsRouter,
  wallet: walletRouter,
  settings: settingsRouter,
  notifications: notificationsRouter,
  stripe: stripeRouter,
  credits: creditsRouter,
  loyalty: loyaltyRouter,
  referral: referralRouter,
  // Legacy alias — old frontend calls to trpc.bets.* still work
  bets: marketsRouter,
});

export type AppRouter = typeof appRouter;
