import { useState } from 'react'
import {
  STORY_OVERLAYS,
  STORY_OVERLAY_ORDER,
  visibleBadgeName,
  type BadgeState,
  type StoryOverlayId,
} from '../lib/badge'
import { downloadBlob, exportStoryMp4 } from '../lib/exportStory'
import { StoryPoster } from './StoryPoster'

interface DoneProps {
  state: BadgeState
  onEdit: () => void
}

const EXPORT_W = 1080
const EXPORT_H = 1920

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
      const blob = await exportStoryMp4(node, {
        width: EXPORT_W,
        height: EXPORT_H,
        backgroundColor: id === 'dark' ? '#0b0b0b' : '#c8c8c8',
      })
      const name = (visibleBadgeName(state.name) || 'maker').replace(/\s+/g, '-')
      downloadBlob(blob, `CommonGround-${name}-${id}-story.mp4`)
    } catch (err) {
      console.error(err)
      alert('Could not export the story video — try Chrome or Safari, then again.')
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
                  ? 'Recording…'
                  : `Download ${STORY_OVERLAYS[id].label} story`}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
