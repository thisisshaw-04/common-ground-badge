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
  /** Changes when the category changes — triggers wind → swap → unroll. */
  tabKey: string
  stickers: StickerDef[]
  peelingId?: string | null
  onPeelStart: (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => void
}

/** Strip height — large enough for StickerFace `large` labels to read. */
const TAPE_H = 96
/** Outer paper diameter when the strip is fully out (thin remaining wrap). */
const ROLL_MIN = 102
/** Outer paper diameter when the strip is fully wound on. */
const ROLL_MAX = 116
/** Cardboard tube outer diameter — never animates. */
const CORE = 52
/** Tube hole — never animates. */
const HOLE = 26
/** Visible cylinder thickness on the right (¾ view). */
const RIM = 10
const CUT = 2
const TRACK_PAD = 10
const ROLL_UP_MS = 520
const UNROLL_MS = 840

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Washi tape: a paper strip of unique stickers feeding a side-on spool.
 * The spool is a round face (kraft core + hole) with a short ¾ rim.
 * Core and hole stay put; only the wound paper ring grows and shrinks.
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
    const rollD = ROLL_MIN + wound * (ROLL_MAX - ROLL_MIN)
    const faceCx = RIM + ROLL_MAX / 2
    const stripRight = faceCx - rollD / 2
    const w = v * Math.max(0, full.current)
    el.style.setProperty('--strip-w', `${w.toFixed(2)}px`)
    el.style.setProperty('--strip-right', `${stripRight.toFixed(2)}px`)
    el.style.setProperty('--roll-d', `${rollD.toFixed(2)}px`)
    el.style.setProperty('--wound', wound.toFixed(4))
    el.style.setProperty('--spin', `${(wound * 28).toFixed(2)}px`)
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
      const faceCx = RIM + ROLL_MAX / 2
      const stripRight = faceCx - ROLL_MIN / 2
      full.current = Math.max(0, avail - stripRight - CUT)
      const roomW = Math.max(0, full.current - TRACK_PAD * 2)
      const roomH = TAPE_H - 18
      const next = Math.min(1, setH ? roomH / setH : 1, setW ? roomW / setW : 1)
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
            '--rim': `${RIM}px`,
            '--core': `${CORE}px`,
            '--hole': `${HOLE}px`,
            '--face-cx': `${RIM + ROLL_MAX / 2}px`,
          } as CSSProperties
        }
      >
        <div className="tape-strip">
          <div
            ref={trackRef}
            className="tape-track"
            style={{
              left: TRACK_PAD,
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

        <div className="tape-spool" aria-hidden>
          <span className="tape-spool-rim" />
          <span className="tape-spool-face">
            <span className="tape-spool-paper" />
            <span className="tape-spool-core" />
            <span className="tape-spool-hole" />
            <span className="tape-spool-glint" />
          </span>
        </div>
      </div>
    </div>
  )
}
