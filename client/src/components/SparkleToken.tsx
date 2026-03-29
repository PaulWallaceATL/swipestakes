import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  angle: number;
  distance: number;
  shape: 'star' | 'dot' | 'diamond';
}

interface SparkleTokenProps {
  value: string | number;
  icon?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'pink' | 'teal' | 'purple';
  burst?: boolean;          // trigger a one-shot glitter burst
  continuous?: boolean;     // keep particles orbiting continuously
  className?: string;
  onClick?: () => void;
}

// ─── Particle colors per variant ─────────────────────────────────────────────
const VARIANT_COLORS = {
  gold:   ['#FFD700', '#FFF176', '#FFAB00', '#FFF9C4', '#FF8C00', '#FFFDE7'],
  pink:   ['#FF3D9A', '#FF80CB', '#FF1744', '#F8BBD0', '#FF6EC7', '#FFCDD2'],
  teal:   ['#00E5FF', '#80DEEA', '#00BCD4', '#B2EBF2', '#18FFFF', '#E0F7FA'],
  purple: ['#B388FF', '#7C4DFF', '#CE93D8', '#E040FB', '#D500F9', '#F3E5F5'],
};

const VARIANT_GRADIENT = {
  gold:   'linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FFD700 100%)',
  pink:   'linear-gradient(135deg, #FF3D9A 0%, #FF6EC7 50%, #FF1744 100%)',
  teal:   'linear-gradient(135deg, #00E5FF 0%, #00BCD4 50%, #18FFFF 100%)',
  purple: 'linear-gradient(135deg, #7C4DFF 0%, #E040FB 50%, #B388FF 100%)',
};

const VARIANT_SHADOW = {
  gold:   '0 4px 20px rgba(255,215,0,0.7), 0 0 40px rgba(255,215,0,0.3), 0 0 0 2px rgba(255,215,0,0.4)',
  pink:   '0 4px 20px rgba(255,61,154,0.7), 0 0 40px rgba(255,61,154,0.3), 0 0 0 2px rgba(255,61,154,0.4)',
  teal:   '0 4px 20px rgba(0,229,255,0.7), 0 0 40px rgba(0,229,255,0.3), 0 0 0 2px rgba(0,229,255,0.4)',
  purple: '0 4px 20px rgba(124,77,255,0.7), 0 0 40px rgba(124,77,255,0.3), 0 0 0 2px rgba(124,77,255,0.4)',
};

const SIZE_CONFIG = {
  sm:  { px: 'px-2.5 py-1',   text: 'text-xs',  iconSize: 10, particles: 6  },
  md:  { px: 'px-3 py-1.5',   text: 'text-sm',  iconSize: 13, particles: 8  },
  lg:  { px: 'px-4 py-2',     text: 'text-base', iconSize: 16, particles: 10 },
  xl:  { px: 'px-5 py-2.5',   text: 'text-xl',  iconSize: 20, particles: 14 },
};

// ─── Star SVG shape ───────────────────────────────────────────────────────────
function StarShape({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function DiamondShape({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <polygon points="12,2 22,12 12,22 2,12" />
    </svg>
  );
}

// ─── Generate particles ───────────────────────────────────────────────────────
function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 120,
    y: (Math.random() - 0.5) * 80,
    size: 4 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 2,
    angle: (360 / count) * i + Math.random() * 30,
    distance: 20 + Math.random() * 40,
    shape: (['star', 'dot', 'diamond'] as const)[Math.floor(Math.random() * 3)],
  }));
}

// ─── Single floating particle ─────────────────────────────────────────────────
function FloatingParticle({ p, burst }: { p: Particle; burst: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%)`,
        pointerEvents: 'none',
        zIndex: 10,
        animation: burst
          ? `sparkle-burst-${p.id % 8} ${p.duration}s ${p.delay}s ease-out forwards`
          : `sparkle-orbit ${p.duration}s ${p.delay}s ease-in-out infinite`,
        '--angle': `${p.angle}deg`,
        '--distance': `${p.distance}px`,
        '--tx': `${p.x}px`,
        '--ty': `${p.y}px`,
      } as React.CSSProperties}
    >
      {p.shape === 'star' && <StarShape size={p.size} color={p.color} />}
      {p.shape === 'diamond' && <DiamondShape size={p.size} color={p.color} />}
      {p.shape === 'dot' && (
        <div
          style={{
            width: p.size * 0.6,
            height: p.size * 0.6,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
        />
      )}
    </div>
  );
}

// ─── Main SparkleToken component ──────────────────────────────────────────────
export function SparkleToken({
  value,
  icon = '🪙',
  size = 'md',
  variant = 'gold',
  burst = false,
  continuous = true,
  className = '',
  onClick,
}: SparkleTokenProps) {
  const colors = VARIANT_COLORS[variant];
  const cfg = SIZE_CONFIG[size];
  const [particles] = useState(() => generateParticles(cfg.particles, colors));
  const [showBurst, setShowBurst] = useState(false);
  const prevBurst = useRef(false);

  // Trigger burst when burst prop flips to true
  useEffect(() => {
    if (burst && !prevBurst.current) {
      setShowBurst(true);
      const t = setTimeout(() => setShowBurst(false), 2500);
      prevBurst.current = true;
      return () => clearTimeout(t);
    }
    if (!burst) prevBurst.current = false;
  }, [burst]);

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 rounded-full font-bold select-none ${cfg.px} ${cfg.text} ${className}`}
      style={{
        background: VARIANT_GRADIENT[variant],
        color: variant === 'teal' ? '#003040' : variant === 'gold' ? '#3D2800' : '#fff',
        boxShadow: VARIANT_SHADOW[variant],
        fontFamily: "'Fredoka One', sans-serif",
        letterSpacing: '0.04em',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'visible',
      }}
      onClick={onClick}
    >
      {/* Shimmer sweep overlay */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'token-shimmer 2.5s ease-in-out infinite',
        }}
      />

      {/* Continuous orbiting particles */}
      {continuous && particles.map(p => (
        <FloatingParticle key={p.id} p={p} burst={false} />
      ))}

      {/* Burst particles */}
      {showBurst && generateParticles(cfg.particles * 2, colors).map(p => (
        <FloatingParticle key={`burst-${p.id}`} p={p} burst={true} />
      ))}

      {/* Content */}
      <span style={{ position: 'relative', zIndex: 1, fontSize: cfg.iconSize }}>{icon}</span>
      <span style={{ position: 'relative', zIndex: 1 }}>{value}</span>
    </div>
  );
}

// ─── Inline sparkle star (for sprinkling next to any text) ────────────────────
export function SparkleStar({ color = '#FFD700', size = 12, delay = 0 }: { color?: string; size?: number; delay?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        animation: `sparkle-twinkle 1.8s ${delay}s ease-in-out infinite`,
        lineHeight: 1,
      }}
    >
      <StarShape size={size} color={color} />
    </span>
  );
}

export default SparkleToken;
