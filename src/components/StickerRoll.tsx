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
    /* Cardboard core stays put. Only the paper ring grows as tape winds on. */
    const coreD = tapeH * 0.56
    const ring = tapeH * (0.055 + wound * 0.2)
    const outerD = Math.max(tapeH, coreD + ring * 2)
    const coreVb = (50 * (coreD / outerD)).toFixed(3)
    const w = outerD + v * Math.max(0, full.current - outerD)
    el.style.setProperty('--strip-w', `${w.toFixed(2)}px`)
    el.style.setProperty('--roll-w', `${outerD.toFixed(2)}px`)
    el.style.setProperty('--core-vb', coreVb)
    el.style.setProperty('--wound', wound.toFixed(4))
    const rx = coreVb
    const ry = (Number(coreVb) * 0.78).toFixed(3)
    el.querySelectorAll('.tape-roll-hole').forEach((hole) => {
      hole.setAttribute('rx', rx)
      hole.setAttribute('ry', ry)
    })
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
        <svg className="tape-roll" viewBox="0 0 100 100" shapeRendering="geometricPrecision" aria-hidden>
          <defs>
            <radialGradient id={`tape-rim-${uid}`} cx="48%" cy="28%" r="70%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#f3f3f3" />
              <stop offset="1" stopColor="#e4e4e4" />
            </radialGradient>
            <radialGradient id={`tape-hole-${uid}`} cx="50%" cy="36%" r="68%">
              <stop offset="0" stopColor="#3a3a3a" />
              <stop offset="0.42" stopColor="#7a7a7a" />
              <stop offset="1" stopColor="#d4d4d4" />
            </radialGradient>
            <mask id={`tape-donut-${uid}`} maskUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#000" />
              <circle cx="50" cy="50" r="50" fill="#fff" />
              <ellipse className="tape-roll-hole" cx="50" cy="50" rx="37" ry="28.9" fill="#000" />
            </mask>
          </defs>
          <ellipse
            className="tape-roll-hole"
            cx="50"
            cy="50"
            rx="37"
            ry="28.9"
            fill={`url(#tape-hole-${uid})`}
          />
          <circle
            cx="50"
            cy="50"
            r="50"
            fill={`url(#tape-rim-${uid})`}
            mask={`url(#tape-donut-${uid})`}
          />
        </svg>
      </div>
    </div>
  )
}
