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

  // Vercel may invoke the function with a truncated req.url; restore from originalUrl so
  // /api/trpc/* matches app.use("/api/trpc", ...).
  app.use((req, _res, next) => {
    const origPath = req.originalUrl?.split("?")[0] ?? "";
    const u = req.url ?? "/";
    if (origPath.startsWith("/api") && (!u.startsWith("/api") || u === "/" || u === "")) {
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
