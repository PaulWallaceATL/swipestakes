// Swipestakes — WalletPage
// Light white theme | Credits balance | Transaction history | Redeem

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BuyPicksBanner } from "@/components/BuyPicksBanner";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const CREDIT_RULES = [
  { score: '5/5', credits: 25, emoji: '🏆', color: '#FF3D9A',  bg: '#FFF0F7', border: '#FFB3D9' },
  { score: '4/5', credits: 10, emoji: '🔥', color: '#FF6B35',  bg: '#FFF4F0', border: '#FFCBB3' },
  { score: '3/5', credits: 5,  emoji: '👍', color: '#00B894',  bg: '#F0FFF9', border: '#B3EDD9' },
  { score: 'Streak', credits: 0, emoji: '⚡', color: '#8B2BE2', bg: '#F5F0FF', border: '#C9B3F5' },
];

const GIFT_CATALOG = [
  { id: 'amazon',    name: 'Amazon',    value: '$50', credits: 250, emoji: '🛒', color: '#FF9900' },
  { id: 'starbucks', name: 'Starbucks', value: '$50', credits: 250, emoji: '☕', color: '#00704A' },
  { id: 'target',    name: 'Target',    value: '$50', credits: 250, emoji: '🎯', color: '#CC0000' },
  { id: 'nike',      name: 'Nike',      value: '$50', credits: 250, emoji: '👟', color: '#111111' },
  { id: 'netflix',   name: 'Netflix',   value: '$50', credits: 250, emoji: '🎬', color: '#E50914' },
  { id: 'visa',      name: 'Visa',      value: '$50', credits: 250, emoji: '💳', color: '#1A1F71' },
];

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'earn',   amount: 25,  label: 'Perfect Day — 5/5 picks correct', date: 'Mar 27', emoji: '🏆' },
  { id: 2, type: 'earn',   amount: 10,  label: 'Great Day — 4/5 picks correct',   date: 'Mar 26', emoji: '🔥' },
  { id: 3, type: 'redeem', amount: -50, label: 'Redeemed: Starbucks $5',           date: 'Mar 25', emoji: '☕' },
  { id: 4, type: 'earn',   amount: 5,   label: 'Good Day — 3/5 picks correct',    date: 'Mar 24', emoji: '👍' },
  { id: 5, type: 'earn',   amount: 10,  label: 'Great Day — 4/5 picks correct',   date: 'Mar 23', emoji: '🔥' },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'redeem'>('history');

  const { data: creditStatus } = trpc.credits.getStatus.useQuery(
    undefined,
    { enabled: !!user }
  ) as any;

  const redeemMutation = trpc.credits.redeem.useMutation({
    onSuccess: () => toast.success('Redemption submitted! Check your email.'),
    onError: (err: any) => toast.error(err.message ?? 'Redemption failed'),
  }) as any;

  const balance     = creditStatus?.balance     ?? (isAuthenticated ? 0 : 90);
  const totalEarned = creditStatus?.totalEarned ?? (isAuthenticated ? 0 : 150);
  const picksWon    = creditStatus?.picksWon    ?? (isAuthenticated ? 0 : 18);
  const streak      = creditStatus?.streak      ?? 3;

  const handleRedeem = (gift: typeof GIFT_CATALOG[0]) => {
    if (!isAuthenticated) { toast.error('Sign in to redeem credits!'); return; }
    if (balance < gift.credits) { toast.error(`Need ${gift.credits - balance} more credits`); return; }
    redeemMutation.mutate({ rewardId: gift.id, creditsSpent: gift.credits });
  };

  return (
    <div
      className="flex flex-col overflow-y-auto"
      style={{ height: 'calc(100dvh - 72px)', background: '#F5F5F7' }}
    >
      {/* ── BALANCE HERO ── */}
      <div
        className="px-5 pt-6 pb-6"
        style={{
          background: 'linear-gradient(135deg, #FF3D9A 0%, #8B2BE2 100%)',
        }}
      >
        <p className="text-white/70 text-xs font-semibold mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Your Credits · from PICK5 wins
        </p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-end gap-3 mb-5"
        >
          <span
            className="text-6xl font-black leading-none"
            style={{ fontFamily: "'Fredoka One', sans-serif", color: '#FFD700' }}
          >
            {balance}
          </span>
          <span className="text-white/70 text-base mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            credits
          </span>
        </motion.div>

        {/* Stats row */}
        <div className="flex gap-3">
          {[
            { label: 'Total Earned', value: totalEarned, emoji: '⭐' },
            { label: 'Picks Won',    value: picksWon,    emoji: '✅' },
            { label: 'Streak',       value: `${streak}d`, emoji: '🔥' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="flex-1 rounded-2xl p-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="text-lg mb-0.5">{stat.emoji}</div>
              <div className="font-black text-base leading-none text-white" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-[10px] mt-0.5 text-white/60" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── BUY PICKS ── */}
      <div className="px-5 pt-4 pb-2 bg-white">
        <BuyPicksBanner compact />
      </div>

      {/* ── HOW TO EARN ── */}
      <div className="px-5 py-4 bg-white">
        <h3 className="text-sm font-bold mb-3 text-gray-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          How to Earn Credits
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {CREDIT_RULES.map((rule) => (
            <div
              key={rule.score}
              className="rounded-2xl p-3 flex items-center gap-2"
              style={{ background: rule.bg, border: `1.5px solid ${rule.border}` }}
            >
              <div className="text-xl">{rule.emoji}</div>
              <div>
                <div className="text-xs font-bold" style={{ color: rule.color, fontFamily: "'Fredoka One', sans-serif" }}>
                  {rule.score === 'Streak' ? 'Daily streak' : `${rule.score} correct`}
                </div>
                <div className="text-[11px] font-bold text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {rule.credits > 0 ? `+${rule.credits} credits` : 'Bonus credits'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="px-5 pb-2 bg-white border-b border-gray-100">
        <div className="flex rounded-2xl p-1 bg-gray-100">
          {(['history', 'redeem'] as const).map((tab) => (
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
              {tab === 'history' ? '📋 History' : '🎁 Redeem'}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 px-5 pb-6 bg-white">
        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-2 pt-3"
            >
              {MOCK_TRANSACTIONS.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: '#FAFAFA',
                    border: `1px solid ${tx.type === 'earn' ? '#D1FAE5' : '#FCE7F3'}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: tx.type === 'earn' ? '#D1FAE5' : '#FCE7F3' }}
                  >
                    {tx.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {tx.label}
                    </p>
                    <p className="text-[11px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {tx.date}
                    </p>
                  </div>
                  <span
                    className="text-sm font-black flex-shrink-0"
                    style={{
                      fontFamily: "'Fredoka One', sans-serif",
                      color: tx.type === 'earn' ? '#00B894' : '#FF3D9A',
                    }}
                  >
                    {tx.type === 'earn' ? '+' : ''}{tx.amount} CR
                  </span>
                </motion.div>
              ))}

              {!isAuthenticated && (
                <div
                  className="rounded-2xl p-4 text-center mt-4"
                  style={{ background: '#FFF0F7', border: '1.5px dashed #FFB3D9' }}
                >
                  <p className="text-sm font-bold mb-2 text-pink-600" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                    Sign in to track your real credits
                  </p>
                  <a
                    href={getLoginUrl('/wallet')}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #FF3D9A, #8B2BE2)',
                      textDecoration: 'none',
                      fontFamily: "'Fredoka One', sans-serif",
                    }}
                  >
                    Sign in free <ChevronRight size={14} />
                  </a>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="redeem"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="pt-3"
            >
              <p className="text-xs mb-3 text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Redeem your credits for real gift cards and rewards
              </p>
              <div className="grid grid-cols-2 gap-2">
                {GIFT_CATALOG.map((gift, i) => {
                  const canAfford = balance >= gift.credits;
                  return (
                    <motion.button
                      key={gift.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRedeem(gift)}
                      className="rounded-2xl p-3 text-left"
                      style={{
                        background: canAfford ? '#FAFAFA' : '#F5F5F5',
                        border: `1.5px solid ${canAfford ? gift.color + '40' : '#E5E7EB'}`,
                        boxShadow: canAfford ? `0 4px 16px ${gift.color}20` : 'none',
                        opacity: canAfford ? 1 : 0.5,
                      }}
                    >
                      <div className="text-2xl mb-2">{gift.emoji}</div>
                      <div className="text-xs font-bold leading-tight mb-0.5 text-gray-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {gift.name}
                      </div>
                      <div className="text-base font-black" style={{ color: gift.color, fontFamily: "'Fredoka One', sans-serif" }}>
                        {gift.value}
                      </div>
                      <div
                        className="mt-2 px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                        style={{
                          background: canAfford ? `${gift.color}18` : '#F3F4F6',
                          color: canAfford ? gift.color : '#9CA3AF',
                          fontFamily: "'Fredoka One', sans-serif",
                        }}
                      >
                        <Coins size={9} />
                        {gift.credits} CR
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div
                className="mt-4 rounded-2xl p-4 flex items-center gap-3"
                style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}
              >
                <div className="text-2xl">💡</div>
                <div>
                  <p className="text-xs font-bold text-yellow-700" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                    More rewards coming soon
                  </p>
                  <p className="text-[11px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Venmo, PayPal, and more gift cards on the way
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
