import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  STORY_OVERLAYS,
  STORY_OVERLAY_ORDER,
  type BadgeState,
  type StoryOverlayId,
} from '../lib/badge'
import { StoryPoster } from './StoryPoster'

interface DoneProps {
  state: BadgeState
  onEdit: () => void
}

const EXPORT_W = 1080
const EXPORT_H = 1920

function freezeVideos(root: HTMLElement) {
  const swaps: { video: HTMLVideoElement; img: HTMLImageElement }[] = []
  root.querySelectorAll('video').forEach((video) => {
    const w = video.videoWidth || video.clientWidth
    const h = video.videoHeight || video.clientHeight
    if (!w || !h) return
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    const img = document.createElement('img')
    img.src = canvas.toDataURL('image/png')
    img.className = video.className
    img.style.cssText = video.style.cssText
    img.alt = ''
    video.replaceWith(img)
    swaps.push({ video, img })
  })
  return () => {
    for (const { video, img } of swaps) img.replaceWith(video)
  }
}

export function DoneScreen({ state, onEdit }: DoneProps) {
  const [overlay, setOverlay] = useState<StoryOverlayId>('dark')
  const [busy, setBusy] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const download = async () => {
    const node = exportRef.current
    if (!node || busy) return
    setBusy(true)
    try {
      await new Promise((r) => setTimeout(r, 120))
      const restore = freezeVideos(node)
      const url = await toPng(node, {
        width: EXPORT_W,
        height: EXPORT_H,
        pixelRatio: 1,
        cacheBust: true,
      })
      restore()
      const a = document.createElement('a')
      const name = (state.name.trim() || 'maker').replace(/\s+/g, '-')
      a.download = `CommonGround-${name}-${overlay}-story.png`
      a.href = url
      a.click()
    } catch (err) {
      console.error(err)
      alert('Could not export — try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="done-stage">
      <section className="done-previews" aria-label="Story overlay">
        {STORY_OVERLAY_ORDER.map((id) => {
          const selected = overlay === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOverlay(id)}
              className={`done-option ${selected ? 'is-current' : ''}`}
              aria-pressed={selected}
              aria-label={`${STORY_OVERLAYS[id].label} overlay`}
            >
              {selected ? (
                <span className="done-option-tag">{STORY_OVERLAYS[id].previewLabel}</span>
              ) : (
                <span className="done-option-tag is-spacer" aria-hidden>
                  {STORY_OVERLAYS[id].previewLabel}
                </span>
              )}
              <div className="done-option-frame">
                <StoryPoster state={state} overlay={id} />
              </div>
            </button>
          )
        })}
      </section>

      <aside className="done-copy">
        <div className="done-copy-inner">
          <h1 className="done-title">Your badge is ready</h1>
          <p className="done-lede">
            Lay it on a 9:16 scan — dark or light — and download a story with your
            hanging badge on top.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void download()}
            className="cta-blue done-download"
          >
            {busy ? 'Saving…' : 'Download story'}
          </button>
          <button type="button" onClick={onEdit} className="done-edit">
            ← Keep editing
          </button>
        </div>
      </aside>

      <div
        ref={exportRef}
        className="story-export"
        aria-hidden
      >
        <StoryPoster state={state} overlay={overlay} />
      </div>
    </div>
  )
}
