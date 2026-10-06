import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/** viewBox matches the foot strip aspect (~1.83:1) so curves aren't stretched. */
export const FOOT_FRAME_VB = { w: 366, h: 200 } as const

/**
 * Brand foot-video frame — exact 180° point symmetry around center.
 * Flat top/bottom, tight TL+BR rounds, long soft TR+BL chamfers.
 */
export const FOOT_FRAME_PATH =
  'M 12 100 ' +
  'V 34 ' +
  'C 12 18 16 10 32 10 ' +
  'H 242 ' +
  'C 280 10 311 26 334 52 ' +
  'C 349 68 354 74 354 77 ' +
  'V 166 ' +
  'C 354 182 350 190 334 190 ' +
  'H 124 ' +
  'C 86 190 55 174 32 148 ' +
  'C 17 132 12 126 12 123 ' +
  'V 100 ' +
  'Z'

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
}

export function FootVideoFrame({ id, height }: FootVideoFrameProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `foot-clip-${id}-${uid}`
  const { w, h } = FOOT_FRAME_VB

  return (
    <div className="foot-frame relative w-full" style={{ height }}>
      <div className="foot-frame-media absolute inset-0">
        <svg className="absolute h-0 w-0" aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path
                d={FOOT_FRAME_PATH}
                transform={`scale(${1 / w}, ${1 / h})`}
              />
            </clipPath>
          </defs>
        </svg>
        <div
          className="foot-frame-clip h-full w-full bg-[#c8c8c8]"
          style={{ clipPath: `url(#${clipId})` }}
        >
          <FootVideo id={id} className="h-full w-full object-cover" />
        </div>
      </div>

      <svg
        className="foot-frame-stroke pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={FOOT_FRAME_PATH}
          fill="none"
          stroke="#111"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
