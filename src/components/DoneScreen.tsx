import { useState } from 'react'
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
  const [busy, setBusy] = useState<StoryOverlayId | null>(null)

  const download = async (id: StoryOverlayId) => {
    const node = document.querySelector(
      `[data-story="${id}"] .done-option-frame`,
    ) as HTMLElement | null
    if (!node || busy) return
    setBusy(id)
    try {
      await new Promise((r) => setTimeout(r, 80))
      const restore = freezeVideos(node)
      const ratio = EXPORT_W / Math.max(1, node.clientWidth)
      const url = await toPng(node, {
        pixelRatio: ratio,
        cacheBust: true,
        backgroundColor: id === 'dark' ? '#0b0b0b' : '#c8c8c8',
      })
      restore()
      const a = document.createElement('a')
      const name = (state.name.trim() || 'maker').replace(/\s+/g, '-')
      a.download = `CommonGround-${name}-${id}-story.png`
      a.href = url
      a.click()
    } catch (err) {
      console.error(err)
      alert('Could not export — try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="done-stage">
      <button type="button" onClick={onEdit} className="done-edit">
        ← Keep editing
      </button>

      <section className="done-previews" aria-label="Story overlay">
        {STORY_OVERLAY_ORDER.map((id) => {
          const selected = overlay === id
          return (
            <button
              key={id}
              type="button"
              data-story={id}
              onClick={() => setOverlay(id)}
              className={`done-option ${selected ? 'is-current' : ''}`}
              aria-pressed={selected}
              aria-label={`${STORY_OVERLAYS[id].label} overlay`}
            >
              <span className="done-option-tag">{STORY_OVERLAYS[id].previewLabel}</span>
              <div className="done-option-frame">
                <StoryPoster state={state} overlay={id} />
              </div>
            </button>
          )
        })}
      </section>

      <aside className="done-copy">
        <div className="done-copy-inner">
          <h1 className="done-title">
            Get hyped,
            <br />
            you made it to
            <br />
            Common Ground!
          </h1>
          <p className="done-lede">
            Share your badge with <span className="done-hash">#CommonGround</span> on
            LinkedIn or IG!
          </p>
          <div className="done-actions">
            {STORY_OVERLAY_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                disabled={busy !== null}
                onClick={() => void download(id)}
                className="done-download"
              >
                {busy === id
                  ? 'Saving…'
                  : `Download ${STORY_OVERLAYS[id].label} story`}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
