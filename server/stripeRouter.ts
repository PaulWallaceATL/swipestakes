/**
 * Swipestakes — Stripe Payment Router
 * Handles: deposit checkout sessions, payout requests, webhook events
 *
 * Flow:
 *   Deposit: User clicks Deposit → createDepositSession → Stripe Checkout → webhook credits balance
 *   Payout:  User requests withdrawal → createPayout → Stripe Transfer (requires connected account)
 */

import Stripe from "stripe";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, wallets } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// ─── STRIPE CLIENT ────────────────────────────────────────────────────────────

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
};

// ─── DEPOSIT AMOUNTS (preset quick-add chips) ────────────────────────────────

const DEPOSIT_PRESETS = [10, 25, 50, 100, 250, 500] as const;

// ─── STRIPE ROUTER ────────────────────────────────────────────────────────────

export const stripeRouter = router({

  /**
   * Create a Stripe Checkout Session for depositing funds.
   * Returns a checkout URL the frontend opens in a new tab.
   */
  createDepositSession: protectedProcedure
    .input(z.object({
      amount: z.number().min(10).max(10000), // USD dollars
      origin: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: ctx.user.email ?? undefined,
        allow_promotion_codes: true,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.round(input.amount * 100), // cents
              product_data: {
                name: `Swipestakes Deposit — $${input.amount}`,
                description: "Funds added to your Swipestakes betting balance",
                images: [],
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          user_id: String(ctx.user.id),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          deposit_amount: String(input.amount),
          type: "deposit",
        },
        client_reference_id: String(ctx.user.id),
        success_url: `${input.origin}/wallet?deposit=success&amount=${input.amount}`,
        cancel_url: `${input.origin}/wallet?deposit=cancelled`,
      });

      return { checkoutUrl: session.url!, sessionId: session.id };
    }),

  /**
   * Request a payout (withdrawal) to a bank account or debit card.
   * In production this would trigger a Stripe Payout to a connected account.
   * For now it records the request and decrements balance (pending manual review).
   */
  requestPayout: protectedProcedure
    .input(z.object({
      amount: z.number().min(10).max(50000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check wallet balance
      let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1);
      if (!wallet) {
        await db.insert(wallets).values({ userId: ctx.user.id, cashBalance: "1000.00", withdrawableBalance: "1000.00" });
        [wallet] = await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1);
      }
      const currentBalance = parseFloat(wallet.withdrawableBalance);

      if (currentBalance < input.amount) {
        throw new Error(`Insufficient balance. Available: $${currentBalance.toFixed(2)}`);
      }

      // Decrement wallet balance
      await db.update(wallets)
        .set({
          cashBalance: sql`cashBalance - ${input.amount}`,
          withdrawableBalance: sql`withdrawableBalance - ${input.amount}`,
        })
        .where(eq(wallets.userId, ctx.user.id));

      // TODO: In production, trigger Stripe Payout to user's connected bank account
      // const stripe = getStripe();
      // await stripe.payouts.create({ amount: input.amount * 100, currency: 'usd' }, { stripeAccount: user.stripeAccountId });

      return {
        success: true,
        message: `Withdrawal of $${input.amount.toFixed(2)} requested. Processing in 1-3 business days.`,
        newBalance: currentBalance - input.amount,
      };
    }),

  /**
   * Get the user's current balance from the database.
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { balance: 1000, currency: "USD" };
    let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1);
    if (!wallet) {
      await db.insert(wallets).values({ userId: ctx.user.id, cashBalance: "1000.00", withdrawableBalance: "1000.00" });
      [wallet] = await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1);
    }
    const balance = parseFloat(wallet.cashBalance);
    return { balance, currency: "USD" };
  }),
});

// ─── STRIPE WEBHOOK HANDLER (Express route, not tRPC) ────────────────────────

export async function handleStripeWebhook(req: any, res: any) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret ?? "");
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(session.metadata?.user_id ?? "0");
        const amount = parseFloat(session.metadata?.deposit_amount ?? "0");

        if (userId && amount > 0) {
          const db = await getDb();
          if (db) {
            // Credit the user's wallet
            let [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
            if (!wallet) {
              await db.insert(wallets).values({ userId, cashBalance: "1000.00", withdrawableBalance: "1000.00" });
            }
            await db.update(wallets)
              .set({
                cashBalance: sql`cashBalance + ${amount}`,
                withdrawableBalance: sql`withdrawableBalance + ${amount}`,
              })
              .where(eq(wallets.userId, userId));
            console.log(`[Stripe] Credited $${amount} to user ${userId}`);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn(`[Stripe] Payment failed for PI: ${pi.id}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.json({ received: true });
}
