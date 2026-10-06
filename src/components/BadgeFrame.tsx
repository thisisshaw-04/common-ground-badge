import { useLayoutEffect, useRef, useState } from 'react'
import type { BorderId } from '../lib/badge'

/** Small deterministic PRNG so the doodle looks the same on every render/export. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Hand-drawn, Doodle Jump–style rectangle in pixel space: a gentle, uneven
 * pencil wobble (not a regular zigzag), smoothed with Catmull-Rom curves.
 */
export function doodlePath(w: number, h: number, seed = 7, amp = 1.6, step = 46, inset = 1.5) {
  const rand = rng(seed)
  const jitter = () => (rand() * 2 - 1) * amp
  const pts: [number, number][] = []
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0)
    const n = Math.max(2, Math.round(len / step))
    const nx = -(y1 - y0) / len
    const ny = (x1 - x0) / len
    for (let i = 0; i < n; i++) {
      const t = (i + (i ? (rand() - 0.5) * 0.35 : 0)) / n
      const j = i === 0 ? jitter() * 0.5 : jitter()
      pts.push([x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j])
    }
  }
  const L = inset
  const T = inset
  const R = w - inset
  const B = h - inset
  edge(L, T, R, T)
  edge(R, T, R, B)
  edge(R, B, L, B)
  edge(L, B, L, T)

  const n = pts.length
  const f = (v: number) => +v.toFixed(2)
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d} Z`
}

/** CSS class for the outer shell border (none / dash / box). */
export function outerShellClass(border: BorderId): string {
  if (border === 'dashed') return 'badge-shell-dashed'
  if (border === 'track') return 'badge-shell-box'
  if (border === 'wiggly') return 'badge-shell-wiggly'
  return 'badge-shell-none'
}

/** Doodle outer stroke — only rendered for the wiggle option. */
export function BadgeOuterFrame({ border }: { border: BorderId }) {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 400, h: 580 })
  const active = border === 'wiggly'

  useLayoutEffect(() => {
    const host = ref.current?.parentElement
    if (!active || !host) return
    const update = () => setSize({ w: host.clientWidth, h: host.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    return () => ro.disconnect()
  }, [active])

  if (!active) return null
  const { w, h } = size

  return (
    <svg
      ref={ref}
      className="badge-outer-frame pointer-events-none absolute inset-0 z-[60] overflow-visible"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      {/* faint second pencil pass for the sketchy double line */}
      <path
        d={doodlePath(w, h, 23, 1.3, 58, 2.4)}
        fill="none"
        stroke="#111"
        strokeOpacity="0.28"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={doodlePath(w, h, 7)}
        fill="none"
        stroke="#111"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const SWATCH_D = doodlePath(24, 24, 7, 0.9, 9, 1)

/** Tiny preview swatch for the Frame picker. */
export function FrameSwatch({ border }: { border: BorderId }) {
  if (border === 'wiggly') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="overflow-visible">
        <path d={SWATCH_D} fill="none" stroke="#111" strokeWidth="1.25" strokeLinejoin="round" />
      </svg>
    )
  }
  if (border === 'dashed') {
    return <span className="block h-6 w-6 border border-dashed border-black" />
  }
  if (border === 'track') {
    return <span className="block h-6 w-6 border border-black" />
  }
  return <span className="block h-6 w-6 border border-black/20" />
}
