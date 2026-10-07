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
import { StickerRoll } from './StickerRoll'

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
  const [peel, setPeel] = useState<{
    def: StickerDef
    x: number
    y: number
    overCard: boolean
  } | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const drawing = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintedUrl = useRef<string | null | undefined>(undefined)
  const dragUid = useRef<string | null>(null)
  const dragLive = useRef<BadgeState | null>(null)
  const peelDef = useRef<StickerDef | null>(null)
  const peelPointerId = useRef<number | null>(null)
  // Live edits (typing, dragging) go straight to onChange; only push() records
  // an undo step, measured against the last committed snapshot.
  const past = useRef<BadgeState[]>([])
  const committed = useRef<BadgeState>(state)

  const push = useCallback(
    (next: BadgeState) => {
      onChange(next)
      if (JSON.stringify(next) === JSON.stringify(committed.current)) return
      past.current = [...past.current.slice(-40), committed.current]
      committed.current = next
      setCanUndo(true)
    },
    [onChange],
  )

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    committed.current = prev
    onChange(prev)
    setCanUndo(past.current.length > 0)
  }, [onChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.key.toLowerCase() !== 'z') return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      e.preventDefault()
      undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  const clearAll = () => {
    push({
      ...state,
      name: '',
      stickers: [],
      drawingDataUrl: null,
    })
  }

  const placeSticker = (def: StickerDef, x = 15 + Math.random() * 70, y = 12 + Math.random() * 76) => {
    const placed: PlacedSticker = {
      uid: `${def.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      defId: def.id,
      x: Math.min(98, Math.max(2, x)),
      y: Math.min(98, Math.max(2, y)),
      rotation: -18 + Math.random() * 36,
      trackId: String(100 + Math.floor(Math.random() * 800)).padStart(3, '0'),
    }
    push({ ...state, stickers: [...state.stickers, placed] })
  }

  const removeSticker = (uid: string) => {
    push({ ...state, stickers: state.stickers.filter((s) => s.uid !== uid) })
  }

  const cardPercentFromPoint = (clientX: number, clientY: number) => {
    const card = badgeRef.current
    if (!card) return null
    const rect = card.getBoundingClientRect()
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null
    }
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  const placeStickerRef = useRef(placeSticker)
  placeStickerRef.current = placeSticker

  const onPeelStart = (def: StickerDef, e: ReactPointerEvent<HTMLButtonElement>) => {
    setMode('stick')
    peelDef.current = def
    peelPointerId.current = e.pointerId
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* window listeners below still drive the peel */
    }

    // Attached synchronously so fast flicks can't outrun a React effect.
    const onMove = (ev: PointerEvent) => {
      if (!peelDef.current || peelPointerId.current !== ev.pointerId) return
      ev.preventDefault()
      setPeel({
        def: peelDef.current,
        x: ev.clientX,
        y: ev.clientY,
        overCard: !!cardPercentFromPoint(ev.clientX, ev.clientY),
      })
    }
    const onEnd = (ev: PointerEvent) => {
      if (peelPointerId.current !== ev.pointerId) return
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onEnd, true)
      window.removeEventListener('pointercancel', onEnd, true)
      const peeled = peelDef.current
      const over = ev.type === 'pointerup' ? cardPercentFromPoint(ev.clientX, ev.clientY) : null
      peelDef.current = null
      peelPointerId.current = null
      setPeel(null)
      if (peeled && over) placeStickerRef.current(peeled, over.x, over.y)
    }
    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onEnd, true)
    window.addEventListener('pointercancel', onEnd, true)

    setPeel({
      def,
      x: e.clientX,
      y: e.clientY,
      overCard: !!cardPercentFromPoint(e.clientX, e.clientY),
    })
  }

  const isPeeling = peel !== null

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.width = BADGE_W
    c.height = BODY_H
  }, [])

  // Repaint when the drawing changes from outside the pen (undo, clear, mount).
  useEffect(() => {
    const url = state.drawingDataUrl
    if (url === paintedUrl.current) return
    paintedUrl.current = url
    const c = canvasRef.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    if (!url) return
    const img = new Image()
    img.onload = () => {
      if (paintedUrl.current !== url) return
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = url
  }, [state.drawingDataUrl])

  const saveDrawing = () => {
    const c = canvasRef.current
    if (!c) return
    const url = c.toDataURL('image/png')
    paintedUrl.current = url
    push({ ...state, drawingDataUrl: url })
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

  const heading = (
    <>
      <button
        type="button"
        onClick={onBack}
        className="panel-title text-black/55 transition-colors hover:text-black"
      >
        ← Back
      </button>
      <h1 className="mt-1.5 text-[clamp(1.5rem,2.35vw,2.2rem)] leading-[1.1] font-medium tracking-[-0.025em] text-black">
        Get Creative with Your Common Ground Badge
      </h1>
    </>
  )

  return (
    <div
      className={`page-fig relative flex h-dvh flex-col overflow-hidden${isPeeling ? ' is-peeling-sticker' : ''}`}
    >
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col px-4 pt-3 pb-4 sm:px-6 sm:pt-4">
        <header className="animate-pop mb-2 shrink-0 sm:mb-3 lg:hidden">{heading}</header>

        <div className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto no-scrollbar lg:flex-row lg:items-start lg:gap-8 lg:overflow-hidden">
          {/* Adjustments LEFT — FigBuild 2-col grid */}
          <section className="animate-pop order-last min-h-0 min-w-0 flex-1 lg:order-none lg:self-stretch lg:overflow-y-auto no-scrollbar lg:pt-4 lg:pr-2 lg:pb-1 [@media(min-height:860px)]:lg:pt-8 [@media(min-height:860px)]:lg:pb-4">
            <div className="flex flex-col gap-5 [@media(min-height:860px)]:gap-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 [@media(min-height:860px)]:gap-y-6">
                <header className="hidden lg:col-start-1 lg:row-start-1 lg:block">{heading}</header>
                  <Panel title="Draw" className="sm:col-start-2 sm:row-start-1 sm:self-end">
                    <div className="flex min-h-[5.5rem] items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMode(mode === 'draw' ? 'stick' : 'draw')}
                        className={`option-btn border border-black bg-white px-3 py-2 text-xs font-semibold text-black/80 ${
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
                <div className="flex min-w-0 flex-col gap-5 sm:col-start-1 sm:row-start-2 [@media(min-height:860px)]:gap-6">
                  <Panel title="Outer frame">
                    <div className="grid grid-cols-4 gap-3">
                      {(
                        [
                          ['none', 'None'],
                          ['dashed', 'Dash'],
                          ['dotted', 'Dots'],
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
                  <Panel title="Cords">
                    <div className="grid grid-cols-4 gap-3">
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
                </div>
                  <Panel title="Foot video" fill className="sm:col-start-2 sm:row-start-2">
                    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3">
                      {FOOT_VIDEO_ORDER.map((id) => {
                        const v = FOOT_VIDEOS[id]
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => push({ ...state, footVideo: id })}
                            onMouseEnter={(e) => {
                              void e.currentTarget.querySelector('video')?.play().catch(() => {})
                            }}
                            onMouseLeave={(e) => {
                              const vid = e.currentTarget.querySelector('video')
                              if (!vid) return
                              vid.pause()
                              vid.currentTime = 0
                            }}
                            className={`track-box flex text-left ${
                              state.footVideo === id ? 'is-selected' : ''
                            }`}
                            aria-label={v.label}
                            title={v.label}
                          >
                            <div className="relative min-h-8 w-full flex-1 overflow-hidden bg-[#d8d8d8] sm:min-h-9">
                              <video
                                src={`${import.meta.env.BASE_URL}foot-videos/${v.file}`}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                className="absolute inset-0 h-full w-full object-cover object-center"
                              />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </Panel>
              </div>

              <Panel
                title="Stickers"
                titleAside={
                  <p className="shrink-0 text-right text-[11px] leading-[1.2] text-[var(--muted)]">
                    Drag onto the card · double-click to delete
                  </p>
                }
              >
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id)
                        setMode('stick')
                      }}
                      className={`option-btn border border-black/20 bg-white px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-[var(--muted)] ${
                        tab === t.id ? 'is-selected text-black' : ''
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <StickerRoll
                  tabKey={tab}
                  stickers={STICKERS.filter((s) => s.tab === tab)}
                  peelingId={peel?.def.id ?? null}
                  onPeelStart={onPeelStart}
                />
              </Panel>
            </div>
          </section>

          {/* Badge RIGHT */}
          <aside className="animate-pop flex shrink-0 flex-col items-center lg:sticky lg:top-0 lg:w-[460px] xl:w-[500px]">
            <div className="flex w-full max-w-[440px] flex-col items-center lg:-translate-y-2">
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
                      className={`sticker-on-badge absolute cursor-grab touch-none select-none active:cursor-grabbing ${
                        mode === 'draw' ? 'pointer-events-none' : 'pointer-events-auto'
                      } ${draggingUid === s.uid ? 'z-[120]' : 'z-[100]'}`}
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
                  disabled={!canUndo}
                  title="Undo (Ctrl/⌘ Z)"
                  className="option-btn min-w-0 flex-1 border border-black bg-white py-2.5 text-sm font-semibold text-black disabled:pointer-events-none disabled:border-black/20 disabled:text-black/30"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="option-btn min-w-0 flex-1 border border-black bg-white py-2.5 text-sm font-semibold text-black"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onDone}
                  className="option-btn btn-done min-w-0 flex-[1.4] border-2 border-black bg-black py-2.5 text-sm font-bold text-white"
                >
                  I&apos;m done!
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {peel ? (
        <div
          className={`sticker-peel-ghost ${peel.overCard ? 'is-over-card' : ''}`}
          style={{ left: peel.x, top: peel.y }}
          aria-hidden
        >
          <StickerFace def={peel.def} large />
        </div>
      ) : null}
    </div>
  )
}

function Panel({
  title,
  children,
  className = '',
  fill = false,
  titleAside,
}: {
  title: string
  children: ReactNode
  className?: string
  fill?: boolean
  titleAside?: ReactNode
}) {
  return (
    <div className={`panel-wrap min-w-0 ${fill ? 'h-full' : ''} ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="panel-title">{title}</p>
        {titleAside}
      </div>
      <div className={`panel ${fill ? 'flex flex-1 flex-col' : ''}`}>{children}</div>
    </div>
  )
}

export { BADGE_W }
