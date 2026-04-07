import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getGamePickDate } from "./_core/gameDay";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { userReferralCodes, referrals, extraPickPurchases } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

async function getOrCreateReferralCode(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
): Promise<string> {
  const [existing] = await db
    .select()
    .from(userReferralCodes)
    .where(eq(userReferralCodes.userId, userId))
    .limit(1);
  if (existing) return existing.code;

  const code = nanoid(8);
  await db
    .insert(userReferralCodes)
    .values({ userId, code })
    .onConflictDoUpdate({ target: userReferralCodes.userId, set: { code } });
  return code;
}

export const referralRouter = router({
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const code = await getOrCreateReferralCode(db, ctx.user.id);
    return { code };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const code = await getOrCreateReferralCode(db, ctx.user.id);

    const completed = await db
      .select()
      .from(referrals)
      .where(
        and(eq(referrals.referrerId, ctx.user.id), eq(referrals.status, "completed")),
      );

    const totalReferred = completed.length;
    const picksEarned = Math.floor(totalReferred / 10) * 5;

    return { code, totalReferred, picksEarned };
  }),

  /** Called after a new user signs up with a referral code. */
  claimReferral: publicProcedure
    .input(z.object({ referralCode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) return { success: false, error: "Not authenticated" };
      const db = await getDb();
      if (!db) return { success: false, error: "DB unavailable" };

      const [codeRow] = await db
        .select()
        .from(userReferralCodes)
        .where(eq(userReferralCodes.code, input.referralCode))
        .limit(1);

      if (!codeRow) return { success: false, error: "Invalid referral code" };
      if (codeRow.userId === ctx.user.id) return { success: false, error: "Cannot refer yourself" };

      const [existing] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referralCode, input.referralCode),
            eq(referrals.referredUserId, ctx.user.id),
          ),
        )
        .limit(1);

      if (existing) return { success: true, alreadyClaimed: true };

      await db.insert(referrals).values({
        referrerId: codeRow.userId,
        referredUserId: ctx.user.id,
        referralCode: input.referralCode,
        status: "completed",
      });

      // Check if referrer hit a new milestone of 10
      const [{ count: totalStr }] = await db
        .select({ count: sql<string>`count(*)` })
        .from(referrals)
        .where(
          and(eq(referrals.referrerId, codeRow.userId), eq(referrals.status, "completed")),
        );

      const total = Number(totalStr);
      if (total > 0 && total % 10 === 0) {
        const today = getGamePickDate();
        await db.insert(extraPickPurchases).values({
          userId: codeRow.userId,
          pickDate: today,
          source: "referral",
          quantity: 5,
        });
      }

      return { success: true };
    }),
});
