// sw1sh — Bet Scraper Service
// Fetches live markets from Kalshi & Polymarket and maps them to sw1sh Bet format
// Categories: NBA, MLB, NHL, Soccer, March Madness, Culture/Narrative

import { type Bet, type BetType } from './mockData';

// ─── SPORT IMAGE MAP ────────────────────────────────────────────────────────
const SPORT_IMAGES: Record<string, string> = {
  NBA: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/sw1sh-hero-basketball-Rzbju9dXcuvRZgivmwkUwd.webp',
  MLB: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=600&q=80',
  NHL: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=600&q=80',
  NFL: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/sw1sh-hero-football-hZTx8CkqnTg9jjSBuo2M2G.webp',
  Soccer: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&q=80',
  Tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80',
  NCAAB: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80',
  Culture: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
};

// ─── KALSHI API ──────────────────────────────────────────────────────────────
const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

// Series tickers we want to pull from
const KALSHI_SERIES = [
  { ticker: 'KXNBAGAME', sport: 'NBA', type: 'sports' as BetType },
  { ticker: 'KXMLBGAME', sport: 'MLB', type: 'sports' as BetType },
  { ticker: 'KXNHLGAME', sport: 'NHL', type: 'sports' as BetType },
  { ticker: 'KXNBASERIES', sport: 'NBA', type: 'sports' as BetType },
];

// ─── POLYMARKET API ──────────────────────────────────────────────────────────
const POLY_BASE = 'https://gamma-api.polymarket.com';

// ─── PRICE → AMERICAN ODDS CONVERSION ───────────────────────────────────────
function priceToAmericanOdds(price: number): { display: string; numeric: number } {
  if (price <= 0 || price >= 1) return { display: '+100', numeric: 100 };
  if (price >= 0.5) {
    const odds = -Math.round((price / (1 - price)) * 100);
    return { display: `${odds}`, numeric: odds };
  } else {
    const odds = Math.round(((1 - price) / price) * 100);
    return { display: `+${odds}`, numeric: odds };
  }
}

// ─── CONFIDENCE FROM PRICE ───────────────────────────────────────────────────
function priceToConfidence(price: number): number {
  // Convert market price to a confidence score (50-95 range)
  const raw = Math.abs(price - 0.5) * 2; // 0 = coin flip, 1 = certain
  return Math.round(50 + raw * 45);
}

// ─── MAP KALSHI EVENT → SW1SH BET ────────────────────────────────────────────
function mapKalshiEventToBet(event: any, market: any, sport: string, betType: BetType): Bet | null {
  try {
    const yesBid = parseFloat(market.yes_bid_dollars || '0');
    const yesAsk = parseFloat(market.yes_ask_dollars || '0');
    const midPrice = yesBid > 0 && yesAsk > 0 ? (yesBid + yesAsk) / 2 : yesBid || yesAsk || 0.5;

    if (midPrice <= 0 || midPrice >= 1) return null;

    const { display: oddsDisplay, numeric: oddsNumeric } = priceToAmericanOdds(midPrice);
    const confidence = priceToConfidence(midPrice);

    // Parse team names from event title (e.g. "Utah at Phoenix")
    const title = event.title || '';
    const marketTitle = market.title || '';
    const closeTime = market.close_time ? new Date(market.close_time) : null;
    const gameTimeStr = closeTime
      ? closeTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        closeTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : 'TBD';

    // Determine if this is the "yes" (home/away winner) side
    const isYesSide = !marketTitle.toLowerCase().includes('no ');

    // Build statement
    let statement = marketTitle;
    if (statement.length > 60) statement = statement.substring(0, 57) + '...';

    // Build subtext
    const subtext = `${title} — Kalshi Market`;

    const stake = 50;
    const potentialPayout = stake * (1 + Math.abs(oddsNumeric) / 100);

    return {
      id: `kalshi-${market.ticker || event.event_ticker}-${Date.now()}`,
      type: betType,
      sport,
      statement,
      subtext,
      odds: oddsDisplay,
      oddsNumeric,
      confidence,
      aiConfidence: Math.min(95, confidence + Math.floor(Math.random() * 8) - 4),
      stake,
      potentialPayout,
      status: 'active',
      gameTime: gameTimeStr,
      isLive: false,
      tags: [sport, 'Kalshi', 'Live Market'],
      image: SPORT_IMAGES[sport] || SPORT_IMAGES['NBA'],
      narrative: `Live Kalshi market: ${title}. Current odds reflect ${(midPrice * 100).toFixed(0)}% implied probability.`,
      source: 'kalshi',
      sourceUrl: `https://kalshi.com/markets/${event.event_ticker?.toLowerCase() || ''}`,
      sourceLogo: 'kalshi',
    } as Bet;
  } catch (err) {
    return null;
  }
}

// ─── MAP POLYMARKET MARKET → SW1SH BET ───────────────────────────────────────
function mapPolymarketToBet(market: any): Bet | null {
  try {
    const question = market.question || '';
    const pricesRaw = market.outcomePrices || '["0.5","0.5"]';
    const prices = JSON.parse(pricesRaw);
    const yesPrice = parseFloat(prices[0] || '0.5');

    if (yesPrice <= 0.01 || yesPrice >= 0.99) return null;

    const { display: oddsDisplay, numeric: oddsNumeric } = priceToAmericanOdds(yesPrice);
    const confidence = priceToConfidence(yesPrice);

    // Detect sport from question
    let sport = 'Culture';
    let betType: BetType = 'narrative';
    const q = question.toLowerCase();
    if (q.includes('nba') || q.includes('basketball')) { sport = 'NBA'; betType = 'sports'; }
    else if (q.includes('nfl') || q.includes('football')) { sport = 'NFL'; betType = 'sports'; }
    else if (q.includes('mlb') || q.includes('baseball')) { sport = 'MLB'; betType = 'sports'; }
    else if (q.includes('nhl') || q.includes('hockey')) { sport = 'NHL'; betType = 'sports'; }
    else if (q.includes('soccer') || q.includes('premier') || q.includes('la liga') || q.includes('champions')) { sport = 'Soccer'; betType = 'sports'; }
    else if (q.includes('tennis') || q.includes('atp') || q.includes('wta')) { sport = 'Tennis'; betType = 'sports'; }
    else if (q.includes('ufc') || q.includes('mma') || q.includes('boxing')) { sport = 'MMA'; betType = 'sports'; }
    else if (q.includes('ncaa') || q.includes('march madness') || q.includes('college')) { sport = 'NCAAB'; betType = 'sports'; }

    const endDate = market.endDate ? new Date(market.endDate) : null;
    const gameTimeStr = endDate
      ? endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'TBD';

    const stake = 50;
    const potentialPayout = stake * (1 + Math.abs(oddsNumeric) / 100);

    let statement = question;
    if (statement.startsWith('Will ')) statement = statement.replace('Will ', '');
    if (statement.length > 60) statement = statement.substring(0, 57) + '...';

    return {
      id: `poly-${market.id || market.slug}-${Date.now()}`,
      type: betType,
      sport,
      statement,
      subtext: `Polymarket — ${(yesPrice * 100).toFixed(0)}% YES probability`,
      odds: oddsDisplay,
      oddsNumeric,
      confidence,
      stake,
      potentialPayout,
      status: 'active',
      gameTime: gameTimeStr,
      isLive: false,
      tags: [sport, 'Polymarket', 'Prediction Market'],
      image: market.image || SPORT_IMAGES[sport] || SPORT_IMAGES['Culture'],
      narrative: `Polymarket prediction: ${question}. Current market price: ${(yesPrice * 100).toFixed(0)}¢ YES.`,
      source: 'polymarket',
      sourceUrl: `https://polymarket.com/event/${market.slug || ''}`,
      sourceLogo: 'polymarket',
    } as Bet;
  } catch (err) {
    return null;
  }
}

// ─── MAIN FETCH FUNCTION ─────────────────────────────────────────────────────
export async function fetchLiveMarkets(): Promise<Bet[]> {
  const allBets: Bet[] = [];

  // 1. Fetch Kalshi sports markets
  await Promise.allSettled(
    KALSHI_SERIES.map(async ({ ticker, sport, type }) => {
      try {
        const url = `${KALSHI_BASE}/events?limit=10&status=open&series_ticker=${ticker}&with_nested_markets=true`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        const events = data.events || [];
        for (const event of events.slice(0, 5)) {
          const markets = event.markets || [];
          // Take the first market (home team winner) per event
          const market = markets[0];
          if (market) {
            const bet = mapKalshiEventToBet(event, market, sport, type);
            if (bet) allBets.push(bet);
          }
        }
      } catch (err) {
        console.warn(`Kalshi ${ticker} fetch failed:`, err);
      }
    })
  );

  // 2. Fetch Polymarket active sports/culture markets
  try {
    const url = `${POLY_BASE}/markets?active=true&closed=false&order=startDate&ascending=false&limit=100`;
    const res = await fetch(url);
    if (res.ok) {
      const markets = await res.json();
      const sportKw = ['nba', 'nfl', 'mlb', 'nhl', 'soccer', 'tennis', 'ufc', 'mma', 'boxing', 'golf', 'march madness', 'ncaa', 'champions league', 'premier league', 'la liga', 'match', 'game', 'win', 'score'];
      const cultureKw = ['grammy', 'oscar', 'emmy', 'award', 'album', 'tour', 'movie', 'celebrity', 'rapper', 'singer', 'actor'];

      let sportsAdded = 0;
      let cultureAdded = 0;

      for (const market of markets) {
        const q = (market.question || '').toLowerCase();
        const isSports = sportKw.some(k => q.includes(k));
        const isCulture = cultureKw.some(k => q.includes(k));

        if ((isSports && sportsAdded < 8) || (isCulture && cultureAdded < 4)) {
          const bet = mapPolymarketToBet(market);
          if (bet) {
            allBets.push(bet);
            if (isSports) sportsAdded++;
            if (isCulture) cultureAdded++;
          }
        }

        if (sportsAdded >= 8 && cultureAdded >= 4) break;
      }
    }
  } catch (err) {
    console.warn('Polymarket fetch failed:', err);
  }

  // Deduplicate and sort by confidence
  const seen = new Set<string>();
  return allBets
    .filter(bet => {
      const key = bet.statement.toLowerCase().substring(0, 30);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

// ─── CACHE LAYER ─────────────────────────────────────────────────────────────
let cachedBets: Bet[] = [];
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getLiveMarkets(fallback: Bet[]): Promise<Bet[]> {
  const now = Date.now();
  if (cachedBets.length > 0 && now - lastFetch < CACHE_TTL) {
    return cachedBets;
  }

  try {
    const live = await fetchLiveMarkets();
    if (live.length >= 3) {
      cachedBets = live;
      lastFetch = now;
      return live;
    }
  } catch (err) {
    console.warn('Live market fetch failed, using fallback:', err);
  }

  return fallback;
}
