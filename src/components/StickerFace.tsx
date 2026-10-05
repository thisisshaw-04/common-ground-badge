import type { StickerDef, StickerShape } from '../lib/badge'

/** Die-cut artsy sticker faces — bold fill, white rim, playful silhouettes. */

const STAR_PATH =
  'M50 4 L61 36 L95 36 L67 56 L78 90 L50 70 L22 90 L33 56 L5 36 L39 36 Z'
const BURST_PATH =
  'M50 2 L58 22 L80 8 L72 30 L96 28 L78 44 L98 58 L74 58 L80 82 L58 66 L50 92 L42 66 L20 82 L26 58 L2 58 L22 44 L4 28 L28 30 L20 8 L42 22 Z'
const FLOWER_PATH =
  'M50 8 C58 8 64 16 64 24 C72 20 84 22 86 32 C94 34 100 44 96 52 C104 58 104 70 96 74 C100 84 94 94 84 94 C82 102 70 106 60 100 C56 108 44 108 40 100 C30 106 18 102 16 94 C6 94 0 84 4 74 C-2 68 -2 56 4 50 C0 40 8 30 18 30 C20 20 32 14 42 18 C44 10 50 8 50 8 Z'
const DIAMOND_PATH = 'M50 4 L92 50 L50 96 L8 50 Z'
const CLOUD_PATH =
  'M28 72 C14 72 8 60 14 50 C8 40 16 28 30 30 C34 18 50 14 62 22 C74 14 92 20 94 36 C106 38 110 52 100 60 C108 70 98 82 82 78 C74 88 52 88 42 80 C34 86 24 82 28 72 Z'
const BLOB_PATH =
  'M30 28 C42 12 70 10 82 26 C96 24 108 40 100 56 C112 68 100 90 78 88 C70 102 42 100 32 86 C14 88 8 68 18 54 C8 42 16 28 30 28 Z'
const BANNER_PATH =
  'M8 28 L92 20 L92 72 L50 64 L8 72 Z'
const TAG_PATH =
  'M12 20 H78 L96 50 L78 80 H12 Z'

function ShapeSvg({
  shape,
  color,
  children,
  compact,
}: {
  shape: StickerShape
  color: string
  children: React.ReactNode
  compact?: boolean
}) {
  const size = compact ? 64 : 88
  const path =
    shape === 'star'
      ? STAR_PATH
      : shape === 'burst'
        ? BURST_PATH
        : shape === 'flower'
          ? FLOWER_PATH
          : shape === 'diamond'
            ? DIAMOND_PATH
            : shape === 'cloud'
              ? CLOUD_PATH
              : shape === 'blob'
                ? BLOB_PATH
                : shape === 'banner'
                  ? BANNER_PATH
                  : shape === 'tag'
                    ? TAG_PATH
                    : null

  if (!path) return null

  return (
    <span
      className="sticker-shell relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full drop-shadow-[2px_3px_0_rgba(0,0,0,0.18)]"
        aria-hidden
      >
        <path d={path} fill="#fff" transform="translate(1.5 1.5) scale(0.97)" />
        <path d={path} fill={color} stroke="#111" strokeWidth="2.2" />
      </svg>
      <span className="relative z-10 px-1 text-center leading-[1.05]">{children}</span>
    </span>
  )
}

export function StickerFace({ def, compact }: { def: StickerDef; compact?: boolean }) {
  const text = def.textColor ?? '#fff'
  const tilt = def.tilt ?? 0
  const labelClass = compact
    ? 'font-display text-[8px] font-bold tracking-tight uppercase'
    : 'font-display text-[11px] font-bold tracking-tight uppercase'

  const label = (
    <span className={labelClass} style={{ color: text }}>
      {def.label}
    </span>
  )

  // Wide CSS die-cuts
  if (def.shape === 'ticket' || def.shape === 'banner' || def.shape === 'tag') {
    const shapeClass =
      def.shape === 'ticket'
        ? 'sticker-ticket'
        : def.shape === 'banner'
          ? 'sticker-banner'
          : 'sticker-tag'
    return (
      <span
        className={`sticker-shell ${shapeClass} inline-flex items-center justify-center ${
          compact ? 'min-h-9 px-2.5 py-1.5' : 'min-h-11 px-3.5 py-2'
        }`}
        style={{
          background: def.color,
          color: text,
          transform: `rotate(${tilt}deg)`,
        }}
      >
        <span className={labelClass}>{def.label}</span>
      </span>
    )
  }

  // SVG die-cuts
  if (
    def.shape === 'star' ||
    def.shape === 'burst' ||
    def.shape === 'flower' ||
    def.shape === 'diamond' ||
    def.shape === 'cloud' ||
    def.shape === 'blob'
  ) {
    return (
      <span
        className="inline-flex"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        <ShapeSvg shape={def.shape} color={def.color} compact={compact}>
          {label}
        </ShapeSvg>
      </span>
    )
  }

  // pill
  return (
    <span
      className={`sticker-shell sticker-pill inline-flex items-center justify-center ${
        compact ? 'min-h-8 px-2.5 py-1' : 'min-h-10 px-3.5 py-1.5'
      }`}
      style={{
        background: def.color,
        color: text,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      <span className={labelClass}>{def.label}</span>
    </span>
  )
}
