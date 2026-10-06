import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/** viewBox aspect ~1.51 matches the red brand mark. */
export const FOOT_FRAME_VB = { w: 400, h: 265 } as const

/**
 * Soft brand foot frame — exact 180° point symmetry around (200, 132.5).
 * Top gently slopes into a large soft TR round (from the close-up);
 * BL is the precise rotation of that edge.
 */
export const FOOT_FRAME_PATH =
  'M 6 132.5 ' +
  'V 34 ' +
  'C 6 14 18 6 38 6 ' +
  'H 198 ' +
  'C 238 6 275 10 312 26 ' +
  'C 340 38 360 42 376 44 ' +
  'C 388 46 394 54 394 68 ' +
  'V 231 ' +
  'C 394 251 382 259 362 259 ' +
  'H 202 ' +
  'C 162 259 125 255 88 239 ' +
  'C 60 227 40 223 24 221 ' +
  'C 12 219 6 211 6 197 ' +
  'V 132.5 ' +
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
          strokeWidth="1.1"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
