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
const ROLL_MIN = 88
const ROLL_MAX = 104
const CORE = 40
const HOLE = 22
const CUT = 2
const PAD = 12
const CLOSE_MS = 280
const OPEN_MS = 560

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
    const wound = 1 - v
    const rollD = ROLL_MIN + wound * (ROLL_MAX - ROLL_MIN)
    const stripRight = ROLL_MAX / 2 - rollD / 2
    el.style.setProperty('--strip-w', `${(v * Math.max(0, full.current)).toFixed(2)}px`)
    el.style.setProperty('--strip-right', `${stripRight.toFixed(2)}px`)
    el.style.setProperty('--roll-d', `${rollD.toFixed(2)}px`)
    el.style.setProperty('--wound', wound.toFixed(4))
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
      const stripRight = ROLL_MAX / 2 - ROLL_MIN / 2
      full.current = Math.max(0, stage.clientWidth - stripRight - CUT)
      const roomW = Math.max(0, full.current - PAD - ROLL_MIN * 0.5)
      const roomH = TAPE_H - 22
      const next = Math.min(1, setH ? roomH / setH : 1, setW ? roomW / setW : 1)
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
      const ok = await run(0.06, CLOSE_MS, easeIn)
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
            '--roll-max': `${ROLL_MAX}px`,
            '--roll-d': `${ROLL_MIN}px`,
            '--core': `${CORE}px`,
            '--hole': `${HOLE}px`,
          } as CSSProperties
        }
      >
        <div className="tape-strip">
          <div
            ref={trackRef}
            className="tape-track"
            style={{
              left: PAD,
              transform: `translateY(-50%) scale(${scale})`,
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
        </div>
        <div className="tape-roll" aria-hidden>
          <span className="tape-roll-paper" />
          <span className="tape-roll-core" />
          <span className="tape-roll-hole" />
        </div>
      </div>
    </div>
  )
}
