// Swipestakes — LandingPage
// Light theme | White/off-white background | Dark text | Pink/purple accents

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { CheckCircle, XCircle, Coins, Trophy, Star, ChevronRight, Zap, Gift, ArrowRight, User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SCREEN_URLS = {
  home:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/swipestakes-home-v4-XxZJKyTP6Ke9LiunPaSKP6.webp",
  wallet:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/swipestakes-wallet-v4-b6U9vrfVAhtFrKmA2DFBY3.webp",
  betlog:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663105007581/B8qGntRwzvbjjiLJQDwKCA/swipestakes-results-v4-MWxH84yqWGoMazmCjFXC4e.webp",
};

const FEATURES = [
  {
    emoji: '🎯',
    title: 'PICK5 every day',
    desc: 'Five juicy prediction cards drop daily — your personal PICK5 run. No payment, no risk, just swipe.',
    color: '#FF3D9A',
    bg: 'rgba(255,61,154,0.08)',
  },
  {
    emoji: '💰',
    title: 'Earn Real Credits',
    desc: 'Go 5/5 and earn 25 credits. 4/5 earns 10. Even 3/5 gets you 5 credits. Credits never expire.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    emoji: '🎁',
    title: 'Redeem for Gifts',
    desc: 'Trade credits for Amazon gift cards, Starbucks, DoorDash, and more. Real rewards, zero cost.',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
  },
  {
    emoji: '🤖',
    title: 'AI Confidence Scores',
    desc: 'Each pick comes with an AI confidence score to help you decide. Swipe smarter, not harder.',
    color: '#8B2BE2',
    bg: 'rgba(139,43,226,0.08)',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign up free', desc: 'No credit card, no deposit. Jump into your first PICK5 round in seconds.', emoji: '✨' },
  { step: '02', title: 'Clear all 5 picks', desc: '→ YES/OVER · ← NO/UNDER · ↓ skip. Each card is one of your five — finish the board!', emoji: '👆' },
  { step: '03', title: 'Score credits', desc: 'Nail 5/5 for the biggest payout; 4/5 and 3/5 still sweeten your wallet when results hit.', emoji: '⭐' },
  { step: '04', title: 'Redeem gift cards', desc: 'Spend credits in the shop — Amazon, coffee, delivery, and more.', emoji: '🎁' },
];

const CREDIT_RULES = [
  { score: '5/5', credits: 25, label: 'Perfect Day', color: '#F59E0B', emoji: '🏆' },
  { score: '4/5', credits: 10, label: 'Great Day',   color: '#10B981', emoji: '🔥' },
  { score: '3/5', credits: 5,  label: 'Good Day',    color: '#8B2BE2', emoji: '👍' },
];

// ─── PHONE MOCKUP ─────────────────────────────────────────────────────────────

function PhoneMockup({ screenUrl }: { screenUrl: string }) {
  return (
    <div
      className="relative mx-auto"
      style={{
        width: 240,
        height: 490,
        borderRadius: 40,
        background: '#1a1a2e',
        border: '2.5px solid rgba(0,0,0,0.12)',
        boxShadow: '0 32px 80px rgba(139,43,226,0.2), 0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic island */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10"
        style={{ width: 80, height: 22, borderRadius: 12, background: '#0a0a0a' }}
      />
      {/* Screen */}
      <img
        src={screenUrl}
        alt="App screen"
        className="w-full h-full object-cover"
        style={{ borderRadius: 38 }}
      />
    </div>
  );
}

// ─── SWIPE DEMO CARD ─────────────────────────────────────────────────────────

function SwipeDemo() {
  const [swiped, setSwiped] = useState<'yes' | 'no' | null>(null);
  const [cardIndex, setCardIndex] = useState(0);

  const cards = [
    { question: 'Will LeBron score over 27.5 pts tonight?', category: 'NBA', emoji: '🏀', color: '#FF3D9A' },
    { question: 'Will the S&P 500 close higher today?',     category: 'FINANCE', emoji: '📈', color: '#8B2BE2' },
    { question: 'Will Bitcoin close above $70k today?',     category: 'CRYPTO', emoji: '₿', color: '#F59E0B' },
  ];

  const card = cards[cardIndex % cards.length];

  const handleSwipe = (dir: 'yes' | 'no') => {
    setSwiped(dir);
    setTimeout(() => {
      setSwiped(null);
      setCardIndex(i => i + 1);
    }, 600);
  };

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 200 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={cardIndex}
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{
            scale: 1, opacity: 1, y: 0,
            x: swiped === 'yes' ? 200 : swiped === 'no' ? -200 : 0,
            rotate: swiped === 'yes' ? 15 : swiped === 'no' ? -15 : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-3xl p-5 bg-white"
          style={{
            border: '1.5px solid #EBEBEB',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: `${card.color}12`, color: card.color, fontFamily: 'Nunito, sans-serif' }}
          >
            <span>{card.emoji}</span><span>{card.category}</span>
          </div>
          <p className="text-base font-black leading-snug text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            {card.question}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Swipe buttons */}
      <div className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('no')}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white"
          style={{ border: '2px solid #FF6B6B', boxShadow: '0 4px 16px rgba(255,107,107,0.2)' }}
        >
          <XCircle size={22} style={{ color: '#FF6B6B' }} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe('yes')}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white"
          style={{ border: '2px solid #10B981', boxShadow: '0 4px 16px rgba(16,185,129,0.2)' }}
        >
          <CheckCircle size={22} style={{ color: '#10B981' }} />
        </motion.button>
      </div>
    </div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'home' | 'wallet' | 'betlog'>('home');

  const displayName = user?.name?.trim() || user?.email || "Account";

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    toast.success("You're on the list! 🎉");
  };

  return (
    <div className="min-h-screen" style={{ background: '#F8F7FF', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 px-5 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(248,247,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)', fontFamily: "'Fredoka One', sans-serif" }}
          >
            S
          </div>
          <span className="text-lg font-black text-gray-800" style={{ fontFamily: "'Chewy', cursive", letterSpacing: '0.04em' }}>
            PICK5
          </span>
        </div>
        <div className="flex min-h-10 items-center justify-end gap-2">
          {authLoading ? (
            <div
              className="h-10 w-10 shrink-0 rounded-full bg-gray-200/80 animate-pulse"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-md outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-pink-400"
                  style={{
                    background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
                    boxShadow: "0 4px 16px rgba(255,61,154,0.35)",
                  }}
                  aria-label="Account menu"
                >
                  <User className="h-5 w-5 text-white" strokeWidth={2.2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem] rounded-2xl border border-gray-100 p-1 shadow-xl">
                <DropdownMenuLabel className="font-semibold text-gray-800" style={{ fontFamily: "Nunito, sans-serif" }}>
                  <span className="block truncate text-sm">{displayName}</span>
                  {user?.email ? (
                    <span className="block truncate text-xs font-normal text-gray-500">{user.email}</span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl text-sm font-semibold"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                  onSelect={() => navigate("/feed")}
                >
                  Play PICK5
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl text-sm font-semibold text-rose-600 focus:text-rose-600"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                  onSelect={() => {
                    void (async () => {
                      try {
                        await logout();
                        toast.success("Signed out");
                      } catch {
                        toast.error("Could not sign out");
                      }
                    })();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <a
                href={getLoginUrl("/")}
                className="text-sm font-bold px-4 py-2 rounded-xl text-gray-500"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                Sign in
              </a>
              <Link href="/feed?play=1">
                <a
                  className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                  style={{
                    background: "linear-gradient(135deg, #FF3D9A, #8B2BE2)",
                    boxShadow: "0 4px 16px rgba(255,61,154,0.3)",
                    fontFamily: "Nunito, sans-serif",
                  }}
                >
                  Play Free
                </a>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="px-5 pt-12 pb-16 text-center relative overflow-hidden">
        {/* Soft background blobs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,61,154,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,43,226,0.1) 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
            style={{ background: 'rgba(255,61,154,0.1)', color: '#FF3D9A', border: '1px solid rgba(255,61,154,0.25)' }}
          >
            <Zap size={14} /> PICK5 — free daily match · no deposit
          </div>

          <h1
            className="text-5xl font-black leading-tight mb-4"
            style={{ fontFamily: "'Chewy', cursive", letterSpacing: '0.02em' }}
          >
            <span className="text-gray-800">Match 5 picks.</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Pop credits &amp; prizes!
            </span>
          </h1>

          <p
            className="text-lg mb-8 max-w-sm mx-auto text-gray-500"
            style={{ lineHeight: 1.6, fontFamily: 'Nunito, sans-serif' }}
          >
            Every day you get a <span className="font-bold text-gray-700">PICK5</span> board — swipe yes/no (or over/under), finish all five, then earn credits when results settle. Cash out for gift cards. Candy-simple.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link href="/feed?play=1">
              <a
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg text-white"
                style={{
                  background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
                  boxShadow: '0 8px 32px rgba(255,61,154,0.35)',
                  fontFamily: "'Fredoka One', sans-serif",
                }}
              >
                Start Playing Free <ArrowRight size={18} />
              </a>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                {['🧑', '👩', '👦', '👧', '🧔'].map((e, i) => (
                  <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-white"
                    style={{ border: '1.5px solid #EBEBEB', zIndex: 5 - i }}>
                    {e}
                  </div>
                ))}
              </div>
              <span className="font-semibold text-gray-500">2,400+ players</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#F59E0B" style={{ color: '#F59E0B' }} />)}
              <span className="font-semibold ml-1 text-gray-500">4.9/5</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── INTERACTIVE SWIPE DEMO ── */}
      <section className="px-5 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            Try a mini PICK5 👇
          </h2>
          <p className="text-sm mb-10 text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Tap YES ✓ or NO ✗ — that’s the same energy as the real game
          </p>
          <SwipeDemo />
        </motion.div>
      </section>

      {/* ── CREDIT RULES ── */}
      <section className="px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            How credits work
          </h2>
          <p className="text-sm text-center mb-6 text-gray-400">
            The better your daily score, the more you earn
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CREDIT_RULES.map((rule, i) => (
              <motion.div
                key={rule.score}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-4 text-center bg-white"
                style={{
                  border: `1.5px solid ${rule.color}25`,
                  boxShadow: `0 4px 16px ${rule.color}12`,
                }}
              >
                <div className="text-3xl mb-2">{rule.emoji}</div>
                <div className="text-xl font-bold mb-0.5" style={{ fontFamily: "'Fredoka One', sans-serif", color: rule.color }}>
                  {rule.score}
                </div>
                <div className="text-xs font-bold mb-1 text-gray-400" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  {rule.label}
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: rule.color, fontFamily: "'Fredoka One', sans-serif" }}
                >
                  +{rule.credits} credits
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── APP SCREENSHOTS ── */}
      <section className="px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            See it in action
          </h2>
          <p className="text-sm text-center mb-6 text-gray-400">
            Tap to preview each screen
          </p>

          {/* Screen switcher tabs */}
          <div className="flex gap-2 justify-center mb-6">
            {([
              { id: 'home',   label: '🏠 Home' },
              { id: 'wallet', label: '💰 Wallet' },
              { id: 'betlog', label: '📋 Results' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveScreen(tab.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  background: activeScreen === tab.id ? 'linear-gradient(135deg, rgba(255,61,154,0.12), rgba(139,43,226,0.1))' : '#FFFFFF',
                  color: activeScreen === tab.id ? '#FF3D9A' : '#9CA3AF',
                  border: activeScreen === tab.id ? '1.5px solid rgba(255,61,154,0.3)' : '1.5px solid #EBEBEB',
                  fontFamily: "'Fredoka One', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <PhoneMockup screenUrl={SCREEN_URLS[activeScreen]} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            Why Swipestakes?
          </h2>
          <div className="space-y-3">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white"
                style={{
                  border: `1px solid ${feat.color}18`,
                  boxShadow: `0 4px 16px ${feat.color}0A`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: feat.bg }}
                >
                  {feat.emoji}
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1" style={{ fontFamily: "'Fredoka One', sans-serif", color: feat.color }}>
                    {feat.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 py-12" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            How it works
          </h2>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(255,61,154,0.1)', border: '1px solid rgba(255,61,154,0.2)' }}
                >
                  {step.emoji}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-gray-300" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                      STEP {step.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-0.5 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400" style={{ lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── GIFT CATALOG TEASER ── */}
      <section className="px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            Real rewards await 🎁
          </h2>
          <p className="text-sm mb-6 text-gray-400">
            Redeem credits for gift cards and more
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { emoji: '🛒', name: 'Amazon',    credits: 50,  value: '$5'  },
              { emoji: '☕', name: 'Starbucks', credits: 50,  value: '$5'  },
              { emoji: '🍕', name: 'DoorDash',  credits: 100, value: '$10' },
              { emoji: '💳', name: 'Visa',      credits: 250, value: '$25' },
            ].map((gift, i) => (
              <motion.div
                key={gift.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white"
                style={{
                  border: '1.5px solid #F3F4F6',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <span className="text-xl">{gift.emoji}</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                    {gift.name} {gift.value}
                  </div>
                  <div className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {gift.credits} credits
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-5 py-14 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)' }}
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.4)' }} />

        <div className="relative z-10">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
            Ready to play?
          </h2>
          <p className="text-white/80 mb-8 max-w-xs mx-auto" style={{ lineHeight: 1.6 }}>
            Join thousands of players earning free gift cards every day. No deposit, no risk.
          </p>

          <Link href="/feed?play=1">
            <a
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-lg text-gray-800 bg-white"
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              Start Playing Free <ArrowRight size={18} />
            </a>
          </Link>

          <p className="text-white/60 text-xs mt-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
            No credit card required · Free forever
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-5 py-6 text-center"
        style={{ background: '#1a1a2e', borderTop: '1px solid rgba(255,61,154,0.1)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)', fontFamily: "'Fredoka One', sans-serif" }}
          >
            S
          </div>
          <span className="font-bold text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>Swipestakes</span>
        </div>
        <p className="text-xs text-white/40" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Free-to-play prediction game. No real money wagering. Credits are non-monetary and redeemable for gift cards only.
        </p>
        <p className="text-xs mt-2 text-white/25" style={{ fontFamily: 'Nunito, sans-serif' }}>
          © 2026 Swipestakes · All rights reserved
        </p>
      </footer>
    </div>
  );
}
