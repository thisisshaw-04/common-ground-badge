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

const ROLL_D = 64
const TRACK_LEFT = 18
const STRIP_PAD = 28
const MAX_STICKER_H = 58
const ROLL_GROW = 8
const ROLL_UP_MS = 700
const UNROLL_MS = 1050

const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

/**
 * Sticker tape on a roll. The strip's free end travels with the stickers, the
 * roll spins in step with the tape length and thickens as tape winds onto it.
 */
export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const len = useRef(0)
  const full = useRef(0)
  const anim = useRef(0)
  const [shown, setShown] = useState({ key: tabKey, stickers })
  const [fit, setFit] = useState({ scale: 1, height: 64, copies: 1 })

  const paint = (v: number) => {
    const el = stageRef.current
    if (!el) return
    len.current = v
    const wound = 1 - v
    el.style.setProperty('--strip-w', `${(v * full.current).toFixed(2)}px`)
    // Wound tape area grows linearly, so diameter grows with its square root.
    const d = Math.sqrt(ROLL_D * ROLL_D + wound * ((ROLL_D + ROLL_GROW) ** 2 - ROLL_D * ROLL_D))
    el.style.setProperty('--roll-d', `${d.toFixed(2)}px`)
    el.style.setProperty('--spin', `${(-wound * full.current).toFixed(2)}px`)
  }

  const run = (to: number, ms: number, ease: (t: number) => number) =>
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
      const avail = Math.max(0, stage.clientWidth - ROLL_D / 2)
      const set = track.firstElementChild as HTMLElement | null
      const setW = set?.offsetWidth ?? 0
      const setH = set?.offsetHeight ?? 0
      const room = avail - TRACK_LEFT - ROLL_D / 2 - 6
      const scale = Math.min(1, setW ? room / setW : 1, setH ? MAX_STICKER_H / setH : 1)
      // Repeat the set so the tape is filled right up to (and under) the roll.
      const copies = setW ? Math.max(1, Math.ceil((avail - TRACK_LEFT + ROLL_D / 2) / (setW * scale))) : 1
      full.current = avail
      setFit((f) =>
        f.scale === scale && f.copies === copies ? f : { scale, height: MAX_STICKER_H, copies },
      )
      paint(len.current)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [shown])

  useEffect(() => {
    if (tabKey === shown.key) {
      if (len.current < 1) void run(1, UNROLL_MS, easeOut)
      return
    }
    let cancelled = false
    void (async () => {
      const ok = await run(0, ROLL_UP_MS * Math.max(0.3, len.current), easeInOut)
      if (!ok || cancelled) return
      setShown({ key: tabKey, stickers })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey, shown.key])

  useEffect(() => () => void ++anim.current, [])

  const tapeH = fit.height + STRIP_PAD

  return (
    <div className="tape-bed">
    <div
      ref={stageRef}
      className="tape-stage"
      style={{ height: tapeH }}
      aria-label="Sticker tape"
    >
      <div className="tape-strip" style={{ height: tapeH }}>
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
      <span className="tape-roll" aria-hidden>
        <span className="tape-roll-cap" />
      </span>
    </div>
    </div>
  )
}
