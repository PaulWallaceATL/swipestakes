// Swipestakes — Bet Detail Sheet
// Design: Brutalist Neon | Bottom sheet with stats, AI reasoning, trends

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Bot, Share2, Bookmark, ExternalLink, Zap } from "lucide-react";
import { type Bet } from "@/lib/mockData";
import { toast } from "sonner";

const SOURCE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  kalshi: { label: 'KALSHI', color: '#00F5FF', bg: 'rgba(0,245,255,0.1)' },
  polymarket: { label: 'POLYMARKET', color: '#C8FF00', bg: 'rgba(200,255,0,0.1)' },
  Swipestakes: { label: 'SWIPESTAKES', color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
};

interface BetDetailSheetProps {
  bet: Bet | null;
  open: boolean;
  onClose: () => void;
  onBet?: (bet: Bet, stake: number) => void;
}

export default function BetDetailSheet({ bet, open, onClose, onBet }: BetDetailSheetProps) {
  const [selectedStake, setSelectedStake] = useState(50);
  if (!bet) return null;

  const sourceInfo = bet.source ? SOURCE_LABELS[bet.source] : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 z-50 rounded-t-3xl flex flex-col"
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.08)',
              maxWidth: 480,
              margin: '0 auto',
              bottom: 72, // sit above the 72px bottom nav
              maxHeight: 'calc(100dvh - 80px)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-3">
              <div className="flex-1 min-w-0 pr-3">
                {/* Source badge */}
                {sourceInfo && (
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                      style={{ background: sourceInfo.bg, border: `1px solid ${sourceInfo.color}30` }}
                    >
                      <Zap size={9} style={{ color: sourceInfo.color }} />
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: sourceInfo.color, fontFamily: 'JetBrains Mono, monospace' }}>
                        {sourceInfo.label}
                      </span>
                    </div>
                    {bet.sourceUrl && (
                      <a
                        href={bet.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[9px]"
                        style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}
                        onClick={e => e.stopPropagation()}
                      >
                        View source <ExternalLink size={8} />
                      </a>
                    )}
                  </div>
                )}
                <h3
                  className="text-2xl leading-tight"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, color: '#fff' }}
                >
                  {bet.statement}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Barlow, sans-serif' }}>
                  {bet.subtext}
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 px-5 py-3">
              {[
                { label: 'ODDS', value: bet.odds, color: '#C8FF00' },
                { label: 'CONFIDENCE', value: `${bet.confidence}%`, color: '#00F5FF' },
                { label: 'SPORT', value: bet.sport, color: '#fff' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* AI Narrative */}
            {bet.narrative && (
              <div className="mx-5 mb-3 p-4 rounded-xl" style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Bot size={14} style={{ color: '#C8FF00' }} />
                  <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#C8FF00', fontFamily: 'JetBrains Mono, monospace' }}>AI REASONING</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Barlow, sans-serif' }}>
                  {bet.narrative}
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="flex gap-2 px-5 pb-3 flex-wrap">
              {bet.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'JetBrains Mono, monospace',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Stake selector */}
            <div className="px-5 pb-3">
              <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>STAKE</p>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStake(s)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      background: selectedStake === s ? '#C8FF00' : 'rgba(255,255,255,0.05)',
                      color: selectedStake === s ? '#0A0A0A' : 'rgba(255,255,255,0.5)',
                      border: selectedStake === s ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: selectedStake === s ? '0 0 10px rgba(200,255,0,0.3)' : 'none',
                    }}
                  >
                    ${s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>
                To win: <span style={{ color: '#00FF88' }}>
                  ${bet.oddsNumeric > 0
                    ? (selectedStake * bet.oddsNumeric / 100).toFixed(2)
                    : (selectedStake * 100 / Math.abs(bet.oddsNumeric)).toFixed(2)}
                </span>
              </p>
            </div>

            </div>{/* end scrollable body */}

            {/* Actions — pinned to bottom, outside scroll */}
            <div className="flex gap-3 px-5 pt-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#111111' }}>
              <button
                onClick={() => { toast('Saved!', { icon: '🔖' }); onClose(); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl flex-1 justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow, sans-serif', fontWeight: 600 }}
              >
                <Bookmark size={16} />
                Save
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${bet.statement} @ ${bet.odds} — via Swipestakes`).catch(() => {});
                  toast('Copied to clipboard!', { icon: '📤' });
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl flex-1 justify-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Barlow, sans-serif', fontWeight: 600 }}
              >
                <Share2 size={16} />
                Share
              </button>
              <button
                onClick={() => {
                  if (onBet) onBet(bet, selectedStake);
                  else toast.success(`Bet placed! $${selectedStake} on ${bet.statement}`, { icon: '🔥' });
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl flex-2 justify-center font-bold"
                style={{
                  background: '#C8FF00',
                  color: '#0A0A0A',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 18,
                  flex: 2,
                  boxShadow: '0 0 20px rgba(200,255,0,0.3)',
                }}
              >
                <TrendingUp size={18} />
                BET ${selectedStake}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
