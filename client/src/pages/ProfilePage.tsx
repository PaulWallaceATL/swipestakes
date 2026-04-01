// Swipestakes — ProfilePage
// Light white theme | Daily parlay history | Streak | Leaderboard

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Share2, Trophy, Flame, CheckCircle2,
  XCircle, ChevronRight, Coins, Target
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_PARLAY_HISTORY = [
  {
    date: 'Today',
    score: '3/5',
    correct: 3,
    total: 5,
    credits: 5,
    tier: 'good',
    picks: [
      { q: 'Will LeBron score 27+ pts tonight?', choice: 'YES', correct: true },
      { q: 'Will S&P 500 close higher?', choice: 'YES', correct: true },
      { q: 'Will Apple hit $220?', choice: 'NO', correct: false },
      { q: 'Will the Lakers win?', choice: 'YES', correct: true },
      { q: 'Will BTC stay above $60k?', choice: 'NO', correct: false },
    ],
  },
  {
    date: 'Yesterday',
    score: '5/5',
    correct: 5,
    total: 5,
    credits: 25,
    tier: 'perfect',
    picks: [
      { q: 'Will Steph Curry score 30+?', choice: 'YES', correct: true },
      { q: 'Will Tesla close up?', choice: 'YES', correct: true },
      { q: 'Will the Fed hold rates?', choice: 'YES', correct: true },
      { q: 'Will Warriors win?', choice: 'YES', correct: true },
      { q: 'Will ETH stay above $3k?', choice: 'YES', correct: true },
    ],
  },
  {
    date: 'Mar 25',
    score: '4/5',
    correct: 4,
    total: 5,
    credits: 10,
    tier: 'great',
    picks: [
      { q: 'Will Giannis score 30+?', choice: 'YES', correct: true },
      { q: 'Will NVDA hit $900?', choice: 'NO', correct: false },
      { q: 'Will Bucks win?', choice: 'YES', correct: true },
      { q: 'Will BTC hit $70k?', choice: 'YES', correct: true },
      { q: 'Will Fed cut rates in Q2?', choice: 'YES', correct: true },
    ],
  },
  {
    date: 'Mar 24',
    score: '2/5',
    correct: 2,
    total: 5,
    credits: 0,
    tier: 'miss',
    picks: [],
  },
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'sharpshooter99', winRate: 78, streak: 12, credits: 1240 },
  { rank: 2, name: 'hoopshead', winRate: 74, streak: 8, credits: 980 },
  { rank: 3, name: 'lockoftheday', winRate: 71, streak: 5, credits: 820 },
  { rank: 141, name: '...', winRate: null, streak: null, credits: null },
  { rank: 142, name: null, winRate: 64, streak: 3, credits: 90, isMe: true },
  { rank: 143, name: 'betking23', winRate: 62, streak: 1, credits: 85 },
];

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  perfect: { label: 'PERFECT', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', emoji: '🏆' },
  great:   { label: 'GREAT',   color: '#FF3D9A', bg: '#FFF0F7', border: '#FFB3D9', emoji: '🎯' },
  good:    { label: 'GOOD',    color: '#8B2BE2', bg: '#F5F0FF', border: '#C9B3F5', emoji: '✅' },
  miss:    { label: 'MISS',    color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB', emoji: '😔' },
};

// ─── PARLAY HISTORY CARD ──────────────────────────────────────────────────────

function ParlayCard({ entry, index }: { entry: typeof MOCK_PARLAY_HISTORY[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const tier = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.miss;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{
        border: `1.5px solid ${tier.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <button
        onClick={() => entry.picks.length > 0 && setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        {/* Tier badge */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: tier.bg, border: `1px solid ${tier.border}` }}
        >
          {tier.emoji}
        </div>

        {/* Date + score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              {entry.date}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`, fontFamily: "'Fredoka One', sans-serif" }}
            >
              {tier.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {entry.picks.length > 0 ? entry.picks.map((p, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: p.correct ? '#D1FAE5' : '#FCE7F3' }}
              >
                {p.correct
                  ? <CheckCircle2 size={11} className="text-green-500" />
                  : <XCircle size={11} className="text-pink-500" />
                }
              </div>
            )) : (
              <span className="text-[10px] text-gray-300" style={{ fontFamily: 'Nunito, sans-serif' }}>
                No details available
              </span>
            )}
          </div>
        </div>

        {/* Credits earned */}
        <div className="text-right flex-shrink-0">
          <div
            className="text-base font-black"
            style={{ color: entry.credits > 0 ? '#00B894' : '#D1D5DB', fontFamily: "'Fredoka One', sans-serif" }}
          >
            {entry.credits > 0 ? `+${entry.credits}` : '0'}
          </div>
          <div className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
            credits
          </div>
        </div>

        {entry.picks.length > 0 && (
          <ChevronRight
            size={14}
            className="text-gray-300 flex-shrink-0"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {expanded && entry.picks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-3.5 pb-3.5 space-y-1.5"
              style={{ borderTop: '1px solid #F3F4F6' }}
            >
              <div className="pt-2" />
              {entry.picks.map((pick, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-xl"
                  style={{ background: pick.correct ? '#F0FFF9' : '#FFF0F7' }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: pick.correct ? '#D1FAE5' : '#FCE7F3' }}
                  >
                    {pick.correct
                      ? <CheckCircle2 size={11} className="text-green-500" />
                      : <XCircle size={11} className="text-pink-500" />
                    }
                  </div>
                  <p className="flex-1 text-xs leading-tight text-gray-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {pick.q}
                  </p>
                  <span
                    className="text-[10px] font-bold flex-shrink-0"
                    style={{ color: pick.correct ? '#059669' : '#FF3D9A', fontFamily: "'Fredoka One', sans-serif" }}
                  >
                    {pick.choice}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'history' | 'stats' | 'leaderboard'>('history');
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: creditStatus } = trpc.credits.getStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  ) as any;

  const { data: historyData } = trpc.credits.getDailyHistory.useQuery(
    { limit: 14 },
    { enabled: isAuthenticated }
  ) as any;

  const displayName = user?.name ?? 'Player';
  const displayHandle = user?.name
    ? `@${user.name.toLowerCase().replace(/\s+/g, '')}`
    : '@you';
  const avatarUrl = (user as any)?.avatar
    ?? `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${displayName}`;

  const balance = creditStatus?.balance ?? 90;
  const totalWins = creditStatus?.picksWon ?? 18;
  const streak = creditStatus?.streak ?? 3;
  const totalPicks = creditStatus?.totalPicks ?? 28;
  const winRate = totalPicks > 0 ? Math.round((totalWins / totalPicks) * 100) : 0;

  const parlayHistory = (historyData?.days?.length > 0 ? historyData.days : MOCK_PARLAY_HISTORY) as typeof MOCK_PARLAY_HISTORY;

  const leaderboard = MOCK_LEADERBOARD.map(row =>
    row.isMe ? { ...row, name: displayHandle } : row
  );

  const handleShare = async () => {
    const shareText = `I'm on a ${streak}-day streak on Swipestakes! 🔥 Join me and get 5 free daily picks → https://swipestakes.app`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Swipestakes', text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Profile link copied! 🔗');
      }
    } catch {
      toast('Share cancelled');
    }
  };

  const TABS = [
    { id: 'history' as const,     label: '📅 History' },
    { id: 'stats' as const,       label: '📊 Stats' },
    { id: 'leaderboard' as const, label: '🏆 Ranks' },
  ];

  return (
    <div
      className="flex flex-col overflow-y-auto bg-gray-50"
      style={{ height: 'calc(100dvh - 72px)' }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-5 pt-5 pb-5 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)' }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-3xl text-white"
              style={{ fontFamily: "'Fredoka One', sans-serif" }}
            >
              Profile
            </h1>
            <p className="text-[11px] font-semibold text-white/65 mt-0.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Your PICK5 home base
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Share2 size={15} className="text-white" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Settings size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Profile hero */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div
              className="w-[68px] h-[68px] rounded-2xl p-[2.5px]"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-[14px] object-cover bg-white"
              />
            </div>
            {streak >= 3 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
                style={{ background: '#FF6B35', boxShadow: '0 2px 8px rgba(255,107,53,0.5)' }}
              >
                🔥
              </motion.div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="text-xl leading-tight truncate text-white"
              style={{ fontFamily: "'Fredoka One', sans-serif" }}
            >
              {displayName}
            </h2>
            <p className="text-xs mb-2 text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {displayHandle}
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Flame size={11} className="text-white" />
              <span className="text-[11px] font-bold text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                {streak}-day streak
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex gap-2 mt-4 p-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          {/* Credits */}
          <div className="flex-1 flex flex-col items-center gap-0.5"
            style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div className="flex items-center gap-1">
              <span className="text-base">🪙</span>
              <span className="text-base font-black text-yellow-300" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                {balance}
              </span>
            </div>
            <div className="text-[10px] text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>Credits</div>
          </div>
          {/* Win Rate */}
          <div className="flex-1 text-center"
            style={{ borderRight: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Target size={14} className="text-white" />
              <span className="text-base font-black text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                {winRate}%
              </span>
            </div>
            <div className="text-[10px] text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>Win Rate</div>
          </div>
          {/* Total Wins */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Trophy size={14} className="text-white" />
              <span className="text-base font-black text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                {totalWins}
              </span>
            </div>
            <div className="text-[10px] text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>Total Wins</div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="px-5 py-3 flex-shrink-0 bg-white border-b border-gray-100">
        <div className="flex rounded-2xl p-1 bg-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-xl text-xs transition-all duration-200"
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #FF3D9A, #8B2BE2)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#9CA3AF',
                boxShadow: activeTab === tab.id ? '0 2px 12px rgba(255,61,154,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 px-5 pb-6 bg-white">
        <AnimatePresence mode="wait">

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2.5 pt-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  Daily Pick Results
                </h3>
                <span className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Tap to expand picks
                </span>
              </div>
              {parlayHistory.map((entry: any, i: number) => (
                <ParlayCard key={entry.date} entry={entry} index={i} />
              ))}
            </motion.div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3 pt-3"
            >
              {/* Overall performance hero */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)',
                }}
              >
                <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-white/70" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  Overall Performance
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Win Rate',    value: `${winRate}%`, color: '#FFD700' },
                    { label: 'Total Picks', value: totalPicks,    color: '#FFD700' },
                    { label: 'Best Streak', value: `${streak}d`,  color: '#FFD700' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-black text-yellow-300" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                        {stat.value}
                      </div>
                      <div className="text-[10px] mt-0.5 text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-bold pt-1 text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Credit Earnings
              </h3>
              {[
                { tier: 'perfect', label: '5/5 Perfect', count: 1, credits: 25 },
                { tier: 'great',   label: '4/5 Great',   count: 3, credits: 10 },
                { tier: 'good',    label: '3/5 Good',    count: 5, credits: 5 },
                { tier: 'miss',    label: '2/5 or less', count: 2, credits: 0 },
              ].map((row, i) => {
                const t = TIER_CONFIG[row.tier];
                return (
                  <motion.div
                    key={row.tier}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: t.bg, border: `1px solid ${t.border}` }}
                    >
                      {t.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {row.label}
                      </p>
                      <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {row.count} times
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black" style={{ color: t.color, fontFamily: "'Fredoka One', sans-serif" }}>
                        {row.credits > 0 ? `+${row.credits}` : '—'}
                      </span>
                      <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        per day
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-2 pt-3"
            >
              <h3 className="text-sm font-bold mb-1 text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                This Week's Top Players
              </h3>
              {leaderboard.map((row, i) => {
                if (row.name === '...') {
                  return (
                    <div key="ellipsis" className="text-center py-1 text-xl text-gray-300">
                      ···
                    </div>
                  );
                }
                const rankEmoji = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : null;
                const rankColors = ['#D97706', '#6B7280', '#B45309'];
                return (
                  <motion.div
                    key={row.rank}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{
                      background: row.isMe ? '#FFF0F7' : '#FAFAFA',
                      border: row.isMe ? '1.5px solid #FFB3D9' : '1px solid #F3F4F6',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="w-8 text-center flex-shrink-0">
                      {rankEmoji ? (
                        <span className="text-xl">{rankEmoji}</span>
                      ) : (
                        <span className="text-sm font-black text-gray-400" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                          #{row.rank}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold truncate"
                        style={{
                          fontFamily: "'Fredoka One', sans-serif",
                          color: row.isMe ? '#FF3D9A' : row.rank <= 3 ? rankColors[row.rank - 1] : '#1F2937',
                        }}
                      >
                        {row.name ?? 'You'}
                        {row.isMe && <span className="ml-1 text-[10px] text-gray-400">(you)</span>}
                      </p>
                      {row.streak != null && (
                        <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          🔥 {row.streak}d streak
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {row.winRate != null && (
                        <p className="text-sm font-black text-green-600" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                          {row.winRate}%
                        </p>
                      )}
                      {row.credits != null && (
                        <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {row.credits} CR
                        </p>
                      )}
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
