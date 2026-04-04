import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authenticateRequest } from "./supabaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateRequest(opts.req);
  } catch (err) {
    // If the request carried a Bearer token but the server is misconfigured,
    // surface the error instead of silently treating the user as a guest.
    const hasToken = opts.req.headers.authorization?.startsWith("Bearer ");
    if (hasToken) {
      console.error("[Context] authenticateRequest threw with a token present:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "Server misconfiguration — cannot verify your session. " +
          "Check DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
      });
    }
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
