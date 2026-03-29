// Swipestakes — Credits Router
// Free-to-play: 5-leg daily parlay sweepstakes
// Credit rules (parlay = all-or-nothing):
//   5/5 correct  → 25 credits (PARLAY WIN)
//   < 5 correct  → 0 credits (PARLAY LOSS)
// Skipped picks count as incorrect for parlay purposes

import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  credits,
  dailyPicks,
  dailyResults,
  creditTransactions,
  redeemRequests,
  markets,
  events,
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "2026-03-27"
}

// Ensure credits row exists for user (signup bonus: 10 credits)
async function ensureCredits(userId: number) {
  const db = await getDb();
  if (!db) return null;
  let [row] = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  if (!row) {
    await db.insert(credits).values({ userId, balance: 10, lifetimeEarned: 10 });
    // Log signup bonus
    await db.insert(creditTransactions).values({
      userId,
      amount: 10,
      balanceBefore: 0,
      balanceAfter: 10,
      type: "signup_bonus",
      description: "Welcome bonus — 10 free credits",
    });
    [row] = await db.select().from(credits).where(eq(credits.userId, userId)).limit(1);
  }
  return row;
}

// Compute credit reward — binary parlay: all 5 correct = WIN, else LOSS
function computeCredits(correct: number, total: number): { amount: number; tier: "perfect" | "great" | "good" | "miss" } {
  // Parlay: must get ALL active picks correct to win
  if (correct === total && total > 0 && total === 5) return { amount: 25, tier: "perfect" };
  return { amount: 0, tier: "miss" };
}

// ─── DAILY PICKS ROUTER ───────────────────────────────────────────────────────

export const creditsRouter = router({

  // Get the user's credit balance + today's pick status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { balance: 0, picksUsed: 0, picksRemaining: 5, todayPicks: [], todayResult: null };

    const creditRow = await ensureCredits(ctx.user.id);
    const today = todayUTC();

    const todayPicks = await db
      .select()
      .from(dailyPicks)
      .where(and(eq(dailyPicks.userId, ctx.user.id), eq(dailyPicks.pickDate, today)))
      .orderBy(dailyPicks.pickOrder);

    const [todayResult] = await db
      .select()
      .from(dailyResults)
      .where(and(eq(dailyResults.userId, ctx.user.id), eq(dailyResults.pickDate, today)))
      .limit(1);

    const picksUsed = todayPicks.length;
    const picksRemaining = Math.max(0, 5 - picksUsed);

    return {
      balance: creditRow?.balance ?? 0,
      picksUsed,
      picksRemaining,
      todayPicks,
      todayResult: todayResult ?? null,
    };
  }),

  // Get today's 5 daily markets (binary/over-under only)
  getDailyMarkets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { markets: [], picksUsed: 0, alreadyPicked: [] as number[] };

    const today = todayUTC();

    // Get markets the user already picked today
    const existingPicks = await db
      .select({ marketId: dailyPicks.marketId })
      .from(dailyPicks)
      .where(and(eq(dailyPicks.userId, ctx.user.id), eq(dailyPicks.pickDate, today)));

    const pickedIds = new Set<number>(existingPicks.map(p => p.marketId));

    // Helper to query open markets (closing within next 7 days)
    const queryMarkets = async () => db
      .select({
        id: markets.id,
        question: markets.question,
        marketType: markets.marketType,
        totalLine: markets.totalLine,
        yesPrice: markets.yesPrice,
        noPrice: markets.noPrice,
        aiConfidence: markets.aiConfidence,
        aiReasoning: markets.aiReasoning,
        imageUrl: events.imageUrl,
        category: events.category,
        leagueOrTopic: events.leagueOrTopic,
        eventTitle: events.title,
        tradingCloseAt: markets.tradingCloseAt,
      })
      .from(markets)
      .leftJoin(events, eq(markets.eventId, events.id))
      .where(
        and(
          sql`markets.state = 'open'`,
          sql`markets.marketType IN ('binary', 'total', 'player_prop')`,
          // Accept markets closing within the next 7 days (not just today)
          sql`markets.tradingCloseAt >= NOW()`,
          sql`markets.tradingCloseAt <= DATE_ADD(NOW(), INTERVAL 7 DAY)`
        )
      )
      .orderBy(sql`RAND(DAYOFYEAR(NOW()))`) // same order for all users today
      .limit(20);

    let allMarkets = await queryMarkets();

    // If fewer than 5 markets in DB, trigger live ingestion and retry once
    if (allMarkets.length < 5) {
      try {
        const { ingestMarkets } = await import('./betIngestion');
        await ingestMarkets();
        allMarkets = await queryMarkets();
      } catch (e) {
        console.error('[Credits] Ingestion fallback failed:', e);
      }
    }

    // Pick 5 that user hasn't picked yet, or first 5 if fresh
    const unpicked = allMarkets.filter(m => !pickedIds.has(m.id));
    const dailyBatch = unpicked.slice(0, 5);

    return {
      markets: dailyBatch,
      picksUsed: existingPicks.length,
      alreadyPicked: Array.from(pickedIds),
    };
  }),

  // Submit all 5 picks as a single daily parlay entry
  submitParlay: protectedProcedure
    .input(z.object({
      picks: z.array(z.object({
        marketId: z.number(),
        choice: z.enum(["yes", "no", "over", "under", "skip"]),
        questionSnapshot: z.string().optional(),
        marketType: z.enum(["binary", "total", "player_prop"]).default("binary"),
      })).min(1).max(5),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      const today = todayUTC();

      // Check if user already submitted parlay today
      const existingPicks = await db
        .select()
        .from(dailyPicks)
        .where(and(eq(dailyPicks.userId, ctx.user.id), eq(dailyPicks.pickDate, today)));

      if (existingPicks.length >= 5) {
        return { success: false, error: "Daily parlay already submitted" };
      }

      // Insert all picks
      for (let i = 0; i < input.picks.length; i++) {
        const pick = input.picks[i];
        await db.insert(dailyPicks).values({
          userId: ctx.user.id,
          marketId: pick.marketId,
          pickDate: today,
          pickOrder: i + 1,
          choice: pick.choice,
          questionSnapshot: pick.questionSnapshot ?? null,
          marketType: pick.marketType,
          result: pick.choice === "skip" ? "skipped" : "pending",
        });
      }

      // Update loyalty stats (streak, points, milestones) — non-blocking
      let loyaltyResult = null;
      try {
        const { updateLoyaltyOnPlay } = await import('./loyaltyRouter');
        loyaltyResult = await updateLoyaltyOnPlay(ctx.user.id, input.picks.length);
      } catch (e) {
        console.error('[Loyalty] Failed to update loyalty stats:', e);
      }

      return {
        success: true,
        picksSubmitted: input.picks.length,
        message: "Parlay locked in! Results tonight.",
        loyalty: loyaltyResult,
      };
    }),

  // Submit a pick (yes/no/over/under/skip)
  submitPick: protectedProcedure
    .input(z.object({
      marketId: z.number(),
      choice: z.enum(["yes", "no", "over", "under", "skip"]),
      questionSnapshot: z.string().optional(),
      marketType: z.enum(["binary", "total", "player_prop"]).default("binary"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      const today = todayUTC();

      // Check how many picks used today
      const existingPicks = await db
        .select()
        .from(dailyPicks)
        .where(and(eq(dailyPicks.userId, ctx.user.id), eq(dailyPicks.pickDate, today)));

      if (existingPicks.length >= 5) {
        return { success: false, error: "Daily limit reached (5 picks per day)" };
      }

      // Check not already picked this market today
      const alreadyPicked = existingPicks.find(p => p.marketId === input.marketId);
      if (alreadyPicked) {
        return { success: false, error: "Already picked this market today" };
      }

      const pickOrder = existingPicks.length + 1;

      await db.insert(dailyPicks).values({
        userId: ctx.user.id,
        marketId: input.marketId,
        pickDate: today,
        pickOrder,
        choice: input.choice,
        questionSnapshot: input.questionSnapshot ?? null,
        marketType: input.marketType,
        result: input.choice === "skip" ? "skipped" : "pending",
      });

      const totalPicksToday = pickOrder;
      const picksRemaining = Math.max(0, 5 - totalPicksToday);

      return {
        success: true,
        picksUsed: totalPicksToday,
        picksRemaining,
        allUsed: totalPicksToday >= 5,
      };
    }),

  // Resolve today's picks (called after markets close — for demo, admin can trigger)
  // In production this would be a cron job
  resolveDay: protectedProcedure
    .input(z.object({
      pickDate: z.string().optional(), // defaults to today
      // Map of marketId → correct answer for resolution
      resolutions: z.array(z.object({
        marketId: z.number(),
        correctAnswer: z.enum(["yes", "no", "over", "under"]),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const pickDate = input.pickDate ?? todayUTC();
      const resolutionMap = new Map(input.resolutions.map(r => [r.marketId, r.correctAnswer]));

      // Get all picks for this user on this date
      const picks = await db
        .select()
        .from(dailyPicks)
        .where(and(eq(dailyPicks.userId, ctx.user.id), eq(dailyPicks.pickDate, pickDate)));

      let correctCount = 0;
      let skippedCount = 0;

      for (const pick of picks) {
        if (pick.choice === "skip") {
          skippedCount++;
          continue;
        }
        const correct = resolutionMap.get(pick.marketId);
        const isCorrect = correct === pick.choice;
        if (isCorrect) correctCount++;

        await db
          .update(dailyPicks)
          .set({
            result: isCorrect ? "correct" : "incorrect",
          })
          .where(eq(dailyPicks.id, pick.id));
      }

      const activePicks = picks.length - skippedCount;
      const { amount, tier } = computeCredits(correctCount, activePicks);

      // Award credits
      if (amount > 0) {
        const creditRow = await ensureCredits(ctx.user.id);
        const balanceBefore = creditRow?.balance ?? 0;
        const balanceAfter = balanceBefore + amount;

        await db.update(credits).set({
          balance: balanceAfter,
          lifetimeEarned: sql`lifetimeEarned + ${amount}`,
        }).where(eq(credits.userId, ctx.user.id));

        await db.insert(creditTransactions).values({
          userId: ctx.user.id,
          amount,
          balanceBefore,
          balanceAfter,
          type: "daily_reward",
          description: `${pickDate} picks: ${correctCount}/${activePicks} correct — ${tier}`,
          referenceId: `daily_${pickDate}`,
        });
      }

      // Upsert daily result
      const [existing] = await db
        .select()
        .from(dailyResults)
        .where(and(eq(dailyResults.userId, ctx.user.id), eq(dailyResults.pickDate, pickDate)))
        .limit(1);

      if (existing) {
        await db.update(dailyResults).set({
          totalPicks: activePicks,
          correctPicks: correctCount,
          skippedPicks: skippedCount,
          creditsEarned: amount,
          scoreTier: tier,
          settledAt: new Date(),
        }).where(eq(dailyResults.id, existing.id));
      } else {
        await db.insert(dailyResults).values({
          userId: ctx.user.id,
          pickDate,
          totalPicks: activePicks,
          correctPicks: correctCount,
          skippedPicks: skippedCount,
          creditsEarned: amount,
          scoreTier: tier,
          settledAt: new Date(),
        });
      }

      return {
        success: true,
        correctCount,
        activePicks,
        creditsEarned: amount,
        tier,
      };
    }),

  // Get credit transaction history
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { transactions: [], balance: 0 };

      const creditRow = await ensureCredits(ctx.user.id);

      const txns = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, ctx.user.id))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input.limit);

      return {
        transactions: txns,
        balance: creditRow?.balance ?? 0,
      };
    }),

  // Get past daily results with individual pick details
  getDailyHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(14) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { days: [] };

      const results = await db
        .select()
        .from(dailyResults)
        .where(eq(dailyResults.userId, ctx.user.id))
        .orderBy(desc(dailyResults.pickDate))
        .limit(input.limit);

      // For each result day, fetch the individual picks
      const days = await Promise.all(results.map(async (r) => {
        const picks = await db
          .select()
          .from(dailyPicks)
          .where(and(
            eq(dailyPicks.userId, ctx.user.id),
            eq(dailyPicks.pickDate, r.pickDate)
          ))
          .orderBy(dailyPicks.pickOrder);

        return {
          date: r.pickDate,
          score: `${r.correctPicks}/${r.totalPicks}`,
          correct: r.correctPicks,
          total: r.totalPicks,
          credits: r.creditsEarned,
          tier: r.scoreTier ?? 'miss',
          picks: picks.map(p => ({
            q: p.questionSnapshot ?? 'Pick',
            choice: (p.choice ?? '').toUpperCase(),
            correct: p.result === 'correct',
          })),
        };
      }));

      return { days };
    }),

  // Redeem credits for a gift card
  redeem: protectedProcedure
    .input(z.object({
      giftCardType: z.string(),
      giftCardLabel: z.string(),
      creditCost: z.number().positive(),
      deliveryEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      const creditRow = await ensureCredits(ctx.user.id);
      if (!creditRow || creditRow.balance < input.creditCost) {
        return { success: false, error: "Insufficient credits" };
      }

      const balanceBefore = creditRow.balance;
      const balanceAfter = balanceBefore - input.creditCost;

      // Deduct credits
      await db.update(credits).set({
        balance: balanceAfter,
        lifetimeRedeemed: sql`lifetimeRedeemed + ${input.creditCost}`,
      }).where(eq(credits.userId, ctx.user.id));

      // Create redeem request
      const [inserted] = await db.insert(redeemRequests).values({
        userId: ctx.user.id,
        giftCardType: input.giftCardType,
        giftCardLabel: input.giftCardLabel,
        creditCost: input.creditCost,
        deliveryEmail: input.deliveryEmail ?? null,
        status: "pending",
      }).returning({ id: redeemRequests.id });

      // Log transaction
      await db.insert(creditTransactions).values({
        userId: ctx.user.id,
        amount: -input.creditCost,
        balanceBefore,
        balanceAfter,
        type: "redeem",
        description: `Redeemed: ${input.giftCardLabel}`,
        referenceId: String(inserted.id),
      });

      return {
        success: true,
        newBalance: balanceAfter,
        redeemId: inserted.id,
      };
    }),

  // Get redeem history
  getRedeemHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { requests: [] };

    const requests = await db
      .select()
      .from(redeemRequests)
      .where(eq(redeemRequests.userId, ctx.user.id))
      .orderBy(desc(redeemRequests.createdAt))
      .limit(20);

    return { requests };
  }),
});
