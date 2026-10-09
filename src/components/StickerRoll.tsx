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

const TAPE_H = 84
/** Sideways 3/4 roll: wrap on the right, shiny oval core hanging under that end. */
const ROLL = 74
const CURVE = 22
const CAP_H = 32
const OVERLAP = 7
const CUT = 2
const PAD = 12
const CLOSE_MS = 280
const OPEN_MS = 560

const hang = CAP_H - OVERLAP

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
            '--cap-h': `${CAP_H}px`,
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
          <svg className="tape-roll-end" viewBox="0 0 74 32" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`${gid}-rim`} cx="42%" cy="32%" r="78%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="38%" stopColor="#f7f7fa" />
                <stop offset="68%" stopColor="#e4e4ea" />
                <stop offset="100%" stopColor="#c8c8d0" />
              </radialGradient>
              <radialGradient id={`${gid}-core`} cx="48%" cy="40%" r="72%">
                <stop offset="0%" stopColor="#7a7a82" />
                <stop offset="55%" stopColor="#9a9aa2" />
                <stop offset="100%" stopColor="#b8b8be" />
              </radialGradient>
              <linearGradient id={`${gid}-gloss`} x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>
              <mask id={`${gid}-ring`}>
                <ellipse cx="37" cy="15" rx="37" ry="15" fill="#fff" />
                <ellipse cx="37" cy="15.2" rx="17.5" ry="7.1" fill="#000" />
              </mask>
            </defs>
            <ellipse cx="37" cy="20" rx="34" ry="13" fill="#111111" opacity="0.12" />
            <ellipse cx="37" cy="15" rx="37" ry="15" fill={`url(#${gid}-rim)`} />
            <ellipse
              cx="37"
              cy="19"
              rx="28"
              ry="9"
              fill={`url(#${gid}-gloss)`}
              mask={`url(#${gid}-ring)`}
            />
            <ellipse cx="37" cy="15.2" rx="17.5" ry="7.1" fill={`url(#${gid}-core)`} />
            <ellipse
              cx="37"
              cy="14.4"
              rx="16.2"
              ry="6.4"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.55"
              strokeWidth="1.3"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
