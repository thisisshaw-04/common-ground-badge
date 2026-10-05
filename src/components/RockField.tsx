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

/** Grayscale voxel/topographic rock — stepped facets like the branding poster. */
export function RockSilhouette({ className = '' }: { className?: string }) {
  // Voxel cells: [x, y, size, shade 0-1]
  const voxels: [number, number, number, number][] = [
    [72, 18, 14, 0.72],
    [86, 16, 14, 0.8],
    [100, 20, 14, 0.68],
    [58, 30, 14, 0.55],
    [72, 32, 14, 0.62],
    [86, 30, 14, 0.75],
    [100, 34, 14, 0.58],
    [114, 28, 14, 0.7],
    [128, 34, 14, 0.5],
    [44, 44, 14, 0.42],
    [58, 44, 14, 0.5],
    [72, 46, 14, 0.58],
    [86, 44, 14, 0.65],
    [100, 48, 14, 0.52],
    [114, 42, 14, 0.6],
    [128, 48, 14, 0.45],
    [142, 42, 14, 0.55],
    [36, 58, 14, 0.35],
    [50, 58, 14, 0.48],
    [64, 60, 14, 0.4],
    [78, 58, 14, 0.55],
    [92, 62, 14, 0.38],
    [106, 56, 14, 0.5],
    [120, 62, 14, 0.42],
    [134, 56, 14, 0.48],
    [148, 60, 14, 0.32],
    [42, 72, 14, 0.3],
    [56, 72, 14, 0.4],
    [70, 74, 14, 0.35],
    [84, 72, 14, 0.45],
    [98, 76, 14, 0.28],
    [112, 70, 14, 0.38],
    [126, 76, 14, 0.33],
    [140, 72, 14, 0.28],
    [50, 86, 14, 0.25],
    [64, 88, 14, 0.32],
    [78, 86, 14, 0.28],
    [92, 90, 14, 0.22],
    [106, 84, 14, 0.3],
    [120, 90, 14, 0.24],
    [58, 100, 14, 0.2],
    [72, 102, 14, 0.26],
    [86, 100, 14, 0.18],
    [100, 104, 14, 0.22],
    [114, 98, 14, 0.2],
    [66, 114, 14, 0.16],
    [80, 116, 14, 0.2],
    [94, 114, 14, 0.14],
    [108, 118, 14, 0.16],
  ]

  const shade = (t: number) => {
    const v = Math.round(28 + t * 160)
    return `rgb(${v},${v},${v})`
  }

  return (
    <svg
      viewBox="0 0 200 150"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <pattern id="rockMesh" width="4" height="4" patternUnits="userSpaceOnUse">
          <path
            d="M4 0 H0 V4"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="100" cy="132" rx="62" ry="10" fill="rgba(0,0,0,0.55)" />

      {/* Voxel rock stack */}
      {voxels.map(([x, y, s, t], i) => (
        <g key={i}>
          <rect x={x} y={y} width={s} height={s} fill={shade(t)} />
          {/* top highlight edge */}
          <path
            d={`M${x} ${y + 1} H${x + s - 1}`}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
          />
          {/* right shadow edge */}
          <path
            d={`M${x + s - 1} ${y} V${y + s}`}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="1.2"
          />
        </g>
      ))}

      <rect x="30" y="14" width="140" height="120" fill="url(#rockMesh)" />
    </svg>
  )
}

export function RockField({ tracks, className = '', showLabels = true }: RockFieldProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#070707]" />
      <RockSilhouette className="absolute inset-x-0 top-[8%] h-[88%] w-full opacity-95" />
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
      <RockSilhouette className="absolute inset-0 h-full w-full scale-110 opacity-90" />
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
