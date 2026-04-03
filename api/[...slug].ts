/**
 * Catch-all under /api so /api/trpc/* (and /api/stripe/webhook, etc.) hit Express.
 * `api/index.ts` only matched the exact path /api on Vercel, which broke tRPC.
 */
import { createApiApp } from "../server/_core/apiApp";

const app = createApiApp();
export default app;
