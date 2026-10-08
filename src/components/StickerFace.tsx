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

/** Rounded rectangle with a shallow two-hump wave on the top and bottom. */
const WAVE_D = (() => {
  const w = 200
  const h = 100
  const r = 24
  const amp = 12
  const left = r
  const right = w - r
  const steps = 20
  const top = (t: number) => 10 + amp * 0.5 * (1 - Math.cos(Math.PI * 2 * t))
  const bot = (t: number) => h - 10 - amp * 0.5 * (1 - Math.cos(Math.PI * 2 * t))
  const pts: string[] = [`M ${left.toFixed(1)} ${top(0).toFixed(1)}`]
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    pts.push(`L ${(left + (right - left) * t).toFixed(1)} ${top(t).toFixed(1)}`)
  }
  pts.push(
    `A ${r} ${r} 0 0 1 ${w.toFixed(1)} ${(top(1) + r).toFixed(1)}`,
    `L ${w.toFixed(1)} ${(bot(1) - r).toFixed(1)}`,
    `A ${r} ${r} 0 0 1 ${right.toFixed(1)} ${bot(1).toFixed(1)}`,
  )
  for (let i = steps - 1; i >= 0; i--) {
    const t = i / steps
    pts.push(`L ${(left + (right - left) * t).toFixed(1)} ${bot(t).toFixed(1)}`)
  }
  pts.push(
    `A ${r} ${r} 0 0 1 0 ${(bot(0) - r).toFixed(1)}`,
    `L 0 ${(top(0) + r).toFixed(1)}`,
    `A ${r} ${r} 0 0 1 ${left.toFixed(1)} ${top(0).toFixed(1)}`,
  )
  return `${pts.join(' ')} Z`
})()

/** Rounded-petal sun, like a scalloped daisy. */
const SUN_D = (() => {
  const n = 16
  const inner = 33
  const outer = 50
  const half = (Math.PI / n) * 0.7
  const at = (r: number, a: number) =>
    `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`
  let d = ''
  for (let i = 0; i < n; i++) {
    const mid = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const a0 = mid - half
    const a1 = mid + half
    d += i === 0 ? `M ${at(inner, a0)}` : ` L ${at(inner, a0)}`
    d += ` L ${at(outer - 5, a0)}`
    d += ` Q ${at(outer, mid)} ${at(outer - 5, a1)}`
    d += ` L ${at(inner, a1)}`
  }
  return `${d} Z`
})()

/** Soft 8-point star from the track die-cut. */
const STAR_D =
  'M129.413 44.9844C156.772 -14.3294 241.072 -14.3294 268.431 44.9844C279.727 69.474 302.935 86.3362 329.717 89.5117C394.582 97.2025 420.632 177.377 372.676 221.726C352.875 240.037 344.011 267.32 349.267 293.772C361.996 357.839 293.796 407.389 236.799 375.484C213.266 362.312 184.578 362.312 161.045 375.484C104.047 407.389 35.8474 357.839 48.5771 293.772C53.8332 267.32 44.9683 240.037 25.168 221.726C-22.7886 177.377 3.26168 97.2025 68.127 89.5117C94.9086 86.3362 118.117 69.474 129.413 44.9844Z'

const FLOWER_D = (() => {
  const petals = 8
  const at = (r: number, a: number) =>
    `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`
  const step = (Math.PI * 2) / petals
  let d = `M ${at(34, -Math.PI / 2)}`
  for (let i = 0; i < petals; i++) {
    const a = -Math.PI / 2 + i * step
    d += ` C ${at(58, a + step * 0.12)} ${at(58, a + step * 0.88)} ${at(34, a + step)}`
  }
  return `${d} Z`
})()

function linesFor(label: string): string[] {
  if (label.includes('×')) {
    const [a, b] = label.split('×').map((s) => s.trim())
    return [a, b]
  }
  if (label.startsWith('HERE ')) {
    const rest = label.slice(5)
    if (rest.startsWith('TO ')) return ['HERE TO', rest.slice(3)]
    return ['HERE', rest]
  }
  if (label.includes('YEAR')) {
    const [a, b] = label.split(' ')
    return b ? [a, b] : [label]
  }
  const parts = label.split(' ')
  if (parts.length >= 2 && label.length >= 9) {
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
  const round = def.shape === 'flower' || def.shape === 'star' || def.shape === 'sun'
  const pad = round
    ? ''
    : size === 'large'
      ? 'px-4 py-3'
      : size === 'compact'
        ? 'px-3 py-2'
        : 'px-3.5 py-2.5'

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
                    : def.shape === 'wave'
                      ? 'sticker-nice sticker-nice-wave'
                      : def.shape === 'sun'
                        ? 'sticker-nice sticker-nice-sun'
                        : def.shape === 'star'
                          ? 'sticker-nice sticker-nice-star'
                  : 'sticker-nice sticker-nice-soft'

  return (
    <span
      className={`${shape} ${pad} inline-flex flex-col items-center justify-center whitespace-nowrap text-center ${
        dragging ? 'sticker-dragging' : ''
      }`}
      style={{
        background:
          def.shape === 'burst' ||
          def.shape === 'flower' ||
          def.shape === 'wave' ||
          def.shape === 'sun' ||
          def.shape === 'star'
            ? undefined
            : def.color,
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
        <svg className="sticker-shape-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polygon points={BURST_POINTS} fill={def.color} strokeLinejoin="round" />
        </svg>
      )}
      {def.shape === 'flower' && (
        <svg className="sticker-shape-bg" viewBox="0 0 100 100" aria-hidden>
          <path d={FLOWER_D} fill={def.color} />
        </svg>
      )}
      {def.shape === 'wave' && (
        <svg className="sticker-shape-bg" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden>
          <path d={WAVE_D} fill={def.color} />
        </svg>
      )}
      {def.shape === 'sun' && (
        <svg className="sticker-shape-bg" viewBox="0 0 100 100" aria-hidden>
          <path d={SUN_D} fill={def.color} />
        </svg>
      )}
      {def.shape === 'star' && (
        <svg className="sticker-shape-bg" viewBox="-28 -22 456 444" aria-hidden>
          <path d={STAR_D} fill={def.color} />
        </svg>
      )}
      <span className="sticker-copy">
        {lines.map((line, i) => (
          <span key={i} className="sticker-label">
            {line}
          </span>
        ))}
      </span>
    </span>
  )
}
