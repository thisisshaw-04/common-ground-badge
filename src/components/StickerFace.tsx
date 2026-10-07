import type { StickerDef } from '../lib/badge'

const BURST_POINTS = (() => {
  const spikes = 22
  const pts: string[] = []
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? 50 : 41
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
})()

function linesFor(label: string): string[] {
  if (label.includes('×')) {
    const [a, b] = label.split('×').map((s) => s.trim())
    return [`${a} ×`, b]
  }
  if (label.includes('YEAR')) {
    const [a, b] = label.split(' ')
    return b ? [a, b] : [label]
  }
  const parts = label.split(' ')
  if (parts.length >= 2 && label.length > 10) {
    return [parts[0], parts.slice(1).join(' ')]
  }
  return [label]
}

export function StickerFace({
  def,
  compact,
  large,
  dragging,
}: {
  def: StickerDef
  compact?: boolean
  large?: boolean
  dragging?: boolean
}) {
  const text = def.textColor ?? '#111'
  const tilt = def.tilt ?? 0
  const lines = linesFor(def.label)
  const size = large ? 'large' : compact ? 'compact' : 'normal'
  const pad =
    size === 'large'
      ? 'px-4 py-3'
      : size === 'compact'
        ? 'px-3 py-2'
        : 'px-3.5 py-2.5'
  const type =
    size === 'large'
      ? 'text-[12px] leading-[1.05] tracking-[0.04em]'
      : size === 'compact'
        ? 'text-[10px] leading-[1.1] tracking-[0.04em]'
        : 'text-[12px] leading-[1.1] tracking-[0.04em]'

  const shape =
    def.shape === 'pill'
      ? 'sticker-nice sticker-nice-pill'
      : def.shape === 'ticket'
        ? 'sticker-nice sticker-nice-ticket'
        : def.shape === 'tag'
          ? 'sticker-nice sticker-nice-tag'
          : def.shape === 'jagged'
            ? 'sticker-nice sticker-nice-jagged'
            : def.shape === 'flower'
              ? 'sticker-nice sticker-nice-flower'
              : def.shape === 'blob'
                ? 'sticker-nice sticker-nice-blob'
                : def.shape === 'bump'
                  ? 'sticker-nice sticker-nice-bump'
                  : def.shape === 'burst'
                    ? 'sticker-nice sticker-nice-burst'
                  : 'sticker-nice sticker-nice-soft'

  return (
    <span
      className={`${shape} ${pad} inline-flex flex-col items-center justify-center whitespace-nowrap text-center ${
        dragging ? 'sticker-dragging' : ''
      }`}
      style={{
        background: def.shape === 'burst' ? undefined : def.color,
        color: text,
        ['--sticker-tilt' as string]: `${tilt}deg`,
        transform: dragging
          ? `rotate(${tilt}deg) scale(1.08)`
          : def.shape === 'blob'
            ? undefined
            : `rotate(${tilt}deg)`,
      }}
    >
      {def.shape === 'burst' && (
        <svg className="sticker-burst-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polygon
            points={BURST_POINTS}
            fill={def.color}
            stroke="#111"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {lines.map((line, i) => (
        <span key={i} className={`relative font-body font-extrabold uppercase ${type}`}>
          {line}
        </span>
      ))}
    </span>
  )
}
