import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  CORDS,
  EVENT,
  PATTERNS,
  STICKERS,
  TABS,
  stickerById,
  type BadgeState,
  type BorderId,
  type CordId,
  type PatternId,
  type PlacedSticker,
  type StickerDef,
  type StickerTab,
} from '../lib/badge'

const BADGE_W = 320
const BADGE_H = 460

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
    }
    push({ ...state, stickers: [...state.stickers, placed] })
  }

  const removeSticker = (uid: string) => {
    push({ ...state, stickers: state.stickers.filter((s) => s.uid !== uid) })
  }

  // drawing setup
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.width = BADGE_W
    c.height = 300
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
    ctx.strokeStyle = '#111'
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
          ? { ...s, x: Math.min(88, Math.max(4, x)), y: Math.min(88, Math.max(6, y)) }
          : s,
      ),
    })
  }

  const onStickerPointerUp = () => {
    if (!dragUid.current) return
    dragUid.current = null
    setHistory((h) => [...h.slice(-30), state])
  }

  const pattern = PATTERNS[state.pattern]
  const cord = CORDS[state.cord]
  const borderClass =
    state.border === 'wiggly'
      ? 'wiggly-border'
      : state.border === 'dashed'
        ? 'dashed-border'
        : 'none-border'

  return (
    <div className="relative mx-auto grid min-h-dvh max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10 lg:px-8 lg:py-10">
      <DecorCorners />

      <section className="animate-pop relative z-10 space-y-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--muted)] uppercase">
            {EVENT.name} · {EVENT.year}
          </p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Make your badge your own!
          </h1>
          <p className="mt-2 max-w-lg text-sm text-[var(--muted)]">
            Tap stickers onto your badge, scribble your name, swap cords &
            patterns — then hit I&apos;m done.
          </p>
        </div>

        <ControlCard title="Border">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['none', 'None'],
                ['dashed', 'Dashed'],
                ['wiggly', 'Wiggly'],
              ] as [BorderId, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => push({ ...state, border: id })}
                className={`flex h-20 flex-col items-center justify-center gap-2 rounded-xl bg-white ${
                  state.border === id ? 'ring-2 ring-[var(--blue)]' : 'ring-1 ring-black/10'
                }`}
              >
                <span
                  className={`block h-10 w-10 ${
                    id === 'wiggly'
                      ? 'wiggly-border'
                      : id === 'dashed'
                        ? 'dashed-border'
                        : 'none-border'
                  }`}
                />
                <span className="text-xs font-medium">{label}</span>
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
                className={`flex h-20 flex-col items-center justify-center gap-2 rounded-xl bg-white ${
                  state.cord === id ? 'ring-2 ring-[var(--blue)]' : 'ring-1 ring-black/10'
                }`}
              >
                <span
                  className="h-12 w-3 rounded-full"
                  style={{
                    background: `linear-gradient(180deg, ${CORDS[id].from}, ${CORDS[id].to})`,
                  }}
                />
                <span className="text-xs font-medium">{CORDS[id].label}</span>
              </button>
            ))}
          </div>
        </ControlCard>

        <ControlCard title="Draw">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                mode === 'draw'
                  ? 'bg-[var(--blue)] text-white'
                  : 'bg-white ring-1 ring-black/10'
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
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-white ${
                  brush === size && mode === 'draw'
                    ? 'ring-2 ring-[var(--blue)]'
                    : 'ring-1 ring-black/10'
                }`}
              >
                <span
                  className="rounded-full bg-black"
                  style={{
                    width: size * 6,
                    height: size * 6,
                  }}
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
                className={`rounded-lg px-2.5 py-1.5 font-mono text-[10px] tracking-wide ${
                  tab === t.id
                    ? 'bg-[var(--ink)] text-white'
                    : 'bg-white text-[var(--muted)] ring-1 ring-black/10'
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
            Tap a sticker to drop it · drag to move · double-click to peel off
          </p>
        </ControlCard>

        <ControlCard title="Background">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PATTERNS) as PatternId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => push({ ...state, pattern: id })}
                className={`overflow-hidden rounded-xl ${
                  state.pattern === id
                    ? 'ring-2 ring-[var(--blue)]'
                    : 'ring-1 ring-black/10'
                }`}
              >
                <div
                  className="checker h-14 w-full"
                  style={
                    {
                      '--a': PATTERNS[id].a,
                      '--b': PATTERNS[id].b,
                    } as CSSProperties
                  }
                />
                <div className="bg-white py-1.5 text-center text-xs font-medium">
                  {PATTERNS[id].label}
                </div>
              </button>
            ))}
          </div>
        </ControlCard>
      </section>

      <aside className="animate-pop relative z-10 lg:sticky lg:top-6">
        <div className="flex flex-col items-center">
          {/* Cord */}
          <div
            className="h-16 w-3 rounded-full"
            style={{
              background: `linear-gradient(180deg, ${cord.from}, ${cord.to})`,
            }}
          />
          <div
            className="-mt-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-white"
            style={{ boxShadow: `0 0 0 3px ${cord.from}` }}
          />

          <div
            ref={badgeRef}
            className={`relative overflow-hidden bg-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${borderClass}`}
            style={{ width: BADGE_W }}
          >
            <div className="bg-black px-4 py-3 text-center">
              <p className="font-display text-lg font-bold tracking-tight text-white">
                {EVENT.name}
              </p>
              <p className="font-mono text-[10px] tracking-[0.22em] text-white/70 uppercase">
                {EVENT.subtitle} {EVENT.year}
              </p>
            </div>

            <div
              data-badge-body
              className="relative"
              style={{ height: 300 }}
            >
              <input
                value={state.name}
                onChange={(e) => onChange({ ...state, name: e.target.value })}
                onBlur={() => push(state)}
                placeholder="tap to write your name"
                maxLength={22}
                className="font-hand absolute top-4 left-1/2 z-20 w-[85%] -translate-x-1/2 bg-transparent text-center text-4xl text-black outline-none placeholder:text-black/25"
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
                    <StickerFace def={def} />
                  </button>
                )
              })}
            </div>

            <div
              className="checker relative h-[72px]"
              style={
                {
                  '--a': pattern.a,
                  '--b': pattern.b,
                } as CSSProperties
              }
            >
              <span className="absolute right-3 bottom-3 text-2xl">✿</span>
            </div>
          </div>

          <div className="mt-5 flex w-full max-w-[320px] gap-2">
            <button
              type="button"
              onClick={undo}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold ring-1 ring-black/10"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold ring-1 ring-black/10"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onDone}
              className="flex-[1.4] rounded-xl bg-[var(--blue)] py-3 text-sm font-semibold text-white shadow-[0_8px_0_#2436b8] transition active:translate-y-1 active:shadow-none"
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
    <div className="rounded-2xl bg-[#ebe8e1]/80 p-4 ring-1 ring-black/5">
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
    'inline-flex items-center justify-center px-3 py-2 text-center font-mono text-[10px] font-bold tracking-wide shadow-[2px_3px_0_rgba(0,0,0,0.15)]'

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
        className="pointer-events-none absolute bottom-4 left-2 z-0 flex max-w-[180px] flex-wrap gap-2 opacity-90 sm:left-6"
      >
        <span className="sticker-blob bg-[var(--mint)] px-3 py-2 font-mono text-[10px] font-bold">
          Aa
        </span>
        <span className="rounded-full bg-[var(--sun)] px-3 py-2 text-sm">✿</span>
        <span className="sticker-cloud bg-[var(--pink)] px-3 py-2 font-mono text-[10px] font-bold text-white">
          MAKE
        </span>
        <span
          className="h-10 w-10"
          style={{
            background:
              'repeating-conic-gradient(#5b8cff 0% 25%, #7dffb3 0% 50%) 50% / 12px 12px',
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-2 bottom-4 z-0 flex max-w-[160px] flex-wrap justify-end gap-2 opacity-90 sm:right-6"
      >
        <span className="rounded-lg bg-[var(--coral)] px-3 py-2 font-mono text-[10px] font-bold text-white">
          ✦ PLAY
        </span>
        <span className="sticker-star flex h-14 w-14 items-center justify-center bg-[var(--sky)] text-xs font-bold text-white">
          GO
        </span>
        <span className="rounded-full bg-black px-3 py-2 font-mono text-[10px] text-white">
          11 OCT
        </span>
      </div>
    </>
  )
}

export { StickerFace, BADGE_W, BADGE_H }
