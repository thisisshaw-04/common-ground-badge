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

const ROLL_D = 34
const TRACK_LEFT = 12
const STRIP_PAD = 12
const MAX_STICKER_H = 54
const ROLL_GROW = 22
const ROLL_UP_MS = 520
const UNROLL_MS = 900

const easeIn = (t: number) => t * t * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

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
  const [fit, setFit] = useState({ scale: 1, height: 64 })

  const paint = (v: number) => {
    const el = stageRef.current
    if (!el) return
    len.current = v
    const wound = 1 - v
    el.style.setProperty('--strip-w', `${(v * full.current).toFixed(2)}px`)
    el.style.setProperty('--roll-d', `${(ROLL_D + wound * ROLL_GROW).toFixed(2)}px`)
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
      const natural = track.offsetWidth
      const naturalH = track.offsetHeight
      const room = avail - TRACK_LEFT - ROLL_D / 2 - 6
      const scale = Math.min(1, natural ? room / natural : 1, naturalH ? MAX_STICKER_H / naturalH : 1)
      // Unroll only as much tape as this category needs.
      full.current = Math.min(avail, TRACK_LEFT + natural * scale + ROLL_D / 2 + 14)
      setFit({ scale, height: MAX_STICKER_H })
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
      const ok = await run(0, ROLL_UP_MS * Math.max(0.25, len.current), easeIn)
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
                <StickerFace def={s} />
              </button>
            )
          })}
        </div>
      </div>
      <span className="tape-roll" aria-hidden>
        <span className="tape-roll-cap" />
      </span>
    </div>
    </div>
  )
}
