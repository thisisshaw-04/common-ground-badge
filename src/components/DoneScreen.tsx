import { useState } from 'react'
import {
  POSTER_SIZES,
  STORY_OVERLAYS,
  STORY_OVERLAY_ORDER,
  posterBackground,
  visibleBadgeName,
  type BadgeState,
  type PosterFormat,
  type StoryOverlayId,
} from '../lib/badge'
import { downloadBlob, exportStoryVideo } from '../lib/exportStory'
import { StoryPoster } from './StoryPoster'

interface DoneProps {
  state: BadgeState
  onEdit: () => void
}

const DOWNLOADS: {
  overlay: StoryOverlayId
  format: PosterFormat
  label: string
}[] = [
  { overlay: 'dark', format: 'story', label: 'Download 9:16 Dark' },
  { overlay: 'light', format: 'story', label: 'Download 9:16 Light' },
  { overlay: 'dark', format: 'grid', label: 'Download 3:4 Dark' },
  { overlay: 'light', format: 'grid', label: 'Download 3:4 Light' },
]

function downloadKey(overlay: StoryOverlayId, format: PosterFormat) {
  return `${format}-${overlay}`
}

export function DoneScreen({ state, onEdit }: DoneProps) {
  const [overlay, setOverlay] = useState<StoryOverlayId>('dark')
  const [busy, setBusy] = useState<string | null>(null)

  const download = async (id: StoryOverlayId, format: PosterFormat) => {
    const selector =
      format === 'grid'
        ? `[data-grid="${id}"]`
        : `[data-story="${id}"] .done-option-frame`
    const node = document.querySelector(selector) as HTMLElement | null
    if (!node || busy) return
    const key = downloadKey(id, format)
    setBusy(key)
    try {
      const size = POSTER_SIZES[format]
      const file = await exportStoryVideo(node, {
        width: size.width,
        height: size.height,
        backgroundColor: posterBackground(id, format),
      })
      const name = (visibleBadgeName(state.name) || 'maker').replace(/\s+/g, '-')
      await downloadBlob(file.blob, `CommonGround-${name}-${id}-${format}.mp4`)
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : 'Unknown error'
      alert(`Could not export the video (${detail}). Try Chrome or Safari, then tap Download again.`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="done-stage">
      <button
        type="button"
        onClick={onEdit}
        className="done-edit panel-title text-black/55 transition-colors hover:text-black"
      >
        ← Keep editing
      </button>

      <div className="done-cluster">
        <section className="done-previews" aria-label="Story overlay">
          {STORY_OVERLAY_ORDER.map((id) => {
            const selected = overlay === id
            return (
              <div key={id} className="done-option-wrap">
                <span className="done-option-tag panel-title">
                  {STORY_OVERLAYS[id].previewLabel}
                </span>
                <button
                  type="button"
                  data-story={id}
                  onClick={() => setOverlay(id)}
                  className={`done-option ${selected ? 'is-current' : ''}`}
                  aria-pressed={selected}
                  aria-label={`${STORY_OVERLAYS[id].label} overlay`}
                >
                  <div className="done-option-frame">
                    <StoryPoster state={state} overlay={id} format="story" />
                  </div>
                </button>
              </div>
            )
          })}
        </section>

        <aside className="done-copy">
          <div className="done-copy-inner">
            <h1 className="done-title">
              Get in, makers.
              <br />
              We&apos;re going building.
            </h1>
            <p className="done-lede">Now let&apos;s make something happen!</p>
            <p className="done-follow">
              Show off your badge. Tag us with{' '}
              <span className="done-hash">#CommonGround</span> on LinkedIn or IG.
            </p>
            <div className="done-actions">
              {DOWNLOADS.map((item) => {
                const key = downloadKey(item.overlay, item.format)
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void download(item.overlay, item.format)}
                    className="done-download option-btn"
                  >
                    {busy === key ? 'Recording…' : item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="done-capture-well" aria-hidden>
        {STORY_OVERLAY_ORDER.map((id) => (
          <div key={id} data-grid={id} className="done-capture-frame">
            <StoryPoster state={state} overlay={id} format="grid" />
          </div>
        ))}
      </div>
    </div>
  )
}
