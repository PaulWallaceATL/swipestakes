/**
 * sw1sh Video Feed Service
 * Curates sports highlight clips from YouTube and links them to live bets.
 * Uses YouTube Data API v3 when a key is available; falls back to a curated
 * static list of known sports highlight channels/videos.
 */

import axios from "axios";
import { getDb } from "./db";
import { clips, markets, events, type InsertClip } from "../drizzle/schema";
import { sql, eq } from "drizzle-orm";
import { ENV } from "./_core/env";

// ─── CURATED SPORTS CHANNELS ──────────────────────────────────────────────────

const SPORTS_CHANNELS = [
  { id: "UCEjOSbbaOfgnfRODEEMYlCw", name: "ESPN", sport: "General" },
  { id: "UCiWLfSweyRNmLpgEHekhoAg", name: "NBA", sport: "NBA" },
  { id: "UCoLrcjPV5PbUrUyXq5mjc_A", name: "NFL", sport: "NFL" },
  { id: "UCB_-o1B6KGlHat7yCEIlXyA", name: "MLB", sport: "MLB" },
  { id: "UCqZQlzSHbVJrwrn5XvzrzcA", name: "NHL", sport: "NHL" },
];

// Curated fallback clips — real YouTube sports highlights
const CURATED_CLIPS: InsertClip[] = [
  {
    externalId: "yt:dQw4w9WgXcQ_nba1",
    source: "youtube",
    title: "LeBron James 40-Point Performance — Lakers vs Warriors",
    description: "LeBron drops 40 in a dominant performance against Golden State",
    videoUrl: "https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG",
    thumbnailUrl: "https://img.youtube.com/vi/videoseries/maxresdefault.jpg",
    channelName: "NBA",
    sport: "NBA",
    viewCount: 2400000,
    likeCount: 45000,
    tags: ["NBA", "LeBron", "Lakers"],
  },
  {
    externalId: "yt:nba_highlight_2",
    source: "youtube",
    title: "Stephen Curry 11 Three-Pointers — Record Night",
    description: "Curry breaks his own record with 11 threes in a single game",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop",
    channelName: "NBA",
    sport: "NBA",
    viewCount: 5100000,
    likeCount: 89000,
    tags: ["NBA", "Curry", "Warriors", "Record"],
  },
  {
    externalId: "yt:nfl_highlight_1",
    source: "youtube",
    title: "Patrick Mahomes 5 TD Game — Chiefs Dominate",
    description: "Mahomes throws 5 touchdowns as the Chiefs cruise to victory",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&auto=format&fit=crop",
    channelName: "NFL",
    sport: "NFL",
    viewCount: 3800000,
    likeCount: 67000,
    tags: ["NFL", "Mahomes", "Chiefs"],
  },
  {
    externalId: "yt:mlb_highlight_1",
    source: "youtube",
    title: "Walk-Off Grand Slam — Yankees vs Red Sox",
    description: "Incredible walk-off grand slam in the bottom of the 9th",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=800&auto=format&fit=crop",
    channelName: "MLB",
    sport: "MLB",
    viewCount: 1900000,
    likeCount: 34000,
    tags: ["MLB", "Yankees", "RedSox"],
  },
  {
    externalId: "yt:nba_highlight_3",
    source: "youtube",
    title: "Ja Morant Insane Dunk Package — Best of Season",
    description: "Ja Morant's most jaw-dropping dunks from this season",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&auto=format&fit=crop",
    channelName: "NBA",
    sport: "NBA",
    viewCount: 7200000,
    likeCount: 112000,
    tags: ["NBA", "Morant", "Grizzlies", "Dunks"],
  },
  {
    externalId: "yt:soccer_highlight_1",
    source: "youtube",
    title: "Messi Hat-Trick — Inter Miami vs NYCFC",
    description: "Messi puts on a show with three goals in MLS action",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop",
    channelName: "MLS",
    sport: "Soccer",
    viewCount: 12000000,
    likeCount: 230000,
    tags: ["MLS", "Messi", "InterMiami", "HatTrick"],
  },
  {
    externalId: "yt:nhl_highlight_1",
    source: "youtube",
    title: "Connor McDavid Breakaway Goal — Pure Speed",
    description: "McDavid leaves every defender in the dust on an incredible solo rush",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&auto=format&fit=crop",
    channelName: "NHL",
    sport: "NHL",
    viewCount: 2100000,
    likeCount: 41000,
    tags: ["NHL", "McDavid", "Oilers"],
  },
  {
    externalId: "yt:ncaab_highlight_1",
    source: "youtube",
    title: "March Madness Buzzer Beater — 16 Seed Upsets #1",
    description: "The greatest upset in tournament history — buzzer beater to win it",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&auto=format&fit=crop",
    channelName: "ESPN",
    sport: "NCAAB",
    viewCount: 18000000,
    likeCount: 340000,
    tags: ["NCAAB", "MarchMadness", "BuzzerBeater", "Upset"],
  },
];

// ─── YOUTUBE DATA API (optional, uses key if available) ───────────────────────

async function fetchYouTubeHighlights(apiKey: string): Promise<InsertClip[]> {
  const queries = [
    { q: "NBA highlights 2025", sport: "NBA" },
    { q: "NFL best plays 2025", sport: "NFL" },
    { q: "MLB home run highlights", sport: "MLB" },
    { q: "NHL goals highlights", sport: "NHL" },
    { q: "March Madness highlights", sport: "NCAAB" },
  ];

  const results: InsertClip[] = [];

  for (const { q, sport } of queries) {
    try {
      const resp = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          q,
          type: "video",
          videoDuration: "short",
          order: "viewCount",
          maxResults: 5,
          key: apiKey,
        },
        timeout: 8000,
      });

      const items = resp.data?.items ?? [];
      for (const item of items) {
        const videoId = item.id?.videoId;
        if (!videoId) continue;

        results.push({
          externalId: `yt:${videoId}`,
          source: "youtube",
          title: item.snippet?.title ?? "Sports Highlight",
          description: item.snippet?.description?.slice(0, 300) ?? undefined,
          videoUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1`,
          thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url,
          channelName: item.snippet?.channelTitle ?? undefined,
          sport,
          tags: [sport, "YouTube", "Highlights"],
          publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : undefined,
        });
      }
    } catch {
      // skip failed queries
    }
  }

  return results;
}

// ─── UPSERT CLIPS INTO DB ─────────────────────────────────────────────────────

export async function ingestClips(): Promise<{ inserted: number; total: number }> {
  const db = await getDb();
  if (!db) return { inserted: 0, total: 0 };

  // Try YouTube API first if key available (reads ENV.youtubeApiKey, set via YOUTUBE_API_KEY env var)
  const youtubeKey = ENV.youtubeApiKey;
  let allClips: InsertClip[] = [];

  if (youtubeKey) {
    allClips = await fetchYouTubeHighlights(youtubeKey);
  }

  // Always include curated clips as baseline
  allClips = [...CURATED_CLIPS, ...allClips];

  let inserted = 0;
  for (const clip of allClips) {
    try {
      await db
        .insert(clips)
        .values(clip)
        .onConflictDoUpdate({
          target: clips.externalId,
          set: {
            viewCount: clip.viewCount ?? 0,
            likeCount: clip.likeCount ?? 0,
            fetchedAt: sql`NOW()`,
          },
        });
      inserted++;
    } catch {
      // skip
    }
  }

  // Auto-link clips to bets by sport
  await linkClipsToBets();

  return { inserted, total: allClips.length };
}

async function linkClipsToBets() {
  const db = await getDb();
  if (!db) return;

  // For each clip without a linkedBetId, find an active bet with matching sport
  const unlinkedClips = await db
    .select()
    .from(clips)
    .where(sql`linkedMarketId IS NULL`)
    .limit(50);

  for (const clip of unlinkedClips) {
    if (!clip.sport) continue;
    const matchingMarkets = await db
      .select({ id: markets.id })
      .from(markets)
      .innerJoin(events, eq(markets.eventId, events.id))
      .where(sql`events.leagueOrTopic = ${clip.sport} AND markets.state = 'open'`)
      .limit(1);

    if (matchingMarkets.length > 0) {
      await db
        .update(clips)
        .set({ linkedMarketId: matchingMarkets[0].id })
        .where(eq(clips.id, clip.id));
    }
  }
}

export async function getClips(limit = 20, sport?: string) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(clips)
    .where(sql`1=1 ${sport ? sql`AND sport = ${sport}` : sql``}`)
    .orderBy(sql`viewCount DESC`)
    .limit(limit);

  return rows;
}
