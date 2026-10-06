import type { BorderId } from '../lib/badge'

/** Build a closed wavy rectangle path in a 100×100 viewBox. */
function wigglyPath(amp = 1.35, steps = 10) {
  const edge = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    nx: number,
    ny: number,
  ) => {
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      const wave = Math.sin(t * Math.PI * (steps / 2)) * amp
      pts.push(`${(x + nx * wave).toFixed(2)},${(y + ny * wave).toFixed(2)}`)
    }
    return pts
  }

  const inset = 2
  const x0 = inset
  const y0 = inset
  const x1 = 100 - inset
  const y1 = 100 - inset

  const pts = [
    ...edge(x0, y0, x1, y0, 0, 1), // top, wave downward
    ...edge(x1, y0, x1, y1, -1, 0), // right
    ...edge(x1, y1, x0, y1, 0, -1), // bottom
    ...edge(x0, y1, x0, y0, 1, 0), // left
  ]
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`
}

const WIGGLY_D = wigglyPath()

/** Inner frame overlay — outer badge shell stays a thin sharp rect. */
export function BadgeInnerFrame({ border }: { border: BorderId }) {
  if (border === 'none') return null

  if (border === 'wiggly') {
    return (
      <svg
        className="badge-inner-frame pointer-events-none absolute inset-[6px] z-40 h-[calc(100%-12px)] w-[calc(100%-12px)] overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={WIGGLY_D}
          fill="none"
          stroke="#111"
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }

  return (
    <div
      className={`badge-inner-frame pointer-events-none absolute inset-2 z-40 ${
        border === 'dashed' ? 'badge-inner-dashed' : 'badge-inner-box'
      }`}
      aria-hidden
    />
  )
}

/** Tiny preview swatch for the Frame picker. */
export function FrameSwatch({ border }: { border: BorderId }) {
  if (border === 'wiggly') {
    return (
      <svg width="24" height="24" viewBox="0 0 100 100" aria-hidden className="overflow-visible">
        <path
          d={WIGGLY_D}
          fill="none"
          stroke="#111"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    )
  }
  if (border === 'dashed') {
    return <span className="block h-6 w-6 border border-dashed border-black" />
  }
  if (border === 'track') {
    return <span className="block h-6 w-6 border border-black" />
  }
  return <span className="block h-6 w-6 border border-transparent" />
}
