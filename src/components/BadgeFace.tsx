import type { ReactNode, RefObject } from 'react'
import { EVENT, type BorderId, type FootVideoId } from '../lib/badge'
import { BadgeInnerFrame } from './BadgeFrame'
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
 * Common Ground poster lockup:
 * boxed COMMON / GROUND, hairline connectors, NEXALUNE / MAKEATHON / DATE,
 * framed bottom video panel sitting above any overlay lines.
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
      className={`badge-shell badge-poster relative overflow-hidden bg-white shadow-[0_18px_40px_rgba(0,0,0,0.1)] ${className}`}
      style={{ width }}
    >
      <BadgeInnerFrame border={border} />

      {/* Typographic lockup */}
      <div className="poster-lockup relative z-10 px-4 pt-5 pb-3">
        <p className="poster-meta poster-meta-tr">MAKEATHON</p>

        <div className="poster-title-row">
          <span className="poster-box poster-box-common">COMMON</span>
          <span className="poster-rule poster-rule-h" aria-hidden />
        </div>

        <div className="poster-sub-row">
          <p className="poster-meta">NEXALUNE</p>
          <span className="poster-box poster-box-ground">GROUND</span>
        </div>

        <div className="poster-date-block">
          <p className="poster-meta">DATE</p>
          <span className="poster-box poster-box-date">{POSTER_DATE}</span>
          <span className="poster-rule poster-rule-v" aria-hidden />
        </div>

        <p className="poster-place">{EVENT.place.split('·')[0]?.trim()}</p>
      </div>

      {/* Interactive white field */}
      <div
        data-badge-body
        className="relative z-20 mx-4 overflow-hidden bg-white"
        style={{ height: bodyHeight }}
      >
        {body}
      </div>

      {/* Framed foot video — topmost over inner-frame lines */}
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
