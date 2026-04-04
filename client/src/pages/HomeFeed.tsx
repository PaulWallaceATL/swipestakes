// Swipestakes — HomeFeed
// Auth gate after 1st swipe | Background images | Swipe sounds | Live credits | Out-of-picks modal

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { usePrefersFinePointer } from "@/hooks/usePrefersFinePointer";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Minus, Coins, RotateCcw, Trophy, Clock, Share2, Users, ChevronRight, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { SparkleToken, SparkleStar } from "@/components/SparkleToken";
import { Pick5Progress } from "@/components/Pick5Progress";
import { FirstPlayGuide, FIRST_PLAY_GUIDE_STORAGE_KEY } from "@/components/FirstPlayGuide";

// ─── SOUND ENGINE ─────────────────────────────────────────────────────────────
// Singleton AudioContext — created once, reused for all sounds.
// iOS requires AudioContext to be created/resumed inside a direct user gesture.
// We create it lazily on first touchstart/mousedown anywhere on the page,
// then resume() it before each tone so it's always ready.

let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _audioCtx;
  } catch (_) {
    return null;
  }
}

// Call this on the very first user interaction to unlock audio on iOS
function unlockAudio() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  // Play a silent buffer to fully unlock on Safari
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (_) {}
}

// Wire up the global unlock listener once
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    window.removeEventListener('touchstart', unlock, true);
    window.removeEventListener('mousedown', unlock, true);
  };
  window.addEventListener('touchstart', unlock, true);
  window.addEventListener('mousedown', unlock, true);
}

function createTone(ctx: AudioContext, freq: number, type: OscillatorType, duration: number, gain: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Crowd SFX (Mixkit previews, trimmed) — played via HTMLAudioElement so they work alongside Web Audio skip tone
let _crowdYes: HTMLAudioElement | null = null;
let _crowdNo: HTMLAudioElement | null = null;

function crowdAudio(kind: 'yes' | 'no'): HTMLAudioElement {
  if (kind === 'yes') {
    if (!_crowdYes) {
      _crowdYes = new Audio('/sounds/crowd-yes.mp3');
      _crowdYes.preload = 'auto';
    }
    return _crowdYes;
  }
  if (!_crowdNo) {
    _crowdNo = new Audio('/sounds/crowd-no.mp3');
    _crowdNo.preload = 'auto';
  }
  return _crowdNo;
}

function playSwipeSound(type: 'yes' | 'no' | 'skip') {
  if (type === 'yes' || type === 'no') {
    unlockAudio();
    try {
      const el = crowdAudio(type);
      el.volume = 0.9;
      el.currentTime = 0;
      void el.play().catch(() => {});
    } catch (_) {}
    return;
  }
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const play = () => {
      createTone(ctx, 350, 'sine', 0.18, 0.12);
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch (_) {}
}

// ─── CATEGORY CONFIG ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; emoji: string; fallbackBg: string }> = {
  NBA:      { color: '#FF6B35', emoji: '🏀', fallbackBg: 'linear-gradient(135deg, #FF6B35 0%, #FF3366 100%)' },
  NFL:      { color: '#7C3AED', emoji: '🏈', fallbackBg: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)' },
  MLB:      { color: '#0EA5E9', emoji: '⚾', fallbackBg: 'linear-gradient(135deg, #0EA5E9 0%, #1D4ED8 100%)' },
  NHL:      { color: '#06B6D4', emoji: '🏒', fallbackBg: 'linear-gradient(135deg, #06B6D4 0%, #0D9488 100%)' },
  TECH:     { color: '#10B981', emoji: '💻', fallbackBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
  FINANCE:  { color: '#F59E0B', emoji: '📈', fallbackBg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
  POLITICS: { color: '#8B5CF6', emoji: '🗳️', fallbackBg: 'linear-gradient(135deg, #8B5CF6 0%, #4338CA 100%)' },
  CULTURE:  { color: '#EC4899', emoji: '🎭', fallbackBg: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' },
  DEFAULT:  { color: '#6366F1', emoji: '🎯', fallbackBg: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)' },
};

// Category → Unsplash image keyword map for background images
// All URLs verified working (return image/jpeg, not text/html)
const CATEGORY_IMAGES: Record<string, string[]> = {
  NBA:      ['https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80', 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80'],
  NFL:      ['https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80', 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80'],
  MLB:      ['https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=80', 'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=800&q=80'],
  NHL:      ['https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=80', 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80'],
  TECH:     ['https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80'],
  FINANCE:  ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80'],
  POLITICS: ['https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80', 'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&q=80'],
  CULTURE:  ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80'],
  DEFAULT:  ['https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80'],
};

function getCardImage(market: any): string {
  // Use market's own imageUrl if available
  if (market.imageUrl) return market.imageUrl;
  const cat = (market.category || 'DEFAULT').toUpperCase();
  const imgs = CATEGORY_IMAGES[cat] ?? CATEGORY_IMAGES.DEFAULT;
  // Deterministically pick based on market id
  const idx = (Number(String(market.id).replace(/\D/g, '').slice(-3) || 0)) % imgs.length;
  return imgs[idx];
}

function getCat(cat?: string) {
  if (!cat) return CATEGORY_CONFIG.DEFAULT;
  return CATEGORY_CONFIG[cat.toUpperCase()] ?? CATEGORY_CONFIG.DEFAULT;
}

// ─── MOCK PICKS ───────────────────────────────────────────────────────────────
// 10 picks with verified working Unsplash image URLs (all return image/jpeg)
const MOCK_PICKS = [
  {
    id: 'mock-1',
    question: 'Will LeBron James score over 27.5 points tonight?',
    category: 'NBA',
    type: 'over_under',
    line: 27.5,
    lineUnit: 'pts',
    aiConfidence: 72,
    description: 'Lakers vs. Celtics — 7:30 PM ET',
    imageUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80',
  },
  {
    id: 'mock-2',
    question: 'Will the S&P 500 close higher than yesterday?',
    category: 'FINANCE',
    type: 'yes_no',
    aiConfidence: 58,
    description: 'Based on pre-market futures and analyst sentiment',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  },
  {
    id: 'mock-3',
    question: 'Will Anthropic announce a new model this week?',
    category: 'TECH',
    type: 'yes_no',
    aiConfidence: 41,
    description: 'Based on recent hiring activity and blog post patterns',
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
  },
  {
    id: 'mock-4',
    question: 'Will Patrick Mahomes throw for over 280.5 yards?',
    category: 'NFL',
    type: 'over_under',
    line: 280.5,
    lineUnit: 'yds',
    aiConfidence: 65,
    description: 'Chiefs vs. Ravens — Sunday Night Football',
    imageUrl: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80',
  },
  {
    id: 'mock-5',
    question: 'Will Bitcoin close above $70,000 today?',
    category: 'FINANCE',
    type: 'yes_no',
    aiConfidence: 49,
    description: 'Based on on-chain activity and exchange flows',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80',
  },
  {
    id: 'mock-6',
    question: 'Will the Golden State Warriors win tonight?',
    category: 'NBA',
    type: 'yes_no',
    aiConfidence: 55,
    description: 'Warriors vs. Nuggets — 9:00 PM ET',
    imageUrl: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80',
  },
  {
    id: 'mock-7',
    question: 'Will Taylor Swift announce a new tour date this week?',
    category: 'CULTURE',
    type: 'yes_no',
    aiConfidence: 33,
    description: 'Based on social media activity and venue bookings',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  },
  {
    id: 'mock-8',
    question: 'Will the Fed hold interest rates steady this month?',
    category: 'FINANCE',
    type: 'yes_no',
    aiConfidence: 81,
    description: 'FOMC meeting — March 2025',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  },
  {
    id: 'mock-9',
    question: 'Will the NHL playoffs start before April 20th?',
    category: 'NHL',
    type: 'yes_no',
    aiConfidence: 88,
    description: 'Based on current season schedule',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80',
  },
  {
    id: 'mock-10',
    question: 'Will a new AI model top the MMLU benchmark this week?',
    category: 'TECH',
    type: 'yes_no',
    aiConfidence: 37,
    description: 'Based on upcoming model releases from major labs',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  },
  {
    id: 'mock-11',
    question: 'Will Shohei Ohtani hit a home run today?',
    category: 'MLB',
    type: 'yes_no',
    aiConfidence: 44,
    description: 'Dodgers vs. Giants — 4:05 PM ET',
    imageUrl: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=80',
  },
  {
    id: 'mock-12',
    question: 'Will Tesla stock close above $200 today?',
    category: 'FINANCE',
    type: 'yes_no',
    aiConfidence: 52,
    description: 'Based on pre-market trading and analyst price targets',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  },
  {
    id: 'mock-13',
    question: 'Will the Dallas Cowboys win their next game?',
    category: 'NFL',
    type: 'yes_no',
    aiConfidence: 61,
    description: 'Cowboys vs. Eagles — Sunday 4:25 PM ET',
    imageUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80',
  },
  {
    id: 'mock-14',
    question: 'Will Apple announce a new product this month?',
    category: 'TECH',
    type: 'yes_no',
    aiConfidence: 68,
    description: 'Based on supply chain leaks and event invitations',
    imageUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
  },
  {
    id: 'mock-15',
    question: 'Will Steph Curry score over 24.5 points tonight?',
    category: 'NBA',
    type: 'over_under',
    line: 24.5,
    lineUnit: 'pts',
    aiConfidence: 59,
    description: 'Warriors vs. Clippers — 10:00 PM ET',
    imageUrl: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80',
  },
  {
    id: 'mock-16',
    question: 'Will the Oscars best picture winner be an action film?',
    category: 'CULTURE',
    type: 'yes_no',
    aiConfidence: 28,
    description: 'Based on critic scores and awards season momentum',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  },
  {
    id: 'mock-17',
    question: 'Will Ethereum close above $3,500 today?',
    category: 'FINANCE',
    type: 'yes_no',
    aiConfidence: 46,
    description: 'Based on on-chain activity and DeFi volume',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  },
  {
    id: 'mock-18',
    question: 'Will the Stanley Cup playoffs feature a Canadian team?',
    category: 'NHL',
    type: 'yes_no',
    aiConfidence: 74,
    description: 'Based on current standings and playoff projections',
    imageUrl: 'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&q=80',
  },
  {
    id: 'mock-19',
    question: 'Will a major US city see record high temps this week?',
    category: 'CULTURE',
    type: 'yes_no',
    aiConfidence: 55,
    description: 'Based on NOAA weather forecasts and climate models',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
  },
  {
    id: 'mock-20',
    question: 'Will the Dow Jones close above 40,000 this week?',
    category: 'FINANCE',
    type: 'yes_no',
    aiConfidence: 63,
    description: 'Based on earnings season results and Fed guidance',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80',
  },
];

// ─── AUTH GATE MODAL ──────────────────────────────────────────────────────────
// Shown after all 5 guest swipes — no dismiss option, must sign up to save picks & continue

function AuthGateModal() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-end"
      style={{ background: 'rgba(10,8,30,0.72)', backdropFilter: 'blur(10px)' }}
    >
      {/* Teaser: blurred card stack behind the modal */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30, delay: 0.05 }}
        className="w-full rounded-t-[36px] p-6 pb-10"
        style={{
          background: 'linear-gradient(160deg, #2d1065 0%, #1a0a3d 100%)',
          border: '2px solid rgba(255,61,154,0.3)',
          borderBottom: 'none',
          maxWidth: 480,
          boxShadow: '0 -8px 40px rgba(255,61,154,0.2)',
        }}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.2)' }} />

        {/* Icon + headline */}
        <div className="text-center mb-5">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
            className="text-6xl mb-3"
          >
            🎯
          </motion.div>
          <h2 className="text-3xl mb-1" style={{ fontFamily: "'Fredoka One', sans-serif", background: 'linear-gradient(135deg, #FFD700, #FF3D9A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Nice — all 5 picks in!
          </h2>
          <p className="text-sm leading-relaxed" style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.65)' }}>
            Create a free account to save your picks, get results, earn credits, and redeem gift cards. Takes under a minute.
          </p>
        </div>

        {/* 5 candy dots — all filled */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[0,1,2,3,4].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: i * 0.08 }}
              className="flex items-center justify-center rounded-full font-black text-sm"
              style={{
                width: 38, height: 38,
                background: 'linear-gradient(135deg, #00D4AA, #00A86B)',
                color: '#fff',
                fontFamily: "'Fredoka One', sans-serif",
                boxShadow: '0 4px 12px rgba(0,212,170,0.5)',
              }}
            >
              ✓
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs font-bold mb-5" style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.4)' }}>
          5 of 5 picks made · sign up to save &amp; earn
        </p>

        {/* Perks */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { emoji: '🎁', label: '5 free picks', sub: 'every day' },
            { emoji: '💰', label: 'Earn credits', sub: 'for correct picks' },
            { emoji: '🛒', label: 'Real rewards', sub: 'gift cards' },
          ].map(p => (
            <div
              key={p.label}
              className="flex flex-col items-center p-3 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,61,154,0.15)' }}
            >
              <span style={{ fontSize: 22, marginBottom: 4 }}>{p.emoji}</span>
              <p className="text-xs font-bold" style={{ fontFamily: "'Fredoka One', sans-serif", color: '#FFD700' }}>{p.label}</p>
              <p className="text-[10px]" style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.45)' }}>{p.sub}</p>
            </div>
          ))}
        </div>

        <a
          href={getLoginUrl('/feed')}
          className="block w-full py-4 rounded-2xl text-center font-bold text-base"
          style={{
            background: 'linear-gradient(135deg, #FF3D9A, #FFD700)',
            color: '#1a0a3d',
            boxShadow: '0 6px 0 rgba(0,0,0,0.3), 0 8px 24px rgba(255,61,154,0.4)',
            fontFamily: "'Fredoka One', sans-serif",
            letterSpacing: '0.04em',
            fontSize: '1.1rem',
            textDecoration: 'none',
          }}
        >
          Create free account
        </a>
        <p className="text-center text-xs mt-3" style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.3)' }}>
          No credit card · Free forever
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── OUT-OF-PICKS MODAL ───────────────────────────────────────────────────────

function OutOfPicksModal({ picksUsed, onClose }: { picksUsed: number; onClose: () => void }) {
  const shareText = `I just played ${picksUsed} picks on Swipestakes! 🎯 Join me and earn gift cards for free picks daily. swipebet-b8qgntrw.manus.space`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Swipestakes', text: shareText, url: 'https://swipebet-b8qgntrw.manus.space' });
      } else {
        await navigator.clipboard.writeText(shareText);
        // toast would need import — use alert as fallback
        alert('Link copied! Share it with friends 🎉');
      }
    } catch (_) { /* user cancelled */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(5,2,20,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full rounded-3xl p-6 text-center"
        style={{
          background: 'linear-gradient(160deg, #2d1065 0%, #1a0a3d 100%)',
          maxWidth: 360,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,61,154,0.25)',
        }}
      >
        {/* Trophy emoji with bounce */}
        <motion.div
          animate={{ rotate: [-8, 8, -8, 8, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-6xl mb-3"
        >
          🏆
        </motion.div>

          <h2 className="text-3xl mb-1" style={{ fontFamily: "'Fredoka One', sans-serif", background: 'linear-gradient(135deg, #FFD700, #FF3D9A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            PICK5 locked in!
          </h2>
        <p className="text-sm mb-1 leading-relaxed" style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.65)' }}>
          You finished today’s PICK5. Results drop tonight — credits follow how many you got right!
        </p>
        <p className="text-xs font-bold mb-5" style={{ fontFamily: 'Nunito, sans-serif', color: '#00D4AA' }}>
          Come back tomorrow for 5 fresh picks 🌅
        </p>

        {/* Credit preview */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,215,0,0.2)' }}
        >
          <p className="text-xs font-bold mb-2" style={{ fontFamily: "'Fredoka One', sans-serif", color: '#FFD700' }}>
            Tonight's potential credits 💰
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: '3/5', cr: '5 CR', color: '#F59E0B' }, { label: '4/5', cr: '10 CR', color: '#FF3D9A' }, { label: '5/5', cr: '25 CR', color: '#00D4AA' }].map(r => (
              <div key={r.label} className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-sm font-black" style={{ color: r.color, fontFamily: "'Fredoka One', sans-serif" }}>{r.cr}</p>
                <p className="text-[10px]" style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.4)' }}>{r.label} correct</p>
              </div>
            ))}
          </div>
        </div>

        {/* Share CTA */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2 mb-3"
          style={{
            background: 'linear-gradient(135deg, #FF3D9A, #FFD700)',
            color: '#1a0a3d',
            boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 6px 20px rgba(255,61,154,0.4)',
            fontFamily: "'Fredoka One', sans-serif",
            letterSpacing: '0.04em',
            fontSize: '1rem',
          }}
        >
          <Share2 size={16} />
          Share with friends 🎉
        </button>

        <button
          onClick={onClose}
          className="text-sm font-bold"
          style={{ fontFamily: 'Nunito, sans-serif', color: 'rgba(255,255,255,0.35)' }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── PICK CARD ────────────────────────────────────────────────────────────────

function PickCard({
  market,
  onSwipeRight,
  onSwipeLeft,
  onSwipeDown,
  isTop,
  stackIndex,
}: {
  market: any;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onSwipeDown: () => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const yesOpacity = useTransform(x, [30, 100], [0, 1]);
  const noOpacity = useTransform(x, [-100, -30], [1, 0]);
  const skipOpacity = useTransform(y, [30, 90], [0, 1]);

  const cat = getCat(market.category);
  const isOverUnder = market.type === 'over_under' || market.marketType === 'total' || market.marketType === 'player_prop';
  const yesLabel = isOverUnder ? 'OVER' : 'YES';
  const noLabel = isOverUnder ? 'UNDER' : 'NO';
  const imageUrl = getCardImage(market);
  const finePointer = usePrefersFinePointer();

  const handleDragEnd = useCallback(
    (_: any, info: any) => {
      const { offset, velocity } = info;
      const swipeX = Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 400;
      const swipeDown = offset.y > 80 || velocity.y > 400;
      if (swipeDown && Math.abs(offset.x) < 60) {
        onSwipeDown();
      } else if (swipeX && offset.x > 0) {
        onSwipeRight();
      } else if (swipeX && offset.x < 0) {
        onSwipeLeft();
      }
    },
    [onSwipeRight, onSwipeLeft, onSwipeDown]
  );

  if (!isTop) {
    const scale = 1 - stackIndex * 0.04;
    const yOffset = stackIndex * 12;
    return (
      <div
        className="absolute inset-x-4 rounded-3xl overflow-hidden"
        style={{
          top: yOffset,
          bottom: -yOffset,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
          boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
          zIndex: 10 - stackIndex,
          opacity: 0.7,
        }}
      >
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
      </div>
    );
  }

  return (
    <motion.div
      className={
        finePointer
          ? "absolute inset-x-4 select-none overflow-hidden rounded-3xl"
          : "absolute inset-x-4 cursor-grab select-none overflow-hidden rounded-3xl active:cursor-grabbing"
      }
      style={{
        top: 0,
        bottom: 0,
        boxShadow: '0 16px 56px rgba(0,0,0,0.25)',
        x,
        y,
        rotate,
        zIndex: 20,
      }}
      drag={finePointer ? false : "x"}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onPointerDown={() => unlockAudio()}
      whileTap={finePointer ? undefined : { scale: 1.01 }}
    >
      {/* Background image — always present */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Gradient overlay for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.8) 100%)',
        }}
      />

      {/* YES/OVER stamp */}
      <motion.div
        className="absolute top-8 left-6 px-4 py-2 rounded-2xl font-black text-2xl border-4"
        style={{
          opacity: yesOpacity,
          color: '#22C55E',
          borderColor: '#22C55E',
          background: 'rgba(34,197,94,0.15)',
          fontFamily: 'Poppins, sans-serif',
          transform: 'rotate(-12deg)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {yesLabel} ✓
      </motion.div>

      {/* NO/UNDER stamp */}
      <motion.div
        className="absolute top-8 right-6 px-4 py-2 rounded-2xl font-black text-2xl border-4"
        style={{
          opacity: noOpacity,
          color: '#EF4444',
          borderColor: '#EF4444',
          background: 'rgba(239,68,68,0.15)',
          fontFamily: 'Poppins, sans-serif',
          transform: 'rotate(12deg)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {noLabel} ✗
      </motion.div>

      {/* SKIP stamp */}
      <motion.div
        className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl font-black text-xl border-4"
        style={{
          opacity: skipOpacity,
          color: '#fff',
          borderColor: 'rgba(255,255,255,0.6)',
          background: 'rgba(255,255,255,0.15)',
          fontFamily: 'Poppins, sans-serif',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
        }}
      >
        SKIP
      </motion.div>

      {/* Card content */}
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        {/* Top: category badge + deadline */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <span style={{ fontSize: 13 }}>{cat.emoji}</span>
            <span style={{ fontFamily: 'Nunito, sans-serif', letterSpacing: '0.04em' }}>
              {market.category || 'PICK'}
            </span>
          </div>
          {market.tradingCloseAt && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(0,0,0,0.35)',
                color: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Clock size={10} />
              <span>{new Date(market.tradingCloseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Bottom: question + meta + confidence + swipe hints */}
        <div>
          <h2
            className="text-[1.6rem] font-black leading-tight mb-2 text-white"
            style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            {market.question || market.title || market.eventTitle}
          </h2>

          {market.description && (
            <p className="text-sm mb-3 text-white/70" style={{ fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>
              {market.description}
            </p>
          )}

          {/* Over/Under line pill */}
          {isOverUnder && (market.line || market.totalLine) && (
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-3"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {market.line || market.totalLine}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                {market.lineUnit || 'pts'}
              </span>
            </div>
          )}

          {/* AI confidence */}
          {market.aiConfidence && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  🤖 AI Confidence
                </span>
                <span className="text-xs font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {market.aiConfidence}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'rgba(255,255,255,0.85)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${market.aiConfidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          )}

          {/* Swipe action hints — Candy Crush style */}
          <div
            className="flex items-center justify-between py-3 px-3 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 100%)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <div className="flex flex-col items-center gap-0.5 min-w-[4.5rem]">
              <span className="text-lg leading-none" aria-hidden>⬅️</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.35)' }}>
                  <XCircle size={12} className="text-red-300" />
                </div>
                <span className="text-[10px] font-black text-red-300 uppercase" style={{ fontFamily: "'Fredoka One', sans-serif" }}>{noLabel}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-1">
              <span className="text-base leading-none" aria-hidden>⬇️</span>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-wide" style={{ fontFamily: "'Fredoka One', sans-serif" }}>skip</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 min-w-[4.5rem]">
              <span className="text-lg leading-none" aria-hidden>➡️</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-emerald-300 uppercase" style={{ fontFamily: "'Fredoka One', sans-serif" }}>{yesLabel}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.35)' }}>
                  <CheckCircle2 size={12} className="text-emerald-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function HomeFeed() {
  const {
    isAuthenticated,
    hasSupabaseSession,
    useGuestPick5Flow,
    accountLinkPending,
    accountSyncFailed,
    refresh,
  } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeResult, setSwipeResult] = useState<{ label: string; color: string } | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [showOutOfPicks, setShowOutOfPicks] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [picksUsed, setPicksUsed] = useState(0);
  // Track how many swipes guest has done (reset on mount)
  const guestSwipesRef = useRef(0);

  // ── Live data queries ──
  // Protected procedures — only after auth.me returns a user. Running with session-but-no-profile caused 401 → main.tsx sent users back to /login in a loop.
  const { data: statusData, refetch: refetchStatus } = trpc.credits.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
  });

  const { data: marketsData, refetch: refetchMarkets } = trpc.credits.getDailyMarkets.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: loyaltyData, refetch: refetchLoyalty } = trpc.loyalty.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const currentStreak = loyaltyData?.stats?.currentStreak ?? 0;

  useEffect(() => {
    if (!hasSupabaseSession) return;
    setShowAuthGate(false);
    guestSwipesRef.current = 0;
  }, [hasSupabaseSession]);

  // Sync from backend status
  useEffect(() => {
    if (!statusData) return;
    setPicksUsed(statusData.picksUsed ?? 0);
    if (statusData.picksRemaining === 0) {
      setAllDone(true);
    }
  }, [statusData]);

  useEffect(() => {
    if (!marketsData) return;
    if (marketsData.picksUsed >= 5) {
      setAllDone(true);
    }
  }, [marketsData]);

  // Staged picks — collected locally, submitted all at once on the 5th swipe
  const [stagedPicks, setStagedPicks] = useState<Array<{
    marketId: number;
    choice: 'yes' | 'no' | 'over' | 'under' | 'skip';
    questionSnapshot: string;
    marketType: 'binary' | 'total' | 'player_prop';
  }>>([]);
  const [parlaySubmitted, setParlaySubmitted] = useState(false);
  const [howPick5Open, setHowPick5Open] = useState(false);
  const [firstPlayGuideOpen, setFirstPlayGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !useGuestPick5Flow) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("play") !== "1") return;
    if (localStorage.getItem(FIRST_PLAY_GUIDE_STORAGE_KEY)) {
      window.history.replaceState({}, document.title, "/feed");
      return;
    }
    setFirstPlayGuideOpen(true);
    window.history.replaceState({}, document.title, "/feed");
  }, [useGuestPick5Flow]);

  const completeFirstPlayGuide = useCallback(() => {
    localStorage.setItem(FIRST_PLAY_GUIDE_STORAGE_KEY, "1");
    setFirstPlayGuideOpen(false);
  }, []);

  const submitParlay = trpc.credits.submitParlay.useMutation({
    onSuccess: () => {
      setParlaySubmitted(true);
      refetchStatus();
      refetchLoyalty();
    },
  });

  // Use backend picks if available (min 5), else always fall back to MOCK_PICKS
  const displayPicks = useMemo(() => {
    const live = marketsData?.markets ?? [];
    if (live.length >= 5) return live as any[];
    // Pad with mock picks if live data is sparse (or user is unauthenticated)
    const liveIds = new Set(live.map((m: any) => m.id));
    const mockFill = MOCK_PICKS.filter(m => !liveIds.has(m.id));
    return [...live, ...mockFill].slice(0, 20) as any[];
  }, [marketsData]);

  const balance = isAuthenticated ? (statusData?.balance ?? 0) : 0;
  const picksLeft = useGuestPick5Flow
    ? Math.max(0, 5 - guestSwipesRef.current)
    : isAuthenticated
      ? (statusData?.picksRemaining ?? 5)
      : 5;

  const sessionCompleted = useGuestPick5Flow ? guestSwipesRef.current : stagedPicks.length;
  const pick5RoundDone =
    sessionCompleted >= 5 || showOutOfPicks || (allDone && !showOutOfPicks);
  const pick5GemsFilled = pick5RoundDone ? 5 : Math.min(5, sessionCompleted);
  const pick5ActiveGem =
    pick5RoundDone || sessionCompleted >= 5 ? null : Math.min(5, sessionCompleted + 1);

  const handleSwipe = useCallback(async (choice: 'yes' | 'no' | 'over' | 'under' | 'skip', label: string, color: string) => {
    if (firstPlayGuideOpen) return;
    const market = displayPicks[currentIndex];
    if (!market) return;

    // Guest demo: only without a Supabase session (avoid loop after sign-up while auth.me loads).
    if (useGuestPick5Flow) {
      // If gate is already showing, do nothing (prevent double-trigger)
      if (showAuthGate) return;

      // Let the swipe animation play through fully
      guestSwipesRef.current += 1;
      const soundType = choice === 'skip' ? 'skip' : (choice === 'yes' || choice === 'over') ? 'yes' : 'no';
      playSwipeSound(soundType);
      setSwipeResult({ label, color });
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setSwipeResult(null), 600);

      // Show paywall ONLY after the 5th swipe completes (all picks seen)
      if (guestSwipesRef.current >= 5) {
        setTimeout(() => setShowAuthGate(true), 700);
      }
      return;
    }

    // Play sound
    const soundType = choice === 'skip' ? 'skip' : (choice === 'yes' || choice === 'over') ? 'yes' : 'no';
    playSwipeSound(soundType);

    // Show brief feedback
    setSwipeResult({ label, color });
    setTimeout(() => setSwipeResult(null), 600);

    // Stage this pick locally
    const m = market as Record<string, any>;
    const marketType = m['marketType'] ?? (m['type'] === 'over_under' ? 'total' : 'binary');
    const newPick = {
      marketId: Number(m['id']),
      choice,
      questionSnapshot: m['question'] || m['title'] || '',
      marketType: marketType as 'binary' | 'total' | 'player_prop',
    };

    const updatedPicks = [...stagedPicks, newPick];
    setStagedPicks(updatedPicks);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setPicksUsed(prev => prev + 1);

    // On the 5th pick: show completion modal (don't set allDone yet so card stays visible behind modal)
    if (updatedPicks.length >= 5 || nextIndex >= displayPicks.length) {
      setShowOutOfPicks(true);
      // Submit parlay if authenticated and has real market IDs
      if (isAuthenticated && updatedPicks.some(p => !String(p.marketId).startsWith('0'))) {
        try {
          await submitParlay.mutateAsync({ picks: updatedPicks });
        } catch (_) { /* parlay still shows complete screen */ }
      }
    }
  }, [currentIndex, displayPicks, isAuthenticated, useGuestPick5Flow, showAuthGate, stagedPicks, submitParlay, firstPlayGuideOpen]);

  const handleRefresh = useCallback(() => {
    setAllDone(false);
    setCurrentIndex(0);
    setShowOutOfPicks(false);
    refetchMarkets();
    refetchStatus();
  }, [refetchMarkets, refetchStatus]);

  const cardAreaMinClass = hasSupabaseSession ? "min-h-[calc(100dvh-13rem)]" : "min-h-[calc(100dvh-9.5rem)]";

  return (
    <div className="relative flex flex-col" style={{ background: "#FFFFFF" }}>
      <FirstPlayGuide open={firstPlayGuideOpen} onComplete={completeFirstPlayGuide} />

      {hasSupabaseSession ? (
        <div
          className="flex-shrink-0 px-4 pt-4 pb-3"
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #EBEBEB",
          }}
        >
          {accountLinkPending && (
            <p
              className="mb-2 rounded-xl bg-violet-50 px-3 py-2 text-center text-[11px] font-bold text-violet-800"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Connecting your account…
            </p>
          )}
          {accountSyncFailed && (
            <div
              className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-center text-[11px] font-semibold text-amber-900"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              Can&apos;t reach game server.{" "}
              <button type="button" className="font-black underline decoration-2" onClick={() => void refresh()}>
                Retry
              </button>
            </div>
          )}
          <div
            className="rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 55%, #5B21B6 100%)",
              boxShadow: "0 6px 20px rgba(139,43,226,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <span className="text-2xl shrink-0">🍬</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                PICK5 — win credits, redeem gift cards
              </p>
              <p className="text-white/85 text-xs mt-0.5 leading-snug">
                More correct picks → more credits → Wallet → Redeem
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                fontFamily: "'Fredoka One', sans-serif",
                color: "#FFD700",
                fontSize: 15,
                whiteSpace: "nowrap",
              }}
            >
              <span>🪙</span>
              <span>{balance}</span>
            </div>
          </div>

          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h1
                className="text-[1.85rem] leading-none tracking-wide"
                style={{
                  fontFamily: "'Chewy', cursive",
                  background: "linear-gradient(135deg, #FF3D9A 0%, #C0267E 40%, #8B2BE2 75%, #00B894 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                PICK5
              </h1>
              <p className="text-[11px] font-bold text-gray-500 mt-1" style={{ fontFamily: "Nunito, sans-serif" }}>
                by Swipestakes · your daily 5-pick match
              </p>
              {statusData?.pickCalendarDay != null && statusData.pickCalendarDay !== "" && (
                <p
                  className="text-[10px] font-semibold text-gray-400 mt-0.5"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  Game day {statusData.pickCalendarDay}
                  {statusData.pickCalendarTimezone
                    ? ` · ${statusData.pickCalendarTimezone.replace(/_/g, " ")}`
                    : ""}
                </p>
              )}
            </div>

            {currentStreak > 0 && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs shrink-0"
                style={{
                  background:
                    currentStreak >= 7
                      ? "linear-gradient(135deg, #FF8C00, #FF3D9A)"
                      : currentStreak >= 3
                        ? "linear-gradient(135deg, #FFD700, #FF8C00)"
                        : "linear-gradient(135deg, #8B2BE2, #FF3D9A)",
                  color: "#fff",
                  boxShadow: "0 2px 10px rgba(255,61,154,0.3)",
                  fontFamily: "'Fredoka One', sans-serif",
                }}
              >
                <span>{currentStreak >= 7 ? "🔥" : currentStreak >= 3 ? "⚡" : "✨"}</span>
                <span>{currentStreak}d</span>
              </div>
            )}
          </div>

          <div className="mb-2">
            <Pick5Progress filled={pick5GemsFilled} activeIndex={pick5ActiveGem} />
            <p className="text-center text-[11px] font-bold text-gray-500 mt-1.5" style={{ fontFamily: "Nunito, sans-serif" }}>
              {pick5RoundDone
                ? "Round complete — nice! ✨"
                : `Pick ${pick5ActiveGem ?? 1} of 5 — ${picksLeft} left today`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setHowPick5Open((o) => !o)}
            className="w-full flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 mb-1 transition-colors"
            style={{
              background: "linear-gradient(180deg, #FFF7FB 0%, #F3E8FF 100%)",
              border: "2px solid rgba(255,61,154,0.2)",
              boxShadow: "0 3px 0 rgba(139,43,226,0.12)",
            }}
          >
            <span className="text-xs font-black text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              How PICK5 works
            </span>
            <ChevronDown
              size={18}
              className="text-pink-500 shrink-0 transition-transform"
              style={{ transform: howPick5Open ? "rotate(180deg)" : undefined }}
            />
          </button>
          {howPick5Open && (
            <div
              className="rounded-2xl px-3 py-3 mb-2 text-left space-y-2"
              style={{
                background: "#FFFBFC",
                border: "1px solid rgba(255,61,154,0.15)",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              <p className="text-xs font-bold text-gray-800 leading-snug">
                <span className="text-green-600">→</span> or <span className="text-green-600">YES!</span> = yes / over ·{" "}
                <span className="text-rose-500">←</span> or <span className="text-rose-500">NOPE</span> = no / under ·{" "}
                <span className="text-gray-500">↓</span> skip (still 1 of 5)
              </p>
              <p className="text-xs text-gray-600 leading-snug">
                <span className="font-bold text-amber-600">5/5 → 25</span>, <span className="font-bold text-pink-600">4/5 → 10</span>,{" "}
                <span className="font-bold text-teal-600">3/5 → 5</span> credits. Redeem in <span className="font-bold">Wallet</span>.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 px-4 pt-3 pb-3 bg-white border-b border-[#EBEBEB]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h1
              className="text-[1.75rem] leading-none tracking-wide"
              style={{
                fontFamily: "'Chewy', cursive",
                background: "linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              PICK5
            </h1>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
              style={{
                fontFamily: "Nunito, sans-serif",
                background: "rgba(255,61,154,0.1)",
                color: "#FF3D9A",
                border: "1px solid rgba(255,61,154,0.2)",
              }}
            >
              5 free picks
            </span>
          </div>
          <Pick5Progress filled={pick5GemsFilled} activeIndex={pick5ActiveGem} />
          <p className="text-center text-[11px] font-bold text-gray-600 mt-1.5" style={{ fontFamily: "Nunito, sans-serif" }}>
            {pick5RoundDone ? "All 5 done — unlock your account next ✨" : `Pick ${pick5ActiveGem ?? 1} of 5`}
          </p>
          <p className="text-center text-[10px] text-gray-400 mt-1" style={{ fontFamily: "Nunito, sans-serif" }}>
            Swipe the card or use the buttons underneath
          </p>
        </div>
      )}

      {/* ── CARD AREA ──
          min-height in normal flow so the page can extend past the viewport and
          scroll (absolute children do not add to parent height). */}
      <div
        className={`relative w-full ${cardAreaMinClass} shrink-0`}
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(255,61,154,0.14) 0%, transparent 55%), radial-gradient(ellipse 90% 60% at 100% 100%, rgba(139,43,226,0.1) 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 0% 80%, rgba(0,212,170,0.08) 0%, transparent 45%), linear-gradient(180deg, #FFF5FB 0%, #F0FAFF 35%, #F3F4F6 100%)",
        }}
      >
        {allDone && !showOutOfPicks ? (
          // Daily complete — candy celebration screen
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mb-6"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-7xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl mb-2 font-display" style={{ fontFamily: "'Fredoka One', sans-serif", background: 'linear-gradient(135deg, #FFD700, #FF3D9A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                PICK5 done today!
              </h2>
              <p className="text-sm font-bold text-gray-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Fresh cards tomorrow — keep your streak going 🌙
              </p>
            </motion.div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold candy-btn candy-btn-teal"
              style={{ fontFamily: "'Fredoka One', sans-serif" }}
            >
              <RotateCcw size={16} />
              Check for new picks
            </button>
          </div>
        ) : !allDone ? (
          <>
            {/* Swipe feedback overlay — candy pop */}
            <AnimatePresence>
              {swipeResult && (
                <motion.div
                  key="swipe-feedback"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [0.5, 1.2, 1] }}
                  exit={{ opacity: 0, scale: 1.3, y: -20 }}
                  transition={{ duration: 0.35, times: [0, 0.6, 1] }}
                  className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
                >
                  <div
                    className="px-10 py-5 rounded-full font-black text-3xl text-white"
                    style={{
                      background: swipeResult.color,
                      boxShadow: `0 0 0 6px rgba(255,255,255,0.15), 0 12px 40px ${swipeResult.color}88`,
                      fontFamily: "'Fredoka One', sans-serif",
                      letterSpacing: '0.06em',
                      border: '3px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {swipeResult.label}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card stack */}
            <div className="absolute inset-x-0 top-3 bottom-20">
              <AnimatePresence>
                {displayPicks
                  .slice(currentIndex, currentIndex + 3)
                  .reverse()
                  .map((market, reversedIdx) => {
                    const stackIndex = 2 - reversedIdx;
                    const isTop = stackIndex === 0;
                    const isOU = market.type === 'over_under' || market.marketType === 'total' || market.marketType === 'player_prop';
                    return (
                      <PickCard
                        key={market.id}
                        market={market}
                        isTop={isTop}
                        stackIndex={stackIndex}
                        onSwipeRight={() => handleSwipe(isOU ? 'over' : 'yes', isOU ? 'OVER ✓' : 'YES ✓', '#22C55E')}
                        onSwipeLeft={() => handleSwipe(isOU ? 'under' : 'no', isOU ? 'UNDER ✗' : 'NO ✗', '#EF4444')}
                        onSwipeDown={() => handleSwipe('skip', 'SKIP', '#94A3B8')}
                      />
                    );
                  })}
              </AnimatePresence>
            </div>

            {/* ── CANDY ACTION BUTTONS ── */}
            <div
              className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 px-6"
              style={{ zIndex: 30 }}
            >
              {/* NO / UNDER — red candy button */}
              <button
                onClick={() => {
                  const m = displayPicks[currentIndex];
                  if (m) {
                    const isOU = m.type === 'over_under' || m.marketType === 'total';
                    handleSwipe(isOU ? 'under' : 'no', isOU ? 'UNDER ✗' : 'NO ✗', '#FF3D9A');
                  }
                }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #FF6B6B 0%, #EF4444 50%, #B91C1C 100%)',
                    boxShadow: '0 6px 0 #7F1D1D, 0 8px 24px rgba(239,68,68,0.5)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.93) translateY(3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 0 #7F1D1D, 0 4px 12px rgba(239,68,68,0.4)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                >
                  <XCircle size={28} color="white" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold" style={{ color: '#FF6B6B', fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.05em' }}>NOPE</span>
              </button>

              {/* SKIP — grey candy button */}
              <button
                onClick={() => {
                  const m = displayPicks[currentIndex];
                  if (m) handleSwipe('skip', 'SKIP', '#94A3B8');
                }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #6B7280 0%, #4B5563 100%)',
                    boxShadow: '0 4px 0 #1F2937, 0 6px 16px rgba(0,0,0,0.4)',
                    border: '2px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Minus size={20} color="white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: '#9CA3AF', fontFamily: "'Fredoka One', sans-serif" }}>SKIP</span>
              </button>

              {/* YES / OVER — green candy button */}
              <button
                onClick={() => {
                  const m = displayPicks[currentIndex];
                  if (m) {
                    const isOU = m.type === 'over_under' || m.marketType === 'total';
                    handleSwipe(isOU ? 'over' : 'yes', isOU ? 'OVER ✓' : 'YES ✓', '#00D4AA');
                  }
                }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #34D399 0%, #10B981 50%, #065F46 100%)',
                    boxShadow: '0 6px 0 #064E3B, 0 8px 24px rgba(16,185,129,0.5)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                  onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.93) translateY(3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 0 #064E3B, 0 4px 12px rgba(16,185,129,0.4)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                >
                  <CheckCircle2 size={28} color="white" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold" style={{ color: '#00D4AA', fontFamily: "'Fredoka One', sans-serif", letterSpacing: '0.05em' }}>YES!</span>
              </button>
            </div>
          </>
        ) : null}

      {/* Auth gate modal — overlays after all 5 guest swipes, no dismiss */}
      <AnimatePresence>
        {showAuthGate && (
          <AuthGateModal />
        )}
      </AnimatePresence>

        {/* Out-of-picks modal */}
        <AnimatePresence>
          {showOutOfPicks && (
            <OutOfPicksModal
              picksUsed={picksUsed}
              onClose={() => { setShowOutOfPicks(false); setAllDone(true); }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
