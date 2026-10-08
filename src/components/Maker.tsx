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

const BADGE_W = 368
const BODY_H = 154
const FOOT_H = 200

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
  const [stroke, setStroke] = useState<'round' | 'sketch'>('round')
  const [draggingUid, setDraggingUid] = useState<string | null>(null)
  const [peel, setPeel] = useState<{
    def: StickerDef
    x: number
    y: number
    overCard: boolean
  } | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const drawing = useRef(false)
  const drawPt = useRef<{ x: number; y: number } | null>(null)
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

  const canvasPoint = (e: ReactPointerEvent<HTMLCanvasElement>, c: HTMLCanvasElement) => {
    const rect = c.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * c.width,
      y: ((e.clientY - rect.top) / rect.height) * c.height,
    }
  }

  const sketchSegment = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    const dx = x1 - x0
    const dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const steps = Math.max(2, Math.ceil(len / 3.5))
    const amp = 2.4
    ctx.strokeStyle = '#111'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let pass = 0; pass < 3; pass++) {
      ctx.beginPath()
      ctx.lineWidth = 1.35 + pass * 0.55 + Math.random() * 0.7
      ctx.globalAlpha = 0.42 + pass * 0.12
      ctx.moveTo(x0 + (Math.random() - 0.5) * 1.2, y0 + (Math.random() - 0.5) * 1.2)
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const j = (Math.random() - 0.5) * amp * (0.7 + pass * 0.25)
        ctx.lineTo(x0 + dx * t + nx * j, y0 + dy * t + ny * j)
      }
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  const onDrawPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return
    drawing.current = true
    const c = canvasRef.current
    if (!c) return
    c.setPointerCapture(e.pointerId)
    const ctx = c.getContext('2d')
    if (!ctx) return
    const p = canvasPoint(e, c)
    drawPt.current = p
    if (stroke === 'sketch') {
      sketchSegment(ctx, p.x, p.y, p.x + 0.4, p.y + 0.4)
      return
    }
    ctx.strokeStyle = '#111'
    ctx.lineWidth = brush * 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
  }

  const onDrawPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== 'draw') return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const p = canvasPoint(e, c)
    if (stroke === 'sketch') {
      const prev = drawPt.current ?? p
      if (Math.hypot(p.x - prev.x, p.y - prev.y) < 2) return
      sketchSegment(ctx, prev.x, prev.y, p.x, p.y)
      drawPt.current = p
      return
    }
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    drawPt.current = p
  }

  const onDrawPointerUp = () => {
    if (!drawing.current) return
    drawing.current = false
    drawPt.current = null
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
      <h1 className="mt-1 text-[clamp(1.3rem,1.9vw,1.75rem)] leading-[1.12] font-medium tracking-[-0.025em] text-black">
        Get Creative with
        <br />
        Your Common Ground
        <br />
        Badge :)
      </h1>
    </>
  )

  return (
    <div
      className={`page-fig relative flex h-dvh flex-col overflow-hidden${isPeeling ? ' is-peeling-sticker' : ''}`}
    >
      <div className="relative mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col px-3 pt-5 pb-5 sm:px-5 sm:pt-6 lg:px-4">
        <header className="animate-pop mb-3 shrink-0 sm:mb-4 lg:hidden">{heading}</header>

        <div className="relative flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto no-scrollbar lg:flex-row lg:items-stretch lg:gap-10 lg:overflow-visible">
          {/* Adjustments LEFT — FigBuild 2-col grid */}
          <section className="animate-pop order-last flex min-h-0 min-w-0 flex-1 flex-col lg:order-none lg:self-stretch lg:overflow-y-auto no-scrollbar lg:pt-1 lg:pr-1 lg:pb-1 [@media(min-height:860px)]:lg:pt-3 [@media(min-height:860px)]:lg:pb-2">
            <div className="flex min-h-0 flex-1 flex-col gap-4 [@media(min-height:860px)]:gap-5">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 [@media(min-height:860px)]:gap-y-5">
                <header className="hidden lg:col-start-1 lg:row-start-1 lg:block">{heading}</header>
                  <Panel title="Draw" className="sm:col-start-2 sm:row-start-1 sm:self-end">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        aria-label="Thin brush"
                        onClick={() => {
                          setBrush(1)
                          setStroke('round')
                          setMode('draw')
                        }}
                        className={`track-box flex aspect-square items-center justify-center bg-[var(--panel)] ${
                          brush === 1 && stroke === 'round' && mode === 'draw' ? 'is-selected' : ''
                        }`}
                      >
                        <span className="rounded-full bg-black" style={{ width: 7, height: 7 }} />
                      </button>
                      <button
                        type="button"
                        aria-label="Rough sketch circle"
                        onClick={() => {
                          if (mode === 'draw' && stroke === 'sketch') {
                            setMode('stick')
                            return
                          }
                          setBrush(2)
                          setStroke('sketch')
                          setMode('draw')
                        }}
                        className={`track-box flex aspect-square items-center justify-center bg-[var(--panel)] ${
                          stroke === 'sketch' && mode === 'draw' ? 'is-selected' : ''
                        }`}
                      >
                        <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden>
                          <path
                            d="M13.74 5.4 C 14.45 5.55 15.53 6.3 16.27 6.43 C 17.01 6.57 17.65 5.81 18.19 6.21 C 18.74 6.6 19.05 8.22 19.53 8.79 C 20.02 9.36 20.57 9.09 21.1 9.61 C 21.64 10.13 22.65 11.24 22.76 11.93 C 22.87 12.63 21.88 13.02 21.75 13.77 C 21.61 14.51 21.96 15.66 21.95 16.39 C 21.94 17.12 22.18 17.64 21.71 18.15 C 21.23 18.65 19.65 18.91 19.11 19.42 C 18.57 19.94 19.01 20.84 18.47 21.23 C 17.92 21.62 16.54 21.48 15.84 21.79 C 15.14 22.09 14.94 23.12 14.27 23.05 C 13.6 22.97 12.51 21.6 11.8 21.33 C 11.09 21.05 10.71 21.62 10.02 21.4 C 9.33 21.17 8.07 20.54 7.67 19.96 C 7.27 19.39 7.95 18.61 7.62 17.94 C 7.29 17.28 5.94 16.58 5.68 15.96 C 5.42 15.35 6.09 14.99 6.05 14.24 C 6.02 13.48 5.28 12.09 5.48 11.44 C 5.67 10.79 6.76 10.95 7.22 10.35 C 7.67 9.75 7.72 8.28 8.21 7.85 C 8.69 7.41 9.5 8.13 10.14 7.75 C 10.77 7.37 11.41 5.97 12.01 5.58 C 12.61 5.19 13.03 5.26 13.74 5.4 Z"
                            fill="#111"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Medium brush"
                        onClick={() => {
                          setBrush(2)
                          setStroke('round')
                          setMode('draw')
                        }}
                        className={`track-box flex aspect-square items-center justify-center bg-[var(--panel)] ${
                          brush === 2 && stroke === 'round' && mode === 'draw' ? 'is-selected' : ''
                        }`}
                      >
                        <span className="rounded-full bg-black" style={{ width: 12, height: 12 }} />
                      </button>
                      <button
                        type="button"
                        aria-label="Thick brush"
                        onClick={() => {
                          setBrush(3)
                          setStroke('round')
                          setMode('draw')
                        }}
                        className={`track-box flex aspect-square items-center justify-center bg-[var(--panel)] ${
                          brush === 3 && stroke === 'round' && mode === 'draw' ? 'is-selected' : ''
                        }`}
                      >
                        <span className="rounded-full bg-black" style={{ width: 17, height: 17 }} />
                      </button>
                    </div>
                  </Panel>
                <div className="flex min-w-0 flex-col gap-4 sm:col-start-1 sm:row-start-2 [@media(min-height:860px)]:gap-5">
                  <Panel title="Outer frame">
                    <div className="grid grid-cols-4 gap-2">
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
                    <div className="grid grid-cols-4 gap-2">
                      {(Object.keys(CORDS) as CordId[]).map((id) => (
                        <button
                          key={id}
                          type="button"
                          aria-label={CORDS[id].label}
                          onClick={() => push({ ...state, cord: id })}
                          className={`track-box aspect-square overflow-hidden bg-[var(--panel)] p-1.5 ${
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
                    <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-2">
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

              <Panel title="Stickers" className="lg:mt-auto">
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTab(t.id)
                        setMode('stick')
                      }}
                      className={`option-btn border border-black/20 bg-white px-2 py-1 font-mono text-[10px] tracking-wide text-[var(--muted)] ${
                        tab === t.id ? 'is-selected text-black' : ''
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                  <p className="ml-auto text-right text-[11px] text-[var(--muted)]">
                    Drag onto the card · double-click to delete
                  </p>
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
          <aside className="animate-pop flex shrink-0 flex-col items-center lg:h-full lg:w-[400px] lg:justify-end xl:w-[412px]">
            <div className="relative flex w-full max-w-[380px] flex-col items-center overflow-visible">
              <Lanyard cord={state.cord} scale={1.1} className="lanyard-offscreen" />
              <BadgeFace
                badgeRef={badgeRef}
                width={BADGE_W}
                footVideo={state.footVideo}
                border={state.border}
                bodyHeight={BODY_H}
                footHeight={FOOT_H}
                className="relative z-[1]"
                body={
                  <>
                    <input
                      value={state.name}
                      onChange={(e) => onChange({ ...state, name: e.target.value })}
                      onBlur={() => push(state)}
                      placeholder="YOUR NAME"
                      maxLength={22}
                      className="poster-name-input absolute top-2 left-1/2 z-20 w-[84%] -translate-x-1/2 bg-transparent text-center text-[1.35rem] font-bold tracking-[-0.03em] text-black uppercase outline-none placeholder:font-bold placeholder:text-black/25"
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
                        large
                        dragging={draggingUid === s.uid}
                      />
                    </button>
                  )
                })}
              />

              <div className="mt-3 flex gap-2" style={{ width: BADGE_W, maxWidth: '100%' }}>
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo (Ctrl/⌘ Z)"
                  className="option-btn badge-edge-btn min-w-0 flex-1 bg-white py-2 text-[13px] font-semibold text-black disabled:pointer-events-none disabled:border-black/20 disabled:text-black/30"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="option-btn badge-edge-btn min-w-0 flex-1 bg-white py-2 text-[13px] font-semibold text-black"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onDone}
                  className="option-btn btn-done badge-edge-btn min-w-0 flex-[1.4] bg-black py-2 text-[13px] font-bold text-white"
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
}: {
  title: string
  children: ReactNode
  className?: string
  fill?: boolean
}) {
  return (
    <div className={`panel-wrap min-w-0 ${fill ? 'h-full' : ''} ${className}`}>
      <p className="panel-title">{title}</p>
      <div className={`panel ${fill ? 'flex flex-1 flex-col' : ''}`}>{children}</div>
    </div>
  )
}

export { BADGE_W }
