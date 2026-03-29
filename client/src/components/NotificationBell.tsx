// Swipestakes — NotificationBell
// Light theme | White background | Dark text | Pink accents

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, TrendingUp, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const ICON_MAP = {
  market_move: TrendingUp,
  bet_settled: CheckCircle2,
  market_open: Zap,
  system: AlertCircle,
};

const COLOR_MAP = {
  market_move: "#8B2BE2",
  bet_settled: "#00B894",
  market_open: "#FF3D9A",
  system: "#F59E0B",
};

function timeAgo(date: Date | string): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const DEMO_NOTIFICATIONS = [
  {
    id: -1,
    type: "bet_settled" as const,
    title: "Yesterday's results are in! 🎯",
    body: "You got 4/5 correct — great job!",
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 1000),
    userId: 0,
    marketId: null,
    positionId: null,
  },
  {
    id: -2,
    type: "market_open" as const,
    title: "3-day streak! 🔥",
    body: "Keep it up to earn bonus loyalty points.",
    read: false,
    createdAt: new Date(Date.now() - 22 * 60 * 1000),
    userId: 0,
    marketId: null,
    positionId: null,
  },
  {
    id: -3,
    type: "system" as const,
    title: "New prizes available!",
    body: "Amazon gift cards just added to the prize store.",
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    userId: 0,
    marketId: null,
    positionId: null,
  },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: serverNotifs = [], isLoading } = trpc.notifications.list.useQuery(
    { limit: 20 },
    { enabled: !!user, refetchOnWindowFocus: true, refetchInterval: 60_000 }
  );

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const dismiss = trpc.notifications.dismiss.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const notifications = user
    ? serverNotifs.filter(n => !dismissedIds.has(n.id))
    : DEMO_NOTIFICATIONS.filter(n => !dismissedIds.has(n.id));

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0 && user) {
      markAllRead.mutate();
    }
  };

  const handleDismiss = (id: number) => {
    if (id < 0) {
      setDismissedIds(prev => { const s = new Set(prev); s.add(id); return s; });
    } else {
      dismiss.mutate({ id });
    }
  };

  const handleClearAll = () => {
    if (user) {
      notifications.forEach(n => { if (n.id > 0) dismiss.mutate({ id: n.id }); });
    }
    const allIds = notifications.map(n => n.id);
    setDismissedIds(prev => { const s = new Set(prev); allIds.forEach(id => s.add(id)); return s; });
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all"
        style={{
          background: open ? '#FFF0F7' : '#F5F5F7',
          border: open ? '1.5px solid #FFB3D9' : '1.5px solid #EBEBEB',
        }}
      >
        <Bell size={17} style={{ color: open ? '#FF3D9A' : '#9CA3AF' }} />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: '#FF3D9A', fontFamily: "'Fredoka One', sans-serif" }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 w-80 rounded-2xl overflow-hidden z-50"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #F3F4F6',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #F3F4F6' }}
            >
              <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                Notifications
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-bold"
                  style={{ color: '#FF3D9A', fontFamily: 'Nunito, sans-serif' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Bell size={24} className="text-gray-200" />
                  <span className="text-xs text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    No notifications
                  </span>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_MAP[n.type] ?? AlertCircle;
                  const color = COLOR_MAP[n.type] ?? '#9CA3AF';
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 transition-all"
                      style={{
                        borderBottom: '1px solid #F9FAFB',
                        background: n.read ? '#FFFFFF' : '#FFF8FC',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-bold leading-tight mb-0.5"
                          style={{ color: n.read ? '#6B7280' : '#1F2937', fontFamily: 'Nunito, sans-serif' }}
                        >
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[11px] text-gray-400 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-300 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismiss(n.id)}
                        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 transition-colors"
                      >
                        <X size={11} />
                      </button>
                      {!n.read && (
                        <div
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                          style={{ background: '#FF3D9A' }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

