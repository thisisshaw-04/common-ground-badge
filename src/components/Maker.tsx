import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  CORDS,
  EVENT,
  STICKERS,
  TABS,
  stickerById,
  type BadgeState,
  type BorderId,
  type CordId,
  type PlacedSticker,
  type StickerDef,
  type StickerTab,
} from '../lib/badge'
import { CordSwatch, Lanyard } from './Lanyard'
import { StickerFace } from './StickerFace'

const BADGE_W = 340
const BODY_H = 300

interface MakerProps {
  state: BadgeState
  onChange: (next: BadgeState) => void
  onDone: () => void
  badgeRef: RefObject<HTMLDivElement | null>
}

export function Maker({ state, onChange, onDone, badgeRef }: MakerProps) {
  const [tab, setTab] = useState<StickerTab>('role')
  const [mode, setMode] = useState<'stick' | 'draw'>('stick')
  const [brush, setBrush] = useState<1 | 2 | 3>(2)
  const [, setHistory] = useState<BadgeState[]>([state])
  const drawing = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragUid = useRef<string | null>(null)

  const push = useCallback(
    (next: BadgeState) => {
      onChange(next)
      setHistory((h) => [...h.slice(-30), next])
    },
    [onChange],
  )

  const undo = () => {
    setHistory((h) => {
      if (h.length < 2) return h
      const next = h.slice(0, -1)
      onChange(next[next.length - 1])
      return next
    })
  }

  const clearAll = () => {
    const blank = {
      ...state,
      name: '',
      stickers: [],
      drawingDataUrl: null,
    }
    const c = canvasRef.current
    if (c) {
      const ctx = c.getContext('2d')
      ctx?.clearRect(0, 0, c.width, c.height)
    }
    push(blank)
  }

  const placeSticker = (def: StickerDef) => {
    const placed: PlacedSticker = {
      uid: `${def.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      defId: def.id,
      x: 18 + Math.random() * 50,
      y: 28 + Math.random() * 40,
      rotation: -18 + Math.random() * 36,
      trackId: String(100 + Math.floor(Math.random() * 800)).padStart(3, '0'),
    }
    push({ ...state, stickers: [...state.stickers, placed] })
  }

  const removeSticker = (uid: string) => {
    push({ ...state, stickers: state.stickers.filter((s) => s.uid !== uid) })
  }

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.width = BADGE_W
    c.height = BODY_H
    const ctx = c.getContext('2d')
    if (!ctx) return
    if (state.drawingDataUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = state.drawingDataUrl
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveDrawing = () => {
    const c = canvasRef.current
    if (!c) return
    push({ ...state, drawingDataUrl: c.toDataURL('image/png') })
  }

  const onDrawPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return
    drawing.current = true
    const c = canvasRef.current
    if (!c) return
    c.setPointerCapture(e.pointerId)
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rect = c.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * c.width
    const y = ((e.clientY - rect.top) / rect.height) * c.height
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#ffe600'
    ctx.lineWidth = brush === 1 ? 3 : brush === 2 ? 7 : 14
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const onDrawPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== 'draw') return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rect = c.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * c.width
    const y = ((e.clientY - rect.top) / rect.height) * c.height
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const onDrawPointerUp = () => {
    if (!drawing.current) return
    drawing.current = false
    saveDrawing()
  }

  const onStickerPointerDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    uid: string,
  ) => {
    if (mode === 'draw') return
    e.stopPropagation()
    dragUid.current = uid
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onStickerPointerMove = (
    e: ReactPointerEvent<HTMLButtonElement>,
    uid: string,
  ) => {
    if (dragUid.current !== uid) return
    const body = badgeRef.current?.querySelector('[data-badge-body]')
    if (!body) return
    const rect = body.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onChange({
      ...state,
      stickers: state.stickers.map((s) =>
        s.uid === uid
          ? {
              ...s,
              x: Math.min(88, Math.max(6, x)),
              y: Math.min(88, Math.max(8, y)),
            }
          : s,
      ),
    })
  }

  const onStickerPointerUp = () => {
    if (!dragUid.current) return
    dragUid.current = null
    setHistory((h) => [...h.slice(-30), state])
  }

  const borderClass =
    state.border === 'track'
      ? 'track-border'
      : state.border === 'dashed'
        ? 'dashed-border'
        : 'none-border'

  return (
    <div className="page-light relative flex h-dvh flex-col overflow-hidden">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
        <header className="animate-pop mb-4 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[var(--muted)] uppercase">
              {EVENT.name} · {EVENT.year}
            </p>
            <h1 className="mt-1 text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.08] font-bold tracking-[-0.03em] text-[var(--ink)]">
              Make your badge your own!
            </h1>
          </div>
          <p className="pt-2 text-sm text-[var(--muted)]">Stickers · doodle · lock it in</p>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col-reverse gap-4 overflow-y-auto md:flex-row md:items-stretch md:gap-6 md:overflow-hidden lg:gap-8">
          <section className="animate-pop min-h-0 min-w-0 flex-1 md:overflow-y-auto md:pr-1">
            <div className="mx-auto grid max-w-[640px] grid-cols-2 gap-3 pb-2 sm:gap-3.5 lg:max-w-none">
              <Panel title="Frame" className="col-span-2 sm:col-span-1">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['none', 'None'],
                      ['dashed', 'Dash'],
                      ['track', 'BBox'],
                    ] as [BorderId, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => push({ ...state, border: id })}
                      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-[var(--panel)] ${
                        state.border === id
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/8'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 bg-transparent ${
                          id === 'track'
                            ? 'rounded-sm border border-black'
                            : id === 'dashed'
                              ? 'dashed-border'
                              : 'none-border'
                        }`}
                      />
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Cords" className="col-span-2 sm:col-span-1">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CORDS) as CordId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => push({ ...state, cord: id })}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl bg-[var(--panel)] ${
                        state.cord === id
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/8'
                      }`}
                    >
                      <CordSwatch cord={id} />
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Stickers" className="col-span-2">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id)
                        setMode('stick')
                      }}
                      className={`rounded-lg px-2.5 py-1.5 font-mono text-[10px] tracking-wide ${
                        tab === t.id
                          ? 'bg-black text-white'
                          : 'bg-[var(--panel)] text-[var(--muted)] ring-1 ring-black/8'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
                  {STICKERS.filter((s) => s.tab === tab).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setMode('stick')
                        placeSticker(s)
                      }}
                      className="inline-flex shrink-0 transition hover:-translate-y-0.5 hover:scale-105 active:scale-95"
                    >
                      <StickerFace def={s} />
                    </button>
                  ))}
                </div>
                <div className="hairline mt-3 pt-2">
                  <p className="text-[11px] text-[var(--muted)]">
                    Tap to drop · drag to move · double-click to delete
                  </p>
                </div>
              </Panel>

              <Panel title="Draw" className="col-span-2">
                <div className="flex min-h-[4.5rem] items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      mode === 'draw'
                        ? 'bg-[var(--blue)] text-white'
                        : 'bg-[var(--panel)] text-black/80 ring-1 ring-black/8'
                    }`}
                  >
                    {mode === 'draw' ? 'On' : 'Draw'}
                  </button>
                  {([1, 2, 3] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setBrush(size)
                        setMode('draw')
                      }}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--panel)] ${
                        brush === size && mode === 'draw'
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/8'
                      }`}
                    >
                      <span
                        className="rounded-full bg-black"
                        style={{ width: size * 5, height: size * 5 }}
                      />
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          </section>

          <aside className="animate-pop flex shrink-0 flex-col items-center justify-center md:w-[460px] lg:w-[500px]">
            <div className="flex w-full max-w-[460px] flex-col items-center">
              <Lanyard cord={state.cord} scale={1.4} />
              <div
                ref={badgeRef}
                className={`relative -mt-14 overflow-hidden bg-white shadow-[0_22px_50px_rgba(0,0,0,0.14)] ${borderClass}`}
                style={{ width: BADGE_W }}
              >
                <div className="relative px-4 pt-4 pb-1.5 text-center">
                  <p className="font-display text-[28px] leading-[0.88] font-bold tracking-[-0.03em] text-black uppercase">
                    COMMON
                  </p>
                  <p className="font-display text-[28px] leading-[0.88] font-bold tracking-[-0.03em] text-black uppercase">
                    GROUND
                  </p>
                  <p className="mt-2 font-mono text-[9px] tracking-[0.18em] text-black/40 uppercase">
                    ID · BADGE · {EVENT.year}
                  </p>
                </div>

                <div
                  data-badge-body
                  className="relative mx-3 mb-1 overflow-hidden rounded-sm bg-[#f4f4f2]"
                  style={{ height: BODY_H }}
                >
                  <input
                    value={state.name}
                    onChange={(e) => onChange({ ...state, name: e.target.value })}
                    onBlur={() => push(state)}
                    placeholder="tap to write your name"
                    maxLength={22}
                    className="font-hand absolute top-3 left-1/2 z-20 w-[88%] -translate-x-1/2 bg-transparent text-center text-4xl text-black outline-none placeholder:text-black/30"
                  />

                  <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 z-10 h-full w-full ${
                      mode === 'draw' ? 'cursor-crosshair' : 'pointer-events-none'
                    }`}
                    onPointerDown={onDrawPointerDown}
                    onPointerMove={onDrawPointerMove}
                    onPointerUp={onDrawPointerUp}
                    onPointerLeave={onDrawPointerUp}
                  />

                  {state.stickers.map((s) => {
                    const def = stickerById(s.defId)
                    if (!def) return null
                    return (
                      <button
                        key={s.uid}
                        type="button"
                        className="absolute z-30 touch-none select-none"
                        style={{
                          left: `${s.x}%`,
                          top: `${s.y}%`,
                          transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                        }}
                        onPointerDown={(e) => onStickerPointerDown(e, s.uid)}
                        onPointerMove={(e) => onStickerPointerMove(e, s.uid)}
                        onPointerUp={onStickerPointerUp}
                        onDoubleClick={() => removeSticker(s.uid)}
                      >
                        <span className="relative inline-block">
                          <span className="track-label absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
                            ID: {s.trackId}
                          </span>
                          <StickerFace def={def} compact />
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-end justify-between gap-3 px-4 pt-2 pb-4">
                  <p className="font-display text-left text-[11px] leading-tight font-bold tracking-wide text-black uppercase">
                    {EVENT.subtitle}
                  </p>
                  <p className="font-mono text-[8px] tracking-[0.14em] text-black/40 uppercase">
                    {EVENT.date}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={undo}
                  className="flex-1 rounded-full bg-white py-2.5 text-sm font-semibold text-black shadow-sm ring-1 ring-black/10"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex-1 rounded-full bg-white/70 py-2.5 text-sm font-semibold text-black/70 ring-1 ring-black/10"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onDone}
                  className="flex-[1.35] rounded-full bg-[var(--blue)] py-2.5 text-sm font-semibold text-white shadow-[0_4px_0_#2a3fc7] transition active:translate-y-0.5 active:shadow-none"
                >
                  I&apos;m done!
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <EventBar />
    </div>
  )
}

function EventBar() {
  return (
    <div className="event-bar relative z-20 shrink-0 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] sm:text-sm">
        <p className="font-semibold tracking-tight">
          <span className="font-display italic font-medium">{EVENT.name}</span>
          <span className="mx-2 font-black uppercase">{EVENT.subtitle}</span>
        </p>
        <p className="font-mono text-[11px] tracking-wide text-black/70 uppercase sm:text-xs">
          {EVENT.date} · {EVENT.year} · {EVENT.place}
        </p>
      </div>
    </div>
  )
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`panel px-4 py-3.5 ${className}`}>
      <p className="panel-title mb-2.5">{title}</p>
      {children}
    </div>
  )
}

export { BADGE_W }
