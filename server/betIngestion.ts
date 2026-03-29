/**
 * Swipestakes Market Ingestion Service
 * Fetches live markets from Kalshi and Polymarket, normalises them
 * into the new events → markets → outcomes schema, and upserts into the DB.
 */

import axios from "axios";
import { getDb } from "./db";
import { events, markets, outcomes, type InsertEvent, type InsertMarket, type InsertOutcome } from "../drizzle/schema";
import { sql, eq } from "drizzle-orm";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function priceToAmericanOdds(prob: number): string {
  const p = Math.max(0.01, Math.min(0.99, prob));
  let numeric: number;
  if (p >= 0.5) {
    numeric = -Math.round((p / (1 - p)) * 100);
  } else {
    numeric = Math.round(((1 - p) / p) * 100);
  }
  return numeric > 0 ? `+${numeric}` : `${numeric}`;
}

// ─── CATEGORY INFERENCE ───────────────────────────────────────────────────────

type EventCategory =
  | "sports" | "politics" | "geopolitical"
  | "finance" | "tech" | "culture"
  | "entertainment" | "science" | "daily";

function inferCategory(text: string, tags: string[] = []): EventCategory {
  const t = [text, ...tags].join(" ").toLowerCase();
  if (/\b(nba|nfl|mlb|nhl|ncaa|soccer|mls|premier league|ufc|mma|tennis|golf|f1|formula|nascar|boxing|esports|olympic|basketball|baseball|hockey|football)\b/.test(t)) return "sports";
  if (/\b(president|senate|congress|election|vote|democrat|republican|white house|supreme court|governor|mayor|ballot|legislation|bill|policy)\b/.test(t)) return "politics";
  if (/\b(war|nato|russia|ukraine|china|taiwan|israel|iran|north korea|sanctions|military|troops|invasion|ceasefire|treaty|united nations|conflict|missile|nuclear)\b/.test(t)) return "geopolitical";
  if (/\b(fed|federal reserve|interest rate|cpi|inflation|gdp|recession|stock|s&p|nasdaq|dow|bitcoin|btc|eth|crypto|ipo|earnings|revenue|market cap|bond|yield|dollar|euro)\b/.test(t)) return "finance";
  if (/\b(apple|google|microsoft|meta|amazon|openai|anthropic|gpt|ai|artificial intelligence|chatgpt|gemini|llm|chip|semiconductor|nvidia|tesla|spacex|starlink|software|startup|vc|funding|tech)\b/.test(t)) return "tech";
  if (/\b(oscar|grammy|emmy|golden globe|award|movie|film|album|song|artist|celebrity|taylor swift|beyonce|drake|box office)\b/.test(t)) return "entertainment";
  if (/\b(nasa|space|moon|mars|climate|temperature|hurricane|earthquake|volcano|covid|vaccine|fda|drug|trial|genome|crispr)\b/.test(t)) return "science";
  return "daily";
}

function inferSport(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("nba") || t.includes("basketball")) return "NBA";
  if (t.includes("mlb") || t.includes("baseball")) return "MLB";
  if (t.includes("nhl") || t.includes("hockey")) return "NHL";
  if (t.includes("nfl") || t.includes("football")) return "NFL";
  if (t.includes("ncaa") || t.includes("march madness") || t.includes("ncaab")) return "NCAAB";
  if (t.includes("soccer") || t.includes("mls") || t.includes("premier league") || t.includes("champions league")) return "Soccer";
  if (t.includes("tennis") || t.includes("wimbledon")) return "Tennis";
  if (t.includes("ufc") || t.includes("mma")) return "MMA";
  if (t.includes("golf") || t.includes("pga")) return "Golf";
  if (t.includes("f1") || t.includes("formula 1")) return "F1";
  return null;
}

function isImminentResolution(closeTimeStr?: string | null): boolean {
  if (!closeTimeStr) return false;
  const closeTime = new Date(closeTimeStr).getTime();
  const now = Date.now();
  const hoursUntilClose = (closeTime - now) / (1000 * 60 * 60);
  return hoursUntilClose >= 0 && hoursUntilClose <= 48;
}

// ─── NORMALISED MARKET TYPE ───────────────────────────────────────────────────

interface NormalisedMarket {
  externalId: string;
  source: "kalshi" | "polymarket";
  sourceUrl: string;
  question: string;
  description?: string;
  category: EventCategory;
  sport: string | null;
  tags: string[];
  yesPrice: number; // 0.0–1.0
  closeTime?: string;
  imageUrl?: string;
  rawData: unknown;
}

// ─── KALSHI ───────────────────────────────────────────────────────────────────

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

const KALSHI_SERIES = [
  "KXNBAGAME", "KXMLBGAME", "KXNHLGAME", "KXNFLGAME", "KXNCAABGAME", "KXSOCCER",
  "KXBTC", "KXETH", "KXFED", "KXCPI", "KXPOLITICS",
];

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  yes_bid?: number;
  yes_ask?: number;
  close_time?: string;
  series_ticker?: string;
}

async function fetchKalshiMarkets(): Promise<NormalisedMarket[]> {
  const results: NormalisedMarket[] = [];

  for (const series of KALSHI_SERIES) {
    try {
      const resp = await axios.get(`${KALSHI_BASE}/markets`, {
        params: { series_ticker: series, status: "open", limit: 20 },
        timeout: 8000,
        headers: { Accept: "application/json" },
      });

      const mkts: KalshiMarket[] = resp.data?.markets ?? [];

      for (const m of mkts) {
        if (!m.ticker || !m.title) continue;
        const yesPrice = ((m.yes_bid ?? m.yes_ask ?? 50)) / 100;
        const category = inferCategory(m.title, [series]);
        const sport = category === "sports" ? inferSport(m.ticker + " " + m.title) : null;

        results.push({
          externalId: `kalshi:${m.ticker}`,
          source: "kalshi",
          sourceUrl: `https://kalshi.com/markets/${m.ticker}`,
          question: m.title,
          description: m.subtitle,
          category,
          sport,
          tags: [series, "Kalshi"],
          yesPrice,
          closeTime: m.close_time,
          rawData: m,
        });
      }
    } catch {
      // silently skip failed series
    }
  }

  return results;
}

// ─── POLYMARKET ───────────────────────────────────────────────────────────────

const POLY_BASE = "https://gamma-api.polymarket.com";

interface PolyMarket {
  id: string;
  question: string;
  description?: string;
  outcomePrices?: string;
  endDate?: string;
  tags?: Array<{ label: string }>;
  image?: string;
}

async function fetchPolymarketMarkets(): Promise<NormalisedMarket[]> {
  const results: NormalisedMarket[] = [];
  const tagSlugs = ["sports", "politics", "crypto", "technology", "entertainment"];

  for (const tagSlug of tagSlugs) {
    try {
      const resp = await axios.get(`${POLY_BASE}/markets`, {
        params: { active: true, closed: false, tag_slug: tagSlug, limit: 20, order: "volume", ascending: false },
        timeout: 10000,
        headers: { Accept: "application/json" },
      });

      const mkts: PolyMarket[] = Array.isArray(resp.data) ? resp.data : [];

      for (const m of mkts) {
        if (!m.id || !m.question) continue;

        let yesPrice = 0.5;
        try {
          const prices = JSON.parse(m.outcomePrices ?? "[]");
          if (prices.length > 0) yesPrice = parseFloat(prices[0]);
        } catch { /* default */ }

        const polyTags = m.tags?.map((t) => t.label) ?? [];
        const category = inferCategory(m.question, polyTags);
        const sport = category === "sports" ? inferSport(m.question + " " + polyTags.join(" ")) : null;

        results.push({
          externalId: `polymarket:${m.id}`,
          source: "polymarket",
          sourceUrl: `https://polymarket.com/event/${m.id}`,
          question: m.question,
          description: m.description?.slice(0, 500),
          category,
          sport,
          tags: ["Polymarket", ...polyTags],
          yesPrice,
          closeTime: m.endDate,
          imageUrl: m.image,
          rawData: m,
        });
      }
    } catch { /* silently fail per tag */ }
  }

  return results;
}

// ─── UPSERT INTO DB ───────────────────────────────────────────────────────────

export async function ingestMarkets(): Promise<{ inserted: number; total: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, total: 0 };

  const [kalshiMkts, polyMkts] = await Promise.all([
    fetchKalshiMarkets(),
    fetchPolymarketMarkets(),
  ]);

  const allMkts = [...kalshiMkts, ...polyMkts];
  let inserted = 0;

  for (const m of allMkts) {
    try {
      // 1. Upsert event
      const eventRow: InsertEvent = {
        externalId: m.externalId,
        source: m.source,
        category: m.category,
        leagueOrTopic: m.sport ?? undefined,
        title: m.question,
        description: m.description,
        endTime: m.closeTime ? new Date(m.closeTime) : undefined,
        status: "scheduled",
        tags: m.tags,
        imageUrl: m.imageUrl,
      };

      await db
        .insert(events)
        .values(eventRow)
        .onConflictDoUpdate({
          target: events.externalId,
          set: {
            title: eventRow.title,
            description: eventRow.description,
            tags: eventRow.tags,
            updatedAt: sql`NOW()`,
          },
        });

      const [existingEvent] = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.externalId, m.externalId))
        .limit(1);

      if (!existingEvent) continue;

      const yesPrice = m.yesPrice;
      const noPrice = 1 - yesPrice;

      // 2. Upsert market
      const marketRow: InsertMarket = {
        eventId: existingEvent.id,
        externalId: `mkt:${m.externalId}`,
        source: m.source,
        sourceUrl: m.sourceUrl,
        question: m.question,
        marketType: "binary",
        resolutionDeadline: m.closeTime ? new Date(m.closeTime) : undefined,
        tradingCloseAt: m.closeTime ? new Date(m.closeTime) : undefined,
        state: "open",
        yesPrice: String(yesPrice.toFixed(4)),
        noPrice: String(noPrice.toFixed(4)),
        aiConfidence: Math.round(Math.abs(yesPrice - 0.5) * 150 + 40),
        rawData: m.rawData,
      };

      await db
        .insert(markets)
        .values(marketRow)
        .onConflictDoUpdate({
          target: markets.externalId,
          set: {
            yesPrice: marketRow.yesPrice,
            noPrice: marketRow.noPrice,
            aiConfidence: marketRow.aiConfidence,
            updatedAt: sql`NOW()`,
          },
        });

      const [existingMarket] = await db
        .select({ id: markets.id })
        .from(markets)
        .where(eq(markets.externalId, `mkt:${m.externalId}`))
        .limit(1);

      if (!existingMarket) continue;

      // 3. Upsert YES/NO outcomes
      const existingOutcomes = await db
        .select({ id: outcomes.id })
        .from(outcomes)
        .where(eq(outcomes.marketId, existingMarket.id))
        .limit(1);

      if (existingOutcomes.length === 0) {
        await db.insert(outcomes).values([
          { marketId: existingMarket.id, label: "YES", sortOrder: 0, currentPrice: String(yesPrice.toFixed(4)), impliedProbability: String(yesPrice.toFixed(4)) },
          { marketId: existingMarket.id, label: "NO", sortOrder: 1, currentPrice: String(noPrice.toFixed(4)), impliedProbability: String(noPrice.toFixed(4)) },
        ]);
      } else {
        await db.update(outcomes).set({ currentPrice: String(yesPrice.toFixed(4)), impliedProbability: String(yesPrice.toFixed(4)) }).where(sql`marketId = ${existingMarket.id} AND label = 'YES'`);
        await db.update(outcomes).set({ currentPrice: String(noPrice.toFixed(4)), impliedProbability: String(noPrice.toFixed(4)) }).where(sql`marketId = ${existingMarket.id} AND label = 'NO'`);
      }

      inserted++;
    } catch {
      // skip individual failures
    }
  }

  return { inserted, total: allMkts.length };
}

// ─── BACKWARDS COMPAT ALIAS ───────────────────────────────────────────────────
export const ingestBets = ingestMarkets;

// ─── QUERY HELPERS ────────────────────────────────────────────────────────────

export interface MarketCard {
  id: number;
  externalId: string | null;
  source: string;
  sourceUrl: string | null;
  question: string;
  category: string;
  sport: string | null;
  tags: string[];
  yesPrice: number;
  noPrice: number;
  aiConfidence: number;
  isLive: boolean;
  resolutionDeadline: Date | null;
  imageUrl: string | null;
  eventTitle: string;
  eventId: number;
  marketId: number;
}

export async function getActiveMarkets(limit = 50, category?: string): Promise<MarketCard[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: markets.id,
      externalId: markets.externalId,
      source: markets.source,
      sourceUrl: markets.sourceUrl,
      question: markets.question,
      yesPrice: markets.yesPrice,
      noPrice: markets.noPrice,
      aiConfidence: markets.aiConfidence,
      resolutionDeadline: markets.resolutionDeadline,
      eventId: events.id,
      eventTitle: events.title,
      eventCategory: events.category,
      eventSport: events.leagueOrTopic,
      eventTags: events.tags,
      eventImageUrl: events.imageUrl,
    })
    .from(markets)
    .innerJoin(events, eq(markets.eventId, events.id))
    .where(
      category && category !== "all"
        ? sql`markets.state = 'open' AND events.category = ${category}`
        : sql`markets.state = 'open'`
    )
    .orderBy(sql`markets.updatedAt DESC`)
    .limit(limit);

  return rows.map((r) => {
    const yesPrice = parseFloat(String(r.yesPrice ?? "0.5"));
    const noPrice = parseFloat(String(r.noPrice ?? "0.5"));
    const deadline = r.resolutionDeadline;
    // isLive = true only when event is currently in progress:
    // resolution deadline exists AND is in the future but within 6h, meaning trading is actively happening
    // OR event.status === 'live' (set by admin/oracle)
    const hoursUntil = deadline
      ? (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60)
      : 999;
    const isLive = hoursUntil >= 0 && hoursUntil <= 6;

    return {
      id: r.id,
      externalId: r.externalId,
      source: r.source,
      sourceUrl: r.sourceUrl,
      question: r.question,
      category: r.eventCategory,
      sport: r.eventSport ?? null,
      tags: (r.eventTags as string[]) ?? [],
      yesPrice,
      noPrice,
      aiConfidence: r.aiConfidence ?? 60,
      isLive,
      resolutionDeadline: deadline,
      imageUrl: r.eventImageUrl ?? null,
      eventTitle: r.eventTitle,
      eventId: r.eventId,
      marketId: r.id,
    };
  });
}

// Legacy alias
export const getActiveBets = getActiveMarkets;
