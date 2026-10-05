import { useId } from 'react'

interface LanyardProps {
  from: string
  to: string
  scale?: number
}

/**
 * Soft hanging Y-strap + bulldog clip.
 * Wide ribbons, gentle curves, no strap text.
 */
export function Lanyard({ from, to, scale = 1 }: LanyardProps) {
  const uid = useId().replace(/:/g, '')
  const w = 168 * scale
  const h = 110 * scale

  return (
    <div className="relative flex flex-col items-center" style={{ width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 168 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`s-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <linearGradient id={`m-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fafafa" />
            <stop offset="55%" stopColor="#c8c8c8" />
            <stop offset="100%" stopColor="#8e8e8e" />
          </linearGradient>
          <filter id={`sh-${uid}`} x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Left strap — soft curve into center */}
        <path
          d="M22 2
             C18 36, 36 62, 74 78
             L82 74
             C48 60, 34 36, 38 2
             Z"
          fill={`url(#s-${uid})`}
          filter={`url(#sh-${uid})`}
        />
        {/* Right strap */}
        <path
          d="M146 2
             C150 36, 132 62, 94 78
             L86 74
             C120 60, 134 36, 130 2
             Z"
          fill={`url(#s-${uid})`}
          filter={`url(#sh-${uid})`}
        />

        {/* Soft edge highlights */}
        <path
          d="M30 6 C26 34, 42 58, 76 74"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M138 6 C142 34, 126 58, 92 74"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Metal ring */}
        <circle cx="84" cy="78" r="7" fill="#1a1a1a" />
        <circle
          cx="84"
          cy="78"
          r="5.2"
          fill="none"
          stroke={`url(#m-${uid})`}
          strokeWidth="2.4"
        />

        {/* Bulldog clip body */}
        <rect
          x="77.5"
          y="83"
          width="13"
          height="9"
          rx="1.6"
          fill={`url(#m-${uid})`}
        />
        <rect
          x="79"
          y="84.5"
          width="10"
          height="1.6"
          rx="0.5"
          fill="rgba(255,255,255,0.65)"
        />
        {/* Spring lines */}
        <path
          d="M80 90 H88 M80.5 92 H87.5"
          stroke="rgba(0,0,0,0.28)"
          strokeWidth="0.7"
        />
        {/* J-hook into badge slot */}
        <path
          d="M80 91.5
             V102
             C80 106.5 82.5 108.5 84 108.5
             C85.5 108.5 88 106.5 88 102
             V91.5"
          stroke={`url(#m-${uid})`}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/** Compact cord swatch for the picker. */
export function CordSwatch({ from, to }: { from: string; to: string }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg width="32" height="40" viewBox="0 0 32 40" aria-hidden>
      <defs>
        <linearGradient id={`c-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={`m-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="100%" stopColor="#9a9a9a" />
        </linearGradient>
      </defs>
      <path
        d="M6 1 C4 14, 10 22, 16 28 L12 29 C7 22, 4 14, 7 1 Z"
        fill={`url(#c-${uid})`}
      />
      <path
        d="M26 1 C28 14, 22 22, 16 28 L20 29 C25 22, 28 14, 25 1 Z"
        fill={`url(#c-${uid})`}
      />
      <circle cx="16" cy="30" r="2.6" fill="none" stroke={`url(#m-${uid})`} strokeWidth="1.6" />
      <rect x="13.5" y="31.5" width="5" height="4.2" rx="0.7" fill={`url(#m-${uid})`} />
    </svg>
  )
}
