import type { StickerDef } from '../lib/badge'

function linesFor(label: string): string[] {
  if (label.includes('×')) {
    const [a, b] = label.split('×').map((s) => s.trim())
    return [`${a} ×`, b]
  }
  const parts = label.split(' ')
  if (parts.length >= 2 && label.length > 10) {
    return [parts[0], parts.slice(1).join(' ')]
  }
  return [label]
}

export function StickerFace({ def, compact }: { def: StickerDef; compact?: boolean }) {
  const text = def.textColor ?? '#111'
  const tilt = def.tilt ?? 0
  const lines = linesFor(def.label)
  const pad = compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
  const type = compact
    ? 'text-[9px] leading-[1.1] tracking-[0.04em]'
    : 'text-[11px] leading-[1.1] tracking-[0.04em]'

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
              : 'sticker-nice sticker-nice-soft'

  return (
    <span
      className={`${shape} ${pad} inline-flex flex-col items-center justify-center whitespace-nowrap text-center`}
      style={{
        background: def.color,
        color: text,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {lines.map((line, i) => (
        <span key={i} className={`font-body font-extrabold uppercase ${type}`}>
          {line}
        </span>
      ))}
    </span>
  )
}
