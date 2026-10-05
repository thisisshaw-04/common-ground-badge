/** Pixel-rock terrain + rectangular CV-style tracking boxes. */

export interface TrackRect {
  color: string
  x: number
  y: number
  w: number
  h: number
  id: string
  score: number
}

interface RockFieldProps {
  tracks: TrackRect[]
  className?: string
  showLabels?: boolean
}

/** Grayscale voxel/topographic rock as SVG. */
export function RockSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="rockShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6e6e6e" />
          <stop offset="45%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <pattern id="rockGrid" width="6" height="6" patternUnits="userSpaceOnUse">
          <path
            d="M6 0 H0 V6"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>

      {/* Faceted rock body — stepped / voxel silhouette */}
      <path
        fill="url(#rockShade)"
        d="M42 118
           L28 98 L34 78 L22 62 L38 48 L52 28 L78 18 L102 12 L128 20
           L148 34 L168 48 L178 68 L172 88 L158 104 L142 118 L118 132
           L92 138 L68 132 Z"
      />
      {/* Mid facet highlights */}
      <path
        fill="#8a8a8a"
        opacity="0.55"
        d="M52 28 L78 18 L102 12 L118 30 L98 48 L72 52 L58 40 Z"
      />
      <path
        fill="#2a2a2a"
        opacity="0.7"
        d="M128 20 L148 34 L168 48 L158 70 L132 64 L118 42 Z"
      />
      <path
        fill="#505050"
        opacity="0.65"
        d="M38 48 L52 28 L72 52 L88 78 L62 92 L34 78 Z"
      />
      <path
        fill="#1f1f1f"
        d="M88 78 L118 70 L142 90 L118 132 L92 138 L68 120 Z"
      />
      {/* Voxel step edges */}
      <g stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" fill="none">
        <path d="M52 28 L72 52 L98 48 L118 30" />
        <path d="M34 78 L62 92 L88 78 L118 70 L142 90" />
        <path d="M68 120 L92 100 L118 110" />
      </g>
      <rect width="200" height="160" fill="url(#rockGrid)" />
      {/* Pixel steps along silhouette */}
      <g fill="#9a9a9a" opacity="0.35">
        <rect x="70" y="34" width="8" height="8" />
        <rect x="86" y="26" width="8" height="8" />
        <rect x="110" y="38" width="8" height="8" />
        <rect x="54" y="62" width="8" height="8" />
        <rect x="130" y="56" width="8" height="8" />
        <rect x="96" y="86" width="8" height="8" />
      </g>
      <g fill="#111" opacity="0.45">
        <rect x="78" y="58" width="8" height="8" />
        <rect x="118" y="78" width="8" height="8" />
        <rect x="64" y="98" width="8" height="8" />
        <rect x="140" y="72" width="8" height="8" />
      </g>
    </svg>
  )
}

export function RockField({ tracks, className = '', showLabels = true }: RockFieldProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <RockSilhouette className="absolute inset-0 h-full w-full opacity-90" />
      {tracks.map((t, i) => (
        <div
          key={t.id}
          className="track-rect absolute"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: `${t.w}%`,
            height: `${t.h}%`,
            backgroundColor: t.color,
          }}
        >
          {showLabels ? (
            <span className="track-label absolute -top-3.5 left-0 whitespace-nowrap">
              ID: {t.id}_{t.score}
            </span>
          ) : null}
          {i === 1 ? <span className="crosshair absolute inset-0" /> : null}
          {/* corner ticks */}
          <span className="track-corner tl" />
          <span className="track-corner tr" />
          <span className="track-corner bl" />
          <span className="track-corner br" />
        </div>
      ))}
    </div>
  )
}

export function RockFieldThumb({ tracks }: { tracks: TrackRect[] }) {
  return (
    <div className="relative h-12 overflow-hidden bg-[#0a0a0a]">
      <RockSilhouette className="absolute inset-0 h-full w-full opacity-80" />
      {tracks.slice(0, 2).map((t) => (
        <span
          key={t.id}
          className="track-rect absolute"
          style={{
            left: `${t.x}%`,
            top: `${Math.max(8, t.y - 18)}%`,
            width: `${t.w * 0.85}%`,
            height: '55%',
            backgroundColor: t.color,
          }}
        />
      ))}
    </div>
  )
}
