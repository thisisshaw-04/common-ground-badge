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

const BADGE_W = 320
const BODY_H = 380

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
    <div className="brand-void relative mx-auto grid min-h-dvh max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10 lg:px-8 lg:py-10">
      <DecorCorners />

      <section className="animate-pop relative z-10 space-y-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[var(--yellow)] uppercase">
            {EVENT.subtitle}
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-[var(--yellow)] sm:text-4xl">
            Track your badge
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
            Drop stickers into the frame, scribble your name, swap signal cords
            & blob fields — then lock it in.
          </p>
        </div>

        <ControlCard title="Frame">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['none', 'None'],
                ['dashed', 'Dashed'],
                ['track', 'BBox'],
              ] as [BorderId, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => push({ ...state, border: id })}
                className={`flex h-20 flex-col items-center justify-center gap-2 rounded-lg bg-black/60 ${
                  state.border === id
                    ? 'ring-1 ring-[var(--yellow)]'
                    : 'ring-1 ring-white/10'
                }`}
              >
                <span
                  className={`block h-10 w-10 bg-transparent ${
                    id === 'track'
                      ? 'track-border'
                      : id === 'dashed'
                        ? 'dashed-border'
                        : 'none-border'
                  }`}
                />
                <span className="text-xs font-medium text-white/80">{label}</span>
              </button>
            ))}
          </div>
        </ControlCard>

        <ControlCard title="Cords">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CORDS) as CordId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => push({ ...state, cord: id })}
                className={`flex h-20 flex-col items-center justify-center gap-2 rounded-lg bg-black/60 ${
                  state.cord === id
                    ? 'ring-1 ring-[var(--yellow)]'
                    : 'ring-1 ring-white/10'
                }`}
              >
                <span
                  className="h-12 w-3 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, ${CORDS[id].from}, ${CORDS[id].to})`,
                  }}
                />
                <span className="text-xs font-medium text-white/80">
                  {CORDS[id].label}
                </span>
              </button>
            ))}
          </div>
        </ControlCard>

        <ControlCard title="Draw">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                mode === 'draw'
                  ? 'bg-[var(--yellow)] text-black'
                  : 'bg-black/60 text-white/80 ring-1 ring-white/10'
              }`}
            >
              {mode === 'draw' ? 'Drawing…' : 'Start drawing'}
            </button>
            {([1, 2, 3] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setBrush(size)
                  setMode('draw')
                }}
                className={`flex h-14 w-14 items-center justify-center rounded-lg bg-black/60 ${
                  brush === size && mode === 'draw'
                    ? 'ring-1 ring-[var(--yellow)]'
                    : 'ring-1 ring-white/10'
                }`}
              >
                <span
                  className="rounded-full bg-[var(--yellow)]"
                  style={{ width: size * 6, height: size * 6 }}
                />
              </button>
            ))}
          </div>
        </ControlCard>

        <ControlCard title="Stickers">
          <div className="mb-3 flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id)
                  setMode('stick')
                }}
                className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] tracking-wide ${
                  tab === t.id
                    ? 'bg-[var(--yellow)] text-black'
                    : 'bg-black/60 text-white/60 ring-1 ring-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
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
                <StickerFace def={s} />
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            Tap to drop · drag to move · double-click to delete track
          </p>
        </ControlCard>

        <ControlCard title="Blob field">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(FIELDS) as FieldId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => push({ ...state, field: id })}
                className={`overflow-hidden rounded-lg ${
                  state.field === id
                    ? 'ring-1 ring-[var(--yellow)]'
                    : 'ring-1 ring-white/10'
                }`}
              >
                <div className="relative h-14 bg-black">
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
                <div className="bg-[var(--bg-panel)] py-1.5 text-center text-xs font-medium text-white/80">
                  {FIELDS[id].label}
                </div>
              </button>
            ))}
          </div>
        </ControlCard>
      </section>

      <aside className="animate-pop relative z-10 lg:sticky lg:top-6">
        <div className="flex flex-col items-center">
          <div
            className="h-16 w-3 rounded-full"
            style={{
              background: `linear-gradient(180deg, ${cord.from}, ${cord.to})`,
            }}
          />
          <div
            className="-mt-1 h-3.5 w-3.5 rounded-full border border-white/80 bg-black"
            style={{ boxShadow: `0 0 0 3px ${cord.from}` }}
          />

          <div
            ref={badgeRef}
            className={`relative overflow-hidden bg-black shadow-[0_20px_60px_rgba(0,0,0,0.65)] ${borderClass}`}
            style={{ width: BADGE_W }}
          >
            <div className="relative px-4 pt-5 pb-2 text-center">
              <p className="font-display text-[28px] leading-[0.9] font-extrabold tracking-[-0.03em] text-[var(--yellow)] uppercase">
                COMMON
              </p>
              <p className="font-display text-[28px] leading-[0.9] font-extrabold tracking-[-0.03em] text-[var(--yellow)] uppercase">
                GROUND
              </p>
              <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-white/50 uppercase">
                ID · BADGE · {EVENT.year}
              </p>
            </div>

            <div
              data-badge-body
              className="relative"
              style={{ height: BODY_H }}
            >
              {/* tracked translucent blobs */}
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
                    <span className="track-label absolute -top-4 left-0 whitespace-nowrap">
                      ID: {b.id} {90 + i}
                    </span>
                    {i === 1 ? (
                      <span className="crosshair absolute inset-0" />
                    ) : null}
                  </div>
                </div>
              ))}

              <input
                value={state.name}
                onChange={(e) => onChange({ ...state, name: e.target.value })}
                onBlur={() => push(state)}
                placeholder="tap to write your name"
                maxLength={22}
                className="font-hand absolute top-5 left-1/2 z-20 w-[88%] -translate-x-1/2 bg-transparent text-center text-4xl text-[var(--yellow)] outline-none placeholder:text-white/25"
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
                      <span className="track-label absolute -top-3.5 left-0 whitespace-nowrap">
                        ID: {s.trackId}
                      </span>
                      <span className="track-box inline-block p-1">
                        <StickerFace def={def} />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-end justify-between px-4 pt-1 pb-4">
              <p className="font-display text-left text-[11px] leading-tight font-bold tracking-wide text-[var(--yellow)] uppercase">
                {EVENT.subtitle}
              </p>
              <p className="font-mono text-[8px] tracking-[0.14em] text-white/40 uppercase">
                {EVENT.date}
              </p>
            </div>
          </div>

          <div className="mt-5 flex w-full max-w-[320px] gap-2">
            <button
              type="button"
              onClick={undo}
              className="flex-1 rounded-lg bg-white/5 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/15"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 rounded-lg bg-white/5 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/15"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onDone}
              className="flex-[1.4] rounded-lg bg-[var(--yellow)] py-3 text-sm font-semibold text-black shadow-[0_6px_0_#9a8b00] transition active:translate-y-1 active:shadow-none"
            >
              I&apos;m done!
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function ControlCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl bg-[var(--bg-panel)]/90 p-4 ring-1 ring-white/10">
      <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-[var(--muted)] uppercase">
        {title}
      </p>
      {children}
    </div>
  )
}

function StickerFace({ def }: { def: StickerDef }) {
  const text = def.textColor ?? '#fff'
  const base =
    'inline-flex items-center justify-center px-3 py-2 text-center font-mono text-[10px] font-bold tracking-wide backdrop-blur-[2px]'

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
        className={`${base} sticker-star h-16 w-16 px-1 text-[9px] leading-tight`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'cloud') {
    return (
      <span
        className={`${base} sticker-cloud min-h-12 min-w-[5.5rem]`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  if (def.shape === 'ticket') {
    return (
      <span
        className={`${base} rounded-md px-4`}
        style={{ background: def.color, color: text }}
      >
        {def.label}
      </span>
    )
  }

  return (
    <span
      className={`${base} sticker-blob min-h-12 min-w-[5.5rem]`}
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
        className="pointer-events-none absolute bottom-6 left-4 z-0 hidden opacity-70 sm:block"
      >
        <div className="relative h-24 w-28">
          <div
            className="pixel-blob track-box absolute inset-2"
            style={{ backgroundColor: 'rgba(57,255,182,0.35)' }}
          />
          <span className="track-label absolute top-0 left-2">ID: 077 94</span>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 bottom-8 z-0 hidden opacity-70 sm:block"
      >
        <div className="relative h-20 w-24">
          <div
            className="pixel-blob track-box absolute inset-1"
            style={{ backgroundColor: 'rgba(255,79,216,0.35)' }}
          />
          <span className="crosshair absolute inset-0" />
          <span className="track-label absolute -top-3 left-0">ID: 088 91</span>
        </div>
      </div>
    </>
  )
}

export { StickerFace, BADGE_W }
