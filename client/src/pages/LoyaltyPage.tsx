// Swipestakes — LoyaltyPage
// Light white theme | Streak | Tier | Points | Milestones

import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Lock, CheckCircle2 } from 'lucide-react';

// ─── TIER CONFIG ──────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  bronze:   { label: 'Bronze',   color: '#B45309', bg: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)', next: 100,  icon: '🥉', multiplier: '1×' },
  silver:   { label: 'Silver',   color: '#6B7280', bg: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)', next: 500,  icon: '🥈', multiplier: '1.25×' },
  gold:     { label: 'Gold',     color: '#D97706', bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', next: 2000, icon: '🥇', multiplier: '1.5×' },
  platinum: { label: 'Platinum', color: '#7C3AED', bg: 'linear-gradient(135deg, #8B2BE2 0%, #6D28D9 100%)', next: null, icon: '💎', multiplier: '2×' },
};

function getMilestoneIcon(id: string) {
  if (id.startsWith('streak')) return '🔥';
  if (id.startsWith('picks'))  return '🎯';
  if (id.startsWith('days'))   return '📅';
  return '⭐';
}

function MilestoneCard({ m, idx }: { m: {
  id: string; title: string; description: string;
  points: number; credits: number; earned: boolean; earnedAt: Date | null;
}, idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
      style={{
        background: m.earned ? '#FFF0F7' : '#FAFAFA',
        border: m.earned ? '1.5px solid #FFB3D9' : '1.5px solid #E5E7EB',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: m.earned
            ? 'linear-gradient(135deg, #FF3D9A, #8B2BE2)'
            : '#F3F4F6',
        }}
      >
        {m.earned ? getMilestoneIcon(m.id) : <Lock size={16} className="text-gray-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{
          fontFamily: "'Fredoka One', sans-serif",
          color: m.earned ? '#1F2937' : '#9CA3AF',
        }}>
          {m.title}
        </p>
        <p className="text-xs truncate text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {m.description}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-xs font-bold" style={{ color: '#8B2BE2', fontFamily: "'Fredoka One', sans-serif" }}>
          +{m.points} pts
        </span>
        <span className="text-xs font-bold" style={{ color: '#FF3D9A', fontFamily: "'Fredoka One', sans-serif" }}>
          +{m.credits} CR
        </span>
      </div>
      {m.earned && (
        <CheckCircle2 size={14} className="absolute top-2 right-2 text-pink-400" />
      )}
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.loyalty.getStats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: milestoneData, isLoading: milestonesLoading } = trpc.loyalty.getMilestoneProgress.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div
        className="flex flex-col items-center justify-center px-6 text-center bg-white"
        style={{ height: 'calc(100dvh - 72px)' }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          Loyalty Rewards
        </h2>
        <p className="text-sm mb-6 text-gray-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Sign up to track your streak, earn loyalty points, and unlock milestone rewards.
        </p>
        <a
          href={getLoginUrl()}
          className="px-6 py-3 rounded-2xl font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
            fontFamily: "'Fredoka One', sans-serif",
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(255,61,154,0.3)',
          }}
        >
          Sign up free ✨
        </a>
      </div>
    );
  }

  const stats = data?.stats;
  const tier = (stats?.tier ?? 'bronze') as keyof typeof TIER_CONFIG;
  const tierCfg = TIER_CONFIG[tier];
  const lifetimePoints = stats?.lifetimeLoyaltyPoints ?? 0;
  const loyaltyPoints = stats?.loyaltyPoints ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const longestStreak = stats?.longestStreak ?? 0;
  const totalPicks = stats?.totalPicksPlaced ?? 0;
  const totalDays = stats?.totalDaysPlayed ?? 0;

  const tierKeys = ['bronze', 'silver', 'gold', 'platinum'] as const;
  const tierIdx = tierKeys.indexOf(tier);
  const nextTierKey = tierIdx < 3 ? tierKeys[tierIdx + 1] : null;
  const nextTierThreshold = tierCfg.next;
  const prevTierThreshold = tierIdx > 0 ? TIER_CONFIG[tierKeys[tierIdx - 1]].next ?? 0 : 0;
  const tierProgress = nextTierThreshold
    ? Math.min(100, ((lifetimePoints - prevTierThreshold) / (nextTierThreshold - prevTierThreshold)) * 100)
    : 100;

  const earnedMilestones = milestoneData?.filter(m => m.earned).length ?? 0;
  const totalMilestones = milestoneData?.length ?? 0;

  return (
    <div
      className="flex flex-col overflow-y-auto bg-gray-50"
      style={{ height: 'calc(100dvh - 72px)' }}
    >
      {/* ── HEADER ── */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)' }}
      >
        <h1 className="text-2xl font-bold mb-0.5 text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          PICK5 Loyalty
        </h1>
        <p className="text-xs font-semibold text-white/70" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Bonus perks for showing up and clearing boards
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── TIER CARD ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: tierCfg.bg }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{tierCfg.icon}</span>
                    <span className="text-lg font-bold text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                      {tierCfg.label} Tier
                    </span>
                  </div>
                  <p className="text-xs mb-3 text-white/70" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {tierCfg.multiplier} point multiplier on every play
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-yellow-300" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                      {loyaltyPoints.toLocaleString()}
                    </span>
                    <span className="text-white/70 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>pts</span>
                  </div>
                </div>
                {/* Streak bubble */}
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
                  >
                    <span className="text-xl">{currentStreak >= 7 ? '🔥' : currentStreak >= 3 ? '⚡' : '✨'}</span>
                    <span className="text-lg font-bold leading-none text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                      {currentStreak}
                    </span>
                  </div>
                  <p className="text-[10px] mt-1 text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    day streak
                  </p>
                </div>
              </div>

              {/* Tier progress bar */}
              {nextTierKey && (
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] mb-1 text-white/60">
                    <span style={{ fontFamily: 'Nunito, sans-serif' }}>{tierCfg.label}</span>
                    <span style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {TIER_CONFIG[nextTierKey].label} at {nextTierThreshold?.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tierProgress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full bg-yellow-300"
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── STATS ROW ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Best Streak', value: `${longestStreak}d`, emoji: '🏆', color: '#D97706' },
                { label: 'Total Picks', value: totalPicks.toString(), emoji: '🎯', color: '#FF3D9A' },
                { label: 'Days Played', value: totalDays.toString(), emoji: '📅', color: '#00B894' },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-3 text-center bg-white"
                  style={{ border: '1.5px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <p className="text-lg font-bold" style={{ fontFamily: "'Fredoka One', sans-serif", color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* ── HOW POINTS WORK ── */}
            <div
              className="rounded-2xl p-4 bg-white"
              style={{ border: '1.5px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <p className="text-sm font-bold mb-3 text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                How you earn points
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Play daily (5 picks)',  pts: '+5 pts/pick',       color: '#8B2BE2' },
                  { label: '3-day streak bonus',    pts: '1.25× multiplier',  color: '#F59E0B' },
                  { label: '7-day streak bonus',    pts: '1.5× multiplier',   color: '#FF3D9A' },
                  { label: 'Milestone unlocked',    pts: '+10–500 pts',       color: '#00B894' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {r.label}
                    </p>
                    <span className="text-xs font-bold" style={{ color: r.color, fontFamily: "'Fredoka One', sans-serif" }}>
                      {r.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── MILESTONES ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  Milestones
                </p>
                <span className="text-xs font-bold text-purple-600" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  {earnedMilestones}/{totalMilestones} earned
                </span>
              </div>

              {milestonesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {milestoneData
                    ?.slice()
                    .sort((a, b) => {
                      if (a.earned && !b.earned) return -1;
                      if (!a.earned && b.earned) return 1;
                      return 0;
                    })
                    .map((m, i) => (
                      <MilestoneCard key={m.id} m={m} idx={i} />
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
