import { useLayoutEffect, useRef, useState } from 'react'
import {
  BADGE_LAYOUT,
  storyOverlaySrc,
  type BadgeState,
  type StoryOverlayId,
} from '../lib/badge'
import { BadgePreview } from './BadgePreview'
import { Lanyard } from './Lanyard'

interface StoryPosterProps {
  state: BadgeState
  overlay: StoryOverlayId
  className?: string
}

/** 9:16 scan overlay with the built badge hanging on top. */
export function StoryPoster({ state, overlay, className = '' }: StoryPosterProps) {
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
  }, [state.cord, state.footVideo, state.border])

  return (
    <div className={`story-poster relative h-full w-full overflow-hidden ${className}`.trim()}>
      <img
        src={storyOverlaySrc(overlay)}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
      <div
        ref={slotRef}
        className="story-badge-slot absolute left-1/2 w-[72%] -translate-x-1/2"
        style={{ top: '11%', height: Math.max(1, fitH * scale) }}
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
