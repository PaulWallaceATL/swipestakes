/**
 * tRPC batch requests: /api/trpc/* (multi-segment).
 * Vercel does not route these to api/[...slug].ts reliably with SPA rewrites.
 */
export { default } from "../_app.js";
