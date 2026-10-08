import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { StickerDef } from '../lib/badge'
import { StickerFace } from './StickerFace'

interface StickerRollProps {
  tabKey: string
  stickers: StickerDef[]
  peelingId?: string | null
  onPeelStart: (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => void
}

const TAPE_H = 96
/** Remaining spool on the right. Curve is both top and bottom so no square sits on the core. */
const ROLL = 72
const CURVE = 28
const SQUASH = 0.48
const CUT = 2
const PAD = 14
const CLOSE_MS = 280
const OPEN_MS = 560

const capH = ROLL * SQUASH
const hang = capH * 0.62

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t

export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const feed = useRef(0)
  const full = useRef(0)
  const anim = useRef(0)
  const [shown, setShown] = useState({ key: tabKey, stickers })
  const [fit, setFit] = useState({ scale: 1, copies: 1 })

  const paint = (v: number) => {
    const el = stageRef.current
    if (!el) return
    feed.current = v
    el.style.setProperty('--strip-w', `${(v * Math.max(0, full.current)).toFixed(2)}px`)
  }

  const run = (to: number, ms: number, ease: (t: number) => number) =>
    new Promise<boolean>((resolve) => {
      const id = ++anim.current
      const from = feed.current
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
      const set = track.firstElementChild as HTMLElement | null
      const setW = set?.offsetWidth ?? 0
      const setH = set?.offsetHeight ?? 0
      full.current = Math.max(0, stage.clientWidth - CUT)
      const roomH = TAPE_H - 18
      const scale = Math.min(1, setH ? roomH / setH : 1)
      const span = Math.max(setW * scale, 1)
      const copies = Math.max(2, Math.ceil((full.current + ROLL * 0.6) / span))
      setFit((f) =>
        Math.abs(f.scale - scale) < 0.002 && f.copies === copies ? f : { scale, copies },
      )
      paint(feed.current)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [shown])

  useEffect(() => {
    if (tabKey === shown.key) {
      if (feed.current < 1) void run(1, OPEN_MS, easeOut)
      return
    }
    let cancelled = false
    void (async () => {
      const ok = await run(0.08, CLOSE_MS, easeIn)
      if (!ok || cancelled) return
      setShown({ key: tabKey, stickers })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey, shown.key])

  useEffect(() => () => void ++anim.current, [])

  return (
    <div className="tape-bed">
      <div
        ref={stageRef}
        className="tape-stage"
        aria-label="Sticker tape"
        style={
          {
            '--tape-h': `${TAPE_H}px`,
            '--roll-d': `${ROLL}px`,
            '--curve': `${CURVE}px`,
            '--cap-h': `${capH}px`,
            '--hang': `${hang}px`,
          } as CSSProperties
        }
      >
        <div className="tape-strip">
          <div
            ref={trackRef}
            className="tape-track"
            style={{
              left: PAD,
              transform: `translateY(-50%) scale(${fit.scale})`,
              transformOrigin: 'left center',
            }}
          >
            {Array.from({ length: fit.copies }, (_, copy) => (
              <div key={copy} className="tape-set">
                {shown.stickers.map((s) => {
                  const peeling = peelingId === s.id
                  return (
                    <button
                      key={`${copy}-${s.id}`}
                      type="button"
                      className={`tape-item${peeling ? ' is-peeling' : ''}`}
                      aria-label={`Peel ${s.label} sticker`}
                      tabIndex={copy > 0 ? -1 : undefined}
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
            ))}
          </div>
          <span className="tape-shine" />
        </div>
        <div className="tape-roll" aria-hidden>
          <svg className="tape-roll-paper" viewBox="0 0 72 36" preserveAspectRatio="none">
            <ellipse cx="36" cy="18" rx="35.6" ry="17.2" fill="#ffffff" />
          </svg>
          <svg className="tape-roll-hole" viewBox="0 0 72 36" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tape-tube" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9a9a9a" />
                <stop offset="45%" stopColor="#c8c8c8" />
                <stop offset="100%" stopColor="#f7f7f7" />
              </linearGradient>
            </defs>
            <ellipse cx="36" cy="18.4" rx="24.2" ry="11.2" fill="#d6d6d6" />
            <ellipse cx="36" cy="18.6" rx="21.4" ry="9.6" fill="url(#tape-tube)" />
            <ellipse cx="36" cy="14.8" rx="12" ry="3" fill="#fff" opacity="0.42" />
          </svg>
        </div>
      </div>
    </div>
  )
}
