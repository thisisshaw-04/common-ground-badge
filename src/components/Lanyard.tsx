import { useId } from 'react'

interface LanyardProps {
  from: string
  to: string
  label?: string
  scale?: number
}

/** Realistic fabric Y-lanyard + metal J-clip. */
export function Lanyard({ from, to, label = 'COMMON GROUND', scale = 1 }: LanyardProps) {
  const uid = useId().replace(/:/g, '')
  const w = 140 * scale
  const h = 96 * scale

  return (
    <div className="relative flex flex-col items-center" style={{ width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 140 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="overflow-visible drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
      >
        <defs>
          <linearGradient id={`strapGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={to} />
            <stop offset="40%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <linearGradient id={`strapEdge-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </linearGradient>
          <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7f7f7" />
            <stop offset="45%" stopColor="#c9c9c9" />
            <stop offset="100%" stopColor="#7d7d7d" />
          </linearGradient>
          <pattern id={`weave-${uid}`} width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="transparent" />
            <path d="M0 1.5 H3" stroke="rgba(0,0,0,0.2)" strokeWidth="0.45" />
            <path d="M1.5 0 V3" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
          </pattern>
        </defs>

        {/* Left fabric strap (flat ribbon path) */}
        <path
          d="M34 4
             C 26 22, 34 42, 58 62
             L 62 60
             C 40 42, 34 24, 40 4
             Z"
          fill={`url(#strapGrad-${uid})`}
        />
        <path
          d="M34 4
             C 26 22, 34 42, 58 62
             L 62 60
             C 40 42, 34 24, 40 4
             Z"
          fill={`url(#strapEdge-${uid})`}
          opacity="0.55"
        />
        <path
          d="M34 4
             C 26 22, 34 42, 58 62
             L 62 60
             C 40 42, 34 24, 40 4
             Z"
          fill={`url(#weave-${uid})`}
        />

        {/* Right fabric strap */}
        <path
          d="M106 4
             C 114 22, 106 42, 82 62
             L 78 60
             C 100 42, 106 24, 100 4
             Z"
          fill={`url(#strapGrad-${uid})`}
        />
        <path
          d="M106 4
             C 114 22, 106 42, 82 62
             L 78 60
             C 100 42, 106 24, 100 4
             Z"
          fill={`url(#strapEdge-${uid})`}
          opacity="0.55"
        />
        <path
          d="M106 4
             C 114 22, 106 42, 82 62
             L 78 60
             C 100 42, 106 24, 100 4
             Z"
          fill={`url(#weave-${uid})`}
        />

        {/* Stitched edges */}
        <path
          d="M37 8 C 30 24, 37 42, 59 60"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.7"
          strokeDasharray="1.5 1.2"
          fill="none"
        />
        <path
          d="M103 8 C 110 24, 103 42, 81 60"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.7"
          strokeDasharray="1.5 1.2"
          fill="none"
        />

        {/* Tiny brand on straps */}
        <text
          x="30"
          y="28"
          fill="rgba(0,0,0,0.4)"
          fontSize="4.5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          transform="rotate(-62 30 28)"
        >
          {label.slice(0, 6)}
        </text>
        <text
          x="102"
          y="28"
          fill="rgba(0,0,0,0.4)"
          fontSize="4.5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          transform="rotate(62 102 28)"
        >
          {label.slice(0, 6)}
        </text>

        {/* Metal O-ring where straps meet */}
        <ellipse
          cx="70"
          cy="64"
          rx="7"
          ry="5.5"
          fill="none"
          stroke={`url(#metal-${uid})`}
          strokeWidth="2.6"
        />
        <ellipse cx="70" cy="64" rx="4" ry="3" fill="#0a0a0a" />

        {/* Plastic strap keeper / slider */}
        <rect
          x="64.5"
          y="58"
          width="11"
          height="5"
          rx="1"
          fill={`url(#metal-${uid})`}
          opacity="0.9"
        />

        {/* Metal bulldog / J-clip body */}
        <rect x="65" y="68" width="10" height="8" rx="1.4" fill={`url(#metal-${uid})`} />
        <rect x="66.2" y="69.2" width="7.6" height="1.6" rx="0.5" fill="rgba(255,255,255,0.5)" />
        {/* Spring teeth hint */}
        <path
          d="M67 73.5 H73 M67.5 75 H72.5"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.6"
        />
        {/* J hook hanging into badge slot */}
        <path
          d="M67.5 76
             L67.5 86
             C67.5 89.5 69 91.5 70 91.5
             C71 91.5 72.5 89.5 72.5 86
             L72.5 76"
          stroke={`url(#metal-${uid})`}
          strokeWidth="2.4"
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
    <svg width="30" height="38" viewBox="0 0 30 38" aria-hidden>
      <defs>
        <linearGradient id={`c-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d="M7 2 C 5 14, 10 22, 15 28 L 12 28 C 8 22, 5 14, 8 2 Z"
        fill={`url(#c-${uid})`}
      />
      <path
        d="M23 2 C 25 14, 20 22, 15 28 L 18 28 C 22 22, 25 14, 22 2 Z"
        fill={`url(#c-${uid})`}
      />
      <ellipse cx="15" cy="29.5" rx="3.2" ry="2.4" fill="#d0d0d0" stroke="#888" strokeWidth="0.7" />
      <rect x="12.5" y="31.5" width="5" height="4.5" rx="0.8" fill="#bdbdbd" />
    </svg>
  )
}
