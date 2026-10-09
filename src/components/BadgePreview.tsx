import { BADGE_LAYOUT, stickerById, visibleBadgeName, type BadgeState } from '../lib/badge'
import { BadgeFace } from './BadgeFace'
import { StickerFace } from './StickerFace'

/** Read-only badge matching the Maker card — name, doodle, stickers. */
export function BadgePreview({
  state,
  className = '',
}: {
  state: BadgeState
  className?: string
}) {
  const name = visibleBadgeName(state.name)
  return (
    <BadgeFace
      width={BADGE_LAYOUT.width}
      footVideo={state.footVideo}
      border={state.border}
      bodyHeight={BADGE_LAYOUT.bodyHeight}
      footHeight={BADGE_LAYOUT.footHeight}
      className={className}
      body={
        <>
          {name ? (
            <p className="poster-name-input absolute top-2 left-1/2 z-20 w-[84%] -translate-x-1/2 text-center text-black uppercase">
              {name}
            </p>
          ) : null}
          {state.drawingDataUrl ? (
            <img
              src={state.drawingDataUrl}
              alt=""
              className="badge-doodle absolute inset-0 z-10 h-full w-full"
              draggable={false}
            />
          ) : null}
        </>
      }
      overlay={state.stickers.map((s) => {
        const def = stickerById(s.defId)
        if (!def) return null
        return (
          <span
            key={s.uid}
            className="sticker-on-badge pointer-events-none absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            }}
          >
            <StickerFace def={def} large />
          </span>
        )
      })}
    />
  )
}
