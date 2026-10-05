import { useId } from 'react'

interface LanyardProps {
  from: string
  to: string
  label?: string
  scale?: number
}

/** Clean flat vector Y-lanyard + clip — FigBuild-style silhouette. */
export function Lanyard({ from, to, label = 'COMMON GROUND', scale = 1 }: LanyardProps) {
  const uid = useId().replace(/:/g, '')
  const w = 132 * scale
  const h = 88 * scale

  return (
    <div className="relative flex flex-col items-center" style={{ width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 132 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={`strap-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
          <linearGradient id={`clip-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ececec" />
            <stop offset="55%" stopColor="#b8b8b8" />
            <stop offset="100%" stopColor="#8a8a8a" />
          </linearGradient>
        </defs>

        {/* Left strap */}
        <path
          d="M28 2 L42 2 C38 28 48 48 62 62 L54 66 C38 50 28 28 28 2 Z"
          fill={`url(#strap-${uid})`}
        />
        {/* Right strap */}
        <path
          d="M104 2 L90 2 C94 28 84 48 70 62 L78 66 C94 50 104 28 104 2 Z"
          fill={`url(#strap-${uid})`}
        />

        {/* Strap edge lines */}
        <path
          d="M31 6 C31 28 40 48 56 62"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M101 6 C101 28 92 48 76 62"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1"
          fill="none"
        />

        {/* Brand print on straps */}
        <text
          x="33"
          y="34"
          fill="rgba(0,0,0,0.35)"
          fontSize="5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          letterSpacing="0.5"
          transform="rotate(-58 33 34)"
        >
          {label.slice(0, 8)}
        </text>
        <text
          x="90"
          y="34"
          fill="rgba(0,0,0,0.35)"
          fontSize="5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight="700"
          letterSpacing="0.5"
          transform="rotate(58 90 34)"
        >
          {label.slice(0, 8)}
        </text>

        {/* Join ring */}
        <circle cx="66" cy="64" r="5.5" fill="#111" />
        <circle
          cx="66"
          cy="64"
          r="4"
          fill="none"
          stroke={`url(#clip-${uid})`}
          strokeWidth="2.2"
        />

        {/* Clip body */}
        <rect x="61" y="68" width="10" height="7" rx="1.2" fill={`url(#clip-${uid})`} />
        <rect x="62.2" y="69" width="7.6" height="1.4" rx="0.4" fill="rgba(255,255,255,0.55)" />
        {/* J-hook */}
        <path
          d="M63.5 74.5 V82.5 C63.5 85.5 65 87 66 87 C67 87 68.5 85.5 68.5 82.5 V74.5"
          stroke={`url(#clip-${uid})`}
          strokeWidth="2.2"
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
          <stop offset="0%" stopColor="#ececec" />
          <stop offset="100%" stopColor="#9a9a9a" />
        </linearGradient>
      </defs>
      <path
        d="M6 1 L11 1 C10 12 12 20 14 26 L10 27 C8 20 6 12 6 1 Z"
        fill={`url(#c-${uid})`}
      />
      <path
        d="M22 1 L17 1 C18 12 16 20 14 26 L18 27 C20 20 22 12 22 1 Z"
        fill={`url(#c-${uid})`}
      />
      <circle cx="14" cy="28" r="2.4" fill="none" stroke={`url(#m-${uid})`} strokeWidth="1.6" />
      <rect x="11.5" y="29.5" width="5" height="4" rx="0.7" fill={`url(#m-${uid})`} />
    </svg>
  )
}
