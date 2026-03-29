/**
 * Adapters that map tRPC backend rows → frontend Bet / Clip / Transaction shapes.
 * This keeps the UI components decoupled from the DB schema.
 */

import type { Bet, Clip, Transaction } from "./mockData";

// ─── MARKET CARD ADAPTER ──────────────────────────────────────────────────────
// Shape returned by trpc.markets.list / trpc.bets.list

export interface BackendMarket {
  id: number;
  externalId?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  question: string;
  category?: string | null;
  sport?: string | null;
  tags?: unknown;
  yesPrice?: number | null;
  noPrice?: number | null;
  aiConfidence?: number | null;
  isLive?: boolean | null;
  resolutionDeadline?: Date | string | null;
  imageUrl?: string | null;
  eventTitle?: string | null;
  eventId?: number | null;
  marketId?: number | null;
}

const CATEGORY_IMAGES: Record<string, string> = {
  sports: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=600&q=80",
  politics: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80",
  geopolitical: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
  finance: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
  tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
  science: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80",
  daily: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
  culture: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
};

const SPORT_IMAGES: Record<string, string> = {
  NBA: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=600&q=80",
  NFL: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=80",
  MLB: "https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=600&q=80",
  NHL: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=600&q=80",
  Soccer: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80",
  NCAAB: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80",
  MMA: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80",
  Tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  Golf: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80";

/** Convert a probability (0.0–1.0) to American odds string */
function probToAmericanOdds(prob: number): { odds: string; numeric: number } {
  const p = Math.max(0.01, Math.min(0.99, prob));
  let numeric: number;
  if (p >= 0.5) {
    numeric = -Math.round((p / (1 - p)) * 100);
  } else {
    numeric = Math.round(((1 - p) / p) * 100);
  }
  return { odds: numeric > 0 ? `+${numeric}` : `${numeric}`, numeric };
}

/** Map category string to Bet["type"] */
function categoryToType(category: string | null | undefined): Bet["type"] {
  switch (category) {
    case "sports": return "sports";
    case "politics": return "political";
    case "geopolitical": return "geopolitical";
    case "finance": return "narrative";
    case "tech": return "ai";
    case "entertainment":
    case "culture": return "culture";
    default: return "binary";
  }
}

export function adaptBackendMarket(m: BackendMarket): Bet {
  const yesPrice = m.yesPrice ?? 0.5;
  const { odds, numeric } = probToAmericanOdds(yesPrice);
  const category = m.category ?? "daily";
  const sport = m.sport;
  const tags: string[] = Array.isArray(m.tags) ? (m.tags as string[]) : [];

  const image =
    m.imageUrl ??
    (sport ? SPORT_IMAGES[sport] : null) ??
    CATEGORY_IMAGES[category] ??
    DEFAULT_IMAGE;

  const deadline = m.resolutionDeadline ? new Date(m.resolutionDeadline) : null;
  const gameTime = deadline
    ? deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

  return {
    id: String(m.id),
    type: categoryToType(category),
    sport: sport ?? category,
    statement: m.question,
    subtext: m.eventTitle ?? "",
    odds,
    oddsNumeric: numeric,
    confidence: m.aiConfidence ?? 60,
    aiConfidence: m.aiConfidence ?? undefined,
    stake: 50,
    potentialPayout: 50 / yesPrice,
    status: "active",
    gameTime,
    isLive: m.isLive ?? false,
    tags,
    image,
    narrative: `${(yesPrice * 100).toFixed(0)}% YES probability`,
    source: (m.source as Bet["source"]) ?? "swipestakes",
    sourceUrl: m.sourceUrl ?? undefined,
    // Store marketId for bet placement
    marketId: m.marketId ?? m.id,
    category,
  };
}

// Legacy alias — some files still call adaptBackendBet
export const adaptBackendBet = adaptBackendMarket;

// ─── CLIP ADAPTER ─────────────────────────────────────────────────────────────

export interface BackendClip {
  id: number;
  externalId?: string | null;
  source?: string | null;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  channelName?: string | null;
  sport?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
  tags?: unknown;
  linkedMarket?: BackendMarket | null;
  // Legacy field
  linkedBet?: BackendMarket | null;
}

export function adaptBackendClip(c: BackendClip): Clip {
  const viewCount = c.viewCount ?? 0;
  const likeCount = c.likeCount ?? 0;

  const formatCount = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };

  const linked = c.linkedMarket ?? c.linkedBet ?? null;

  return {
    id: String(c.id),
    title: c.title,
    description: c.description ?? "",
    videoThumb: c.thumbnailUrl ?? DEFAULT_IMAGE,
    videoUrl: c.videoUrl ?? undefined,
    duration: "0:45",
    views: formatCount(viewCount),
    sport: c.sport ?? "Sports",
    relatedBetId: linked ? String(linked.id) : "",
    relatedBet: linked
      ? {
          statement: linked.question,
          odds: probToAmericanOdds(linked.yesPrice ?? 0.5).odds,
          result: "active" as const,
          payout: `$${(50 / (linked.yesPrice ?? 0.5)).toFixed(0)}`,
        }
      : { statement: "No linked market", odds: "N/A" },
    likes: formatCount(likeCount),
    shares: formatCount(Math.floor(likeCount * 0.3)),
    isLive: false,
  };
}

// ─── POSITION → TRANSACTION ADAPTER ──────────────────────────────────────────

export interface BackendPosition {
  id: number;
  marketQuestion?: string | null;
  outcomeLabel?: string | null;
  totalStaked?: string | null;
  potentialPayout?: string | null;
  status?: string | null;
  eventCategory?: string | null;
  placedAt?: Date | null;
}

export function adaptPositionToTransaction(p: BackendPosition): Transaction {
  const stake = parseFloat(p.totalStaked ?? "0");
  const payout = parseFloat(p.potentialPayout ?? "0");
  const isWon = p.status === "won";
  const isLost = p.status === "lost";

  return {
    id: String(p.id),
    type: isWon ? "win" : isLost ? "loss" : "bet",
    amount: isWon ? payout : -stake,
    description: (p.marketQuestion ?? "Bet").slice(0, 60),
    timestamp: p.placedAt ? new Date(p.placedAt).toLocaleDateString() : "Today",
    status: (p.status === "won" || p.status === "lost" ? "completed" : "pending") as Transaction["status"],
  };
}

// Legacy alias
export const adaptPlacedBetToTransaction = adaptPositionToTransaction;
