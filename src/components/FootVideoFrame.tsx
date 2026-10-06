import { useId } from 'react'
import type { FootVideoId } from '../lib/badge'
import { FootVideo } from './FootVideo'

/**
 * Organic foot-video frame — landscape blob with a flat top that
 * curves down on the right, and a flat bottom that scoops up on the
 * left (matches the Common Ground brand mark). viewBox 0 0 320 200.
 */
export const FOOT_FRAME_PATH =
  'M 22 10 ' +
  'H 198 ' +
  'C 228 10 255 14 275 32 ' +
  'C 292 48 308 54 312 78 ' +
  'V 162 ' +
  'C 312 182 298 190 276 192 ' +
  'H 118 ' +
  'C 88 192 62 184 46 162 ' +
  'C 32 144 18 138 12 118 ' +
  'V 42 ' +
  'C 12 22 14 10 22 10 ' +
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
      {/* Video clipped to the organic shape */}
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

      {/* Black stroke outline on top */}
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
          strokeWidth="4"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
