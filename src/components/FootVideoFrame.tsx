import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/**
 * viewBox aspect ~1.51 matches the red brand mark silhouette.
 */
export const FOOT_FRAME_VB = { w: 400, h: 265 } as const

/**
 * Red brand foot frame — 180° point-symmetric around (200, 132.5).
 * Flat top that sweeps down early into a long TR chamfer;
 * matching BL scoop; tight TL+BR rounds. Traced from the red mark.
 */
export const FOOT_FRAME_PATH =
  'M 4 132.5 ' +
  'V 24 ' +
  'C 4 10 12 5 28 5 ' +
  'H 210 ' +
  'C 255 5 295 8 328 26 ' +
  'C 355 40 385 48 396 60 ' +
  'V 241 ' +
  'C 396 255 388 260 372 260 ' +
  'H 190 ' +
  'C 145 260 105 257 72 239 ' +
  'C 45 225 15 217 4 205 ' +
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
