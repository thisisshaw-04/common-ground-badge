/** Stepped rectilinear “rock” card fields — inspired by geometric poster cards. */

export type RockShapeId = 'slab' | 'notch' | 'terrace' | 'spit' | 'canyon' | 'ledge'

export interface TrackRect {
  color: string
  x: number
  y: number
  w: number
  h: number
  id: string
  score: number
}

export interface RockCardDef {
  shape: RockShapeId
  /** Light paper behind the black rock */
  paper: string
  /** Tiny accent pill on the rock */
  accent: string
  accentLabel: string
  tracks: TrackRect[]
}

/** Stepped black rock silhouettes (viewBox 0 0 200 140). */
const ROCK_PATHS: Record<RockShapeId, string> = {
  // Wide top plateau → steps down right
  slab: 'M10 14 H130 V40 H178 V88 H150 V122 H42 V98 H10 Z',
  // Notch cut from top-right
  notch: 'M12 12 H100 V38 H170 V72 H138 V124 H28 V96 H12 Z',
  // Terrace steps descending
  terrace: 'M10 34 H70 V12 H124 V40 H182 V76 H152 V124 H34 V98 H10 Z',
  // Tall spit / tower on left
  spit: 'M18 10 H86 V36 H58 V58 H120 V36 H168 V82 H146 V126 H24 V104 H18 Z',
  // Canyon cut through middle
  canyon: 'M8 22 H78 V48 H52 V90 H96 V56 H152 V28 H188 V74 H164 V126 H22 V100 H8 Z',
  // Low ledge with right overhang
  ledge: 'M12 44 H92 V18 H142 V44 H186 V86 H158 V126 H40 V98 H12 Z',
}

function StampEdge({ side }: { side: 'left' | 'top' }) {
  const dots =
    side === 'left'
      ? Array.from({ length: 14 }, (_, i) => (
          <circle key={i} cx="3" cy={8 + i * 9.5} r="2.2" fill="#0a0a0a" />
        ))
      : Array.from({ length: 18 }, (_, i) => (
          <circle key={i} cx={10 + i * 10.5} cy="3" r="2.2" fill="#0a0a0a" />
        ))
  return <g>{dots}</g>
}

export function RockCardArt({
  def,
  className = '',
  showMeta = true,
}: {
  def: RockCardDef
  className?: string
  showMeta?: boolean
}) {
  const path = ROCK_PATHS[def.shape]
  return (
    <svg
      viewBox="0 0 200 140"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* Paper panel */}
      <rect x="6" y="6" width="188" height="128" fill={def.paper} />
      <StampEdge side="left" />
      <StampEdge side="top" />

      {/* Black stepped rock */}
      <path d={path} fill="#0a0a0a" />

      {showMeta ? (
        <>
          {/* Tiny accent pill tucked into rock */}
          <rect
            x="28"
            y="30"
            width="36"
            height="11"
            rx="5.5"
            fill={def.accent}
          />
          <text
            x="46"
            y="38.2"
            textAnchor="middle"
            fill="#111"
            fontSize="6.5"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight="700"
          >
            {def.accentLabel}
          </text>
          {/* Micro type block */}
          <text
            x="28"
            y="52"
            fill="#0a0a0a"
            fontSize="4.5"
            fontFamily="IBM Plex Mono, monospace"
            opacity="0.85"
          >
            REGIONS DETECTED
          </text>
          <text
            x="28"
            y="59"
            fill="#0a0a0a"
            fontSize="4"
            fontFamily="IBM Plex Mono, monospace"
            opacity="0.55"
          >
            CG · NEXALUNE · 2026
          </text>
          {/* Barcode nubs */}
          <g fill="#0a0a0a" opacity="0.7">
            {[0, 2, 3, 5, 8, 9, 11, 14].map((n, i) => (
              <rect key={i} x={28 + n * 2.2} y="64" width="1.4" height="8" />
            ))}
          </g>
        </>
      ) : null}
    </svg>
  )
}

interface RockFieldProps {
  def: RockCardDef
  className?: string
  showLabels?: boolean
}

export function RockField({ def, className = '', showLabels = true }: RockFieldProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#f0f0ee]" />
      <RockCardArt
        def={def}
        className="absolute inset-[3%] h-[94%] w-[94%]"
        showMeta
      />
      {def.tracks.map((t, i) => (
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
          {i === 0 ? <span className="crosshair absolute inset-0" /> : null}
          <span className="track-corner tl" />
          <span className="track-corner tr" />
          <span className="track-corner bl" />
          <span className="track-corner br" />
        </div>
      ))}
    </div>
  )
}

export function RockFieldThumb({ def }: { def: RockCardDef }) {
  return (
    <div className="relative h-14 overflow-hidden bg-[#0a0a0a]">
      <RockCardArt def={def} className="absolute inset-0 h-full w-full" showMeta={false} />
      <span
        className="absolute bottom-1.5 left-1.5 h-2 w-5 rounded-full"
        style={{ background: def.accent }}
      />
    </div>
  )
}
