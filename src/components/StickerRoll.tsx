import {
  useEffect,
  useId,
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

/** Slimmer strip — stickers still fit via measure() scale. */
const TAPE_H = 62
/** Sideways 3/4 roll: wrap on the right, shiny oval core hanging under that end. */
const CURVE = 18
const OVERLAP = 7
const CUT = 2
const PAD = 10
const CLOSE_MS = 280
const OPEN_MS = 560
/** Rest spool; outer rim widens a little while winding. Hub size stays fixed. */
const ROLL_W_OUT = 64
const ROLL_W_IN = 74
const CAP_H = 20
/** Fixed hub width — never stretches with the rim. */
const HUB_W = 24
const hang = 12

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeIn = (t: number) => t * t * t

export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const gid = useId().replace(/:/g, '')
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
    const remain = 1 - Math.min(1, Math.max(0, v))
    const w = ROLL_W_OUT + remain * (ROLL_W_IN - ROLL_W_OUT)
    el.style.setProperty('--roll-now', `${w.toFixed(2)}px`)
    el.style.setProperty('--cap-now', `${CAP_H}px`)
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
      const roomH = TAPE_H - 10
      const scale = Math.min(1, setH ? roomH / setH : 1)
      const span = Math.max(setW * scale, 1)
      const copies = Math.max(2, Math.ceil((full.current + ROLL_W_IN * 0.6) / span))
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
            '--roll-now': `${ROLL_W_OUT}px`,
            '--cap-now': `${CAP_H}px`,
            '--hub-w': `${HUB_W}px`,
            '--curve': `${CURVE}px`,
            '--overlap': `${OVERLAP}px`,
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
          <span className="tape-wrap" />
        </div>
        <div className="tape-roll" aria-hidden>
          {/* Outer rim stretches with --roll-now; hub is a separate fixed-size layer. */}
          <svg className="tape-roll-end" viewBox="0 0 96 22" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`${gid}-rim`} cx="42%" cy="32%" r="78%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="38%" stopColor="#f7f7fa" />
                <stop offset="68%" stopColor="#e4e4ea" />
                <stop offset="100%" stopColor="#c8c8d0" />
              </radialGradient>
              <linearGradient id={`${gid}-gloss`} x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>
              <mask id={`${gid}-ring`}>
                <ellipse cx="48" cy="11" rx="48" ry="10.4" fill="#fff" />
                <ellipse cx="48" cy="11.2" rx="17.5" ry="4.2" fill="#000" />
              </mask>
            </defs>
            <ellipse cx="48" cy="14.6" rx="43" ry="7.6" fill="#111111" opacity="0.12" />
            <ellipse cx="48" cy="11" rx="48" ry="10.4" fill={`url(#${gid}-rim)`} />
            <ellipse
              cx="48"
              cy="14.4"
              rx="36"
              ry="6.2"
              fill={`url(#${gid}-gloss)`}
              mask={`url(#${gid}-ring)`}
            />
          </svg>
          <svg className="tape-roll-hub" viewBox="0 0 35 22" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id={`${gid}-core`} cx="48%" cy="40%" r="72%">
                <stop offset="0%" stopColor="#7a7a82" />
                <stop offset="55%" stopColor="#9a9aa2" />
                <stop offset="100%" stopColor="#b8b8be" />
              </radialGradient>
            </defs>
            <ellipse cx="17.5" cy="11.2" rx="17.5" ry="4.2" fill={`url(#${gid}-core)`} />
            <ellipse
              cx="17.5"
              cy="10.6"
              rx="16.2"
              ry="3.7"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
