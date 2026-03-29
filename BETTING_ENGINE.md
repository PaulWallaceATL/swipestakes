# Swipestakes — Betting Engine Architecture & Roadmap

## Overview

Swipestakes operates as a **prediction market aggregator** in Phase 1, duplicating bets from Kalshi and Polymarket. In Phase 2 it becomes a **native betting platform** with its own odds engine, settlement logic, and liquidity pool. This document covers the full architecture for both phases.

---

## Phase 1 (Current): Market Aggregator

### How It Works Today

```
Kalshi API ──┐
             ├──► betIngestion.ts ──► bets table ──► HomeFeed swipe cards
Polymarket ──┘
```

The `betIngestion.ts` service runs on a 5-minute cache cycle. It:
1. Fetches active markets from Kalshi (`/trade-api/v2/markets`) and Polymarket (`/gamma-api.polymarket.com/markets`)
2. Normalizes them into Swipestakes' unified `Bet` format (American odds, confidence score, narrative)
3. Upserts into the `bets` table with `source = 'kalshi' | 'polymarket'`
4. Users can swipe/bet on these markets — their `placed_bets` row links back to the original market

### Bet Categories Supported

| Category | Source | Subtype | Example |
|---|---|---|---|
| Sports Moneyline | Kalshi, Polymarket | `moneyline` | "Dodgers ML -145" |
| Sports Spread | Swipestakes native | `spread` | "Celtics -4.5 -110" |
| Over/Under | Kalshi, Polymarket | `over_under` | "Lakers/Celtics O224.5" |
| Player Props | Kalshi | `prop` | "LeBron over 27.5 pts" |
| Daily Binary | Kalshi | `daily_binary` | "S&P 500 above 5200 today?" |
| Political | Kalshi, Polymarket | `political` | "Republicans win 2026 Senate?" |
| Geopolitical | Polymarket | `geopolitical` | "Ukraine ceasefire by 2026?" |
| Culture/Narrative | Swipestakes native | `narrative` | "Drake courtside = Raptors win" |

---

## Phase 2: Native Betting Engine

### Open-Source Foundations to Build On

Several battle-tested open-source libraries can accelerate the betting engine build:

| Library | Language | What It Provides | License |
|---|---|---|---|
| **OpenBet** (Sportech) | Java | Full sportsbook engine, bet settlement, risk management | Commercial (study for patterns) |
| **Betfair Exchange API** | REST | Reference implementation for exchange-style matching | Public API |
| **Augur v2** | Solidity/TypeScript | Decentralized prediction market settlement logic | GPL-3.0 |
| **Gnosis Conditional Tokens** | Solidity | Binary outcome market primitives | LGPL-3.0 |
| **odds-converter** (npm) | TypeScript | American ↔ Decimal ↔ Fractional odds conversion | MIT |
| **kelly-criterion** (npm) | TypeScript | Optimal stake sizing via Kelly formula | MIT |

**Recommended approach:** Use `odds-converter` and `kelly-criterion` immediately (both MIT). Study Augur v2's settlement state machine for the outcome resolution logic.

### Core Engine Components

#### 1. Odds Engine (`server/oddsEngine.ts`)

```typescript
// Responsibilities:
// - Convert between odds formats (American, Decimal, Fractional, Probability)
// - Calculate implied probability and vig (house edge)
// - Compute potential payouts for all bet types
// - Apply Kelly Criterion for AI stake recommendations

interface OddsEngine {
  americanToDecimal(odds: number): number;
  impliedProbability(americanOdds: number): number;
  calculatePayout(stake: number, americanOdds: number): number;
  calculateVig(homeOdds: number, awayOdds: number): number;
  kellyStake(bankroll: number, probability: number, odds: number): number;
}
```

#### 2. Bet Validation Engine (`server/betValidator.ts`)

```typescript
// Responsibilities:
// - Validate bet is still open (not expired, not settled)
// - Check user has sufficient balance
// - Enforce stake limits (min $1, max $10,000 per bet)
// - Detect suspicious patterns (arbitrage, wash trading)
// - Apply responsible gambling limits

interface BetValidator {
  validateBet(userId: number, betId: string, stake: number): Promise<ValidationResult>;
  checkDailyLimit(userId: number, stake: number): Promise<boolean>;
  checkExposureLimit(betId: string, stake: number): Promise<boolean>;
}
```

#### 3. Settlement Engine (`server/settlementEngine.ts`)

```typescript
// Responsibilities:
// - Poll Kalshi/Polymarket for market resolution
// - Match settled markets to placed_bets rows
// - Credit winners, mark losers
// - Trigger push notifications on settlement
// - Generate settlement receipts

interface SettlementEngine {
  checkSettlements(): Promise<void>;           // runs every 5 min via cron
  settleMarket(externalId: string, result: 'yes' | 'no' | 'void'): Promise<void>;
  creditWinners(marketId: string): Promise<void>;
}
```

#### 4. Liquidity / Risk Manager (`server/riskManager.ts`)

```typescript
// Responsibilities:
// - Track total exposure per market (sum of all stakes on each side)
// - Adjust odds dynamically based on book imbalance
// - Set hard limits on one-sided exposure
// - Hedge large positions back to Kalshi/Polymarket if needed

interface RiskManager {
  getExposure(marketId: string): Promise<{ yes: number; no: number }>;
  adjustOdds(marketId: string): Promise<string>;  // returns new American odds
  isExposureSafe(marketId: string, stake: number, side: 'yes' | 'no'): boolean;
}
```

---

## Deposits & Payouts (Stripe)

### Deposit Flow (Live)

```
User taps DEPOSIT → chooses amount → Stripe Checkout (new tab)
  → Card payment → Stripe webhook → checkout.session.completed
  → Server credits users.balance += amount
  → User returns to /wallet?deposit=success → balance refreshed
```

**Test card:** `4242 4242 4242 4242` | Any future date | Any CVV

### Payout Flow (Phase 2)

```
User requests withdrawal → riskManager validates sufficient balance
  → Stripe Payout to connected bank account (requires Stripe Connect)
  → users.balance -= amount
  → 1-3 business day ACH transfer
```

**Stripe Connect setup needed for payouts:**
1. Enable Stripe Connect in dashboard
2. Collect user KYC (SSN last 4, DOB, address) via Stripe Identity
3. Create Express connected account per user
4. Route payouts via `stripe.payouts.create()` to connected account

### Regulatory Considerations

| Market Type | US Regulatory Status | Approach |
|---|---|---|
| Sports spreads/moneylines | Requires state gaming license | Phase 3 — geo-gate to licensed states |
| Prediction markets (binary) | CFTC-regulated (Kalshi model) | Aggregate from Kalshi in Phase 1 |
| Political markets | CFTC gray area | Aggregate from Polymarket in Phase 1 |
| Social/culture markets | Unregulated sweepstakes model | **Swipestakes model** — use virtual currency |

**Near-term legal path:** Operate as a **sweepstakes model** (virtual coins, no real-money wagering) while aggregating Kalshi/Polymarket for informational display. Real-money wagering requires state-by-state licensing.

---

## Database Schema (Current)

```sql
users          — id, balance, stripeCustomerId (to add)
bets           — ingested markets from Kalshi/Polymarket/native
placed_bets    — user bet history, stake, payout, status
saved_bets     — bookmarked markets
clips          — YouTube/ESPN video feed
```

### Columns to Add in Phase 2

```sql
ALTER TABLE users ADD COLUMN stripeCustomerId VARCHAR(64);
ALTER TABLE users ADD COLUMN dailyBetLimit DECIMAL(10,2) DEFAULT 500.00;
ALTER TABLE users ADD COLUMN lifetimeDeposited DECIMAL(10,2) DEFAULT 0.00;

ALTER TABLE bets ADD COLUMN spread DECIMAL(5,2);
ALTER TABLE bets ADD COLUMN total DECIMAL(6,2);
ALTER TABLE bets ADD COLUMN homeOdds VARCHAR(16);
ALTER TABLE bets ADD COLUMN awayOdds VARCHAR(16);
ALTER TABLE bets ADD COLUMN yesPrice INT;   -- 0-100 cents
ALTER TABLE bets ADD COLUMN noPrice INT;
ALTER TABLE bets ADD COLUMN subtype ENUM('moneyline','spread','over_under','prop','parlay','daily_binary','futures','political','geopolitical');
ALTER TABLE bets ADD COLUMN resolvedAt TIMESTAMP;
ALTER TABLE bets ADD COLUMN resolvedOutcome ENUM('yes','no','void','push');
```

---

## Recommended Build Order

1. **Now:** Stripe Connect KYC flow for payouts (2 weeks)
2. **Next:** `oddsEngine.ts` + `betValidator.ts` using `odds-converter` npm package (1 week)
3. **Then:** `settlementEngine.ts` polling Kalshi/Polymarket for resolutions (1 week)
4. **Then:** `riskManager.ts` for exposure tracking (2 weeks)
5. **Later:** Native market creation UI for Swipestakes-original markets (4 weeks)
6. **Later:** State gaming license applications for real-money sports betting (6-12 months)
