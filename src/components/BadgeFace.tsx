import type { ReactNode, RefObject } from 'react'
import { type BorderId, type FootVideoId } from '../lib/badge'
import { BadgeOuterFrame, outerShellClass } from './BadgeFrame'
import { FootVideo } from './FootVideo'

/** Poster date lockup — matches the Common Ground print system. */
export const POSTER_DATE = '11.10.26'

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

/**
 * Common Ground poster lockup flush to the badge top:
 * overlapping COMMON / GROUND frames, NEXALUNE / MAKEATHON / DATE,
 * framed bottom video panel, selectable outer frame.
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

      {/* Typographic lockup — flush to top edge */}
      <div className="poster-lockup relative z-10">
        <div className="poster-stack">
          <div className="poster-common-wrap">
            <span className="poster-box poster-box-common">COMMON</span>
            <p className="poster-meta poster-meta-nexalune">NEXALUNE</p>
          </div>

          <div className="poster-ground-wrap">
            <p className="poster-meta poster-meta-makeathon">MAKEATHON</p>
            <span className="poster-box poster-box-ground">GROUND</span>
          </div>
        </div>

        <div className="poster-date-block">
          <p className="poster-meta">DATE</p>
          <span className="poster-box poster-box-date">{POSTER_DATE}</span>
        </div>
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
