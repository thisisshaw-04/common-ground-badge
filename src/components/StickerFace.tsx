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

function linesFor(label: string, shape?: string): string[] {
  if (label.includes('×')) {
    const [a, b] = label.split('×').map((s) => s.trim())
    return [`${a} ×`, b]
  }
  if (label.includes('YEAR')) {
    const [a, b] = label.split(' ')
    return b ? [a, b] : [label]
  }
  const parts = label.split(' ')
  if (parts.length >= 2 && (label.length > 10 || shape === 'flower')) {
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
  const lines = linesFor(def.label, def.shape)
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
                    : def.shape === 'wave'
                      ? 'sticker-nice sticker-nice-wave'
                  : 'sticker-nice sticker-nice-soft'

  return (
    <span
      className={`${shape} ${pad} inline-flex flex-col items-center justify-center whitespace-nowrap text-center ${
        dragging ? 'sticker-dragging' : ''
      }`}
      style={{
        background:
          def.shape === 'burst' || def.shape === 'flower' || def.shape === 'wave'
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
      {lines.map((line, i) => (
        <span key={i} className={`relative font-body font-extrabold uppercase ${type}`}>
          {line}
        </span>
      ))}
    </span>
  )
}
