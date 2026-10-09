import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/** Width of the supplied frame outline (public/foot-frame-outline.png), in its own units. */
const OUTLINE_W = 853
const STROKE = 1.5

/**
 * Supplied outline rebuilt at the box's real pixel size: corners, the
 * top-right step and the bottom-left step scale uniformly with width, only
 * the straight runs stretch — so the shape never squashes into ovals.
 */
export function footFramePath(w: number, h: number) {
  const s = w / OUTLINE_W
  const i = STROKE / 2
  const L = i
  const R = w - i
  const T = i
  const B = h - i

  const rTL = 39 * s
  const rTR = 39 * s
  const rBR = 46 * s
  const rBL = 33 * s
  const stepTop = 53 * s
  const stepBot = 42 * s

  const tx0 = R - 295 * s
  const tx1 = R - 61 * s
  const tdx = tx1 - tx0
  const bx0 = L + 304 * s
  const bx1 = L + 69 * s
  const bdx = bx0 - bx1

  const f = (v: number) => +v.toFixed(2)
  return [
    `M ${f(L)} ${f(T + rTL)}`,
    `A ${f(rTL)} ${f(rTL)} 0 0 1 ${f(L + rTL)} ${f(T)}`,
    `H ${f(tx0)}`,
    `C ${f(tx0 + tdx * 0.5)} ${f(T)} ${f(tx1 - tdx * 0.5)} ${f(T + stepTop)} ${f(tx1)} ${f(T + stepTop)}`,
    `H ${f(R - rTR)}`,
    `A ${f(rTR)} ${f(rTR)} 0 0 1 ${f(R)} ${f(T + stepTop + rTR)}`,
    `V ${f(B - rBR)}`,
    `A ${f(rBR)} ${f(rBR)} 0 0 1 ${f(R - rBR)} ${f(B)}`,
    `H ${f(bx0)}`,
    `C ${f(bx0 - bdx * 0.5)} ${f(B)} ${f(bx1 + bdx * 0.5)} ${f(B - stepBot)} ${f(bx1)} ${f(B - stepBot)}`,
    `H ${f(L + rBL)}`,
    `A ${f(rBL)} ${f(rBL)} 0 0 1 ${f(L)} ${f(B - stepBot - rBL)}`,
    'Z',
  ].join(' ')
}

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
  stroke?: string
}

export function FootVideoFrame({ id, height, stroke = '#111' }: FootVideoFrameProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `foot-clip-${uid}`
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(380)

  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    // Layout width, not getBoundingClientRect — that includes the card's pop-in scale.
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const d = footFramePath(width, height)

  return (
    <div ref={boxRef} className="foot-frame relative w-full" style={{ height }}>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={d} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="foot-frame-media absolute inset-0 bg-[#1a1a1a]"
        style={{ clipPath: `url(#${clipId})`, WebkitClipPath: `url(#${clipId})` }}
      >
        <FootVideo id={id} className="h-full w-full object-cover" />
      </div>

      <svg
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        <path d={d} fill="none" stroke={stroke} strokeWidth={STROKE} strokeLinejoin="round" />
      </svg>
    </div>
  )
}
