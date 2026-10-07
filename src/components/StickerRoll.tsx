import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { StickerDef } from '../lib/badge'
import { StickerFace } from './StickerFace'

interface StickerRollProps {
  /** Changes when the category changes — triggers roll-up → swap → unroll. */
  tabKey: string
  stickers: StickerDef[]
  peelingId?: string | null
  onPeelStart: (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => void
}

const ROLL_MIN = 64
const ROLL_MAX = 88
const TRACK_LEFT = 12
const MAX_STICKER_H = 56
const ROLL_UP_MS = 500
const UNROLL_MS = 800

const ease = (t: number) => {
  const c = 1.001
  return t < 0.5 ? (4 * t * t * t) / c : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * FigBuild-style sticker tape: a white strip with a rounded top-right that
 * collapses onto the roll. The roll fattens and shows extra paper layers as
 * tape winds on, then thins again as it unrolls.
 */
export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const len = useRef(0)
  const full = useRef(0)
  const anim = useRef(0)
  const [shown, setShown] = useState({ key: tabKey, stickers })
  const [fit, setFit] = useState({ scale: 1, copies: 1 })

  const paint = (v: number) => {
    const el = stageRef.current
    if (!el) return
    len.current = v
    const wound = 1 - v
    // Wound tape area grows linearly, so diameter grows with its square root.
    const d = Math.sqrt(ROLL_MIN * ROLL_MIN + wound * (ROLL_MAX * ROLL_MAX - ROLL_MIN * ROLL_MIN))
    const w = d + v * Math.max(0, full.current - d)
    el.style.setProperty('--strip-w', `${w.toFixed(2)}px`)
    el.style.setProperty('--roll-w', `${d.toFixed(2)}px`)
    el.style.setProperty('--wound', wound.toFixed(4))
    el.style.setProperty('--spin', `${(-wound * Math.max(full.current, 1) * 0.28).toFixed(2)}px`)
  }

  const run = (to: number, ms: number) =>
    new Promise<boolean>((resolve) => {
      const id = ++anim.current
      const from = len.current
      const start = performance.now()
      const tick = (now: number) => {
        if (id !== anim.current) return resolve(false)
        const t = Math.min(1, (now - start) / ms)
        paint(from + (to - from) * ease(t))
        if (t < 1) requestAnimationFrame(tick)
        else resolve(true)
      }
      requestAnimationFrame(tick)
    })

  useLayoutEffect(() => {
    const stage = stageRef.current
    const track = trackRef.current
    if (!stage || !track) return
    const measure = () => {
      const avail = stage.clientWidth
      const set = track.firstElementChild as HTMLElement | null
      const setW = set?.offsetWidth ?? 0
      const setH = set?.offsetHeight ?? 0
      const room = Math.max(0, avail - TRACK_LEFT - 8)
      const scale = Math.min(1, setW ? room / setW : 1, setH ? MAX_STICKER_H / setH : 1)
      const copies = setW ? Math.max(1, Math.ceil((avail + ROLL_MAX) / (setW * scale))) : 1
      /* Leave a sliver so the cut (left) edge of the tape sits inside the panel. */
      full.current = Math.max(ROLL_MAX, avail - 8)
      setFit((f) => (f.scale === scale && f.copies === copies ? f : { scale, copies }))
      paint(len.current)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [shown])

  useEffect(() => {
    if (tabKey === shown.key) {
      if (len.current < 1) void run(1, UNROLL_MS)
      return
    }
    let cancelled = false
    void (async () => {
      const ok = await run(0, ROLL_UP_MS)
      if (!ok || cancelled) return
      setShown({ key: tabKey, stickers })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey, shown.key])

  useEffect(() => () => void ++anim.current, [])

  const uid = shown.key.replace(/[^a-z0-9]/gi, '') || 'roll'

  return (
    <div className="tape-bed">
      <div ref={stageRef} className="tape-stage" aria-label="Sticker tape">
        <div className="tape-strip">
          <div
            ref={trackRef}
            className="tape-track"
            style={{ left: TRACK_LEFT, transform: `translateY(-50%) scale(${fit.scale})` }}
          >
            {Array.from({ length: fit.copies }, (_, copy) => (
              <div key={copy} className="tape-set" aria-hidden={copy > 0 || undefined}>
                {shown.stickers.map((s) => {
                  const peeling = peelingId === s.id
                  return (
                    <button
                      key={s.id}
                      tabIndex={copy > 0 ? -1 : undefined}
                      type="button"
                      className={`tape-item${peeling ? ' is-peeling' : ''}`}
                      aria-label={`Peel ${s.label} sticker`}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onPeelStart(s, e)
                      }}
                    >
                      <StickerFace def={s} />
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="tape-roll" aria-hidden>
          <span className="tape-roll-cyl" />
          <svg className="tape-roll-end" viewBox="0 0 64 18" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`tape-paper-${uid}`} cx="50%" cy="40%" r="55%">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.62" stopColor="#f2f2f2" />
                <stop offset="1" stopColor="#d4d4d4" />
              </radialGradient>
              <linearGradient id={`tape-core-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5e5e5e" />
                <stop offset="0.42" stopColor="#8d8d8d" />
                <stop offset="1" stopColor="#f4f4f4" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="9" rx="31.6" ry="8.6" fill={`url(#tape-paper-${uid})`} />
            <ellipse cx="32" cy="9" rx="24" ry="6.5" fill={`url(#tape-core-${uid})`} />
          </svg>
          <span className="tape-roll-shine" />
        </div>
      </div>
    </div>
  )
}
