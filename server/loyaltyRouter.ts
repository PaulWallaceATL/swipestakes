// Swipestakes — Loyalty Program Router
// Handles streak tracking, loyalty point accrual, milestone awards, and tier upgrades.
// Called by creditsRouter after a parlay is submitted.

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { loyaltyStats, loyaltyMilestones, wallets } from "../drizzle/schema";

// ─── MILESTONE DEFINITIONS ────────────────────────────────────────────────────

interface MilestoneDef {
  id: string;
  title: string;
  description: string;
  points: number;
  credits: number;
  check: (stats: { currentStreak: number; totalPicksPlaced: number; totalDaysPlayed: number }) => boolean;
}

const MILESTONES: MilestoneDef[] = [
  // Streak milestones
  { id: 'streak_1',  title: 'First Day!',        description: 'Played your first day',                points: 10,  credits: 2,  check: s => s.currentStreak >= 1 },
  { id: 'streak_3',  title: '3-Day Streak 🔥',   description: '3 days in a row',                      points: 25,  credits: 5,  check: s => s.currentStreak >= 3 },
  { id: 'streak_7',  title: 'Week Warrior ⚡',   description: '7 days in a row',                      points: 75,  credits: 15, check: s => s.currentStreak >= 7 },
  { id: 'streak_14', title: 'Two Weeks Strong 💪', description: '14 days in a row',                   points: 150, credits: 30, check: s => s.currentStreak >= 14 },
  { id: 'streak_30', title: 'Monthly Legend 🏆',  description: '30 days in a row',                    points: 500, credits: 100,check: s => s.currentStreak >= 30 },
  // Total picks milestones
  { id: 'picks_10',  title: 'Getting Started',    description: 'Placed 10 total picks',                points: 20,  credits: 3,  check: s => s.totalPicksPlaced >= 10 },
  { id: 'picks_25',  title: 'Quarter Century',    description: 'Placed 25 total picks',                points: 40,  credits: 8,  check: s => s.totalPicksPlaced >= 25 },
  { id: 'picks_50',  title: 'Fifty Strong 🎯',    description: 'Placed 50 total picks',                points: 100, credits: 20, check: s => s.totalPicksPlaced >= 50 },
  { id: 'picks_100', title: 'Century Club 💯',    description: 'Placed 100 total picks',               points: 250, credits: 50, check: s => s.totalPicksPlaced >= 100 },
  { id: 'picks_500', title: 'Swipestakes Pro 🌟', description: 'Placed 500 total picks',               points: 1000,credits: 200,check: s => s.totalPicksPlaced >= 500 },
  // Days played milestones
  { id: 'days_7',    title: 'Week Regular',        description: 'Played on 7 different days',           points: 50,  credits: 10, check: s => s.totalDaysPlayed >= 7 },
  { id: 'days_30',   title: 'Monthly Regular',     description: 'Played on 30 different days',          points: 200, credits: 40, check: s => s.totalDaysPlayed >= 30 },
];

// ─── TIER THRESHOLDS ──────────────────────────────────────────────────────────

function getTier(lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (lifetimePoints >= 2000) return 'platinum';
  if (lifetimePoints >= 500)  return 'gold';
  if (lifetimePoints >= 100)  return 'silver';
  return 'bronze';
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Ensure a loyalty_stats row exists for the user
async function ensureLoyaltyStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [existing] = await db.select().from(loyaltyStats).where(eq(loyaltyStats.userId, userId)).limit(1);
  if (existing) return existing;
  await db.insert(loyaltyStats).values({ userId });
  const [created] = await db.select().from(loyaltyStats).where(eq(loyaltyStats.userId, userId)).limit(1);
  return created;
}

// ─── MAIN LOYALTY UPDATE (called after parlay submission) ─────────────────────

export async function updateLoyaltyOnPlay(userId: number, picksCount: number): Promise<{
  newMilestones: Array<{ id: string; title: string; description: string; points: number; credits: number }>;
  streakUpdated: boolean;
  newStreak: number;
  pointsEarned: number;
  newTier: string;
}> {
  const db = await getDb();
  if (!db) return { newMilestones: [], streakUpdated: false, newStreak: 0, pointsEarned: 0, newTier: 'bronze' };

  const stats = await ensureLoyaltyStats(userId);
  if (!stats) return { newMilestones: [], streakUpdated: false, newStreak: 0, pointsEarned: 0, newTier: 'bronze' };

  const today = todayUTC();
  const yesterday = yesterdayUTC();

  // Already played today — don't double-count streak but still count picks
  const alreadyPlayedToday = stats.lastPlayedDate === today;

  let newStreak = stats.currentStreak;
  let newLongest = stats.longestStreak;
  let newTotalDays = stats.totalDaysPlayed;
  let streakUpdated = false;

  if (!alreadyPlayedToday) {
    if (stats.lastPlayedDate === yesterday) {
      // Consecutive day — extend streak
      newStreak = stats.currentStreak + 1;
    } else {
      // Streak broken or first day
      newStreak = 1;
    }
    newLongest = Math.max(newLongest, newStreak);
    newTotalDays = stats.totalDaysPlayed + 1;
    streakUpdated = true;
  }

  // Base points per pick + streak multiplier
  const streakMultiplier = newStreak >= 30 ? 3 : newStreak >= 14 ? 2 : newStreak >= 7 ? 1.5 : newStreak >= 3 ? 1.25 : 1;
  const basePointsPerPick = 5;
  const pointsEarned = Math.round(picksCount * basePointsPerPick * streakMultiplier);

  const newTotalPicks = stats.totalPicksPlaced + picksCount;
  const newLoyaltyPoints = stats.loyaltyPoints + pointsEarned;
  const newLifetimePoints = stats.lifetimeLoyaltyPoints + pointsEarned;
  const newTier = getTier(newLifetimePoints);

  // Update stats
  await db.update(loyaltyStats).set({
    currentStreak: newStreak,
    longestStreak: newLongest,
    lastPlayedDate: today,
    totalPicksPlaced: newTotalPicks,
    totalDaysPlayed: newTotalDays,
    loyaltyPoints: newLoyaltyPoints,
    lifetimeLoyaltyPoints: newLifetimePoints,
    tier: newTier,
  }).where(eq(loyaltyStats.userId, userId));

  // Check which milestones are newly earned
  const updatedStats = { currentStreak: newStreak, totalPicksPlaced: newTotalPicks, totalDaysPlayed: newTotalDays };
  const [alreadyEarned] = await Promise.all([
    db.select({ milestoneId: loyaltyMilestones.milestoneId })
      .from(loyaltyMilestones)
      .where(eq(loyaltyMilestones.userId, userId)),
  ]);
  const earnedIds = new Set(alreadyEarned.map(r => r.milestoneId));

  const newlyEarned = MILESTONES.filter(m => !earnedIds.has(m.id) && m.check(updatedStats));

  // Insert newly earned milestones and award credits
  let totalCreditsToAward = 0;
  for (const m of newlyEarned) {
    await db.insert(loyaltyMilestones).values({
      userId,
      milestoneId: m.id,
      title: m.title,
      description: m.description,
      pointsAwarded: m.points,
      creditsAwarded: m.credits,
    });
    totalCreditsToAward += m.credits;
  }

  // Award milestone credits to wallet
  if (totalCreditsToAward > 0) {
    await db.execute(
      `UPDATE wallets SET cashBalance = cashBalance + ${totalCreditsToAward} WHERE userId = ${userId}`
    );
  }

  return {
    newMilestones: newlyEarned.map(m => ({ id: m.id, title: m.title, description: m.description, points: m.points, credits: m.credits })),
    streakUpdated,
    newStreak,
    pointsEarned,
    newTier,
  };
}

// ─── tRPC ROUTER ──────────────────────────────────────────────────────────────

export const loyaltyRouter = router({
  // Get current user's loyalty stats + recent milestones
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const stats = await ensureLoyaltyStats(ctx.user.id);
    const milestones = await db.select()
      .from(loyaltyMilestones)
      .where(eq(loyaltyMilestones.userId, ctx.user.id))
      .orderBy(loyaltyMilestones.earnedAt);
    return { stats, milestones };
  }),

  // Get all milestone definitions with earned status
  getMilestoneProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const stats = await ensureLoyaltyStats(ctx.user.id);
    if (!stats) return [];
    const earned = await db.select({ milestoneId: loyaltyMilestones.milestoneId, earnedAt: loyaltyMilestones.earnedAt })
      .from(loyaltyMilestones)
      .where(eq(loyaltyMilestones.userId, ctx.user.id));
    const earnedMap = new Map(earned.map(e => [e.milestoneId, e.earnedAt]));

    return MILESTONES.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      points: m.points,
      credits: m.credits,
      earned: earnedMap.has(m.id),
      earnedAt: earnedMap.get(m.id) ?? null,
    }));
  }),
});
