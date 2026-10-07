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

const TRACK_LEFT = 4
const TAPE_PAD_Y = 12
const ROLL_UP_MS = 500
const UNROLL_MS = 800

const ease = (t: number) => {
  const c = 1.001
  return t < 0.5 ? (4 * t * t * t) / c : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Sticker tape: a white strip that winds onto a circular spool at the right.
 */
export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const len = useRef(0)
  const full = useRef(0)
  const anim = useRef(0)
  const [shown, setShown] = useState({ key: tabKey, stickers })
  const [scale, setScale] = useState(1)

  const paint = (v: number) => {
    const el = stageRef.current
    if (!el) return
    len.current = v
    const wound = 1 - v
    const tapeH = parseFloat(getComputedStyle(el).getPropertyValue('--tape-h')) || 128
    const d = tapeH * (0.98 + wound * 0.08)
    const w = d + v * Math.max(0, full.current - d)
    el.style.setProperty('--strip-w', `${w.toFixed(2)}px`)
    el.style.setProperty('--roll-w', `${d.toFixed(2)}px`)
    el.style.setProperty('--wound', wound.toFixed(4))
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
      const stripH = stage.querySelector('.tape-strip')?.clientHeight ?? 108
      const tapeH = parseFloat(getComputedStyle(stage).getPropertyValue('--tape-h')) || 128
      const room = Math.max(0, avail - TRACK_LEFT - tapeH - 10)
      const next = Math.min(setH ? (stripH - TAPE_PAD_Y) / setH : 1, setW ? room / setW : 1)
      /* Hairline inset so the cut edge sits just inside the panel. */
      full.current = Math.max(tapeH, avail - 1)
      setScale((s) => (Math.abs(s - next) < 0.002 ? s : next))
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
            style={{ left: TRACK_LEFT, transform: `translateY(-50%) scale(${scale})` }}
          >
            <div className="tape-set">
              {shown.stickers.map((s) => {
                const peeling = peelingId === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`tape-item${peeling ? ' is-peeling' : ''}`}
                    aria-label={`Peel ${s.label} sticker`}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onPeelStart(s, e)
                    }}
                  >
                    <StickerFace def={s} large />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <svg className="tape-roll" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <radialGradient id={`tape-rim-${uid}`} cx="50%" cy="28%" r="62%">
              <stop offset="0" stopColor="#f2f2f2" />
              <stop offset="0.42" stopColor="#d0d0d0" />
              <stop offset="0.78" stopColor="#b4b4b4" />
              <stop offset="1" stopColor="#9c9c9c" />
            </radialGradient>
            <linearGradient id={`tape-core-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e6e6e6" />
              <stop offset="0.38" stopColor="#fafafa" />
              <stop offset="0.62" stopColor="#f3f3f3" />
              <stop offset="1" stopColor="#d8d8d8" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49.6" fill={`url(#tape-rim-${uid})`} />
          <circle
            cx="50"
            cy="50"
            r="49.6"
            fill="none"
            stroke="#c4c4c4"
            strokeWidth="0.7"
          />
          <path
            d="M22 24 A 36 36 0 0 1 78 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.7"
          />
          <circle cx="50" cy="50" r="40.2" fill={`url(#tape-core-${uid})`} />
          <circle cx="50" cy="50" r="40.2" fill="none" stroke="#c8c8c8" strokeWidth="0.55" />
        </svg>
      </div>
    </div>
  )
}
