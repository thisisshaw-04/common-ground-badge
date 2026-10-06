import type { ReactNode, RefObject } from 'react'
import { type BorderId, type FootVideoId } from '../lib/badge'
import { BadgeOuterFrame, outerShellClass } from './BadgeFrame'
import { FootVideo } from './FootVideo'

interface BadgeFaceProps {
  width: number
  footVideo: FootVideoId
  border?: BorderId
  /** White composition area (name, stickers, draw canvas). */
  body: ReactNode
  bodyHeight: number
  footHeight: number
  badgeRef?: RefObject<HTMLDivElement | null>
  className?: string
}

const LOCKUP_SRC = `${import.meta.env.BASE_URL}common-ground-lockup.png`

/**
 * Badge face with the Common Ground lockup image flush to the top,
 * interactive body, framed foot video, and selectable outer frame.
 */
export function BadgeFace({
  width,
  footVideo,
  border = 'none',
  body,
  bodyHeight,
  footHeight,
  badgeRef,
  className = '',
}: BadgeFaceProps) {
  return (
    <div
      ref={badgeRef}
      className={`badge-shell badge-poster relative bg-white shadow-[0_18px_40px_rgba(0,0,0,0.1)] ${outerShellClass(border)} ${className}`}
      style={{ width }}
    >
      <BadgeOuterFrame border={border} />

      {/* Lockup image — flush to badge top */}
      <div className="poster-lockup relative z-10">
        <img
          src={LOCKUP_SRC}
          alt="Common Ground Makeathon"
          className="poster-lockup-img"
          draggable={false}
        />
      </div>

      {/* Interactive white field */}
      <div
        data-badge-body
        className="relative z-20 mx-4 overflow-hidden bg-white"
        style={{ height: bodyHeight }}
      >
        {body}
      </div>

      {/* Framed foot video */}
      <div className="relative z-50 px-4 pt-3 pb-4">
        <div
          className="badge-foot poster-foot relative overflow-hidden border border-black bg-[#d8d8d8]"
          style={{ height: footHeight }}
        >
          <FootVideo id={footVideo} />
        </div>
      </div>
    </div>
  )
}
