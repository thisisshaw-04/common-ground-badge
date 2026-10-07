import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { TABS, type StickerDef } from '../lib/badge'
import { StickerFace } from './StickerFace'

interface StickerRollProps {
  tabKey: string
  stickers: StickerDef[]
  peelingId?: string | null
  onPeelStart: (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => void
}

const TAPE_H = 92
const ROLL_MIN = 78
const ROLL_MAX = 96
const CORE = 36
const HOLE = 18
const RIM = 14
const CUT = 3
const TRACK_PAD = 12
const CLOSE_MS = 260
const OPEN_MS = 540

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ease into the spool — tape accelerates as it winds on. */
const closeEase = (t: number) => t * t * t

/** Feed out with a short elastic settle, not a UI slide. */
const openEase = (t: number) => {
  const p = 1 - Math.pow(1 - t, 3)
  if (t < 0.78) return p
  const u = (t - 0.78) / 0.22
  return p + Math.sin(u * Math.PI) * 0.055 * (1 - u)
}

function tabLabel(key: string) {
  return TABS.find((t) => t.id === key)?.label ?? key.toUpperCase()
}

function tabTone(key: string): 'orange' | 'lavender' {
  const i = TABS.findIndex((t) => t.id === key)
  return i % 2 === 0 ? 'orange' : 'lavender'
}

/**
 * Physical label dispenser. Compact spool at rest; category changes wind
 * the tongue in, swap the die-cuts, then feed them back out with inertia.
 */
export function StickerRoll({ tabKey, stickers, peelingId = null, onPeelStart }: StickerRollProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const feed = useRef(0)
  const full = useRef(0)
  const spin = useRef(0)
  const anim = useRef(0)
  const [shown, setShown] = useState({ key: tabKey, stickers })
  const [scale, setScale] = useState(1)

  const paint = (v: number, extraSpin = 0) => {
    const el = stageRef.current
    if (!el) return
    feed.current = v
    const wound = 1 - v
    const rollD = ROLL_MIN + wound * (ROLL_MAX - ROLL_MIN)
    const faceCx = RIM + ROLL_MAX / 2
    const stripRight = faceCx - rollD / 2
    const w = v * Math.max(0, full.current)
    spin.current += extraSpin
    el.style.setProperty('--strip-w', `${w.toFixed(2)}px`)
    el.style.setProperty('--strip-right', `${stripRight.toFixed(2)}px`)
    el.style.setProperty('--roll-d', `${rollD.toFixed(2)}px`)
    el.style.setProperty('--wound', wound.toFixed(4))
    el.style.setProperty('--spin', `${spin.current.toFixed(2)}deg`)
  }

  const run = (to: number, ms: number, ease: (t: number) => number, spinDir: number) =>
    new Promise<boolean>((resolve) => {
      const id = ++anim.current
      const from = feed.current
      const start = performance.now()
      let last = from
      const tick = (now: number) => {
        if (id !== anim.current) return resolve(false)
        const t = Math.min(1, (now - start) / ms)
        const next = from + (to - from) * ease(t)
        paint(next, (next - last) * spinDir * 210)
        last = next
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
      const reserved = ROLL_MIN * 0.48
      const roomW = Math.max(0, full.current - TRACK_PAD - reserved)
      const roomH = TAPE_H - 20
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
      if (feed.current < 1) {
        if (prefersReduced()) paint(1)
        else void run(1, OPEN_MS, openEase, 1)
      }
      return
    }
    let cancelled = false
    void (async () => {
      if (prefersReduced()) {
        setShown({ key: tabKey, stickers })
        return
      }
      const okClose = await run(0.08, CLOSE_MS, closeEase, -1)
      if (!okClose || cancelled) return
      setShown({ key: tabKey, stickers })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey, shown.key])

  useEffect(() => () => void ++anim.current, [])

  const cat = tabLabel(shown.key)
  const tone = tabTone(shown.key)

  return (
    <div className="tape-bed">
      <div
        ref={stageRef}
        className="tape-stage"
        aria-label={`${cat} sticker tape`}
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
              <span className={`tape-cat tape-cat-${tone}`} aria-hidden>
                {cat}
              </span>
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
          <span className="tape-spool-shadow" />
          <span className="tape-spool-barrel" />
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
