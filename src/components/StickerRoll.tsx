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
/** Cylinder diameter = strip height. */
const ROLL = TAPE_H
/** End-cap, slightly smaller than the outer tape, squashed as if looking slightly down. */
const OVAL_W = Math.round(ROLL * 0.88)
const SQUASH = 0.4
const CUT = 2
const PAD = 14
const CLOSE_MS = 280
const OPEN_MS = 560

const capH = OVAL_W * SQUASH
const hang = capH * 0.72

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t

export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const feed = useRef(0)
  const full = useRef(0)
  const anim = useRef(0)
  const [shown, setShown] = useState({ key: tabKey, stickers })
  const [scale, setScale] = useState(1)

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
      const setH = set?.offsetHeight ?? 0
      full.current = Math.max(0, stage.clientWidth - CUT)
      const roomH = TAPE_H - 18
      const next = Math.min(1, setH ? roomH / setH : 1)
      setScale((s) => (Math.abs(s - next) < 0.002 ? s : next))
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
            '--oval-w': `${OVAL_W}px`,
            '--cap-h': `${capH}px`,
            '--hang': `${hang}px`,
            '--item-scale': String(scale),
          } as CSSProperties
        }
      >
        <div className="tape-strip">
          <div
            ref={trackRef}
            className="tape-track"
            style={{
              left: PAD,
              right: 0,
              transform: 'translateY(-50%)',
            }}
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
          <span className="tape-shine" />
        </div>
        <div className="tape-roll" aria-hidden>
          <svg className="tape-roll-svg" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <radialGradient id="tape-face" cx="50%" cy="30%" r="72%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="70%" stopColor="#f2f2f2" />
                <stop offset="100%" stopColor="#d8d8d8" />
              </radialGradient>
              <radialGradient id="tape-bowl" cx="50%" cy="80%" r="68%">
                <stop offset="0%" stopColor="#ececec" />
                <stop offset="38%" stopColor="#d0d0d0" />
                <stop offset="72%" stopColor="#9c9c9c" />
                <stop offset="100%" stopColor="#6a6a6a" />
              </radialGradient>
            </defs>
            <ellipse cx="50" cy="20.4" rx="49.5" ry="18.2" fill="#d8d8d8" />
            <ellipse cx="50" cy="19.2" rx="49.5" ry="18.2" fill="url(#tape-face)" />
            <ellipse cx="50" cy="19.6" rx="40" ry="13.8" fill="url(#tape-bowl)" />
            <ellipse cx="50" cy="13.8" rx="21" ry="3.6" fill="#fff" opacity="0.4" />
          </svg>
        </div>
      </div>
    </div>
  )
}
