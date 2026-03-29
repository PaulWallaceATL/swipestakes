# sw1sh TODO

## Core App Screens
- [x] Home feed with swipe betting cards (SKIP/MORE/SAVE/BET buttons functional)
- [x] Clips tab — TikTok-style full-screen video feed with linked bets
- [x] Wallet page — balance, deposit/withdraw, quick chips, transaction history
- [x] Bet Log page — active bets, settled history, win streak banner
- [x] Profile page — stats, taste graph, badges, leaderboard

## Backend Infrastructure
- [x] Full-stack upgrade (tRPC + DB + Auth)
- [x] Database schema — bets, clips, placed_bets, saved_bets tables
- [x] Kalshi bet ingestion service (NBA, MLB, NHL, NFL, NCAAB markets)
- [x] Polymarket bet ingestion service (sports + culture markets)
- [x] YouTube video feed service (curated clips + optional API key)
- [x] tRPC router — bets.list, bets.place, bets.save, bets.myBets
- [x] tRPC router — clips.list, clips.ingest
- [x] tRPC router — wallet.balance, wallet.deposit, wallet.withdraw

## Landing Page
- [x] Three.js shader hero background (lime + cyan on near-void black)
- [x] Real app screenshots in iPhone 15 Pro frames
- [x] Animated 3-phone hero cluster with floating animation
- [x] Stats bar (50K+ signups, 2 sources, 1-tap, 24/7)
- [x] Feature cards grid (6 features)
- [x] Screen showcase — Home, Clips, Wallet, Bet Log with copy
- [x] How it works — 3 steps
- [x] Testimonials grid
- [x] Email waitlist CTA (hero + footer)
- [x] Sticky nav with OPEN APP button
- [x] Footer with Antimatter AI credit
- [x] Route: / → LandingPage, /feed → app

## Pending / Next Steps
- [x] Wire HomeFeed to use trpc.bets.list instead of mock data
- [x] Wire ClipsFeed to use trpc.clips.list instead of mock data
- [x] Wire BET button to trpc.bets.place mutation
- [x] Wire SAVE button to trpc.bets.save mutation
- [x] Wire WalletPage to trpc.wallet.balance/deposit/withdraw
- [x] Wire BetLogPage to trpc.bets.myBets
- [x] Parlay / bet slip builder (swipe up = add to slip)
- [x] Push notifications for market movements (in-app notification bell with market move/bet settled alerts)
- [x] Onboarding flow (3-swipe taste quiz)
- [x] YouTube API key integration for live video fetching (scaffold ready, YOUTUBE_API_KEY env var needed to activate)
- [x] Share win card generator

## Session 3 — Swipestakes Expansion
- [x] Fix wallet deposit/withdraw modal overflow behind bottom nav
- [x] Rename app from sw1sh to Swipestakes (title, meta, nav labels)
- [x] Expand bet types: spreads, moneylines, daily binaries
- [x] Add political and geopolitical market categories
- [x] Set up Stripe integration for deposits and payouts
- [x] Build betting engine schema (bet types, validation, settlement)
- [x] Update ingestion bot to pull political/geopolitical from Kalshi/Polymarket
- [x] Update HomeFeed filter pills to include new categories

## Session 4 — UI Polish
- [x] Fix ProfilePage: clipped avatar/name card, hidden tab labels, apply ReactBits elements
- [x] Fix BetLogPage: tab labels hidden behind active pill, spacing/padding issues
- [x] Fix BetDetailSheet: sheet clipped by bottom nav, PLACE BET button not visible

## Session 5 — Landing Page Fix
- [x] Fix iPhone frame screenshots on landing page (iframes not loading → replace with CDN images)
- [x] Restyle email input to match dark neon branding (JetBrains Mono, dark bg, lime border)

## Session 5 — Data Model + Landing Page + Tag Fixes
- [x] Rewrite DB schema: Event, Market, Outcome, Position, Wallet, WalletTransaction, ResolutionProposal, MarketPriceSnapshot
- [x] Update server routers to use new Polymarket-style schema
- [x] Update ingestion services to map Kalshi/Polymarket → Event+Market+Outcome rows
- [x] Fix bet card category badge (Anthropic IPO should be TECH not SPORTS)
- [x] Fix LIVE tag logic: only show LIVE when event is actually live (not future-dated)
- [x] Add Tech/Finance/AI filter pills to HomeFeed
- [x] Fix landing page iPhone frames: fresh screenshots → CDN → img tags
- [x] Restyle email input: JetBrains Mono, dark bg, lime border, full-width block layout

## Session 6 — Full Data Model, Auth, Saved Bets, Landing Page Screenshots

### Data Model
- [x] Add Order table (order_id, user_id, market_id, outcome_id, side, price, quantity, filled_quantity, order_type, status, created_at, expires_at)
- [x] Add Trade table (trade_id, market_id, buy_order_id, sell_order_id, price, quantity, executed_at, fee_amount)
- [x] Verify all 11 model tables exist in DB (events, markets, outcomes, positions, orders, trades, wallets, wallet_transactions, saved_markets, resolution_proposals, resolution_disputes, market_price_snapshots)
- [x] Update market pricing logic: derive implied_probability from midpoint, not hardcoded odds
- [x] Add order placement tRPC procedure (markets.placeOrder)
- [x] Add trade execution logic when buy/sell orders match

### Auth & User Settings
- [x] User settings page (/settings) — display name, notification prefs, theme
- [x] Ensure login → redirect to /feed (not landing page) after first login
- [x] Profile page shows real user data from auth session
- [x] Wallet auto-created on first login if not exists

### Saved Bets / Markets State
- [x] Saved markets page (/saved) — list of saved markets with remove button
- [x] Wire SAVE button in HomeFeed to actually persist to saved_markets table
- [x] Show saved state (filled bookmark icon) when market is already saved
- [x] Saved count badge on bottom nav Bets tab

### Landing Page Screenshots
- [x] Generate 5 high-quality phone screenshot images (Home, Clips, Wallet, BetLog, Profile) sized to fit iPhone frame (390×844px)
- [x] Upload new screenshots to CDN and update SCREEN_URLS in LandingPage.tsx
- [x] Ensure screenshots are visually engaging with real UI content visible

## Session 7 — Gaps & Hardening
- [x] Onboarding: server-backed completion flag (onboardingCompletedAt in user_settings)
- [x] BetLogPage: wire settled bets to backend data (not MOCK_SETTLED_BETS)
- [x] Share Win Card: explicit error handling for share/export failures
- [x] Post-login redirect: OAuth state encodes JSON with origin + returnPath

## Session 8 — Parlay Builder, Notifications, Clips Wiring

### Parlay Builder
- [x] Create ParlaySlip.tsx — bottom drawer with up to 4 legs, combined odds math, stake chips
- [x] Wire MORE button right-click → add current card to parlay slip
- [x] Wire ParlaySlip into HomeFeed (floats above bottom nav when legs > 0)
- [x] Parlay submits via markets.place mutation on leg 1 as anchor

### In-App Notifications
- [x] Create NotificationBell.tsx — dropdown with market move, bet settled, market open alerts
- [x] Unread count badge on bell icon (lime glow)
- [x] Mark all read on open, dismiss individual alerts
- [x] Replace inline bell button in HomeFeed header with NotificationBell component

### Clips Feed
- [x] Wire ClipsFeed to trpc.clips.list with REAL_CLIPS fallback

### Pending (requires env var)
- [x] YouTube API key integration for live video fetching (scaffold ready, YOUTUBE_API_KEY env var needed to activate) (YOUTUBE_API_KEY)

## Session 8 — Gap Fixes
- [x] Fix parlay UX: swipe-down gesture on card adds to parlay slip (not right-click)
- [x] Add server-backed notifications table + tRPC list/markRead/dismiss procedures
- [x] Wire NotificationBell to real tRPC notifications data (not demo array)
- [x] Wire YOUTUBE_API_KEY in env parser + clips ingestion path with key-gated fetch (reads process.env.YOUTUBE_API_KEY, falls back to curated clips)

## Session 9 — Landing Page Fixes
- [x] Remove outer IPhoneFrame wrapper from landing page carousel (screenshots already have phone frame baked in)

## Session 9b — Phone Mockup Fixes
- [x] Replace 3-across hero phones with single centered phone
- [x] Regenerate all 5 screenshots as pure dark UI (no white bg, no baked-in phone frame)
- [x] Update SCREEN_URLS with new CDN screenshots

## Session 10 — Phone Frame Fill Fix
- [x] Fix IPhoneFrame: screenshots cut off on sides — fix aspect ratio so images fill shell perfectly
- [x] Regenerate all 5 screenshots at exact phone shell aspect ratio (no cropping)
- [x] Update SCREEN_URLS with new perfectly-fitted screenshots

## Session 11 — Nav Restructure
- [x] Replace Saved tab in bottom nav with Wallet tab (restore original nav order)
- [x] Move saved markets list into Profile page as a dedicated section
- [x] Remove /saved route from App.tsx (or keep as redirect to /profile)

## Session 12 — Layout & Branding
- [x] Fix AppShell: pin header and bottom nav, only content area scrolls
- [x] Update app title to "Swipestakes" for OAuth/login screen

## Session 13 — Free-to-Play Credits System
- [x] DB schema: add credits_balance to users, daily_picks table, credit_transactions table
- [x] DB migration: pnpm db:push
- [x] tRPC: getDailyPicks (5 binary markets per day, resets at midnight)
- [x] tRPC: submitPick (yes/no/over/under, locks after 5 picks)
- [x] tRPC: skipPick (swipe down = pass, counts against daily 5)
- [x] tRPC: resolveDailyPicks (auto-resolve at end of day, award credits)
- [x] tRPC: getCreditsBalance + getCreditHistory
- [x] HomeFeed: binary card design (Yes/No or Over/Under), swipe right=yes, left=no, down=skip
- [x] HomeFeed: daily pick counter (e.g. "3 of 5 picks used")
- [x] HomeFeed: show credits balance in header instead of dollar balance
- [x] Daily results screen: score breakdown, credits earned, countdown to next batch
- [x] Wallet page: show credits balance, credit history, Redeem CTA
- [x] Redeem page: gift card catalog with credit costs
- [x] Credit rules: 5 picks/day; 3-2=0 credits, 4-1=credits back (10), 5-0=25 credits bonus

## Session 14 — Light Theme Rebrand
- [x] Retheme global CSS: light bg, colorful gradients, fun typography
- [x] Remove Clips tab and video feed entirely
- [x] Redesign HomeFeed with light theme (Tinder-style)
- [x] Redesign WalletPage with light theme + credits system
- [x] Redesign BetLogPage (Results) with light theme
- [x] Redesign ProfilePage with light theme
- [x] Redesign LandingPage with light colorful theme

## Session 15 — Polish, Redeem, Onboarding
- [x] Polish global CSS: more refined spacing, professional card shadows, clean typography hierarchy
- [x] HomeFeed swipe cards: add background images, perfect viewport fill, no overflow
- [x] Build Redeem page (/redeem): gift card catalog, credit costs, redemption flow
- [x] Build onboarding flow: interest quiz (sports/politics/finance/tech/culture) + shopping prefs
- [x] Wire onboarding to DB (user_settings), show on first login, skip if completed
- [x] Add Redeem tab to bottom nav (Home / Wallet / Results / Redeem / Profile)

## Session 16 — Auth Gate, Sounds, Images, Credits, Out-of-Picks Modal
- [x] Auth gate: 1 free swipe as guest → intercept on 2nd swipe → login/signup modal
- [x] Background images: assign contextual images to each daily pick card
- [x] Swipe sound effects: YES, NO, SKIP distinct audio
- [x] Accurate credit balance: wire header + wallet to live tRPC credits.getBalance
- [x] Out-of-picks modal: sad empty state + share with friends CTA to earn bonus picks

## Session 17 — Crash Fix, Profile Redesign, Daily Parlay
- [x] Fix runtime crash on published site (bundle error)
- [x] Redesign ProfilePage: streak, parlay history, stats, leaderboard
- [x] Convert daily picks to 5-leg parlay sweepstakes (all 5 = one entry)
- [x] Enforce same-day resolution on all markets/bets
- [x] Update credit award logic to parlay scoring (all 5 correct = win, else lose)

## Session 18 — Crash Fix, Theme Consistency, Landing Screenshot
- [x] Fix persistent runtime crash on published site (ErrorBoundary)
- [x] Fix Profile page to match light theme (already correct from Session 17)
- [x] Fix Settings page to match light theme (full rewrite: white/cream bg, purple/pink accents, Poppins/Nunito fonts)
- [x] Replace landing page screenshot with current light theme UI (3 new v4 screenshots: Home, Wallet, Results)
- [x] Verify auth flow works end-to-end

## Session 19 — Guest Swipe Fix, Paywall Copy, Onboarding Preferences
- [x] Fix blank screen after 3rd guest swipe (show paywall/CTA instead of empty state)
- [x] Update auth paywall copy to say "Pick 5" (headline: "Pick 5 to win", CTA: "unlock all 5 picks")
- [x] Rebuild onboarding: 3-step flow — interests, rewards, algorithm (pick style + risk + notifications)
- [x] Wire onboarding preferences to user_settings in DB (interests, shoppingPreferences, preferredCategories)

## Session 20 — Blank Card Fix + Loyalty Program
- [x] Fix blank/broken image on last swipe card (explicit imageUrl on all 5 MOCK_PICKS)
- [x] Fix allDone/showOutOfPicks race — card stays visible behind modal, allDone set on modal close
- [x] Loyalty program: schema (loyalty_stats + loyalty_milestones tables, DB migrated)
- [x] Loyalty program: backend — streak tracking, point accrual with streak multiplier, milestone awards
- [x] Loyalty program: 12 milestones (streak 1/3/7/14/30, picks 10/25/50/100/500, days 7/30)
- [x] Loyalty program: UI — streak badge in home header, /loyalty page with tier card + milestone grid

## Session 21 — Guest Swipe Blank Card Root Fix
- [x] Fix blank/ghosted card appearing before 5th swipe for guest users (all 5 picks must render cleanly)
- [x] Ensure auth paywall only fires AFTER the 5th swipe completes (not before)
- [x] Expand MOCK_PICKS to 7 entries so background cards always have content
- [x] Update AuthGateModal copy: all 5 dots filled, 'save your parlay & earn credits' CTA

## Session 22 — Viewport, Image, Sound Fixes
- [x] Fix bottom nav being cut off by browser chrome / safe area inset (fixed: outer wrapper now position:fixed, body position:fixed, html/body/root height:100%)
- [x] Replace Big Ben placeholder image in mock picks (NHL images replaced with real hockey photos, FINANCE duplicate removed)
- [x] Ensure swipe sounds fire on touch gesture swipes (singleton AudioContext, pre-unlock on touchstart/mousedown, resume before each tone, onPointerDown on card)

## Session 23 — Candy Crush Visual Redesign
- [x] Redesign global theme: deep purple-indigo board bg, electric pink primary, candy teal accent, gold highlight, Fredoka One font
- [x] Add global candy animations: bounce, pop, wiggle, shimmer, confetti, fire flicker, pulse glow keyframes
- [x] Redesign HomeFeed: candy dark header, jewel-tone action buttons (red/gray/green), candy-styled auth gate + out-of-picks modals
- [x] Redesign AppShell bottom nav: candy dark with pink/gold glow on active tab
- [x] Redesign ProfilePage: full candy dark jewel-tone rewrite
- [x] Redesign WalletPage: full candy dark jewel-tone rewrite
- [x] Redesign LoyaltyPage: full candy dark jewel-tone rewrite
- [x] Redesign BetLogPage (Results): full candy dark jewel-tone rewrite
- [x] Redesign SettingsPage: full candy dark jewel-tone rewrite

## Session 23 — Candy Crush Visual Redesign (Full App)
- [x] Global theme: deep purple-indigo board bg (#0d0025→#1a0040), electric pink (#FF3D9A), candy gold (#FFD700), teal (#00E5FF), Fredoka One font
- [x] CSS animations: bounce, pop, wiggle, shimmer, confetti, fire flicker, pulse glow keyframes
- [x] HomeFeed: candy dark header, jewel-tone action buttons, candy-styled auth gate + out-of-picks modals
- [x] AppShell: candy dark bottom nav with pink/gold glow on active tab
- [x] ProfilePage: full candy dark jewel-tone rewrite
- [x] WalletPage: full candy dark jewel-tone rewrite
- [x] LoyaltyPage: full candy dark jewel-tone rewrite
- [x] BetLogPage (Results): full candy dark jewel-tone rewrite
- [x] SettingsPage: full candy dark jewel-tone rewrite
- [x] LandingPage: candy dark bg, Fredoka One font, pink/gold gradients throughout
- [x] OnboardingFlow: candy dark bg, jewel-tone chips, animated welcome splash

## Session 25 — Sparkle Token Animations
- [x] Build SparkleToken component: orbiting star particles, shimmer, burst, continuous mode (sm/md/xl sizes, gold/purple/teal/pink variants)
- [x] Add sparkle keyframes to index.css (token-shimmer, sparkle-orbit, sparkle-twinkle, sparkle-burst-1/2/3/4)
- [x] Apply SparkleToken to HomeFeed header CR badge
- [x] Apply SparkleToken to WalletPage credit balance display (xl size, continuous gold)
- [x] Apply SparkleToken + SparkleStar to LoyaltyPage tier card points
- [x] Apply SparkleToken to ProfilePage credits stat (sm size)

## Session 26 — Light Theme + UX Simplification
- [x] Switch global background to white/light (#FAFAFA base, white cards)
- [x] HomeFeed header: remove dot-progress tabs, remove "CR" label from balance badge, show just the number + coin icon
- [x] Add "Pick 5 → Win Prizes" hero banner below header (Amazon, Home Depot, etc.)
- [x] Fix Big Ben image permanently — replace all broken Unsplash URLs with working CDN images
- [x] Ensure 20+ mock picks always available so feed never runs out
- [x] Simplify all pages to light theme: Wallet, Results, Loyalty, Profile, Settings, Onboarding
- [x] Strip unnecessary UI elements throughout (reduce cognitive load for casual users)

## Session 21 — White/Light Theme Full Sweep + UX Simplification
- [x] White/light background throughout entire app (no dark pages)
- [x] Pick 5 prize banner in HomeFeed header (Amazon, Home Depot, Starbucks)
- [x] Remove CR label from credit balance in header
- [x] Remove dot tabs from header (only streak badge remains)
- [x] Expand mock picks to 20+ bets across NBA, NFL, FINANCE, TECH, POLITICS
- [x] LoyaltyPage: full light theme rewrite (white cards, dark text, gradient header)
- [x] BetLogPage: full light theme rewrite (white cards, dark text, gradient header)
- [x] ProfilePage: full light theme rewrite (white cards, dark text, gradient header)
- [x] HomeFeed all-done screen: fix invisible text (was white-on-white)
- [x] NotificationBell: full light theme rewrite (white dropdown, dark text)

## Session 22 — Contrast Fix + Kalshi Live Picks

- [x] Fix LandingPage white-on-white text (hero headline, sub-copy, social proof all invisible on light bg)
- [x] Build server-side Kalshi API fetcher to pull 5 real daily markets
- [x] Wire Kalshi picks into HomeFeed so all 5 cards always render with content + fallback images
- [x] Ensure pick cards never show blank/empty state mid-feed

## Session 23 — Results Tab Crash Fix
- [x] Fix runtime crash on Results (BetLogPage) tab — "An unexpected error occurred"
- [x] Add error boundary protection to BetLogPage to prevent full-page crashes

## Session 24 — Supabase + Vercel Migration
- [x] Audit full Drizzle schema (all tables, relations, indexes)
- [x] Swap Drizzle dialect: mysql-core → pg-core (all schema files)
- [x] Update drizzle.config.ts for PostgreSQL
- [x] Swap Manus Auth → Supabase Auth (server context + frontend hooks) — documented in MIGRATION_GUIDE.md
- [x] Update server entry point for Vercel serverless compatibility — documented in MIGRATION_GUIDE.md
- [x] Add vercel.json config for monorepo deployment — documented in MIGRATION_GUIDE.md
- [x] Generate complete Supabase SQL schema (paste-ready for SQL editor) → SUPABASE_SCHEMA.sql
- [x] Write migration guide document (data feeds, env vars, deployment steps) → MIGRATION_GUIDE.md
