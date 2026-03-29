# sw1sh — Design Brainstorm

## Context
Sports betting app with TikTok-style content feed, swipe betting, wallet, bet log, and social layer.
Mobile-first, dark mode, dopamine-driven UI. Brand name: **sw1sh**.

---

<response>
<probability>0.07</probability>
<idea>

**Design Movement**: Brutalist Neon — raw structure meets electric energy

**Core Principles**:
1. Unapologetic contrast: near-black backgrounds with electric lime/cyan accents that demand attention
2. Asymmetric tension: cards and panels deliberately off-balance to create visual momentum
3. Typographic aggression: ultra-heavy condensed display type for bets, thin mono for stats
4. Friction-free interaction: every swipe, tap, and transition feels physical and immediate

**Color Philosophy**:
- Background: `#0A0A0A` (near-void black) — makes neon pop at maximum contrast
- Primary accent: Electric Lime `#C8FF00` — energy, money, winning
- Secondary accent: Cyan `#00F5FF` — data, AI confidence, cool intelligence
- Danger/loss: Hot coral `#FF3B3B`
- Win: Lime green `#00FF88`
- Emotional intent: Users should feel like they're inside a stadium at night — electric, alive, slightly dangerous

**Layout Paradigm**:
- Full-viewport stacked cards (no chrome, no margin) — each bet card owns the screen
- Bottom dock navigation (iOS-native feel) with 5 tabs
- Asymmetric card layouts: player image bleeds off-screen left, text anchored right
- Stats and odds in mono grid overlays — feels like a Bloomberg terminal

**Signature Elements**:
1. Glitching neon text on win/loss events — brief RGB split animation
2. Scanline texture overlay at 3% opacity on all cards — gives a broadcast/TV feel
3. Lime "pulse ring" around confidence meter when AI confidence > 70%

**Interaction Philosophy**:
- Swipe physics feel like flicking a card across a table — spring-based, with slight overshoot
- Haptic-style visual feedback: screen flash on bet placement
- Every number counts up/down with a slot-machine roll animation

**Animation**:
- Card entrance: slide up from bottom with spring (stiffness 300, damping 25)
- Swipe right: card flies off with rotation + lime trail
- Swipe left: card dims and shrinks away
- Win notification: confetti burst + neon glow pulse
- Balance update: slot-machine number roll

**Typography System**:
- Display/Bets: `Barlow Condensed` 800 weight — aggressive, stadium-scoreboard energy
- Body/Stats: `JetBrains Mono` — technical, precise, data-forward
- Labels: `Barlow` 500 — readable, clean
- Hierarchy: 72px bet statement → 24px stats → 12px metadata

</idea>
</response>

<response>
<probability>0.06</probability>
<idea>

**Design Movement**: Cinematic Dark Luxury — premium sports media meets private members club

**Core Principles**:
1. Restraint as power: minimal elements, maximum impact — every pixel earns its place
2. Photography-first: player/team imagery is the hero, UI is the frame
3. Gold as currency: warm gold accents signal value, exclusivity, and winning
4. Depth through layers: frosted glass panels float over rich photographic backgrounds

**Color Philosophy**:
- Background: `#080810` (deep navy-black) — cinematic, premium
- Primary accent: Warm Gold `#F5C842` — wealth, achievement, exclusivity
- Secondary: Muted platinum `#C4C4D4` — sophisticated, not flashy
- Win: Gold pulse
- Loss: Deep crimson fade
- Emotional intent: Users feel like VIP members of an exclusive sports intelligence club

**Layout Paradigm**:
- Magazine-style full-bleed cards with portrait photography
- Frosted glass overlay panels for bet information
- Horizontal scroll for "trending" bets at top
- Vertical swipe stack for main feed

**Signature Elements**:
1. Gold foil shimmer effect on winning bet cards
2. Cinematic letterbox bars (subtle) on video clips
3. Monogram-style avatar treatment for user profiles

**Interaction Philosophy**:
- Deliberate, weighted interactions — nothing feels cheap or accidental
- Long-press to preview bet details (like 3D Touch)
- Smooth 60fps everything, no janky transitions

**Animation**:
- Card transitions: crossfade with scale (0.95 → 1.0)
- Gold shimmer: linear gradient sweep on win
- Number updates: smooth easing, not slot-machine

**Typography System**:
- Display: `Playfair Display` 700 — editorial, authoritative
- Body: `DM Sans` 400/500 — modern, readable
- Stats: `DM Mono` — precise

</idea>
</response>

<response>
<probability>0.08</probability>
<idea>

**Design Movement**: Hyper-Sport Digital — ESPN meets streetwear meets fintech

**Core Principles**:
1. Speed as aesthetic: diagonal cuts, motion blur, velocity-forward layouts
2. Cultural authenticity: typography and color drawn from jersey culture, sneaker drops, street graphics
3. Data made visceral: stats aren't tables — they're animated rings, bars, and pulses
4. Reward loop visibility: every action has an immediate, satisfying visual payoff

**Color Philosophy**:
- Background: `#0D0D0D` — deep charcoal, not pure black
- Primary: Vivid Orange `#FF5C00` — heat, urgency, action
- Secondary: Electric Blue `#0066FF` — sports broadcast, ESPN energy
- Tertiary: White `#FFFFFF` — contrast, clarity
- Win: Bright green `#00E676`
- Loss: Orange-red `#FF3D00`
- Emotional intent: The visual language of a live game broadcast — urgent, kinetic, NOW

**Layout Paradigm**:
- Diagonal section dividers (clip-path) between content zones
- Jersey-number-sized typography for key stats
- Split-screen card layouts: left = player, right = bet data
- Ticker-tape style scrolling odds at top of screen

**Signature Elements**:
1. Diagonal slash dividers between sections (like jersey number graphics)
2. Animated "heat map" background on hot bets
3. "LIVE" badge with pulsing red dot on active games

**Interaction Philosophy**:
- Aggressive, confident interactions — this is a sports app, not a meditation app
- Swipe feels like a fast break — quick, decisive
- Wins trigger a stadium-roar visual (ripple effect from center)

**Animation**:
- Card entrance: diagonal wipe from bottom-right
- Swipe: fast with motion blur trail
- Win: radial burst from center + number explosion
- Stats: bars fill left-to-right with spring

**Typography System**:
- Display: `Bebas Neue` — iconic sports typography
- Body: `Inter` 400/600 — clean, functional
- Stats: `Roboto Mono` — data precision

</idea>
</response>

---

## Selected Approach

**Brutalist Neon** — Design Movement #1

The sw1sh brand is built on electric energy, instant gratification, and the feeling of being inside a live game. The lime/cyan neon palette against near-void black creates maximum contrast and dopamine-triggering visual feedback. Barlow Condensed gives the bet statements a scoreboard authority. The asymmetric layouts and physical swipe interactions make the app feel alive and kinetic — not like a spreadsheet with odds.

This is the right choice because sw1sh needs to feel like entertainment first, betting second. The brutalist neon aesthetic achieves that without feeling cheap or generic.
