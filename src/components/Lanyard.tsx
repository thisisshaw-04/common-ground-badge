import { useId } from 'react'

interface LanyardProps {
  from: string
  to: string
  label?: string
  scale?: number
}

/** Realistic fabric Y-lanyard + metal clip for badge attachment. */
export function Lanyard({ from, to, label = 'COMMON GROUND', scale = 1 }: LanyardProps) {
  const uid = useId().replace(/:/g, '')
  const w = 120 * scale
  const h = 78 * scale

  return (
    <div className="relative flex flex-col items-center" style={{ width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 120 78"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`strapGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="55%" stopColor={to} />
            <stop offset="100%" stopColor={from} />
          </linearGradient>
          <linearGradient id={`strapShade-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="45%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3f3f3" />
            <stop offset="40%" stopColor="#c8c8c8" />
            <stop offset="100%" stopColor="#8a8a8a" />
          </linearGradient>
          <pattern id={`weave-${uid}`} width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M0 2 H4" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
            <path d="M2 0 V4" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <path
          d="M28 2 C 22 18, 30 36, 52 52"
          stroke={`url(#strapGrad-${uid})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M28 2 C 22 18, 30 36, 52 52"
          stroke={`url(#strapShade-${uid})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M28 2 C 22 18, 30 36, 52 52"
          stroke={`url(#weave-${uid})`}
          strokeWidth="11"
          strokeLinecap="round"
        />

        <path
          d="M92 2 C 98 18, 90 36, 68 52"
          stroke={`url(#strapGrad-${uid})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M92 2 C 98 18, 90 36, 68 52"
          stroke={`url(#strapShade-${uid})`}
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M92 2 C 98 18, 90 36, 68 52"
          stroke={`url(#weave-${uid})`}
          strokeWidth="11"
          strokeLinecap="round"
        />

        <path
          d="M52 50 C 56 56, 64 56, 68 50"
          stroke={`url(#strapGrad-${uid})`}
          strokeWidth="10"
          strokeLinecap="round"
        />

        <text
          x="24"
          y="22"
          fill="rgba(0,0,0,0.35)"
          fontSize="4.2"
          fontFamily="IBM Plex Mono, monospace"
          transform="rotate(-58 24 22)"
        >
          {label.slice(0, 8)}
        </text>
        <text
          x="86"
          y="22"
          fill="rgba(0,0,0,0.35)"
          fontSize="4.2"
          fontFamily="IBM Plex Mono, monospace"
          transform="rotate(58 86 22)"
        >
          {label.slice(0, 8)}
        </text>

        <circle
          cx="60"
          cy="54"
          r="5.2"
          fill="none"
          stroke={`url(#metal-${uid})`}
          strokeWidth="2.2"
        />
        <circle cx="60" cy="54" r="3.2" fill="#111" />

        <rect x="55.5" y="58" width="9" height="7" rx="1.2" fill={`url(#metal-${uid})`} />
        <path
          d="M57 65 L57 71 C57 73.2 58.4 74.5 60 74.5 C61.6 74.5 63 73.2 63 71 L63 65"
          stroke={`url(#metal-${uid})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="56.5" y="59" width="7" height="1.4" rx="0.5" fill="rgba(255,255,255,0.45)" />
      </svg>
    </div>
  )
}

/** Compact cord swatch for the picker. */
export function CordSwatch({ from, to }: { from: string; to: string }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg width="28" height="40" viewBox="0 0 28 40" aria-hidden>
      <defs>
        <linearGradient id={`c-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path
        d="M8 2 C 6 12, 10 20, 14 28"
        stroke={`url(#c-${uid})`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 2 C 22 12, 18 20, 14 28"
        stroke={`url(#c-${uid})`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="30" r="3" fill="#c8c8c8" stroke="#888" strokeWidth="0.8" />
      <rect x="11.5" y="32.5" width="5" height="4" rx="0.8" fill="#bdbdbd" />
    </svg>
  )
}
