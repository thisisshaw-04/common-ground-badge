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
  FIELDS,
  STICKERS,
  TABS,
  stickerById,
  type BadgeState,
  type BorderId,
  type CordId,
  type FieldId,
  type PlacedSticker,
  type StickerDef,
  type StickerTab,
} from '../lib/badge'
import { CordSwatch, Lanyard } from './Lanyard'

const BADGE_W = 260
const BODY_H = 240

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
      rotation: -14 + Math.random() * 28,
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

  const field = FIELDS[state.field]
  const cord = CORDS[state.cord]
  const borderClass =
    state.border === 'track'
      ? 'track-border'
      : state.border === 'dashed'
        ? 'dashed-border'
        : 'none-border'

  return (
    <div className="page-black relative flex h-dvh flex-col overflow-hidden">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col px-4 pt-4 pb-2 sm:px-6 sm:pt-5">
        <header className="animate-pop relative z-10 mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase">
              {EVENT.name} · {EVENT.year}
            </p>
            <h1 className="font-display mt-1 text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05] font-bold tracking-[-0.02em] text-white">
              make your badge
            </h1>
          </div>
          <p className="font-display pt-2 text-sm text-white/55 italic">— and more.</p>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col-reverse gap-4 overflow-y-auto md:flex-row md:items-center md:gap-6 md:overflow-hidden lg:gap-8">
          {/* scattered ticket controls */}
          <section className="animate-pop relative min-h-0 min-w-0 flex-1 md:overflow-y-auto md:pr-1">
            <div className="relative mx-auto grid max-w-[640px] grid-cols-2 gap-4 pb-2 sm:gap-5 lg:max-w-none lg:grid-cols-2">
              <TicketCard
                className="col-span-2 -rotate-1 sm:col-span-1"
                shape="notch-x"
                title="frame( 01 )"
              >
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
                      className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-white ${
                        state.border === id
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/10'
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
              </TicketCard>

              <TicketCard className="col-span-2 rotate-1 sm:col-span-1" shape="pill" title="cords( 02 )">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CORDS) as CordId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => push({ ...state, cord: id })}
                      className={`flex aspect-square flex-col items-center justify-center rounded-xl bg-white ${
                        state.cord === id
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/10'
                      }`}
                    >
                      <CordSwatch from={CORDS[id].from} to={CORDS[id].to} />
                    </button>
                  ))}
                </div>
              </TicketCard>

              <TicketCard className="col-span-2 -rotate-[0.8deg]" shape="notch-top" title="stickers( 03 )">
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
                          : 'bg-white text-[var(--muted)] ring-1 ring-black/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
                  {STICKERS.filter((s) => s.tab === tab).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setMode('stick')
                        placeSticker(s)
                      }}
                      className="inline-flex shrink-0 transition hover:scale-105 active:scale-95"
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
              </TicketCard>

              <TicketCard className="col-span-2 rotate-[0.6deg] sm:col-span-1" shape="soft" title="draw( 04 )">
                <div className="flex min-h-[4.5rem] items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      mode === 'draw'
                        ? 'bg-[var(--blue)] text-white'
                        : 'bg-white text-black/80 ring-1 ring-black/10'
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
                      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white ${
                        brush === size && mode === 'draw'
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/10'
                      }`}
                    >
                      <span
                        className="rounded-full bg-black"
                        style={{ width: size * 5, height: size * 5 }}
                      />
                    </button>
                  ))}
                </div>
              </TicketCard>

              <TicketCard className="col-span-2 -rotate-[0.5deg] sm:col-span-1" shape="notch-x" title="field( 05 )">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FIELDS) as FieldId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => push({ ...state, field: id })}
                      className={`overflow-hidden rounded-xl ${
                        state.field === id
                          ? 'ring-2 ring-[var(--blue)]'
                          : 'ring-1 ring-black/10'
                      }`}
                    >
                      <div className="relative h-12 bg-[#0a0a0a]">
                        {FIELDS[id].blobs.slice(0, 2).map((b) => (
                          <span
                            key={b.id}
                            className="pixel-blob absolute"
                            style={{
                              left: `${b.x}%`,
                              top: `${b.y - 20}%`,
                              width: `${b.w * 0.7}%`,
                              height: '70%',
                              backgroundColor: b.color,
                            }}
                          />
                        ))}
                      </div>
                      <div className="bg-white py-1.5 text-center text-[11px] font-medium">
                        {FIELDS[id].label}
                      </div>
                    </button>
                  ))}
                </div>
              </TicketCard>
            </div>
          </section>

          <aside className="animate-pop flex shrink-0 flex-col items-center justify-center md:w-[300px] lg:w-[320px]">
            <div className="flex w-full max-w-[300px] flex-col items-center">
              <Lanyard from={cord.from} to={cord.to} scale={1} />
              <div
                ref={badgeRef}
                className={`relative -mt-1 overflow-hidden bg-black shadow-[0_22px_50px_rgba(0,0,0,0.55)] ${borderClass}`}
                style={{ width: BADGE_W }}
              >
                <div className="relative px-3 pt-3.5 pb-1 text-center">
                  <p className="font-display text-[22px] leading-[0.88] font-bold tracking-[-0.03em] text-[var(--yellow)] uppercase">
                    COMMON
                  </p>
                  <p className="font-display text-[22px] leading-[0.88] font-bold tracking-[-0.03em] text-[var(--yellow)] uppercase">
                    GROUND
                  </p>
                  <p className="mt-1.5 font-mono text-[8px] tracking-[0.18em] text-white/45 uppercase">
                    ID · BADGE · {EVENT.year}
                  </p>
                </div>

                <div data-badge-body className="relative" style={{ height: BODY_H }}>
                  {field.blobs.map((b, i) => (
                    <div
                      key={b.id}
                      className="pointer-events-none absolute"
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.w}%`,
                        height: `${b.h}%`,
                      }}
                    >
                      <div
                        className="pixel-blob track-box relative h-full w-full"
                        style={{ backgroundColor: b.color }}
                      >
                        <span className="track-label absolute -top-3.5 left-0 whitespace-nowrap">
                          ID: {b.id} {90 + i}
                        </span>
                        {i === 1 ? <span className="crosshair absolute inset-0" /> : null}
                      </div>
                    </div>
                  ))}

                  <input
                    value={state.name}
                    onChange={(e) => onChange({ ...state, name: e.target.value })}
                    onBlur={() => push(state)}
                    placeholder="tap to write your name"
                    maxLength={22}
                    className="font-hand absolute top-3 left-1/2 z-20 w-[88%] -translate-x-1/2 bg-transparent text-center text-3xl text-[var(--yellow)] outline-none placeholder:text-white/25"
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
                          <span className="track-label absolute -top-3 left-0 whitespace-nowrap">
                            ID: {s.trackId}
                          </span>
                          <span className="track-box inline-block p-0.5">
                            <StickerFace def={def} compact />
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-end justify-between px-3 pt-1 pb-3">
                  <p className="font-display text-left text-[9px] leading-tight font-bold tracking-wide text-[var(--yellow)] uppercase">
                    {EVENT.subtitle}
                  </p>
                  <p className="font-mono text-[7px] tracking-[0.14em] text-white/40 uppercase">
                    {EVENT.date}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex w-full gap-2">
                <button
                  type="button"
                  onClick={undo}
                  className="flex-1 rounded-full bg-white py-2.5 text-sm font-semibold text-black"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex-1 rounded-full bg-white/10 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onDone}
                  className="flex-[1.35] rounded-full bg-[var(--yellow)] py-2.5 text-sm font-semibold text-black shadow-[0_5px_0_#9a8b00] transition active:translate-y-0.5 active:shadow-none"
                >
                  I&apos;m done!
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <MarqueeBar />
    </div>
  )
}

function MarqueeBar() {
  const phrase = (
    <>
      <span className="font-display px-3 text-[clamp(1.1rem,2.2vw,1.55rem)] font-medium tracking-tight text-black/70 italic">
        common ground
      </span>
      <span className="px-1 text-[clamp(1.15rem,2.4vw,1.7rem)] font-black tracking-tight text-black uppercase">
        badge maker
      </span>
      <span className="font-display px-3 text-[clamp(1.1rem,2.2vw,1.55rem)] font-medium tracking-tight text-black/70 italic">
        nexalune makeathon
      </span>
      <span className="px-1 text-[clamp(1.15rem,2.4vw,1.7rem)] font-black tracking-tight text-black uppercase">
        stickers
      </span>
    </>
  )
  return (
    <div className="relative z-20 shrink-0 overflow-hidden bg-[var(--yellow)] py-2.5">
      <div className="marquee-track">
        <div className="flex items-center whitespace-nowrap px-2">{phrase}{phrase}{phrase}{phrase}</div>
        <div className="flex items-center whitespace-nowrap px-2" aria-hidden>
          {phrase}
          {phrase}
          {phrase}
          {phrase}
        </div>
      </div>
    </div>
  )
}

function TicketCard({
  title,
  children,
  className = '',
  shape = 'soft',
}: {
  title: string
  children: ReactNode
  className?: string
  shape?: 'soft' | 'pill' | 'notch-x' | 'notch-top'
}) {
  const shapeClass =
    shape === 'pill'
      ? 'ticket-pill px-5 py-4'
      : shape === 'notch-x'
        ? 'ticket-notch-x ticket-soft px-5 py-4'
        : shape === 'notch-top'
          ? 'ticket-notch-top ticket-soft px-5 py-5'
          : 'ticket-soft px-5 py-4'

  return (
    <div className={`ticket ${shapeClass} ${className}`}>
      <p className="font-display mb-3 text-[1.35rem] leading-none font-bold tracking-[-0.02em]">
        {title}
      </p>
      <div className="hairline mb-3" />
      {children}
    </div>
  )
}

function StickerFace({ def, compact }: { def: StickerDef; compact?: boolean }) {
  const text = def.textColor ?? '#fff'
  const base = `inline-flex items-center justify-center text-center font-mono font-bold tracking-wide backdrop-blur-[2px] ${
    compact ? 'px-2 py-1 text-[8px]' : 'px-3 py-2 text-[10px]'
  }`

  if (def.shape === 'pill') {
    return (
      <span
        className={`${base} rounded-full`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'star') {
    return (
      <span
        className={`${base} flex items-center justify-center rounded-2xl ${compact ? 'h-10 min-w-10 px-1.5 text-[7px]' : 'h-11 min-w-11 px-2 text-[9px]'} leading-tight`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'cloud') {
    return (
      <span
        className={`${base} sticker-cloud ${compact ? 'min-h-8 min-w-[4.2rem]' : 'min-h-11 min-w-[5.2rem]'}`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'ticket') {
    return (
      <span
        className={`${base} rounded-md ${compact ? 'px-2.5' : 'px-3.5'}`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  return (
    <span
      className={`${base} sticker-blob ${compact ? 'min-h-8 min-w-[4.2rem]' : 'min-h-11 min-w-[5.2rem]'}`}
      style={{ background: def.color, color: text }}
    >
      {def.label}
    </span>
  )
}

export { StickerFace, BADGE_W }
