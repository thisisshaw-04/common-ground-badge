import { useLayoutEffect, useRef, useState } from 'react'
import {
  BADGE_LAYOUT,
  posterOverlaySrc,
  type BadgeState,
  type PosterFormat,
  type StoryOverlayId,
} from '../lib/badge'
import { BadgePreview } from './BadgePreview'
import { Lanyard } from './Lanyard'

interface StoryPosterProps {
  state: BadgeState
  overlay: StoryOverlayId
  format?: PosterFormat
  className?: string
}

/** Scan overlay with the built badge hanging on top. */
export function StoryPoster({
  state,
  overlay,
  format = 'story',
  className = '',
}: StoryPosterProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [fitH, setFitH] = useState(520)

  useLayoutEffect(() => {
    const slot = slotRef.current
    const fit = fitRef.current
    if (!slot || !fit) return
    const apply = () => {
      setFitH(fit.offsetHeight)
      setScale(slot.clientWidth / BADGE_LAYOUT.width)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(slot)
    ro.observe(fit)
    return () => ro.disconnect()
  }, [state.cord, state.footVideo, state.border, format])

  return (
    <div
      className={`story-poster relative h-full w-full overflow-hidden ${format === 'grid' ? 'is-grid' : ''} ${className}`.trim()}
    >
      <img
        src={posterOverlaySrc(overlay, format)}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div
        ref={slotRef}
        className="story-badge-slot absolute left-1/2 -translate-x-1/2"
        style={{ height: Math.max(1, fitH * scale) }}
      >
        <div
          ref={fitRef}
          className="relative"
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: BADGE_LAYOUT.width,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <Lanyard
            cord={state.cord}
            scale={BADGE_LAYOUT.lanyardScale}
            className="lanyard-offscreen"
          />
          <BadgePreview state={state} className="relative z-[1]" />
        </div>
      </div>
    </div>
  )
}
