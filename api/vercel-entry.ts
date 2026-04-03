/**
 * Bundled by esbuild during `pnpm build` → api/_app.js (see package.json).
 * Vercel serverless imports only from the api/ folder unless includeFiles is used;
 * bundling pulls in server/, shared/, drizzle/ and fixes @shared path aliases.
 */
import { createApiApp } from "../server/_core/apiApp";

const app = createApiApp();
export default app;
