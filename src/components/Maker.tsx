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
    <div className="brand-void relative mx-auto flex h-dvh max-w-[1200px] flex-col overflow-hidden px-3 py-2 sm:px-5 sm:py-3 lg:px-6">
      <DecorCorners />

      <header className="animate-pop relative z-10 shrink-0 pb-2">
        <p className="font-mono text-[10px] tracking-[0.22em] text-[var(--yellow)] uppercase">
          {EVENT.subtitle}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--yellow)] sm:text-[1.75rem]">
            Track your badge
          </h1>
          <p className="hidden text-xs text-[var(--muted)] sm:block">
            Stickers · doodle · lock it in
          </p>
        </div>
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch lg:gap-5">
        <section className="animate-pop grid min-h-0 content-start gap-2 overflow-hidden">
          <div className="grid grid-cols-3 gap-2">
            <ControlCard title="Frame" compact>
              <div className="grid grid-cols-3 gap-1">
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
                    className={`flex h-12 flex-col items-center justify-center gap-1 rounded-md bg-black/60 ${
                      state.border === id
                        ? 'ring-1 ring-[var(--yellow)]'
                        : 'ring-1 ring-white/10'
                    }`}
                  >
                    <span
                      className={`block h-5 w-5 bg-transparent ${
                        id === 'track'
                          ? 'track-border'
                          : id === 'dashed'
                            ? 'dashed-border'
                            : 'none-border'
                      }`}
                    />
                    <span className="text-[10px] text-white/80">{label}</span>
                  </button>
                ))}
              </div>
            </ControlCard>

            <ControlCard title="Cords" compact>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(CORDS) as CordId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => push({ ...state, cord: id })}
                    className={`flex h-12 flex-col items-center justify-center rounded-md bg-black/60 ${
                      state.cord === id
                        ? 'ring-1 ring-[var(--yellow)]'
                        : 'ring-1 ring-white/10'
                    }`}
                  >
                    <CordSwatch from={CORDS[id].from} to={CORDS[id].to} />
                  </button>
                ))}
              </div>
            </ControlCard>

            <ControlCard title="Draw" compact>
              <div className="flex h-12 items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
                  className={`rounded-md px-2 py-1.5 text-[10px] font-semibold ${
                    mode === 'draw'
                      ? 'bg-[var(--yellow)] text-black'
                      : 'bg-black/60 text-white/80 ring-1 ring-white/10'
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
                    className={`flex h-9 w-9 items-center justify-center rounded-md bg-black/60 ${
                      brush === size && mode === 'draw'
                        ? 'ring-1 ring-[var(--yellow)]'
                        : 'ring-1 ring-white/10'
                    }`}
                  >
                    <span
                      className="rounded-full bg-[var(--yellow)]"
                      style={{ width: size * 4 + 2, height: size * 4 + 2 }}
                    />
                  </button>
                ))}
              </div>
            </ControlCard>
          </div>

          <ControlCard title="Stickers" compact>
            <div className="mb-1.5 flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTab(t.id)
                    setMode('stick')
                  }}
                  className={`rounded px-2 py-1 font-mono text-[9px] tracking-wide ${
                    tab === t.id
                      ? 'bg-[var(--yellow)] text-black'
                      : 'bg-black/60 text-white/60 ring-1 ring-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex max-h-[7.5rem] flex-wrap gap-1.5 overflow-y-auto pr-1">
              {STICKERS.filter((s) => s.tab === tab).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setMode('stick')
                    placeSticker(s)
                  }}
                  className="transition hover:scale-105 active:scale-95"
                >
                  <StickerFace def={s} compact />
                </button>
              ))}
            </div>
          </ControlCard>

          <ControlCard title="Blob field" compact>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(FIELDS) as FieldId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => push({ ...state, field: id })}
                  className={`overflow-hidden rounded-md ${
                    state.field === id
                      ? 'ring-1 ring-[var(--yellow)]'
                      : 'ring-1 ring-white/10'
                  }`}
                >
                  <div className="relative h-10 bg-black">
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
                  <div className="bg-[var(--bg-panel)] py-1 text-center text-[10px] font-medium text-white/80">
                    {FIELDS[id].label}
                  </div>
                </button>
              ))}
            </div>
          </ControlCard>
        </section>

        <aside className="animate-pop flex min-h-0 flex-col items-center justify-center">
          <div className="flex min-h-0 w-full max-w-[280px] flex-col items-center">
            <Lanyard from={cord.from} to={cord.to} scale={0.92} />

            <div
              ref={badgeRef}
              className={`relative -mt-1 overflow-hidden bg-black shadow-[0_16px_40px_rgba(0,0,0,0.65)] ${borderClass}`}
              style={{ width: BADGE_W }}
            >
              <div className="relative px-3 pt-3 pb-1 text-center">
                <p className="font-display text-[22px] leading-[0.88] font-extrabold tracking-[-0.03em] text-[var(--yellow)] uppercase">
                  COMMON
                </p>
                <p className="font-display text-[22px] leading-[0.88] font-extrabold tracking-[-0.03em] text-[var(--yellow)] uppercase">
                  GROUND
                </p>
                <p className="mt-1 font-mono text-[8px] tracking-[0.18em] text-white/45 uppercase">
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

              <div className="flex items-end justify-between px-3 pt-0.5 pb-2.5">
                <p className="font-display text-left text-[9px] leading-tight font-bold tracking-wide text-[var(--yellow)] uppercase">
                  {EVENT.subtitle}
                </p>
                <p className="font-mono text-[7px] tracking-[0.14em] text-white/40 uppercase">
                  {EVENT.date}
                </p>
              </div>
            </div>

            <div className="mt-2 flex w-full gap-1.5">
              <button
                type="button"
                onClick={undo}
                className="flex-1 rounded-md bg-white/5 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/15"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 rounded-md bg-white/5 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/15"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onDone}
                className="flex-[1.35] rounded-md bg-[var(--yellow)] py-2 text-xs font-semibold text-black shadow-[0_4px_0_#9a8b00] transition active:translate-y-0.5 active:shadow-none"
              >
                I&apos;m done!
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ControlCard({
  title,
  children,
  compact,
}: {
  title: string
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-lg bg-[var(--bg-panel)]/90 ring-1 ring-white/10 ${
        compact ? 'p-2' : 'p-4'
      }`}
    >
      <p
        className={`font-mono tracking-[0.18em] text-[var(--muted)] uppercase ${
          compact ? 'mb-1.5 text-[9px]' : 'mb-3 text-[10px]'
        }`}
      >
        {title}
      </p>
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
        className={`${base} sticker-star ${compact ? 'h-11 w-11 text-[7px]' : 'h-16 w-16 text-[9px]'} px-1 leading-tight`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'cloud') {
    return (
      <span
        className={`${base} sticker-cloud ${compact ? 'min-h-8 min-w-[4.2rem]' : 'min-h-12 min-w-[5.5rem]'}`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'ticket') {
    return (
      <span
        className={`${base} rounded-md ${compact ? 'px-2.5' : 'px-4'}`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  return (
    <span
      className={`${base} sticker-blob ${compact ? 'min-h-8 min-w-[4.2rem]' : 'min-h-12 min-w-[5.5rem]'}`}
      style={{ background: def.color, color: text }}
    >
      {def.label}
    </span>
  )
}

function DecorCorners() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 left-3 z-0 hidden opacity-50 lg:block"
      >
        <div className="relative h-16 w-20">
          <div
            className="pixel-blob track-box absolute inset-1"
            style={{ backgroundColor: 'rgba(57,255,182,0.3)' }}
          />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-3 bottom-4 z-0 hidden opacity-50 lg:block"
      >
        <div className="relative h-14 w-16">
          <div
            className="pixel-blob track-box absolute inset-1"
            style={{ backgroundColor: 'rgba(255,79,216,0.3)' }}
          />
          <span className="crosshair absolute inset-0" />
        </div>
      </div>
    </>
  )
}

export { StickerFace, BADGE_W }
