// sw1sh — Mock Data
// Design: Brutalist Neon | Barlow Condensed display | JetBrains Mono stats

export type BetType = 'sports' | 'narrative' | 'culture' | 'trend' | 'creator' | 'ai' | 'political' | 'geopolitical' | 'binary';
export type BetSubtype = 'moneyline' | 'spread' | 'over_under' | 'prop' | 'parlay' | 'daily_binary' | 'futures' | 'political' | 'geopolitical';
export type BetStatus = 'active' | 'won' | 'lost' | 'pending';

export interface Bet {
  id: string;
  type: BetType;
  subtype?: BetSubtype;
  sport: string;
  statement: string;
  subtext: string;
  odds: string;
  oddsNumeric: number;
  // Spread fields
  spread?: number;          // e.g. -3.5 means home team favored by 3.5
  spreadOdds?: string;      // e.g. '-110'
  // Over/Under fields
  total?: number;           // e.g. 224.5
  overOdds?: string;
  underOdds?: string;
  // Moneyline
  homeOdds?: string;
  awayOdds?: string;
  // Daily binary
  expiresAt?: string;       // ISO date — resolves at end of day
  yesPrice?: number;        // 0-100 cents (Kalshi-style)
  noPrice?: number;
  confidence: number; // 0-100
  aiConfidence?: number;
  stake: number;
  potentialPayout: number;
  status: BetStatus;
  playerName?: string;
  teamName?: string;
  gameTime: string;
  isLive: boolean;
  tags: string[];
  image: string;
  creatorName?: string;
  creatorAvatar?: string;
  narrative?: string;
  source?: 'kalshi' | 'polymarket' | 'swipestakes';
  sourceUrl?: string;
  sourceLogo?: 'kalshi' | 'polymarket' | 'swipestakes';
  // New schema fields
  marketId?: number;
  category?: string;
}

export interface Clip {
  id: string;
  title: string;
  description: string;
  videoThumb: string;
  videoUrl?: string;
  duration: string;
  views: string;
  sport: string;
  relatedBetId: string;
  relatedBet: {
    statement: string;
    odds: string;
    result?: 'won' | 'lost' | 'active';
    payout?: string;
  };
  likes: string;
  shares: string;
  isLive?: boolean;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'win' | 'loss' | 'bet';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

// Basketball player images from Unsplash
const BBALL_1 = 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=600&q=80';
const BBALL_2 = 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80';
const FOOTBALL_1 = 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=80';
const SOCCER_1 = 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600&q=80';
const BASEBALL_1 = 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=600&q=80';
const TENNIS_1 = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80';

// Generated hero images
const HERO_BBALL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/sw1sh-hero-basketball-Rzbju9dXcuvRZgivmwkUwd.webp';
const HERO_FOOTBALL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/sw1sh-hero-football-hZTx8CkqnTg9jjSBuo2M2G.webp';
const CLIPS_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/sw1sh-clips-bg-cGyN67NqeYoeXXHJxfWy8f.webp';

export const MOCK_BETS: Bet[] = [
  {
    id: 'b1',
    type: 'sports',
    sport: 'NBA',
    statement: 'LeBron over 27.5 pts tonight',
    subtext: 'Lakers vs. Celtics — 7:30 PM ET',
    odds: '+115',
    oddsNumeric: 1.15,
    confidence: 78,
    aiConfidence: 72,
    stake: 50,
    potentialPayout: 107.50,
    status: 'active',
    playerName: 'LeBron James',
    teamName: 'LAL',
    gameTime: '7:30 PM',
    isLive: false,
    tags: ['NBA', 'Points', 'AI Pick'],
    image: HERO_BBALL,
    narrative: 'LeBron is averaging 31.2 pts over his last 5 games vs. Boston',
  },
  {
    id: 'b2',
    type: 'narrative',
    sport: 'NFL',
    statement: 'Chiefs bounce back after loss',
    subtext: 'Chiefs vs. Bills — Sunday Night',
    odds: '-130',
    oddsNumeric: -1.30,
    confidence: 65,
    aiConfidence: 68,
    stake: 100,
    potentialPayout: 176.92,
    status: 'active',
    teamName: 'KC',
    gameTime: 'SUN 8:20 PM',
    isLive: false,
    tags: ['NFL', 'Narrative', 'Revenge Game'],
    image: HERO_FOOTBALL,
    narrative: 'Mahomes is 14-3 in games following a loss. This is a revenge game.',
  },
  {
    id: 'b3',
    type: 'culture',
    sport: 'NBA',
    statement: 'Drake courtside = Raptors win',
    subtext: 'Raptors vs. Knicks — 8:00 PM ET',
    odds: '+180',
    oddsNumeric: 1.80,
    confidence: 42,
    stake: 25,
    potentialPayout: 70,
    status: 'active',
    teamName: 'TOR',
    gameTime: '8:00 PM',
    isLive: true,
    tags: ['Culture', 'NBA', 'Vibes'],
    image: BBALL_1,
    narrative: 'Drake is confirmed courtside tonight. The curse is real — Raptors are 7-2 when he attends.',
  },
  {
    id: 'b4',
    type: 'ai',
    sport: 'NFL',
    statement: 'Tyreek Hill 85+ receiving yards',
    subtext: 'Dolphins vs. Jets — 1:00 PM ET',
    odds: '+145',
    oddsNumeric: 1.45,
    confidence: 81,
    aiConfidence: 81,
    stake: 75,
    potentialPayout: 183.75,
    status: 'active',
    playerName: 'Tyreek Hill',
    teamName: 'MIA',
    gameTime: '1:00 PM',
    isLive: false,
    tags: ['NFL', 'AI Pick', '81% Confidence'],
    image: FOOTBALL_1,
    narrative: 'Model detects Jets CB injury report + Hill averaging 94 yds over last 4 games.',
  },
  {
    id: 'b5',
    type: 'trend',
    sport: 'NBA',
    statement: 'Underdogs covering this week',
    subtext: 'Parlay — 3 games',
    odds: '+420',
    oddsNumeric: 4.20,
    confidence: 55,
    stake: 20,
    potentialPayout: 104,
    status: 'active',
    gameTime: 'Multiple',
    isLive: false,
    tags: ['Trend', 'Parlay', 'Underdogs'],
    image: BBALL_2,
    narrative: 'Underdogs are 11-4 ATS over the past 2 weeks. The trend is hot.',
  },
  {
    id: 'b6',
    type: 'creator',
    sport: 'MLB',
    statement: 'Shohei Ohtani HR tonight',
    subtext: 'Dodgers vs. Giants — 9:45 PM ET',
    odds: '+220',
    oddsNumeric: 2.20,
    confidence: 58,
    stake: 30,
    potentialPayout: 96,
    status: 'active',
    playerName: 'Shohei Ohtani',
    teamName: 'LAD',
    gameTime: '9:45 PM',
    isLive: false,
    tags: ['MLB', 'Creator Pick', 'HR'],
    image: BASEBALL_1,
    creatorName: '@LockOfTheDay',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    narrative: 'Ohtani has 3 HRs in his last 4 games vs. Giants pitching.',
  },
  {
    id: 'b7',
    type: 'sports',
    sport: 'Tennis',
    statement: 'Alcaraz wins in straight sets',
    subtext: 'Miami Open — QF',
    odds: '-155',
    oddsNumeric: -1.55,
    confidence: 71,
    aiConfidence: 74,
    stake: 60,
    potentialPayout: 98.71,
    status: 'active',
    playerName: 'Carlos Alcaraz',
    gameTime: 'TBD',
    isLive: false,
    tags: ['Tennis', 'Miami Open'],
    image: TENNIS_1,
    narrative: 'Alcaraz is 8-1 in QF matches at Masters events. Dominant on hard courts.',
  },
  {
    id: 'b8',
    type: 'sports',
    subtype: 'over_under',
    sport: 'Soccer',
    statement: 'Both teams to score — El Clasico',
    subtext: 'Real Madrid vs. Barcelona',
    odds: '-110',
    oddsNumeric: -1.10,
    confidence: 74,
    stake: 50,
    potentialPayout: 95.45,
    status: 'active',
    gameTime: 'SAT 3:00 PM',
    isLive: false,
    tags: ['Soccer', 'La Liga', 'BTTS'],
    image: SOCCER_1,
    narrative: 'Both teams have scored in 8 of the last 10 El Clasico matches.',
  },
  // ── SPREAD BETS ──
  {
    id: 'b9',
    type: 'sports',
    subtype: 'spread',
    sport: 'NBA',
    statement: 'Celtics -4.5 vs. Knicks',
    subtext: 'TD Garden · Tonight 7:30 PM ET',
    odds: '-110',
    oddsNumeric: -1.10,
    spread: -4.5,
    spreadOdds: '-110',
    confidence: 69,
    aiConfidence: 71,
    stake: 50,
    potentialPayout: 95.45,
    status: 'active',
    teamName: 'BOS',
    gameTime: '7:30 PM',
    isLive: false,
    tags: ['NBA', 'Spread', 'ATS'],
    image: HERO_BBALL,
    narrative: 'Celtics are 8-2 ATS at home this season. Knicks missing two starters.',
  },
  {
    id: 'b10',
    type: 'sports',
    subtype: 'spread',
    sport: 'NFL',
    statement: 'Eagles -7 vs. Cowboys',
    subtext: 'Lincoln Financial Field · Sun 4:25 PM',
    odds: '-110',
    oddsNumeric: -1.10,
    spread: -7,
    spreadOdds: '-110',
    confidence: 62,
    stake: 75,
    potentialPayout: 143.18,
    status: 'active',
    teamName: 'PHI',
    gameTime: 'SUN 4:25 PM',
    isLive: false,
    tags: ['NFL', 'Spread', 'NFC East'],
    image: FOOTBALL_1,
    narrative: 'Eagles have covered in 6 straight home games. Cowboys 1-5 ATS on the road.',
  },
  // ── MONEYLINES ──
  {
    id: 'b11',
    type: 'sports',
    subtype: 'moneyline',
    sport: 'MLB',
    statement: 'Dodgers ML — Kershaw starts',
    subtext: 'Dodgers vs. Padres · 9:10 PM ET',
    odds: '-145',
    oddsNumeric: -1.45,
    homeOdds: '-145',
    awayOdds: '+125',
    confidence: 73,
    aiConfidence: 76,
    stake: 100,
    potentialPayout: 168.97,
    status: 'active',
    teamName: 'LAD',
    gameTime: '9:10 PM',
    isLive: false,
    tags: ['MLB', 'Moneyline', 'Kershaw'],
    image: BASEBALL_1,
    narrative: 'Kershaw is 12-2 lifetime vs. Padres. Dodgers 9-1 ML when he starts at home.',
  },
  // ── DAILY BINARIES ──
  {
    id: 'b12',
    type: 'binary',
    subtype: 'daily_binary',
    sport: 'NBA',
    statement: 'Will the NBA trade deadline produce a blockbuster deal today?',
    subtext: 'Resolves at 3 PM ET today',
    odds: '+140',
    oddsNumeric: 1.40,
    yesPrice: 42,
    noPrice: 58,
    expiresAt: new Date().toISOString(),
    confidence: 42,
    stake: 25,
    potentialPayout: 60,
    status: 'active',
    gameTime: 'Expires 3 PM',
    isLive: true,
    tags: ['Binary', 'NBA', 'Daily', 'Trade'],
    image: HERO_BBALL,
    source: 'kalshi',
    narrative: 'Kalshi market: 42¢ YES. Multiple teams reportedly in talks for a star player.',
  },
  {
    id: 'b13',
    type: 'binary',
    subtype: 'daily_binary',
    sport: 'Markets',
    statement: 'S&P 500 closes above 5,200 today?',
    subtext: 'Resolves at market close 4 PM ET',
    odds: '-120',
    oddsNumeric: -1.20,
    yesPrice: 55,
    noPrice: 45,
    expiresAt: new Date().toISOString(),
    confidence: 55,
    stake: 50,
    potentialPayout: 91.67,
    status: 'active',
    gameTime: 'Expires 4 PM',
    isLive: true,
    tags: ['Binary', 'Markets', 'Daily'],
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
    source: 'kalshi',
    narrative: 'Futures pointing to flat open. Fed minutes release at 2 PM could move markets.',
  },
  // ── POLITICAL ──
  {
    id: 'b14',
    type: 'political',
    subtype: 'political',
    sport: 'Politics',
    statement: 'Republicans win the 2026 Senate majority?',
    subtext: 'Resolves Nov 2026 · Polymarket',
    odds: '-175',
    oddsNumeric: -1.75,
    yesPrice: 64,
    noPrice: 36,
    confidence: 64,
    stake: 50,
    potentialPayout: 78.57,
    status: 'active',
    gameTime: 'Nov 2026',
    isLive: false,
    tags: ['Political', 'Senate', '2026'],
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
    source: 'polymarket',
    narrative: 'Republicans defending 3 fewer seats than Democrats. Polymarket: 64% YES.',
  },
  {
    id: 'b15',
    type: 'political',
    subtype: 'political',
    sport: 'Politics',
    statement: 'Trump approval rating above 50% by July?',
    subtext: 'Resolves Jul 1, 2026 · Kalshi',
    odds: '+210',
    oddsNumeric: 2.10,
    yesPrice: 32,
    noPrice: 68,
    confidence: 32,
    stake: 25,
    potentialPayout: 77.50,
    status: 'active',
    gameTime: 'Jul 1, 2026',
    isLive: false,
    tags: ['Political', 'Approval', 'Binary'],
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
    source: 'kalshi',
    narrative: 'Current polling: 44.2% approval. Would require +5.8pt swing in 3 months.',
  },
  // ── GEOPOLITICAL ──
  {
    id: 'b16',
    type: 'geopolitical',
    subtype: 'geopolitical',
    sport: 'Geopolitics',
    statement: 'Ukraine-Russia ceasefire agreement by end of 2026?',
    subtext: 'Resolves Dec 31, 2026 · Polymarket',
    odds: '+155',
    oddsNumeric: 1.55,
    yesPrice: 39,
    noPrice: 61,
    confidence: 39,
    stake: 30,
    potentialPayout: 76.50,
    status: 'active',
    gameTime: 'Dec 31, 2026',
    isLive: false,
    tags: ['Geopolitical', 'Ukraine', 'Russia'],
    image: 'https://images.unsplash.com/photo-1580193769210-b8d1c049a7d9?w=600&q=80',
    source: 'polymarket',
    narrative: 'Polymarket: 39% YES. Peace talks ongoing but no formal framework yet.',
  },
  {
    id: 'b17',
    type: 'geopolitical',
    subtype: 'geopolitical',
    sport: 'Geopolitics',
    statement: 'China invades Taiwan before 2028?',
    subtext: 'Resolves Jan 1, 2028 · Polymarket',
    odds: '+650',
    oddsNumeric: 6.50,
    yesPrice: 13,
    noPrice: 87,
    confidence: 13,
    stake: 10,
    potentialPayout: 75,
    status: 'active',
    gameTime: 'Jan 1, 2028',
    isLive: false,
    tags: ['Geopolitical', 'China', 'Taiwan', 'High Risk'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80',
    source: 'polymarket',
    narrative: 'Polymarket: 13% YES. Long-shot high-payout market. Military posturing elevated.',
  },
];

export const MOCK_SETTLED_BETS: Bet[] = [
  {
    id: 's1',
    type: 'sports',
    sport: 'NBA',
    statement: 'Steph Curry 30+ pts',
    subtext: 'Warriors vs. Clippers',
    odds: '+125',
    oddsNumeric: 1.25,
    confidence: 70,
    stake: 50,
    potentialPayout: 112.50,
    status: 'won',
    playerName: 'Steph Curry',
    teamName: 'GSW',
    gameTime: 'Final',
    isLive: false,
    tags: ['NBA', 'Won'],
    image: HERO_BBALL,
  },
  {
    id: 's2',
    type: 'narrative',
    sport: 'NFL',
    statement: 'Ravens ML — Revenge game',
    subtext: 'Ravens vs. Steelers',
    odds: '-120',
    oddsNumeric: -1.20,
    confidence: 68,
    stake: 100,
    potentialPayout: 183.33,
    status: 'lost',
    teamName: 'BAL',
    gameTime: 'Final',
    isLive: false,
    tags: ['NFL', 'Lost'],
    image: HERO_FOOTBALL,
  },
  {
    id: 's3',
    type: 'ai',
    sport: 'NBA',
    statement: 'Luka Doncic triple-double',
    subtext: 'Mavericks vs. Thunder',
    odds: '+200',
    oddsNumeric: 2.00,
    confidence: 62,
    aiConfidence: 65,
    stake: 25,
    potentialPayout: 75,
    status: 'won',
    playerName: 'Luka Doncic',
    teamName: 'DAL',
    gameTime: 'Final',
    isLive: false,
    tags: ['NBA', 'Won', 'AI Pick'],
    image: BBALL_2,
  },
];

export const MOCK_CLIPS: Clip[] = [
  {
    id: 'c1',
    title: 'INSANE buzzer beater — Curry from half court',
    description: 'Steph Curry hits the most ridiculous half-court shot to end the third quarter. The crowd ERUPTS.',
    videoThumb: HERO_BBALL,
    duration: '0:23',
    views: '2.4M',
    sport: 'NBA',
    relatedBetId: 'b1',
    relatedBet: {
      statement: 'Curry 30+ pts tonight',
      odds: '+125',
      result: 'won',
      payout: '$112.50',
    },
    likes: '184K',
    shares: '42K',
    isLive: false,
  },
  {
    id: 'c2',
    title: 'Mahomes ESCAPES the pocket — 40 yard TD',
    description: 'Patrick Mahomes does it again. Scrambles left, somehow finds Kelce for a 40-yard TD. Chiefs are BACK.',
    videoThumb: HERO_FOOTBALL,
    duration: '0:18',
    views: '5.1M',
    sport: 'NFL',
    relatedBetId: 'b2',
    relatedBet: {
      statement: 'Chiefs bounce back after loss',
      odds: '-130',
      result: 'active',
    },
    likes: '312K',
    shares: '89K',
    isLive: true,
  },
  {
    id: 'c3',
    title: 'Tyreek Hill 80-yard catch and run',
    description: 'Nobody catches Tyreek Hill when he gets in the open field. Watch this absolute MISSILE.',
    videoThumb: FOOTBALL_1,
    duration: '0:31',
    views: '1.8M',
    sport: 'NFL',
    relatedBetId: 'b4',
    relatedBet: {
      statement: 'Tyreek Hill 85+ receiving yards',
      odds: '+145',
      result: 'active',
    },
    likes: '95K',
    shares: '28K',
  },
  {
    id: 'c4',
    title: 'Ohtani LAUNCHES one to the upper deck',
    description: 'Shohei Ohtani with a 468-foot BOMB to the upper deck. This man is not human.',
    videoThumb: BASEBALL_1,
    duration: '0:15',
    views: '3.2M',
    sport: 'MLB',
    relatedBetId: 'b6',
    relatedBet: {
      statement: 'Ohtani HR tonight',
      odds: '+220',
      result: 'won',
      payout: '$96',
    },
    likes: '241K',
    shares: '67K',
  },
  {
    id: 'c5',
    title: 'Alcaraz drop shot of the YEAR',
    description: 'Carlos Alcaraz with a drop shot that defies physics. His opponent doesn\'t even move.',
    videoThumb: TENNIS_1,
    duration: '0:12',
    views: '890K',
    sport: 'Tennis',
    relatedBetId: 'b7',
    relatedBet: {
      statement: 'Alcaraz wins in straight sets',
      odds: '-155',
      result: 'active',
    },
    likes: '67K',
    shares: '19K',
  },
  {
    id: 'c6',
    title: 'El Clasico BANGER — Vinicius Jr nutmegs 3 defenders',
    description: 'Vinicius Jr with the most disrespectful nutmeg you will ever see in El Clasico.',
    videoThumb: SOCCER_1,
    duration: '0:27',
    views: '7.8M',
    sport: 'Soccer',
    relatedBetId: 'b8',
    relatedBet: {
      statement: 'Both teams to score — El Clasico',
      odds: '-110',
      result: 'active',
    },
    likes: '589K',
    shares: '201K',
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'win', amount: 112.50, description: 'Steph Curry 30+ pts — WON', timestamp: '2h ago', status: 'completed' },
  { id: 't2', type: 'bet', amount: -50, description: 'LeBron over 27.5 pts', timestamp: '3h ago', status: 'completed' },
  { id: 't3', type: 'bet', amount: -100, description: 'Chiefs bounce back', timestamp: '5h ago', status: 'completed' },
  { id: 't4', type: 'loss', amount: -100, description: 'Ravens ML — LOST', timestamp: '1d ago', status: 'completed' },
  { id: 't5', type: 'win', amount: 75, description: 'Luka triple-double — WON', timestamp: '1d ago', status: 'completed' },
  { id: 't6', type: 'deposit', amount: 500, description: 'Deposit via Apple Pay', timestamp: '2d ago', status: 'completed' },
  { id: 't7', type: 'bet', amount: -25, description: 'Ohtani HR tonight', timestamp: '2d ago', status: 'completed' },
  { id: 't8', type: 'bet', amount: -75, description: 'Tyreek Hill 85+ yards', timestamp: '3d ago', status: 'completed' },
];

export const MOCK_USER = {
  name: 'Matt B.',
  username: '@mattbravo',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  balance: 847.50,
  activeBets: 6,
  totalWins: 34,
  totalLosses: 18,
  winRate: 65,
  streak: 3,
  streakType: 'win' as 'win' | 'loss',
  level: 12,
  xp: 2840,
  xpToNext: 3200,
  rank: 142,
  totalWinnings: 2340,
  badges: ['🔥 Hot Streak', '🤖 AI Believer', '🏀 Hoops Head'],
  favoriteTeams: ['LAL', 'KC', 'LAD'],
  bestCategory: 'NBA Points',
  roi: 18.4,
};
