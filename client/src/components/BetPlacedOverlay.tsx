// Swipestakes — Bet Placed Overlay
// Design: Brutalist Neon | Full-screen win confirmation with confetti burst

import { motion, AnimatePresence } from "framer-motion";
import { Check, TrendingUp } from "lucide-react";
import { useEffect } from "react";

interface BetPlacedOverlayProps {
  show: boolean;
  statement: string;
  payout: string;
  onDone: () => void;
}

export default function BetPlacedOverlay({ show, statement, payout, onDone }: BetPlacedOverlayProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 2000);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        >
          {/* Radial burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(200,255,0,0.4) 0%, transparent 70%)' }}
          />

          {/* Card */}
          <motion.div
            initial={{ scale: 0.5, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative text-center px-8 py-8 rounded-3xl mx-6"
            style={{
              background: '#111111',
              border: '1px solid rgba(200,255,0,0.3)',
              boxShadow: '0 0 40px rgba(200,255,0,0.2)',
            }}
          >
            {/* Check circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'rgba(0,255,136,0.15)',
                border: '2px solid #00FF88',
                boxShadow: '0 0 20px rgba(0,255,136,0.4)',
              }}
            >
              <Check size={28} style={{ color: '#00FF88' }} />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black mb-1"
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                color: '#C8FF00',
                textShadow: '0 0 20px rgba(200,255,0,0.6)',
              }}
            >
              BET PLACED
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm mb-4"
              style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Barlow, sans-serif' }}
            >
              {statement}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)' }}
            >
              <TrendingUp size={16} style={{ color: '#00FF88' }} />
              <span
                className="text-xl font-black"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', color: '#00FF88' }}
              >
                WIN {payout}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
