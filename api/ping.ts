/**
 * Minimal handler to verify Vercel deploys `/api/*` at all.
 * Open: /api/ping → should return JSON (not 404).
 */
import type { IncomingMessage, ServerResponse } from "node:http";

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ ok: true, service: "sw1sh-api-ping" }));
}
