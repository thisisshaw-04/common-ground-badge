import { useId } from 'react'

interface LanyardProps {
  from: string
  to: string
  label?: string
  scale?: number
}

/** Clean flat vector Y-lanyard + clip — simple silhouette, no fake texture. */
export function Lanyard({ from, to, label = 'COMMON GROUND', scale = 1 }: LanyardProps) {
  const uid = useId().replace(/:/g, '')
  const w = 128 * scale
  const h = 84 * scale

  return (
    <div className="relative flex flex-col items-center" style={{ width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 128 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={`strap-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={to} />
            <stop offset="45%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <linearGradient id={`clip-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2f2f2" />
            <stop offset="50%" stopColor="#c4c4c4" />
            <stop offset="100%" stopColor="#8f8f8f" />
          </linearGradient>
        </defs>

        {/* Left ribbon */}
        <path
          d="M26 0 H40 L62 58 H50 Z"
          fill={`url(#strap-${uid})`}
        />
        {/* Right ribbon */}
        <path
          d="M102 0 H88 L66 58 H78 Z"
          fill={`url(#strap-${uid})`}
        />

        {/* Center fold highlight */}
        <path d="M33 0 L56 58" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
        <path d="M95 0 L72 58" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />

        {/* Tiny brand marks */}
        <text
          x="30"
          y="30"
          fill="rgba(0,0,0,0.32)"
          fontSize="5.5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          transform="rotate(-64 30 30)"
        >
          {label.slice(0, 7)}
        </text>
        <text
          x="90"
          y="30"
          fill="rgba(0,0,0,0.32)"
          fontSize="5.5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          transform="rotate(64 90 30)"
        >
          {label.slice(0, 7)}
        </text>

        {/* Ring */}
        <circle cx="64" cy="60" r="5" fill="#0d0d0d" />
        <circle
          cx="64"
          cy="60"
          r="3.6"
          fill="none"
          stroke={`url(#clip-${uid})`}
          strokeWidth="2"
        />

        {/* Clip */}
        <rect x="59.5" y="64" width="9" height="6.5" rx="1" fill={`url(#clip-${uid})`} />
        <rect x="60.5" y="65" width="7" height="1.2" rx="0.4" fill="rgba(255,255,255,0.6)" />
        <path
          d="M61.5 70 V78.5 C61.5 81 63 82.5 64 82.5 C65 82.5 66.5 81 66.5 78.5 V70"
          stroke={`url(#clip-${uid})`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

/** Compact cord swatch for the picker. */
export function CordSwatch({ from, to }: { from: string; to: string }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg width="28" height="36" viewBox="0 0 28 36" aria-hidden>
      <defs>
        <linearGradient id={`c-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={`m-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#9a9a9a" />
        </linearGradient>
      </defs>
      <path d="M7 1 H12 L14 26 H10 Z" fill={`url(#c-${uid})`} />
      <path d="M21 1 H16 L14 26 H18 Z" fill={`url(#c-${uid})`} />
      <circle cx="14" cy="27.5" r="2.2" fill="none" stroke={`url(#m-${uid})`} strokeWidth="1.5" />
      <rect x="11.8" y="29" width="4.4" height="3.6" rx="0.6" fill={`url(#m-${uid})`} />
    </svg>
  )
}
