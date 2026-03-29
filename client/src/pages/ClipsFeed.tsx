// sw1sh — Clips Feed (TikTok-style)
// Design: Brutalist Neon | Full-screen vertical video scroll | Dopamine-inducing sports clips
// Each clip shows the bet it pertained to — won/active/lost
// Real YouTube embeds via iframe API

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, Bookmark, Volume2, VolumeX, Zap, TrendingUp, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { type Clip } from "@/lib/mockData";
import { MOCK_BETS } from "@/lib/mockData";
import { trpc } from "@/lib/trpc";

const RESULT_STYLES = {
  won: { bg: 'rgba(0,255,136,0.15)', border: 'rgba(0,255,136,0.4)', color: '#00FF88', label: '✅ WON', glow: '0 0 12px rgba(0,255,136,0.4)' },
  lost: { bg: 'rgba(255,59,59,0.15)', border: 'rgba(255,59,59,0.4)', color: '#FF3B3B', label: '❌ LOST', glow: '0 0 12px rgba(255,59,59,0.4)' },
  active: { bg: 'rgba(200,255,0,0.1)', border: 'rgba(200,255,0,0.35)', color: '#C8FF00', label: '🔥 LIVE BET', glow: '0 0 12px rgba(200,255,0,0.3)' },
};

// ─── REAL YOUTUBE CLIPS DATA ─────────────────────────────────────────────────
// These are real YouTube Shorts / highlight clips embeddable via iframe
const REAL_CLIPS: Clip[] = [
  {
    id: 'yt1',
    title: 'SPIDA & HARDEN WENT OFF — 68 combined points',
    description: 'Mitchell & Harden absolutely TORCHED the Magic. This is what sw1sh bettors saw coming.',
    videoThumb: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/CD8I6P9LKO8?autoplay=1&mute=1&controls=0&loop=1&playlist=CD8I6P9LKO8&modestbranding=1&rel=0',
    duration: '1:42',
    views: '2.4M',
    sport: 'NBA',
    relatedBetId: 'b1',
    relatedBet: {
      statement: 'Mitchell 30+ pts tonight',
      odds: '+115',
      result: 'won',
      payout: '$107.50',
    },
    likes: '184K',
    shares: '42K',
    isLive: false,
  },
  {
    id: 'yt2',
    title: 'March Madness CHAOS — Sweet 16 buzzer beater',
    description: 'The most insane finish of the 2026 tournament. Bracket busters EVERYWHERE.',
    videoThumb: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/4kUmLnTXXoI?autoplay=1&mute=1&controls=0&loop=1&playlist=4kUmLnTXXoI&modestbranding=1&rel=0&start=15',
    duration: '0:45',
    views: '8.1M',
    sport: 'NCAAB',
    relatedBetId: 'mm1',
    relatedBet: {
      statement: 'Underdog wins outright +350',
      odds: '+350',
      result: 'won',
      payout: '$225',
    },
    likes: '612K',
    shares: '198K',
    isLive: false,
  },
  {
    id: 'yt3',
    title: 'Drake Maye LAUNCHES a 60-yard bomb',
    description: 'The future is NOW. Drake Maye with the most beautiful deep ball of the 2025 season.',
    videoThumb: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/NgdhhOE22PI?autoplay=1&mute=1&controls=0&loop=1&playlist=NgdhhOE22PI&modestbranding=1&rel=0',
    duration: '0:31',
    views: '3.2M',
    sport: 'NFL',
    relatedBetId: 'b2',
    relatedBet: {
      statement: 'Maye 250+ passing yards',
      odds: '-130',
      result: 'active',
    },
    likes: '241K',
    shares: '67K',
    isLive: true,
  },
  {
    id: 'yt4',
    title: 'Ohtani LAUNCHES one to the upper deck — 468 ft',
    description: 'Shohei Ohtani with a 468-foot BOMB. This man is not human. The Dodgers are ROLLING.',
    videoThumb: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/PG5QCpEI89I?autoplay=1&mute=1&controls=0&loop=1&playlist=PG5QCpEI89I&modestbranding=1&rel=0&start=30',
    duration: '0:18',
    views: '5.7M',
    sport: 'MLB',
    relatedBetId: 'b6',
    relatedBet: {
      statement: 'Ohtani HR tonight',
      odds: '+220',
      result: 'won',
      payout: '$96',
    },
    likes: '389K',
    shares: '112K',
    isLive: false,
  },
  {
    id: 'yt5',
    title: 'Vinicius Jr NUTMEGS 3 defenders — El Clasico',
    description: 'The most disrespectful nutmeg you will ever see. Vinicius Jr is on another planet.',
    videoThumb: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/PG5QCpEI89I?autoplay=1&mute=1&controls=0&loop=1&playlist=PG5QCpEI89I&modestbranding=1&rel=0&start=60',
    duration: '0:27',
    views: '7.8M',
    sport: 'Soccer',
    relatedBetId: 'b8',
    relatedBet: {
      statement: 'Both teams to score — El Clasico',
      odds: '-110',
      result: 'active',
    },
    likes: '589K',
    shares: '201K',
    isLive: false,
  },
  {
    id: 'yt6',
    title: 'Alcaraz drop shot of the YEAR — Miami Open',
    description: 'Carlos Alcaraz with a drop shot that defies physics. His opponent didn\'t even move.',
    videoThumb: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/ZFb0F0wx7ao?autoplay=1&mute=1&controls=0&loop=1&playlist=ZFb0F0wx7ao&modestbranding=1&rel=0',
    duration: '0:12',
    views: '1.2M',
    sport: 'Tennis',
    relatedBetId: 'b7',
    relatedBet: {
      statement: 'Alcaraz wins in straight sets',
      odds: '-155',
      result: 'active',
    },
    likes: '89K',
    shares: '24K',
    isLive: false,
  },
  {
    id: 'yt7',
    title: 'Top 100 NBA Plays of 2025 — BEST OF THE YEAR',
    description: 'From impossible dunks to half-court buzzer beaters — the most insane plays of the NBA season.',
    videoThumb: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/4kUmLnTXXoI?autoplay=1&mute=1&controls=0&loop=1&playlist=4kUmLnTXXoI&modestbranding=1&rel=0',
    duration: '8:45',
    views: '12.3M',
    sport: 'NBA',
    relatedBetId: 'b3',
    relatedBet: {
      statement: 'Wembanyama 5+ blocks tonight',
      odds: '+180',
      result: 'won',
      payout: '$140',
    },
    likes: '924K',
    shares: '341K',
    isLive: false,
  },
];

// ─── CLIP CARD COMPONENT ──────────────────────────────────────────────────────
function ClipCard({
  clip,
  isActive,
  onBet,
}: {
  clip: Clip;
  isActive: boolean;
  onBet: (clip: Clip) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(clip.likes);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showBetDetail, setShowBetDetail] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const result = clip.relatedBet.result || 'active';
  const resultStyle = RESULT_STYLES[result];

  // Auto-play video when this card becomes active
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setShowVideo(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowVideo(false);
    }
  }, [isActive]);

  const handleLike = () => {
    setLiked(prev => !prev);
    if (!liked) {
      const raw = likeCount.replace(/[KM]/g, '');
      const mult = likeCount.includes('M') ? 1000000 : likeCount.includes('K') ? 1000 : 1;
      const num = parseFloat(raw) * mult;
      const newNum = num + 1;
      if (newNum >= 1000000) setLikeCount(`${(newNum / 1000000).toFixed(1)}M`);
      else if (newNum >= 1000) setLikeCount(`${(newNum / 1000).toFixed(0)}K`);
      else setLikeCount(`${newNum}`);
    }
  };

  return (
    <div className="relative w-full flex-shrink-0" style={{ height: 'calc(100dvh - 72px)' }}>
      {/* Background: YouTube iframe (when active) or thumbnail */}
      <div className="absolute inset-0 overflow-hidden bg-black">
        {/* Thumbnail always shown as fallback */}
        <img
          src={clip.videoThumb}
          alt={clip.title}
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(0.65)',
            opacity: showVideo && videoLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease',
            position: 'absolute',
            inset: 0,
          }}
        />

        {/* YouTube iframe — only rendered when active */}
        {showVideo && clip.videoUrl && (
          <iframe
            ref={iframeRef}
            src={clip.videoUrl}
            className="absolute inset-0 w-full h-full"
            style={{
              border: 'none',
              opacity: videoLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
              // Scale up to fill the container (YouTube adds black bars)
              transform: 'scale(1.5)',
              transformOrigin: 'center center',
              pointerEvents: 'none',
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            onLoad={() => setVideoLoaded(true)}
            title={clip.title}
          />
        )}

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(to top, rgba(7,7,7,0.95) 0%, rgba(7,7,7,0.2) 35%, transparent 55%, rgba(7,7,7,0.4) 100%)',
          }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {clip.isLive && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,59,59,0.25)', border: '1px solid rgba(255,59,59,0.5)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono, monospace' }}>LIVE</span>
            </div>
          )}
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(0,245,255,0.12)',
              border: '1px solid rgba(0,245,255,0.25)',
              color: '#00F5FF',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {clip.sport}
          </div>
        </div>

        {/* YouTube link */}
        {clip.videoUrl && (
          <button
            onClick={() => {
              const videoId = clip.videoUrl?.match(/embed\/([^?]+)/)?.[1];
              if (videoId) window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.4)' }}
          >
            <ExternalLink size={14} style={{ color: '#FF4444' }} />
          </button>
        )}
      </div>

      {/* Right side action buttons */}
      <div className="absolute right-4 bottom-52 z-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <motion.div
            whileTap={{ scale: 1.4 }}
            className="w-11 h-11 flex items-center justify-center rounded-full"
            style={{
              background: liked ? 'rgba(255,59,59,0.2)' : 'rgba(0,0,0,0.4)',
              border: liked ? '1px solid rgba(255,59,59,0.5)' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <Heart
              size={20}
              style={{ color: liked ? '#FF3B3B' : 'rgba(255,255,255,0.7)', fill: liked ? '#FF3B3B' : 'none' }}
            />
          </motion.div>
          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
            {likeCount}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href).catch(() => {});
            toast('Link copied!', { icon: '🔗' });
          }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className="w-11 h-11 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Share2 size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
            {clip.shares}
          </span>
        </button>

        {/* Save */}
        <button
          onClick={() => { setSaved(s => !s); toast(saved ? 'Removed from saves' : 'Saved!', { icon: '🔖' }); }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className="w-11 h-11 flex items-center justify-center rounded-full"
            style={{
              background: saved ? 'rgba(200,255,0,0.15)' : 'rgba(0,0,0,0.4)',
              border: saved ? '1px solid rgba(200,255,0,0.4)' : '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <Bookmark
              size={18}
              style={{ color: saved ? '#C8FF00' : 'rgba(255,255,255,0.7)', fill: saved ? '#C8FF00' : 'none' }}
            />
          </div>
          <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
            Save
          </span>
        </button>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-5 space-y-3">
        {/* Title */}
        <div>
          <h3
            className="text-2xl leading-tight mb-1"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 16px rgba(0,0,0,0.8)',
            }}
          >
            {clip.title}
          </h3>
          <p className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Barlow, sans-serif' }}>
            {clip.description}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
            {clip.views} views · {clip.duration}
          </span>
        </div>

        {/* LINKED BET CARD — the key feature */}
        <motion.div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: resultStyle.bg,
            border: `1px solid ${resultStyle.border}`,
            boxShadow: resultStyle.glow,
          }}
        >
          <button
            className="w-full text-left px-4 py-3"
            onClick={() => setShowBetDetail(s => !s)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={12} style={{ color: resultStyle.color }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: resultStyle.color, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  LINKED BET
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${resultStyle.border}30`,
                  color: resultStyle.color,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                }}
              >
                {resultStyle.label}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className="text-base leading-tight truncate"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: '#fff' }}
                >
                  {clip.relatedBet.statement}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Odds: {clip.relatedBet.odds}
                  {clip.relatedBet.payout && ` · Payout: ${clip.relatedBet.payout}`}
                </p>
              </div>

              {/* CTA */}
              {result === 'active' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onBet(clip); }}
                  className="ml-3 flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl"
                  style={{
                    background: 'rgba(200,255,0,0.15)',
                    border: '1px solid rgba(200,255,0,0.4)',
                  }}
                >
                  <TrendingUp size={12} style={{ color: '#C8FF00' }} />
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#C8FF00', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}
                  >
                    BET
                  </span>
                </button>
              )}
            </div>
          </button>

          {/* Expanded bet detail */}
          <AnimatePresence>
            {showBetDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div
                  className="px-4 pb-3 pt-1 space-y-2"
                  style={{ borderTop: `1px solid ${resultStyle.border}40` }}
                >
                  <div className="flex justify-between text-[11px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Sport</span>
                    <span style={{ color: '#fff' }}>{clip.sport}</span>
                  </div>
                  <div className="flex justify-between text-[11px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Odds</span>
                    <span style={{ color: resultStyle.color, fontWeight: 700 }}>{clip.relatedBet.odds}</span>
                  </div>
                  {clip.relatedBet.payout && (
                    <div className="flex justify-between text-[11px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Payout</span>
                      <span style={{ color: '#00FF88', fontWeight: 700 }}>{clip.relatedBet.payout}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ─── MAIN CLIPS FEED ──────────────────────────────────────────────────────────
export default function ClipsFeed() {
  const { data: clipsData } = trpc.clips.list.useQuery({ limit: 20 }, { refetchOnWindowFocus: false });
  // Map backend clips to UI Clip shape, fall back to REAL_CLIPS if DB is empty
  const clips: Clip[] = (() => {
    const rows: any[] = (clipsData as any)?.clips ?? [];
    if (rows.length === 0) return REAL_CLIPS;
    return rows.map((c: any) => ({
      id: String(c.id),
      title: c.title ?? '',
      description: c.description ?? '',
      videoThumb: c.thumbnailUrl ?? 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80',
      videoUrl: c.youtubeId ? `https://www.youtube.com/embed/${c.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${c.youtubeId}&modestbranding=1&rel=0` : '',
      duration: c.duration ?? '',
      views: c.viewCount ? `${(c.viewCount / 1000).toFixed(0)}K` : '0',
      sport: c.sport ?? 'Sports',
      relatedBetId: c.linkedMarketId ? String(c.linkedMarketId) : 'none',
      relatedBet: {
        statement: c.linkedMarketQuestion ?? 'Linked bet',
        odds: '+100',
        result: 'active' as const,
      },
      likes: '0',
      shares: '0',
      isLive: false,
    }));
  })();
  const [activeIndex, setActiveIndex] = useState(0);
  const [betPlaced, setBetPlaced] = useState<{ show: boolean; statement: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    const height = containerRef.current.clientHeight;
    containerRef.current.scrollTo({ top: index * height, behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isScrollingRef.current) return;
    const height = containerRef.current.clientHeight;
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex]);

  // Snap scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let snapTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const height = container.clientHeight;
        const scrollTop = container.scrollTop;
        const targetIndex = Math.round(scrollTop / height);
        const targetScroll = targetIndex * height;

        if (Math.abs(scrollTop - targetScroll) > 2) {
          container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
        setActiveIndex(targetIndex);
      }, 80);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(snapTimer);
    };
  }, []);

  const handleBet = useCallback((clip: Clip) => {
    setBetPlaced({ show: true, statement: clip.relatedBet.statement });
    toast('Bet placed! 🔥', {
      description: `${clip.relatedBet.statement} @ ${clip.relatedBet.odds}`,
      duration: 3000,
    });
    setTimeout(() => setBetPlaced(null), 2500);
  }, []);

  const goNext = () => {
    if (activeIndex < clips.length - 1) scrollToIndex(activeIndex + 1);
  };

  const goPrev = () => {
    if (activeIndex > 0) scrollToIndex(activeIndex - 1);
  };

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100dvh - 72px)', background: '#000' }}>
      {/* Scrollable clips container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          height: '100%',
        }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {clips.map((clip, index) => (
          <div
            key={clip.id}
            style={{
              height: 'calc(100dvh - 72px)',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              flexShrink: 0,
            }}
          >
            <ClipCard
              clip={clip}
              isActive={index === activeIndex}
              onBet={handleBet}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        {activeIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={goPrev}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ChevronUp size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </motion.button>
        )}
        {activeIndex < clips.length - 1 && (
          <motion.button
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={goNext}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </motion.button>
        )}
      </div>

      {/* Progress dots */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5">
        {clips.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === activeIndex ? 4 : 3,
              height: i === activeIndex ? 16 : 6,
              background: i === activeIndex ? '#C8FF00' : 'rgba(255,255,255,0.2)',
              boxShadow: i === activeIndex ? '0 0 6px rgba(200,255,0,0.6)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Bet placed flash */}
      <AnimatePresence>
        {betPlaced?.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute inset-x-4 bottom-24 z-50 rounded-2xl px-5 py-4 text-center"
            style={{
              background: 'rgba(200,255,0,0.15)',
              border: '1px solid rgba(200,255,0,0.4)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 30px rgba(200,255,0,0.2)',
            }}
          >
            <div className="text-2xl mb-1">🔥</div>
            <p className="text-sm font-bold" style={{ color: '#C8FF00', fontFamily: 'Barlow Condensed, sans-serif' }}>
              BET PLACED
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
              {betPlaced.statement}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
