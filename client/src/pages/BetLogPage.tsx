// Swipestakes — BetLogPage
// Light white theme | Today's picks | Score | Credits | History

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, MinusCircle, Clock, Coins } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  perfect: { label: 'Perfect! 🏆', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', credits: 25 },
  great:   { label: 'Great! 🔥',   color: '#FF3D9A', bg: '#FFF0F7', border: '#FFB3D9', credits: 10 },
  good:    { label: 'Good! 👍',    color: '#00B894', bg: '#F0FFF9', border: '#B3EDD9', credits: 5  },
  miss:    { label: 'Keep going!', color: '#8B2BE2', bg: '#F5F0FF', border: '#C9B3F5', credits: 0  },
};

function getTier(correct: number) {
  if (correct === 5) return TIER_CONFIG.perfect;
  if (correct === 4) return TIER_CONFIG.great;
  if (correct === 3) return TIER_CONFIG.good;
  return TIER_CONFIG.miss;
}

const MOCK_TODAY_PICKS = [
  { id: 1, question: 'Will LeBron James score over 27.5 points tonight?', choice: 'over',  result: 'correct',   category: 'NBA' },
  { id: 2, question: 'Will the S&P 500 close higher than yesterday?',      choice: 'yes',   result: 'correct',   category: 'FINANCE' },
  { id: 3, question: 'Will Anthropic announce a new model this week?',      choice: 'no',    result: 'incorrect', category: 'TECH' },
  { id: 4, question: 'Will Patrick Mahomes throw for over 280.5 yards?',   choice: 'over',  result: 'pending',   category: 'NFL' },
  { id: 5, question: 'Will Bitcoin close above $70,000 today?',             choice: 'skip',  result: 'skipped',   category: 'FINANCE' },
];

const MOCK_HISTORY = [
  { date: '2026-03-26', correct: 4, total: 5, credits: 10 },
  { date: '2026-03-25', correct: 5, total: 5, credits: 25 },
  { date: '2026-03-24', correct: 3, total: 5, credits: 5 },
  { date: '2026-03-23', correct: 4, total: 5, credits: 10 },
  { date: '2026-03-22', correct: 2, total: 5, credits: 0 },
  { date: '2026-03-21', correct: 5, total: 5, credits: 25 },
  { date: '2026-03-20', correct: 3, total: 5, credits: 5 },
];

const CATEGORY_COLORS: Record<string, string> = {
  NBA: '#EF4444', NFL: '#8B2BE2', FINANCE: '#FF3D9A', TECH: '#00B894', DEFAULT: '#D97706',
};

// ─── PICK ROW ─────────────────────────────────────────────────────────────────

function PickRow({ pick, index }: { pick: any; index: number }) {
  const isCorrect   = pick.result === 'correct';
  const isIncorrect = pick.result === 'incorrect';
  const isSkipped   = pick.result === 'skipped';
  const isPending   = pick.result === 'pending';

  const choiceLabel =
    pick.choice === 'yes'    ? 'YES'
    : pick.choice === 'no'   ? 'NO'
    : pick.choice === 'over' ? 'OVER'
    : pick.choice === 'under' ? 'UNDER'
    : 'SKIP';

  const catColor = CATEGORY_COLORS[pick.category] ?? CATEGORY_COLORS.DEFAULT;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white"
      style={{
        border: `1px solid ${isCorrect ? '#D1FAE5' : isIncorrect ? '#FCE7F3' : '#F3F4F6'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex-shrink-0">
        {isCorrect   && <CheckCircle2 size={22} className="text-green-500" />}
        {isIncorrect && <XCircle      size={22} className="text-pink-500" />}
        {isSkipped   && <MinusCircle  size={22} className="text-gray-300" />}
        {isPending   && <Clock        size={22} className="text-yellow-500 animate-pulse" />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold leading-snug"
          style={{
            color: isSkipped ? '#D1D5DB' : '#1F2937',
            fontFamily: 'Nunito, sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {pick.question}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${catColor}18`, color: catColor, fontFamily: "'Fredoka One', sans-serif" }}
          >
            {pick.category}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: isCorrect ? '#D1FAE5' : isIncorrect ? '#FCE7F3' : '#F3F4F6',
              color: isCorrect ? '#059669' : isIncorrect ? '#FF3D9A' : '#9CA3AF',
              fontFamily: "'Fredoka One', sans-serif",
            }}
          >
            {choiceLabel}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <span
          className="text-[11px] font-bold"
          style={{
            fontFamily: "'Fredoka One', sans-serif",
            color: isCorrect ? '#059669' : isIncorrect ? '#FF3D9A' : isSkipped ? '#D1D5DB' : '#D97706',
          }}
        >
          {isCorrect ? '✓ Correct' : isIncorrect ? '✗ Wrong' : isSkipped ? 'Skipped' : 'Pending'}
        </span>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function BetLogPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  const { data: historyData } = trpc.credits.getDailyHistory.useQuery(
    {} as any,
    { enabled: !!user }
  ) as any;

  // getDailyHistory returns { days: [...] } — extract the array safely
  const historyDays: any[] = Array.isArray(historyData)
    ? historyData
    : Array.isArray(historyData?.days)
      ? historyData.days
      : null;

  // Use today's picks from the most recent history day if available
  const todayFromHistory = historyDays?.[0]?.picks ?? null;
  const todayPicks = todayFromHistory
    ? todayFromHistory.map((p: any, i: number) => ({
        id: i + 1,
        question: p.q ?? p.question ?? 'Pick',
        choice: p.choice,
        result: p.correct === true ? 'correct' : p.correct === false ? 'incorrect' : 'pending',
        category: p.category ?? 'PICK',
      }))
    : MOCK_TODAY_PICKS;

  const correctCount = todayPicks.filter((p: any) => p.result === 'correct').length;
  const pendingCount = todayPicks.filter((p: any) => p.result === 'pending').length;
  const tier = getTier(correctCount);
  const history: any[] = historyDays ?? MOCK_HISTORY;

  return (
    <div
      className="flex flex-col overflow-y-auto bg-gray-50"
      style={{ height: 'calc(100dvh - 72px)' }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-5 py-5 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)' }}
      >
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          PICK5 Results
        </h1>
        <p className="text-xs mt-0.5 text-white/70" style={{ fontFamily: 'Nunito, sans-serif' }}>
          How your last boards scored — and credits you unlocked
        </p>
      </div>

      {/* ── TODAY'S SCORE CARD ── */}
      <div className="px-5 py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 bg-white"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1.5px solid #F3F4F6',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Today's Score
            </span>
            {pendingCount > 0 && (
              <span
                className="text-xs px-2 py-1 rounded-full font-bold"
                style={{ background: '#FFFBEB', color: '#D97706', fontFamily: "'Fredoka One', sans-serif", border: '1px solid #FDE68A' }}
              >
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span
              className="text-6xl font-bold leading-none"
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {correctCount}
            </span>
            <span className="text-2xl font-bold mb-2 text-gray-300" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              / 5
            </span>
            <div
              className="ml-auto px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{
                background: tier.bg,
                color: tier.color,
                fontFamily: "'Fredoka One', sans-serif",
                border: `1px solid ${tier.border}`,
              }}
            >
              {tier.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Coins size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {tier.credits > 0 ? `+${tier.credits} credits earned today` : 'No credits today — keep playing!'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── TABS ── */}
      <div className="px-5 pb-2 bg-white border-b border-gray-100">
        <div className="flex rounded-2xl p-1 bg-gray-100">
          {(['today', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-xl text-sm transition-all duration-200"
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                background: activeTab === tab
                  ? 'linear-gradient(135deg, #FF3D9A, #8B2BE2)'
                  : 'transparent',
                color: activeTab === tab ? '#fff' : '#9CA3AF',
                boxShadow: activeTab === tab ? '0 2px 12px rgba(255,61,154,0.3)' : 'none',
              }}
            >
              {tab === 'today' ? "📋 Today's Picks" : '📅 History'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 px-5 pb-6 bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'today' ? (
            <motion.div
              key="today"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2 pt-3"
            >
              {todayPicks.map((pick: any, i: number) => (
                <PickRow key={pick.id} pick={pick} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-2 pt-3"
            >
              {history.map((day: any, i: number) => {
                const dayTier = getTier(day.correct);
                const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white"
                    style={{
                      border: `1px solid ${day.credits > 0 ? '#FDE68A' : '#F3F4F6'}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: dayTier.bg, border: `1px solid ${dayTier.border}` }}
                    >
                      {day.correct === 5 ? '🏆' : day.correct === 4 ? '🔥' : day.correct === 3 ? '👍' : '😬'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {dateLabel}
                      </p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {day.correct}/{day.total} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: day.credits > 0 ? dayTier.color : '#D1D5DB',
                          fontFamily: "'Fredoka One', sans-serif",
                        }}
                      >
                        {day.credits > 0 ? `+${day.credits} CR` : '—'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
