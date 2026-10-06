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
  FOOT_VIDEOS,
  FOOT_VIDEO_ORDER,
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
import { BadgeFace } from './BadgeFace'
import { FrameSwatch } from './BadgeFrame'
import { CordSwatch, Lanyard } from './Lanyard'
import { StickerFace } from './StickerFace'

const BADGE_W = 400
const BODY_H = 168
const FOOT_H = 218

interface MakerProps {
  state: BadgeState
  onChange: (next: BadgeState) => void
  onDone: () => void
  onBack: () => void
  badgeRef: RefObject<HTMLDivElement | null>
}

export function Maker({ state, onChange, onDone, onBack, badgeRef }: MakerProps) {
  const [tab, setTab] = useState<StickerTab>('role')
  const [mode, setMode] = useState<'stick' | 'draw'>('stick')
  const [brush, setBrush] = useState<1 | 2 | 3>(2)
  const [draggingUid, setDraggingUid] = useState<string | null>(null)
  const [, setHistory] = useState<BadgeState[]>([state])
  const drawing = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragUid = useRef<string | null>(null)
  const dragLive = useRef<BadgeState | null>(null)

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
      // Percent of the whole card — can land on lockup, body, or foot
      x: 15 + Math.random() * 70,
      y: 12 + Math.random() * 76,
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
    ctx.strokeStyle = '#111'
    ctx.lineWidth = brush * 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(
      ((e.clientX - rect.left) / rect.width) * c.width,
      ((e.clientY - rect.top) / rect.height) * c.height,
    )
  }

  const onDrawPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== 'draw') return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const rect = c.getBoundingClientRect()
    ctx.lineTo(
      ((e.clientX - rect.left) / rect.width) * c.width,
      ((e.clientY - rect.top) / rect.height) * c.height,
    )
    ctx.stroke()
  }

  const onDrawPointerUp = () => {
    if (!drawing.current) return
    drawing.current = false
    saveDrawing()
  }

  const onStickerPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, uid: string) => {
    if (mode === 'draw') return
    dragUid.current = uid
    dragLive.current = state
    setDraggingUid(uid)
    setMode('stick')
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onStickerPointerMove = (e: ReactPointerEvent<HTMLButtonElement>, uid: string) => {
    if (dragUid.current !== uid) return
    const card = badgeRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = Math.min(98, Math.max(2, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(98, Math.max(2, ((e.clientY - rect.top) / rect.height) * 100))
    const base = dragLive.current ?? state
    const next: BadgeState = {
      ...base,
      stickers: base.stickers.map((s) => (s.uid === uid ? { ...s, x, y } : s)),
    }
    dragLive.current = next
    onChange(next)
  }

  const onStickerPointerUp = () => {
    if (!dragUid.current) return
    dragUid.current = null
    setDraggingUid(null)
    if (dragLive.current) {
      push(dragLive.current)
      dragLive.current = null
    }
  }

  return (
    <div className="page-fig relative flex h-dvh flex-col overflow-hidden">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-4 pt-3 pb-4 sm:px-6 sm:pt-4">
        <header className="animate-pop mb-2 shrink-0 sm:mb-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-black/45 hover:text-black"
          >
            ← Back
          </button>
          <h1 className="mt-1.5 text-[clamp(1.6rem,3.2vw,2.35rem)] leading-[1.1] font-bold tracking-[-0.03em] text-black">
            Make your Common Ground Badge your own!
          </h1>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto lg:flex-row lg:items-start lg:gap-8 lg:overflow-hidden">
          {/* Adjustments LEFT — FigBuild 2-col grid */}
          <section className="animate-pop order-last min-h-0 min-w-0 flex-1 lg:order-none lg:overflow-y-auto lg:pr-1">
            <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 sm:gap-y-8">
              <Panel title="Outer frame">
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ['none', 'None'],
                      ['dashed', 'Dash'],
                      ['track', 'Box'],
                      ['wiggly', 'Wiggle'],
                    ] as [BorderId, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => push({ ...state, border: id })}
                      className={`track-box flex aspect-square flex-col items-center justify-center gap-1 bg-[var(--panel)] ${
                        state.border === id ? 'is-selected' : ''
                      }`}
                    >
                      <FrameSwatch border={id} />
                      <span className="font-mono text-[10px] uppercase tracking-wide">{label}</span>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Draw">
                <div className="flex min-h-[5.5rem] items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
                    className={`border border-black bg-white px-3 py-2 text-xs font-semibold text-black/80 ${
                      mode === 'draw' ? 'is-selected' : ''
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
                      className={`track-box flex h-11 w-11 items-center justify-center bg-[var(--panel)] ${
                        brush === size && mode === 'draw' ? 'is-selected' : ''
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

              <Panel title="Cords">
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CORDS) as CordId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => push({ ...state, cord: id })}
                      className={`track-box flex aspect-square flex-col items-center justify-center bg-[var(--panel)] ${
                        state.cord === id ? 'is-selected' : ''
                      }`}
                    >
                      <CordSwatch cord={id} />
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Stickers" className="sm:row-span-2">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id)
                        setMode('stick')
                      }}
                      className={`border border-black/20 bg-white px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-[var(--muted)] ${
                        tab === t.id ? 'is-selected text-black' : ''
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="sticker-sheet">
                  <div className="sticker-sheet-row">
                    {STICKERS.filter((s) => s.tab === tab).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setMode('stick')
                          placeSticker(s)
                        }}
                        className="sticker-pick inline-flex shrink-0"
                      >
                        <StickerFace def={s} large />
                      </button>
                    ))}
                  </div>
                  <span className="sticker-sheet-peel" aria-hidden />
                </div>
                <div className="hairline mt-3 pt-2">
                  <p className="text-[11px] text-[var(--muted)]">
                    Tap to paste anywhere on the card · drag to move · double-click to delete
                  </p>
                </div>
              </Panel>

              <Panel title="Foot video">
                <p className="mb-3 text-[11px] text-[var(--muted)]">
                  Plays in the grey strip at the bottom of the card
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {FOOT_VIDEO_ORDER.map((id) => {
                    const v = FOOT_VIDEOS[id]
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => push({ ...state, footVideo: id })}
                        className={`track-box text-left ${
                          state.footVideo === id ? 'is-selected' : ''
                        }`}
                      >
                        <span className="track-box-label">{v.label}</span>
                        <div className="relative h-8 overflow-hidden bg-[#d8d8d8] sm:h-9">
                          <video
                            src={`${import.meta.env.BASE_URL}foot-videos/${v.file}`}
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Panel>
            </div>
          </section>

          {/* Badge RIGHT */}
          <aside className="animate-pop flex shrink-0 flex-col items-center lg:sticky lg:top-0 lg:w-[460px] xl:w-[500px]">
            <div className="flex w-full max-w-[440px] -translate-y-3 flex-col items-center sm:-translate-y-5">
              <Lanyard cord={state.cord} scale={0.62} />
              <BadgeFace
                badgeRef={badgeRef}
                width={BADGE_W}
                footVideo={state.footVideo}
                border={state.border}
                bodyHeight={BODY_H}
                footHeight={FOOT_H}
                className="-mt-10"
                body={
                  <>
                    <input
                      value={state.name}
                      onChange={(e) => onChange({ ...state, name: e.target.value })}
                      onBlur={() => push(state)}
                      placeholder="YOUR NAME"
                      maxLength={22}
                      className="poster-name-input absolute top-2 left-1/2 z-20 w-[84%] -translate-x-1/2 bg-transparent text-center text-[1.65rem] font-extrabold tracking-[-0.03em] text-black uppercase outline-none placeholder:font-extrabold placeholder:text-black/25"
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
                  </>
                }
                overlay={state.stickers.map((s) => {
                  const def = stickerById(s.defId)
                  if (!def) return null
                  return (
                    <button
                      key={s.uid}
                      type="button"
                      className={`absolute cursor-grab touch-none select-none active:cursor-grabbing ${
                        mode === 'draw' ? 'pointer-events-none' : 'pointer-events-auto'
                      } ${draggingUid === s.uid ? 'z-50' : 'z-10'}`}
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                      }}
                      onPointerDown={(e) => onStickerPointerDown(e, s.uid)}
                      onPointerMove={(e) => onStickerPointerMove(e, s.uid)}
                      onPointerUp={onStickerPointerUp}
                      onPointerCancel={onStickerPointerUp}
                      onDoubleClick={() => removeSticker(s.uid)}
                    >
                      <StickerFace
                        def={def}
                        compact
                        large
                        dragging={draggingUid === s.uid}
                      />
                    </button>
                  )
                })}
              />

              <div className="mt-4 flex gap-2" style={{ width: BADGE_W }}>
                <button
                  type="button"
                  onClick={undo}
                  className="min-w-0 flex-1 border border-black bg-white py-2.5 text-sm font-semibold text-black"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="min-w-0 flex-1 border border-black/30 bg-white py-2.5 text-sm font-semibold text-black/60"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onDone}
                  className="cta-blue min-w-0 flex-[1.4] py-2.5 text-sm !rounded-none"
                >
                  I&apos;m done!
                </button>
              </div>
            </div>
          </aside>
        </div>
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
    <div className={`panel-wrap ${className}`}>
      <p className="panel-title">{title}</p>
      <div className="panel">{children}</div>
    </div>
  )
}

export { BADGE_W }
