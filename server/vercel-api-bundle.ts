/**
 * Bundled by esbuild during `pnpm build` → api/_app.js (see package.json).
 * Kept outside `api/` so Vercel does not deploy this file as its own /api route.
 */
import { createApiApp } from "./_core/apiApp";

const app = createApiApp();
export default app;
