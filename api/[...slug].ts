/**
 * Catch-all under /api so /api/trpc/* (and /api/stripe/webhook, etc.) hit Express.
 * Shared bundle built in `pnpm build` → api/_app.js (see api/vercel-entry.ts).
 */
export { default } from "./_app.js";
