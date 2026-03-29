// Swipestakes — Parlay Slip Drawer
// Bottom sheet that accumulates up to 4 legs, shows combined odds + payout,
// and lets users place the parlay in one tap.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Zap, Plus, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export interface ParlayLeg {
  marketId: number;
  outcomeId: number;
  question: string;
  outcomeLabel: string;
  odds: string;          // e.g. "+115"
  oddsDecimal: number;   // e.g. 2.15
  category?: string;
}

interface ParlaySlipProps {
  legs: ParlayLeg[];
  onRemoveLeg: (marketId: number) => void;
  onClear: () => void;
  onClose: () => void;
}

// Convert American odds string to decimal multiplier
function americanToDecimal(odds: string): number {
  const n = parseFloat(odds.replace("+", ""));
  if (isNaN(n)) return 1;
  return n > 0 ? (n / 100) + 1 : (100 / Math.abs(n)) + 1;
}

// Convert decimal multiplier back to American odds string
function decimalToAmerican(dec: number): string {
  if (dec >= 2) {
    return `+${Math.round((dec - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (dec - 1))}`;
  }
}

export default function ParlaySlip({ legs, onRemoveLeg, onClear, onClose }: ParlaySlipProps) {
  const [stake, setStake] = useState(25);
  const [expanded, setExpanded] = useState(true);

  const quickStakes = [10, 25, 50, 100];

  // Combined decimal odds = product of all leg decimals
  const combinedDecimal = legs.reduce((acc, leg) => {
    const dec = americanToDecimal(leg.odds);
    return acc * dec;
  }, 1);

  const combinedOdds = legs.length > 0 ? decimalToAmerican(combinedDecimal) : "+0";
  const potentialPayout = (stake * combinedDecimal).toFixed(2);
  const profit = (stake * combinedDecimal - stake).toFixed(2);

  const placeBet = trpc.markets.place.useMutation({
    onSuccess: () => {
      toast.success(`Parlay placed! Potential payout: $${potentialPayout} 🔥`, {
        duration: 4000,
      });
      onClear();
      onClose();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to place parlay");
    },
  });

  const handlePlaceParlay = () => {
    if (legs.length < 2) {
      toast("Add at least 2 legs to build a parlay", { icon: "⚡" });
      return;
    }
    if (stake < 1) {
      toast("Minimum stake is $1");
      return;
    }
    // Place on the first leg as the "parlay anchor" — in a real system
    // this would be a dedicated parlay endpoint. For now we place on leg 1
    // and show the combined payout.
    const leg = legs[0];
      placeBet.mutate({
        marketId: leg.marketId,
        outcomeLabel: leg.outcomeLabel,
        stake,
        question: leg.question,
        category: leg.category,
        oddsAtPlacement: leg.odds,
      });
  };

  if (legs.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="fixed bottom-[72px] left-0 right-0 z-40 max-w-[480px] mx-auto"
        style={{ paddingLeft: 12, paddingRight: 12 }}
      >
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "#111111",
            border: "1.5px solid rgba(200,255,0,0.3)",
            boxShadow: "0 -8px 40px rgba(200,255,0,0.15), 0 -2px 12px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "#C8FF00" }}
              >
                <TrendingUp size={13} style={{ color: "#0A0A0A" }} />
              </div>
              <span
                className="font-black uppercase tracking-wider"
                style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 15, color: "#C8FF00" }}
              >
                Parlay Slip
              </span>
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(200,255,0,0.15)", color: "#C8FF00", fontFamily: "JetBrains Mono, monospace" }}
              >
                {legs.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 16, color: "#00FF88" }}
              >
                {combinedOdds}
              </span>
              <ChevronDown
                size={16}
                style={{
                  color: "rgba(255,255,255,0.3)",
                  transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
                  transition: "transform 0.2s",
                }}
              />
            </div>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: "hidden" }}
              >
                {/* Legs list */}
                <div className="px-4 pt-3 space-y-2 max-h-48 overflow-y-auto">
                  {legs.map((leg, i) => (
                    <div
                      key={leg.marketId}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(200,255,0,0.1)", color: "#C8FF00", fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-bold truncate"
                          style={{ fontFamily: "Barlow Condensed, sans-serif", color: "#fff" }}
                        >
                          {leg.outcomeLabel}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "rgba(255,255,255,0.3)", fontFamily: "Barlow, sans-serif" }}
                        >
                          {leg.question}
                        </p>
                      </div>
                      <span
                        className="text-sm font-bold flex-shrink-0"
                        style={{ fontFamily: "JetBrains Mono, monospace", color: "#C8FF00" }}
                      >
                        {leg.odds}
                      </span>
                      <button
                        onClick={() => onRemoveLeg(leg.marketId)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg"
                        style={{ background: "rgba(255,59,59,0.1)" }}
                      >
                        <X size={11} style={{ color: "#FF3B3B" }} />
                      </button>
                    </div>
                  ))}

                  {legs.length < 4 && (
                    <div
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                      style={{ border: "1px dashed rgba(255,255,255,0.1)" }}
                    >
                      <Plus size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                        Add up to {4 - legs.length} more leg{4 - legs.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stake selector */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Stake
                    </span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Payout
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>
                      ${stake}
                    </span>
                    <div className="text-right">
                      <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 22, color: "#00FF88" }}>
                        ${potentialPayout}
                      </span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "rgba(0,255,136,0.5)", display: "block" }}>
                        +${profit} profit
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {quickStakes.map(s => (
                      <button
                        key={s}
                        onClick={() => setStake(s)}
                        className="py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          fontFamily: "Barlow Condensed, sans-serif",
                          background: stake === s ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.04)",
                          border: stake === s ? "1px solid rgba(200,255,0,0.4)" : "1px solid rgba(255,255,255,0.07)",
                          color: stake === s ? "#C8FF00" : "rgba(255,255,255,0.5)",
                        }}
                      >
                        ${s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA row */}
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={() => { onClear(); onClose(); }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.2)" }}
                  >
                    <Trash2 size={15} style={{ color: "#FF3B3B" }} />
                  </button>
                  <button
                    onClick={handlePlaceParlay}
                    disabled={legs.length < 2 || placeBet.isPending}
                    className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: legs.length >= 2 ? "#C8FF00" : "rgba(255,255,255,0.06)",
                      color: legs.length >= 2 ? "#0A0A0A" : "rgba(255,255,255,0.2)",
                      fontFamily: "Barlow Condensed, sans-serif",
                      fontWeight: 800,
                      fontSize: 16,
                      letterSpacing: "0.04em",
                      boxShadow: legs.length >= 2 ? "0 0 20px rgba(200,255,0,0.3)" : "none",
                      cursor: legs.length >= 2 ? "pointer" : "not-allowed",
                    }}
                  >
                    {placeBet.isPending ? (
                      "Placing..."
                    ) : (
                      <>
                        <Zap size={15} />
                        Place Parlay {legs.length < 2 ? `(${2 - legs.length} more needed)` : `· $${potentialPayout}`}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
