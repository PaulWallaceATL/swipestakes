import "dotenv/config";
import cors from "cors";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "../stripeRouter";

/**
 * Express app with API routes only (no Vite / static). Used by Vercel serverless
 * and composed with static file serving for local `pnpm start`.
 */
export function createApiApp() {
  const app = express();

  // Vercel: nested `api/trpc/[...path].ts` + rewrites may send
  // `/api/trpc/[...path]?match=real/procedure&batch=1` — restore so Express matches `/api/trpc`.
  app.use((req, _res, next) => {
    const u = req.url ?? "/";
    try {
      const parsed = new URL(u, "http://vercel.local");
      const match = parsed.searchParams.get("match");
      if (
        match &&
        !match.startsWith("/") &&
        !match.includes("..") &&
        (parsed.pathname.includes("[...path]") || parsed.pathname.includes("%5B...path%5D"))
      ) {
        parsed.searchParams.delete("match");
        const qs = parsed.searchParams.toString();
        req.url = `/api/trpc/${match}${qs ? `?${qs}` : ""}`;
      }
    } catch {
      /* ignore malformed url */
    }

    const origPath = req.originalUrl?.split("?")[0] ?? "";
    const u2 = req.url ?? "/";
    if (origPath.startsWith("/api") && (!u2.startsWith("/api") || u2 === "/" || u2 === "")) {
      const qs = req.originalUrl?.includes("?")
        ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
        : "";
      req.url = origPath + qs;
    }
    next();
  });

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    }),
  );

  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
  );

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
