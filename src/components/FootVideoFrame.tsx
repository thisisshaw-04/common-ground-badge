import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/**
 * Organic foot-video frame traced from the brand mark:
 * flat top that curves down on the right, flat bottom that
 * scoops up on the left, soft rounded corners, thick black stroke.
 * viewBox 0 0 320 200
 */
export const FOOT_FRAME_PATH =
  'M 18 6 ' +
  'H 205 ' +
  'C 235 6 258 10 276 28 ' +
  'C 294 46 310 52 314 76 ' +
  'V 165 ' +
  'C 314 184 300 194 278 196 ' +
  'H 112 ' +
  'C 82 196 58 188 42 164 ' +
  'C 28 144 14 138 8 116 ' +
  'V 40 ' +
  'C 8 20 10 6 18 6 ' +
  'Z'

interface FootVideoFrameProps {
  id: FootVideoId
  height: number
}

export function FootVideoFrame({ id, height }: FootVideoFrameProps) {
  const uid = useId().replace(/:/g, '')
  const clipId = `foot-clip-${id}-${uid}`

  return (
    <div className="foot-frame relative w-full" style={{ height }}>
      <div className="foot-frame-media absolute inset-0">
        <svg className="absolute h-0 w-0" aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path
                d={FOOT_FRAME_PATH}
                transform="scale(0.003125, 0.005)"
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
        viewBox="0 0 320 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={FOOT_FRAME_PATH}
          fill="none"
          stroke="#111"
          strokeWidth="4.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
